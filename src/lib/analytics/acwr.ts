export interface ACWRResult {
  acwr: number
  acuteLoad: number   // total volume in last 7 days
  chronicLoad: number // avg weekly volume across last 4 weeks
  shouldDeload: boolean
}

type Session = { date: string; total_volume_kg: number | null }

const DAY_MS = 86400000
const ACUTE_DAYS = 7
const CHRONIC_DAYS = 28
const CHRONIC_WEEKS = CHRONIC_DAYS / ACUTE_DAYS
const DELOAD_THRESHOLD = 1.3

/**
 * Computes the Acute:Chronic Workload Ratio from the last 28 days of sessions.
 * ACWR > 1.3 indicates a training spike that risks injury or overreaching; it is only flagged once there is
 * training before the acute week, since a user's first week always looks like a spike against an empty baseline.
 */
export function computeACWR(sessions: Session[]): ACWRResult {
  const now = Date.now()
  const weekAgoMs = now - ACUTE_DAYS * DAY_MS
  const fourWeeksAgoMs = now - CHRONIC_DAYS * DAY_MS
  const isAcute = (session: Session) => new Date(session.date).getTime() >= weekAgoMs

  const acuteLoad = sessions
    .filter(isAcute)
    .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0)

  const chronicLoad = sessions
    .filter(s => new Date(s.date).getTime() >= fourWeeksAgoMs)
    .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0) / CHRONIC_WEEKS

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0

  return {
    acwr: Math.round(acwr * 100) / 100,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    shouldDeload: acwr > DELOAD_THRESHOLD && sessions.some(session => !isAcute(session)),
  }
}
