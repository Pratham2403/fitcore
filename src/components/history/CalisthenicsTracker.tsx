'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DataPoint {
  date: string
  dip?: number
  pullup?: number
  chinup?: number
}

interface Props {
  data: DataPoint[]
}

const LINES = [
  { key: 'dip' as const, label: 'Dip', color: '#F97316' },
  { key: 'pullup' as const, label: 'Pull-up', color: '#3B82F6' },
  { key: 'chinup' as const, label: 'Chin-up', color: '#10B981' },
]

export default function CalisthenicsTracker({ data }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Log pull-ups, dips, or chin-ups to track progress.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>Assistance weight · lower = stronger</p>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}kg`}
          />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
            formatter={(v, name) => [`${v} kg`, name]}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          {LINES.map(({ key, label, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
