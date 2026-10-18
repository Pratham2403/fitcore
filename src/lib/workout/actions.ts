'use server'

import type { z } from 'zod'
import { createClient, getAuthenticatedUserId, type ServerSupabaseClient } from '@/lib/supabase/server'
import { DomainError, assertNoDbError, requireDbData } from '@/lib/errors'
import { withUserViewInvalidation } from '@/lib/cache'
import { clientLocalDateSchema, parseInput } from '@/lib/validation'
import { calculateTotalVolume } from '@/lib/workout/volume'
import { selectRecordCandidate, type PersonalRecordCandidate } from '@/lib/workout/personalRecords'
import { uuidSchema } from '@/lib/program/schema'
import { BLOCK_TYPES, toEnumValue } from '@/lib/enums'
import type { ReadinessCheckIn, SetLog } from '@/types'
import type { Tables } from '@/types/database'
import {
  finalizeSessionSchema, readinessSchema, setLogInputSchema, type FinalizeSessionInput, type SetLogInput,
} from './schema'

type ParsedSetLog = z.output<typeof setLogInputSchema>
type Readiness = z.output<typeof readinessSchema>

const READINESS_FACTORS = 4
const MS_PER_MINUTE = 60000

function wellnessScore(readiness: Readiness): number {
  return (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / READINESS_FACTORS
}

function toSetLog(row: Tables<'set_logs'>): SetLog {
  return {
    id: row.id,
    session_id: row.session_id ?? '',
    exercise_name: row.exercise_name,
    exercise_id: row.exercise_id,
    block_type: toEnumValue(BLOCK_TYPES, row.block_type, 'block_type'),
    set_number: row.set_number,
    reps: row.reps ?? undefined,
    weight_kg: row.weight_kg ?? undefined,
    is_timed: row.is_timed ?? false,
    duration_secs: row.duration_secs ?? undefined,
    rpe: row.rpe === 1 || row.rpe === 2 || row.rpe === 3 ? row.rpe : undefined,
    is_pr: row.is_pr ?? false,
    side: row.side === 'left' || row.side === 'right' ? row.side : null,
    logged_at: row.logged_at ?? '',
  }
}

/**
 * @returns the session's local date.
 * @throws DomainError('NOT_FOUND') unless the session belongs to the user.
 */
async function loadOwnSessionDate(supabase: ServerSupabaseClient, userId: string, sessionId: string): Promise<string> {
  const { data, error } = await supabase.from('workout_sessions').select('date').eq('id', sessionId).eq('user_id', userId).maybeSingle()
  assertNoDbError(error, 'load session')
  if (!data) throw new DomainError('NOT_FOUND', 'Session not found.')
  return data.date
}

/**
 * Records a PR when the value beats the stored best. PRs are keyed by catalog exercise id; a legacy
 * row for the same name without an id is adopted so history stays continuous.
 */
async function recordIfPersonalBest(
  supabase: ServerSupabaseClient, userId: string, session: { id: string; date: string }, log: ParsedSetLog,
  candidate: PersonalRecordCandidate,
): Promise<boolean> {
  const recordsOfType = () => supabase.from('personal_records').select('id, value')
    .eq('user_id', userId).eq('record_type', candidate.recordType)
  const byId = await recordsOfType().eq('exercise_id', log.exercise_id).maybeSingle()
  assertNoDbError(byId.error, 'load personal record')
  const legacy = byId.data ? null : await recordsOfType().is('exercise_id', null).eq('exercise_name', log.exercise_name).maybeSingle()
  assertNoDbError(legacy?.error ?? null, 'load legacy personal record')
  const existing = byId.data ?? legacy?.data ?? null
  if (existing && candidate.value <= existing.value) return false

  const record = {
    user_id: userId, exercise_id: log.exercise_id, exercise_name: log.exercise_name,
    record_type: candidate.recordType, value: candidate.value, set_on: session.date, session_id: session.id,
  }
  const { error: writeError } = existing
    ? await supabase.from('personal_records').update(record).eq('id', existing.id)
    : await supabase.from('personal_records').insert(record)
  assertNoDbError(writeError, 'save personal record')
  return true
}

/**
 * Starts a session for one of the user's workouts, snapshotting its name.
 * @param localDate - the caller's local date (YYYY-MM-DD), which the session and its PRs and streak are dated by.
 * @returns the session id.
 */
export async function startWorkoutSession(workoutId: string, readiness: ReadinessCheckIn | null, localDate: string): Promise<string> {
  const id = parseInput(uuidSchema, workoutId)
  const checkIn = readiness === null ? null : parseInput(readinessSchema, readiness)
  const date = parseInput(clientLocalDateSchema, localDate)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const { data: workout, error } = await supabase.from('workouts').select('name').eq('id', id).eq('user_id', userId).maybeSingle()
  assertNoDbError(error, 'load workout')
  if (!workout) throw new DomainError('NOT_FOUND', 'Workout not found.')

  const session = requireDbData(await withUserViewInvalidation(userId, async () => supabase.from('workout_sessions').insert({
    user_id: userId,
    date,
    workout_id: id,
    workout_name: workout.name,
    status: 'in_progress',
    ...(checkIn && {
      readiness_sleep: checkIn.sleep,
      readiness_energy: checkIn.energy,
      readiness_soreness: checkIn.soreness,
      readiness_protein: checkIn.protein,
      wellness_score: wellnessScore(checkIn),
    }),
  }).select('id').single()), 'start session')
  return session.id
}

/** Logs one set and detects PRs. */
export async function logSet(log: SetLogInput, sessionId: string): Promise<{ setId: string; isPR: boolean }> {
  const entry = parseInput(setLogInputSchema, log)
  const id = parseInput(uuidSchema, sessionId)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const session = { id, date: await loadOwnSessionDate(supabase, userId, id) }
  return withUserViewInvalidation(userId, () => insertSetAndDetectPR(supabase, userId, session, entry))
}

async function insertSetAndDetectPR(
  supabase: ServerSupabaseClient, userId: string, session: { id: string; date: string }, entry: ParsedSetLog,
): Promise<{ setId: string; isPR: boolean }> {
  const { volume_type: volumeType, ...setRow } = entry
  const { id: setId } = requireDbData(await supabase.from('set_logs')
    .insert({ ...setRow, side: setRow.side ?? null, session_id: session.id, user_id: userId, is_pr: false })
    .select('id').single(), 'log set')
  if (entry.block_type !== 'working') return { setId, isPR: false }

  const candidate = selectRecordCandidate(volumeType, entry)
  const isPR = candidate !== null && await recordIfPersonalBest(supabase, userId, session, entry, candidate)
  if (isPR) {
    const { error } = await supabase.from('set_logs').update({ is_pr: true }).eq('id', setId)
    assertNoDbError(error, 'flag PR set')
  }
  return { setId, isPR }
}

/** Completes a session; volume is computed from the stored working sets. @returns the updated streak. */
export async function finalizeSession(sessionId: string, input: FinalizeSessionInput): Promise<number> {
  const id = parseInput(uuidSchema, sessionId)
  const { readiness, startTime, workoutMood, energyMood } = parseInput(finalizeSessionSchema, input)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)

  const sets = await fetchSessionSets(id)
  const { error } = await withUserViewInvalidation(userId, async () => supabase.from('workout_sessions').update({
    status: 'completed',
    duration_min: Math.round((Date.now() - startTime) / MS_PER_MINUTE),
    total_volume_kg: calculateTotalVolume(sets.filter(set => set.block_type === 'working')),
    wellness_score: readiness && wellnessScore(readiness),
    post_mood_workout: workoutMood,
    post_mood_energy: energyMood,
    completed_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', userId))
  assertNoDbError(error, 'complete session')

  // The DB trigger on workout_sessions updates streaks atomically on completion.
  const { data: streak, error: streakError } = await supabase.from('streaks').select('current_streak').eq('user_id', userId).maybeSingle()
  assertNoDbError(streakError, 'load streak')
  return streak?.current_streak ?? 0
}

/** Deletes a session with its sets and re-derives the personal records those sets could have held. */
export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  const id = parseInput(uuidSchema, sessionId)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const { error } = await withUserViewInvalidation(userId, async () =>
    supabase.rpc('delete_workout_session', { p_session_id: id }))
  assertNoDbError(error, 'delete session')
}

export async function fetchSessionSets(sessionId: string): Promise<SetLog[]> {
  const id = parseInput(uuidSchema, sessionId)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  const { data, error } = await supabase.from('set_logs').select('*').eq('session_id', id).eq('user_id', userId)
  assertNoDbError(error, 'load session sets')
  return (data ?? []).map(toSetLog)
}
