const CACHE_NAMESPACE = 'fitcore'
/** Bump when a cached payload shape or migration-managed reference data (catalog, substitution rules) changes. */
const CACHE_SCHEMA_VERSION = 3
/** Keeps dev and preview deployments sharing a Redis from serving entries built by different code to production. */
const DEPLOYMENT_ENVIRONMENT = process.env.VERCEL_ENV ?? 'development'
const PREFIX = `${CACHE_NAMESPACE}:${DEPLOYMENT_ENVIRONMENT}:v${CACHE_SCHEMA_VERSION}`

/** Facet-only browsing is a small, highly repeated key space; the catalog only changes through migrations. */
export const CATALOG_BROWSE_TTL_SECONDS = 86_400
/** Free-text searches are an unbounded key space, so they expire sooner. */
export const CATALOG_TEXT_SEARCH_TTL_SECONDS = 3_600
/** Onboarding only ever goes from incomplete to complete, so a positive answer never goes stale. */
export const ONBOARDED_TTL_SECONDS = 2_592_000
/** Bounds staleness if an invalidation is lost; writes through the app invalidate immediately. */
export const USER_VIEW_TTL_SECONDS = 600
/** Outlives every view key, so an expired counter can never resurrect a stale view. */
export const USER_VERSION_TTL_SECONDS = 86_400

/** Per-user read models, all invalidated together by the user's version counter. */
export type UserView = 'weekly-program' | 'workout-plan' | 'home' | 'history' | 'last-session'

export const cacheKeys = {
  catalogSearch: (normalizedFilters: string) => `${PREFIX}:catalog:search:${normalizedFilters}`,
  userOnboarded: (userId: string) => `${PREFIX}:user:${userId}:onboarded`,
  userVersion: (userId: string) => `${PREFIX}:user:${userId}:version`,
  userView: (userId: string, version: string, view: UserView, params: readonly string[]) =>
    [`${PREFIX}:user:${userId}:${version}:${view}`, ...params].join(':'),
}
