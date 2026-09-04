import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, CalendarCheck, BedDouble, DollarSign, TrendingUp, XCircle, Percent } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,
} from 'recharts'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, Button } from '../../components/ui/controls'
import { useBookings, useHotels } from '../../data/hooks'
import { useToast } from '../../components/ui/Toast'
import type { Booking } from '../../data/types'

const PERIOD = [
  { value: 'current', label: 'Current Month' },
  { value: 'last3', label: 'Last 3 Months' },
  { value: 'ytd', label: 'Year to Date' },
]
const STATUS_COLORS: Record<string, string> = {
  Confirmed: '#2E7D32',
  Pending: '#F5A623',
  Cancelled: '#D0021B',
  'No-show': '#9AA0A6',
}

export default function DashboardPage() {
  const bookings = useBookings()
  const hotels = useHotels()
  const toast = useToast()
  const [hotel, setHotel] = useState('')
  const [period, setPeriod] = useState('current')

  const hotelOpts = useMemo(() => [{ value: '', label: 'All Hotels' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))], [hotels])
  const rows = useMemo(() => bookings.filter((b) => (hotel ? b.hotelCode === hotel : true)), [bookings, hotel])

  const kpi = useMemo(() => computeKpi(rows), [rows])
  const byMonth = useMemo(() => reservationsByMonth(rows), [rows])
  const byStatus = useMemo(() => reservationsByStatus(rows), [rows])
  const byHotel = useMemo(() => revenueByHotel(rows, hotels), [rows, hotels])

  return (
    <div className="flex flex-col gap-4">
      <FilterPanel actions={
        <>
          <Button variant="primary" onClick={() => toast.push('Dashboard refreshed', 'info')}>Search</Button>
          <Button variant="secondary" onClick={() => toast.push('Exported to Excel (mock)', 'success')}><FileSpreadsheet size={14} /> Excel</Button>
          <Button variant="secondary" onClick={() => window.print()}><FileText size={14} /> Pdf</Button>
        </>
      }>
        <Field label="Hotel"><Select value={hotel} onChange={setHotel} options={hotelOpts} clearable /></Field>
        <Field label="Period"><Select value={period} onChange={setPeriod} options={PERIOD} /></Field>
      </FilterPanel>

      <div className="text-caption text-muted">Last updated on 2026-09-04 14:30:00</div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={<CalendarCheck size={18} />} label="Total reservations" value={kpi.total} />
        <Kpi icon={<BedDouble size={18} />} label="Room nights" value={kpi.roomNights} />
        <Kpi icon={<DollarSign size={18} />} label="Revenue (USD eq.)" value={`$${kpi.revenue.toLocaleString()}`} />
        <Kpi icon={<TrendingUp size={18} />} label="ADR (USD eq.)" value={`$${kpi.adr.toLocaleString()}`} />
        <Kpi icon={<Percent size={18} />} label="Occupancy" value={`${kpi.occupancy}%`} />
        <Kpi icon={<XCircle size={18} />} label="Cancellations" value={kpi.cancelled} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Reservations & ADR">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={byMonth} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#EEE" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="reservations" name="Reservations" fill="#EF7F29" radius={[3, 3, 0, 0]} barSize={22} />
              <Line yAxisId="r" dataKey="adr" name="ADR" stroke="#2E86AB" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Reservations by status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
                {byStatus.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLORS[s.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue by hotel (USD eq.)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byHotel} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#EEE" vertical={false} />
              <XAxis dataKey="hotel" tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#6A4C93" radius={[3, 3, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Room nights trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byMonth} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#EEE" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line dataKey="roomNights" name="Room nights" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'danger' }) {
  return (
    <div className="rounded border border-line bg-white p-3 shadow-card">
      <div className={`mb-1 flex items-center gap-1.5 ${tone === 'danger' ? 'text-danger' : 'text-primary'}`}>
        {icon}
        <span className="text-caption text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-white p-3 shadow-card">
      <h3 className="mb-2 text-md font-semibold text-ink">{title}</h3>
      {children}
    </div>
  )
}

// USD-equivalent conversion for mixed-currency mock revenue.
const FX: Record<string, number> = { USD: 1, KRW: 0.00075, JPY: 0.0067, VND: 0.00004, CNY: 0.14 }
const usd = (b: Booking) => Math.round(b.sumAmount * (FX[b.currency] ?? 1))

function computeKpi(rows: Booking[]) {
  const active = rows.filter((b) => b.bookingStatus !== 'Cancelled')
  const roomNights = active.reduce((s, b) => s + b.nights * b.roomCount, 0)
  const revenue = active.reduce((s, b) => s + usd(b), 0)
  return {
    total: rows.length,
    roomNights,
    revenue,
    adr: roomNights ? Math.round(revenue / roomNights) : 0,
    occupancy: Math.min(99, 45 + (rows.length % 40)),
    cancelled: rows.filter((b) => b.bookingStatus === 'Cancelled').length,
  }
}

function reservationsByMonth(rows: Booking[]) {
  const map = new Map<string, { reservations: number; roomNights: number; revenue: number }>()
  for (const b of rows) {
    const m = b.bookingDate.slice(0, 7)
    const cur = map.get(m) ?? { reservations: 0, roomNights: 0, revenue: 0 }
    cur.reservations += 1
    cur.roomNights += b.nights * b.roomCount
    cur.revenue += usd(b)
    map.set(m, cur)
  }
  return [...map.entries()]
    .sort()
    .map(([month, v]) => ({ month, reservations: v.reservations, roomNights: v.roomNights, adr: v.roomNights ? Math.round(v.revenue / v.roomNights) : 0 }))
}

function reservationsByStatus(rows: Booking[]) {
  const statuses = ['Confirmed', 'Pending', 'Cancelled', 'No-show']
  return statuses.map((s) => ({ name: s, value: rows.filter((b) => b.bookingStatus === s).length })).filter((x) => x.value > 0)
}

function revenueByHotel(rows: Booking[], hotels: { code: string; name: { EN: string } }[]) {
  return hotels.map((h) => ({
    hotel: h.name.EN.split(' ').slice(0, 2).join(' '),
    revenue: rows.filter((b) => b.hotelCode === h.code && b.bookingStatus !== 'Cancelled').reduce((s, b) => s + usd(b), 0),
  }))
}
