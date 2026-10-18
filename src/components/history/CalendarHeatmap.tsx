'use client'

import type { Protocol } from '@/types'
import { toISODate } from '@/lib/utils'

type Session = { date: string; protocol: Protocol | null; workout_name: string | null; status: string | null }

interface Props {
  sessions: Session[]
}

const PROTOCOL_COLORS: Record<Protocol, string> = {
  push: '#3B82F6',
  pull: '#10B981',
  legs: '#F59E0B',
  recovery: '#8B5CF6',
  full_body: '#EC4899',
}

/** Sessions whose workout was since deleted. */
const UNKNOWN_PROTOCOL_COLOR = '#6B7280'

export default function CalendarHeatmap({ sessions }: Props) {
  const sessionMap = new Map(sessions.filter(s => s.status === 'completed').map(s => [s.date, s]))

  // Build 12 weeks of dates ending today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 83) // 12 weeks = 84 days

  // Align to Monday
  while (startDate.getDay() !== 1) startDate.setDate(startDate.getDate() - 1)

  const weeks: Date[][] = []
  const current = new Date(startDate)
  while (current <= today) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return (
    <div className="rounded-2xl p-4 overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="w-5 h-5 flex items-center justify-center text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const dateStr = toISODate(day)
              const session = sessionMap.get(dateStr)
              const isFuture = day > today
              const color = session ? (session.protocol ? PROTOCOL_COLORS[session.protocol] : UNKNOWN_PROTOCOL_COLOR) : null

              return (
                <div
                  key={di}
                  className="w-5 h-5 rounded-sm"
                  title={dateStr + (session ? ` · ${session.workout_name ?? 'Workout'}` : '')}
                  style={{
                    background: isFuture ? 'transparent' : color ?? 'var(--bg-elevated)',
                    opacity: isFuture ? 0.3 : 1,
                    border: isFuture ? 'none' : `1px solid ${color ? 'transparent' : 'var(--border)'}`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {[['Push', '#3B82F6'], ['Pull', '#10B981'], ['Legs', '#F59E0B'], ['Recovery', '#8B5CF6']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
