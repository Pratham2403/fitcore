'use client'

import SegmentedControl from '@/components/ui/SegmentedControl'
import { SESSION_MINUTE_CHOICES, TRAINING_DAY_CHOICES } from './trainingOptions'

interface SchedulePickerProps {
  daysPerWeek: number
  sessionMinutes: number
  onDaysPerWeekChange: (days: number) => void
  onSessionMinutesChange: (minutes: number) => void
}

const DAY_SEGMENTS = TRAINING_DAY_CHOICES.map(days => ({ value: String(days), label: String(days) }))
const MINUTE_SEGMENTS = SESSION_MINUTE_CHOICES.map(minutes => ({ value: String(minutes), label: String(minutes) }))

/** Training days per week and session length selectors. */
export default function SchedulePicker({ daysPerWeek, sessionMinutes, onDaysPerWeekChange, onSessionMinutesChange }: SchedulePickerProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Training days per week</p>
        <SegmentedControl
          label="Training days per week"
          segments={DAY_SEGMENTS}
          value={String(daysPerWeek)}
          onChange={days => onDaysPerWeekChange(Number(days))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Session length (minutes)</p>
        <SegmentedControl
          label="Session length in minutes"
          segments={MINUTE_SEGMENTS}
          value={String(sessionMinutes)}
          onChange={minutes => onSessionMinutesChange(Number(minutes))}
        />
      </div>
    </div>
  )
}
