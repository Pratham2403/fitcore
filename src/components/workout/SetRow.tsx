'use client'

import { useState } from 'react'
import PRBadge from '@/components/workout/PRBadge'

interface Props {
  setNumber: number
  defaultReps: number
  defaultWeight: number
  isLogged: boolean
  isPR: boolean
  side?: 'left' | 'right' | null
  isTimed?: boolean
  durationSecs?: number
  onLog: (reps: number, weight: number, rpe: 1 | 2 | 3) => void
}

const RPE_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😌', label: 'Easy' },
  2: { emoji: '😤', label: 'Hard' },
  3: { emoji: '🔥', label: 'Max' },
}

export default function SetRow({
  setNumber, defaultReps, defaultWeight, isLogged, isPR,
  side, isTimed, durationSecs, onLog,
}: Props) {
  const [reps, setReps] = useState(defaultReps)
  const [weight, setWeight] = useState(defaultWeight)
  const [rpe, setRpe] = useState<1 | 2 | 3>(2)

  const sideLabel = side ? (side === 'left' ? 'L' : 'R') : null

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors"
      style={{
        background: isLogged ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${isLogged ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
      }}
    >
      {/* Set # */}
      <span className="text-xs font-mono w-6 text-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {sideLabel ?? `S${setNumber}`}
      </span>

      {/* Reps / Duration */}
      {isTimed ? (
        <span className="flex-1 text-xs text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
          {durationSecs}s hold
        </span>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => setReps(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={isLogged}
          className="flex-1 text-center text-sm font-mono font-semibold rounded-lg py-1 transition-colors"
          style={{
            background: isLogged ? 'transparent' : 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: isLogged ? 'none' : '1px solid var(--border)',
            width: 44,
            minWidth: 0,
          }}
        />
      )}

      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>reps</span>

      {/* Weight */}
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        step={0.5}
        onChange={e => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
        disabled={isLogged}
        className="text-center text-sm font-mono font-semibold rounded-lg py-1 transition-colors"
        style={{
          background: isLogged ? 'transparent' : 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: isLogged ? 'none' : '1px solid var(--border)',
          width: 52,
          minWidth: 0,
        }}
      />
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>kg</span>

      {/* RPE */}
      {!isLogged ? (
        <button
          onClick={() => setRpe(prev => (prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3))}
          className="text-lg leading-none"
          title={RPE_LABELS[rpe].label}
        >
          {RPE_LABELS[rpe].emoji}
        </button>
      ) : (
        <span className="text-lg leading-none">{RPE_LABELS[rpe].emoji}</span>
      )}

      {/* Log / PR */}
      {!isLogged ? (
        <button
          onClick={() => onLog(reps, weight, rpe)}
          className="px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
          style={{ background: 'var(--accent-emerald)', color: '#fff' }}
        >
          Log
        </button>
      ) : isPR ? (
        <PRBadge show={isPR} />
      ) : (
        <span className="text-emerald-500 text-xs">✓</span>
      )}
    </div>
  )
}
