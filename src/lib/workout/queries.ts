'use server'

import { createClient } from '@/lib/supabase/server'
import type { DayType, LastSessionData } from '@/types'
import { DAY_SESSIONS } from '@/lib/workoutData'

/** Fetches the most recent completed set data for every exercise in the given day's session. */
export async function getLastSessionData(
  dayType: DayType,
): Promise<Record<string, LastSessionData | null>> {
  const supabase = await createClient()
  const session = DAY_SESSIONS[dayType]
  const result: Record<string, LastSessionData | null> = {}

  const { data: sessions } = await supabase
    .from('workout_sessions').select('id')
    .eq('status', 'completed').order('date', { ascending: false }).limit(10)

  if (!sessions?.length) {
    for (const ex of session.exercises) result[ex.name] = null
    return result
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  for (const ex of session.exercises) {
    let primaryEntry: LastSessionData | null = null
    const recentWeights: number[] = []

    for (const s of sessions) {
      if (primaryEntry && recentWeights.length >= 3) break

      const { data: sets } = await supabase
        .from('set_logs').select('reps, weight_kg, set_number')
        .eq('session_id', s.id).eq('exercise_name', ex.name)
        .order('set_number', { ascending: true })

      if (!sets?.length) continue

      const avgWeight = Math.round(avg(sets.map(r => r.weight_kg ?? 0)))

      if (!primaryEntry) {
        primaryEntry = {
          avgWeight,
          avgReps: Math.round(avg(sets.map(r => r.reps ?? 0))),
        }
        if (ex.reps === 'AMRAP') {
          const bySet: Record<number, number> = {}
          for (const row of sets) {
            bySet[row.set_number] = Math.max(bySet[row.set_number] ?? 0, row.reps ?? 0)
          }
          primaryEntry.perSetReps = Object.entries(bySet)
            .map(([sn, reps]) => ({ setNum: Number(sn), reps }))
            .sort((a, b) => a.setNum - b.setNum)
        }
      }

      recentWeights.push(avgWeight)
    }

    if (primaryEntry) {
      if (recentWeights.length >= 3) {
        // Plateau: weight unchanged across last 3 sessions (within 0.5kg tolerance)
        primaryEntry.isPlateaued = recentWeights.every(w => Math.abs(w - recentWeights[0]) <= 0.5)
      }
      result[ex.name] = primaryEntry
    } else {
      result[ex.name] = null
    }
  }

  return result
}
