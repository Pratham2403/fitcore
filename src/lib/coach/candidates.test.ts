import { describe, expect, it } from 'vitest'
import type { ConstraintWarning } from '@/types'
import { MAX_CANDIDATES, MIN_PER_MUSCLE, selectCandidates, type CatalogCandidateRow } from './candidates'

const row = (id: string, overrides: Partial<CatalogCandidateRow> = {}): CatalogCandidateRow => ({
  id,
  name: id,
  level: 'beginner',
  mechanic: 'compound',
  equipment: 'barbell',
  category: 'strength',
  primaryMuscles: ['chest'],
  movementPattern: 'horizontal_push',
  popularity: 1,
  ...overrides,
})

const substitute: ConstraintWarning = {
  constraintType: 'patellar_tendon', action: 'substitute', warning: 'Swap', rationale: 'Knee load', safeAlternative: { id: 'safe', name: 'Safe' },
}

const CATALOG = [
  row('barbell_press'),
  row('cable_fly', { equipment: 'cable', mechanic: 'isolation', movementPattern: 'chest_iso' }),
  row('push_up', { equipment: 'body only' }),
  row('no_equipment', { equipment: null }),
  row('expert_lift', { level: 'expert' }),
  row('intermediate_lift', { level: 'intermediate' }),
  row('box_jump', { category: 'plyometrics', equipment: 'body only', movementPattern: 'conditioning' }),
  row('hip_thrust', { category: 'powerlifting', primaryMuscles: ['glutes'], movementPattern: 'glute_bridge' }),
  row('clean', { category: 'olympic weightlifting', primaryMuscles: ['hamstrings'], movementPattern: 'power' }),
  row('deep_squat', { primaryMuscles: ['quadriceps'], movementPattern: 'squat' }),
]
const WARNINGS = new Map([['deep_squat', [substitute]]])
const NO_PINS = { preferredIds: [], requiredIds: [] }
const ids = (rows: CatalogCandidateRow[]) => rows.map(candidate => candidate.id).sort()

describe('selectCandidates', () => {
  it('filters by equipment, always allowing body-only and equipment-free exercises', () => {
    const result = selectCandidates(CATALOG, { equipment: [], experience: 'beginner', ...NO_PINS }, WARNINGS)
    expect(ids(result)).toEqual(['no_equipment', 'push_up'])
  })

  it('allows one level above experience and gates plyometrics and olympic lifts by experience', () => {
    const filters = { equipment: ['barbell', 'cable'], ...NO_PINS }
    expect(ids(selectCandidates(CATALOG, { ...filters, experience: 'beginner' }, WARNINGS)))
      .toEqual(['barbell_press', 'cable_fly', 'hip_thrust', 'intermediate_lift', 'no_equipment', 'push_up'])
    expect(ids(selectCandidates(CATALOG, { ...filters, experience: 'intermediate' }, WARNINGS)))
      .toEqual(['barbell_press', 'box_jump', 'cable_fly', 'expert_lift', 'hip_thrust', 'intermediate_lift', 'no_equipment', 'push_up'])
    expect(ids(selectCandidates(CATALOG, { ...filters, experience: 'advanced' }, WARNINGS))).toContain('clean')
  })

  it('excludes substitute-flagged exercises unless preferred, and puts preferred and required first', () => {
    const filters = { equipment: ['barbell'], experience: 'beginner' as const, requiredIds: ['cable_fly'] }
    expect(ids(selectCandidates(CATALOG, { ...filters, preferredIds: [] }, WARNINGS))).not.toContain('deep_squat')
    const result = selectCandidates(CATALOG, { ...filters, preferredIds: ['deep_squat'] }, WARNINGS)
    expect(result.slice(0, 2).map(candidate => candidate.id)).toEqual(['deep_squat', 'cable_fly'])
  })

  it('keeps popular exercises and every muscle under the cap, dropping unusual variants first', () => {
    const presses = Array.from({ length: MAX_CANDIDATES }, (_, index) => row(`odd_press_${index}`, { popularity: 0 }))
    const staple = row('zz_staple_press', { popularity: 3 })
    const calves = [row('calf_a', { primaryMuscles: ['calves'], movementPattern: 'calf', popularity: 0 }),
      row('calf_b', { primaryMuscles: ['calves'], movementPattern: 'calf', popularity: 0 })]
    const result = selectCandidates([...presses, ...calves, staple], { equipment: ['barbell'], experience: 'beginner', ...NO_PINS }, new Map())
    expect(result).toHaveLength(MAX_CANDIDATES)
    expect(result[0]?.id).toBe('zz_staple_press')
    expect(result.filter(candidate => candidate.primaryMuscles[0] === 'calves')).toHaveLength(MIN_PER_MUSCLE)
  })

  it('spreads equally popular exercises across movement patterns instead of exhausting one', () => {
    const presses = Array.from({ length: 5 }, (_, index) => row(`press_${index}`))
    const squats = Array.from({ length: 5 }, (_, index) => row(`squat_${index}`, { primaryMuscles: ['quadriceps'], movementPattern: 'squat' }))
    const result = selectCandidates([...presses, ...squats], { equipment: ['barbell'], experience: 'beginner', ...NO_PINS }, new Map())
    const firstSix = result.slice(0, 6).map(candidate => candidate.movementPattern)
    expect(firstSix.filter(pattern => pattern === 'squat').length).toBeGreaterThanOrEqual(2)
    expect(firstSix.filter(pattern => pattern === 'horizontal_push').length).toBeGreaterThanOrEqual(2)
  })
})
