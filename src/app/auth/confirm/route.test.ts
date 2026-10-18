import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { GET } from './route'

const { verifyOtp, exchangeCodeForSession } = vi.hoisted(() => ({ verifyOtp: vi.fn(), exchangeCodeForSession: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}))

const ORIGIN = 'https://fitcore.example'
const LINK_ERROR_LOCATION = `${ORIGIN}/login?error=auth_link_invalid`
const invalidLink = () => ({ data: {}, error: new AuthApiError('Token has expired or is invalid', 403, 'otp_expired') })

async function locationFor(query: string): Promise<string | null> {
  const response = await GET(new NextRequest(`${ORIGIN}/auth/confirm${query}`))
  expect(response.status).toBe(307)
  return response.headers.get('location')
}

describe('GET /auth/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyOtp.mockResolvedValue({ data: {}, error: null })
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null })
  })

  it('verifies a token hash and continues to next', async () => {
    expect(await locationFor('?token_hash=abc&type=email&next=/history')).toBe(`${ORIGIN}/history`)
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' })
  })

  it.each([
    ['signup', '/onboarding'], ['email', '/onboarding'], ['recovery', '/reset-password'],
  ])('defaults %s links to %s', async (type, path) => {
    expect(await locationFor(`?token_hash=abc&type=${type}`)).toBe(`${ORIGIN}${path}`)
  })

  it('exchanges a PKCE code and continues to next', async () => {
    expect(await locationFor('?code=xyz&next=/onboarding')).toBe(`${ORIGIN}/onboarding`)
    expect(exchangeCodeForSession).toHaveBeenCalledWith('xyz')
  })

  it('sends a failed token hash to login with the typed error', async () => {
    verifyOtp.mockResolvedValue(invalidLink())
    expect(await locationFor('?token_hash=bad&type=signup')).toBe(LINK_ERROR_LOCATION)
  })

  it('sends a failed PKCE exchange (e.g. opened in another browser) to login with the typed error', async () => {
    exchangeCodeForSession.mockResolvedValue(invalidLink())
    expect(await locationFor('?code=xyz')).toBe(LINK_ERROR_LOCATION)
  })

  it.each([
    '', '?next=/onboarding', '?token_hash=abc', '?token_hash=abc&type=sms', '?token_hash=abc&type=magiclink', '?error=access_denied&error_code=otp_expired',
  ])('rejects a link without usable params (%s)', async query => {
    expect(await locationFor(query)).toBe(LINK_ERROR_LOCATION)
    expect(verifyOtp).not.toHaveBeenCalled()
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', '/\t/evil.com', '/.//evil.com', '/%2e//evil.com', '/./\\evil.com'])('never redirects off-site for next=%s', async next => {
    const location = await locationFor(`?token_hash=abc&type=signup&next=${encodeURIComponent(next)}`)
    expect(location).toBe(`${ORIGIN}/onboarding`)
  })

  it('surfaces an auth outage instead of blaming the link', async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: new AuthRetryableFetchError('fetch failed', 0) })
    await expect(GET(new NextRequest(`${ORIGIN}/auth/confirm?token_hash=abc&type=signup`))).rejects.toBeInstanceOf(AuthRetryableFetchError)
  })
})
