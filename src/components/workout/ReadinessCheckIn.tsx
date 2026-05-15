'use client'

import { useState } from 'react'
import type { ReadinessCheckIn } from '@/types'

interface Props {
  onComplete: (data: ReadinessCheckIn) => void
  onSkip: () => void
}

const METRICS = [
  { key: 'sleep' as const, label: 'Sleep quality', emoji: '😴' },
  { key: 'energy' as const, label: 'Energy level', emoji: '⚡' },
  { key: 'soreness' as const, label: 'Muscle soreness', emoji: '🦵' },
  { key: 'protein' as const, label: 'Hit ~150g protein yesterday?', emoji: '🥛' },
]

const RATINGS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'OK' },
  { value: 3, label: 'Good' },
]

export default function ReadinessCheckIn({ onComplete, onSkip }: Props) {
  const [ratings, setRatings] = useState<Record<string, 1 | 2 | 3>>({
    sleep: 2, energy: 2, soreness: 2, protein: 2,
  })

  function setRating(key: string, val: 1 | 2 | 3) {
    setRatings(r => ({ ...r, [key]: val }))
  }

  function handleSubmit() {
    onComplete({
      sleep: ratings.sleep,
      energy: ratings.energy,
      soreness: ratings.soreness,
      protein: ratings.protein,
    })
  }

  const avg = Object.values(ratings).reduce((a, b) => a + b, 0) / 4
  const allLow = Object.values(ratings).every(v => v === 1)

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>How are you feeling?</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Quick readiness check — 4 questions</p>

      <div className="space-y-4">
        {METRICS.map(m => (
          <div key={m.key}>
            <div className="flex items-center gap-2 mb-2">
              <span>{m.emoji}</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
            </div>
            <div className="flex gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRating(m.key, r.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    background: ratings[m.key] === r.value ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
                    color: ratings[m.key] === r.value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${ratings[m.key] === r.value ? 'transparent' : 'var(--border)'}`,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Wellness preview */}
      <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Wellness score</span>
        <span className="text-lg font-mono font-semibold" style={{ color: 'var(--accent-emerald)' }}>
          {avg.toFixed(1)}
        </span>
      </div>

      {allLow && (
        <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(245,158,11,0.3)' }}>
          Consider going lighter today. Listen to your body.
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent-emerald)', color: '#fff' }}
        >
          Let&apos;s go →
        </button>
      </div>
    </div>
  )
}
