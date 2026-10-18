import type { DayOfWeek } from '@/types'

/** Where a saved plan's days land in the weekly schedule. */
export interface PlanScheduleOutcome {
  /** Plan days whose new workout is put on the schedule. */
  scheduledDays: DayOfWeek[]
  /** Plan days that keep the workout already scheduled; their new workout is saved unscheduled. */
  keptDays: DayOfWeek[]
}

export interface PlanScheduleInput {
  planDays: readonly DayOfWeek[]
  /** Days that already have a workout scheduled. */
  occupiedDays: ReadonlySet<DayOfWeek>
  /** Whether the plan's workouts replace the ones already on its days. */
  takeOverDays: boolean
}

/** Mirrors `save_coach_plan`: a plan day is scheduled when it is empty or the plan takes over its days. */
export function decidePlanSchedule({ planDays, occupiedDays, takeOverDays }: PlanScheduleInput): PlanScheduleOutcome {
  if (takeOverDays) return { scheduledDays: [...planDays], keptDays: [] }
  return {
    scheduledDays: planDays.filter(day => !occupiedDays.has(day)),
    keptDays: planDays.filter(day => occupiedDays.has(day)),
  }
}
