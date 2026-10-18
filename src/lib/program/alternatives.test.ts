import { describe, expect, it } from 'vitest'
import type { ConstraintWarning } from '@/types'
import { deriveAlternatives, type AlternativeCatalogRow } from './alternatives'

const row = (id: string, overrides: Partial<AlternativeCatalogRow> = {}): AlternativeCatalogRow => ({
  id, name: id, level: 'beginner', force: 'pull', category: 'strength', equipment: 'dumbbell', primaryMuscles: ['middle back'],
  movementPattern: 'horizontal_pull', popularity: 1, ...overrides,
})
const target = row('One_Arm_DB_Row')
const noWarnings = new Map<string, ConstraintWarning[]>()
const ids = (catalog: AlternativeCatalogRow[], equipment = ['dumbbell'], warnings = noWarnings) =>
  deriveAlternatives(target, catalog, equipment, warnings).map(ref => ref.id)

describe('deriveAlternatives', () => {
  it('keeps only the same movement pattern and main muscle, never the exercise itself', () => {
    expect(ids([
      target,
      row('Seated_Row'),
      row('Pullup', { movementPattern: 'vertical_pull' }),
      row('Shrug', { primaryMuscles: ['traps', 'middle back'] }),
    ])).toEqual(['Seated_Row'])
  })

  it('requires the user’s equipment but always allows bodyweight and unlisted equipment', () => {
    expect(ids([row('Cable_Row', { equipment: 'cable' }), row('Inverted_Row', { equipment: 'body only' }), row('Band_Row', { equipment: null })]))
      .toEqual(['Band_Row', 'Inverted_Row'])
  })

  it('excludes exercises the user’s constraints say to substitute, but not ones that only warn', () => {
    const warning = (action: ConstraintWarning['action']): ConstraintWarning[] =>
      [{ constraintType: 'lower_back', action, warning: 'w', rationale: 'r' }]
    const warnings = new Map([['Bent_Over_Row', warning('substitute')], ['Seal_Row', warning('warn')]])
    expect(ids([row('Bent_Over_Row'), row('Seal_Row')], ['dumbbell'], warnings)).toEqual(['Seal_Row'])
  })

  it('ranks by popularity, then level closeness, and returns at most two', () => {
    expect(ids([
      row('Rare_Row', { popularity: 0 }),
      row('Expert_Row', { popularity: 2, level: 'expert' }),
      row('Easy_Row', { popularity: 2 }),
      row('Staple_Row', { popularity: 3 }),
    ])).toEqual(['Staple_Row', 'Easy_Row'])
  })

  it('gives each alternative its own logging mode, not the target’s', () => {
    const plank = row('Plank', { force: 'static', equipment: 'body only', primaryMuscles: ['abdominals'], movementPattern: 'core' })
    const crunches = row('Crunches', { equipment: 'body only', primaryMuscles: ['abdominals'], movementPattern: 'core' })
    expect(deriveAlternatives(plank, [crunches], [], noWarnings))
      .toEqual([{ id: 'Crunches', name: 'Crunches', isTimed: false, volumeType: 'reps_only' }])
  })

  it('derives nothing for an unclassified exercise', () => {
    expect(deriveAlternatives(row('Odd', { movementPattern: null }), [row('Seated_Row')], ['dumbbell'], noWarnings)).toEqual([])
  })
})
