import { describe, expect, it } from 'vitest'
import type { CatalogExercise } from '@/types'
import { fromCatalogExercise, withVolumeType } from './draft'

const plank: CatalogExercise = {
  id: 'Plank', name: 'Plank', force: 'static', level: 'beginner', mechanic: 'isolation', equipment: 'body only',
  primaryMuscles: ['abdominals'], secondaryMuscles: [], instructions: [], category: 'strength', imageUrls: [], source: 'free-exercise-db',
}

describe('withVolumeType', () => {
  it('makes a row timed exactly when it counts toward volume as timed', () => {
    const timed = withVolumeType(fromCatalogExercise(plank), 'timed')
    expect([timed.isTimed, timed.volumeType]).toEqual([true, 'timed'])
    const untimed = withVolumeType(timed, 'reps_only')
    expect([untimed.isTimed, untimed.volumeType]).toEqual([false, 'reps_only'])
  })
})
