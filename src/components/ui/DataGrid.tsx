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
  kendo = false,
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
  /** Faithful Kendo styling (Hotel Content): #F6F6F6 header, #656565 borderless
   *  cells, 40px rows, alternating rows — matches the original grid exactly. */
  kendo?: boolean
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

  const headerTr = kendo
    ? 'h-10 bg-[#F6F6F6] text-base font-semibold text-ink'
    : 'h-10 bg-canvas text-base font-semibold text-ink'
  const headerTh = kendo
    ? 'whitespace-nowrap border-b border-grid-line px-2 py-2.5 font-semibold'
    : 'whitespace-nowrap border-b border-r border-grid-line px-2 last:border-r-0'

  return (
    <div className={`overflow-auto border border-grid-line ${kendo ? '' : 'rounded'}`} style={{ maxHeight }}>
      <table className="w-full border-collapse text-md" style={{ minWidth }}>
        <thead className="sticky top-0 z-10">
          <tr className={headerTr}>
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
                className={headerTh}
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
            sorted.map((row, ri) => {
              const k = rowKey(row)
              const selected = selectedKeys?.has(k)
              const rowCls = kendo
                ? `h-10 text-base text-muted ${ri % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#F1F1F1] ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selected ? 'bg-primary-light/60' : ''}`
                : `h-9 border-b border-grid-line bg-white text-md hover:bg-primary-light/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selected ? 'bg-primary-light/60' : ''}`
              const cellCls = kendo
                ? 'whitespace-nowrap px-2.5 py-[5px] text-muted'
                : 'whitespace-nowrap border-r border-grid-line px-2 text-ink last:border-r-0'
              return (
                <tr key={k} onClick={() => onRowClick?.(row)} className={rowCls}>
                  {selectable && (
                    <td className={`px-2 text-center ${kendo ? '' : 'border-r border-grid-line'}`} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected ?? false}
                        onChange={() => onToggle?.(k)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cellCls} style={{ textAlign: c.align ?? 'center' }}>
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
