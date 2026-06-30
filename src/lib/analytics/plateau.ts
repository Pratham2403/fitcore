export type PlateauSuggestionType = 'deload' | 'variation' | 'rep_shift'

export interface PlateauSuggestion {
  type: PlateauSuggestionType
  text: string
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2
}

/**
 * Returns a rotating plateau intervention. Cycles weekly so the user sees a different
 * strategy each session block: deload → variation (if available) → rep shift.
 */
export function getPlateauSuggestion(avgWeight: number, alternatives: string[]): PlateauSuggestion {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))
  const suggestionCount = alternatives.length > 0 ? 3 : 2
  const idx = weekNumber % suggestionCount

  if (idx === 0) {
    return {
      type: 'deload',
      text: `Drop to ${roundToHalf(avgWeight * 0.9)}kg — 12 reps for 2 sessions`,
    }
  }
  if (idx === 1 && alternatives.length > 0) {
    return {
      type: 'variation',
      text: `Try ${alternatives[0]} for 2 weeks to break the plateau`,
    }
  }
  return {
    type: 'rep_shift',
    text: `Switch to 10–12 reps at ${roundToHalf(avgWeight * 0.85)}kg`,
  }
}
