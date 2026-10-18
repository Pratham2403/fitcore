import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { DomainError, assertNoDbError, requireDbData } from '@/lib/errors'
import { toEnumValue } from '@/lib/enums'
import { computeFingerprint } from './fingerprint'
import { coachBuildInputSchema, storedPlanSchema, type ParsedCoachBuildInput, type StoredPlan } from './schema'
import type { Requester } from './usage'

type AdminClient = SupabaseClient<Database>

export const BUILD_STATUSES = ['drafting', 'finalized', 'abandoned'] as const
export type BuildStatus = (typeof BUILD_STATUSES)[number]

export interface CoachBuildRecord {
  id: string
  userId: string | null
  status: BuildStatus
  /** Model turns taken, the initial draft being turn 1. */
  turnCount: number
  request: ParsedCoachBuildInput
  plan: StoredPlan | null
}

const BUILD_COLUMNS = 'id, user_id, anon_fingerprint, status, turn_count, request, plan'

type BuildRow = Pick<Database['public']['Tables']['ai_builds']['Row'], 'id' | 'user_id' | 'status' | 'turn_count' | 'request' | 'plan'>

function toBuildRecord(row: BuildRow): CoachBuildRecord {
  return {
    id: row.id,
    userId: row.user_id,
    status: toEnumValue(BUILD_STATUSES, row.status, 'ai_builds.status'),
    turnCount: row.turn_count,
    request: coachBuildInputSchema.parse(row.request),
    plan: row.plan === null ? null : storedPlanSchema.parse(row.plan),
  }
}

function notFound(): DomainError {
  return new DomainError('NOT_FOUND', 'Plan not found.')
}

/** Reserves a build before the first model call so concurrent requests count against the limits. */
export async function createBuild(admin: AdminClient, requester: Requester, request: ParsedCoachBuildInput): Promise<string> {
  const result = await admin.from('ai_builds').insert({
    user_id: requester.userId,
    anon_fingerprint: requester.fingerprint,
    status: 'drafting',
    turn_count: 0,
    request,
  }).select('id').single()
  return requireDbData(result, 'create AI build').id
}

/**
 * Loads a build the caller owns: their own, or an unclaimed one made from the same fingerprint.
 * @throws DomainError('NOT_FOUND') for missing or foreign builds.
 */
export async function loadOwnedBuild(admin: AdminClient, buildId: string, userId: string | null): Promise<CoachBuildRecord> {
  const { data, error } = await admin.from('ai_builds').select(BUILD_COLUMNS).eq('id', buildId).maybeSingle()
  assertNoDbError(error, 'load AI build')
  if (!data) throw notFound()
  const isOwner = data.user_id === null
    ? data.anon_fingerprint !== null && data.anon_fingerprint === computeFingerprint()
    : data.user_id === userId
  if (!isOwner) throw notFound()
  return toBuildRecord(data)
}

/** The user's most recent build that is still being drafted and already has a plan, or null. */
export async function loadLatestDraftingBuild(admin: AdminClient, userId: string): Promise<CoachBuildRecord | null> {
  const { data, error } = await admin.from('ai_builds').select(BUILD_COLUMNS)
    .eq('user_id', userId).eq('status', 'drafting').not('plan', 'is', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  assertNoDbError(error, 'load drafting AI build')
  return data === null ? null : toBuildRecord(data)
}

export async function saveBuildPlan(admin: AdminClient, buildId: string, plan: StoredPlan, turnCount: number): Promise<void> {
  const { error } = await admin.from('ai_builds')
    .update({ plan, turn_count: turnCount, updated_at: new Date().toISOString() }).eq('id', buildId)
  assertNoDbError(error, 'save AI build plan')
}

export async function setBuildStatus(admin: AdminClient, buildId: string, status: BuildStatus): Promise<void> {
  const { error } = await admin.from('ai_builds')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', buildId)
  assertNoDbError(error, 'update AI build status')
}

/** Compare-and-set on the build status; false when another request changed it first. */
export async function transitionBuildStatus(
  admin: AdminClient, buildId: string, from: BuildStatus, to: BuildStatus,
): Promise<boolean> {
  const { data, error } = await admin.from('ai_builds')
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq('id', buildId).eq('status', from)
    .select('id')
  assertNoDbError(error, 'transition AI build status')
  return Boolean(data?.length)
}

/** Compare-and-set on the turn count, reserving (or refunding) a turn; false when another request changed it first. */
export async function transitionTurnCount(admin: AdminClient, buildId: string, from: number, to: number): Promise<boolean> {
  const { data, error } = await admin.from('ai_builds')
    .update({ turn_count: to, updated_at: new Date().toISOString() })
    .eq('id', buildId).eq('turn_count', from)
    .select('id')
  assertNoDbError(error, 'reserve AI build turn')
  return Boolean(data?.length)
}

/**
 * Attaches an anonymous build to the signed-in user.
 * @throws DomainError('NOT_FOUND') unless the build is unclaimed and was made from this fingerprint.
 */
export async function claimBuild(admin: AdminClient, buildId: string, userId: string, fingerprint: string): Promise<void> {
  const { data, error } = await admin.from('ai_builds')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', buildId).is('user_id', null).eq('anon_fingerprint', fingerprint)
    .select('id')
  assertNoDbError(error, 'claim AI build')
  if (!data?.length) throw notFound()
}
