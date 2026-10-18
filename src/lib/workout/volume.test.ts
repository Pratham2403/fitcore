import { describe, expect, it } from 'vitest'
import type { Exercise, SetLog } from '@/types'
import { calculateCoreReps, calculateTotalVolume } from './volume'

const set = (overrides: Partial<SetLog>): SetLog => ({
  id: 'set', session_id: 'session', exercise_name: 'Bench', exercise_id: 'Bench_Id', block_type: 'working',
  set_number: 1, is_timed: false, is_pr: false, logged_at: '', ...overrides,
})

describe('calculateTotalVolume', () => {
  it('sums reps × weight for weighted sets only', () => {
    expect(calculateTotalVolume([
      set({ reps: 10, weight_kg: 20 }),
      set({ reps: 8, weight_kg: 25 }),
      set({ reps: 15 }),
    ])).toBe(400)
  })
})

describe('calculateCoreReps', () => {
  const crunch: Exercise = {
    id: 'we-1', exerciseId: 'Crunch_Id', name: 'Crunch', sets: 3, reps: '15', restSecs: 45, isTimed: false,
    isUnilateral: false, isMandatory: false, defaultWeightKg: 0, isAssistance: false, volumeType: 'reps_only',
    notes: '', alternatives: [], savedAlternativeIds: [], muscleGroups: ['core'], warnings: [], imageUrls: [],
  }
  const exercises = [crunch]

  it('counts reps of reps_only exercises matched by id or legacy name', () => {
    expect(calculateCoreReps([
      set({ exercise_id: 'Crunch_Id', exercise_name: 'Renamed', reps: 12 }),
      set({ exercise_id: null, exercise_name: 'Crunch', reps: 10 }),
      set({ reps: 50 }),
    ], exercises)).toBe(22)
  })

  it('counts sets by the mode of the alternative they were logged under, not the plan exercise', () => {
    const plank: Exercise = {
      ...crunch, id: 'we-2', exerciseId: 'Plank', name: 'Plank', isTimed: true, volumeType: 'timed',
      alternatives: [{ id: 'Crunches', name: 'Crunches', isTimed: false, volumeType: 'reps_only' }],
    }
    expect(calculateCoreReps([set({ exercise_id: 'Crunches', exercise_name: 'Crunches', reps: 15 })], [plank])).toBe(15)
  })
})
