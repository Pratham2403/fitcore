import { describe, expect, it } from 'vitest'
import { MAX_EXERCISES_PER_REQUEST, findConflicts, newExerciseBatchSchema, toExerciseId } from './newExercise'

const nordicCurl = {
  name: 'Nordic Hamstring Curl',
  level: 'intermediate',
  category: 'strength',
  equipment: 'body only',
  primaryMuscles: ['hamstrings'],
  secondaryMuscles: ['glutes', 'calves'],
  instructions: ['Kneel with your ankles anchored.', 'Lower your torso slowly, then pull back up.'],
  mechanic: 'isolation',
  force: 'pull',
  movementPattern: 'leg_iso',
  popularity: 2,
}

const issuePaths = (input: unknown) => {
  const result = newExerciseBatchSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map(issue => issue.path.join('.'))
}

describe('toExerciseId', () => {
  it('slugs a name into the fc_ namespace accepted by the id CHECK', () => {
    expect(toExerciseId('Nordic Hamstring Curl')).toBe('fc_nordic_hamstring_curl')
    expect(toExerciseId("3/4 Sit-Up (Farmer's)")).toBe('fc_3_4_sit_up_farmer_s')
  })
})

describe('newExerciseBatchSchema', () => {
  it('accepts a complete exercise, normalises whitespace in the name and derives the id', () => {
    const [parsed] = newExerciseBatchSchema.parse([{ ...nordicCurl, name: '  Nordic   Hamstring Curl ' }])
    expect(parsed).toMatchObject({ id: 'fc_nordic_hamstring_curl', name: 'Nordic Hamstring Curl', popularity: 2 })
  })

  it('accepts explicit null for mechanic and force', () => {
    expect(newExerciseBatchSchema.safeParse([{ ...nordicCurl, mechanic: null, force: null }]).success).toBe(true)
  })

  it('requires every key, including the nullable ones', () => {
    const withoutForce = Object.fromEntries(Object.entries(nordicCurl).filter(([key]) => key !== 'force'))
    expect(issuePaths([withoutForce])).toEqual(['0.force'])
  })

  it('rejects unknown keys such as id, source and images', () => {
    expect(issuePaths([{ ...nordicCurl, id: 'x', source: 'fitcore', images: [] }])).toEqual(['0'])
  })

  it('rejects empty, oversized and non-array batches', () => {
    expect(issuePaths([])).toEqual([''])
    expect(issuePaths(Array.from({ length: MAX_EXERCISES_PER_REQUEST + 1 }, (_, index) => ({ ...nordicCurl, name: `Curl ${index}` }))))
      .toEqual([''])
    expect(issuePaths(nordicCurl)).toEqual([''])
  })

  it('rejects out-of-whitelist values and bad shapes with a path per issue', () => {
    expect(issuePaths([{
      ...nordicCurl, level: 'expertish', primaryMuscles: [], secondaryMuscles: ['glutes', 'glutes'], instructions: [],
      movementPattern: 'twist', popularity: 4, name: 'Curl <script>',
    }]).sort()).toEqual(['0.instructions', '0.level', '0.movementPattern', '0.name', '0.popularity', '0.primaryMuscles', '0.secondaryMuscles'])
  })

  it('rejects names that collide within the batch, case- and punctuation-insensitively', () => {
    expect(issuePaths([nordicCurl, { ...nordicCurl, name: 'nordic hamstring-curl' }])).toEqual(['1.name'])
  })
})

describe('findConflicts', () => {
  const incoming = newExerciseBatchSchema.parse([nordicCurl, { ...nordicCurl, name: 'Goblet Squat' }, { ...nordicCurl, name: 'Brand New' }])

  it('reports incoming exercises whose id or case-insensitive name already exists', () => {
    const catalog = [
      { id: 'fc_nordic_hamstring_curl', name: 'Nordic Curl (old)' },
      { id: 'Goblet_Squat', name: 'goblet squat' },
      { id: 'Unrelated', name: 'Unrelated' },
    ]
    expect(findConflicts(incoming, catalog)).toEqual([
      { id: 'fc_nordic_hamstring_curl', name: 'Nordic Hamstring Curl', existing: catalog[0] },
      { id: 'fc_goblet_squat', name: 'Goblet Squat', existing: catalog[1] },
    ])
  })

  it('is empty when nothing collides', () => {
    expect(findConflicts(incoming, [{ id: 'Unrelated', name: 'Unrelated' }])).toEqual([])
  })
})
