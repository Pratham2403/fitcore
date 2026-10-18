import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { assertNoDbError, requireDbData } from '@/lib/errors'
import { startOfUtcMonth } from '@/lib/entitlements'
import type { LLMResponse } from '@/lib/llm/types'
import type { CoachStep, ModelClass } from './models'
import { COACH_COOLDOWN_SECS, type CoachUsageCounts } from './rateLimit'

type AdminClient = SupabaseClient<Database>

/** Who is calling the coach: a signed-in user, or an anonymous visitor identified by fingerprint. */
export type Requester = { userId: string; fingerprint: null } | { userId: null; fingerprint: string }

const ATTEMPT_STEPS: CoachStep[] = ['draft', 'revise']
const ABANDONED_STATUS = 'abandoned'

function startOfUtcDay(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

function requesterFilter(requester: Requester): ['user_id' | 'anon_fingerprint', string] {
  return requester.userId === null ? ['anon_fingerprint', requester.fingerprint] : ['user_id', requester.userId]
}

/** Counts used by decideRateLimit; abandoned (failed) builds do not use up a build. */
export async function loadUsageCounts(admin: AdminClient, requester: Requester, now: Date): Promise<CoachUsageCounts> {
  const [column, value] = requesterFilter(requester)
  const countBuilds = (since: string | null) => {
    const query = admin.from('ai_builds').select('id', { count: 'exact', head: true })
      .eq(column, value).neq('status', ABANDONED_STATUS)
    return since === null ? query : query.gte('created_at', since)
  }
  const [lifetime, month, today, attempts] = await Promise.all([
    countBuilds(null),
    countBuilds(startOfUtcMonth(now)),
    countBuilds(startOfUtcDay(now)),
    admin.from('ai_usage').select('id', { count: 'exact', head: true })
      .eq(column, value).in('step', ATTEMPT_STEPS).gte('created_at', startOfUtcDay(now)),
  ])
  assertNoDbError(lifetime.error, 'count AI builds')
  assertNoDbError(month.error, 'count AI builds this month')
  assertNoDbError(today.error, 'count AI builds today')
  assertNoDbError(attempts.error, 'count AI attempts today')
  return {
    lifetimeBuilds: lifetime.count ?? 0,
    buildsThisMonth: month.count ?? 0,
    buildsToday: today.count ?? 0,
    attemptsToday: attempts.count ?? 0,
  }
}

/**
 * Atomically takes the requester's cooldown slot, so concurrent requests cannot all pass the count checks.
 * @returns 0 when acquired, otherwise the seconds until the next call is allowed.
 */
export async function acquireCallSlot(admin: AdminClient, requester: Requester): Promise<number> {
  const [column, value] = requesterFilter(requester)
  const result = await admin.rpc('acquire_ai_call_slot', {
    p_requester_key: `${column}:${value}`,
    p_cooldown_secs: COACH_COOLDOWN_SECS,
  })
  return requireDbData(result, 'acquire AI call slot')
}

export interface UsageRecord {
  requester: Requester
  modelClass: ModelClass
  buildId: string
  turnNumber: number
  step: CoachStep
  response: LLMResponse
}

/** Writes one ai_usage row per LLM call. */
export async function recordUsage(admin: AdminClient, record: UsageRecord): Promise<void> {
  const { error } = await admin.from('ai_usage').insert({
    user_id: record.requester.userId,
    anon_fingerprint: record.requester.fingerprint,
    build_session_id: record.buildId,
    turn_number: record.turnNumber,
    model_tier: record.modelClass,
    provider: record.response.provider,
    model: record.response.model,
    step: record.step,
    input_tokens: record.response.usage.inputTokens,
    output_tokens: record.response.usage.outputTokens,
  })
  assertNoDbError(error, 'record AI usage')
}
