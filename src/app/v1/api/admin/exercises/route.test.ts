import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_EXERCISES_PER_REQUEST } from '@/lib/catalog/newExercise'
import { POST } from './route'

const { insert, catalogPage } = vi.hoisted(() => ({ insert: vi.fn(), catalogPage: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/bearer', () => ({
  createBearerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } }, error: null }) },
    rpc: async () => ({ data: true, error: null }),
    from: () => ({
      select: () => ({ order: () => ({ range: catalogPage }) }),
      insert: (rows: unknown) => ({ select: () => insert(rows) }),
    }),
  }),
}))

const exercise = {
  name: 'Nordic Hamstring Curl', level: 'intermediate', category: 'strength', equipment: 'body only',
  primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes'], instructions: ['Lower slowly.'],
  mechanic: 'isolation', force: 'pull', movementPattern: 'leg_iso', popularity: 2,
}
const post = (body: string) => POST(new Request('http://test/api/admin/exercises', {
  method: 'POST', body, headers: { authorization: 'Bearer admin.jwt.token', 'content-type': 'application/json' },
}))

describe('POST /api/admin/exercises (as an admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogPage.mockResolvedValue({ data: [{ id: 'Goblet_Squat', name: 'Goblet Squat' }], error: null })
    insert.mockImplementation(async (rows: { id: string; name: string }[]) => ({ data: rows.map(({ id, name }) => ({ id, name })), error: null }))
  })

  it.each([
    ['malformed JSON', '[{'],
    ['a non-array', JSON.stringify(exercise)],
    ['an empty array', '[]'],
    ['a missing key', JSON.stringify([{ ...exercise, popularity: undefined }])],
    ['too many items', JSON.stringify(Array.from({ length: MAX_EXERCISES_PER_REQUEST + 1 }, (_, index) => ({ ...exercise, name: `Curl ${index}` })))],
    ['duplicate names in the batch', JSON.stringify([exercise, { ...exercise, name: 'NORDIC hamstring curl' }])],
  ])('returns 400 for %s and writes nothing', async (_case, body) => {
    const response = await post(body)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION' } })
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns 413 for a body over 1 MB', async () => {
    expect((await post(JSON.stringify([{ ...exercise, name: 'x'.repeat(1_100_000) }]))).status).toBe(413)
  })

  it('returns 409 listing conflicts and writes nothing when a name already exists', async () => {
    const response = await post(JSON.stringify([exercise, { ...exercise, name: 'goblet squat' }]))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      error: { code: 'CONFLICT', conflicts: [{ id: 'fc_goblet_squat', name: 'goblet squat', existing: { id: 'Goblet_Squat' } }] },
    })
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns 201 and inserts fitcore rows with server-generated ids', async () => {
    const response = await post(JSON.stringify([exercise]))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ inserted: 1, exercises: [{ id: 'fc_nordic_hamstring_curl', name: 'Nordic Hamstring Curl' }] })
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({ id: 'fc_nordic_hamstring_curl', source: 'fitcore', movement_pattern: 'leg_iso' })])
  })

  it('returns 409 when a concurrent append wins the unique index race', async () => {
    insert.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })
    expect((await post(JSON.stringify([exercise]))).status).toBe(409)
  })
})
