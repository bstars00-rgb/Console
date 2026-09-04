import { useMemo, useState } from 'react'
import { Plus, Copy, Layers } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { usePromotions, useHotels } from '../../data/hooks'
import type { Promotion } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { useSelection } from '../../lib/useSelection'
import { useToast } from '../../components/ui/Toast'

const TYPES = ['', 'Early Bird', 'Last Minute', 'Long Stay', 'Flash Sale'].map((v) => ({ value: v, label: v || 'All' }))
const YESNO = [{ value: '', label: 'All' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function PromotionPage() {
  const rows = usePromotions()
  const hotels = useHotels()
  const toast = useToast()
  const sel = useSelection()
  const [hotel, setHotel] = useState('')
  const [type, setType] = useState('')
  const [openSales, setOpenSales] = useState('')
  const [applied, setApplied] = useState(0)

  const hotelOpts = useMemo(() => [{ value: '', label: 'All' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))], [hotels])

  const predicate = (r: Promotion) => {
    if (hotel && r.hotelCode !== hotel) return false
    if (type && r.promotionType !== type) return false
    if (openSales === 'yes' && !r.openSales) return false
    if (openSales === 'no' && r.openSales) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied])

  const columns: Column<Promotion>[] = [
    { key: 'rtseq', header: 'Room Type SEQ', render: (r) => r.roomTypeSeq },
    { key: 'ellisrt', header: 'ELLIS Room Type Code', render: (r) => r.ellisRoomTypeCode },
    { key: 'rtname', header: 'Room Type Name(EN)', align: 'left', render: (r) => r.roomTypeNameEN },
    { key: 'pseq', header: 'Plan SEQ', render: (r) => r.planSeq },
    { key: 'pen', header: 'Plan Name(EN)', align: 'left', render: (r) => r.planNameEN },
    { key: 'prseq', header: 'Promotion SEQ', render: (r) => r.promotionSeq, sortable: true, sortValue: (r) => r.promotionSeq },
    { key: 'elpr', header: 'ELLIS Promotion Code', render: (r) => r.ellisPromotionCode },
    { key: 'ptype', header: 'Promotion Type', render: (r) => r.promotionType },
    { key: 'pname', header: 'Promotion Name(EN)', align: 'left', render: (r) => r.promotionNameEN },
    { key: 'bkg', header: 'BKG From~To Date', render: (r) => `${r.bkgFrom} ~ ${r.bkgTo}` },
    { key: 'ci', header: 'CI From~To Date', render: (r) => `${r.ciFrom} ~ ${r.ciTo}` },
    { key: 'val', header: 'Applied Value', render: (r) => r.appliedValue },
    { key: 'open', header: 'Open Sales', render: (r) => (r.openSales ? 'Yes' : 'No') },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage() }
  const reset = () => { setHotel(''); setType(''); setOpenSales(''); setApplied((n) => n + 1); resetPage() }

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} clearable /></Field>
        <Field label="Promotion Type"><Select value={type} onChange={setType} options={TYPES} /></Field>
        <Field label="Open Sales"><Select value={openSales} onChange={setOpenSales} options={YESNO} /></Field>
      </FilterPanel>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => toast.push('New promotion form (mock)', 'info')}><Plus size={14} /> New</Button>
        <Button variant="secondary" disabled={sel.selected.size === 0} onClick={() => toast.push(`Copied ${sel.selected.size} promotion(s)`, 'success')}><Copy size={14} /> Copy</Button>
        <Button variant="secondary" disabled={sel.selected.size === 0} onClick={() => toast.push(`Bulk updated ${sel.selected.size} promotion(s)`, 'success')}><Layers size={14} /> Bulk Update</Button>
      </div>

      <DataGrid
        columns={columns}
        rows={pageRows}
        rowKey={(r) => String(r.promotionSeq)}
        selectable
        selectedKeys={sel.selected}
        onToggle={sel.toggle}
        onToggleAll={(c) => sel.toggleAll(pageRows.map((r) => String(r.promotionSeq)), c)}
        minWidth={1700}
      />
      <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
    </div>
  )
}
