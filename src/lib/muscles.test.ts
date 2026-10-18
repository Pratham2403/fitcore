import { describe, expect, it } from 'vitest'
import { countSessionsPerMuscleGroup, toPrGroup, toUiMuscleGroups } from './muscles'

describe('muscle grouping', () => {
  it('maps catalog muscles to distinct UI groups', () => {
    expect(toUiMuscleGroups(['lats', 'middle back', 'biceps', 'neck'])).toEqual(['back', 'biceps'])
  })

  it('counts distinct sessions per group', () => {
    expect(countSessionsPerMuscleGroup([
      { sessionId: 'a', primaryMuscles: ['chest'] },
      { sessionId: 'a', primaryMuscles: ['chest'] },
      { sessionId: 'b', primaryMuscles: ['chest', 'quadriceps'] },
    ])).toEqual({ chest: 2, quads: 1 })
  })

  it('assigns PR groups', () => {
    expect(toPrGroup({ primaryMuscles: ['lats'], category: 'strength', isAssistance: true })).toBe('Calisthenics')
    expect(toPrGroup({ primaryMuscles: ['quadriceps'], category: 'cardio', isAssistance: false })).toBe('Cardio')
    expect(toPrGroup({ primaryMuscles: ['triceps'], category: 'strength', isAssistance: false })).toBe('Arms')
  })
})
