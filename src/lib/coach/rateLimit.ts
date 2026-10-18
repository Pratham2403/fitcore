export type CoachTier = 'anonymous' | 'free' | 'paid'

interface TierLimits {
  /** Builds ever allowed; null = governed by the monthly limit instead. */
  lifetimeBuilds: number | null
  buildsPerMonth: number | null
  buildsPerDay: number | null
  /** LLM attempts per day (drafts + revisions); null = unlimited. */
  attemptsPerDay: number | null
  /** Turns per build, counting the initial draft as turn 1. */
  turnsPerBuild: number
}

export const COACH_LIMITS: Record<CoachTier, TierLimits> = {
  anonymous: { lifetimeBuilds: 1, buildsPerMonth: null, buildsPerDay: null, attemptsPerDay: 3, turnsPerBuild: 3 },
  free: { lifetimeBuilds: 1, buildsPerMonth: null, buildsPerDay: null, attemptsPerDay: null, turnsPerBuild: 3 },
  paid: { lifetimeBuilds: null, buildsPerMonth: 4, buildsPerDay: 2, attemptsPerDay: null, turnsPerBuild: 8 },
}

/** Minimum gap between LLM calls from one requester, all tiers; enforced atomically by the ai_call_gate slot. */
export const COACH_COOLDOWN_SECS = 30

export interface CoachUsageCounts {
  lifetimeBuilds: number
  buildsThisMonth: number
  buildsToday: number
  attemptsToday: number
}

export type CoachRequest = { kind: 'new_build' } | { kind: 'revision'; turnCount: number }

export type RateLimitDecision = { allowed: true } | { allowed: false; message: string }

const isAtLimit = (count: number, limit: number | null) => limit !== null && count >= limit

/** Pure count-based rate-limit decision for one coach LLM request; evaluated before any model call. */
export function decideRateLimit(tier: CoachTier, request: CoachRequest, counts: CoachUsageCounts): RateLimitDecision {
  const limits = COACH_LIMITS[tier]
  if (isAtLimit(counts.attemptsToday, limits.attemptsPerDay)) {
    return { allowed: false, message: 'Daily AI Coach limit reached — try again tomorrow.' }
  }
  if (request.kind === 'revision') {
    return request.turnCount >= limits.turnsPerBuild
      ? { allowed: false, message: 'No revisions left for this plan.' }
      : { allowed: true }
  }
  if (isAtLimit(counts.lifetimeBuilds, limits.lifetimeBuilds)) {
    return { allowed: false, message: 'You have used your free AI Coach build. Upgrade for more.' }
  }
  if (isAtLimit(counts.buildsThisMonth, limits.buildsPerMonth)) {
    return { allowed: false, message: 'Monthly AI Coach build limit reached.' }
  }
  if (isAtLimit(counts.buildsToday, limits.buildsPerDay)) {
    return { allowed: false, message: 'Daily AI Coach build limit reached — try again tomorrow.' }
  }
  return { allowed: true }
}

/** Decision for the cooldown slot: `retryAfterSecs` is 0 when the slot was acquired. */
export function decideCooldown(retryAfterSecs: number): RateLimitDecision {
  return retryAfterSecs === 0
    ? { allowed: true }
    : { allowed: false, message: `Give it ${retryAfterSecs}s before the next request.` }
}

/** Builds the requester can still start under their tier's build limits. */
export function remainingBuilds(tier: CoachTier, counts: Pick<CoachUsageCounts, 'lifetimeBuilds' | 'buildsThisMonth'>): number {
  const limits = COACH_LIMITS[tier]
  if (limits.lifetimeBuilds !== null) return Math.max(0, limits.lifetimeBuilds - counts.lifetimeBuilds)
  return Math.max(0, (limits.buildsPerMonth ?? 0) - counts.buildsThisMonth)
}
