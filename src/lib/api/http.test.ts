import { describe, expect, it } from 'vitest'
import { apiError, parseBearerToken, readJsonBody } from './http'

const post = (body: string, headers: Record<string, string> = {}) => new Request('http://test/api', { method: 'POST', body, headers })

describe('parseBearerToken', () => {
  it('extracts a JWT-shaped bearer token', () => {
    expect(parseBearerToken('Bearer eyJ.abc-_.def')).toBe('eyJ.abc-_.def')
  })

  it.each([null, '', 'Bearer', 'Bearer ', 'Basic abc', 'bearer abc', 'Bearer a b', 'Bearer a"b'])('rejects %j', header => {
    expect(parseBearerToken(header)).toBeNull()
  })
})

describe('apiError', () => {
  it('maps codes to HTTP statuses inside a JSON envelope', async () => {
    const response = apiError('FORBIDDEN', 'nope', { hint: 1 })
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: { code: 'FORBIDDEN', message: 'nope', hint: 1 } })
    expect(apiError('CONFLICT', 'x').status).toBe(409)
    expect(apiError('PAYLOAD_TOO_LARGE', 'x').status).toBe(413)
  })
})

describe('readJsonBody', () => {
  it('parses JSON', async () => {
    expect(await readJsonBody(post('[1]'), 10)).toEqual({ kind: 'parsed', value: [1] })
  })

  it('rejects malformed JSON', async () => {
    expect(await readJsonBody(post('[1'), 10)).toEqual({ kind: 'malformed' })
  })

  it('rejects bodies over the limit by declared or actual size', async () => {
    expect(await readJsonBody(post('[1]', { 'content-length': '11' }), 10)).toEqual({ kind: 'too_large' })
    expect(await readJsonBody(post('"ééééé"'), 10)).toEqual({ kind: 'too_large' })
  })
})
