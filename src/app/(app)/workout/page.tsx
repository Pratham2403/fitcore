'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DaySelector from '@/components/workout/DaySelector'
import ReadinessCheckIn from '@/components/workout/ReadinessCheckIn'
import WarmupSection from '@/components/workout/WarmupSection'
import ExerciseCard from '@/components/workout/ExerciseCard'
import StretchSection from '@/components/workout/StretchSection'
import SessionSummary from '@/components/workout/SessionSummary'
import ResumeSessionModal from '@/components/workout/ResumeSessionModal'
import PostWorkoutMood from '@/components/workout/PostWorkoutMood'
import LiveMuscleMap from '@/components/workout/LiveMuscleMap'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAY_SESSIONS, DAY_OF_WEEK_MAP, FULL_BODY_WARMUP } from '@/lib/workoutData'
import { toISODate, getDayLabel } from '@/lib/utils'
import { createWorkoutSession, createWorkoutSessionEmpty, logSet as logSetAction, finalizeSession as finalizeSessionAction, deleteWorkoutSession, fetchSessionSets } from '@/lib/workout/actions'
import { getLastSessionData } from '@/lib/workout/queries'
import { calculateTotalVolume, calculateCoreReps } from '@/lib/workout/volume'
import type { DayType, SetLog, ReadinessCheckIn as ReadinessData, SessionDraft, LastSessionData } from '@/types'

type Phase = 'readiness' | 'warmup' | 'workout' | 'stretch' | 'post_mood' | 'summary'

const DRAFT_KEY = 'fitcore_session_draft'

function loadDraft(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as SessionDraft
    if (draft.savedAt !== toISODate()) return null
    return draft
  } catch {
    return null
  }
}

function saveDraft(draft: SessionDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

function getDefaultDayType(): DayType {
  const day = new Date().getDay()
  const mapped = DAY_OF_WEEK_MAP[day]
  return (mapped === 'rest' ? 'push_a' : mapped) as DayType
}

function rowIdxFromLog(setNumber: number, side: string | null, isUnilateral: boolean): number {
  if (isUnilateral) return (setNumber - 1) * 2 + (side === 'left' ? 0 : 1)
  return setNumber - 1
}

export default function WorkoutPage() {
  const [dayType, setDayType] = useState<DayType>(getDefaultDayType)
  const [phase, setPhase] = useState<Phase>('readiness')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<ReadinessData | null>(null)
  const [loggedSets, setLoggedSets] = useState<SetLog[]>([])
  const [loggedRowsByExercise, setLoggedRowsByExercise] = useState<Record<string, number[]>>({})
  const [prCount, setPrCount] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(Date.now())
  const [streak, setStreak] = useState(0)
  const [useFullBodyWarmup, setUseFullBodyWarmup] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null)
  const [lastSessionData, setLastSessionData] = useState<Record<string, LastSessionData | null>>({})
  const [currentBodyweight, setCurrentBodyweight] = useState(0)
  const [completedWarmups, setCompletedWarmups] = useState<string[]>([])
  const [completedStretches, setCompletedStretches] = useState<string[]>([])
  const sessionCreated = useRef(false)

  const session = DAY_SESSIONS[dayType]

  // Check for a resumable draft on mount; fetch latest bodyweight for bodyweight_full pre-fill
  useEffect(() => {
    const draft = loadDraft()
    if (draft) setPendingDraft(draft)

    getSupabaseClient().from('body_metrics').select('weight_kg').order('date', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data?.weight_kg) setCurrentBodyweight(data.weight_kg) })
  }, [])

  // Persist draft whenever phase transitions into a saveable phase
  useEffect(() => {
    if (!sessionId) return
    const saveable: Array<SessionDraft['phase']> = ['warmup', 'workout', 'stretch']
    if (!saveable.includes(phase as SessionDraft['phase'])) return
    saveDraft({
      sessionId,
      dayType,
      phase: phase as SessionDraft['phase'],
      readiness,
      startTime: sessionStartTime,
      savedAt: toISODate(),
    })
  }, [phase, sessionId, dayType, readiness, sessionStartTime])

  // Continue a session that was saved mid-workout
  async function handleContinue() {
    if (!pendingDraft) return
    const draft = pendingDraft
    setPendingDraft(null)

    setSessionId(draft.sessionId)
    setDayType(draft.dayType)
    setReadiness(draft.readiness)
    setSessionStartTime(draft.startTime)
    sessionCreated.current = true
    // phase is set AFTER the fetch so React batches it with loggedRowsByExercise —
    // ExerciseCards mount once, already seeing the correct initialLoggedRows

    const sets = await fetchSessionSets(draft.sessionId)

    const rowMap: Record<string, number[]> = {}
    if (sets.length) {
      setLoggedSets(sets)
      const daySession = DAY_SESSIONS[draft.dayType]
      for (const log of sets) {
        const ex = daySession.exercises.find(e => e.name === log.exercise_name)
        if (!ex) continue
        const rowIdx = rowIdxFromLog(log.set_number, log.side ?? null, ex.isUnilateral)
        if (!rowMap[log.exercise_name]) rowMap[log.exercise_name] = []
        if (!rowMap[log.exercise_name].includes(rowIdx)) rowMap[log.exercise_name].push(rowIdx)
      }
      setLoggedRowsByExercise(rowMap)
    }
    // Batched with above — single render, ExerciseCards see correct initialLoggedRows
    setPhase(draft.phase)
  }

  // Discard a saved session — delete from DB and clear localStorage
  async function handleDiscard() {
    if (!pendingDraft) return
    await deleteWorkoutSession(pendingDraft.sessionId)
    clearDraft()
    setPendingDraft(null)
  }

  // Create a new session after readiness check-in
  async function initSession(r: ReadinessData) {
    if (sessionCreated.current) return
    sessionCreated.current = true
    setReadiness(r)

    const id = await createWorkoutSession(dayType, r)
    if (id) setSessionId(id)
    setPhase('warmup')
  }

  async function handleSkipReadiness() {
    if (sessionCreated.current) return
    sessionCreated.current = true
    const id = await createWorkoutSessionEmpty(dayType)
    if (id) setSessionId(id)
    setPhase('warmup')
  }

  const handleSetLogged = useCallback(async (log: Omit<SetLog, 'id' | 'logged_at'>): Promise<{ isPR: boolean }> => {
    if (!sessionId) return { isPR: false }
    const { setId, isPR } = await logSetAction(log, sessionId)
    if (setId) setLoggedSets(prev => [...prev, { ...log, id: setId, logged_at: new Date().toISOString() } as SetLog])
    if (isPR) setPrCount(p => p + 1)
    return { isPR }
  }, [sessionId])

  // Finalize after post-workout mood is collected
  async function finalizeSession(workoutMood: 1 | 2 | 3, energyMood: 1 | 2 | 3) {
    if (!sessionId) return
    const newStreak = await finalizeSessionAction(sessionId, loggedSets, readiness, sessionStartTime, workoutMood, energyMood)
    setStreak(newStreak)
    clearDraft()
    setPhase('summary')
  }

  useEffect(() => {
    getLastSessionData(dayType).then(setLastSessionData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayType])

  const durationMin = Math.round((Date.now() - sessionStartTime) / 60000)
  const totalVolume = calculateTotalVolume(loggedSets)
  const coreReps = calculateCoreReps(loggedSets, session.exercises)
  const wellnessScore = readiness ? (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4 : 2

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      {pendingDraft && (
        <ResumeSessionModal
          draft={pendingDraft}
          onContinue={handleContinue}
          onDiscard={handleDiscard}
        />
      )}

      <div className="mb-4 space-y-3">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getDayLabel(dayType)}
        </h1>
        {phase === 'readiness' && !sessionId && (
          <DaySelector selected={dayType} onChange={d => { setDayType(d); sessionCreated.current = false }} />
        )}
      </div>

      {phase === 'readiness' && !sessionId && (
        <ReadinessCheckIn onComplete={initSession} onSkip={handleSkipReadiness} />
      )}

      {phase === 'warmup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Warmup" subtitle={useFullBodyWarmup ? '10 min · Full Body' : `${session.warmupDurationMins} min`} />
            <button
              onClick={() => setUseFullBodyWarmup(v => !v)}
              className="text-xs px-3 py-1.5 rounded-full flex-shrink-0"
              style={{
                background: useFullBodyWarmup ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
                color: useFullBodyWarmup ? 'var(--accent-orange)' : 'var(--text-tertiary)',
                border: `1px solid ${useFullBodyWarmup ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
              }}
            >
              {useFullBodyWarmup ? '✕ Day warmup' : '🌐 Full Body'}
            </button>
          </div>
          <WarmupSection
            exercises={useFullBodyWarmup ? FULL_BODY_WARMUP : session.warmup}
            onComplete={() => setPhase('workout')}
            onExerciseComplete={name => setCompletedWarmups(prev => prev.includes(name) ? prev : [...prev, name])}
          />
          <LiveMuscleMap
            phase="warmup"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={session.exercises}
            warmupExercises={useFullBodyWarmup ? FULL_BODY_WARMUP : session.warmup}
            stretchExercises={session.stretch}
          />
        </div>
      )}

      {phase === 'workout' && (
        <div className="space-y-4">
          <SectionHeader title="Working Sets" subtitle={`${session.exercises.length} exercises`} />
          {session.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.name}
              exercise={ex}
              sessionId={sessionId ?? ''}
              lastSession={lastSessionData[ex.name] ?? null}
              onSetLogged={handleSetLogged}
              nextExerciseName={session.exercises[i + 1]?.name}
              initialLoggedRows={loggedRowsByExercise[ex.name] ?? []}
              currentBodyweight={currentBodyweight}
            />
          ))}
          <LiveMuscleMap
            phase="workout"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={session.exercises}
            warmupExercises={session.warmup}
            stretchExercises={session.stretch}
          />
          <button
            onClick={() => setPhase('stretch')}
            className="w-full py-3 rounded-2xl text-sm font-semibold mt-2"
            style={{ background: 'var(--accent-emerald)', color: '#fff' }}
          >
            Finish sets → Stretch
          </button>
        </div>
      )}

      {phase === 'stretch' && (
        <div className="space-y-4">
          <SectionHeader title="Cool-down Stretch" subtitle="5 min" />
          <StretchSection
            exercises={session.stretch}
            onComplete={() => setPhase('post_mood')}
            onExerciseComplete={name => setCompletedStretches(prev => prev.includes(name) ? prev : [...prev, name])}
          />
          <LiveMuscleMap
            phase="stretch"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={session.exercises}
            warmupExercises={session.warmup}
            stretchExercises={session.stretch}
          />
        </div>
      )}

      {phase === 'post_mood' && (
        <PostWorkoutMood onComplete={finalizeSession} />
      )}

      {phase === 'summary' && (
        <SessionSummary
          dayLabel={getDayLabel(dayType)}
          durationMin={durationMin}
          totalVolume={totalVolume}
          prCount={prCount}
          wellnessScore={wellnessScore}
          streakCount={streak}
          coreReps={coreReps}
          onClose={() => window.location.href = '/'}
        />
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</span>
    </div>
  )
}
