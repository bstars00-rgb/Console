import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { useHotels } from '../../data/hooks'
import type { Hotel } from '../../data/types'
import { HotelMasterModal } from './HotelMasterModal'

export default function HotelContentPage() {
  const hotels = useHotels()
  return <HotelList hotels={hotels} />
}

// Column widths measured from the original Kendo grid.
const COLS: { key: string; header: string; width: number; get: (h: Hotel) => string }[] = [
  { key: 'code', header: 'Code', width: 100, get: (h) => h.code },
  { key: 'grade', header: 'Grade', width: 80, get: (h) => h.grade },
  { key: 'en', header: 'Hotel Name(EN)', width: 300, get: (h) => h.name.EN },
  { key: 'ko', header: 'Hotel Name(KO)', width: 300, get: (h) => h.name.KO },
  { key: 'ja', header: 'Hotel Name(JA)', width: 300, get: (h) => h.name.JA },
  { key: 'vi', header: 'Hotel Name(VI)', width: 300, get: (h) => h.name.VI },
  { key: 'zh', header: 'Hotel Name(ZH)', width: 300, get: (h) => h.name.ZH },
  { key: 'status', header: 'Status', width: 100, get: (h) => h.status },
  { key: 'type', header: 'Hotel Type', width: 180, get: (h) => h.hotelType },
  { key: 'phone', header: 'Phone No.', width: 180, get: (h) => h.phone },
  { key: 'country', header: 'Country', width: 150, get: (h) => h.country },
  { key: 'region', header: 'Region Name', width: 200, get: (h) => h.regionName },
  { key: 'rcode', header: 'Region Code', width: 150, get: (h) => h.regionCode },
  { key: 'areas', header: 'Areas', width: 100, get: (h) => String(h.areas) },
  { key: 'fiu', header: 'First Insert User', width: 100, get: (h) => h.firstInsertUser },
  { key: 'fit', header: 'First Insert Time', width: 180, get: (h) => h.firstInsertTime },
  { key: 'luu', header: 'Last Update User', width: 100, get: (h) => h.lastUpdateUser },
  { key: 'lut', header: 'Last Update Time', width: 180, get: (h) => h.lastUpdateTime },
]
const GRID_MIN_WIDTH = COLS.reduce((s, c) => s + c.width, 0)

function HotelList({ hotels }: { hotels: Hotel[] }) {
  const { code } = useParams()
  const [hotel, setHotel] = useState('')
  // Original shows an empty grid ("0 - 0 of 0 items") until Search is pressed.
  const [results, setResults] = useState<Hotel[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  // Clicking a hotel opens the "Hotel Master" popup (matches the original).
  const [openCode, setOpenCode] = useState<string | null>(code ?? null)
  const openHotel = openCode ? hotels.find((h) => h.code === openCode) ?? null : null

  // Direct URL /hotel-content/:code auto-opens that hotel's popup and shows the list behind it.
  useEffect(() => {
    if (code) setResults(hotels)
  }, [code, hotels])

  const hotelOpts = useMemo(
    () => [{ value: '', label: 'Select' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))],
    [hotels],
  )

  const search = () => {
    setResults(hotel ? hotels.filter((h) => h.code === hotel) : hotels)
    setPage(1)
  }
  const reset = () => {
    setHotel('')
    setResults([])
    setPage(1)
  }

  const total = results.length
  const pageRows = results.slice((page - 1) * pageSize, page * pageSize)

  // Plain, center-aligned text cells — exactly like the original (no links/badges).
  const columns: Column<Hotel>[] = COLS.map((c) => ({
    key: c.key,
    header: c.header,
    width: c.width,
    align: 'center',
    render: (h) => c.get(h) || ' ',
  }))

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel
        actions={
          <>
            <Button variant="primary" onClick={search}>
              Search
            </Button>
            <Button variant="secondary" onClick={reset}>
              Reset
            </Button>
          </>
        }
      >
        <Field label="Hotel">
          <Select value={hotel} onChange={setHotel} options={hotelOpts} placeholder="Select" clearable />
        </Field>
      </FilterPanel>

      <div>
        <DataGrid
          kendo
          columns={columns}
          rows={pageRows}
          rowKey={(h) => h.code}
          onRowClick={(h) => setOpenCode(h.code)}
          minWidth={GRID_MIN_WIDTH}
        />
        <Pager kendo page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }} />
      </div>

      {openHotel && <HotelMasterModal hotel={openHotel} onClose={() => setOpenCode(null)} />}
    </div>
  )
}
