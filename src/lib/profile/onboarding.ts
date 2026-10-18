import 'server-only'
import { z } from 'zod'
import type { ServerSupabaseClient } from '@/lib/supabase/server'
import { ONBOARDED_TTL_SECONDS, cacheKeys, dataCache } from '@/lib/cache'
import { assertNoDbError } from '@/lib/errors'

/**
 * Whether the user finished onboarding; checked on every app-shell render. Only `true` is cached: onboarding never
 * reverts, so the entry needs no invalidation and a user who just onboarded is never held back by a cached `false`.
 */
export function isOnboarded(supabase: ServerSupabaseClient, userId: string): Promise<boolean> {
  return dataCache.readThrough(cacheKeys.userOnboarded(userId), z.literal(true), ONBOARDED_TTL_SECONDS, async () => {
    const { data, error } = await supabase.from('user_profile').select('onboarded_at').eq('user_id', userId).maybeSingle()
    assertNoDbError(error, 'load onboarding state')
    return Boolean(data?.onboarded_at)
  }, isComplete => isComplete)
}
