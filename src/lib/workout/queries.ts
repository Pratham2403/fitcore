'use server'

import { createClient, getAuthenticatedUserId, type ServerSupabaseClient } from '@/lib/supabase/server'
import { dataCache } from '@/lib/cache'
import { assertNoDbError } from '@/lib/errors'
import { parseInput } from '@/lib/validation'
import { uuidSchema } from '@/lib/program/schema'
import type { LastSessionData } from '@/types'
import { lastSessionByExerciseSchema } from './schema'
import { summarizeLastSession, type ExerciseIdentity } from './lastSession'

const RECENT_SESSION_LIMIT = 10
const AMRAP = 'AMRAP'

/**
 * Last-session data for every exercise in the workout, keyed by catalog exercise id.
 * History is matched by exercise id, falling back to the name for legacy sets logged without one.
 */
export async function getLastSessionData(workoutId: string): Promise<Record<string, LastSessionData | null>> {
  const id = parseInput(uuidSchema, workoutId)
  const supabase = await createClient()
  const userId = await getAuthenticatedUserId(supabase)
  return dataCache.readUserView(userId, 'last-session', [id], lastSessionByExerciseSchema, () => loadLastSessionData(supabase, userId, id))
}

async function loadLastSessionData(supabase: ServerSupabaseClient, userId: string, id: string): Promise<Record<string, LastSessionData | null>> {
  const [exercisesResult, sessionsResult] = await Promise.all([
    supabase.from('workout_exercises').select('exercise_id, display_name, reps, exercise:exercises(name)')
      .eq('workout_id', id).eq('user_id', userId),
    supabase.from('workout_sessions').select('id')
      .eq('user_id', userId).eq('status', 'completed').order('date', { ascending: false }).limit(RECENT_SESSION_LIMIT),
  ])
  assertNoDbError(exercisesResult.error, 'load workout exercises')
  assertNoDbError(sessionsResult.error, 'load recent sessions')

  const identities: ExerciseIdentity[] = (exercisesResult.data ?? []).map(row => ({
    exerciseId: row.exercise_id,
    names: [row.display_name, row.exercise?.name].flatMap(name => name ?? []),
    isAmrap: row.reps === AMRAP,
  }))
  const sessionIds = (sessionsResult.data ?? []).map(session => session.id)
  if (sessionIds.length === 0) return Object.fromEntries(identities.map(identity => [identity.exerciseId, null]))

  const { data: sets, error } = await supabase.from('set_logs')
    .select('session_id, exercise_id, exercise_name, set_number, reps, weight_kg')
    .eq('user_id', userId).eq('block_type', 'working').in('session_id', sessionIds)
    .order('set_number')
  assertNoDbError(error, 'load recent sets')
  const history = (sets ?? []).map(set => ({
    sessionId: set.session_id ?? '',
    exerciseId: set.exercise_id,
    exerciseName: set.exercise_name,
    setNumber: set.set_number,
    reps: set.reps,
    weightKg: set.weight_kg,
  }))

  return Object.fromEntries(identities.map(identity => [identity.exerciseId, summarizeLastSession(identity, sessionIds, history)]))
}
