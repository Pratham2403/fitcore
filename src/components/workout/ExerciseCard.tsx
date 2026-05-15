'use client'

import { useState } from 'react'
import SetRow from '@/components/workout/SetRow'
import RestTimer from '@/components/workout/RestTimer'
import EquipmentSwapSheet from '@/components/workout/EquipmentSwapSheet'
import type { Exercise, SetLog } from '@/types'

interface LastSessionData {
  avgWeight: number
  avgReps: number
}

interface Props {
  exercise: Exercise
  sessionId: string
  lastSession: LastSessionData | null
  onSetLogged: (log: Omit<SetLog, 'id' | 'logged_at'>) => Promise<{ isPR: boolean }>
  nextExerciseName?: string
}

function parseDefaultReps(reps: string): number {
  if (reps === 'AMRAP') return 0
  const match = reps.match(/(\d+)/)
  return match ? parseInt(match[1]) : 10
}

function suggestWeight(lastWeight: number): number {
  return Math.round((lastWeight + 2.5) * 2) / 2
}

export default function ExerciseCard({ exercise, sessionId, lastSession, onSetLogged, nextExerciseName }: Props) {
  const totalSets = exercise.sets * (exercise.isUnilateral ? 2 : 1)
  const [loggedSets, setLoggedSets] = useState<Set<number>>(new Set())
  const [prSets, setPrSets] = useState<Set<number>>(new Set())
  const [restOpen, setRestOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [swappedName, setSwappedName] = useState<string | null>(null)
  const [lastRestSecs] = useState(exercise.restSecs)

  const displayName = swappedName ?? exercise.name
  const defaultReps = parseDefaultReps(exercise.reps)
  const suggestedWeight = lastSession ? suggestWeight(lastSession.avgWeight) : 20

  async function handleLog(rowIdx: number, reps: number, weight: number, rpe: 1 | 2 | 3) {
    if (loggedSets.has(rowIdx)) return

    const side = exercise.isUnilateral
      ? (rowIdx % 2 === 0 ? 'left' : 'right')
      : null

    const result = await onSetLogged({
      session_id: sessionId,
      exercise_name: displayName,
      set_number: Math.floor(rowIdx / (exercise.isUnilateral ? 2 : 1)) + 1,
      reps,
      weight_kg: weight,
      is_timed: exercise.isTimed,
      duration_secs: exercise.isTimed ? exercise.durationSecs : undefined,
      rpe,
      is_pr: false,
      side,
    })

    setLoggedSets(prev => new Set(Array.from(prev).concat(rowIdx)))
    if (result.isPR) setPrSets(prev => new Set(Array.from(prev).concat(rowIdx)))
    setRestOpen(true)
  }

  const allLogged = loggedSets.size >= totalSets
  const sideLabels = exercise.isUnilateral ? ['left', 'right'] : [null]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: allLogged ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        {/* Knee warning */}
        {exercise.hasKneeWarning && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--destructive)' }}>
              ⚠ Stop at 90° — Knee Protocol
            </span>
          </div>
        )}

        {/* Mandatory badge */}
        {exercise.isMandatory && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
            style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            🔒 Pelvic Floor — Mandatory
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {exercise.sets}×{exercise.reps} · {exercise.restSecs >= 60
                ? `${Math.floor(exercise.restSecs / 60)}:${String(exercise.restSecs % 60).padStart(2, '0')} rest`
                : `${exercise.restSecs}s rest`}
            </p>
          </div>

          {/* Machine busy button */}
          {exercise.alternatives.length > 0 && (
            <button
              onClick={() => setSwapOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs flex-shrink-0"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
            >
              Busy?
            </button>
          )}
        </div>

        {/* Progressive overload nudge */}
        {lastSession && (
          <div
            className="mt-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Last session: {lastSession.avgReps} reps @ {lastSession.avgWeight}kg
            </span>
            <span className="ml-2 font-semibold" style={{ color: 'var(--accent-blue)' }}>
              → Try {suggestedWeight}kg today
            </span>
          </div>
        )}

        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {exercise.notes}
        </p>
      </div>

      {/* Set rows */}
      <div className="px-4 pb-4 space-y-2">
        {Array.from({ length: exercise.sets }, (_, setIdx) =>
          sideLabels.map((side, sideIdx) => {
            const rowIdx = setIdx * sideLabels.length + sideIdx
            return (
              <SetRow
                key={`${setIdx}-${side ?? 'bilateral'}`}
                setNumber={setIdx + 1}
                defaultReps={defaultReps}
                defaultWeight={lastSession?.avgWeight ?? 20}
                isLogged={loggedSets.has(rowIdx)}
                isPR={prSets.has(rowIdx)}
                side={side as 'left' | 'right' | null}
                isTimed={exercise.isTimed}
                durationSecs={exercise.durationSecs}
                onLog={(reps, weight, rpe) => handleLog(rowIdx, reps, weight, rpe)}
              />
            )
          })
        )}
      </div>

      {/* Rest timer (bottom sheet) */}
      <RestTimer
        open={restOpen}
        onClose={() => setRestOpen(false)}
        restSecs={lastRestSecs}
        nextExerciseName={nextExerciseName}
      />

      {/* Equipment swap */}
      <EquipmentSwapSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        exerciseName={exercise.name}
        alternatives={exercise.alternatives}
        onSwap={setSwappedName}
      />
    </div>
  )
}
