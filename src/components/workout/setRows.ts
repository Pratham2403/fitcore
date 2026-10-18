import type { Exercise, Side } from '@/types'
import type { LoggedRow } from '@/lib/workout/resume'

const UNILATERAL_SIDES = ['left', 'right'] as const

type RowLayout = Pick<Exercise, 'sets' | 'isUnilateral'>

/** Rows an exercise card shows: one per set, or one per side for unilateral exercises. */
export function rowCountOf(exercise: RowLayout): number {
  return exercise.sets * (exercise.isUnilateral ? UNILATERAL_SIDES.length : 1)
}

/** Side a row logs; null for bilateral exercises. */
export function sideOfRow(rowIndex: number, isUnilateral: boolean): Side {
  return isUnilateral ? UNILATERAL_SIDES[rowIndex % UNILATERAL_SIDES.length] : null
}

/** 1-based set number a row belongs to. */
export function setNumberOfRow(rowIndex: number, isUnilateral: boolean): number {
  return Math.floor(rowIndex / (isUnilateral ? UNILATERAL_SIDES.length : 1)) + 1
}

function firstPendingRow(exercise: RowLayout, loggedRows: readonly LoggedRow[]): number | undefined {
  return Array.from({ length: rowCountOf(exercise) }, (_, rowIndex) => rowIndex)
    .find(rowIndex => !loggedRows.some(row => row.rowIndex === rowIndex))
}

/**
 * What follows a rest: the current exercise's first unlogged row (including the other side of a
 * unilateral set), else the next exercise that still has unlogged rows; undefined when all are done.
 */
export function nextUpLabel(
  exercises: ReadonlyArray<Pick<Exercise, 'id' | 'name' | 'sets' | 'isUnilateral'>>,
  loggedRowsByExercise: Readonly<Record<string, readonly LoggedRow[]>>,
  currentIndex: number,
): string | undefined {
  const current = exercises[currentIndex]
  const pendingRow = firstPendingRow(current, loggedRowsByExercise[current.id] ?? [])
  if (pendingRow !== undefined) {
    const side = sideOfRow(pendingRow, current.isUnilateral)
    return `${current.name} · set ${setNumberOfRow(pendingRow, current.isUnilateral)}${side ? ` ${side}` : ''}`
  }
  return exercises
    .slice(currentIndex + 1)
    .find(exercise => firstPendingRow(exercise, loggedRowsByExercise[exercise.id] ?? []) !== undefined)
    ?.name
}
