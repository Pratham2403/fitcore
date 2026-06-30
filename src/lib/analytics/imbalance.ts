export interface ImbalanceResult {
  exerciseName: string
  leftAvg: number
  rightAvg: number
  /** Percentage difference relative to the stronger side */
  asymmetryPct: number
  dominantSide: 'left' | 'right'
}

type SetEntry = { exercise_name: string; side: string | null; weight_kg: number | null }

/**
 * Detects left/right strength imbalances in unilateral exercises.
 * @param minSetsPerSide - minimum logged sets per side before flagging (default 3)
 * @param thresholdPct - minimum asymmetry percentage to flag (default 10)
 */
export function detectImbalances(
  sets: SetEntry[],
  minSetsPerSide = 3,
  thresholdPct = 10,
): ImbalanceResult[] {
  const byExercise = new Map<string, { left: number[]; right: number[] }>()

  for (const set of sets) {
    if (!set.side || set.weight_kg === null || set.weight_kg === 0) continue
    if (!byExercise.has(set.exercise_name)) byExercise.set(set.exercise_name, { left: [], right: [] })
    const ex = byExercise.get(set.exercise_name)!
    if (set.side === 'left') ex.left.push(set.weight_kg)
    else ex.right.push(set.weight_kg)
  }

  const results: ImbalanceResult[] = []
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  for (const [exerciseName, { left, right }] of byExercise) {
    if (left.length < minSetsPerSide || right.length < minSetsPerSide) continue
    const leftAvg = avg(left)
    const rightAvg = avg(right)
    const maxAvg = Math.max(leftAvg, rightAvg)
    if (maxAvg === 0) continue
    const asymmetryPct = Math.abs(leftAvg - rightAvg) / maxAvg * 100
    if (asymmetryPct < thresholdPct) continue
    results.push({
      exerciseName,
      leftAvg: Math.round(leftAvg * 10) / 10,
      rightAvg: Math.round(rightAvg * 10) / 10,
      asymmetryPct: Math.round(asymmetryPct),
      dominantSide: leftAvg >= rightAvg ? 'left' : 'right',
    })
  }

  return results
}
