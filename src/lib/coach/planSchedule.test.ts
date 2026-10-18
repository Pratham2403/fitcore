import { describe, expect, it } from 'vitest'
import type { DayOfWeek } from '@/types'
import { decidePlanSchedule } from './planSchedule'

const MONDAY = 1
const TUESDAY = 2
const WEDNESDAY = 3
const FRIDAY = 5

describe('decidePlanSchedule', () => {
  const planDays = [MONDAY, WEDNESDAY, FRIDAY] as const

  it('keeps occupied days and fills only the empty ones when not taking over', () => {
    expect(decidePlanSchedule({ planDays, occupiedDays: new Set<DayOfWeek>([MONDAY, TUESDAY]), takeOverDays: false }))
      .toEqual({ scheduledDays: [WEDNESDAY, FRIDAY], keptDays: [MONDAY] })
  })

  it('schedules every plan day when taking over', () => {
    expect(decidePlanSchedule({ planDays, occupiedDays: new Set<DayOfWeek>([MONDAY, WEDNESDAY]), takeOverDays: true }))
      .toEqual({ scheduledDays: [MONDAY, WEDNESDAY, FRIDAY], keptDays: [] })
  })

  it('schedules every plan day when none is occupied, whatever the choice', () => {
    const occupiedDays = new Set<DayOfWeek>([TUESDAY])
    expect(decidePlanSchedule({ planDays, occupiedDays, takeOverDays: false }))
      .toEqual(decidePlanSchedule({ planDays, occupiedDays, takeOverDays: true }))
  })

  it('schedules nothing new when every plan day is occupied and kept', () => {
    expect(decidePlanSchedule({ planDays, occupiedDays: new Set(planDays), takeOverDays: false }))
      .toEqual({ scheduledDays: [], keptDays: [...planDays] })
  })
})
