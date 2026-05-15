'use client'

import { useEffect, useState } from 'react'

interface Props {
  show: boolean
}

export default function PRBadge({ show }: Props) {
  const [visible, setVisible] = useState(false)
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; size: number }[]>([])

  useEffect(() => {
    if (show) {
      setVisible(true)
      setParticles(Array.from({ length: 18 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#22C55E'][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 6,
      })))
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!visible) return null

  return (
    <div className="relative">
      {/* Confetti particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-sm pointer-events-none animate-bounce"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        />
      ))}
      {/* Badge */}
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: '#F59E0B', color: '#000' }}
      >
        ★ New PR
      </span>
    </div>
  )
}
