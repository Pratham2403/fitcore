'use client'

import { CheckIcon } from '@/components/ui/Icon'
import { GOAL_OPTIONS, type Goal } from './trainingOptions'

interface GoalPickerProps {
  value: Goal | null
  onChange: (goal: Goal) => void
}

/** Single-select goal cards (radio group semantics). */
export default function GoalPicker({ value, onChange }: GoalPickerProps) {
  return (
    <div role="radiogroup" aria-label="Main goal" className="grid gap-2">
      {GOAL_OPTIONS.map(option => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex min-h-16 items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors duration-150 ${
              isSelected
                ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]'
                : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-tertiary)]'
            }`}
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{option.label}</span>
              <span className="text-xs text-[var(--text-secondary)]">{option.description}</span>
            </span>
            {isSelected && <CheckIcon size={18} className="shrink-0 text-[var(--accent-emerald)]" />}
          </button>
        )
      })}
    </div>
  )
}
