'use client'

import { useState } from 'react'
import { getDayLabel } from '@/lib/utils'
import type { DayType } from '@/types'

type Session = {
  id: string
  date: string
  day_type: string
  status: string
  duration_min?: number
  total_volume_kg?: number
  wellness_score?: number
}

interface Props {
  sessions: Session[]
}

export default function SessionList({ sessions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const completed = sessions.filter(s => s.status === 'completed')

  if (!completed.length) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No completed sessions yet. Get after it.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {completed.map(s => (
        <div key={s.id} className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {getDayLabel(s.day_type as DayType | 'rest')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>{expanded === s.id ? '▲' : '▼'}</span>
          </button>

          {expanded === s.id && (
            <div className="px-4 pb-4 grid grid-cols-3 gap-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <MiniStat label="Duration" value={s.duration_min ? `${s.duration_min}m` : '—'} />
              <MiniStat label="Volume" value={s.total_volume_kg ? `${Math.round(s.total_volume_kg).toLocaleString()}kg` : '—'} />
              <MiniStat label="Wellness" value={s.wellness_score ? s.wellness_score.toFixed(1) : '—'} />
            </div>
          )}
        </div>
      ))}
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
