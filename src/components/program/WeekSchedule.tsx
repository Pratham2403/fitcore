'use client'

import { useEffect, useState } from 'react'
import type { DayOfWeek, WeeklyProgram, WorkoutSummary } from '@/types'
import { setScheduleDay } from '@/lib/program/actions'
import Card from '@/components/ui/Card'
import Sheet from '@/components/ui/Sheet'
import Spinner from '@/components/ui/Spinner'
import { CheckIcon, ChevronDownIcon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { DAY_NAMES, DAYS_OF_WEEK, toDayOfWeek } from './programLabels'

interface WeekScheduleProps {
  program: WeeklyProgram
}

const REST_LABEL = 'Rest'

function PickerOption({ label, detail, isSelected, onSelect }: { label: string; detail?: string; isSelected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        onClick={onSelect}
        className={`flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-2 text-left transition-colors duration-150 ${
          isSelected ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]' : 'border-[var(--border)] bg-[var(--bg-surface)]'
        }`}
      >
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">{label}</span>
          {detail && <span className="text-xs text-[var(--text-secondary)]">{detail}</span>}
        </span>
        {isSelected && <CheckIcon size={18} className="text-[var(--accent-emerald)]" />}
      </button>
    </li>
  )
}

/** Sunday–Saturday schedule; each day opens a picker to assign a workout or rest. */
export default function WeekSchedule({ program }: WeekScheduleProps) {
  const showToast = useToast()
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null)
  const [savingDay, setSavingDay] = useState<DayOfWeek | null>(null)
  // Weekday depends on the viewer's timezone, so it is only known after mount.
  const [today, setToday] = useState<DayOfWeek | null>(null)
  useEffect(() => setToday(toDayOfWeek(new Date().getDay())), [])

  async function assign(day: DayOfWeek, workout: WorkoutSummary | null) {
    setEditingDay(null)
    setSavingDay(day)
    try {
      const result = await setScheduleDay(day, workout?.id ?? null)
      if (!result.ok) showToast(result.error.message, 'error')
    } catch {
      showToast('Couldn’t update your schedule. Please try again.', 'error')
    } finally {
      setSavingDay(null)
    }
  }

  const editingWorkoutId = editingDay === null ? null : program.schedule[editingDay]?.id ?? null

  return (
    <Card padding="none">
      <ul className="divide-y divide-[var(--border-subtle)]">
        {DAYS_OF_WEEK.map(day => {
          const workout = program.schedule[day]
          const isToday = day === today
          return (
            <li key={day}>
              <button
                type="button"
                onClick={() => setEditingDay(day)}
                aria-label={`${DAY_NAMES[day]}: ${workout?.name ?? REST_LABEL}. Change`}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
              >
                <span className={`w-10 text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-tertiary)]'}`}>
                  {DAY_NAMES[day].slice(0, 3)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate text-sm font-semibold ${workout ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                    {workout?.name ?? REST_LABEL}
                  </span>
                  {workout?.focus && <span className="truncate text-xs text-[var(--text-secondary)]">{workout.focus}</span>}
                </span>
                {savingDay === day ? <Spinner /> : <ChevronDownIcon size={16} className="text-[var(--text-tertiary)]" />}
              </button>
            </li>
          )
        })}
      </ul>
      <Sheet open={editingDay !== null} onClose={() => setEditingDay(null)} title={editingDay === null ? undefined : DAY_NAMES[editingDay]}>
        {editingDay !== null && (
          <ul role="radiogroup" aria-label={`Workout for ${DAY_NAMES[editingDay]}`} className="flex flex-col gap-2">
            {program.workouts.map(workout => (
              <PickerOption
                key={workout.id}
                label={workout.name}
                detail={`${workout.exerciseCount} exercises${workout.focus ? ` · ${workout.focus}` : ''}`}
                isSelected={workout.id === editingWorkoutId}
                onSelect={() => assign(editingDay, workout)}
              />
            ))}
            <PickerOption label={REST_LABEL} detail="No workout this day" isSelected={editingWorkoutId === null} onSelect={() => assign(editingDay, null)} />
          </ul>
        )}
      </Sheet>
    </Card>
  )
}
