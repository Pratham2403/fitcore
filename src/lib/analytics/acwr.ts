export interface ACWRResult {
  acwr: number
  acuteLoad: number   // total volume in last 7 days
  chronicLoad: number // avg weekly volume across last 4 weeks
  shouldDeload: boolean
}

type Session = { date: string; total_volume_kg: number | null }

/**
 * Computes the Acute:Chronic Workload Ratio from the last 28 days of sessions.
 * ACWR > 1.3 indicates a training spike that risks injury or overreaching.
 */
export function computeACWR(sessions: Session[]): ACWRResult {
  const now = Date.now()
  const weekAgoMs = now - 7 * 86400000
  const fourWeeksAgoMs = now - 28 * 86400000

  const acuteLoad = sessions
    .filter(s => new Date(s.date).getTime() >= weekAgoMs)
    .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0)

  const chronicLoad = sessions
    .filter(s => new Date(s.date).getTime() >= fourWeeksAgoMs)
    .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0) / 4

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0

  return {
    acwr: Math.round(acwr * 100) / 100,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    shouldDeload: acwr > 1.3,
  }
}
