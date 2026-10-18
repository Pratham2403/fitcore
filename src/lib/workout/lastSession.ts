import type { LastSessionData } from '@/types'

/** A logged working set, reduced to what last-session summaries need. */
export interface HistoricalSet {
  sessionId: string
  exerciseId: string | null
  exerciseName: string
  setNumber: number
  reps: number | null
  weightKg: number | null
}

/** Identifies an exercise in history: by catalog id, or by name for legacy rows logged without one. */
export interface ExerciseIdentity {
  exerciseId: string
  names: readonly string[]
  isAmrap: boolean
}

const PLATEAU_SESSION_COUNT = 3
const PLATEAU_TOLERANCE_KG = 0.5

const average = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export function matchesExercise(set: HistoricalSet, identity: ExerciseIdentity): boolean {
  if (set.exerciseId !== null) return set.exerciseId === identity.exerciseId
  return identity.names.includes(set.exerciseName)
}

/**
 * Summarises the most recent session that logged the exercise, and flags a plateau when the average
 * weight is unchanged across the last 3 sessions that logged it.
 * @param sessionIdsNewestFirst - completed sessions, newest first.
 */
export function summarizeLastSession(
  identity: ExerciseIdentity,
  sessionIdsNewestFirst: readonly string[],
  sets: readonly HistoricalSet[],
): LastSessionData | null {
  const exerciseSets = sets.filter(set => matchesExercise(set, identity))
  const sessionsWithSets = sessionIdsNewestFirst
    .map(sessionId => exerciseSets.filter(set => set.sessionId === sessionId))
    .filter(sessionSets => sessionSets.length > 0)
  if (sessionsWithSets.length === 0) return null

  const averageWeights = sessionsWithSets.slice(0, PLATEAU_SESSION_COUNT)
    .map(sessionSets => Math.round(average(sessionSets.map(set => set.weightKg ?? 0))))
  const latest = sessionsWithSets[0]
  const summary: LastSessionData = {
    avgWeight: averageWeights[0],
    avgReps: Math.round(average(latest.map(set => set.reps ?? 0))),
  }
  if (identity.isAmrap) {
    const bestRepsBySet = new Map<number, number>()
    for (const set of latest) bestRepsBySet.set(set.setNumber, Math.max(bestRepsBySet.get(set.setNumber) ?? 0, set.reps ?? 0))
    summary.perSetReps = Array.from(bestRepsBySet, ([setNum, reps]) => ({ setNum, reps })).sort((a, b) => a.setNum - b.setNum)
  }
  if (averageWeights.length >= PLATEAU_SESSION_COUNT) {
    summary.isPlateaued = averageWeights.every(weight => Math.abs(weight - averageWeights[0]) <= PLATEAU_TOLERANCE_KG)
  }
  return summary
}
