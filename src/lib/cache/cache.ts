import type { z } from 'zod'
import { StoreUnavailableError, type CacheStore } from './store'
import { USER_VERSION_TTL_SECONDS, USER_VIEW_TTL_SECONDS, cacheKeys, type UserView } from './keys'

/** Operation names reported to the warning sink. */
export type CacheOperation = 'get' | 'set' | 'read user version' | 'invalidate user'
export type CacheWarning = (operation: CacheOperation, error: unknown) => void

/** A lost invalidation leaves stale views until their TTL, so the bump gets one retry. */
const INVALIDATION_ATTEMPTS = 2

export interface Cache {
  /**
   * Cache-aside read: a missing, unparseable or schema-invalid entry is a miss; store failures fall back to `load`.
   * @param isCacheable - stores the loaded value only when this returns true (default: always).
   */
  readThrough<T>(key: string, schema: z.ZodType<T>, ttlSeconds: number, load: () => Promise<T>, isCacheable?: (value: T) => boolean): Promise<T>
  /** readThrough scoped to the user's current version, so one invalidateUser drops all of their views. */
  readUserView<T>(userId: string, view: UserView, params: readonly string[], schema: z.ZodType<T>, load: () => Promise<T>): Promise<T>
  /** Call after every write that can change a user's views. */
  invalidateUser(userId: string): Promise<void>
}

/**
 * Builds the fail-open cache: Redis is an optimisation, never a source of truth, so every store failure is
 * reported through `warn` and the caller falls back to the database. A null store disables caching.
 */
export function createCache(store: CacheStore | null, warn: CacheWarning): Cache {
  async function attempt<T>(operation: CacheOperation, run: (activeStore: CacheStore) => Promise<T>): Promise<T | null> {
    if (!store) return null
    try {
      return await run(store)
    } catch (error) {
      // The store already reported the outage once; repeating it per command would bury real failures.
      if (!(error instanceof StoreUnavailableError)) warn(operation, error)
      return null
    }
  }

  /** Wrapped so a legitimately cached null stays distinguishable from a miss. */
  function parseEntry<T>(raw: string, schema: z.ZodType<T>): { value: T } | null {
    try {
      const parsed = schema.safeParse(JSON.parse(raw))
      return parsed.success ? { value: parsed.data } : null
    } catch {
      // Corrupt JSON is treated exactly like a schema mismatch: a miss that the fresh load overwrites.
      return null
    }
  }

  async function readThrough<T>(
    key: string, schema: z.ZodType<T>, ttlSeconds: number, load: () => Promise<T>, isCacheable: (value: T) => boolean = () => true,
  ): Promise<T> {
    const raw = await attempt('get', activeStore => activeStore.get(key))
    const cached = raw === null ? null : parseEntry(raw, schema)
    if (cached) return cached.value
    const fresh = await load()
    if (isCacheable(fresh)) await attempt('set', activeStore => activeStore.set(key, JSON.stringify(fresh), ttlSeconds))
    return fresh
  }

  /** Seeds with the clock so a counter recreated after expiry never reuses an earlier version. */
  function readUserVersion(userId: string): Promise<string | null> {
    return attempt('read user version', activeStore =>
      activeStore.getOrSet(cacheKeys.userVersion(userId), String(Date.now()), USER_VERSION_TTL_SECONDS))
  }

  async function invalidateUser(userId: string): Promise<void> {
    for (let attemptNumber = 1; attemptNumber <= INVALIDATION_ATTEMPTS; attemptNumber += 1) {
      try {
        await store?.increment(cacheKeys.userVersion(userId), Date.now(), USER_VERSION_TTL_SECONDS)
        return
      } catch (error) {
        if (attemptNumber === INVALIDATION_ATTEMPTS) warn('invalidate user', error)
      }
    }
  }

  return {
    readThrough,
    async readUserView(userId, view, params, schema, load) {
      const version = await readUserVersion(userId)
      if (version === null) return load()
      return readThrough(cacheKeys.userView(userId, version, view, params), schema, USER_VIEW_TTL_SECONDS, load)
    },
    invalidateUser,
  }
}
