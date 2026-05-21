'use client'

import { useState } from 'react'
import SetRow from '@/components/workout/SetRow'
import RestTimer from '@/components/workout/RestTimer'
import EquipmentSwapSheet from '@/components/workout/EquipmentSwapSheet'
import { formatRestSecs } from '@/lib/utils'
import type { Exercise, SetLog, LastSessionData } from '@/types'

interface Props {
  exercise: Exercise
  sessionId: string
  lastSession: LastSessionData | null
  onSetLogged: (log: Omit<SetLog, 'id' | 'logged_at'>) => Promise<{ isPR: boolean }>
  nextExerciseName?: string
  initialLoggedRows?: number[]
}

const REST_PRESETS = [30, 45, 60, 75, 90, 120, 150, 180, 210, 240]

function parseDefaultReps(reps: string): number {
  if (reps === 'AMRAP') return 0
  const match = reps.match(/(\d+)/)
  return match ? parseInt(match[1]) : 10
}

function suggestWeight(lastWeight: number): number {
  return Math.round((lastWeight + 2.5) * 2) / 2
}

export default function ExerciseCard({
  exercise, sessionId, lastSession, onSetLogged, nextExerciseName, initialLoggedRows = [],
}: Props) {
  const totalSets = exercise.sets * (exercise.isUnilateral ? 2 : 1)
  const [loggedSets, setLoggedSets] = useState<Set<number>>(new Set(initialLoggedRows))
  const [prSets, setPrSets] = useState<Set<number>>(new Set())
  const [restOpen, setRestOpen] = useState(false)
  const [restKey, setRestKey] = useState(0)
  const [restSecs, setRestSecs] = useState(exercise.restSecs)
  const [showRestPicker, setShowRestPicker] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [swappedName, setSwappedName] = useState<string | null>(null)

  const displayName = swappedName ?? exercise.name
  const defaultReps = parseDefaultReps(exercise.reps)
  const defaultWeight = lastSession?.avgWeight ?? exercise.defaultWeightKg
  const isAmrap = exercise.reps === 'AMRAP'
  const isSwapped = swappedName !== null
  const allLogged = loggedSets.size >= totalSets
  const sideLabels = exercise.isUnilateral ? ['left', 'right'] : [null]

  // Calisthenics progression check: all sets ≥ 8 reps → suggest reducing assistance
  const assistanceReady = exercise.isAssistance &&
    lastSession?.perSetReps != null &&
    lastSession.perSetReps.length >= exercise.sets &&
    lastSession.perSetReps.every(s => s.reps >= 8)

  async function handleLog(rowIdx: number, reps: number, weight: number, rpe: 1 | 2 | 3) {
    if (loggedSets.has(rowIdx)) return
    const side = exercise.isUnilateral ? (rowIdx % 2 === 0 ? 'left' : 'right') : null
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
    setRestKey(k => k + 1)
    setRestOpen(true)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: allLogged
          ? '1px solid rgba(16,185,129,0.4)'
          : isSwapped
            ? '1px solid rgba(245,158,11,0.4)'
            : '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      <div className="px-4 pt-4 pb-3">
        {/* Knee warning */}
        {exercise.hasKneeWarning && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--destructive)' }}>
              ⚠ Stop at 90° — Knee Protocol
            </span>
          </div>
        )}

        {/* Mandatory badge */}
        {exercise.isMandatory && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
            style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
            🔒 Pelvic Floor — Mandatory
          </div>
        )}

        {/* Swap indicator */}
        {isSwapped && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl mb-2"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--accent-orange)' }}>
              ↕ Alternative for {exercise.name}
            </span>
            <button onClick={() => setSwappedName(null)} className="text-xs font-semibold ml-3"
              style={{ color: 'var(--accent-orange)' }}>
              Revert ↩
            </button>
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {exercise.sets}×{exercise.reps}
              </span>
              {/* Tappable rest duration — opens preset picker */}
              <button
                onClick={() => setShowRestPicker(v => !v)}
                className="text-xs underline decoration-dotted underline-offset-2"
                style={{ color: showRestPicker ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}
              >
                {formatRestSecs(restSecs)} rest
              </button>
            </div>

            {/* Rest preset picker */}
            {showRestPicker && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {REST_PRESETS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setRestSecs(s); setShowRestPicker(false) }}
                    className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: restSecs === s ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
                      color: restSecs === s ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                      border: `1px solid ${restSecs === s ? 'rgba(59,130,246,0.35)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {formatRestSecs(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {exercise.alternatives.length > 0 && (
            <button
              onClick={() => setSwapOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs flex-shrink-0"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
            >
              {isSwapped ? 'Change?' : 'Busy?'}
            </button>
          )}
        </div>

        {/* AMRAP per-set history */}
        {isAmrap && lastSession?.perSetReps?.length ? (
          <div className="mt-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Last session @ {lastSession.avgWeight}kg assistance:
            </p>
            <div className="flex gap-3">
              {lastSession.perSetReps.map(s => (
                <span key={s.setNum} className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  S{s.setNum}: <span style={{ color: 'var(--accent-blue)' }}>{s.reps}</span>
                </span>
              ))}
            </div>
            {assistanceReady && (
              <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--accent-emerald)' }}>
                ↓ All sets 8+ reps — try {lastSession.avgWeight - 5}kg assistance today
              </p>
            )}
          </div>
        ) : !isAmrap && lastSession ? (
          /* Standard progressive overload nudge */
          <div className="mt-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Last: {lastSession.avgReps} reps @ {lastSession.avgWeight}kg
            </span>
            <span className="ml-2 font-semibold" style={{ color: 'var(--accent-blue)' }}>
              → Try {suggestWeight(lastSession.avgWeight)}kg today
            </span>
          </div>
        ) : null}

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
                defaultWeight={defaultWeight}
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

      {/* Rest timer */}
      <RestTimer
        key={restKey}
        open={restOpen}
        onClose={() => setRestOpen(false)}
        restSecs={restSecs}
        nextExerciseName={nextExerciseName}
      />

      {/* Equipment swap */}
      <EquipmentSwapSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        exerciseName={exercise.name}
        alternatives={exercise.alternatives}
        onSwap={name => { setSwappedName(name); setSwapOpen(false) }}
        currentSwap={swappedName}
      />
    </div>
  )
}
