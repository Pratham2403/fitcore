import { NextResponse } from 'next/server'
import type { z } from 'zod'
import type { DomainErrorCode } from '@/types'

export type ApiErrorCode = DomainErrorCode | 'PAYLOAD_TOO_LARGE'

const HTTP_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  WORKOUT_LIMIT_REACHED: 409,
  WORKOUT_REPLACE_REQUIRED: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
}

const BEARER_TOKEN = /^Bearer ([A-Za-z0-9_.-]+)$/

/** JSON error envelope `{ error: { code, message, ...details } }` with the code's HTTP status. */
export function apiError(code: ApiErrorCode, message: string, details: Readonly<Record<string, unknown>> = {}): NextResponse {
  return NextResponse.json({ error: { code, message, ...details } }, { status: HTTP_STATUS_BY_CODE[code] })
}

/** The access token from an `Authorization: Bearer <jwt>` header; null when absent or malformed. */
export function parseBearerToken(authorization: string | null): string | null {
  return authorization?.match(BEARER_TOKEN)?.[1] ?? null
}

export type JsonBody = { kind: 'parsed'; value: unknown } | { kind: 'too_large' } | { kind: 'malformed' }

/** Reads a JSON request body, refusing bodies over `maxBytes` before parsing them. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBody> {
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return { kind: 'too_large' }
  const text = await request.text()
  if (Buffer.byteLength(text) > maxBytes) return { kind: 'too_large' }
  try {
    return { kind: 'parsed', value: JSON.parse(text) }
  } catch {
    return { kind: 'malformed' }
  }
}

/** Every zod issue with a dotted path (e.g. `3.primaryMuscles`), so a caller can fix a whole batch in one pass. */
export function toValidationIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map(issue => ({ path: issue.path.map(String).join('.'), message: issue.message }))
}
