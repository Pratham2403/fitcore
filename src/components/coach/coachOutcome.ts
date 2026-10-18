import type { ActionResult, DomainErrorCode } from '@/types'

/** A failed coach call: a domain error from the server, or `UNEXPECTED` when the call itself threw. */
export interface CoachFailure {
  code: DomainErrorCode | 'UNEXPECTED'
  message: string
}

export type CoachOutcome<T> = { ok: true; value: T } | { ok: false; failure: CoachFailure }

const UNEXPECTED_MESSAGE = 'Something went wrong on our side. Please try again.'

/** Runs a coach server action; a thrown error (network, crash) becomes an `UNEXPECTED` failure for the UI to show. */
export async function runCoachAction<T>(action: () => Promise<ActionResult<T>>): Promise<CoachOutcome<T>> {
  try {
    const result = await action()
    return result.ok ? result : { ok: false, failure: result.error }
  } catch (error) {
    console.error('Coach action failed', error)
    return { ok: false, failure: { code: 'UNEXPECTED', message: UNEXPECTED_MESSAGE } }
  }
}
