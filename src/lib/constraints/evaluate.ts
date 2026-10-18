import type { ConstraintAction, ConstraintType, ConstraintWarning } from '@/types'

/** A substitution_rules row joined with its safe alternative's name. */
export interface ConstraintRule {
  constraintType: ConstraintType
  exerciseId: string
  action: ConstraintAction
  safeAlternativeId: string | null
  safeAlternativeName: string | null
  warning: string
  rationale: string
}

function toWarning(rule: ConstraintRule): ConstraintWarning {
  const warning: ConstraintWarning = {
    constraintType: rule.constraintType,
    action: rule.action,
    warning: rule.warning,
    rationale: rule.rationale,
  }
  if (rule.action !== 'substitute' || !rule.safeAlternativeId || !rule.safeAlternativeName) return warning
  return { ...warning, safeAlternative: { id: rule.safeAlternativeId, name: rule.safeAlternativeName } }
}

/**
 * Derives the constraint warnings for each exercise from the user's active constraints.
 * Safe alternatives named by `substitute` rules are evaluated too (transitively), so a
 * substituted-in exercise carries its own warnings.
 * @returns Map keyed by catalog exercise id; every requested id is present (possibly with []).
 */
export function evaluateConstraints(
  exerciseIds: readonly string[],
  userConstraints: readonly ConstraintType[],
  rules: readonly ConstraintRule[],
): Map<string, ConstraintWarning[]> {
  const active = new Set(userConstraints)
  const rulesByExercise = new Map<string, ConstraintRule[]>()
  for (const rule of rules) {
    if (!active.has(rule.constraintType)) continue
    rulesByExercise.set(rule.exerciseId, [...(rulesByExercise.get(rule.exerciseId) ?? []), rule])
  }

  const warningsById = new Map<string, ConstraintWarning[]>()
  const pending = [...exerciseIds]
  for (let exerciseId = pending.pop(); exerciseId !== undefined; exerciseId = pending.pop()) {
    if (warningsById.has(exerciseId)) continue
    const exerciseRules = rulesByExercise.get(exerciseId) ?? []
    warningsById.set(exerciseId, exerciseRules.map(toWarning))
    for (const rule of exerciseRules) {
      if (rule.action === 'substitute' && rule.safeAlternativeId) pending.push(rule.safeAlternativeId)
    }
  }
  return warningsById
}

/**
 * Follows `substitute` warnings from an exercise to the first exercise that needs no substitution.
 * @returns The safe exercise id (the input itself if no substitution applies), or null when the chain
 * dead-ends (substitute without alternative) or cycles.
 */
export function resolveSafeExercise(
  exerciseId: string,
  warningsById: ReadonlyMap<string, readonly ConstraintWarning[]>,
): string | null {
  const visited = new Set<string>()
  let currentId = exerciseId
  while (!visited.has(currentId)) {
    visited.add(currentId)
    const substitution = (warningsById.get(currentId) ?? []).find(w => w.action === 'substitute')
    if (!substitution) return currentId
    if (!substitution.safeAlternative) return null
    currentId = substitution.safeAlternative.id
  }
  return null
}
