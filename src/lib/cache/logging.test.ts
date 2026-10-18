import { describe, expect, it } from 'vitest'
import { describeCacheError, redactCredentials } from './logging'

describe('cache error logging', () => {
  it('strips credentials from URLs, including passwords containing / or @', () => {
    expect(redactCredentials('connect EINVAL //default:s3cr/et@host.upstash.io:6379')).toBe('connect EINVAL //[redacted]@host.upstash.io:6379')
    expect(redactCredentials('rediss://user:p@ss@host:6379 failed')).toBe('rediss://[redacted]@host:6379 failed')
  })

  it('prefers the error code, which never embeds the URL', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED //default:secret@host:6379'), { code: 'ECONNREFUSED' })
    expect(describeCacheError(error)).toBe('ECONNREFUSED')
  })
})
