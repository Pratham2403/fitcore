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
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAY_SESSIONS, DAY_OF_WEEK_MAP, FULL_BODY_WARMUP } from '@/lib/workoutData'
import { toISODate, getDayLabel } from '@/lib/utils'
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

const supabase = getSupabaseClient()

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
  const sessionCreated = useRef(false)

  const session = DAY_SESSIONS[dayType]

  // Check for a resumable draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) setPendingDraft(draft)
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

    const { data: sets } = await supabase
      .from('set_logs')
      .select('*')
      .eq('session_id', draft.sessionId)

    const rowMap: Record<string, number[]> = {}
    if (sets?.length) {
      setLoggedSets(sets as SetLog[])
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
    await supabase.from('workout_sessions').delete().eq('id', pendingDraft.sessionId)
    clearDraft()
    setPendingDraft(null)
  }

  // Create a new session after readiness check-in
  async function initSession(r: ReadinessData) {
    if (sessionCreated.current) return
    sessionCreated.current = true
    setReadiness(r)

    const wellnessScore = (r.sleep + r.energy + r.soreness + r.protein) / 4
    const { data } = await supabase.from('workout_sessions').insert({
      date: toISODate(),
      day_type: dayType,
      status: 'in_progress',
      readiness_sleep: r.sleep,
      readiness_energy: r.energy,
      readiness_soreness: r.soreness,
      readiness_protein: r.protein,
      wellness_score: wellnessScore,
    }).select().single()

    if (data) setSessionId(data.id)
    setPhase('warmup')
  }

  async function handleSkipReadiness() {
    if (sessionCreated.current) return
    sessionCreated.current = true
    const { data } = await supabase.from('workout_sessions').insert({
      date: toISODate(),
      day_type: dayType,
      status: 'in_progress',
    }).select().single()
    if (data) setSessionId(data.id)
    setPhase('warmup')
  }

  const handleSetLogged = useCallback(async (log: Omit<SetLog, 'id' | 'logged_at'>): Promise<{ isPR: boolean }> => {
    if (!sessionId) return { isPR: false }

    const { data: setData } = await supabase.from('set_logs').insert(log).select().single()
    if (setData) setLoggedSets(prev => [...prev, setData])

    let isPR = false
    if (log.weight_kg && log.reps) {
      const { data: existing } = await supabase
        .from('personal_records')
        .select('value')
        .eq('exercise_name', log.exercise_name)
        .eq('record_type', 'max_weight')
        .single()

      if (!existing || log.weight_kg > existing.value) {
        await supabase.from('personal_records').upsert({
          exercise_name: log.exercise_name,
          record_type: 'max_weight',
          value: log.weight_kg,
          set_on: toISODate(),
          session_id: sessionId,
        }, { onConflict: 'exercise_name,record_type' })
        isPR = true
        setPrCount(p => p + 1)
        if (setData) await supabase.from('set_logs').update({ is_pr: true }).eq('id', setData.id)
      }
    }

    return { isPR }
  }, [sessionId])

  // Finalize after post-workout mood is collected
  async function finalizeSession(workoutMood: 1 | 2 | 3, energyMood: 1 | 2 | 3) {
    if (!sessionId) return

    const durationMin = Math.round((Date.now() - sessionStartTime) / 60000)
    const totalVolume = loggedSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
    const wellnessScore = readiness ? (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4 : null

    await supabase.from('workout_sessions').update({
      status: 'completed',
      duration_min: durationMin,
      total_volume_kg: totalVolume,
      wellness_score: wellnessScore,
      post_mood_workout: workoutMood,
      post_mood_energy: energyMood,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    const today = toISODate()
    const yesterday = toISODate(new Date(Date.now() - 86400000))
    const { data: streakRow } = await supabase.from('streaks').select('*').single()

    if (streakRow) {
      let newStreak = 1
      if (streakRow.last_workout_date === yesterday) {
        newStreak = streakRow.current_streak + 1
      } else if (streakRow.last_workout_date === today) {
        newStreak = streakRow.current_streak
      }
      const newLongest = Math.max(newStreak, streakRow.longest_streak ?? 0)
      setStreak(newStreak)

      await supabase.from('streaks').update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_workout_date: today,
        total_sessions: (streakRow.total_sessions ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', streakRow.id)
    }

    clearDraft()
    setPhase('summary')
  }

  // Fetch last session data — includes per-set reps for AMRAP exercises
  useEffect(() => {
    async function fetchLastSets() {
      const result: Record<string, LastSessionData | null> = {}
      for (const ex of session.exercises) {
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(10)

        if (!sessions?.length) { result[ex.name] = null; continue }

        let found = false
        for (const s of sessions) {
          const { data: sets } = await supabase
            .from('set_logs')
            .select('reps, weight_kg, set_number')
            .eq('session_id', s.id)
            .eq('exercise_name', ex.name)
            .order('set_number', { ascending: true })

          if (sets?.length) {
            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
            const entry: LastSessionData = {
              avgWeight: avg(sets.map(r => r.weight_kg ?? 0)),
              avgReps: Math.round(avg(sets.map(r => r.reps ?? 0))),
            }
            if (ex.reps === 'AMRAP') {
              const bySet: Record<number, number> = {}
              for (const row of sets) {
                bySet[row.set_number] = Math.max(bySet[row.set_number] ?? 0, row.reps ?? 0)
              }
              entry.perSetReps = Object.entries(bySet)
                .map(([sn, reps]) => ({ setNum: Number(sn), reps }))
                .sort((a, b) => a.setNum - b.setNum)
            }
            result[ex.name] = entry
            found = true
            break
          }
        }
        if (!found) result[ex.name] = null
      }
      setLastSessionData(result)
    }
    fetchLastSets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayType])

  const durationMin = Math.round((Date.now() - sessionStartTime) / 60000)
  const totalVolume = loggedSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
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
        {phase === 'readiness' && (
          <DaySelector selected={dayType} onChange={d => { setDayType(d); sessionCreated.current = false }} />
        )}
      </div>

      {phase === 'readiness' && (
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
            />
          ))}
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
          <StretchSection exercises={session.stretch} onComplete={() => setPhase('post_mood')} />
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
