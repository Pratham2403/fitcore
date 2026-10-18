/** Minimal key-value contract the cache layer needs; implementations may throw, callers fail open. */
export interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  /** Returns the stored value, first storing `value` when the key is absent. */
  getOrSet(key: string, value: string, ttlSeconds: number): Promise<string>
  /** Increments a counter (seeding it first when absent) and refreshes its TTL. */
  increment(key: string, seed: number, ttlSeconds: number): Promise<void>
}

/** Thrown while the store is known to be down, so callers skip it without logging every command. */
export class StoreUnavailableError extends Error {
  constructor() {
    super('Cache store unavailable')
    this.name = 'StoreUnavailableError'
  }
}
