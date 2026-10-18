import { createServerClient } from '@supabase/ssr'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { DomainError } from '@/lib/errors'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies; the middleware refreshes the session instead.
          }
        },
      },
    }
  )
}

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Resolves the session's user id server-side (never caller-supplied); null when signed out.
 * The project signs JWTs with asymmetric keys, so getClaims verifies the signature locally against the cached JWKS
 * instead of a round trip to the auth server; RLS re-verifies the same token on every query.
 */
export async function getOptionalUserId(supabase: ServerSupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims()
  // An unreachable auth server (JWKS fetch) is an outage, not a sign-out; invalid or missing sessions resolve to null.
  if (isAuthRetryableFetchError(error)) throw error
  return data?.claims.sub ?? null
}

/**
 * Resolves the session's user id server-side, never trusting a caller-supplied value.
 * @throws DomainError('UNAUTHENTICATED') when signed out.
 */
export async function getAuthenticatedUserId(supabase: ServerSupabaseClient): Promise<string> {
  const userId = await getOptionalUserId(supabase)
  if (!userId) throw new DomainError('UNAUTHENTICATED', 'Sign in to continue.')
  return userId
}
