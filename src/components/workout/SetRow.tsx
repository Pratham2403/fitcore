'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import PRBadge from '@/components/workout/PRBadge'
import { CheckIcon } from '@/components/ui/Icon'
import { ENTER } from '@/components/ui/motion'
import type { Side } from '@/types'
import type { LoggedRow } from '@/lib/workout/resume'

interface Props {
  setNumber: number
  /** Pre-filled reps; follows the latest logged set until the user edits this row. */
  defaultReps: number
  /** Pre-filled weight; follows the latest logged set until the user edits this row. */
  defaultWeight: number
  /** Whether the set records a weight; reps-only exercises log reps alone. */
  tracksWeight: boolean
  /** The saved set this row shows; undefined while the row is still editable. */
  loggedRow?: LoggedRow
  side: Side
  /** Receives the weight only when the set tracks one. */
  onLog: (reps: number, weight: number | undefined, rpe: 1 | 2 | 3) => void
}

const RPE_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😌', label: 'Easy' },
  2: { emoji: '😤', label: 'Hard' },
  3: { emoji: '🔥', label: 'Max' },
}

const LOG_HAPTIC_MS = 12

export default function SetRow({
  setNumber, defaultReps, defaultWeight, tracksWeight, loggedRow, side, onLog,
}: Props) {
  const [editedReps, setEditedReps] = useState<number | null>(null)
  const [editedWeight, setEditedWeight] = useState<number | null>(null)
  const [rpe, setRpe] = useState<1 | 2 | 3>(2)

  const isLogged = loggedRow !== undefined
  const reps = loggedRow?.reps ?? editedReps ?? defaultReps
  const weight = loggedRow?.weightKg ?? editedWeight ?? defaultWeight
  const sideLabel = side ? (side === 'left' ? 'L' : 'R') : null

  function handleLog() {
    navigator.vibrate?.(LOG_HAPTIC_MS)
    onLog(reps, tracksWeight ? weight : undefined, rpe)
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors duration-[var(--dur-2)]"
      style={{
        background: isLogged ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${isLogged ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
      }}
    >
      {/* Set # */}
      <span className="text-xs font-mono w-6 text-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {sideLabel ?? `S${setNumber}`}
      </span>

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={e => setEditedReps(Math.max(0, parseInt(e.target.value) || 0))}
        onFocus={e => e.target.select()}
        disabled={isLogged}
        aria-label="Reps"
        className="flex-1 min-h-11 text-center text-base font-mono font-semibold rounded-lg transition-colors"
        style={{
          background: isLogged ? 'transparent' : 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: isLogged ? 'none' : '1px solid var(--border)',
          width: 44,
          minWidth: 0,
        }}
      />

      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>reps</span>

      {tracksWeight && (
        <>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            step={0.5}
            onChange={e => setEditedWeight(Math.max(0, parseFloat(e.target.value) || 0))}
            onFocus={e => e.target.select()}
            disabled={isLogged}
            aria-label="Weight in kg"
            className="min-h-11 text-center text-base font-mono font-semibold rounded-lg transition-colors"
            style={{
              background: isLogged ? 'transparent' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: isLogged ? 'none' : '1px solid var(--border)',
              width: 56,
              minWidth: 0,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>kg</span>
        </>
      )}

      {/* RPE — shows emoji + label so user knows what they're selecting */}
      <button
        onClick={() => setRpe(prev => (prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3))}
        disabled={isLogged}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 flex-shrink-0"
        aria-label={`Effort: ${RPE_LABELS[rpe].label}. Tap to change`}
      >
        <span className="text-base leading-none">{RPE_LABELS[rpe].emoji}</span>
        <span className="text-[9px] leading-none" style={{ color: 'var(--text-tertiary)' }}>
          {RPE_LABELS[rpe].label}
        </span>
      </button>

      {/* Log / PR */}
      {!isLogged ? (
        <button
          onClick={handleLog}
          className="min-h-11 min-w-[52px] px-3 rounded-xl text-sm font-semibold flex-shrink-0 transition-transform duration-[var(--dur-1)] active:scale-[0.97]"
          style={{ background: 'var(--accent-emerald)', color: '#fff' }}
        >
          Log
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
