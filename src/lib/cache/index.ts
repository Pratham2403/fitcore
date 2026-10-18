import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createCache, type Cache, type CacheOperation } from './cache'
import { createRedisStore } from './redisStore'
import { describeCacheError } from './logging'

export { CATALOG_BROWSE_TTL_SECONDS, CATALOG_TEXT_SEARCH_TTL_SECONDS, ONBOARDED_TTL_SECONDS, cacheKeys } from './keys'

const REDIS_PROTOCOLS = /^rediss?$/
const redisUrlSchema = z.url({ protocol: REDIS_PROTOCOLS })

function warnCacheFailure(operation: CacheOperation | 'connection' | 'configuration', error: unknown): void {
  const description = describeCacheError(error)
  console.warn(`[cache] ${operation} failed; serving from the database: ${description}`)
  // A lost invalidation can serve stale views until their TTL, so it must reach alerting, not just the logs.
  if (operation === 'invalidate user') Sentry.captureMessage(`Cache invalidation failed: ${description}`, 'warning')
}

function createAppCache(): Cache {
  const configuredUrl = process.env.REDIS_URL
  if (!configuredUrl) return createCache(null, warnCacheFailure)
  const url = redisUrlSchema.safeParse(configuredUrl)
  if (!url.success) {
    warnCacheFailure('configuration', new Error('REDIS_URL is not a redis:// or rediss:// URL; caching disabled'))
    return createCache(null, warnCacheFailure)
  }
  return createCache(createRedisStore(url.data, error => warnCacheFailure('connection', error)), warnCacheFailure)
}

/** Reuses one client across warm invocations (and across dev hot reloads). */
const globalForCache = globalThis as typeof globalThis & { fitcoreCache?: Cache }

/** The app's cache (composition root); caching is disabled when REDIS_URL is unset or malformed. */
export const dataCache: Cache = globalForCache.fitcoreCache ??= createAppCache()

/** Runs a write, then invalidates the user's cached views even if the write failed part-way through. */
export async function withUserViewInvalidation<T>(userId: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write()
  } finally {
    await dataCache.invalidateUser(userId)
  }
}
