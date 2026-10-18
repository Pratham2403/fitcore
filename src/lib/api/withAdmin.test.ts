import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError } from '@/lib/errors'
import { withAdmin } from './withAdmin'

const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/bearer', () => ({ createBearerClient: () => ({ auth: { getUser }, rpc }) }))

const handler = vi.fn(async () => new Response('ok'))
const route = withAdmin(handler)
const call = (authorization?: string) =>
  route(new Request('http://test/api/admin', { method: 'POST', headers: authorization ? { authorization } : {} }))

describe('withAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    rpc.mockResolvedValue({ data: true, error: null })
  })

  it('returns 401 without a bearer token and never calls the handler', async () => {
    expect((await call()).status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 401 for an invalid or expired token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', message: 'invalid JWT' } })
    expect((await call('Bearer bad.token')).status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin and never calls the handler', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    const response = await call('Bearer good.token')
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes the admin context to the handler', async () => {
    expect((await call('Bearer good.token')).status).toBe(200)
    expect(handler).toHaveBeenCalledWith(expect.any(Request), expect.objectContaining({ userId: 'user-1' }))
  })

  it('maps a handler DomainError to its status', async () => {
    handler.mockRejectedValueOnce(new DomainError('CONFLICT', 'taken'))
    expect((await call('Bearer good.token')).status).toBe(409)
  })

  it('propagates a role-check failure instead of treating it as forbidden', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'db down' } })
    await expect(call('Bearer good.token')).rejects.toThrow('check admin role failed')
  })
})
