'use client'

import type { DayType } from '@/types'

const DAYS: { dayType: DayType; label: string; short: string }[] = [
  { dayType: 'push_a', label: 'Push A', short: 'Mon' },
  { dayType: 'pull_a', label: 'Pull A', short: 'Tue' },
  { dayType: 'legs_a', label: 'Legs A', short: 'Wed' },
  { dayType: 'push_b', label: 'Push B', short: 'Thu' },
  { dayType: 'pull_b', label: 'Pull B', short: 'Fri' },
  { dayType: 'legs_b', label: 'Legs B', short: 'Sat' },
]

const DAY_COLORS: Record<DayType, string> = {
  push_a: '#3B82F6',
  push_b: '#3B82F6',
  pull_a: '#10B981',
  pull_b: '#10B981',
  legs_a: '#F59E0B',
  legs_b: '#F59E0B',
}

interface Props {
  selected: DayType
  onChange: (dayType: DayType) => void
}

export default function DaySelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {DAYS.map(d => {
        const active = d.dayType === selected
        const color = DAY_COLORS[d.dayType]
        return (
          <button
            key={d.dayType}
            onClick={() => onChange(d.dayType)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: active ? color : 'var(--bg-elevated)',
              color: active ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
            }}
          >
            <span className="block text-[10px] opacity-70">{d.short}</span>
            {d.label}
          </button>
        )
      })}
    </div>
  )
}
