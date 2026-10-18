import 'server-only'
import { z } from 'zod'
import type { ServerSupabaseClient } from '@/lib/supabase/server'
import { dataCache } from '@/lib/cache'
import { assertNoDbError } from '@/lib/errors'
import { countSessionsPerMuscleGroup } from '@/lib/muscles'

const COMPLETED = 'completed'
const WORKING = 'working'

/** The date boundaries (YYYY-MM-DD) the dashboard aggregates over; part of the cache key so a new day is a new entry. */
export interface DashboardDates {
  today: string
  weekStart: string
  lastWeekStart: string
  fourWeeksAgo: string
}

const dashboardSchema = z.object({
  profileName: z.string().nullable(),
  streak: z.object({ current: z.number(), longest: z.number(), totalSessions: z.number() }),
  weekCount: z.number(),
  currentWeightKg: z.number().nullable(),
  wellnessScore: z.number().nullable(),
  sessionsPerMuscle: z.record(z.string(), z.number()),
  thisWeekVolumeKg: z.number(),
  lastWeekVolumeKg: z.number(),
  latestPR: z.object({ exerciseName: z.string(), value: z.number(), setOn: z.string() }).nullable(),
  /** Completed sessions of the last four weeks, for the time-dependent ACWR computed at render. */
  recentSessions: z.array(z.object({ date: z.string(), total_volume_kg: z.number().nullable() })),
})

export type HomeDashboard = z.infer<typeof dashboardSchema>

const sumVolume = (sessions: ReadonlyArray<{ total_volume_kg: number | null }>) =>
  sessions.reduce((sum, session) => sum + (session.total_volume_kg ?? 0), 0)

async function loadHomeDashboard(supabase: ServerSupabaseClient, userId: string, dates: DashboardDates): Promise<HomeDashboard> {
  const [
    streakResult, todaySessionResult, weekSessionsResult, latestWeightResult, lastWeekSessionsResult,
    latestPRResult, fourWeekSessionsResult, profileResult, weekSetsResult,
  ] = await Promise.all([
    supabase.from('streaks').select('current_streak, longest_streak, total_sessions').eq('user_id', userId).maybeSingle(),
    supabase.from('workout_sessions').select('wellness_score').eq('user_id', userId).eq('date', dates.today)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('total_volume_kg').eq('user_id', userId).gte('date', dates.weekStart).eq('status', COMPLETED),
    supabase.from('body_metrics').select('weight_kg').eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('total_volume_kg').eq('user_id', userId)
      .gte('date', dates.lastWeekStart).lt('date', dates.weekStart).eq('status', COMPLETED),
    supabase.from('personal_records').select('exercise_name, value, set_on').eq('user_id', userId).eq('record_type', 'max_weight')
      .order('set_on', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('date, total_volume_kg').eq('user_id', userId).gte('date', dates.fourWeeksAgo).eq('status', COMPLETED),
    supabase.from('user_profile').select('name').eq('user_id', userId).maybeSingle(),
    // Filtering on the embedded session removes a dependent round trip for this week's session ids.
    supabase.from('set_logs').select('session_id, exercise:exercises(primary_muscles), session:workout_sessions!set_logs_session_id_fkey!inner(date, status)')
      .eq('user_id', userId).eq('block_type', WORKING).gte('session.date', dates.weekStart).eq('session.status', COMPLETED),
  ])
  assertNoDbError(streakResult.error, 'load streak')
  assertNoDbError(todaySessionResult.error, 'load today\'s session')
  assertNoDbError(weekSessionsResult.error, 'load this week\'s sessions')
  assertNoDbError(latestWeightResult.error, 'load latest weight')
  assertNoDbError(lastWeekSessionsResult.error, 'load last week\'s sessions')
  assertNoDbError(latestPRResult.error, 'load latest PR')
  assertNoDbError(fourWeekSessionsResult.error, 'load recent sessions')
  assertNoDbError(profileResult.error, 'load profile')
  assertNoDbError(weekSetsResult.error, 'load this week\'s sets')

  const weekSessions = weekSessionsResult.data ?? []
  const latestPR = latestPRResult.data
  return {
    profileName: profileResult.data?.name ?? null,
    streak: {
      current: streakResult.data?.current_streak ?? 0,
      longest: streakResult.data?.longest_streak ?? 0,
      totalSessions: streakResult.data?.total_sessions ?? 0,
    },
    weekCount: weekSessions.length,
    currentWeightKg: latestWeightResult.data?.weight_kg ?? null,
    wellnessScore: todaySessionResult.data?.wellness_score ?? null,
    sessionsPerMuscle: countSessionsPerMuscleGroup((weekSetsResult.data ?? []).map(set => ({
      sessionId: set.session_id ?? '',
      primaryMuscles: set.exercise?.primary_muscles ?? [],
    }))),
    thisWeekVolumeKg: sumVolume(weekSessions),
    lastWeekVolumeKg: sumVolume(lastWeekSessionsResult.data ?? []),
    latestPR: latestPR && { exerciseName: latestPR.exercise_name, value: latestPR.value, setOn: latestPR.set_on },
    recentSessions: fourWeekSessionsResult.data ?? [],
  }
}

/** The home screen's aggregates for the user, cached until their next write. */
export function getHomeDashboard(supabase: ServerSupabaseClient, userId: string, dates: DashboardDates): Promise<HomeDashboard> {
  return dataCache.readUserView(userId, 'home', [dates.today, dates.weekStart], dashboardSchema,
    () => loadHomeDashboard(supabase, userId, dates))
}
