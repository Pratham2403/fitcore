import type { ActionResult, DomainErrorCode } from '@/types'

/** An expected, user-facing failure that server actions convert into a failed ActionResult. */
export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

/** Unexpected data-layer failure; propagates to the error boundary / Sentry. */
export class DataAccessError extends Error {
  constructor(operation: string, cause: { message: string; code?: string }) {
    super(`${operation} failed: ${cause.message}`)
    this.name = 'DataAccessError'
  }
}

/** Throws a DataAccessError when a Supabase call returned an error. */
export function assertNoDbError(error: { message: string; code?: string } | null, operation: string): void {
  if (error) throw new DataAccessError(operation, error)
}

/** Returns a Supabase result's data, throwing DataAccessError on an error or a missing row. */
export function requireDbData<Result extends { data: unknown; error: { message: string; code?: string } | null }>(
  result: Result,
  operation: string,
): NonNullable<Result['data']> {
  assertNoDbError(result.error, operation)
  const { data } = result
  if (data === null || data === undefined) throw new DataAccessError(operation, { message: 'no row returned' })
  return data
}

/**
 * Runs an action body, mapping DomainErrors to failed results; any other error is rethrown.
 */
export async function toActionResult<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await run() }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, error: { code: error.code, message: error.message } }
    throw error
  }
}
