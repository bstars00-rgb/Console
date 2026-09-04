import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Select } from './controls'

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  kendo = false,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
  /** Attached Kendo pager: #F6F6F6 bar with a top border, joined to the grid. */
  kendo?: boolean
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex h-6 w-6 items-center justify-center rounded border border-line text-muted enabled:hover:bg-canvas disabled:opacity-40'

  const wrap = kendo
    ? '-mt-px flex items-center justify-between gap-3 border border-grid-line bg-[#F6F6F6] px-3 py-2.5 text-base text-muted'
    : 'mt-2 flex items-center justify-between gap-3 py-1.5 text-base text-muted'

  return (
    <div className={wrap}>
      <div className="flex items-center gap-1">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(1)} aria-label="Go to the first page">
          <ChevronsLeft size={14} />
        </button>
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Go to the previous page">
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 text-ink">
          {page} / {totalPages}
        </span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Go to the next page">
          <ChevronRight size={14} />
        </button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(totalPages)} aria-label="Go to the last page">
          <ChevronsRight size={14} />
        </button>
        <div className="ml-2 w-[72px]">
          <Select
            value={String(pageSize)}
            onChange={(v) => onPageSize(Number(v))}
            options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
      </div>
      <span>
        {from} - {to} of {total} items
      </span>
    </div>
  )
}
