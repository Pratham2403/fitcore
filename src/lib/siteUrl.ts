const LOCAL_DEV_SITE_URL = 'http://localhost:3000'

/** Environment variables that can name the site's public origin. */
export type SiteUrlEnv = Partial<Record<'NEXT_PUBLIC_SITE_URL' | 'VERCEL_PROJECT_PRODUCTION_URL' | 'VERCEL_URL' | 'NODE_ENV', string>>

/**
 * Public origin for absolute metadata URLs: NEXT_PUBLIC_SITE_URL, else Vercel's production then deployment host, else
 * localhost outside production.
 * @throws Error in a production build with no site URL, rather than shipping localhost links.
 */
export function resolveSiteUrl(env: SiteUrlEnv): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL)
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
  if (vercelHost) return new URL(`https://${vercelHost}`)
  if (env.NODE_ENV === 'production') throw new Error('Set NEXT_PUBLIC_SITE_URL to the public origin for production builds')
  return new URL(LOCAL_DEV_SITE_URL)
}
