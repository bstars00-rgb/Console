import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button, Checkbox } from '../../components/ui/controls'
import { useHotels } from '../../data/hooks'
import { buildAllotmentRows } from '../../data/seed'
import { useToast } from '../../components/ui/Toast'

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RateAllotmentPage() {
  const hotels = useHotels()
  const toast = useToast()
  const [hotel, setHotel] = useState(hotels[0]?.code ?? '')
  const [ym, setYm] = useState({ year: 2026, month: 9 })
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [hasAllotOnly, setHasAllotOnly] = useState(false)

  const hotelOpts = hotels.map((h) => ({ value: h.code, label: h.name.EN }))
  const rows = useMemo(() => buildAllotmentRows(hotel || hotels[0]?.code, ym.year, ym.month), [hotel, hotels, ym])
  const filtered = rows.filter((r) => (hasAllotOnly ? r.days.some((d) => d.allotment > 0) : true))
  const days = filtered[0]?.days ?? []

  const shiftMonth = (delta: number) => {
    setYm((prev) => {
      const m = prev.month + delta
      if (m < 1) return { year: prev.year - 1, month: 12 }
      if (m > 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: m }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={() => toast.push('Calendar refreshed', 'info')}>Search</Button><Button variant="secondary" onClick={() => { setOnSaleOnly(false); setHasAllotOnly(false) }}>Reset</Button></>}>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} /></Field>
        <Field label=""><Checkbox checked={onSaleOnly} onChange={setOnSaleOnly} label="On Sale Only" /></Field>
        <Field label=""><Checkbox checked={hasAllotOnly} onChange={setHasAllotOnly} label="Has Allotment Only" /></Field>
      </FilterPanel>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => shiftMonth(-1)}><ChevronLeft size={14} /> Last month</Button>
          <span className="text-md font-semibold text-ink">{ym.year}-{String(ym.month).padStart(2, '0')}</span>
          <Button variant="secondary" onClick={() => shiftMonth(1)}>Next Month <ChevronRight size={14} /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => toast.push('All rows hidden (mock)', 'info')}>Hide All</Button>
          <Button variant="secondary" onClick={() => toast.push('Showing allotment only (mock)', 'info')}>Allotment Only</Button>
          <Button variant="secondary" onClick={() => toast.push('Released all allotment (mock)', 'success')}>Release All</Button>
        </div>
      </div>

      <div className="overflow-auto rounded border border-grid-line">
        <table className="border-collapse text-caption">
          <thead className="sticky top-0 z-10">
            <tr className="bg-canvas">
              <th className="sticky left-0 z-20 min-w-[200px] border-b border-r border-grid-line bg-canvas px-2 py-2 text-left font-semibold">
                Rate / Allotment Detail
              </th>
              {days.map((d) => {
                const dow = new Date(d.date).getDay()
                const weekend = dow === 0 || dow === 6
                return (
                  <th key={d.date} className={`min-w-[46px] border-b border-r border-grid-line px-1 py-1 text-center font-medium ${weekend ? 'text-danger' : 'text-ink'}`}>
                    <div className="text-[10px] text-muted">{WD[dow]}</div>
                    <div>{Number(d.date.slice(-2))}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.roomTypeSeq}-${r.planName}`} className="border-b border-grid-line">
                <td className="sticky left-0 z-10 border-r border-grid-line bg-white px-2 py-1.5 text-left">
                  <div className="font-medium text-ink">{r.roomTypeName}</div>
                  <div className="text-[10px] text-muted">{r.planName}</div>
                </td>
                {r.days.map((d) => (
                  <td key={d.date} className={`border-r border-grid-line px-1 py-1 text-center ${d.closed ? 'bg-danger/5' : ''}`}>
                    <div className={`font-medium ${d.closed ? 'text-danger line-through' : 'text-ink'}`}>{d.rate}</div>
                    <div className={`text-[10px] ${d.allotment === 0 ? 'text-danger' : 'text-success'}`}>{d.closed ? 'CLS' : d.allotment}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-muted">
        Each cell shows the daily <b>rate</b> (top) and <b>allotment</b> (bottom). <span className="text-danger">CLS</span> = closed/hard-block.
      </p>
    </div>
  )
}
