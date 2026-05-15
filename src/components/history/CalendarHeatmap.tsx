'use client'

type Session = { date: string; day_type: string; status: string }

interface Props {
  sessions: Session[]
}

const DAY_COLORS: Record<string, string> = {
  push_a: '#3B82F6',
  push_b: '#3B82F6',
  pull_a: '#10B981',
  pull_b: '#10B981',
  legs_a: '#F59E0B',
  legs_b: '#F59E0B',
}

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
              const dateStr = day.toISOString().split('T')[0]
              const session = sessionMap.get(dateStr)
              const isFuture = day > today
              const color = session ? (DAY_COLORS[session.day_type] ?? '#10B981') : null

              return (
                <div
                  key={di}
                  className="w-5 h-5 rounded-sm"
                  title={dateStr + (session ? ` · ${session.day_type}` : '')}
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
        {[['Push', '#3B82F6'], ['Pull', '#10B981'], ['Legs', '#F59E0B']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
