'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PRBadge from '@/components/workout/PRBadge'
import TimerRing from '@/components/workout/TimerRing'
import { CheckIcon } from '@/components/ui/Icon'
import { ENTER } from '@/components/ui/motion'
import { useSound } from '@/hooks/useSound'
import { toHoldProgress } from '@/lib/workout/hold'
import { formatTime } from '@/lib/utils'
import type { Side } from '@/types'
import type { LoggedRow } from '@/lib/workout/resume'

interface Props {
  setNumber: number
  /** Target hold length in seconds. */
  holdSecs: number
  /** The saved set this row shows; undefined while the hold is still to do. */
  loggedRow?: LoggedRow
  side: Side
  /** Receives the seconds actually held. */
  onLog: (heldSecs: number) => void
}

const HOLD_END_VIBRATION_MS = [200, 100, 200]
const LOG_HAPTIC_MS = 12
const RING_SIZE_PX = 44

/**
 * A timed set: the first tap starts the hold, which counts down to the target (chiming there) and then up as overtime;
 * the second tap logs the seconds actually held.
 */
export default function TimedSetRow({ setNumber, holdSecs, loggedRow, side, onLog }: Props) {
  const { playChime } = useSound()
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  // Set on Log so a failed save offers the same held value for retry
  const [stoppedAtMs, setStoppedAtMs] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(0)

  const isLogged = loggedRow !== undefined
  const hasStarted = startedAtMs !== null
  const isRunning = hasStarted && stoppedAtMs === null && !isLogged
  const hold = toHoldProgress(holdSecs, hasStarted ? (stoppedAtMs ?? nowMs) - startedAtMs : 0)
  const sideLabel = side ? (side === 'left' ? 'L' : 'R') : null

  useEffect(() => {
    if (!isRunning) return
    let frame = requestAnimationFrame(function tick() {
      setNowMs(Date.now())
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || !hold.hasReachedTarget) return
    playChime()
    navigator.vibrate?.(HOLD_END_VIBRATION_MS)
  }, [isRunning, hold.hasReachedTarget, playChime])

  function handleStart() {
    const now = Date.now()
    setNowMs(now)
    setStartedAtMs(now)
  }

  function handleLog() {
    if (startedAtMs === null) return
    const stoppedAt = stoppedAtMs ?? Date.now()
    setStoppedAtMs(stoppedAt)
    navigator.vibrate?.(LOG_HAPTIC_MS)
    onLog(toHoldProgress(holdSecs, stoppedAt - startedAtMs).heldSecs)
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-[var(--dur-2)]"
      style={{
        background: isLogged ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${isLogged ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
      }}
    >
      <span className="text-xs font-mono w-6 text-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {sideLabel ?? `S${setNumber}`}
      </span>

      {isLogged ? (
        <span className="flex-1 font-mono text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {loggedRow.durationSecs ?? 0}s held
        </span>
      ) : (
        <div role="timer" aria-label="Hold timer" className="flex flex-1 items-center gap-3">
          <TimerRing
            remaining={hold.hasReachedTarget ? holdSecs : hold.remainingSecs}
            total={holdSecs}
            size={RING_SIZE_PX}
            strokeWidth={4}
            showLabel={false}
          />
          <span className="font-mono text-base font-semibold font-mono-nums" style={{ color: isRunning ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {hold.hasReachedTarget ? `+${formatTime(Math.floor(hold.overtimeSecs))}` : formatTime(Math.ceil(hold.remainingSecs))}
          </span>
        </div>
      )}

      {!isLogged ? (
        <button
          onClick={hasStarted ? handleLog : handleStart}
          className="min-h-11 min-w-[64px] px-3 rounded-xl text-sm font-semibold flex-shrink-0 transition-transform duration-[var(--dur-1)] active:scale-[0.97]"
          style={hasStarted
            ? { background: 'var(--accent-emerald)', color: '#fff' }
            : { background: 'var(--bg-surface)', color: 'var(--accent-emerald)', border: '1px solid var(--border)' }}
        >
          {hasStarted ? 'Log' : 'Start'}
        </button>
      ) : loggedRow.isPR ? (
        <PRBadge />
      ) : (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ENTER}
          role="img"
          aria-label="Logged"
          className="grid min-h-11 min-w-[52px] place-items-center flex-shrink-0 text-[var(--accent-emerald)]"
        >
          <CheckIcon size={20} />
        </motion.span>
      )}
    </div>
  )
}
