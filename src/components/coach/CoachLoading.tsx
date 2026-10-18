'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { SparkIcon } from '@/components/ui/Icon'
import { ENTER, EXIT } from '@/components/ui/motion'

const STEP_INTERVAL_MS = 6000
const SPINNER_SIZE = 18

/** What the coach is doing, in order; shown on a timer because the server reports no progress. */
export const START_STEPS = [
  'Filtering exercises for your equipment',
  'Drafting your week',
  'Checking every exercise against your constraints',
] as const

export const REVISE_STEPS = [
  'Applying your decisions',
  'Redrafting your week',
  'Checking every exercise against your constraints',
] as const

/** Calm waiting card for a coach call; steps advance on a timer and stop at the last one. */
export default function CoachLoading({ title, steps }: { title: string; steps: readonly string[] }) {
  const [stepIndex, setStepIndex] = useState(0)
  const isLastStep = stepIndex >= steps.length - 1

  useEffect(() => {
    if (isLastStep) return
    const timer = setTimeout(() => setStepIndex(index => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [stepIndex, isLastStep])

  return (
    <Card padding="lg" className="flex flex-col items-center gap-4 py-10 text-center" aria-busy>
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--accent-emerald-line)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]">
        <SparkIcon size={26} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="flex min-h-6 items-center gap-2 text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
        <Spinner size={SPINNER_SIZE} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={stepIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: ENTER }}
            exit={{ opacity: 0, transition: EXIT }}
          >
            {steps[stepIndex]}…
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="max-w-xs text-xs text-[var(--text-tertiary)]">
        This usually takes 10–30 seconds. Keep this page open.
      </p>
    </Card>
  )
}
