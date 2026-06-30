'use server'

import { createClient } from '@/lib/supabase/server'
import { toISODate } from '@/lib/utils'
import { calculateTotalVolume } from '@/lib/workout/volume'
import type { SetLog, ReadinessCheckIn } from '@/types'

export async function createWorkoutSession(
  dayType: string,
  readiness: ReadinessCheckIn,
): Promise<string | null> {
  const supabase = await createClient()
  const wellnessScore = (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4
  const { data } = await supabase.from('workout_sessions').insert({
    date: toISODate(),
    day_type: dayType,
    status: 'in_progress',
    readiness_sleep: readiness.sleep,
    readiness_energy: readiness.energy,
    readiness_soreness: readiness.soreness,
    readiness_protein: readiness.protein,
    wellness_score: wellnessScore,
  }).select('id').single()
  return data?.id ?? null
}

export async function createWorkoutSessionEmpty(dayType: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('workout_sessions').insert({
    date: toISODate(),
    day_type: dayType,
    status: 'in_progress',
  }).select('id').single()
  return data?.id ?? null
}

export async function logSet(
  log: Omit<SetLog, 'id' | 'logged_at'>,
  sessionId: string,
): Promise<{ setId: string | null; isPR: boolean }> {
  const supabase = await createClient()
  const { data: setData } = await supabase.from('set_logs').insert(log).select('id').single()
  const setId = setData?.id ?? null

  let isPR = false

  if (log.weight_kg && log.weight_kg > 0 && log.reps) {
    const { data: existing } = await supabase.from('personal_records').select('value')
      .eq('exercise_name', log.exercise_name).eq('record_type', 'max_weight').single()
    if (!existing || log.weight_kg > existing.value) {
      await supabase.from('personal_records').upsert({
        exercise_name: log.exercise_name, record_type: 'max_weight',
        value: log.weight_kg, set_on: toISODate(), session_id: sessionId,
      }, { onConflict: 'exercise_name,record_type' })
      isPR = true
    }
  }

  if (!log.is_timed && log.reps && log.reps > 0 && !log.weight_kg) {
    const { data: existing } = await supabase.from('personal_records').select('value')
      .eq('exercise_name', log.exercise_name).eq('record_type', 'max_reps').single()
    if (!existing || log.reps > existing.value) {
      await supabase.from('personal_records').upsert({
        exercise_name: log.exercise_name, record_type: 'max_reps',
        value: log.reps, set_on: toISODate(), session_id: sessionId,
      }, { onConflict: 'exercise_name,record_type' })
      isPR = true
    }
  }

  if (log.is_timed && log.duration_secs && log.duration_secs > 0) {
    const { data: existing } = await supabase.from('personal_records').select('value')
      .eq('exercise_name', log.exercise_name).eq('record_type', 'max_duration_secs').single()
    if (!existing || log.duration_secs > existing.value) {
      await supabase.from('personal_records').upsert({
        exercise_name: log.exercise_name, record_type: 'max_duration_secs',
        value: log.duration_secs, set_on: toISODate(), session_id: sessionId,
      }, { onConflict: 'exercise_name,record_type' })
      isPR = true
    }
  }

  if (isPR && setId) {
    await supabase.from('set_logs').update({ is_pr: true }).eq('id', setId)
  }

  return { setId, isPR }
}

export async function finalizeSession(
  sessionId: string,
  loggedSets: SetLog[],
  readiness: ReadinessCheckIn | null,
  startTime: number,
  workoutMood: 1 | 2 | 3,
  energyMood: 1 | 2 | 3,
): Promise<number> {
  const supabase = await createClient()
  const durationMin = Math.round((Date.now() - startTime) / 60000)
  const totalVolume = calculateTotalVolume(loggedSets)
  const wellnessScore = readiness
    ? (readiness.sleep + readiness.energy + readiness.soreness + readiness.protein) / 4
    : null

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

  if (!streakRow) return 0

  let newStreak = 1
  if (streakRow.last_workout_date === yesterday) {
    newStreak = streakRow.current_streak + 1
  } else if (streakRow.last_workout_date === today) {
    newStreak = streakRow.current_streak
  }
  const newLongest = Math.max(newStreak, streakRow.longest_streak ?? 0)

  await supabase.from('streaks').update({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_workout_date: today,
    total_sessions: (streakRow.total_sessions ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', streakRow.id)

  return newStreak
}

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('workout_sessions').delete().eq('id', sessionId)
}

export async function fetchSessionSets(sessionId: string): Promise<SetLog[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('set_logs').select('*').eq('session_id', sessionId)
  return (data as SetLog[]) ?? []
}
