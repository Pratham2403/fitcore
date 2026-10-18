import { describe, expect, it, vi } from 'vitest'
import { DataAccessError } from '@/lib/errors'
import { MAX_ROWS_PER_PAGE, selectAllPages } from './paging'

const tableOf = (size: number) => Array.from({ length: size }, (_, index) => index)

describe('selectAllPages', () => {
  it('reads past the row cap until a short page', async () => {
    const table = tableOf(MAX_ROWS_PER_PAGE * 2 + 5)
    const fetchPage = vi.fn(async (from: number, to: number) => ({ data: table.slice(from, to + 1), error: null }))
    expect(await selectAllPages(fetchPage, 'read')).toEqual(table)
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('makes one extra request when the table is an exact multiple of the cap', async () => {
    const table = tableOf(MAX_ROWS_PER_PAGE)
    const fetchPage = vi.fn(async (from: number, to: number) => ({ data: table.slice(from, to + 1), error: null }))
    expect(await selectAllPages(fetchPage, 'read')).toHaveLength(MAX_ROWS_PER_PAGE)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('fails loudly when a page errors', async () => {
    await expect(selectAllPages(async () => ({ data: null, error: { message: 'boom' } }), 'read')).rejects.toBeInstanceOf(DataAccessError)
  })
})
