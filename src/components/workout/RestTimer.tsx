'use client'

import { useEffect } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import TimerRing from '@/components/workout/TimerRing'
import { useTimer } from '@/hooks/useTimer'
import { useSound } from '@/hooks/useSound'

interface Props {
  open: boolean
  onClose: () => void
  restSecs: number
  nextExerciseName?: string
  onComplete?: () => void
}

export default function RestTimer({ open, onClose, restSecs, nextExerciseName, onComplete }: Props) {
  const { playChime } = useSound()

  const { remaining, isRunning, start, pause, skip, adjust, reset } = useTimer(restSecs, () => {
    playChime()
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    onComplete?.()
  })

  useEffect(() => {
    if (open) {
      reset(restSecs)
      setTimeout(() => start(), 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, restSecs])

  return (
    <BottomSheet open={open} onClose={onClose} title="Rest">
      <div className="flex flex-col items-center gap-5">
        <TimerRing remaining={remaining} total={restSecs} size={120} strokeWidth={8} />

        {nextExerciseName && (
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Up next</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{nextExerciseName}</p>
          </div>
        )}

        {/* Adjust buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => adjust(-15)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            −15s
          </button>
          <button
            onClick={isRunning ? pause : start}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => adjust(15)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            +15s
          </button>
        </div>

        <button
          onClick={() => { skip(); onClose() }}
          className="text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Skip rest
        </button>
      </div>
    </BottomSheet>
  )
}
