import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))

describe('withUserViewInvalidation', () => {
  it('invalidates after a successful write and after a failed one', async () => {
    const { dataCache, withUserViewInvalidation } = await import('./index')
    const invalidate = vi.spyOn(dataCache, 'invalidateUser').mockResolvedValue()
    expect(await withUserViewInvalidation('user-a', async () => 'saved')).toBe('saved')
    await expect(withUserViewInvalidation('user-a', () => Promise.reject(new Error('write failed')))).rejects.toThrow('write failed')
    expect(invalidate).toHaveBeenCalledTimes(2)
  })
})
