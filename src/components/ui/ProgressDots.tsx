'use client'

import { motion } from 'framer-motion'
import { SPRING } from '@/components/ui/motion'

interface ProgressDotsProps {
  /** Number of steps. */
  total: number
  /** Zero-based index of the current step. */
  current: number
  /** Accessible name, e.g. "Onboarding progress". */
  label: string
}

/** Step indicator: completed steps are filled, the current step stretches into a pill. */
export default function ProgressDots({ total, current, label }: ProgressDotsProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${total}`}
      className="flex items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          key={index}
          layout
          transition={SPRING.snappy}
          className={`block h-1.5 rounded-full ${index === current ? 'w-6' : 'w-1.5'} ${
            index <= current ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--border)]'
          }`}
        />
      ))}
    </div>
  )
}
