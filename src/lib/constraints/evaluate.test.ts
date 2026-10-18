import { describe, expect, it } from 'vitest'
import { evaluateConstraints, resolveSafeExercise, type ConstraintRule } from './evaluate'

const rule = (overrides: Partial<ConstraintRule>): ConstraintRule => ({
  constraintType: 'patellar_tendon',
  exerciseId: 'Leg_Extensions',
  action: 'cap_rom',
  safeAlternativeId: null,
  safeAlternativeName: null,
  warning: 'Stop at 90° — Knee Protocol',
  rationale: 'Limits knee load.',
  ...overrides,
})

const RULES: ConstraintRule[] = [
  rule({}),
  rule({ exerciseId: 'Barbell_Squat', action: 'substitute', safeAlternativeId: 'Leg_Press', safeAlternativeName: 'Leg Press', warning: 'Swap for leg press' }),
  rule({ exerciseId: 'Leg_Press', action: 'warn', warning: 'Keep depth shallow' }),
  rule({ constraintType: 'wrist_pain', exerciseId: 'Barbell_Curl', action: 'substitute', safeAlternativeId: 'Hammer_Curls', safeAlternativeName: 'Hammer Curls', warning: 'Use neutral grip' }),
]

describe('evaluateConstraints', () => {
  it('returns the cap_rom warning for an active constraint', () => {
    const warnings = evaluateConstraints(['Leg_Extensions'], ['patellar_tendon'], RULES)
    expect(warnings.get('Leg_Extensions')).toEqual([
      { constraintType: 'patellar_tendon', action: 'cap_rom', warning: 'Stop at 90° — Knee Protocol', rationale: 'Limits knee load.' },
    ])
  })

  it('ignores rules for constraints the user does not have', () => {
    const warnings = evaluateConstraints(['Barbell_Curl'], ['patellar_tendon'], RULES)
    expect(warnings.get('Barbell_Curl')).toEqual([])
  })

  it('includes the safe alternative on substitute warnings', () => {
    const [warning] = evaluateConstraints(['Barbell_Squat'], ['patellar_tendon'], RULES).get('Barbell_Squat') ?? []
    expect(warning.safeAlternative).toEqual({ id: 'Leg_Press', name: 'Leg Press' })
  })

  it('also evaluates the substituted-in exercise', () => {
    const warnings = evaluateConstraints(['Barbell_Squat'], ['patellar_tendon'], RULES)
    expect(warnings.get('Leg_Press')?.map(w => w.warning)).toEqual(['Keep depth shallow'])
  })

  it('returns an empty list for exercises without rules', () => {
    expect(evaluateConstraints(['Plank'], ['patellar_tendon'], RULES).get('Plank')).toEqual([])
  })
})

describe('resolveSafeExercise', () => {
  it('follows substitutions to a safe exercise', () => {
    const warnings = evaluateConstraints(['Barbell_Squat'], ['patellar_tendon'], RULES)
    expect(resolveSafeExercise('Barbell_Squat', warnings)).toBe('Leg_Press')
    expect(resolveSafeExercise('Leg_Extensions', evaluateConstraints(['Leg_Extensions'], ['patellar_tendon'], RULES))).toBe('Leg_Extensions')
  })

  it('returns null on a substitution cycle', () => {
    const cyclic = [
      rule({ exerciseId: 'A', action: 'substitute', safeAlternativeId: 'B', safeAlternativeName: 'B' }),
      rule({ exerciseId: 'B', action: 'substitute', safeAlternativeId: 'A', safeAlternativeName: 'A' }),
    ]
    expect(resolveSafeExercise('A', evaluateConstraints(['A'], ['patellar_tendon'], cyclic))).toBeNull()
  })

  it('returns null when a substitute rule has no alternative', () => {
    const deadEnd = [rule({ exerciseId: 'A', action: 'substitute' })]
    expect(resolveSafeExercise('A', evaluateConstraints(['A'], ['patellar_tendon'], deadEnd))).toBeNull()
  })
})
