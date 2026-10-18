import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Exercise, ExerciseAlternative, WorkoutPlan, WorkoutSummary } from '@/types'
import { assertNoDbError } from '@/lib/errors'
import { MOVEMENT_PATTERNS, PROTOCOLS, VOLUME_TYPES, toEnumValue } from '@/lib/enums'
import { selectAllPages } from '@/lib/supabase/paging'
import { toImageUrls } from '@/lib/catalog/facets'
import { toUiMuscleGroups } from '@/lib/muscles'
import { WARMUP_PROTOCOLS, STRETCH_PROTOCOLS } from '@/lib/protocols'
import { evaluateConstraints } from '@/lib/constraints/evaluate'
import { loadConstraintRules, loadUserConstraints } from '@/lib/constraints/queries'
import { deriveAlternatives, toExerciseAlternative, type AlternativeCatalogRow } from './alternatives'

type Client = SupabaseClient<Database>

const PLAN_COLUMNS = `id, name, focus, protocol,
  workout_exercises(id, exercise_id, display_name, order_index, sets, reps, rest_secs, default_weight_kg, is_unilateral,
    is_mandatory, is_timed, duration_secs, is_assistance, volume_type, notes, alternative_exercise_ids,
    exercise:exercises(name, level, force, category, equipment, primary_muscles, secondary_muscles, images, movement_pattern, popularity))`
const ALTERNATIVE_COLUMNS = 'id, name, level, force, category, equipment, primary_muscles, movement_pattern, popularity'

interface AlternativeCatalogColumns {
  id: string
  name: string
  level: string
  force: string | null
  category: string
  equipment: string | null
  primary_muscles: string[]
  movement_pattern: string | null
  popularity: number
}

const toAlternativeCatalogRow = (row: AlternativeCatalogColumns): AlternativeCatalogRow => ({
  id: row.id,
  name: row.name,
  level: row.level,
  force: row.force,
  category: row.category,
  equipment: row.equipment,
  primaryMuscles: row.primary_muscles,
  movementPattern: row.movement_pattern === null ? null : toEnumValue(MOVEMENT_PATTERNS, row.movement_pattern, 'movement_pattern'),
  popularity: row.popularity,
})

/** Catalog exercises that train any of the given movement patterns. */
async function loadAlternativeCatalog(supabase: Client, patterns: readonly string[]): Promise<AlternativeCatalogRow[]> {
  if (patterns.length === 0) return []
  const rows = await selectAllPages(
    (from, to) => supabase.from('exercises').select(ALTERNATIVE_COLUMNS).in('movement_pattern', [...patterns]).order('id').range(from, to),
    'load alternative exercises')
  return rows.map(toAlternativeCatalogRow)
}

async function loadUserEquipment(supabase: Client, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('user_profile').select('equipment').eq('user_id', userId).maybeSingle()
  assertNoDbError(error, 'load equipment')
  return data?.equipment ?? []
}

async function loadSavedAlternatives(supabase: Client, ids: readonly string[]): Promise<Map<string, ExerciseAlternative>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase.from('exercises').select('id, name, force, category, equipment, primary_muscles').in('id', [...ids])
  assertNoDbError(error, 'load saved alternatives')
  return new Map((data ?? []).map(row => [row.id, toExerciseAlternative({ ...row, primaryMuscles: row.primary_muscles })]))
}

/** A workout plan without its warm-up and stretch blocks, which are static per protocol and attached at read time. */
export type StoredWorkoutPlan = Omit<WorkoutPlan, 'warmup' | 'stretch'>

export function withProtocolBlocks(plan: StoredWorkoutPlan): WorkoutPlan {
  return { ...plan, warmup: WARMUP_PROTOCOLS[plan.protocol], stretch: STRETCH_PROTOCOLS[plan.protocol] }
}

/** Loads one of the user's workouts as the read model the workout UI renders, or null if not theirs / missing. */
export async function loadWorkoutPlan(supabase: Client, userId: string, workoutId: string): Promise<StoredWorkoutPlan | null> {
  const [workoutResult, constraints] = await Promise.all([
    supabase.from('workouts').select(PLAN_COLUMNS)
      .eq('id', workoutId).eq('user_id', userId)
      .order('order_index', { referencedTable: 'workout_exercises' })
      .maybeSingle(),
    loadUserConstraints(supabase, userId),
  ])
  assertNoDbError(workoutResult.error, 'load workout')
  const workout = workoutResult.data
  if (!workout) return null

  const rows = workout.workout_exercises
  const constraintTypes = constraints.map(c => c.constraintType)
  const targetsWithoutAlternatives = new Map(rows.flatMap(row => (row.alternative_exercise_ids.length === 0 && row.exercise
    ? [[row.id, toAlternativeCatalogRow({ ...row.exercise, id: row.exercise_id })] as const]
    : [])))
  const patterns = Array.from(new Set(Array.from(targetsWithoutAlternatives.values()).flatMap(target => target.movementPattern ?? [])))
  const [savedAlternatives, rules, alternativeCatalog, userEquipment] = await Promise.all([
    loadSavedAlternatives(supabase, Array.from(new Set(rows.flatMap(row => row.alternative_exercise_ids)))),
    loadConstraintRules(supabase, constraintTypes),
    loadAlternativeCatalog(supabase, patterns),
    targetsWithoutAlternatives.size === 0 ? [] : loadUserEquipment(supabase, userId),
  ])
  const warningsById = evaluateConstraints(
    [...rows.map(row => row.exercise_id), ...alternativeCatalog.map(row => row.id)], constraintTypes, rules)
  const alternativesOf = (row: (typeof rows)[number]) => {
    const target = targetsWithoutAlternatives.get(row.id)
    if (target) return deriveAlternatives(target, alternativeCatalog, userEquipment, warningsById)
    return row.alternative_exercise_ids.flatMap(id => savedAlternatives.get(id) ?? [])
  }

  const exercises: Exercise[] = rows.map(row => ({
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.display_name ?? row.exercise?.name ?? row.exercise_id,
    sets: row.sets,
    reps: row.reps,
    restSecs: row.rest_secs,
    isTimed: row.is_timed,
    durationSecs: row.duration_secs ?? undefined,
    isUnilateral: row.is_unilateral,
    isMandatory: row.is_mandatory,
    defaultWeightKg: row.default_weight_kg,
    isAssistance: row.is_assistance,
    volumeType: toEnumValue(VOLUME_TYPES, row.volume_type, 'volume_type'),
    notes: row.notes,
    alternatives: alternativesOf(row),
    savedAlternativeIds: row.alternative_exercise_ids,
    muscleGroups: toUiMuscleGroups([...(row.exercise?.primary_muscles ?? []), ...(row.exercise?.secondary_muscles ?? [])]),
    warnings: warningsById.get(row.exercise_id) ?? [],
    imageUrls: toImageUrls(row.exercise?.images ?? []),
  }))

  return {
    id: workout.id,
    name: workout.name,
    focus: workout.focus,
    protocol: toEnumValue(PROTOCOLS, workout.protocol, 'protocol'),
    exercises,
  }
}

export async function loadWorkoutSummaries(supabase: Client, userId: string): Promise<WorkoutSummary[]> {
  const { data, error } = await supabase.from('workouts')
    .select('id, name, focus, protocol, workout_exercises(count)')
    .eq('user_id', userId).order('created_at')
  assertNoDbError(error, 'load workouts')
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    focus: row.focus,
    protocol: toEnumValue(PROTOCOLS, row.protocol, 'protocol'),
    exerciseCount: row.workout_exercises[0]?.count ?? 0,
  }))
}

export async function loadSchedule(supabase: Client, userId: string): Promise<Map<number, string | null>> {
  const { data, error } = await supabase.from('weekly_schedule').select('day_of_week, workout_id').eq('user_id', userId)
  assertNoDbError(error, 'load schedule')
  return new Map((data ?? []).map(row => [row.day_of_week, row.workout_id]))
}
