/** A logged set of an assisted (calisthenics) exercise. */
export interface AssistedSet {
  sessionId: string
  seriesKey: string
  weightKg: number | null
}

export type CalisthenicsPoint = { date: string } & Record<string, number | string>

/**
 * One point per session date with the lightest assistance used per exercise (lower = stronger), oldest first.
 * @param sessionDates - session id → ISO date.
 */
export function buildCalisthenicsSeries(sets: readonly AssistedSet[], sessionDates: Readonly<Record<string, string>>): CalisthenicsPoint[] {
  const byDate = new Map<string, Record<string, number>>()
  for (const set of sets) {
    const date = sessionDates[set.sessionId]
    if (!date || set.weightKg === null) continue
    const point = byDate.get(date) ?? {}
    const lightest = point[set.seriesKey]
    byDate.set(date, { ...point, [set.seriesKey]: lightest === undefined ? set.weightKg : Math.min(lightest, set.weightKg) })
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ ...values, date }))
}
