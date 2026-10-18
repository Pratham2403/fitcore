import type { EmailOtpType } from '@supabase/supabase-js'

export const AUTH_CONFIRM_PATH = '/auth/confirm'
export const ONBOARDING_PATH = '/onboarding'
export const RESET_PASSWORD_PATH = '/reset-password'
export const HOME_PATH = '/'

/** Login `?error=` value set when an email link could not be completed. */
export const AUTH_LINK_ERROR = 'auth_link_invalid'

/** Email OTP types the app's emailed links carry (signup confirmation, password recovery); anything else is rejected at the boundary. */
const LINK_OTP_TYPES = ['email', 'signup', 'recovery'] as const satisfies readonly EmailOtpType[]
export type LinkOtpType = (typeof LINK_OTP_TYPES)[number]

/** Where each link type lands when the link carries no usable `next`. */
const DEFAULT_NEXT_BY_TYPE: Record<LinkOtpType, string> = {
  email: ONBOARDING_PATH,
  signup: ONBOARDING_PATH,
  recovery: RESET_PASSWORD_PATH,
}

export function parseLinkOtpType(rawType: string | null): LinkOtpType | null {
  return LINK_OTP_TYPES.find(type => type === rawType) ?? null
}

export function defaultNextPathFor(type: LinkOtpType | null): string {
  return type ? DEFAULT_NEXT_BY_TYPE[type] : HOME_PATH
}

/** Throwaway origin used only to check that `next` resolves to the same origin it started on. */
const SANITIZE_BASE_ORIGIN = 'http://next.invalid'

/**
 * Accepts only same-origin paths ("/x"), so a link can never redirect off-site; protocol-relative ("//host"),
 * backslash ("/\host"), dot-segment ("/.//host"), whitespace-smuggled and scheme-bearing values fall back.
 */
export function sanitizeNextPath(rawNext: string | null, fallback: string): string {
  if (!rawNext?.startsWith('/')) return fallback
  // The WHATWG parser applies the same backslash and tab/newline normalisation browsers do.
  const resolved = new URL(rawNext, SANITIZE_BASE_ORIGIN)
  if (resolved.origin !== SANITIZE_BASE_ORIGIN) return fallback
  // Dot segments can normalise "/.//host" to the pathname "//host", which would re-resolve off-site.
  if (resolved.pathname.startsWith('//')) return fallback
  return `${resolved.pathname}${resolved.search}${resolved.hash}`
}

/** The `/auth/confirm` URL on `origin` that an emailed link returns to before continuing to `nextPath`. */
export function buildAuthConfirmUrl(origin: string, nextPath: string): string {
  const url = new URL(AUTH_CONFIRM_PATH, origin)
  url.searchParams.set('next', nextPath)
  return url.toString()
}

export function isAuthLinkError(rawError: string | string[] | undefined): boolean {
  return rawError === AUTH_LINK_ERROR
}
