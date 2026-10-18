import { describe, expect, it } from 'vitest'
import type { SetLog } from '@/types'
import { resumedAlternative, toLoggedRowsByExercise, type LoggedRow } from './resume'

const set = (overrides: Partial<SetLog>): SetLog => ({
  id: 'set', session_id: 'session', exercise_name: 'Renamed Label', exercise_id: 'Leg_Press', block_type: 'working',
  set_number: 1, is_timed: false, is_pr: false, side: null, logged_at: '2026-10-18T10:00:00Z', ...overrides,
})

const CRUNCHES = { id: 'Crunches', name: 'Crunches', isTimed: false, volumeType: 'reps_only' } as const
const EXERCISES = [
  { id: 'we-press', exerciseId: 'Leg_Press', isUnilateral: false, alternatives: [] },
  { id: 'we-lunge', exerciseId: 'Dumbbell_Lunges', isUnilateral: true, alternatives: [] },
  { id: 'we-plank', exerciseId: 'Plank', isUnilateral: false, alternatives: [CRUNCHES] },
]

const rowIndices = (rowsByExercise: ReturnType<typeof toLoggedRowsByExercise>) =>
  Object.fromEntries(Object.entries(rowsByExercise).map(([id, rows]) => [id, rows.map(row => row.rowIndex)]))

describe('toLoggedRowsByExercise', () => {
  it('keys rows by workout exercise id, matching sets by catalog id rather than display name', () => {
    expect(rowIndices(toLoggedRowsByExercise([set({ set_number: 2 })], EXERCISES))).toEqual({ 'we-press': [1] })
  })

  it('maps unilateral sides to interleaved rows', () => {
    const sets = [
      set({ exercise_id: 'Dumbbell_Lunges', set_number: 1, side: 'left', logged_at: '2026-10-18T10:00:00Z' }),
      set({ exercise_id: 'Dumbbell_Lunges', set_number: 1, side: 'right', logged_at: '2026-10-18T10:01:00Z' }),
      set({ exercise_id: 'Dumbbell_Lunges', set_number: 2, side: 'right', logged_at: '2026-10-18T10:02:00Z' }),
    ]
    expect(rowIndices(toLoggedRowsByExercise(sets, EXERCISES))).toEqual({ 'we-lunge': [0, 1, 3] })
  })

  it('ignores warmup/stretch blocks, unknown exercises and duplicate rows', () => {
    const sets = [set({ block_type: 'warmup' }), set({ exercise_id: 'Other' }), set({}), set({})]
    expect(rowIndices(toLoggedRowsByExercise(sets, EXERCISES))).toEqual({ 'we-press': [0] })
  })

  it('keeps the logged reps, weight, duration and PR flag of each row', () => {
    const sets = [
      set({ reps: 10, weight_kg: 22.5, is_pr: true }),
      set({ exercise_id: 'Plank', is_timed: true, duration_secs: 30 }),
    ]
    expect(toLoggedRowsByExercise(sets, EXERCISES)).toEqual({
      'we-press': [{ rowIndex: 0, exerciseId: 'Leg_Press', reps: 10, weightKg: 22.5, durationSecs: undefined, isPR: true }],
      'we-plank': [{ rowIndex: 0, exerciseId: 'Plank', reps: undefined, weightKg: undefined, durationSecs: 30, isPR: false }],
    })
  })

  it('orders rows by logging time so the last row is the one to carry forward', () => {
    const sets = [
      set({ set_number: 2, reps: 8, logged_at: '2026-10-18T10:05:00+00:00' }),
      set({ set_number: 1, reps: 10, logged_at: '2026-10-18T10:01:00.000Z' }),
    ]
    expect(toLoggedRowsByExercise(sets, EXERCISES)['we-press'].map(row => row.reps)).toEqual([10, 8])
  })
})

describe('toLoggedRowsByExercise with swapped-in alternatives', () => {
  it('files a set logged under an alternative on the plan exercise it stood in for, keeping its catalog id', () => {
    const sets = [
      set({ exercise_id: 'Plank', is_timed: true, duration_secs: 30, logged_at: '2026-10-18T10:00:00Z' }),
      set({ exercise_id: 'Crunches', set_number: 2, reps: 15, logged_at: '2026-10-18T10:02:00Z' }),
    ]
    expect(toLoggedRowsByExercise(sets, EXERCISES)['we-plank'].map(row => [row.rowIndex, row.exerciseId]))
      .toEqual([[0, 'Plank'], [1, 'Crunches']])
  })

  it('prefers the plan exercise logged directly over one that lists it as an alternative', () => {
    const exercises = [...EXERCISES, { id: 'we-crunch', exerciseId: 'Crunches', isUnilateral: false, alternatives: [] }]
    expect(rowIndices(toLoggedRowsByExercise([set({ exercise_id: 'Crunches' })], exercises))).toEqual({ 'we-crunch': [0] })
  })
})

describe('resumedAlternative', () => {
  const row = (exerciseId: string): LoggedRow => ({ rowIndex: 0, exerciseId, isPR: false })

  it('restores the swap when the latest row was logged under an alternative', () => {
    expect(resumedAlternative([CRUNCHES], [row('Plank'), row('Crunches')])).toEqual(CRUNCHES)
  })

  it('keeps the plan exercise when the latest row was logged under it, or nothing was logged', () => {
    expect(resumedAlternative([CRUNCHES], [row('Crunches'), row('Plank')])).toBeUndefined()
    expect(resumedAlternative([CRUNCHES], [])).toBeUndefined()
  })
})
