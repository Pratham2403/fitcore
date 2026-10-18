'use server'

import { z } from 'zod'
import { createClient, getOptionalUserId } from '@/lib/supabase/server'
import { assertNoDbError, toActionResult } from '@/lib/errors'
import { parseInput } from '@/lib/validation'
import type { ActionResult } from '@/types'

const MAX_EMAIL_LENGTH = 254
const UNIQUE_VIOLATION_DB_CODE = '23505'
export type WaitlistSource = 'landing' | 'profile' | 'coach'

const waitlistInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(MAX_EMAIL_LENGTH)),
  source: z.enum(['landing', 'profile', 'coach']),
})

/** Adds an email to the Pro waitlist; joining twice is a no-op success. */
export async function joinWaitlist(email: string, source: WaitlistSource): Promise<ActionResult<void>> {
  return toActionResult(async () => {
    const entry = parseInput(waitlistInputSchema, { email, source })
    const supabase = await createClient()
    const userId = await getOptionalUserId(supabase)
    const { error } = await supabase.from('waitlist').insert({ ...entry, user_id: userId })
    if (error?.code === UNIQUE_VIOLATION_DB_CODE) return
    assertNoDbError(error, 'join waitlist')
  })
}
