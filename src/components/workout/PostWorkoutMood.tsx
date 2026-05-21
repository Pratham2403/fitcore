'use client'

import { useState } from 'react'

interface Props {
  onComplete: (workoutMood: 1 | 2 | 3, energyMood: 1 | 2 | 3) => void
}

const WORKOUT_OPTIONS: { value: 1 | 2 | 3; emoji: string; label: string; sub: string }[] = [
  { value: 1, emoji: '😊', label: 'Smooth', sub: 'Good form, not a grind' },
  { value: 2, emoji: '💪', label: 'Solid', sub: 'Pushed hard, on point' },
  { value: 3, emoji: '🔥', label: 'Brutal', sub: 'Left everything in there' },
]

const ENERGY_OPTIONS: { value: 1 | 2 | 3; emoji: string; label: string }[] = [
  { value: 1, emoji: '🪫', label: 'Drained' },
  { value: 2, emoji: '😐', label: 'Fine' },
  { value: 3, emoji: '⚡', label: 'Energized' },
]

export default function PostWorkoutMood({ onComplete }: Props) {
  const [workoutMood, setWorkoutMood] = useState<1 | 2 | 3>(2)
  const [energyMood, setEnergyMood] = useState<1 | 2 | 3>(2)

  return (
    <div className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>How was the session?</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Two quick questions</p>
      </div>

      {/* Workout quality */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Session quality</p>
        <div className="flex gap-2">
          {WORKOUT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setWorkoutMood(opt.value)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors"
              style={{
                background: workoutMood === opt.value ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${workoutMood === opt.value ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
              }}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: workoutMood === opt.value ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                {opt.label}
              </span>
              <span className="text-[10px] text-center px-1 leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy after */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Energy level now</p>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEnergyMood(opt.value)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-colors"
              style={{
                background: energyMood === opt.value ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${energyMood === opt.value ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
              }}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: energyMood === opt.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onComplete(workoutMood, energyMood)}
        className="w-full py-3 rounded-2xl text-sm font-semibold"
        style={{ background: 'var(--accent-emerald)', color: '#fff' }}
      >
        See summary →
      </button>
    </div>
  )
}
