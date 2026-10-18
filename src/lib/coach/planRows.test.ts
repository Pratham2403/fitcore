import { describe, expect, it } from 'vitest'
import { toSavePlanDays, type PlanCatalogRow } from './planRows'
import type { CoachDay, CoachExercise } from './types'

const exercise = (exerciseId: string, reps: string): CoachExercise => ({
  exerciseId, name: exerciseId, sets: 3, reps, restSecs: 60, rationale: 'why', isMandatory: false, warnings: [],
})

const CATALOG = new Map<string, PlanCatalogRow>([
  ['barbell_squat', { equipment: 'barbell', primary_muscles: ['quadriceps'] }],
  ['plank', { equipment: 'body only', primary_muscles: ['abdominals'] }],
  ['push_up', { equipment: 'body only', primary_muscles: ['chest'] }],
  ['fc_assisted_pull_up', { equipment: 'body only', primary_muscles: ['lats'] }],
  ['jumping_jacks', { equipment: null, primary_muscles: ['quadriceps'] }],
  ['rowing_machine', { equipment: 'machine', primary_muscles: ['lats'] }],
])

const day: CoachDay = {
  dayOfWeek: 2, name: 'Legs', focus: 'Lower body', protocol: 'legs',
  exercises: [exercise('barbell_squat', '8-10'), exercise('plank', '30s'), exercise('push_up', '12'), exercise('fc_assisted_pull_up', '6')],
}

describe('toSavePlanDays', () => {
  it('maps a day to a workout with ordered exercises and derived volume fields', () => {
    const [saved] = toSavePlanDays([day], CATALOG)
    expect(saved).toMatchObject({ day_of_week: 2, name: 'Legs', focus: 'Lower body', protocol: 'legs' })
    expect(saved.exercises.map(row => [row.order_index, row.volume_type, row.is_timed, row.duration_secs, row.is_assistance])).toEqual([
      [0, 'weighted', false, null, false],
      [1, 'timed', true, 30, false],
      [2, 'bodyweight_full', false, null, false],
      [3, 'bodyweight_full', false, null, true],
    ])
    expect(saved.exercises[0]).toMatchObject({ exercise_id: 'barbell_squat', sets: 3, reps: '8-10', rest_secs: 60, notes: 'why' })
  })

  it('derives the mode from the reps format, so cardio given reps is counted in reps and cardio given a hold is timed', () => {
    const cardioDay = { ...day, exercises: [
      exercise('jumping_jacks', '15'), exercise('rowing_machine', '12'), exercise('jumping_jacks', '30-45s'), exercise('rowing_machine', '60s'),
    ] }
    const [saved] = toSavePlanDays([cardioDay], CATALOG)
    expect(saved.exercises.map(row => [row.volume_type, row.is_timed, row.duration_secs])).toEqual([
      ['bodyweight_full', false, null],
      ['weighted', false, null],
      ['timed', true, 30],
      ['timed', true, 60],
    ])
  })

  it('throws when a plan exercise is not in the catalog', () => {
    expect(() => toSavePlanDays([{ ...day, exercises: [exercise('unknown', '10')] }], CATALOG)).toThrow('unknown')
  })
})
