import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { EmptyState } from './feedback'

export interface Column<T> {
  key: string
  header: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** Value used for sorting; defaults to the rendered cell if a `sortValue` isn't given. */
  sortValue?: (row: T) => string | number
  render: (row: T) => React.ReactNode
}

type SortDir = 'asc' | 'desc'

/**
 * Kendo-style data grid: 40px header (weight 600, centered), 14px data rows,
 * hairline borders, optional checkbox selection, sortable headers, horizontal
 * scroll for wide column sets, sticky header.
 */
export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  selectable = false,
  selectedKeys,
  onToggle,
  onToggleAll,
  onRowClick,
  minWidth,
  maxHeight = 460,
  emptyMessage,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  selectable?: boolean
  selectedKeys?: Set<string>
  onToggle?: (key: string) => void
  onToggleAll?: (checked: boolean) => void
  onRowClick?: (row: T) => void
  minWidth?: number
  maxHeight?: number
  emptyMessage?: string
}) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const val = col.sortValue ?? ((r: T) => String(col.render(r) ?? ''))
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = val(a)
      const vb = val(b)
      if (va < vb) return sort.dir === 'asc' ? -1 : 1
      if (va > vb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sort, columns])

  const allChecked = selectable && rows.length > 0 && selectedKeys?.size === rows.length

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  return (
    <div className="overflow-auto rounded border border-grid-line" style={{ maxHeight }}>
      <table className="w-full border-collapse text-md" style={{ minWidth }}>
        <thead className="sticky top-0 z-10">
          <tr className="h-10 bg-canvas text-base font-semibold text-ink">
            {selectable && (
              <th className="w-9 border-b border-grid-line px-2 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={!!allChecked}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap border-b border-r border-grid-line px-2 last:border-r-0"
                style={{ width: c.width, textAlign: c.align ?? 'center' }}
              >
                <button
                  type="button"
                  disabled={!c.sortable}
                  onClick={() => c.sortable && toggleSort(c.key)}
                  className={`inline-flex items-center gap-0.5 ${c.sortable ? 'cursor-pointer hover:text-primary' : 'cursor-default'}`}
                >
                  {c.header}
                  {c.sortable && sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const k = rowKey(row)
              return (
                <tr
                  key={k}
                  onClick={() => onRowClick?.(row)}
                  className={`h-9 border-b border-grid-line bg-white text-md hover:bg-primary-light/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selectedKeys?.has(k) ? 'bg-primary-light/60' : ''}`}
                >
                  {selectable && (
                    <td className="border-r border-grid-line px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selectedKeys?.has(k) ?? false}
                        onChange={() => onToggle?.(k)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="whitespace-nowrap border-r border-grid-line px-2 text-ink last:border-r-0"
                      style={{ textAlign: c.align ?? 'center' }}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
