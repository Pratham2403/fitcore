import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoredWorkoutPlan } from './queries'
import { getWorkoutPlan } from './actions'

const { loadWorkoutPlan } = vi.hoisted(() => ({ loadWorkoutPlan: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}), getAuthenticatedUserId: async () => 'user-1' }))
vi.mock('@/lib/cache', () => ({
  dataCache: { readUserView: (_userId: string, _view: string, _args: unknown, _schema: unknown, load: () => unknown) => load() },
  withUserViewInvalidation: vi.fn(),
}))
vi.mock('./queries', async importOriginal => ({ ...await importOriginal<typeof import('./queries')>(), loadWorkoutPlan }))

const WORKOUT_ID = '6cee3fd7-0000-4000-8000-000000000000'
const storedPlan: StoredWorkoutPlan = { id: WORKOUT_ID, name: 'Push', focus: 'Chest', protocol: 'push', exercises: [] }

describe('getWorkoutPlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the caller’s workout with its protocol blocks', async () => {
    loadWorkoutPlan.mockResolvedValue(storedPlan)
    expect(await getWorkoutPlan(WORKOUT_ID)).toMatchObject({ id: WORKOUT_ID, warmup: expect.any(Array), stretch: expect.any(Array) })
  })

  it('returns null for a missing or foreign workout instead of throwing', async () => {
    loadWorkoutPlan.mockResolvedValue(null)
    expect(await getWorkoutPlan(WORKOUT_ID)).toBeNull()
  })

  it('returns null for an id that cannot name a workout, without querying', async () => {
    expect(await getWorkoutPlan('not-a-uuid')).toBeNull()
    expect(loadWorkoutPlan).not.toHaveBeenCalled()
  })
})
