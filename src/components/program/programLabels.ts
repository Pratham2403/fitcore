import type { DayOfWeek, Protocol } from '@/types'

/** Indexed by DayOfWeek (0 = Sunday). */
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export const PROTOCOL_LABELS: Record<Protocol, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  recovery: 'Recovery',
  full_body: 'Full body',
}

/** Narrows a JS weekday number to DayOfWeek. */
export function toDayOfWeek(day: number): DayOfWeek {
  return DAYS_OF_WEEK.find(candidate => candidate === day) ?? 0
}
