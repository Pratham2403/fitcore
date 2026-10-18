import { describe, expect, it } from 'vitest'
import { decideWorkoutCapacity } from './capacity'

const LIMIT = 7

describe('decideWorkoutCapacity', () => {
  it('fits when there is room, or there is no cap', () => {
    expect(decideWorkoutCapacity({ workoutLimit: LIMIT, existingCount: 1, planDayCount: 6, replaceableCount: 0 })).toEqual({ kind: 'fits' })
    expect(decideWorkoutCapacity({ workoutLimit: null, existingCount: 40, planDayCount: 6, replaceableCount: 0 })).toEqual({ kind: 'fits' })
  })

  it('fits by replacing when the workouts on the plan days make enough room', () => {
    expect(decideWorkoutCapacity({ workoutLimit: LIMIT, existingCount: 7, planDayCount: 3, replaceableCount: 3 }))
      .toEqual({ kind: 'fits_by_replacing', replaceableCount: 3 })
  })

  it('is over the limit when replacing is not enough, with the number of workouts still to remove', () => {
    // The reported case: 7 workouts, only 2 scheduled on the plan's days, a 6-day plan.
    expect(decideWorkoutCapacity({ workoutLimit: LIMIT, existingCount: 7, planDayCount: 6, replaceableCount: 2 }))
      .toEqual({ kind: 'over_limit', excessCount: 4 })
  })
})
