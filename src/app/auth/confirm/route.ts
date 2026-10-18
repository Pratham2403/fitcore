import { NextResponse, type NextRequest } from 'next/server'
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js'
import { createClient, type ServerSupabaseClient } from '@/lib/supabase/server'
import { AUTH_LINK_ERROR, defaultNextPathFor, parseLinkOtpType, sanitizeNextPath, type LinkOtpType } from '@/lib/auth/links'

const LOGIN_PATH = '/login'

/**
 * Completes an emailed auth link (signup confirmation, password recovery) and redirects to
 * the link's internal `next` path. Accepts the token-hash template link (`?token_hash=&type=`), which works on any
 * device, and the PKCE redirect (`?code=`), which only works in the browser that requested the email because the code
 * verifier lives in that browser's cookies; every failure lands on the login page with a typed error.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const type = parseLinkOtpType(searchParams.get('type'))
  const nextPath = sanitizeNextPath(searchParams.get('next'), defaultNextPathFor(type))

  const isCompleted = await completeLink(await createClient(), searchParams, type)
  return isCompleted ? redirectToPath(request, nextPath) : redirectToLinkError(request)
}

async function completeLink(supabase: ServerSupabaseClient, searchParams: URLSearchParams, type: LinkOtpType | null): Promise<boolean> {
  const tokenHash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  if (tokenHash && type) return isSuccessful(await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  if (code) return isSuccessful(await supabase.auth.exchangeCodeForSession(code))
  return false
}

/** @throws AuthRetryableFetchError when the auth server is unreachable — an outage, not a bad link. */
function isSuccessful({ error }: { error: AuthError | null }): boolean {
  if (isAuthRetryableFetchError(error)) throw error
  return error === null
}

function redirectToPath(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin))
}

function redirectToLinkError(request: NextRequest): NextResponse {
  const url = new URL(LOGIN_PATH, request.nextUrl.origin)
  url.searchParams.set('error', AUTH_LINK_ERROR)
  return NextResponse.redirect(url)
}
