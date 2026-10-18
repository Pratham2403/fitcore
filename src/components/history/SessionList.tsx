'use client'

import { useState } from 'react'

const WORKOUT_MOOD: Record<number, string> = { 1: '😊 Smooth', 2: '💪 Solid', 3: '🔥 Brutal' }
const ENERGY_MOOD: Record<number, string> = { 1: '🪫 Drained', 2: '😐 Fine', 3: '⚡ Energized' }

type Session = {
  id: string
  date: string
  day_type: string | null
  workout_name: string | null
  /** Protocol of the session's workout template, when it still exists. */
  protocol: string | null
  status: string | null
  duration_min: number | null
  total_volume_kg: number | null
  wellness_score: number | null
  post_mood_workout: number | null
  post_mood_energy: number | null
}

type FilterGroup = 'all' | 'push' | 'pull' | 'legs' | 'recovery'

const FILTER_CHIPS: { key: FilterGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'push', label: 'Push' },
  { key: 'pull', label: 'Pull' },
  { key: 'legs', label: 'Legs' },
  { key: 'recovery', label: 'Recovery' },
]

interface Props {
  sessions: Session[]
}

export default function SessionList({ sessions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterGroup>('all')

  const completed = sessions.filter(s => s.status === 'completed')
  const filtered = filter === 'all'
    ? completed
    : completed.filter(s => s.protocol === filter)

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: filter === chip.key ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
              color: filter === chip.key ? 'var(--accent-blue)' : 'var(--text-tertiary)',
              border: `1px solid ${filter === chip.key ? 'rgba(59,130,246,0.35)' : 'var(--border)'}`,
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {completed.length === 0 ? 'No completed sessions yet. Get after it.' : 'No sessions match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {s.workout_name ?? 'Workout'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>{expanded === s.id ? '▲' : '▼'}</span>
              </button>

              {expanded === s.id && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="Duration" value={s.duration_min ? `${s.duration_min}m` : '—'} />
                    <MiniStat label="Volume" value={s.total_volume_kg ? `${Math.round(s.total_volume_kg).toLocaleString()}kg` : '—'} />
                    <MiniStat label="Wellness" value={s.wellness_score ? s.wellness_score.toFixed(1) : '—'} />
                  </div>
                  {(s.post_mood_workout || s.post_mood_energy) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {s.post_mood_workout && (
                        <MiniStat label="Session" value={WORKOUT_MOOD[s.post_mood_workout] ?? '—'} />
                      )}
                      {s.post_mood_energy && (
                        <MiniStat label="Energy" value={ENERGY_MOOD[s.post_mood_energy] ?? '—'} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-3 text-center">
      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  )
}
