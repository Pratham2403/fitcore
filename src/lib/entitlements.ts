import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Entitlements, SubscriptionPlan } from '@/types'
import { DomainError, assertNoDbError } from '@/lib/errors'
import { SUBSCRIPTION_PLANS, toEnumValue } from '@/lib/enums'
import { remainingBuilds, type CoachTier } from '@/lib/coach/rateLimit'

/** Failed coach attempts don't consume a build. */
const ABANDONED = 'abandoned'

/** Mirrors the `enforce_workout_limit` trigger's free-plan cap. */
export const FREE_WORKOUT_LIMIT = 7

type Client = SupabaseClient<Database>

/** Start of the current UTC calendar month, as ISO. */
export function startOfUtcMonth(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/** The subscription fields paid status derives from; `paidUntil` is set only for an active non-free plan. */
export interface SubscriptionState {
  plan: SubscriptionPlan
  paidUntil: string | null
}

export async function loadSubscription(supabase: Client, userId: string): Promise<SubscriptionState> {
  const { data, error } = await supabase.from('subscriptions')
    .select('plan, status, current_period_end').eq('user_id', userId).maybeSingle()
  assertNoDbError(error, 'load subscription')
  const plan = toEnumValue(SUBSCRIPTION_PLANS, data?.plan ?? 'FREE', 'plan')
  const isActivePaidPlan = plan !== 'FREE' && data?.status === 'active'
  return { plan, paidUntil: isActivePaidPlan ? data.current_period_end : null }
}

/** Paid = active non-free plan within the current period (same rule as the DB trigger); evaluated at read time since it expires. */
export function isPaidAt(paidUntil: string | null, now: Date): boolean {
  return paidUntil !== null && new Date(paidUntil) > now
}

/** Resolves the user's plan and paid status now. */
export async function loadPlan(supabase: Client, userId: string, now = new Date()) {
  const subscription = await loadSubscription(supabase, userId)
  const isPaid = isPaidAt(subscription.paidUntil, now)
  const tier: CoachTier = isPaid ? 'paid' : 'free'
  return { plan: subscription.plan, isPaid, tier }
}

export async function loadEntitlements(supabase: Client, userId: string, now = new Date()): Promise<Entitlements> {
  const [{ plan, isPaid, tier }, lifetime, month] = await Promise.all([
    loadPlan(supabase, userId, now),
    supabase.from('ai_builds').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', ABANDONED),
    supabase.from('ai_builds').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', ABANDONED)
      .gte('created_at', startOfUtcMonth(now)),
  ])
  assertNoDbError(lifetime.error, 'count AI builds')
  assertNoDbError(month.error, 'count AI builds this month')
  return {
    plan,
    isPaid,
    workoutLimit: isPaid ? null : FREE_WORKOUT_LIMIT,
    aiBuildsRemaining: remainingBuilds(tier, { lifetimeBuilds: lifetime.count ?? 0, buildsThisMonth: month.count ?? 0 }),
  }
}

const WORKOUT_LIMIT_DB_ERROR = 'workout_limit_reached'

/** True when a DB error is the `enforce_workout_limit` trigger firing. */
export function isWorkoutLimitDbError(error: { message: string } | null): boolean {
  return error?.message === WORKOUT_LIMIT_DB_ERROR
}

/**
 * App-level mirror of the DB cap so the user gets a friendly error before any write.
 * @throws DomainError('WORKOUT_LIMIT_REACHED') if adding `additionalWorkouts` would exceed the free cap.
 */
export async function assertWorkoutCapacity(supabase: Client, userId: string, additionalWorkouts: number): Promise<void> {
  const { workoutLimit, workoutCount } = await loadWorkoutUsage(supabase, userId)
  if (workoutLimit !== null && workoutCount + additionalWorkouts > workoutLimit) throw workoutLimitError()
}

/** The user's workout cap (null when unlimited) and how many workouts they have now. */
export async function loadWorkoutUsage(supabase: Client, userId: string): Promise<{ workoutLimit: number | null; workoutCount: number }> {
  const [{ isPaid }, { count, error }] = await Promise.all([
    loadPlan(supabase, userId),
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  assertNoDbError(error, 'count workouts')
  return { workoutLimit: isPaid ? null : FREE_WORKOUT_LIMIT, workoutCount: count ?? 0 }
}

export function workoutLimitError(): DomainError {
  return new DomainError('WORKOUT_LIMIT_REACHED', `The free plan includes up to ${FREE_WORKOUT_LIMIT} workouts.`)
}
