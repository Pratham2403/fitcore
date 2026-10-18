import 'server-only'
import Redis from 'ioredis'
import { StoreUnavailableError, type CacheStore } from './store'
import { createCircuitBreaker } from './breaker'

/** Tight bounds so a slow or unreachable Redis costs a request at most a few hundred ms before failing open. */
const CONNECT_TIMEOUT_MS = 1_000
const COMMAND_TIMEOUT_MS = 250
const MAX_RETRIES_PER_COMMAND = 1
const RECONNECT_BACKOFF_MS = 200
const MAX_RECONNECT_DELAY_MS = 2_000

/** A Redis-backed CacheStore over TCP (Node runtime only); connects lazily on the first command. */
export function createRedisStore(url: string, onUnavailable: (error: Error) => void): CacheStore {
  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: CONNECT_TIMEOUT_MS,
    commandTimeout: COMMAND_TIMEOUT_MS,
    maxRetriesPerRequest: MAX_RETRIES_PER_COMMAND,
    retryStrategy: attempt => Math.min(attempt * RECONNECT_BACKOFF_MS, MAX_RECONNECT_DELAY_MS),
  })
  const breaker = createCircuitBreaker()
  client.on('error', error => {
    if (breaker.trip()) onUnavailable(error)
  })
  client.on('ready', () => breaker.recordSuccess())

  async function execute<T>(command: () => Promise<T>): Promise<T> {
    try {
      const result = await command()
      breaker.recordSuccess()
      return result
    } catch (error) {
      if (breaker.recordFailure()) onUnavailable(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  function run<T>(command: () => Promise<T>): Promise<T> {
    return breaker.isOpen() ? Promise.reject(new StoreUnavailableError()) : execute(command)
  }

  return {
    get: key => run(() => client.get(key)),
    set: (key, value, ttlSeconds) => run(async () => { await client.set(key, value, 'EX', ttlSeconds) }),
    getOrSet: (key, value, ttlSeconds) => run(async () => (await client.set(key, value, 'EX', ttlSeconds, 'NX', 'GET')) ?? value),
    // Invalidations bypass the open breaker: a lost bump means stale views, so it is always worth one bounded try.
    increment: (key, seed, ttlSeconds) => execute(async () => {
      const results = await client.multi().set(key, seed, 'EX', ttlSeconds, 'NX').incr(key).expire(key, ttlSeconds).exec()
      const failure = results?.find(([error]) => error !== null)?.[0]
      if (!results || failure) throw failure ?? new Error('Redis transaction aborted')
    }),
  }
}
