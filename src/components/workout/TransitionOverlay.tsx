'use client'

import { useEffect, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useSound } from '@/hooks/useSound'

interface Props {
  show: boolean
  nextExerciseName: string
  onComplete: () => void
}

export default function TransitionOverlay({ show, nextExerciseName, onComplete }: Props) {
  const { playChime } = useSound()
  const { remaining, start, reset } = useTimer(8, onComplete)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      reset(8)
      playChime()
      setTimeout(() => start(), 50)
    } else {
      setVisible(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: 'rgba(15,15,15,0.97)' }}
    >
      <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Up next
      </p>
      <p className="text-2xl font-semibold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
        {nextExerciseName}
      </p>
      <div className="text-6xl font-mono font-bold" style={{ color: 'var(--accent-emerald)' }}>
        {Math.ceil(remaining)}
      </div>
      <button
        onClick={onComplete}
        className="mt-10 text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Skip transition
      </button>
    </div>
  )
}
