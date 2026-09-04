import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { DataStatusBadge } from '../../components/ui/Badge'
import { useHotels } from '../../data/hooks'
import type { Hotel } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { useWorkspace } from '../../components/shell/workspace'
import { HotelContentDetail } from './HotelContentDetail'

export default function HotelContentPage() {
  const { code } = useParams()
  const hotels = useHotels()
  if (code) {
    return <HotelContentDetail code={code} />
  }
  return <HotelList hotels={hotels} />
}

function HotelList({ hotels }: { hotels: Hotel[] }) {
  const navigate = useNavigate()
  const [hotel, setHotel] = useState('')
  const [applied, setApplied] = useState(0)
  useWorkspace() // keep tab context available

  const hotelOpts = useMemo(() => [{ value: '', label: 'All' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))], [hotels])
  const predicate = (h: Hotel) => (hotel ? h.code === hotel : true)
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(hotels, predicate, [applied])

  const columns: Column<Hotel>[] = [
    { key: 'code', header: 'Code', width: 80, render: (h) => h.code, sortable: true, sortValue: (h) => h.code },
    { key: 'grade', header: 'Grade', width: 60, render: (h) => `${h.grade}★` },
    { key: 'en', header: 'Hotel Name(EN)', align: 'left', render: (h) => <span className="text-primary hover:underline">{h.name.EN}</span>, sortable: true, sortValue: (h) => h.name.EN },
    { key: 'ko', header: 'Hotel Name(KO)', align: 'left', render: (h) => h.name.KO },
    { key: 'ja', header: 'Hotel Name(JA)', align: 'left', render: (h) => h.name.JA },
    { key: 'vi', header: 'Hotel Name(VI)', align: 'left', render: (h) => h.name.VI },
    { key: 'zh', header: 'Hotel Name(ZH)', align: 'left', render: (h) => h.name.ZH },
    { key: 'status', header: 'Status', render: (h) => <DataStatusBadge status={h.status} /> },
    { key: 'type', header: 'Hotel Type', render: (h) => h.hotelType },
    { key: 'phone', header: 'Phone No.', render: (h) => h.phone },
    { key: 'country', header: 'Country', render: (h) => h.country },
    { key: 'region', header: 'Region Name', render: (h) => h.regionName },
    { key: 'rcode', header: 'Region Code', render: (h) => h.regionCode },
    { key: 'areas', header: 'Areas', render: (h) => h.areas },
    { key: 'fiu', header: 'First Insert User', align: 'left', render: (h) => h.firstInsertUser },
    { key: 'fit', header: 'First Insert Time', render: (h) => h.firstInsertTime },
    { key: 'luu', header: 'Last Update User', align: 'left', render: (h) => h.lastUpdateUser },
    { key: 'lut', header: 'Last Update Time', render: (h) => h.lastUpdateTime },
  ]

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={() => { setApplied((n) => n + 1); resetPage() }}>Search</Button><Button variant="secondary" onClick={() => { setHotel(''); setApplied((n) => n + 1); resetPage() }}>Reset</Button></>}>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} clearable /></Field>
      </FilterPanel>

      <p className="text-caption text-muted">Click a hotel row to open and edit its content.</p>
      <DataGrid
        columns={columns}
        rows={pageRows}
        rowKey={(h) => h.code}
        onRowClick={(h) => navigate(`/vendor/hotel-content/${h.code}`)}
        minWidth={2100}
      />
      <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
    </div>
  )
}
