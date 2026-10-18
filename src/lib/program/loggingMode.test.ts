import { describe, expect, it } from 'vitest'
import { toLoggingMode, type LoggingModeCatalogRow } from './loggingMode'

const row = (overrides: Partial<LoggingModeCatalogRow>): LoggingModeCatalogRow => ({
  force: 'push', category: 'strength', equipment: 'body only', primaryMuscles: ['chest'], ...overrides,
})

describe('toLoggingMode', () => {
  it('times static holds and cardio whatever their equipment', () => {
    expect(toLoggingMode(row({ force: 'static', primaryMuscles: ['abdominals'] }))).toEqual({ isTimed: true, volumeType: 'timed' })
    expect(toLoggingMode(row({ force: null, category: 'cardio', equipment: 'machine' }))).toEqual({ isTimed: true, volumeType: 'timed' })
  })

  it('weighs exercises that use loaded equipment', () => {
    expect(toLoggingMode(row({ equipment: 'dumbbell' }))).toEqual({ isTimed: false, volumeType: 'weighted' })
  })

  it('counts reps only for bodyweight core work and full bodyweight otherwise, treating unlisted equipment as bodyweight', () => {
    expect(toLoggingMode(row({ force: 'pull', primaryMuscles: ['abdominals'] }))).toEqual({ isTimed: false, volumeType: 'reps_only' })
    expect(toLoggingMode(row({ equipment: null }))).toEqual({ isTimed: false, volumeType: 'bodyweight_full' })
  })
})
