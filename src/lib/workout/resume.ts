import type { Exercise, ExerciseAlternative, SetLog } from '@/types'

const SIDES_PER_UNILATERAL_SET = 2

/** A logged set row as an exercise card displays it and carries its values forward. */
export interface LoggedRow {
  /** Row position within the card; unilateral sets interleave left/right rows. */
  rowIndex: number
  /** Catalog exercise the row was logged under: the plan exercise or a swapped-in alternative. */
  exerciseId: string
  reps?: number
  weightKg?: number
  /** Seconds held; set only for timed sets. */
  durationSecs?: number
  isPR: boolean
}

function rowIndexOf(log: SetLog, isUnilateral: boolean): number {
  if (!isUnilateral) return log.set_number - 1
  return (log.set_number - 1) * SIDES_PER_UNILATERAL_SET + (log.side === 'left' ? 0 : 1)
}

type ResumableExercise = Pick<Exercise, 'id' | 'exerciseId' | 'isUnilateral' | 'alternatives'>

/** The plan exercise a set belongs to: the one it was logged as, else the one it stood in for as an alternative. */
function planExerciseOf(exercises: readonly ResumableExercise[], catalogId: string): ResumableExercise | undefined {
  return exercises.find(exercise => exercise.exerciseId === catalogId)
    ?? exercises.find(exercise => exercise.alternatives.some(alternative => alternative.id === catalogId))
}

/**
 * Rebuilds each exercise card's logged rows, in logging order, keyed by workout exercise id.
 * Sets are matched by catalog exercise id (including swapped-in alternatives) so renamed exercises and
 * warmup/stretch blocks never collide.
 */
export function toLoggedRowsByExercise(
  sets: readonly SetLog[],
  exercises: readonly ResumableExercise[],
): Record<string, LoggedRow[]> {
  return sets
    .filter(set => set.block_type === 'working')
    .sort((first, second) => Date.parse(first.logged_at) - Date.parse(second.logged_at))
    .reduce<Record<string, LoggedRow[]>>((rowsByExercise, set) => {
      if (set.exercise_id === null) return rowsByExercise
      const exercise = planExerciseOf(exercises, set.exercise_id)
      if (!exercise) return rowsByExercise
      const rows = rowsByExercise[exercise.id] ?? []
      const rowIndex = rowIndexOf(set, exercise.isUnilateral)
      if (rows.some(row => row.rowIndex === rowIndex)) return rowsByExercise
      const row: LoggedRow = {
        rowIndex, exerciseId: set.exercise_id, reps: set.reps, weightKg: set.weight_kg, durationSecs: set.duration_secs,
        isPR: set.is_pr,
      }
      return { ...rowsByExercise, [exercise.id]: [...rows, row] }
    }, {})
}

/** The alternative a resumed card is swapped to: the one its latest row was logged under, if any. */
export function resumedAlternative(
  alternatives: readonly ExerciseAlternative[],
  loggedRows: readonly LoggedRow[],
): ExerciseAlternative | undefined {
  const latestRow = loggedRows[loggedRows.length - 1]
  if (!latestRow) return undefined
  return alternatives.find(alternative => alternative.id === latestRow.exerciseId)
}
