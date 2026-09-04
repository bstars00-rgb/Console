import { useMemo, useState } from 'react'

/** Client-side filter + pagination helper shared by the grid screens. */
export function usePagedFilter<T>(all: T[], predicate: (row: T) => boolean, deps: unknown[]) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Recompute filtered set whenever inputs change; reset to page 1 on filter change.
  const filtered = useMemo(() => all.filter(predicate), [all, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    page: safePage,
    pageSize,
    total,
    pageRows,
    filtered,
    setPage,
    setPageSize: (s: number) => {
      setPageSize(s)
      setPage(1)
    },
    resetPage: () => setPage(1),
  }
}
