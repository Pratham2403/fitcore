'use client'

import { useId, useRef, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { SPRING } from '@/components/ui/motion'

/** One segment of a `SegmentedControl`. */
export interface Segment<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the radio group. */
  label: string
  segments: readonly Segment<T>[]
  value: T
  onChange: (value: T) => void
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown'])
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp'])

/** Single-select control (radio group semantics) with a sliding selection indicator. */
export default function SegmentedControl<T extends string>({ label, segments, value, onChange }: SegmentedControlProps<T>) {
  const indicatorId = useId()
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = (NEXT_KEYS.has(event.key) && 1) || (PREVIOUS_KEYS.has(event.key) && -1) || 0
    if (step === 0) return
    event.preventDefault()
    const currentIndex = segments.findIndex(segment => segment.value === value)
    const nextIndex = (currentIndex + step + segments.length) % segments.length
    onChange(segments[nextIndex].value)
    buttonRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="relative flex rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1"
    >
      {segments.map((segment, index) => {
        const isSelected = segment.value === value
        return (
          <button
            key={segment.value}
            ref={element => { buttonRefs.current[index] = element }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(segment.value)}
            className={`relative flex-1 min-h-10 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150 ${
              isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {isSelected && (
              <motion.span
                layoutId={indicatorId}
                transition={SPRING.snappy}
                className="absolute inset-0 rounded-[10px] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
              />
            )}
            <span className="relative">{segment.label}</span>
          </button>
        )
      })}
    </div>
  )
}
