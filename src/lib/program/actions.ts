'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getAuthenticatedUserId, type ServerSupabaseClient } from '@/lib/supabase/server'
import { dataCache, withUserViewInvalidation } from '@/lib/cache'
import { DomainError, assertNoDbError, requireDbData, toActionResult } from '@/lib/errors'
import { parseInput } from '@/lib/validation'
import { assertWorkoutCapacity, isPaidAt, isWorkoutLimitDbError, loadSubscription, FREE_WORKOUT_LIMIT, workoutLimitError } from '@/lib/entitlements'
import type { ActionResult, DayOfWeek, WeeklyProgram, WorkoutPlan, WorkoutSummary } from '@/types'
import { loadSchedule, loadWorkoutPlan, loadWorkoutSummaries, withProtocolBlocks } from './queries'
import {
  dayOfWeekSchema, storedWorkoutPlanSchema, uuidSchema, storedWeeklyProgramSchema, workoutExerciseListSchema, workoutInputSchema,
  type StoredWeeklyProgram, type WorkoutExerciseInput, type WorkoutInput,
} from './schema'

const DAYS_OF_WEEK: readonly DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
const WORKOUT_NOT_FOUND_DB_CODE = 'P0002'
const FOREIGN_KEY_VIOLATION_DB_CODE = '23503'

function revalidateProgramViews(): void {
  revalidatePath('/', 'layout')
}

async function loadWeeklyProgram(supabase: ServerSupabaseClient, userId: string): Promise<StoredWeeklyProgram> {
  const [workouts, schedule, { paidUntil }] = await Promise.all([
    loadWorkoutSummaries(supabase, userId),
    loadSchedule(supabase, userId),
    loadSubscription(supabase, userId),
  ])
  const byId = new Map(workouts.map(workout => [workout.id, workout]))
  const scheduled = (day: DayOfWeek): WorkoutSummary | null => byId.get(schedule.get(day) ?? '') ?? null
  return {
    schedule: {
      0: scheduled(0), 1: scheduled(1), 2: scheduled(2), 3: scheduled(3), 4: scheduled(4), 5: scheduled(5), 6: scheduled(6),
    },
    workouts,
    paidUntil,
  }
}

async function readWeeklyProgram(supabase: ServerSupabaseClient, userId: string): Promise<WeeklyProgram> {
  const { paidUntil, ...program } = await dataCache.readUserView(userId, 'weekly-program', [], storedWeeklyProgramSchema,
    () => loadWeeklyProgram(supabase, userId))
  return { ...program, workoutLimit: isPaidAt(paidUntil, new Date()) ? null : FREE_WORKOUT_LIMIT }
}

async function readWorkoutPlan(supabase: ServerSupabaseClient, userId: string, workoutId: string): Promise<WorkoutPlan | null> {
  const plan = await dataCache.readUserView(userId, 'workout-plan', [workoutId], storedWorkoutPlanSchema,
    () => loadWorkoutPlan(supabase, userId, workoutId))
  return plan && withProtocolBlocks(plan)
}

export async function getWeeklyProgram(): Promise<WeeklyProgram> {
  const supabase = await createClient()
  return readWeeklyProgram(supabase, await getAuthenticatedUserId(supabase))
}

/**
 * The workout scheduled for a weekday, or null on an empty day.
 * @param dayOfWeek - the caller's local weekday (0 = Sunday); defaults to the server's, which may differ by timezone.
 */
export async function getTodaysWorkout(dayOfWeek?: DayOfWeek): Promise<WorkoutPlan | null> {
  const day = parseInput(dayOfWeekSchema, dayOfWeek ?? DAYS_OF_WEEK[new Date().getDay()])
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const workoutId = (await readWeeklyProgram(supabase, userId)).schedule[day]?.id
  return workoutId ? readWorkoutPlan(supabase, userId, workoutId) : null
}

/** One of the caller's workouts, or null when the id names no workout of theirs. */
export async function getWorkoutPlan(workoutId: string): Promise<WorkoutPlan | null> {
  const id = uuidSchema.safeParse(workoutId)
  if (!id.success) return null
  const supabase = await createClient()
  return readWorkoutPlan(supabase, await getAuthenticatedUserId(supabase), id.data)
}

export async function createWorkout(input: WorkoutInput): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const workout = parseInput(workoutInputSchema, input)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await assertWorkoutCapacity(supabase, userId, 1)
    const { id } = await withUserViewInvalidation(userId, async () => {
      const result = await supabase.from('workouts').insert({ ...workout, user_id: userId }).select('id').single()
      if (isWorkoutLimitDbError(result.error)) throw workoutLimitError()
      return requireDbData(result, 'create workout')
    })
    revalidateProgramViews()
    return { id }
  })
}

export async function updateWorkout(workoutId: string, input: WorkoutInput): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const id = parseInput(uuidSchema, workoutId)
    const workout = parseInput(workoutInputSchema, input)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const { data, error } = await withUserViewInvalidation(userId, async () =>
      supabase.from('workouts').update(workout).eq('id', id).eq('user_id', userId).select('id'))
    assertNoDbError(error, 'update workout')
    if (!data?.length) throw new DomainError('NOT_FOUND', 'Workout not found.')
    revalidateProgramViews()
  })
}

/** Deletes a workout template; schedule days pointing at it become empty and past sessions keep their name snapshot. */
export async function deleteWorkout(workoutId: string): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const id = parseInput(uuidSchema, workoutId)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const { data, error } = await withUserViewInvalidation(userId, async () =>
      supabase.from('workouts').delete().eq('id', id).eq('user_id', userId).select('id'))
    assertNoDbError(error, 'delete workout')
    if (!data?.length) throw new DomainError('NOT_FOUND', 'Workout not found.')
    revalidateProgramViews()
  })
}

/** Replaces the workout's exercise list atomically; list order becomes the workout order. */
export async function saveWorkoutExercises(workoutId: string, items: WorkoutExerciseInput[]): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const id = parseInput(uuidSchema, workoutId)
    const exercises = parseInput(workoutExerciseListSchema, items)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const { error } = await withUserViewInvalidation(userId, async () => supabase.rpc('replace_workout_exercises', {
      p_workout_id: id,
      p_items: exercises.map((exercise, index) => ({
        order_index: index,
        exercise_id: exercise.exerciseId,
        display_name: exercise.displayName ?? null,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_secs: exercise.restSecs,
        default_weight_kg: exercise.defaultWeightKg,
        is_unilateral: exercise.isUnilateral,
        is_mandatory: exercise.isMandatory,
        is_timed: exercise.isTimed,
        duration_secs: exercise.durationSecs ?? null,
        is_assistance: exercise.isAssistance,
        volume_type: exercise.volumeType,
        notes: exercise.notes,
        alternative_exercise_ids: exercise.alternativeExerciseIds,
      })),
    }))
    if (error?.code === WORKOUT_NOT_FOUND_DB_CODE) throw new DomainError('NOT_FOUND', 'Workout not found.')
    assertNoDbError(error, 'save workout exercises')
    revalidateProgramViews()
  })
}

/** Assigns a workout to a weekday, or clears the day with null. */
export async function setScheduleDay(dayOfWeek: DayOfWeek, workoutId: string | null): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const day = parseInput(dayOfWeekSchema, dayOfWeek)
    const id = workoutId === null ? null : parseInput(uuidSchema, workoutId)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const { error } = await withUserViewInvalidation(userId, async () => supabase.from('weekly_schedule')
      .upsert({ user_id: userId, day_of_week: day, workout_id: id }, { onConflict: 'user_id,day_of_week' }))
    if (error?.code === FOREIGN_KEY_VIOLATION_DB_CODE) throw new DomainError('NOT_FOUND', 'Workout not found.')
    assertNoDbError(error, 'set schedule day')
    revalidateProgramViews()
  })
}
