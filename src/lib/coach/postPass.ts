import type { ConstraintWarning } from '@/types'
import { resolveSafeExercise } from '@/lib/constraints/evaluate'
import type { LlmDraft } from './schema'
import type { CoachDay, CoachExercise, CoachSubstitution } from './types'

/** A constraint_requirements row relevant to the user. */
export interface ConstraintRequirement {
  exerciseId: string
  rationale: string
}

export interface PostPassContext {
  warningsById: ReadonlyMap<string, readonly ConstraintWarning[]>
  names: ReadonlyMap<string, string>
  requirements: readonly ConstraintRequirement[]
  /** Original exercise ids whose substitution the user already approved. */
  approvedOriginalIds: ReadonlySet<string>
}

const REQUIRED_DAYS = 2
const REQUIRED_SETS = 3
const REQUIRED_REPS = '10'
const REQUIRED_REST_SECS = 45
const PREFERRED_REQUIREMENT_PROTOCOLS = new Set(['legs', 'full_body'])

function nameOf(exerciseId: string, names: ReadonlyMap<string, string>): string {
  const name = names.get(exerciseId)
  if (name === undefined) throw new Error(`Unknown exercise id: ${exerciseId}`)
  return name
}

function nonSubstituteWarnings(exerciseId: string, context: PostPassContext): ConstraintWarning[] {
  return (context.warningsById.get(exerciseId) ?? []).filter(warning => warning.action !== 'substitute')
}

function toSubstitution(originalId: string, context: PostPassContext): CoachSubstitution | undefined {
  const rule = (context.warningsById.get(originalId) ?? []).find(warning => warning.action === 'substitute')
  if (!rule) return undefined
  return {
    originalExerciseId: originalId,
    originalName: nameOf(originalId, context.names),
    constraintType: rule.constraintType,
    rationale: rule.rationale,
    status: context.approvedOriginalIds.has(originalId) ? 'approved' : 'pending',
  }
}

function toSafeExercise(exercise: LlmDraft['days'][number]['exercises'][number], context: PostPassContext): CoachExercise[] {
  const safeId = resolveSafeExercise(exercise.exerciseId, context.warningsById)
  if (safeId === null) return []
  const safeExercise: CoachExercise = {
    ...exercise,
    exerciseId: safeId,
    name: nameOf(safeId, context.names),
    isMandatory: false,
    warnings: nonSubstituteWarnings(safeId, context),
  }
  const substitution = safeId === exercise.exerciseId ? undefined : toSubstitution(exercise.exerciseId, context)
  return [substitution ? { ...safeExercise, substitution } : safeExercise]
}

function dedupeByExerciseId(exercises: readonly CoachExercise[]): CoachExercise[] {
  return exercises.filter((exercise, index) => exercises.findIndex(other => other.exerciseId === exercise.exerciseId) === index)
}

function applyRequirement(days: readonly CoachDay[], requirement: ConstraintRequirement, context: PostPassContext): CoachDay[] {
  const exerciseId = resolveSafeExercise(requirement.exerciseId, context.warningsById)
  if (exerciseId === null) return [...days]
  const hasExercise = (day: CoachDay) => day.exercises.some(exercise => exercise.exerciseId === exerciseId)
  const missingDays = Math.max(0, Math.min(REQUIRED_DAYS, days.length) - days.filter(hasExercise).length)
  const addTo = new Set(
    days
      .filter(day => !hasExercise(day))
      .sort((left, right) => Number(PREFERRED_REQUIREMENT_PROTOCOLS.has(right.protocol)) - Number(PREFERRED_REQUIREMENT_PROTOCOLS.has(left.protocol)))
      .slice(0, missingDays)
      .map(day => day.dayOfWeek),
  )
  const required: CoachExercise = {
    exerciseId,
    name: nameOf(exerciseId, context.names),
    sets: REQUIRED_SETS,
    reps: REQUIRED_REPS,
    restSecs: REQUIRED_REST_SECS,
    rationale: requirement.rationale,
    isMandatory: true,
    warnings: nonSubstituteWarnings(exerciseId, context),
  }
  return days.map(day => ({
    ...day,
    exercises: [
      ...day.exercises.map(exercise => (exercise.exerciseId === exerciseId ? { ...exercise, isMandatory: true } : exercise)),
      ...(addTo.has(day.dayOfWeek) ? [required] : []),
    ],
  }))
}

/**
 * Deterministic safety pass over a model draft: swaps every constraint-contraindicated exercise for its safe
 * alternative (dropping it when there is none), attaches the final exercise's warnings, adds constraint-required
 * exercises, and removes duplicates. The result never contains an exercise with a `substitute` warning.
 */
export function applyPostPass(draft: LlmDraft, context: PostPassContext): CoachDay[] {
  const safeDays: CoachDay[] = draft.days.map(day => ({
    ...day,
    exercises: dedupeByExerciseId(day.exercises.flatMap(exercise => toSafeExercise(exercise, context))),
  }))
  return context.requirements.reduce((days, requirement) => applyRequirement(days, requirement, context), safeDays)
}
