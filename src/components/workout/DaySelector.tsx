'use client'

import type { WeeklyProgram } from '@/types'
import { DAY_NAMES, DAYS_OF_WEEK } from '@/components/program/programLabels'

interface DaySelectorProps {
  program: WeeklyProgram
  selectedWorkoutId: string | null
  onChange: (workoutId: string) => void
}

const SHORT_DAY_LENGTH = 3

/** Horizontal picker for training a workout other than today's; shows which days each is scheduled. */
export default function DaySelector({ program, selectedWorkoutId, onChange }: DaySelectorProps) {
  function scheduledDaysLabel(workoutId: string): string {
    const days = DAYS_OF_WEEK.filter(day => program.schedule[day]?.id === workoutId)
    return days.length ? days.map(day => DAY_NAMES[day].slice(0, SHORT_DAY_LENGTH)).join(' · ') : 'Unscheduled'
  }

  return (
    <div role="group" aria-label="Choose a workout" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {program.workouts.map(workout => {
        const isSelected = workout.id === selectedWorkoutId
        return (
          <button
            key={workout.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(workout.id)}
            className={`flex min-h-12 shrink-0 flex-col justify-center rounded-[var(--radius-md)] border px-4 text-left transition-colors duration-150 ${
              isSelected
                ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald-strong)]'
                : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
            }`}
          >
            <span className="text-[11px] opacity-70">{scheduledDaysLabel(workout.id)}</span>
            <span className="text-sm font-semibold">{workout.name}</span>
          </button>
        )
      })}
    </div>
  )
}
