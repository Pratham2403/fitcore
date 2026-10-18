import { describe, expect, it } from 'vitest'
import { resolveSiteUrl } from './siteUrl'

describe('resolveSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://fitcore.example', VERCEL_URL: 'x.vercel.app', NODE_ENV: 'production' }).href)
      .toBe('https://fitcore.example/')
  })

  it('falls back to the Vercel production host, then the deployment host, over https', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'fitcore-eta.vercel.app', VERCEL_URL: 'fitcore-git-x.vercel.app', NODE_ENV: 'production' }).href)
      .toBe('https://fitcore-eta.vercel.app/')
    expect(resolveSiteUrl({ VERCEL_URL: 'fitcore-git-x.vercel.app', NODE_ENV: 'production' }).href).toBe('https://fitcore-git-x.vercel.app/')
  })

  it('treats empty values as unset', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '', VERCEL_URL: 'a.vercel.app' }).href).toBe('https://a.vercel.app/')
  })

  it('uses localhost only outside production', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development' }).href).toBe('http://localhost:3000/')
    expect(() => resolveSiteUrl({ NODE_ENV: 'production' })).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})
