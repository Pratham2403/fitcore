'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult, ConstraintType } from '@/types'
import type { LLMMessage } from '@/lib/llm/types'
import { LLMCallError } from '@/lib/llm/types'
import { callLLM, isProviderConfigured } from '@/lib/llm/registry'
import { createClient, getAuthenticatedUserId, getOptionalUserId, type ServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectAllPages } from '@/lib/supabase/paging'
import { withUserViewInvalidation } from '@/lib/cache'
import { DomainError, assertNoDbError, requireDbData, toActionResult } from '@/lib/errors'
import { parseInput } from '@/lib/validation'
import { MOVEMENT_PATTERNS, toEnumValue } from '@/lib/enums'
import { isWorkoutLimitDbError, loadPlan, loadWorkoutUsage, workoutLimitError } from '@/lib/entitlements'
import { evaluateConstraints } from '@/lib/constraints/evaluate'
import { loadConstraintRules, loadUserConstraints } from '@/lib/constraints/queries'
import { selectCandidates, type CatalogCandidateRow } from './candidates'
import { decideWorkoutCapacity } from './capacity'
import { parseLlmDraft } from './draft'
import type { PlanScheduleOutcome } from './planSchedule'
import { toSavePlanDays } from './planRows'
import { COACH_MAX_TOKENS, COACH_MODEL_ROUTES, type CoachStep } from './models'
import { applyPostPass, type ConstraintRequirement, type PostPassContext } from './postPass'
import { buildSystemPrompt, buildUserMessage, type RevisionContext } from './prompt'
import { COACH_LIMITS, decideCooldown, decideRateLimit, type CoachRequest, type CoachTier } from './rateLimit'
import {
  buildIdSchema, coachBuildInputSchema, feedbackSchema, substitutionDecisionListSchema,
  type CoachBuildInput, type LlmDraft, type ParsedCoachBuildInput, type StoredPlan, type SubstitutionDecision,
} from './schema'
import {
  claimBuild, createBuild, loadLatestDraftingBuild, loadOwnedBuild, saveBuildPlan, setBuildStatus, transitionBuildStatus, transitionTurnCount,
} from './store'
import type { CoachDay, CoachDraft } from './types'
import { computeFingerprint } from './fingerprint'
import { acquireCallSlot, loadUsageCounts, recordUsage, type Requester } from './usage'

const COACH_DISCLAIMER =
  "FitCore's AI Coach gives general training guidance, not medical advice. If you have pain or an injury, check with a physiotherapist or doctor before training."
const AI_UNAVAILABLE_MESSAGE = 'The AI Coach is not available right now — please try again later.'
const INVALID_PLAN_MESSAGE = "Couldn't build a valid plan — please try again."
const NOT_REVISABLE_MESSAGE = 'This plan can no longer be changed.'
const REVISION_IN_PROGRESS_MESSAGE = 'This plan is already being revised — try again in a moment.'
const FIRST_TURN = 1
const CATALOG_COLUMNS = 'id, name, level, mechanic, equipment, category, primary_muscles, movement_pattern, popularity'

const finalizeOptionsSchema = z.object({ replaceScheduledWorkouts: z.boolean().default(false) })

type AdminClient = ReturnType<typeof createAdminClient>

interface CoachSession {
  supabase: ServerSupabaseClient
  admin: AdminClient
  requester: Requester
  tier: CoachTier
}

interface CoachContext extends Omit<PostPassContext, 'approvedOriginalIds'> {
  catalog: CatalogCandidateRow[]
}

interface DraftRequest {
  buildId: string
  turnNumber: number
  step: Extract<CoachStep, 'draft' | 'revise'>
  userMessage: string
  candidateIds: ReadonlySet<string>
  daysPerWeek: number
}

/** Coach usage can't be metered without the service-role client, so a missing key means the coach is unavailable. */
function createCoachAdminClient(): AdminClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new DomainError('AI_UNAVAILABLE', AI_UNAVAILABLE_MESSAGE)
  return createAdminClient()
}

async function resolveSession(): Promise<CoachSession> {
  const supabase = await createClient()
  const admin = createCoachAdminClient()
  const userId = await getOptionalUserId(supabase)
  if (userId === null) return { supabase, admin, requester: { userId: null, fingerprint: computeFingerprint() }, tier: 'anonymous' }
  const { tier } = await loadPlan(supabase, userId)
  return { supabase, admin, requester: { userId, fingerprint: null }, tier }
}

/** Count limits first (no side effects), then the atomic cooldown slot that serialises concurrent calls. */
async function assertWithinRateLimit(session: CoachSession, request: CoachRequest): Promise<void> {
  const counts = await loadUsageCounts(session.admin, session.requester, new Date())
  const decision = decideRateLimit(session.tier, request, counts)
  if (!decision.allowed) throw new DomainError('RATE_LIMITED', decision.message)
  const cooldown = decideCooldown(await acquireCallSlot(session.admin, session.requester))
  if (!cooldown.allowed) throw new DomainError('RATE_LIMITED', cooldown.message)
}

function assertModelsConfigured(tier: CoachTier, step: DraftRequest['step']): void {
  const providers = [COACH_MODEL_ROUTES[step][tier].provider, COACH_MODEL_ROUTES.repair[tier].provider]
  if (!providers.every(isProviderConfigured)) throw new DomainError('AI_UNAVAILABLE', AI_UNAVAILABLE_MESSAGE)
}

const constraintTypesOf = (request: ParsedCoachBuildInput): ConstraintType[] =>
  request.constraints.map(constraint => constraint.constraintType)

async function loadCoachContext(supabase: ServerSupabaseClient, constraintTypes: readonly ConstraintType[]): Promise<CoachContext> {
  const [catalogRows, rules, requirementsResult] = await Promise.all([
    selectAllPages((from, to) => supabase.from('exercises').select(CATALOG_COLUMNS).order('id').range(from, to), 'load exercise catalog'),
    loadConstraintRules(supabase, constraintTypes),
    supabase.from('constraint_requirements').select('exercise_id, rationale').in('constraint_type', [...constraintTypes]),
  ])
  const catalog: CatalogCandidateRow[] = catalogRows.map(row => ({
    id: row.id,
    name: row.name,
    level: row.level,
    mechanic: row.mechanic,
    equipment: row.equipment,
    category: row.category,
    primaryMuscles: row.primary_muscles,
    movementPattern: row.movement_pattern === null ? null : toEnumValue(MOVEMENT_PATTERNS, row.movement_pattern, 'movement_pattern'),
    popularity: row.popularity,
  }))
  const requirements: ConstraintRequirement[] = requireDbData(requirementsResult, 'load constraint requirements')
    .map(row => ({ exerciseId: row.exercise_id, rationale: row.rationale }))
  return {
    catalog,
    names: new Map(catalog.map(row => [row.id, row.name])),
    warningsById: evaluateConstraints(catalog.map(row => row.id), constraintTypes, rules),
    requirements,
  }
}

async function callCoachModel(
  session: CoachSession, draftRequest: DraftRequest, step: CoachStep, messages: LLMMessage[],
): Promise<string> {
  const { provider, model, modelClass } = COACH_MODEL_ROUTES[step][session.tier]
  try {
    const response = await callLLM({
      provider,
      model,
      system: buildSystemPrompt(),
      messages,
      maxTokens: COACH_MAX_TOKENS,
    })
    await recordUsage(session.admin, {
      requester: session.requester,
      modelClass,
      buildId: draftRequest.buildId,
      turnNumber: draftRequest.turnNumber,
      step,
      response,
    })
    return response.text
  } catch (error) {
    if (error instanceof LLMCallError) throw new DomainError('AI_UNAVAILABLE', AI_UNAVAILABLE_MESSAGE)
    throw error
  }
}

/** One model call plus at most one repair call; the result only uses candidate ids. */
async function generateDraft(session: CoachSession, draftRequest: DraftRequest): Promise<LlmDraft> {
  const { candidateIds, daysPerWeek } = draftRequest
  const firstMessages: LLMMessage[] = [{ role: 'user', content: draftRequest.userMessage }]
  const firstReply = await callCoachModel(session, draftRequest, draftRequest.step, firstMessages)
  const first = parseLlmDraft(firstReply, candidateIds, daysPerWeek)
  if (first.ok) return first.draft

  const repairReply = await callCoachModel(session, draftRequest, 'repair', [
    ...firstMessages,
    { role: 'assistant', content: firstReply },
    {
      role: 'user',
      content: `That reply was invalid:\n${first.issues.map(issue => `- ${issue}`).join('\n')}\nReturn the corrected JSON object only.`,
    },
  ])
  const repaired = parseLlmDraft(repairReply, candidateIds, daysPerWeek)
  if (repaired.ok) return repaired.draft
  throw new DomainError('AI_UNAVAILABLE', INVALID_PLAN_MESSAGE)
}

function toCoachDraft(buildId: string, plan: StoredPlan, tier: CoachTier, turnCount: number): CoachDraft {
  return {
    buildId,
    turnsRemaining: Math.max(0, COACH_LIMITS[tier].turnsPerBuild - turnCount),
    days: plan.days,
    summary: plan.summary,
    disclaimer: COACH_DISCLAIMER,
  }
}

/** Drafts a weekly plan with the AI Coach; anonymous visitors may use it within their limits. */
export async function startCoachBuild(input: CoachBuildInput): Promise<ActionResult<CoachDraft>> {
  return toActionResult(async () => {
    const parsedInput = parseInput(coachBuildInputSchema, input)
    const session = await resolveSession()
    await assertWithinRateLimit(session, { kind: 'new_build' })
    assertModelsConfigured(session.tier, 'draft')

    const { userId } = session.requester
    const request: ParsedCoachBuildInput = userId !== null && parsedInput.constraints.length === 0
      ? { ...parsedInput, constraints: (await loadUserConstraints(session.supabase, userId)).map(({ constraintType }) => ({ constraintType })) }
      : parsedInput
    const context = await loadCoachContext(session.supabase, constraintTypesOf(request))
    const candidates = selectCandidates(context.catalog, {
      equipment: request.equipment,
      experience: request.experience,
      preferredIds: request.preferredExerciseIds,
      requiredIds: context.requirements.map(requirement => requirement.exerciseId),
    }, context.warningsById)
    const candidateIds = candidates.map(candidate => candidate.id)

    const buildId = await createBuild(session.admin, session.requester, request)
    const draft = await generateDraft(session, {
      buildId,
      turnNumber: FIRST_TURN,
      step: 'draft',
      userMessage: buildUserMessage(request, candidates),
      candidateIds: new Set(candidateIds),
      daysPerWeek: request.daysPerWeek,
    }).catch(async (error: unknown) => {
      await setBuildStatus(session.admin, buildId, 'abandoned')
      throw error
    })

    const plan: StoredPlan = {
      summary: draft.summary,
      days: applyPostPass(draft, { ...context, approvedOriginalIds: new Set() }),
      candidateIds,
      approvedOriginalIds: [],
      excludedExerciseIds: [],
    }
    await saveBuildPlan(session.admin, buildId, plan, FIRST_TURN)
    return toCoachDraft(buildId, plan, session.tier, FIRST_TURN)
  })
}

/** Locates each decided substitution in the plan; rejected slots are reported by the model's original id. */
function resolveDecisions(days: readonly CoachDay[], decisions: readonly SubstitutionDecision[]) {
  const located = decisions.map(decision => {
    const substitution = days.find(day => day.dayOfWeek === decision.dayOfWeek)?.exercises
      .find(exercise => exercise.exerciseId === decision.exerciseId)?.substitution
    if (!substitution) throw new DomainError('VALIDATION', 'That substitution is not part of this plan.')
    return { ...decision, originalExerciseId: substitution.originalExerciseId }
  })
  const rejected = located.filter(decision => decision.decision === 'reject')
  return {
    approvedOriginalIds: located.filter(decision => decision.decision === 'approve').map(decision => decision.originalExerciseId),
    rejectedSlots: rejected.map(decision => ({ dayOfWeek: decision.dayOfWeek, exerciseId: decision.originalExerciseId })),
    excludedExerciseIds: rejected.flatMap(decision => [decision.exerciseId, decision.originalExerciseId]),
  }
}

/**
 * Revises a draft: approved substitutions are locked in, rejected ones are replaced with a different exercise,
 * and optional feedback steers the rest. Uses one turn.
 */
export async function reviseCoachBuild(
  buildId: string,
  decisions: SubstitutionDecision[],
  feedback?: string,
): Promise<ActionResult<CoachDraft>> {
  return toActionResult(async () => {
    const id = parseInput(buildIdSchema, buildId)
    const parsedDecisions = parseInput(substitutionDecisionListSchema, decisions)
    const parsedFeedback = parseInput(feedbackSchema, feedback ?? '')
    const session = await resolveSession()
    const build = await loadOwnedBuild(session.admin, id, session.requester.userId)
    if (build.status !== 'drafting' || build.plan === null) throw new DomainError('VALIDATION', NOT_REVISABLE_MESSAGE)
    const plan = build.plan
    await assertWithinRateLimit(session, { kind: 'revision', turnCount: build.turnCount })
    assertModelsConfigured(session.tier, 'revise')

    const resolved = resolveDecisions(plan.days, parsedDecisions)
    const approvedOriginalIds = new Set([...plan.approvedOriginalIds, ...resolved.approvedOriginalIds])
    const excludedExerciseIds = new Set([...plan.excludedExerciseIds, ...resolved.excludedExerciseIds])
    const context = await loadCoachContext(session.supabase, constraintTypesOf(build.request))
    const catalogById = new Map(context.catalog.map(row => [row.id, row]))
    const candidates = plan.candidateIds
      .filter(candidateId => !excludedExerciseIds.has(candidateId))
      .flatMap(candidateId => catalogById.get(candidateId) ?? [])
    const revision: RevisionContext = { currentDays: plan.days, rejectedSlots: resolved.rejectedSlots, feedback: parsedFeedback }
    const turnNumber = build.turnCount + 1
    if (!await transitionTurnCount(session.admin, id, build.turnCount, turnNumber)) {
      throw new DomainError('RATE_LIMITED', REVISION_IN_PROGRESS_MESSAGE)
    }

    const draft = await generateDraft(session, {
      buildId: id,
      turnNumber,
      step: 'revise',
      userMessage: buildUserMessage(build.request, candidates, revision),
      candidateIds: new Set(candidates.map(candidate => candidate.id)),
      daysPerWeek: build.request.daysPerWeek,
    }).catch(async (error: unknown) => {
      // A failed model call does not use up a turn.
      await transitionTurnCount(session.admin, id, turnNumber, build.turnCount)
      throw error
    })
    const nextPlan: StoredPlan = {
      summary: draft.summary,
      days: applyPostPass(draft, { ...context, approvedOriginalIds }),
      candidateIds: plan.candidateIds,
      approvedOriginalIds: Array.from(approvedOriginalIds),
      excludedExerciseIds: Array.from(excludedExerciseIds),
    }
    await saveBuildPlan(session.admin, id, nextPlan, turnNumber)
    return toCoachDraft(id, nextPlan, session.tier, turnNumber)
  })
}

/** Returns a draft the caller owns. */
export async function getCoachBuild(buildId: string): Promise<ActionResult<CoachDraft>> {
  return toActionResult(async () => {
    const id = parseInput(buildIdSchema, buildId)
    const session = await resolveSession()
    const build = await loadOwnedBuild(session.admin, id, session.requester.userId)
    if (build.plan === null) throw new DomainError('NOT_FOUND', 'Plan not found.')
    return toCoachDraft(id, build.plan, session.tier, build.turnCount)
  })
}

/** The signed-in user's most recent unsaved draft; null when there is none or the caller is signed out. */
export async function getResumableCoachBuild(): Promise<ActionResult<CoachDraft | null>> {
  return toActionResult(async () => {
    const supabase = await createClient()
    const userId = await getOptionalUserId(supabase)
    if (userId === null) return null
    const build = await loadLatestDraftingBuild(createCoachAdminClient(), userId)
    if (build === null || build.plan === null) return null
    const { tier } = await loadPlan(supabase, userId)
    return toCoachDraft(build.id, build.plan, tier, build.turnCount)
  })
}

/** Attaches the build this device drafted while signed out to the signed-in user. */
export async function claimCoachBuild(buildId: string): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const id = parseInput(buildIdSchema, buildId)
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    await claimBuild(createCoachAdminClient(), id, userId, computeFingerprint())
  })
}

/** Workouts scheduled on the given days and on no other day — safe to replace without losing another day's plan. */
async function loadReplaceableWorkoutIds(supabase: ServerSupabaseClient, userId: string, days: ReadonlySet<number>): Promise<string[]> {
  const { data, error } = await supabase.from('weekly_schedule').select('day_of_week, workout_id').eq('user_id', userId)
  assertNoDbError(error, 'load schedule')
  const rows = data ?? []
  const keptElsewhere = new Set(rows.filter(row => !days.has(row.day_of_week)).map(row => row.workout_id))
  return Array.from(new Set(rows.flatMap(row => (days.has(row.day_of_week) && row.workout_id !== null ? [row.workout_id] : []))))
    .filter(workoutId => !keptElsewhere.has(workoutId))
}

const workoutCountLabel = (count: number) => `${count} ${count === 1 ? 'workout' : 'workouts'}`

/**
 * Decides which workouts the plan replaces: none when it fits, otherwise those scheduled only on the plan's days,
 * and only when that makes enough room.
 * @throws DomainError('WORKOUT_REPLACE_REQUIRED') when replacing would make room but wasn't chosen.
 * @throws DomainError('WORKOUT_LIMIT_REACHED') when even replacing leaves the plan over the cap.
 */
async function resolveReplacedWorkoutIds(
  supabase: ServerSupabaseClient, userId: string, days: readonly CoachDay[], replaceScheduledWorkouts: boolean,
): Promise<string[]> {
  const [{ workoutLimit, workoutCount }, replaceableIds] = await Promise.all([
    loadWorkoutUsage(supabase, userId),
    loadReplaceableWorkoutIds(supabase, userId, new Set(days.map(day => day.dayOfWeek))),
  ])
  const decision = decideWorkoutCapacity({
    workoutLimit, existingCount: workoutCount, planDayCount: days.length, replaceableCount: replaceableIds.length,
  })
  if (decision.kind === 'fits') return []
  if (decision.kind === 'over_limit') {
    throw new DomainError('WORKOUT_LIMIT_REACHED',
      `The free plan includes up to ${workoutLimit} workouts. Even after replacing the workouts on this plan's days, `
      + `delete ${workoutCountLabel(decision.excessCount)} you don't need, then save again — your draft is kept.`)
  }
  if (!replaceScheduledWorkouts) {
    throw new DomainError('WORKOUT_REPLACE_REQUIRED',
      `The free plan includes up to ${workoutLimit} workouts. Replace the ${workoutCountLabel(decision.replaceableCount)} `
      + 'scheduled only on these days to make room.')
  }
  return replaceableIds
}

/** The saved plan's workouts, and which of its days went on the schedule. */
interface SavedPlan extends PlanScheduleOutcome {
  workoutIds: string[]
}

/**
 * Saves the plan atomically: replaced workouts are deleted only if the new workouts, exercises and schedule all save.
 * Plan days already holding a workout keep it unless `replaceScheduledWorkouts` lets the plan take them over.
 */
async function createPlanWorkouts(
  supabase: ServerSupabaseClient, userId: string, days: readonly CoachDay[], replaceScheduledWorkouts: boolean,
): Promise<SavedPlan> {
  const exerciseIds = Array.from(new Set(days.flatMap(day => day.exercises.map(exercise => exercise.exerciseId))))
  const [replacedWorkoutIds, catalogResult] = await Promise.all([
    resolveReplacedWorkoutIds(supabase, userId, days, replaceScheduledWorkouts),
    supabase.from('exercises').select('id, equipment, primary_muscles').in('id', exerciseIds),
  ])
  const catalogById = new Map(requireDbData(catalogResult, 'load plan exercises').map(row => [row.id, row]))
  const result = await supabase.rpc('save_coach_plan', {
    p_days: toSavePlanDays(days, catalogById),
    p_replace_workout_ids: replacedWorkoutIds,
    p_take_over_days: replaceScheduledWorkouts,
  })
  if (isWorkoutLimitDbError(result.error)) throw workoutLimitError()
  const savedRows = requireDbData(result, 'save coach plan')
  const scheduledDays = new Set(savedRows.filter(row => row.is_scheduled).map(row => row.day_of_week))
  const planDays = days.map(day => day.dayOfWeek)
  return {
    workoutIds: savedRows.map(row => row.workout_id),
    scheduledDays: planDays.filter(day => scheduledDays.has(day)),
    keptDays: planDays.filter(day => !scheduledDays.has(day)),
  }
}

/**
 * Turns a claimed draft into workouts on the user's weekly schedule; pending substitutions count as approved.
 * Without `replaceScheduledWorkouts`, plan days that already have a workout keep it and the new one is saved unscheduled.
 * With it, the plan takes over its days, and the displaced workouts are deleted only when the free cap requires it;
 * a save the cap blocks leaves the draft open to save again.
 */
export async function finalizeCoachBuild(
  buildId: string,
  options?: { replaceScheduledWorkouts?: boolean },
): Promise<ActionResult<SavedPlan>> {
  return toActionResult(async () => {
    const id = parseInput(buildIdSchema, buildId)
    const { replaceScheduledWorkouts } = parseInput(finalizeOptionsSchema, options ?? {})
    const supabase = await createClient()
    const userId = await getAuthenticatedUserId(supabase)
    const admin = createCoachAdminClient()
    const build = await loadOwnedBuild(admin, id, userId)
    if (build.userId !== userId) throw new DomainError('NOT_FOUND', 'Plan not found.')
    if (build.plan === null) throw new DomainError('VALIDATION', NOT_REVISABLE_MESSAGE)
    const { days } = build.plan
    // Claim the transition up front so a double submit cannot create the plan's workouts twice.
    if (!await transitionBuildStatus(admin, id, 'drafting', 'finalized')) throw new DomainError('VALIDATION', NOT_REVISABLE_MESSAGE)

    try {
      const savedPlan = await withUserViewInvalidation(userId, () => createPlanWorkouts(supabase, userId, days, replaceScheduledWorkouts))
      revalidatePath('/', 'layout')
      return savedPlan
    } catch (error) {
      await transitionBuildStatus(admin, id, 'finalized', 'drafting')
      throw error
    }
  })
}
