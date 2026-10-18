import type { ConstraintWarning, ExerciseAlternative, MovementPattern } from '@/types'
import { toLoggingMode, type LoggingModeCatalogRow } from './loggingMode'

/** The catalog columns that decide whether one exercise can stand in for another. */
export interface AlternativeCatalogRow extends LoggingModeCatalogRow {
  id: string
  name: string
  level: string
  /** Movement the exercise trains; null when unclassified. */
  movementPattern: MovementPattern | null
  /** How standard the exercise is: higher is more standard. */
  popularity: number
}

export const MAX_DERIVED_ALTERNATIVES = 2
const ALWAYS_AVAILABLE_EQUIPMENT = 'body only'
const LEVEL_RANK: Readonly<Record<string, number>> = { beginner: 0, intermediate: 1, expert: 2 }

const levelDistance = (from: AlternativeCatalogRow, to: AlternativeCatalogRow) =>
  Math.abs((LEVEL_RANK[from.level] ?? 0) - (LEVEL_RANK[to.level] ?? 0))

const needsSubstitution = (warnings: readonly ConstraintWarning[] | undefined) =>
  (warnings ?? []).some(warning => warning.action === 'substitute')

/** A catalog exercise as an alternative, logged in the mode its catalog entry implies. */
export const toExerciseAlternative = (row: { id: string; name: string } & LoggingModeCatalogRow): ExerciseAlternative =>
  ({ id: row.id, name: row.name, ...toLoggingMode(row) })

/**
 * Stand-ins for an exercise with no stored alternatives: same movement pattern and main muscle, usable with the
 * user's equipment and safe for their constraints; most standard first, then closest in level.
 */
export function deriveAlternatives(
  target: AlternativeCatalogRow,
  catalog: readonly AlternativeCatalogRow[],
  userEquipment: readonly string[],
  warningsById: ReadonlyMap<string, readonly ConstraintWarning[]>,
): ExerciseAlternative[] {
  const mainMuscle = target.primaryMuscles[0]
  if (target.movementPattern === null || mainMuscle === undefined) return []
  const equipment = new Set([ALWAYS_AVAILABLE_EQUIPMENT, ...userEquipment])
  return catalog
    .filter(row => row.id !== target.id
      && row.movementPattern === target.movementPattern
      && row.primaryMuscles[0] === mainMuscle
      && (row.equipment === null || equipment.has(row.equipment))
      && !needsSubstitution(warningsById.get(row.id)))
    .sort((a, b) => b.popularity - a.popularity || levelDistance(target, a) - levelDistance(target, b) || a.id.localeCompare(b.id))
    .slice(0, MAX_DERIVED_ALTERNATIVES)
    .map(toExerciseAlternative)
}
