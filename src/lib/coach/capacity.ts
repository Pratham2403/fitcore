export interface WorkoutCapacityInput {
  /** The plan's workout cap; null when unlimited. */
  workoutLimit: number | null
  /** Workouts the user has now. */
  existingCount: number
  /** Workouts the plan will create, one per day. */
  planDayCount: number
  /** Existing workouts that replacing the plan's days would delete. */
  replaceableCount: number
}

export type WorkoutCapacityDecision =
  | { kind: 'fits' }
  | { kind: 'fits_by_replacing'; replaceableCount: number }
  | { kind: 'over_limit'; excessCount: number }

/** Decides whether a plan's workouts fit under the cap as is, only by replacing the workouts on its days, or not at all. */
export function decideWorkoutCapacity(input: WorkoutCapacityInput): WorkoutCapacityDecision {
  const { workoutLimit, existingCount, planDayCount, replaceableCount } = input
  if (workoutLimit === null || existingCount + planDayCount <= workoutLimit) return { kind: 'fits' }
  const excessCount = existingCount - replaceableCount + planDayCount - workoutLimit
  if (excessCount <= 0) return { kind: 'fits_by_replacing', replaceableCount }
  return { kind: 'over_limit', excessCount }
}
