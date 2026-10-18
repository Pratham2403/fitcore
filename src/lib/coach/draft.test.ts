import { describe, expect, it } from 'vitest'
import { parseLlmDraft } from './draft'

const CANDIDATES = new Set(['a', 'b', 'c', 'd'])

const exercise = (exerciseId: string) => ({ exerciseId, sets: 3, reps: '8–12', restSecs: 90, rationale: 'Builds strength.' })
const day = (dayOfWeek: number, ids: string[]) => ({
  dayOfWeek, name: 'Push', focus: 'Chest', protocol: 'push', exercises: ids.map(exercise),
})
const reply = (days: unknown[]) => JSON.stringify({ summary: 'A plan.', days })

describe('parseLlmDraft', () => {
  it('accepts a valid draft', () => {
    const result = parseLlmDraft(reply([day(1, ['a', 'b', 'c'])]), CANDIDATES, 1)
    expect(result.ok).toBe(true)
  })

  it('accepts JSON inside a code fence', () => {
    const result = parseLlmDraft('```json\n' + reply([day(1, ['a', 'b', 'c'])]) + '\n```', CANDIDATES, 1)
    expect(result.ok).toBe(true)
  })

  it('drops unknown exercise ids', () => {
    const result = parseLlmDraft(reply([day(1, ['a', 'b', 'c', 'made_up'])]), CANDIDATES, 1)
    expect(result.ok && result.draft.days[0]?.exercises.map(item => item.exerciseId)).toEqual(['a', 'b', 'c'])
  })

  it('rejects a day left with too few exercises', () => {
    const result = parseLlmDraft(reply([day(1, ['a', 'b', 'made_up'])]), CANDIDATES, 1)
    expect(result.ok).toBe(false)
  })

  it('rejects the wrong number of days', () => {
    expect(parseLlmDraft(reply([day(1, ['a', 'b', 'c'])]), CANDIDATES, 2).ok).toBe(false)
  })

  it('rejects duplicate weekdays', () => {
    expect(parseLlmDraft(reply([day(1, ['a', 'b', 'c']), day(1, ['b', 'c', 'd'])]), CANDIDATES, 2).ok).toBe(false)
  })

  it('rejects garbage and schema violations', () => {
    expect(parseLlmDraft('not json at all', CANDIDATES, 1).ok).toBe(false)
    expect(parseLlmDraft(JSON.stringify({ summary: 'x' }), CANDIDATES, 1).ok).toBe(false)
    expect(parseLlmDraft(reply([{ ...day(1, ['a', 'b', 'c']), protocol: 'arms' }]), CANDIDATES, 1).ok).toBe(false)
  })
})
