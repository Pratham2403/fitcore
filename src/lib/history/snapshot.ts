import 'server-only'
import { z } from 'zod'
import type { ServerSupabaseClient } from '@/lib/supabase/server'
import { dataCache } from '@/lib/cache'
import { assertNoDbError } from '@/lib/errors'
import { PROTOCOLS, RECORD_TYPES, toEnumValue } from '@/lib/enums'
import { PR_GROUPS, toPrGroup } from '@/lib/muscles'
import { detectImbalances } from '@/lib/analytics/imbalance'
import { buildCalisthenicsSeries } from '@/lib/analytics/calisthenics'

const WORKING = 'working'
const SESSION_COLUMNS = 'id, date, day_type, workout_name, status, duration_min, total_volume_kg, wellness_score, post_mood_workout, post_mood_energy, workout:workouts(protocol)'

const historySchema = z.object({
  sessions: z.array(z.object({
    id: z.string(),
    date: z.string(),
    day_type: z.string().nullable(),
    workout_name: z.string().nullable(),
    protocol: z.enum(PROTOCOLS).nullable(),
    status: z.string().nullable(),
    duration_min: z.number().nullable(),
    total_volume_kg: z.number().nullable(),
    wellness_score: z.number().nullable(),
    post_mood_workout: z.number().nullable(),
    post_mood_energy: z.number().nullable(),
  })),
  prs: z.array(z.object({
    id: z.string(),
    exercise_name: z.string(),
    record_type: z.enum(RECORD_TYPES),
    value: z.number(),
    set_on: z.string(),
    group: z.enum(PR_GROUPS),
  })),
  /** Assisted exercises (weight should trend down), as chart series. */
  calisthenicsSeries: z.array(z.object({ key: z.string(), label: z.string() })),
  /** One point per session date (ISO), keyed by series. */
  calisthenicsPoints: z.array(z.object({ date: z.string() }).catchall(z.union([z.number(), z.string()]))),
  imbalances: z.array(z.object({
    exerciseName: z.string(),
    leftAvg: z.number(),
    rightAvg: z.number(),
    asymmetryPct: z.number(),
    dominantSide: z.enum(['left', 'right']),
  })),
})

export type HistorySnapshot = z.infer<typeof historySchema>

async function loadHistorySnapshot(supabase: ServerSupabaseClient, userId: string, startDate: string): Promise<HistorySnapshot> {
  const [sessionsResult, prsResult, assistedResult, unilateralResult] = await Promise.all([
    supabase.from('workout_sessions').select(SESSION_COLUMNS).eq('user_id', userId).gte('date', startDate).order('date', { ascending: false }),
    supabase.from('personal_records').select('id, exercise_id, exercise_name, record_type, value, set_on, exercise:exercises(primary_muscles, category)')
      .eq('user_id', userId).order('set_on', { ascending: false }),
    supabase.from('workout_exercises').select('exercise_id, display_name, exercise:exercises(name)').eq('user_id', userId).eq('is_assistance', true),
    supabase.from('set_logs').select('exercise_id, exercise_name, side, weight_kg, session:workout_sessions!set_logs_session_id_fkey!inner(date)')
      .eq('user_id', userId).eq('block_type', WORKING).not('side', 'is', null).gte('session.date', startDate),
  ])
  assertNoDbError(sessionsResult.error, 'load sessions')
  assertNoDbError(prsResult.error, 'load personal records')
  assertNoDbError(assistedResult.error, 'load assisted exercises')
  assertNoDbError(unilateralResult.error, 'load unilateral sets')

  const sessions = (sessionsResult.data ?? []).map(({ workout, ...session }) => ({
    ...session,
    protocol: workout ? toEnumValue(PROTOCOLS, workout.protocol, 'protocol') : null,
  }))
  const assistedNames = new Map((assistedResult.data ?? []).map(row => [row.exercise_id, row.display_name ?? row.exercise?.name ?? row.exercise_id]))
  const prs = (prsResult.data ?? []).map(({ exercise, exercise_id: exerciseId, ...pr }) => ({
    ...pr,
    record_type: toEnumValue(RECORD_TYPES, pr.record_type, 'record_type'),
    group: toPrGroup({
      primaryMuscles: exercise?.primary_muscles ?? [],
      category: exercise?.category ?? null,
      isAssistance: exerciseId !== null && assistedNames.has(exerciseId),
    }),
  }))

  const sessionIds = sessions.map(session => session.id)
  const calisthenicsResult = sessionIds.length === 0 || assistedNames.size === 0
    ? { data: [], error: null }
    : await supabase.from('set_logs').select('session_id, exercise_id, weight_kg')
      .eq('user_id', userId).in('session_id', sessionIds).eq('block_type', WORKING).in('exercise_id', Array.from(assistedNames.keys()))
  assertNoDbError(calisthenicsResult.error, 'load calisthenics sets')

  return {
    sessions,
    prs,
    calisthenicsSeries: Array.from(assistedNames, ([key, label]) => ({ key, label })),
    calisthenicsPoints: buildCalisthenicsSeries(
      (calisthenicsResult.data ?? []).map(set => ({ sessionId: set.session_id ?? '', seriesKey: set.exercise_id ?? '', weightKg: set.weight_kg })),
      Object.fromEntries(sessions.map(session => [session.id, session.date])),
    ),
    imbalances: detectImbalances(unilateralResult.data ?? []),
  }
}

/** The history screen's data since `startDate` (YYYY-MM-DD), cached until the user's next write. */
export function getHistorySnapshot(supabase: ServerSupabaseClient, userId: string, startDate: string): Promise<HistorySnapshot> {
  return dataCache.readUserView(userId, 'history', [startDate], historySchema, () => loadHistorySnapshot(supabase, userId, startDate))
}
