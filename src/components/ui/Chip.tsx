'use client'

import type { ReactNode } from 'react'
import { CheckIcon } from '@/components/ui/Icon'

export type ChipTone = 'neutral' | 'accent' | 'warning' | 'danger'

const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]',
  accent: 'bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald-strong)] border-[var(--accent-emerald-line)]',
  warning:
    'bg-[color-mix(in_srgb,var(--accent-orange)_12%,transparent)] text-[var(--accent-orange)] border-[color-mix(in_srgb,var(--accent-orange)_35%,transparent)]',
  danger: 'bg-[var(--destructive-soft)] text-[var(--destructive)] border-[color-mix(in_srgb,var(--destructive)_35%,transparent)]',
}

/** Static, non-interactive label (status, tag, badge). */
export function Chip({ tone = 'neutral', icon, children }: { tone?: ChipTone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {icon}
      {children}
    </span>
  )
}

interface ToggleChipProps {
  isPressed: boolean
  onPressedChange: (isPressed: boolean) => void
  children: ReactNode
}

/** Pressable chip with `aria-pressed`; building block for multi-select. */
export function ToggleChip({ isPressed, onPressedChange, children }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      onClick={() => onPressedChange(!isPressed)}
      className={
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ' +
        'transition-[background-color,color,border-color,transform] duration-[var(--dur-1)] active:scale-[0.97] ' +
        (isPressed
          ? 'bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald-strong)] border-[var(--accent-emerald)]'
          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-tertiary)]')
      }
    >
      {isPressed && <CheckIcon size={16} />}
      {children}
    </button>
  )
}

/** One selectable option in a `ToggleChipGroup`. */
export interface ChipOption<T extends string> {
  value: T
  label: string
}

interface ToggleChipGroupProps<T extends string> {
  /** Accessible name for the group. */
  label: string
  options: readonly ChipOption<T>[]
  selected: readonly T[]
  onChange: (selected: T[]) => void
}

/** Multi-select set of toggle chips; `onChange` receives a new array in option order. */
export function ToggleChipGroup<T extends string>({ label, options, selected, onChange }: ToggleChipGroupProps<T>) {
  function toggle(value: T, isPressed: boolean) {
    const next = new Set(selected)
    if (isPressed) next.add(value)
    else next.delete(value)
    onChange(options.map(option => option.value).filter(optionValue => next.has(optionValue)))
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(option => (
        <ToggleChip key={option.value} isPressed={selected.includes(option.value)} onPressedChange={isPressed => toggle(option.value, isPressed)}>
          {option.label}
        </ToggleChip>
      ))}
    </div>
  )
}
