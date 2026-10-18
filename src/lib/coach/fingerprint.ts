import 'server-only'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { DomainError } from '@/lib/errors'

/**
 * Salted hash identifying an anonymous requester for rate limiting; the raw IP and user agent are never stored.
 * @throws DomainError('AI_UNAVAILABLE') when AI_FINGERPRINT_SALT is not configured.
 */
export function computeFingerprint(): string {
  const salt = process.env.AI_FINGERPRINT_SALT
  if (!salt) throw new DomainError('AI_UNAVAILABLE', 'The AI Coach is not available right now.')
  const requestHeaders = headers()
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || ''
  const userAgent = requestHeaders.get('user-agent') ?? ''
  return createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex')
}
