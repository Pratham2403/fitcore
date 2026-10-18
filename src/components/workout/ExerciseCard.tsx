'use client'

import { useState } from 'react'
import SetRow from '@/components/workout/SetRow'
import TimedSetRow from '@/components/workout/TimedSetRow'
import { rowCountOf, setNumberOfRow, sideOfRow } from '@/components/workout/setRows'
import EquipmentSwapSheet from '@/components/workout/EquipmentSwapSheet'
import ConstraintWarningList from '@/components/workout/ConstraintWarningList'
import { Chip } from '@/components/ui/Chip'
import { ShieldIcon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { formatRestSecs } from '@/lib/utils'
import { getPlateauSuggestion } from '@/lib/analytics/plateau'
import type { Exercise, ExerciseAlternative, LastSessionData, LoggingMode } from '@/types'
import type { SetLogInput } from '@/lib/workout/schema'
import { resumedAlternative, type LoggedRow } from '@/lib/workout/resume'

interface Props {
  exercise: Exercise
  /** The plan exercise's last session; not shown while an alternative is swapped in. */
  lastSession: LastSessionData | null
  /** Persists a set; rejects when it could not be saved. */
  onSetLogged: (log: SetLogInput) => Promise<{ isPR: boolean }>
  /** Called the moment a set is logged so the page can start its rest timer; receives the card's logged rows. */
  onRestStart: (restSecs: number, loggedRows: readonly LoggedRow[]) => void
  /** Rows already saved this session, in logging order (when resuming); a latest row logged under an alternative restores that swap. */
  initialLoggedRows?: LoggedRow[]
  currentBodyweight: number
}

type SetValues = Pick<LoggedRow, 'reps' | 'weightKg' | 'durationSecs'>

const REST_PRESETS = [30, 45, 60, 75, 90, 120, 150, 180, 210, 240]
/** Hold target for a timed alternative swapped in for an untimed exercise, which has no hold length of its own. */
const DEFAULT_HOLD_SECS = 30

function parseDefaultReps(reps: string): number {
  if (reps === 'AMRAP') return 0
  const match = reps.match(/(\d+)/)
  return match ? parseInt(match[1]) : 10
}

function suggestWeight(lastWeight: number): number {
  return Math.round((lastWeight + 2.5) * 2) / 2
}

export default function ExerciseCard({
  exercise, lastSession: planLastSession, onSetLogged, onRestStart, initialLoggedRows = [], currentBodyweight,
}: Props) {
  const showToast = useToast()
  const [loggedRows, setLoggedRows] = useState<LoggedRow[]>(initialLoggedRows)
  const [restSecs, setRestSecs] = useState(exercise.restSecs)
  const [showRestPicker, setShowRestPicker] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [swapped, setSwapped] = useState<ExerciseAlternative | undefined>(
    () => resumedAlternative(exercise.alternatives, initialLoggedRows))

  const isSwapped = swapped !== undefined
  const activeMode: LoggingMode = swapped ?? exercise
  const activeExerciseId = swapped?.id ?? exercise.exerciseId
  const displayName = swapped?.name ?? exercise.name
  const lastSession = isSwapped ? null : planLastSession
  const modeOf = (catalogId: string): LoggingMode => exercise.alternatives.find(alt => alt.id === catalogId) ?? exercise
  const lastActiveRow = loggedRows.filter(row => row.exerciseId === activeExerciseId).at(-1)
  const defaultReps = lastActiveRow?.reps ?? parseDefaultReps(exercise.reps)
  const startingWeight = isSwapped ? 0 : exercise.defaultWeightKg
  const defaultWeight = lastActiveRow?.weightKg ?? lastSession?.avgWeight ??
    (activeMode.volumeType === 'bodyweight_full' ? currentBodyweight : startingWeight)
  const isAmrap = exercise.reps === 'AMRAP'
  const allLogged = loggedRows.length >= rowCountOf(exercise)
  const holdSecs = exercise.isTimed ? exercise.durationSecs ?? parseDefaultReps(exercise.reps) : DEFAULT_HOLD_SECS

  const plateauSuggestion = (!isAmrap && lastSession?.isPlateaued)
    ? getPlateauSuggestion(lastSession.avgWeight, exercise.alternatives.map(alt => alt.name))
    : null

  // Calisthenics progression check: all sets ≥ 8 reps → suggest reducing assistance
  const assistanceReady = exercise.isAssistance &&
    lastSession?.perSetReps != null &&
    lastSession.perSetReps.length >= exercise.sets &&
    lastSession.perSetReps.every(s => s.reps >= 8)

  // Optimistic: the row reads as logged and rest starts on tap; a failed save rolls the row back
  async function handleLog(rowIdx: number, values: SetValues, rpe?: 1 | 2 | 3) {
    if (loggedRows.some(row => row.rowIndex === rowIdx)) return
    const setNumber = setNumberOfRow(rowIdx, exercise.isUnilateral)
    const nextLoggedRows = [...loggedRows, { rowIndex: rowIdx, exerciseId: activeExerciseId, ...values, isPR: false }]
    setLoggedRows(nextLoggedRows)
    onRestStart(restSecs, nextLoggedRows)
    try {
      const { isPR } = await onSetLogged({
        exercise_name: displayName,
        exercise_id: activeExerciseId,
        block_type: 'working',
        set_number: setNumber,
        reps: values.reps,
        weight_kg: values.weightKg,
        is_timed: activeMode.isTimed,
        volume_type: activeMode.volumeType,
        duration_secs: values.durationSecs,
        rpe,
        side: sideOfRow(rowIdx, exercise.isUnilateral),
      })
      if (isPR) setLoggedRows(prev => prev.map(row => (row.rowIndex === rowIdx ? { ...row, isPR } : row)))
    } catch {
      setLoggedRows(prev => prev.filter(row => row.rowIndex !== rowIdx))
      showToast(`${displayName} set ${setNumber} wasn’t saved — tap Log to retry.`, 'error')
    }
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
        {/* Constraint warnings — cap_rom is a hard, non-dismissable limit */}
        {exercise.warnings.length > 0 && (
          <div className="mb-3">
            <ConstraintWarningList warnings={exercise.warnings} />
          </div>
        )}

        {exercise.isMandatory && (
          <div className="mb-3">
            <Chip tone="accent" icon={<ShieldIcon size={14} />}>Mandatory — don’t skip</Chip>
          </div>
        )}

        {/* Swap indicator */}
        {isSwapped && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl mb-2"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--accent-orange)' }}>
              ↕ Alternative for {exercise.name}
            </span>
            <button onClick={() => setSwapped(undefined)} className="text-xs font-semibold ml-3"
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
                {exercise.sets}×{activeMode.isTimed ? `${holdSecs}s` : exercise.reps}
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
        ) : !isAmrap && !activeMode.isTimed && lastSession ? (
          lastSession.isPlateaued ? (
            /* Plateau suggestion */
            <div className="mt-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span style={{ color: 'var(--accent-orange)' }}>
                🔁 Plateau @ {lastSession.avgWeight}kg —
              </span>
              <span className="ml-1 font-semibold" style={{ color: 'var(--accent-orange)' }}>
                {plateauSuggestion?.text}
              </span>
            </div>
          ) : (
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
          )
        ) : null}

        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {exercise.notes}
        </p>
      </div>

      {/* Set rows */}
      <div className="px-4 pb-4 space-y-2">
        {Array.from({ length: rowCountOf(exercise) }, (_, rowIdx) => {
          const setNumber = setNumberOfRow(rowIdx, exercise.isUnilateral)
          const side = sideOfRow(rowIdx, exercise.isUnilateral)
          const loggedRow = loggedRows.find(row => row.rowIndex === rowIdx)
          const key = `${setNumber}-${side ?? 'bilateral'}`
          const rowMode = loggedRow ? modeOf(loggedRow.exerciseId) : activeMode
          return rowMode.isTimed ? (
            <TimedSetRow
              key={key}
              setNumber={setNumber}
              holdSecs={holdSecs}
              loggedRow={loggedRow}
              side={side}
              onLog={heldSecs => handleLog(rowIdx, { durationSecs: heldSecs })}
            />
          ) : (
            <SetRow
              key={key}
              setNumber={setNumber}
              defaultReps={defaultReps}
              defaultWeight={defaultWeight}
              tracksWeight={rowMode.volumeType !== 'reps_only'}
              loggedRow={loggedRow}
              side={side}
              onLog={(reps, weight, rpe) => handleLog(rowIdx, { reps, weightKg: weight }, rpe)}
            />
          )
        })}
      </div>

      {/* Equipment swap */}
      <EquipmentSwapSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        exerciseName={exercise.name}
        alternatives={exercise.alternatives}
        onSwap={alternative => { setSwapped(alternative); setSwapOpen(false) }}
        currentSwapId={swapped?.id ?? null}
      />
    </div>
  )
}
