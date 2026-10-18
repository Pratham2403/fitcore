import 'server-only'
import { isAuthRetryableFetchError, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { DomainError, assertNoDbError } from '@/lib/errors'
import { createBearerClient } from '@/lib/supabase/bearer'
import { apiError, parseBearerToken } from './http'

export interface AdminContext {
  /** Queries as the admin, so RLS (not a service-role key) authorises every write. */
  supabase: SupabaseClient<Database>
  userId: string
}

type AdminRouteHandler = (request: Request, admin: AdminContext) => Promise<Response>

async function authorizeAdmin(request: Request): Promise<AdminContext> {
  const token = parseBearerToken(request.headers.get('authorization'))
  if (!token) throw new DomainError('UNAUTHENTICATED', 'Send an Authorization: Bearer <Supabase access token> header.')
  const supabase = createBearerClient(token)
  // getUser, not getClaims: getClaims throws plain Errors for expired or malformed tokens (a 500 instead of a 401),
  // and the auth-server round trip also rejects tokens of signed-out sessions.
  const { data, error } = await supabase.auth.getUser(token)
  // An unreachable auth server is an outage, not a bad token.
  if (isAuthRetryableFetchError(error)) throw error
  const userId = data.user?.id
  if (!userId) throw new DomainError('UNAUTHENTICATED', 'The access token is invalid or expired.')
  // The same is_admin() the RLS insert policy uses, so the guard and the database cannot disagree.
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
  assertNoDbError(roleError, 'check admin role')
  if (!isAdmin) throw new DomainError('FORBIDDEN', 'This endpoint requires an ADMIN account.')
  return { supabase, userId }
}

/**
 * Route guard: only a valid Supabase access token whose user has role ADMIN reaches `handler`.
 * DomainErrors from the guard or the handler become JSON error responses; anything else propagates (500, Sentry).
 */
export function withAdmin(handler: AdminRouteHandler): (request: Request) => Promise<Response> {
  return async request => {
    try {
      return await handler(request, await authorizeAdmin(request))
    } catch (error) {
      if (error instanceof DomainError) return apiError(error.code, error.message)
      throw error
    }
  }
}
