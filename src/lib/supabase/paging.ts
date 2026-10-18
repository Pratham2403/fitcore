import { requireDbData } from '@/lib/errors'

/** PostgREST's default max_rows: a single select silently returns at most this many rows. */
export const MAX_ROWS_PER_PAGE = 1000

type PageResult<Row> = { data: Row[] | null; error: { message: string; code?: string } | null }

/**
 * Reads every row of a query by paging past the PostgREST row cap; `fetchPage` must apply a stable order.
 * @param fetchPage - fetches the inclusive row range [from, to].
 * @throws DataAccessError when a page fails.
 */
export async function selectAllPages<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<Row>>,
  operation: string,
): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += MAX_ROWS_PER_PAGE) {
    const page = requireDbData(await fetchPage(from, from + MAX_ROWS_PER_PAGE - 1), operation)
    rows.push(...page)
    if (page.length < MAX_ROWS_PER_PAGE) return rows
  }
}
