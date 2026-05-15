'use client'

import { formatTime } from '@/lib/utils'

interface Props {
  remaining: number
  total: number
  size?: number
  strokeWidth?: number
  color?: string
}

export default function TimerRing({ remaining, total, size = 96, strokeWidth = 6, color = 'var(--accent-emerald)' }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const offset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <span
        className="absolute font-mono text-lg font-semibold font-mono-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatTime(Math.ceil(remaining))}
      </span>
    </div>
  )
}
