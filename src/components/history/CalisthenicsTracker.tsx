'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

import type { CalisthenicsPoint } from '@/lib/analytics/calisthenics'

interface Props {
  data: CalisthenicsPoint[]
  /** One line per assisted exercise; `key` matches the data point field. */
  series: Array<{ key: string; label: string }>
}

const LINE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#A855F7', '#EAB308']

export default function CalisthenicsTracker({ data, series }: Props) {
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
          {series.map(({ key, label }, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={LINE_COLORS[index % LINE_COLORS.length]}
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
