import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createCache } from './cache'
import { cacheKeys } from './keys'
import { StoreUnavailableError, type CacheStore } from './store'

function createMemoryStore(): CacheStore & { entries: Map<string, string> } {
  const entries = new Map<string, string>()
  return {
    entries,
    get: async key => entries.get(key) ?? null,
    set: async (key, value) => { entries.set(key, value) },
    getOrSet: async (key, value) => {
      if (!entries.has(key)) entries.set(key, value)
      return entries.get(key) ?? value
    },
    increment: async (key, seed) => { entries.set(key, String(Number(entries.get(key) ?? seed) + 1)) },
  }
}

const failingStore: CacheStore = {
  get: () => Promise.reject(new Error('down')),
  set: () => Promise.reject(new Error('down')),
  getOrSet: () => Promise.reject(new Error('down')),
  increment: () => Promise.reject(new Error('down')),
}

const countSchema = z.object({ count: z.number() })
const TTL = 60
const USER_A = 'user-a'
const USER_B = 'user-b'

describe('readThrough', () => {
  it('loads and stores on a miss, then serves the stored value', async () => {
    const store = createMemoryStore()
    const cache = createCache(store, vi.fn())
    const load = vi.fn(async () => ({ count: 1 }))
    expect(await cache.readThrough('k', countSchema, TTL, load)).toEqual({ count: 1 })
    expect(await cache.readThrough('k', countSchema, TTL, load)).toEqual({ count: 1 })
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('treats a payload that fails the schema as a miss and overwrites it', async () => {
    const store = createMemoryStore()
    store.entries.set('k', JSON.stringify({ count: 'stale shape' }))
    const cache = createCache(store, vi.fn())
    expect(await cache.readThrough('k', countSchema, TTL, async () => ({ count: 2 }))).toEqual({ count: 2 })
    expect(store.entries.get('k')).toBe(JSON.stringify({ count: 2 }))
  })

  it('treats corrupt JSON as a miss', async () => {
    const store = createMemoryStore()
    store.entries.set('k', '{not json')
    const cache = createCache(store, vi.fn())
    expect(await cache.readThrough('k', countSchema, TTL, async () => ({ count: 3 }))).toEqual({ count: 3 })
  })

  it('serves a cached null without reloading', async () => {
    const cache = createCache(createMemoryStore(), vi.fn())
    const load = vi.fn(async () => null)
    await cache.readThrough('k', countSchema.nullable(), TTL, load)
    expect(await cache.readThrough('k', countSchema.nullable(), TTL, load)).toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('fails open with a warning when the store is unreachable', async () => {
    const warn = vi.fn()
    const cache = createCache(failingStore, warn)
    expect(await cache.readThrough('k', countSchema, TTL, async () => ({ count: 4 }))).toEqual({ count: 4 })
    expect(warn).toHaveBeenCalledWith('get', expect.any(Error))
    expect(warn).toHaveBeenCalledWith('set', expect.any(Error))
  })

  it('always loads when caching is disabled', async () => {
    const cache = createCache(null, vi.fn())
    const load = vi.fn(async () => ({ count: 5 }))
    await cache.readThrough('k', countSchema, TTL, load)
    await cache.readThrough('k', countSchema, TTL, load)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('propagates load failures instead of caching them', async () => {
    const store = createMemoryStore()
    const cache = createCache(store, vi.fn())
    await expect(cache.readThrough('k', countSchema, TTL, () => Promise.reject(new Error('db down')))).rejects.toThrow('db down')
    expect(store.entries.has('k')).toBe(false)
  })
})

describe('readThrough with isCacheable', () => {
  it('does not store values the predicate rejects', async () => {
    const store = createMemoryStore()
    const cache = createCache(store, vi.fn())
    const flag = z.literal(true)
    const load = vi.fn(async () => false)
    await cache.readThrough('k', flag.or(z.literal(false)), TTL, load, value => value)
    expect(store.entries.has('k')).toBe(false)
  })
})

describe('user views', () => {
  it('invalidateUser makes every view of that user miss, and only that user', async () => {
    const cache = createCache(createMemoryStore(), vi.fn())
    const loadA = vi.fn(async () => ({ count: 1 }))
    const loadB = vi.fn(async () => ({ count: 2 }))
    await cache.readUserView(USER_A, 'home', [], countSchema, loadA)
    await cache.readUserView(USER_B, 'home', [], countSchema, loadB)
    await cache.invalidateUser(USER_A)
    await cache.readUserView(USER_A, 'home', [], countSchema, loadA)
    await cache.readUserView(USER_B, 'home', [], countSchema, loadB)
    expect(loadA).toHaveBeenCalledTimes(2)
    expect(loadB).toHaveBeenCalledTimes(1)
  })

  it('never serves one user\'s view to another', async () => {
    const cache = createCache(createMemoryStore(), vi.fn())
    await cache.readUserView(USER_A, 'home', [], countSchema, async () => ({ count: 1 }))
    expect(await cache.readUserView(USER_B, 'home', [], countSchema, async () => ({ count: 2 }))).toEqual({ count: 2 })
  })

  it('seeds a missing version counter from the clock so it cannot reuse an earlier version', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const store = createMemoryStore()
    const cache = createCache(store, vi.fn())
    await cache.readUserView(USER_A, 'home', [], countSchema, async () => ({ count: 1 }))
    expect(store.entries.get(cacheKeys.userVersion(USER_A))).toBe('1000000')
    vi.setSystemTime(1_000_500)
    store.entries.delete(cacheKeys.userVersion(USER_A))
    await cache.invalidateUser(USER_A)
    expect(store.entries.get(cacheKeys.userVersion(USER_A))).toBe('1000501')
    vi.useRealTimers()
  })

  it('retries a failed invalidation once before warning', async () => {
    const store = createMemoryStore()
    const increment = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockImplementation(store.increment)
    const warn = vi.fn()
    await createCache({ ...store, increment }, warn).invalidateUser(USER_A)
    expect(increment).toHaveBeenCalledTimes(2)
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn per command while the store reports itself unavailable', async () => {
    const warn = vi.fn()
    const unavailable = () => Promise.reject(new StoreUnavailableError())
    const cache = createCache({ ...failingStore, get: unavailable, set: unavailable, getOrSet: unavailable }, warn)
    expect(await cache.readUserView(USER_A, 'home', [], countSchema, async () => ({ count: 8 }))).toEqual({ count: 8 })
    expect(warn).not.toHaveBeenCalled()
  })

  it('a load that started before an invalidation cannot repopulate the new version', async () => {
    const store = createMemoryStore()
    const cache = createCache(store, vi.fn())
    const staleRead = cache.readUserView(USER_A, 'home', [], countSchema, async () => {
      await cache.invalidateUser(USER_A)
      return { count: 1 }
    })
    await staleRead
    expect(await cache.readUserView(USER_A, 'home', [], countSchema, async () => ({ count: 2 }))).toEqual({ count: 2 })
  })

  it('bypasses the cache when the version cannot be read', async () => {
    const warn = vi.fn()
    const cache = createCache(failingStore, warn)
    expect(await cache.readUserView(USER_A, 'home', [], countSchema, async () => ({ count: 7 }))).toEqual({ count: 7 })
    await cache.invalidateUser(USER_A)
    expect(warn).toHaveBeenCalledWith('read user version', expect.any(Error))
    expect(warn).toHaveBeenCalledWith('invalidate user', expect.any(Error))
  })
})

describe('cacheKeys', () => {
  it('scopes user views by user, version, view and params', () => {
    expect(cacheKeys.userView(USER_A, '42', 'workout-plan', ['w1'])).toBe('fitcore:development:v3:user:user-a:42:workout-plan:w1')
    expect(cacheKeys.userView(USER_A, '42', 'home', [])).toBe('fitcore:development:v3:user:user-a:42:home')
  })
})
