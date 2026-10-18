import { describe, expect, it } from 'vitest'
import { workoutExerciseInputSchema } from './schema'

const base = { exerciseId: 'plank', sets: 3, reps: '30s', restSecs: 60, durationSecs: 30 }

describe('workoutExerciseInputSchema', () => {
  it('accepts a timed exercise with the timed volume type', () => {
    expect(workoutExerciseInputSchema.safeParse({ ...base, isTimed: true, volumeType: 'timed' }).success).toBe(true)
  })

  it('rejects a mismatch between isTimed and the volume type', () => {
    expect(workoutExerciseInputSchema.safeParse({ ...base, isTimed: false, volumeType: 'timed' }).success).toBe(false)
    expect(workoutExerciseInputSchema.safeParse({ ...base, isTimed: true, volumeType: 'reps_only' }).success).toBe(false)
  })
})
