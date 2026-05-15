'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DaySelector from '@/components/workout/DaySelector'
import ReadinessCheckIn from '@/components/workout/ReadinessCheckIn'
import WarmupSection from '@/components/workout/WarmupSection'
import ExerciseCard from '@/components/workout/ExerciseCard'
import StretchSection from '@/components/workout/StretchSection'
import SessionSummary from '@/components/workout/SessionSummary'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAY_SESSIONS, DAY_OF_WEEK_MAP } from '@/lib/workoutData'
import { toISODate, getDayLabel } from '@/lib/utils'
import type { DayType, SetLog, ReadinessCheckIn as ReadinessData } from '@/types'

type Phase = 'readiness' | 'warmup' | 'workout' | 'stretch' | 'summary'

function getDefaultDayType(): DayType {
  const day = new Date().getDay()
  const mapped = DAY_OF_WEEK_MAP[day]
  return (mapped === 'rest' ? 'push_a' : mapped) as DayType
}

const supabase = getSupabaseClient()

export default function WorkoutPage() {
  const [dayType, setDayType] = useState<DayType>(getDefaultDayType)
  const [phase, setPhase] = useState<Phase>('readiness')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<ReadinessData | null>(null)
  const [loggedSets, setLoggedSets] = useState<SetLog[]>([])
  const [prCount, setPrCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [streak, setStreak] = useState(0)
  const sessionCreated = useRef(false)

  const session = DAY_SESSIONS[dayType]

  // Create session on readiness complete
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

  // Log a set and check for PR
  const handleSetLogged = useCallback(async (log: Omit<SetLog, 'id' | 'logged_at'>): Promise<{ isPR: boolean }> => {
    if (!sessionId) return { isPR: false }

    // Write set
    const { data: setData } = await supabase.from('set_logs').insert(log).select().single()
    if (setData) setLoggedSets(prev => [...prev, setData])

    // PR check
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

        // Also update set record
        if (setData) {
          await supabase.from('set_logs').update({ is_pr: true }).eq('id', setData.id)
        }
      }
    }

    return { isPR }
  }, [sessionId, supabase])

  // Complete session
  async function completeSession() {
    if (!sessionId) return

    const durationMin = Math.round((Date.now() - startTime) / 60000)
    const totalVolume = loggedSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
    const wellnessScore = readiness ? (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4 : null

    await supabase.from('workout_sessions').update({
      status: 'completed',
      duration_min: durationMin,
      total_volume_kg: totalVolume,
      wellness_score: wellnessScore,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    // Update streak
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

    setPhase('summary')
  }

  // Get last session data for progressive overload nudge
  const [lastSessionData, setLastSessionData] = useState<Record<string, { avgWeight: number; avgReps: number } | null>>({})

  useEffect(() => {
    async function fetchLastSets() {
      const result: Record<string, { avgWeight: number; avgReps: number } | null> = {}
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
            .select('reps, weight_kg')
            .eq('session_id', s.id)
            .eq('exercise_name', ex.name)

          if (sets?.length) {
            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
            result[ex.name] = {
              avgWeight: avg(sets.map(s => s.weight_kg ?? 0)),
              avgReps: Math.round(avg(sets.map(s => s.reps ?? 0))),
            }
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

  const durationMin = Math.round((Date.now() - startTime) / 60000)
  const totalVolume = loggedSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
  const wellnessScore = readiness ? (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4 : 2

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
      {/* Header + Day selector */}
      <div className="mb-4 space-y-3">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getDayLabel(dayType)}
        </h1>
        {phase === 'readiness' && (
          <DaySelector selected={dayType} onChange={d => { setDayType(d); sessionCreated.current = false }} />
        )}
      </div>

      {/* Phase: Readiness */}
      {phase === 'readiness' && (
        <ReadinessCheckIn onComplete={initSession} onSkip={handleSkipReadiness} />
      )}

      {/* Phase: Warmup */}
      {phase === 'warmup' && (
        <div className="space-y-4">
          <SectionHeader title="Warmup" subtitle={`${session.warmupDurationMins} min`} />
          <WarmupSection exercises={session.warmup} onComplete={() => setPhase('workout')} />
        </div>
      )}

      {/* Phase: Workout */}
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

      {/* Phase: Stretch */}
      {phase === 'stretch' && (
        <div className="space-y-4">
          <SectionHeader title="Cool-down Stretch" subtitle="5 min" />
          <StretchSection exercises={session.stretch} onComplete={completeSession} />
        </div>
      )}

      {/* Phase: Summary */}
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
