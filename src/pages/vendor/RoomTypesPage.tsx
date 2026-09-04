import { useMemo, useState } from 'react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, TextInput, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { useRoomTypes, useHotels } from '../../data/hooks'
import type { RoomType } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { useSelection } from '../../lib/useSelection'

const YESNO = [
  { value: '', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]
const STATUS = ['', 'Approved', 'Pending', 'Rejected', 'Draft'].map((v) => ({ value: v, label: v || 'All' }))

export default function RoomTypesPage() {
  const rows = useRoomTypes()
  const hotels = useHotels()
  const [hotel, setHotel] = useState('')
  const [name, setName] = useState('')
  const [cms, setCms] = useState('')
  const [openSales, setOpenSales] = useState('')
  const [status, setStatus] = useState('')
  const [applied, setApplied] = useState(0)

  const hotelOpts = useMemo(() => [{ value: '', label: 'All' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))], [hotels])

  const predicate = (r: RoomType) => {
    if (hotel && r.hotelCode !== hotel) return false
    if (name && !r.name.EN.toLowerCase().includes(name.toLowerCase())) return false
    if (cms && !r.cmsInfo.toLowerCase().includes(cms.toLowerCase())) return false
    if (openSales === 'yes' && !r.openSales) return false
    if (openSales === 'no' && r.openSales) return false
    if (status && r.dataStatus !== status) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied])
  const sel = useSelection()
  const [searched, setSearched] = useState(false)
  const gridRows = searched ? pageRows : []
  const gridTotal = searched ? total : 0

  const columns: Column<RoomType>[] = [
    { key: 'seq', header: 'Room Type SEQ', render: (r) => r.seq, sortable: true, sortValue: (r) => r.seq },
    { key: 'ellis', header: 'ELLIS Room Type Code', render: (r) => r.ellisRoomTypeCode },
    { key: 'cms', header: 'CMS/PMS Info', render: (r) => r.cmsInfo },
    { key: 'status', header: 'Data Status', render: (r) => r.dataStatus },
    { key: 'price', header: 'Local Price', align: 'right', render: (r) => r.localPrice },
    { key: 'name', header: 'Room Type Name(EN)', align: 'left', render: (r) => r.name.EN, sortable: true, sortValue: (r) => r.name.EN },
    { key: 'open', header: 'Open Sales', render: (r) => (r.openSales ? 'Yes' : 'No') },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage(); setSearched(true) }
  const reset = () => { setHotel(''); setName(''); setCms(''); setOpenSales(''); setStatus(''); setApplied((n) => n + 1); resetPage(); setSearched(false) }

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} clearable /></Field>
        <Field label="Room Type"><TextInput className="w-full" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="CMS/PMS Code"><TextInput className="w-full" value={cms} onChange={(e) => setCms(e.target.value)} /></Field>
        <Field label="Open Sales"><Select value={openSales} onChange={setOpenSales} options={YESNO} /></Field>
        <Field label="Data status"><Select value={status} onChange={setStatus} options={STATUS} /></Field>
      </FilterPanel>

      <div>
        <DataGrid
          kendo
          columns={columns}
          rows={gridRows}
          rowKey={(r) => String(r.seq)}
          selectable
          selectedKeys={sel.selected}
          onToggle={sel.toggle}
          onToggleAll={(c) => sel.toggleAll(gridRows.map((r) => String(r.seq)), c)}
          minWidth={900}
        />
        <Pager kendo page={page} pageSize={pageSize} total={gridTotal} onPage={setPage} onPageSize={setPageSize} />
      </div>
    </div>
  )
}
