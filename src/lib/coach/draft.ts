import { MIN_EXERCISES_PER_DAY, llmDraftSchema, type LlmDraft } from './schema'

export type LlmDraftParse = { ok: true; draft: LlmDraft } | { ok: false; issues: string[] }

const CODE_FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/

function parseJson(text: string): { ok: true; json: unknown } | { ok: false } {
  const trimmed = text.trim()
  try {
    return { ok: true, json: JSON.parse(CODE_FENCE.exec(trimmed)?.[1] ?? trimmed) }
  } catch {
    return { ok: false }
  }
}

/**
 * Validates a model reply against the draft schema. Unknown exercise ids are dropped (deterministic repair);
 * the draft is rejected if that leaves a day too short, or if the day count or weekdays are wrong.
 */
export function parseLlmDraft(text: string, candidateIds: ReadonlySet<string>, daysPerWeek: number): LlmDraftParse {
  const parsedJson = parseJson(text)
  if (!parsedJson.ok) return { ok: false, issues: ['The reply was not valid JSON.'] }
  const parsed = llmDraftSchema.safeParse(parsedJson.json)
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) }
  }

  const days = parsed.data.days.map(day => ({
    ...day,
    exercises: day.exercises.filter(exercise => candidateIds.has(exercise.exerciseId)),
  }))
  const issues = [
    ...(days.length === daysPerWeek ? [] : [`Expected exactly ${daysPerWeek} days, got ${days.length}.`]),
    ...(new Set(days.map(day => day.dayOfWeek)).size === days.length ? [] : ['Each dayOfWeek must be used once.']),
    ...days
      .filter(day => day.exercises.length < MIN_EXERCISES_PER_DAY)
      .map(day => `Day ${day.dayOfWeek} needs at least ${MIN_EXERCISES_PER_DAY} exercises from the candidate list.`),
  ]
  return issues.length === 0 ? { ok: true, draft: { ...parsed.data, days } } : { ok: false, issues }
}
