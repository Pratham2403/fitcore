'use server'

import { joinWaitlist } from '@/lib/waitlist/actions'
import type { WaitlistResult } from '@/components/ui/WaitlistForm'

/** Adds a landing-page visitor to the Pro waitlist. */
export async function submitLandingWaitlist(email: string): Promise<WaitlistResult> {
  const result = await joinWaitlist(email, 'landing')
  if (!result.ok) return { ok: false, message: result.error.message }
  return { ok: true, message: 'You’re on the list — we’ll email you when Pro opens.' }
}
