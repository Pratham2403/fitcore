import { describe, expect, it } from 'vitest'
import { buildAuthConfirmUrl, defaultNextPathFor, isAuthLinkError, parseLinkOtpType, sanitizeNextPath } from './links'

const FALLBACK = '/fallback'

describe('sanitizeNextPath', () => {
  it.each(['/onboarding', '/reset-password', '/history?tab=prs', '/a#b'])('keeps the internal path %s', path => {
    expect(sanitizeNextPath(path, FALLBACK)).toBe(path)
  })

  it.each([
    null, '', 'onboarding', '//evil.com', '//evil.com/path', 'https://evil.com', 'javascript:alert(1)',
    '/\\evil.com', '\\\\evil.com', '/\t/evil.com', '/\n/evil.com', ' /onboarding',
    '/.//evil.com', '/..//evil.com', '/a/..//evil.com', '/%2e//evil.com', '/%2e%2e//evil.com', '/./\\evil.com',
  ])('falls back for %j', rawNext => {
    expect(sanitizeNextPath(rawNext, FALLBACK)).toBe(FALLBACK)
  })
})

describe('link types', () => {
  it('whitelists email link types', () => {
    expect(parseLinkOtpType('recovery')).toBe('recovery')
    expect(parseLinkOtpType('invite')).toBeNull()
    expect(parseLinkOtpType('magiclink')).toBeNull()
    expect(parseLinkOtpType('sms')).toBeNull()
    expect(parseLinkOtpType(null)).toBeNull()
  })

  it('defaults signup to onboarding, recovery to reset-password, an unknown type home', () => {
    expect(defaultNextPathFor('signup')).toBe('/onboarding')
    expect(defaultNextPathFor('email')).toBe('/onboarding')
    expect(defaultNextPathFor('recovery')).toBe('/reset-password')
    expect(defaultNextPathFor(null)).toBe('/')
  })
})

describe('buildAuthConfirmUrl', () => {
  it('targets /auth/confirm on the given origin with an encoded next', () => {
    expect(buildAuthConfirmUrl('https://preview-abc.vercel.app', '/onboarding'))
      .toBe('https://preview-abc.vercel.app/auth/confirm?next=%2Fonboarding')
  })
})

describe('isAuthLinkError', () => {
  it('recognises only the typed code', () => {
    expect(isAuthLinkError('auth_link_invalid')).toBe(true)
    expect(isAuthLinkError('something')).toBe(false)
    expect(isAuthLinkError(['auth_link_invalid'])).toBe(false)
    expect(isAuthLinkError(undefined)).toBe(false)
  })
})
