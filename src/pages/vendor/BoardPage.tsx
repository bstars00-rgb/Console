import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { SearchInput, Select, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import type { BoardPost } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'

export function BoardPage({
  posts,
  kind,
  types,
}: {
  posts: BoardPost[]
  kind: 'faq' | 'notice'
  types: string[]
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [applied, setApplied] = useState(0)
  const [open, setOpen] = useState<BoardPost | null>(null)

  const predicate = (p: BoardPost) => {
    if (type && p.type !== type) return false
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }
  // Sort pinned posts to the top (notice board behaviour).
  const sortedPosts = [...posts].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(sortedPosts, predicate, [applied])

  const typeOpts = [{ value: '', label: 'All' }, ...types.map((t) => ({ value: t, label: t }))]

  const columns: Column<BoardPost>[] = [
    { key: 'seq', header: 'Post SEQ', width: 90, render: (p) => p.seq },
    kind === 'notice'
      ? { key: 'pin', header: 'Pin to top', width: 80, render: (p) => (p.pinned ? 'Yes' : 'No') }
      : { key: 'type', header: 'FAQ Type', width: 110, render: (p) => p.type },
    { key: 'title', header: 'Post Title', align: 'left', render: (p) => p.title },
    { key: 'date', header: kind === 'notice' ? 'First Insert Time' : 'Last Update Date', width: 150, render: (p) => p.date, sortable: true, sortValue: (p) => p.date },
    { key: 'views', header: 'View Counts', width: 110, render: (p) => p.views.toLocaleString(), sortable: true, sortValue: (p) => p.views },
    { key: 'file', header: 'Attached File', width: 110, render: (p) => (p.hasAttachment ? 'Yes' : 'No') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={() => { setApplied((n) => n + 1); resetPage() }}>Search</Button><Button variant="secondary" onClick={() => { setQ(''); setType(''); setApplied((n) => n + 1); resetPage() }}>Reset</Button></>}>
        <Field label="Type"><Select value={type} onChange={setType} options={typeOpts} /></Field>
        <Field label="Search" span={2}><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title" /></Field>
      </FilterPanel>

      <div>
        <DataGrid kendo columns={columns} rows={pageRows} rowKey={(p) => String(p.seq)} onRowClick={(p) => setOpen(p)} minWidth={760} />
        <Pager kendo page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} width={620}>
        {open && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-caption text-muted">
              <span>No. {open.seq}</span>
              <span>{open.date}</span>
              <span>Views: {open.views.toLocaleString()}</span>
              {kind === 'faq' && <Badge tone="info">{open.type}</Badge>}
            </div>
            <p className="text-base leading-relaxed text-ink">{open.body}</p>
            {open.hasAttachment && (
              <a href="#" onClick={(e) => e.preventDefault()} className="flex w-fit items-center gap-1.5 text-base text-info hover:underline">
                <Paperclip size={13} /> attachment.pdf
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
