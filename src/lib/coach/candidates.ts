import type { ConstraintWarning, ExperienceLevel, MovementPattern } from '@/types'

/** The catalog columns the coach needs. */
export interface CatalogCandidateRow {
  id: string
  name: string
  level: string
  mechanic: string | null
  equipment: string | null
  category: string
  primaryMuscles: string[]
  /** Movement the exercise trains; null when unclassified. */
  movementPattern: MovementPattern | null
  /** How standard the exercise is: 3 core staple, 2 common staple, 1 default, 0 unusual variant. */
  popularity: number
}

export interface CandidateFilters {
  equipment: readonly string[]
  experience: ExperienceLevel
  preferredIds: readonly string[]
  requiredIds: readonly string[]
}

export const MAX_CANDIDATES = 150
/** Strength exercises guaranteed per primary muscle, so small muscles survive the cap. */
export const MIN_PER_MUSCLE = 2
/** Catalog level tags are noisy, so one level above the user's experience is allowed (ranked lower). */
export const LEVEL_HEADROOM = 1

const ALWAYS_AVAILABLE_EQUIPMENT = 'body only'
const LEVEL_RANK: Readonly<Record<string, number>> = { beginner: 0, intermediate: 1, expert: 2 }
const EXPERIENCE_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const STRENGTH_CATEGORIES = ['strength', 'powerlifting', 'strongman']
const BEGINNER_CATEGORIES = [...STRENGTH_CATEGORIES, 'cardio', 'stretching']
const CATEGORIES_BY_EXPERIENCE: Record<ExperienceLevel, readonly string[]> = {
  beginner: BEGINNER_CATEGORIES,
  intermediate: [...BEGINNER_CATEGORIES, 'plyometrics'],
  advanced: [...BEGINNER_CATEGORIES, 'plyometrics', 'olympic weightlifting'],
}
const MECHANIC_ORDER = ['compound', 'isolation']
/** Neck work is never needed to round out a program. */
const FLOOR_EXCLUDED_MUSCLES = ['neck']

/** Relative share of the shortlist per movement pattern: the k-th exercise of a pattern ranks like k / weight. */
const PATTERN_WEIGHTS: Record<MovementPattern, number> = {
  squat: 2, hinge: 2, lunge: 2, glute_bridge: 1, horizontal_push: 3, vertical_push: 2, horizontal_pull: 3, vertical_pull: 2,
  carry: 1, core: 3, biceps: 2, triceps: 2, shoulder_iso: 2, rear_delt: 1, chest_iso: 1, leg_iso: 2, calf: 1,
  forearm: 0.5, power: 0.25, conditioning: 0.5, mobility: 0.5,
}
const UNCLASSIFIED_WEIGHT = 0.25

const needsSubstitution = (warnings: readonly ConstraintWarning[] | undefined) =>
  (warnings ?? []).some(warning => warning.action === 'substitute')

/** Levels above the user's experience; null when the level is unknown or beyond the headroom. */
function levelsAbove(row: CatalogCandidateRow, experience: ExperienceLevel): number | null {
  const levelRank = LEVEL_RANK[row.level]
  if (levelRank === undefined) return null
  const stretch = Math.max(0, levelRank - EXPERIENCE_RANK[experience])
  return stretch <= LEVEL_HEADROOM ? stretch : null
}

function isEligible(
  row: CatalogCandidateRow,
  filters: CandidateFilters,
  warningsById: ReadonlyMap<string, readonly ConstraintWarning[]>,
): boolean {
  const equipment = [ALWAYS_AVAILABLE_EQUIPMENT, ...filters.equipment]
  return (row.equipment === null || equipment.includes(row.equipment))
    && levelsAbove(row, filters.experience) !== null
    && CATEGORIES_BY_EXPERIENCE[filters.experience].includes(row.category)
    && !needsSubstitution(warningsById.get(row.id))
}

/** Most standard first; then closest to the user's level, compounds first, and the plainest (shortest) name. */
function compareCandidates(experience: ExperienceLevel) {
  const mechanicRank = (row: CatalogCandidateRow) => {
    const rank = MECHANIC_ORDER.indexOf(row.mechanic ?? '')
    return rank === -1 ? MECHANIC_ORDER.length : rank
  }
  return (left: CatalogCandidateRow, right: CatalogCandidateRow) =>
    right.popularity - left.popularity
    || (levelsAbove(left, experience) ?? 0) - (levelsAbove(right, experience) ?? 0)
    || mechanicRank(left) - mechanicRank(right)
    || left.name.length - right.name.length
    || left.name.localeCompare(right.name)
}

/** The best-ranked strength exercises per primary muscle, up to MIN_PER_MUSCLE each. */
function pickMuscleFloor(ranked: readonly CatalogCandidateRow[]): CatalogCandidateRow[] {
  const countByMuscle = new Map<string, number>()
  return ranked.filter(row => {
    const muscle = row.primaryMuscles[0]
    if (muscle === undefined || FLOOR_EXCLUDED_MUSCLES.includes(muscle) || !STRENGTH_CATEGORIES.includes(row.category)) return false
    const count = countByMuscle.get(muscle) ?? 0
    if (count >= MIN_PER_MUSCLE) return false
    countByMuscle.set(muscle, count + 1)
    return true
  })
}

/** Within each popularity tier, interleaves movement patterns by weight; ties keep their rank order. */
function interleaveByPattern(ranked: readonly CatalogCandidateRow[]): CatalogCandidateRow[] {
  const seenByGroup = new Map<string, number>()
  return ranked
    .map(row => {
      const group = `${row.popularity}:${row.movementPattern ?? ''}`
      const index = seenByGroup.get(group) ?? 0
      seenByGroup.set(group, index + 1)
      const weight = row.movementPattern === null ? UNCLASSIFIED_WEIGHT : PATTERN_WEIGHTS[row.movementPattern]
      return { row, share: index / weight }
    })
    .sort((left, right) => right.row.popularity - left.row.popularity || left.share - right.share)
    .map(({ row }) => row)
}

/**
 * Picks the exercises the model may choose from, capped at MAX_CANDIDATES: preferred first (even if a constraint will
 * swap them, so the swap stays visible), then required, then a floor of strength exercises per primary muscle, then the
 * remaining eligible exercises, most standard first, spread across movement patterns.
 */
export function selectCandidates(
  catalogRows: readonly CatalogCandidateRow[],
  filters: CandidateFilters,
  warningsById: ReadonlyMap<string, readonly ConstraintWarning[]>,
): CatalogCandidateRow[] {
  const rowsById = new Map(catalogRows.map(row => [row.id, row]))
  const pinnedIds = Array.from(new Set([...filters.preferredIds, ...filters.requiredIds]))
  const pinned = pinnedIds.flatMap(id => rowsById.get(id) ?? [])
  const pinnedSet = new Set(pinnedIds)

  const ranked = catalogRows
    .filter(row => !pinnedSet.has(row.id) && isEligible(row, filters, warningsById))
    .sort(compareCandidates(filters.experience))
  const floor = pickMuscleFloor(ranked)
  const floorIds = new Set(floor.map(row => row.id))
  const rest = interleaveByPattern(ranked.filter(row => !floorIds.has(row.id)))

  return [...pinned, ...floor, ...rest].slice(0, MAX_CANDIDATES)
}
