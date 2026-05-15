'use client'

import { useState, useEffect } from 'react'
import TimerRing from '@/components/workout/TimerRing'
import TransitionOverlay from '@/components/workout/TransitionOverlay'
import { useTimer } from '@/hooks/useTimer'
import { useSound } from '@/hooks/useSound'
import type { WarmupExercise } from '@/types'

interface Props {
  exercises: WarmupExercise[]
  onComplete: () => void
}

export default function WarmupSection({ exercises, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [autoFlow, setAutoFlow] = useState(true)
  const [showTransition, setShowTransition] = useState(false)
  const [done, setDone] = useState(false)
  const { playChime } = useSound()

  const currentEx = exercises[currentIdx]

  const { remaining, isRunning, start, pause, reset } = useTimer(
    currentEx?.durationSecs ?? 30,
    () => {
      if (!autoFlow) return
      playChime()
      const isLast = currentIdx === exercises.length - 1
      if (isLast) {
        setDone(true)
        onComplete()
      } else {
        setShowTransition(true)
      }
    }
  )

  useEffect(() => {
    reset(currentEx?.durationSecs ?? 30)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

  function goNext() {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      setDone(true)
      onComplete()
    }
  }

  function handleTransitionComplete() {
    setShowTransition(false)
    setCurrentIdx(i => i + 1)
    setTimeout(() => start(), 100)
  }

  if (done) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Warmup complete</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Every joint lubricated. Every major muscle group primed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Auto-flow toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {currentIdx + 1} / {exercises.length}
        </p>
        <button
          onClick={() => setAutoFlow(a => !a)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{
            background: autoFlow ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
            color: autoFlow ? 'var(--accent-emerald)' : 'var(--text-tertiary)',
            border: `1px solid ${autoFlow ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
          }}
        >
          {autoFlow ? '⚡ Auto-flow on' : '⚡ Auto-flow off'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ background: 'var(--accent-emerald)', width: `${((currentIdx) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Current exercise card */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-blue)', borderColor: 'rgba(59,130,246,0.4)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{currentEx.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{currentEx.joints}</p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{currentEx.how}</p>
            <div
              className="mt-2 px-3 py-1.5 rounded-xl text-xs leading-relaxed"
              style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              💡 {currentEx.tip}
            </div>
          </div>
          <TimerRing remaining={remaining} total={currentEx.durationSecs} size={72} strokeWidth={5} />
        </div>

        <div className="flex gap-2 mt-4">
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
            {currentIdx === exercises.length - 1 ? 'Finish warmup' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Upcoming exercises (dimmed) */}
      {exercises.slice(currentIdx + 1, currentIdx + 3).map((ex, i) => (
        <div
          key={i}
          className="rounded-xl px-4 py-3 opacity-40"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{ex.duration}</p>
        </div>
      ))}

      <TransitionOverlay
        show={showTransition}
        nextExerciseName={exercises[currentIdx + 1]?.name ?? ''}
        onComplete={handleTransitionComplete}
      />
    </div>
  )
}
