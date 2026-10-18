import { describe, expect, it } from 'vitest'
import type { ConstraintWarning } from '@/types'
import { applyPostPass, type PostPassContext } from './postPass'
import type { LlmDraft } from './schema'

const substituteTo = (id: string | null): ConstraintWarning => ({
  constraintType: 'patellar_tendon',
  action: 'substitute',
  warning: 'Swap for knees',
  rationale: 'Less knee shear.',
  ...(id ? { safeAlternative: { id, name: id } } : {}),
})
const capRom: ConstraintWarning = { constraintType: 'patellar_tendon', action: 'cap_rom', warning: 'Stop at 90°', rationale: 'Knee load.' }

const WARNINGS = new Map<string, ConstraintWarning[]>([
  ['full_squat', [substituteTo('box_squat')]],
  ['box_squat', [capRom]],
  ['narrow_press', [substituteTo('wide_press')]],
  ['wide_press', [substituteTo('leg_press')]],
  ['sissy_squat', [substituteTo(null)]],
])
const NAMES = new Map(['full_squat', 'box_squat', 'narrow_press', 'wide_press', 'leg_press', 'sissy_squat', 'row', 'curl', 'kegels', 'bench']
  .map(id => [id, `Name ${id}`]))

const context = (overrides: Partial<PostPassContext> = {}): PostPassContext => ({
  warningsById: WARNINGS, names: NAMES, requirements: [], approvedOriginalIds: new Set(), ...overrides,
})
const exercise = (exerciseId: string) => ({ exerciseId, sets: 3, reps: '10', restSecs: 60, rationale: 'Why.' })
const draft = (days: Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; protocol: LlmDraft['days'][number]['protocol']; ids: string[] }>): LlmDraft => ({
  summary: 'Plan',
  days: days.map(day => ({ dayOfWeek: day.dayOfWeek, name: 'Day', focus: '', protocol: day.protocol, exercises: day.ids.map(exercise) })),
})
const flagged = (id: string) => (WARNINGS.get(id) ?? []).some(warning => warning.action === 'substitute')

describe('applyPostPass', () => {
  it('swaps a contraindicated exercise with a pending substitution and the new exercise warnings', () => {
    const [day] = applyPostPass(draft([{ dayOfWeek: 1, protocol: 'legs', ids: ['full_squat', 'row', 'curl'] }]), context())
    const swapped = day?.exercises[0]
    expect(swapped?.exerciseId).toBe('box_squat')
    expect(swapped?.substitution).toMatchObject({ originalExerciseId: 'full_squat', status: 'pending', constraintType: 'patellar_tendon' })
    expect(swapped?.warnings).toEqual([capRom])
  })

  it('keeps previously approved substitutions approved', () => {
    const [day] = applyPostPass(
      draft([{ dayOfWeek: 1, protocol: 'legs', ids: ['full_squat', 'row', 'curl'] }]),
      context({ approvedOriginalIds: new Set(['full_squat']) }),
    )
    expect(day?.exercises[0]?.substitution?.status).toBe('approved')
  })

  it('follows chained substitutions and drops dead ends', () => {
    const [day] = applyPostPass(draft([{ dayOfWeek: 1, protocol: 'legs', ids: ['narrow_press', 'sissy_squat', 'row', 'curl'] }]), context())
    expect(day?.exercises.map(item => item.exerciseId)).toEqual(['leg_press', 'row', 'curl'])
    expect(day?.exercises[0]?.substitution?.originalExerciseId).toBe('narrow_press')
  })

  it('removes duplicates created by substitution', () => {
    const [day] = applyPostPass(draft([{ dayOfWeek: 1, protocol: 'legs', ids: ['full_squat', 'box_squat', 'row'] }]), context())
    expect(day?.exercises.map(item => item.exerciseId)).toEqual(['box_squat', 'row'])
  })

  it('adds required exercises as mandatory on two days, preferring leg and full-body days', () => {
    const days = applyPostPass(
      draft([
        { dayOfWeek: 1, protocol: 'push', ids: ['bench', 'row', 'curl'] },
        { dayOfWeek: 3, protocol: 'legs', ids: ['box_squat', 'row', 'curl'] },
        { dayOfWeek: 5, protocol: 'full_body', ids: ['bench', 'row', 'curl'] },
      ]),
      context({ requirements: [{ exerciseId: 'kegels', rationale: 'Pelvic floor.' }] }),
    )
    const withKegels = days.filter(day => day.exercises.some(item => item.exerciseId === 'kegels')).map(day => day.dayOfWeek)
    expect(withKegels).toEqual([3, 5])
    expect(days[1]?.exercises.at(-1)).toMatchObject({ isMandatory: true, sets: 3, reps: '10', restSecs: 45, rationale: 'Pelvic floor.' })
  })

  it('never outputs an exercise that needs substitution', () => {
    const days = applyPostPass(
      draft([{ dayOfWeek: 1, protocol: 'legs', ids: ['full_squat', 'narrow_press', 'wide_press', 'sissy_squat', 'row'] }]),
      context({ requirements: [{ exerciseId: 'full_squat', rationale: 'Required.' }] }),
    )
    expect(days.flatMap(day => day.exercises).some(item => flagged(item.exerciseId))).toBe(false)
  })
})
