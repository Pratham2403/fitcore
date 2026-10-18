'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { z } from 'zod'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import DaySelector from '@/components/workout/DaySelector'
import ReadinessCheckIn from '@/components/workout/ReadinessCheckIn'
import WarmupSection from '@/components/workout/WarmupSection'
import ExerciseCard from '@/components/workout/ExerciseCard'
import StretchSection from '@/components/workout/StretchSection'
import SessionSummary from '@/components/workout/SessionSummary'
import ResumeSessionModal from '@/components/workout/ResumeSessionModal'
import PostWorkoutMood from '@/components/workout/PostWorkoutMood'
import LiveMuscleMap from '@/components/workout/LiveMuscleMap'
import RestTimer from '@/components/workout/RestTimer'
import { nextUpLabel } from '@/components/workout/setRows'
import Button, { buttonClassName } from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { ProgramIcon, SparkIcon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import { FULL_BODY_WARMUP } from '@/lib/protocols'
import { toISODate } from '@/lib/utils'
import { assertNoDbError } from '@/lib/errors'
import { getTodaysWorkout, getWeeklyProgram, getWorkoutPlan } from '@/lib/program/actions'
import { startWorkoutSession, logSet as logSetAction, finalizeSession as finalizeSessionAction, deleteWorkoutSession, fetchSessionSets } from '@/lib/workout/actions'
import { getLastSessionData } from '@/lib/workout/queries'
import { calculateTotalVolume, calculateCoreReps } from '@/lib/workout/volume'
import { toLoggedRowsByExercise } from '@/lib/workout/resume'
import type { DayOfWeek, SetLog, ReadinessCheckIn as ReadinessData, SessionDraft, LastSessionData, WeeklyProgram, WorkoutPlan } from '@/types'
import { readinessSchema, type SetLogInput } from '@/lib/workout/schema'

type Phase = 'readiness' | 'warmup' | 'workout' | 'stretch' | 'post_mood' | 'summary'

const DRAFT_KEY = 'fitcore_session_draft'

const SAVEABLE_PHASES = ['warmup', 'workout', 'stretch'] as const

const sessionDraftSchema = z.object({
  sessionId: z.string(),
  workoutId: z.string(),
  workoutName: z.string(),
  phase: z.enum(SAVEABLE_PHASES),
  readiness: readinessSchema.nullable(),
  startTime: z.number(),
  savedAt: z.string(),
}) satisfies z.ZodType<SessionDraft>

function isSaveablePhase(phase: Phase): phase is SessionDraft['phase'] {
  return SAVEABLE_PHASES.some(saveable => saveable === phase)
}

function loadDraft(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = sessionDraftSchema.safeParse(JSON.parse(raw))
    // Stale, malformed, or pre-DB (dayType-keyed) drafts cannot be resumed.
    if (!parsed.success || parsed.data.savedAt !== toISODate()) {
      clearDraft()
      return null
    }
    return parsed.data
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

const WORKOUT_QUERY_PARAM = 'workout'
const SECS_PER_MINUTE = 60

function localDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
  return days[new Date().getDay()]
}

export default function WorkoutPage() {
  return (
    <Suspense>
      <WorkoutSession />
    </Suspense>
  )
}

function WorkoutSession() {
  const requestedWorkoutId = useSearchParams().get(WORKOUT_QUERY_PARAM)
  const showToast = useToast()
  const [program, setProgram] = useState<WeeklyProgram | null>(null)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(true)
  const [selectingWorkoutId, setSelectingWorkoutId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('readiness')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<ReadinessData | null>(null)
  const [loggedSets, setLoggedSets] = useState<SetLog[]>([])
  const [sessionStartTime, setSessionStartTime] = useState(Date.now())
  const [streak, setStreak] = useState(0)
  const [useFullBodyWarmup, setUseFullBodyWarmup] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null)
  const [lastSessionData, setLastSessionData] = useState<Record<string, LastSessionData | null>>({})
  const [currentBodyweight, setCurrentBodyweight] = useState(0)
  const [completedWarmups, setCompletedWarmups] = useState<string[]>([])
  const [completedStretches, setCompletedStretches] = useState<string[]>([])
  const [rest, setRest] = useState<{ key: number; restSecs: number; nextUp?: string } | null>(null)
  const sessionCreated = useRef(false)

  // Check for a resumable draft on mount; load the requested (or today's) workout; fetch latest bodyweight for bodyweight_full pre-fill
  useEffect(() => {
    const draft = loadDraft()
    if (draft) setPendingDraft(draft)

    const initialPlan = requestedWorkoutId ? getWorkoutPlan(requestedWorkoutId) : getTodaysWorkout(localDayOfWeek())
    initialPlan
      .then(found => {
        if (!found && requestedWorkoutId) showToast('That workout couldn’t be found. Pick one below.', 'error')
        setPlan(found)
      })
      .catch(() => showToast('That workout couldn’t be loaded. Pick one below.', 'error'))
      .finally(() => setIsPlanLoading(false))
    getWeeklyProgram().then(setProgram)

    getSupabaseClient().from('body_metrics').select('weight_kg').order('date', { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => {
        assertNoDbError(error, 'load latest body weight')
        if (data?.weight_kg) setCurrentBodyweight(data.weight_kg)
      })
  }, [requestedWorkoutId, showToast])

  // Persist draft whenever phase transitions into a saveable phase
  useEffect(() => {
    if (!sessionId || !plan || !isSaveablePhase(phase)) return
    saveDraft({
      sessionId,
      workoutId: plan.id,
      workoutName: plan.name,
      phase,
      readiness,
      startTime: sessionStartTime,
      savedAt: toISODate(),
    })
  }, [phase, sessionId, plan, readiness, sessionStartTime])

  // Continue a session that was saved mid-workout
  async function handleContinue() {
    if (!pendingDraft) return
    const draft = pendingDraft
    setPendingDraft(null)

    const [sets, draftPlan] = await Promise.all([fetchSessionSets(draft.sessionId), getWorkoutPlan(draft.workoutId)])
    if (!draftPlan) {
      clearDraft()
      showToast('That workout no longer exists. Pick one below.', 'error')
      return
    }
    // Session state is applied only once the plan exists, in one batched render, so ExerciseCards
    // mount once with the correct initialLoggedRows
    sessionCreated.current = true
    setSessionId(draft.sessionId)
    setReadiness(draft.readiness)
    setSessionStartTime(draft.startTime)
    setPlan(draftPlan)
    setLoggedSets(sets)
    setPhase(draft.phase)
  }

  // Discard a saved session — delete from DB and clear localStorage
  async function handleDiscard() {
    if (!pendingDraft) return
    await deleteWorkoutSession(pendingDraft.sessionId)
    clearDraft()
    setPendingDraft(null)
  }

  // Create a new session after the readiness check-in (null when skipped)
  async function startSession(checkIn: ReadinessData | null) {
    if (sessionCreated.current || !plan) return
    sessionCreated.current = true
    try {
      setSessionId(await startWorkoutSession(plan.id, checkIn, toISODate()))
    } catch (error) {
      sessionCreated.current = false
      showToast('Couldn’t start the session. Please try again.', 'error')
      throw error
    }
    setReadiness(checkIn)
    setPhase('warmup')
  }

  const handleSetLogged = useCallback(async (log: SetLogInput): Promise<{ isPR: boolean }> => {
    if (!sessionId) throw new Error('Cannot log a set before the session exists')
    const { setId, isPR } = await logSetAction(log, sessionId)
    const loggedSet: SetLog = {
      ...log, id: setId, session_id: sessionId, block_type: log.block_type ?? 'working', side: log.side ?? null,
      is_pr: isPR, logged_at: new Date().toISOString(),
    }
    setLoggedSets(prev => [...prev, loggedSet])
    return { isPR }
  }, [sessionId])

  // Finalize after post-workout mood is collected
  async function finalizeSession(workoutMood: 1 | 2 | 3, energyMood: 1 | 2 | 3) {
    if (!sessionId) return
    let newStreak: number
    try {
      newStreak = await finalizeSessionAction(sessionId, { readiness, startTime: sessionStartTime, workoutMood, energyMood })
    } catch (error) {
      showToast('Couldn’t save the session. Your sets are safe — try again.', 'error')
      throw error
    }
    setStreak(newStreak)
    clearDraft()
    setPhase('summary')
  }

  const planId = plan?.id
  useEffect(() => {
    if (planId) getLastSessionData(planId).then(setLastSessionData)
  }, [planId])

  async function selectWorkout(workoutId: string) {
    sessionCreated.current = false
    setSelectingWorkoutId(workoutId)
    setPlan(null)
    setIsPlanLoading(true)
    try {
      const selected = await getWorkoutPlan(workoutId)
      if (!selected) showToast('That workout no longer exists.', 'error')
      setPlan(selected)
    } catch (error) {
      showToast('That workout couldn’t be loaded. Please try again.', 'error')
      throw error
    } finally {
      setIsPlanLoading(false)
      setSelectingWorkoutId(null)
    }
  }

  const durationMin = Math.round((Date.now() - sessionStartTime) / 60000)
  const totalVolume = calculateTotalVolume(loggedSets)
  const coreReps = calculateCoreReps(loggedSets, plan?.exercises ?? [])
  const prCount = loggedSets.filter(set => set.is_pr).length
  const loggedRowsByExercise = toLoggedRowsByExercise(loggedSets, plan?.exercises ?? [])
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
        {isPlanLoading ? <Skeleton className="h-7 w-48" /> : (
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {plan ? [plan.name, plan.focus].filter(Boolean).join(' — ') : 'Rest day'}
          </h1>
        )}
        {phase === 'readiness' && !sessionId && (
          program
            ? <DaySelector program={program} selectedWorkoutId={selectingWorkoutId ?? plan?.id ?? null} onChange={selectWorkout} />
            : <Skeleton className="h-[52px] w-40 rounded-[var(--radius-md)]" />
        )}
      </div>

      {isPlanLoading && <Skeleton className="h-96 rounded-2xl" />}

      {program?.workouts.length === 0 && (
        <EmptyState
          icon={<ProgramIcon />}
          title="No workouts yet"
          description="Create a workout or let the AI Coach draft your week, then come back here to train."
          action={
            <div className="flex flex-col gap-2">
              <Link href="/coach" className={buttonClassName()}><SparkIcon size={18} />Try the AI Coach</Link>
              <Link href="/program" className={buttonClassName({ variant: 'secondary' })}>Build manually</Link>
            </div>
          }
        />
      )}

      {!plan && !isPlanLoading && program !== null && program.workouts.length > 0 && (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Nothing scheduled today — pick a workout above to train anyway.
        </p>
      )}

      {plan && phase === 'readiness' && !sessionId && (
        <ReadinessCheckIn onComplete={startSession} onSkip={() => startSession(null)} />
      )}

      {plan && phase === 'warmup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Warmup" subtitle={useFullBodyWarmup ? '10 min · Full Body' : `${Math.round(plan.warmup.reduce((sum, w) => sum + w.durationSecs, 0) / SECS_PER_MINUTE)} min`} />
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
            exercises={useFullBodyWarmup ? FULL_BODY_WARMUP : plan.warmup}
            onComplete={() => setPhase('workout')}
            onExerciseComplete={name => setCompletedWarmups(prev => prev.includes(name) ? prev : [...prev, name])}
          />
          <LiveMuscleMap
            phase="warmup"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={plan.exercises}
            warmupExercises={useFullBodyWarmup ? FULL_BODY_WARMUP : plan.warmup}
            stretchExercises={plan.stretch}
          />
        </div>
      )}

      {plan && phase === 'workout' && (
        <div className="space-y-4">
          <SectionHeader title="Working Sets" subtitle={`${plan.exercises.length} exercises`} />
          {plan.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              lastSession={lastSessionData[ex.exerciseId] ?? null}
              onSetLogged={handleSetLogged}
              onRestStart={(restSecs, cardLoggedRows) => setRest(prev => ({
                key: (prev?.key ?? 0) + 1,
                restSecs,
                nextUp: nextUpLabel(plan.exercises, { ...loggedRowsByExercise, [ex.id]: cardLoggedRows }, i),
              }))}
              initialLoggedRows={loggedRowsByExercise[ex.id] ?? []}
              currentBodyweight={currentBodyweight}
            />
          ))}
          <LiveMuscleMap
            phase="workout"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={plan.exercises}
            warmupExercises={plan.warmup}
            stretchExercises={plan.stretch}
          />
          <Button size="lg" isFullWidth className="mt-2" onClick={() => { setRest(null); setPhase('stretch') }}>
            Finish sets, then stretch
          </Button>
          {/* Keeps the last card and the finish button clear of the docked rest timer */}
          <div aria-hidden className="h-20" />
          <AnimatePresence>
            {rest && (
              <RestTimer
                key={rest.key}
                restSecs={rest.restSecs}
                nextUp={rest.nextUp}
                onClose={() => setRest(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {plan && phase === 'stretch' && (
        <div className="space-y-4">
          <SectionHeader title="Cool-down Stretch" subtitle="5 min" />
          <StretchSection
            exercises={plan.stretch}
            onComplete={() => setPhase('post_mood')}
            onExerciseComplete={name => setCompletedStretches(prev => prev.includes(name) ? prev : [...prev, name])}
          />
          <LiveMuscleMap
            phase="stretch"
            loggedSets={loggedSets}
            completedWarmups={completedWarmups}
            completedStretches={completedStretches}
            exercises={plan.exercises}
            warmupExercises={plan.warmup}
            stretchExercises={plan.stretch}
          />
        </div>
      )}

      {phase === 'post_mood' && (
        <PostWorkoutMood onComplete={finalizeSession} />
      )}

      {phase === 'summary' && (
        <SessionSummary
          dayLabel={plan?.name ?? 'Workout'}
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
