'use client'

import { useState } from 'react'
import TimerRing from '@/components/workout/TimerRing'
import { useTimer } from '@/hooks/useTimer'
import type { StretchExercise } from '@/types'

interface Props {
  exercises: StretchExercise[]
  onComplete: () => void
}

export default function StretchSection({ exercises, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [done, setDone] = useState(false)

  const currentEx = exercises[currentIdx]

  const { remaining, isRunning, start, pause, reset } = useTimer(
    currentEx?.durationSecs ?? 30,
    () => {
      if (currentIdx < exercises.length - 1) {
        setCurrentIdx(i => i + 1)
        reset(exercises[currentIdx + 1]?.durationSecs ?? 30)
      } else {
        setDone(true)
        onComplete()
      }
    }
  )

  function goNext() {
    if (currentIdx < exercises.length - 1) {
      pause()
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      reset(exercises[nextIdx]?.durationSecs ?? 30)
    } else {
      setDone(true)
      onComplete()
    }
  }

  function goBack() {
    if (currentIdx <= 0) return
    pause()
    const prevIdx = currentIdx - 1
    setCurrentIdx(prevIdx)
    reset(exercises[prevIdx]?.durationSecs ?? 30)
  }

  if (done) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-2xl mb-2">🧘</p>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Stretch complete</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Recovery starts now. Good work today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Stretch {currentIdx + 1} / {exercises.length}
        </p>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{currentEx.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{currentEx.duration}</p>
          </div>
          <TimerRing remaining={remaining} total={currentEx.durationSecs} size={72} strokeWidth={5} color="var(--accent-blue)" />
        </div>

        <div className="flex gap-2 mt-4">
          {/* Back button */}
          {currentIdx > 0 && (
            <button
              onClick={goBack}
              className="px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={isRunning ? pause : start}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={goNext}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {currentIdx === exercises.length - 1 ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
