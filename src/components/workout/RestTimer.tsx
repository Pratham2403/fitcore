'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import TimerRing from '@/components/workout/TimerRing'
import { useTimer } from '@/hooks/useTimer'
import { useSound } from '@/hooks/useSound'
import { ENTER, EXIT } from '@/components/ui/motion'
import { formatTime } from '@/lib/utils'

interface Props {
  restSecs: number
  /** What follows the rest, e.g. the other side of a unilateral set. */
  /** What follows the rest, e.g. the other side of a unilateral set. */
  nextUp?: string
  onClose: () => void
}

const ADJUST_STEP_SECS = 15
const CLOSE_AFTER_CHIME_MS = 1500
const REST_END_VIBRATION_MS = [200, 100, 200]
const RING_SIZE_PX = 48

/**
 * Non-modal rest countdown docked above the bottom nav, so the next set stays editable while resting.
 * Starts on mount; remount (new `key`) to restart it.
 */
export default function RestTimer({ restSecs, nextUp, onClose }: Props) {
  const { playChime } = useSound()
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>()
  const { remaining, isRunning, start, pause, adjust } = useTimer(restSecs, () => {
    playChime()
    navigator.vibrate?.(REST_END_VIBRATION_MS)
    closeTimeout.current = setTimeout(onClose, CLOSE_AFTER_CHIME_MS)
  })

  const startRef = useRef(start)
  startRef.current = start
  useEffect(() => {
    startRef.current()
    return () => clearTimeout(closeTimeout.current)
  }, [])

  return (
    <motion.div
      role="timer"
      aria-label="Rest timer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: ENTER }}
      exit={{ opacity: 0, y: 16, transition: EXIT }}
      className="fixed inset-x-0 z-40 mx-auto flex max-w-lg items-center gap-3 px-4 bottom-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-2 pr-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <button
          onClick={isRunning ? pause : start}
          aria-label={isRunning ? 'Pause rest' : 'Resume rest'}
          className="flex-shrink-0 rounded-full"
        >
          <TimerRing remaining={remaining} total={restSecs} size={RING_SIZE_PX} strokeWidth={4} showLabel={false} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xl font-semibold leading-none font-mono-nums" style={{ color: isRunning ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {formatTime(Math.ceil(remaining))}
          </p>
          <p className="mt-1 truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {nextUp ? `Rest · then ${nextUp}` : 'Rest'}
          </p>
        </div>
        <AdjustButton label={`−${ADJUST_STEP_SECS}`} ariaLabel={`Remove ${ADJUST_STEP_SECS} seconds`} onClick={() => adjust(-ADJUST_STEP_SECS)} />
        <AdjustButton label={`+${ADJUST_STEP_SECS}`} ariaLabel={`Add ${ADJUST_STEP_SECS} seconds`} onClick={() => adjust(ADJUST_STEP_SECS)} />
        <button
          onClick={onClose}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[var(--accent-blue)]"
        >
          Skip
        </button>
      </div>
    </motion.div>
  )
}

function AdjustButton({ label, ariaLabel, onClick }: { label: string; ariaLabel: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="min-h-11 min-w-11 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] font-mono text-sm text-[var(--text-secondary)] active:scale-[0.97] transition-transform duration-[var(--dur-1)]"
    >
      {label}
    </button>
  )
}
