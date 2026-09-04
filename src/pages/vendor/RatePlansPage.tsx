import { useMemo, useState } from 'react'
import { Plus, Copy } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, TextInput, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { useRatePlans, useHotels } from '../../data/hooks'
import type { RatePlan } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { useSelection } from '../../lib/useSelection'
import { useToast } from '../../components/ui/Toast'

const CONTRACT = ['', 'Net', 'Commission', 'Sell-Rate'].map((v) => ({ value: v, label: v || 'All' }))
const YESNO = [{ value: '', label: 'All' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function RatePlansPage() {
  const rows = useRatePlans()
  const hotels = useHotels()
  const toast = useToast()
  const sel = useSelection()
  const [hotel, setHotel] = useState('')
  const [planName, setPlanName] = useState('')
  const [contract, setContract] = useState('')
  const [openSales, setOpenSales] = useState('')
  const [applied, setApplied] = useState(0)

  const hotelOpts = useMemo(() => [{ value: '', label: 'All' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))], [hotels])

  const predicate = (r: RatePlan) => {
    if (hotel && r.hotelCode !== hotel) return false
    if (planName && !r.planName.EN.toLowerCase().includes(planName.toLowerCase())) return false
    if (contract && r.contractType !== contract) return false
    if (openSales === 'yes' && !r.openSales) return false
    if (openSales === 'no' && r.openSales) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(rows, predicate, [applied])
  const [searched, setSearched] = useState(false)
  const gridRows = searched ? pageRows : []
  const gridTotal = searched ? total : 0

  const columns: Column<RatePlan>[] = [
    { key: 'rtseq', header: 'Room Type SEQ', render: (r) => r.roomTypeSeq },
    { key: 'ellisrt', header: 'ELLIS Room Type Code', render: (r) => r.ellisRoomTypeCode },
    { key: 'cmsrt', header: 'CMS Room Type Code', render: (r) => r.cmsRoomTypeCode },
    { key: 'rtname', header: 'Room Type Name(EN)', align: 'left', render: (r) => r.roomTypeNameEN },
    { key: 'pseq', header: 'Plan SEQ', render: (r) => r.planSeq, sortable: true, sortValue: (r) => r.planSeq },
    { key: 'ellisp', header: 'ELLIS Room Plan Code', render: (r) => r.ellisRoomPlanCode },
    { key: 'cmsp', header: 'CMS Plan Code', render: (r) => r.cmsPlanCode },
    { key: 'status', header: 'Data Status', render: (r) => r.dataStatus },
    { key: 'charge', header: 'Room Charge', align: 'right', render: (r) => r.roomCharge },
    { key: 'pen', header: 'Plan Name(EN)', align: 'left', render: (r) => r.planName.EN },
    { key: 'contract', header: 'Contract Type', render: (r) => r.contractType },
    { key: 'open', header: 'Open Sales', render: (r) => (r.openSales ? 'Yes' : 'No') },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage(); setSearched(true) }
  const reset = () => { setHotel(''); setPlanName(''); setContract(''); setOpenSales(''); setApplied((n) => n + 1); resetPage(); setSearched(false) }

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} clearable /></Field>
        <Field label="Plan Name"><TextInput className="w-full" value={planName} onChange={(e) => setPlanName(e.target.value)} /></Field>
        <Field label="Contract Type"><Select value={contract} onChange={setContract} options={CONTRACT} /></Field>
        <Field label="Open Sales"><Select value={openSales} onChange={setOpenSales} options={YESNO} /></Field>
      </FilterPanel>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => toast.push('New plan form (mock)', 'info')}><Plus size={14} /> New Plan</Button>
        <Button variant="secondary" disabled={sel.selected.size === 0} onClick={() => toast.push(`Copied ${sel.selected.size} plan(s) (mock)`, 'success')}><Copy size={14} /> Copy</Button>
      </div>

      <div>
        <DataGrid
          kendo
          columns={columns}
          rows={gridRows}
          rowKey={(r) => `${r.roomTypeSeq}-${r.planSeq}`}
          selectable
          selectedKeys={sel.selected}
          onToggle={sel.toggle}
          onToggleAll={(c) => sel.toggleAll(gridRows.map((r) => `${r.roomTypeSeq}-${r.planSeq}`), c)}
          minWidth={1500}
        />
        <Pager kendo page={page} pageSize={pageSize} total={gridTotal} onPage={setPage} onPageSize={setPageSize} />
      </div>
    </div>
  )
}
