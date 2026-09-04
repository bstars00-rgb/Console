import { useMemo, useState } from 'react'
import { FileSpreadsheet, ReceiptText } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, TextInput, DateInput, Button, Checkbox } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { useBookings, useHotels } from '../../data/hooks'
import { updateBookingStatus } from '../../data/store'
import type { Booking, BookingStatus } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { exportCsv, money } from '../../lib/csv'
import { useToast } from '../../components/ui/Toast'
import { BookingDetail } from './BookingDetail'

const STATUS_OPTS = ['', 'Confirmed', 'Pending', 'Cancelled', 'No-show'].map((v) => ({ value: v, label: v || 'All' }))
const CONTRACT_OPTS = ['', 'Net', 'Commission', 'Sell-Rate'].map((v) => ({ value: v, label: v || 'All' }))
const CURRENCY_OPTS = ['', 'USD', 'KRW', 'JPY', 'VND', 'CNY'].map((v) => ({ value: v, label: v || 'All' }))
const PAY_OPTS = ['', 'Paid', 'Unpaid', 'Partial', 'Refunded'].map((v) => ({ value: v, label: v || 'All' }))
const DATE_TYPE_OPTS = [
  { value: 'booking', label: 'Booking Date' },
  { value: 'checkin', label: 'Check-in Date' },
]

interface Filters {
  dateType: string
  from: string
  to: string
  hotel: string
  cnfm: string
  traveler: string
  status: string
  contract: string
  ellis: string
  currency: string
  payment: string
  balanceOnly: boolean
}

const EMPTY: Filters = {
  dateType: 'booking',
  from: '',
  to: '',
  hotel: '',
  cnfm: '',
  traveler: '',
  status: '',
  contract: '',
  ellis: '',
  currency: '',
  payment: '',
  balanceOnly: false,
}

export default function BookingsPage() {
  const bookings = useBookings()
  const hotels = useHotels()
  const toast = useToast()
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const hotelOpts = useMemo(
    () => [{ value: '', label: 'All' }, ...hotels.map((h) => ({ value: h.code, label: h.name.EN }))],
    [hotels],
  )

  const predicate = (b: Booking) => {
    const f = applied
    if (f.hotel && b.hotelCode !== f.hotel) return false
    if (f.status && b.bookingStatus !== f.status) return false
    if (f.contract && b.contractType !== f.contract) return false
    if (f.currency && b.currency !== f.currency) return false
    if (f.payment && b.paymentStatus !== f.payment) return false
    if (f.cnfm && !b.hotelCnfmNo.toLowerCase().includes(f.cnfm.toLowerCase())) return false
    if (f.traveler && !b.travelerName.toLowerCase().includes(f.traveler.toLowerCase())) return false
    if (f.ellis && !b.ellisBookingCode.toLowerCase().includes(f.ellis.toLowerCase())) return false
    if (f.balanceOnly && b.paymentStatus === 'Paid') return false
    const d = f.dateType === 'checkin' ? b.checkInDate : b.bookingDate
    if (f.from && d < f.from) return false
    if (f.to && d > f.to) return false
    return true
  }

  const { page, pageSize, total, pageRows, filtered, setPage, setPageSize, resetPage } = usePagedFilter(
    bookings,
    predicate,
    [applied],
  )

  const search = () => {
    setApplied(draft)
    resetPage()
    setSelected(new Set())
    setSearched(true)
  }
  const reset = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
    resetPage()
    setSearched(false)
  }

  // Original shows an empty grid until Search is pressed.
  const gridRows = searched ? pageRows : []
  const gridTotal = searched ? total : 0
  const totalSum = searched ? filtered.reduce((s, b) => s + b.sumAmount, 0) : 0
  const selectedSum = searched ? filtered.filter((b) => selected.has(b.id)).reduce((s, b) => s + b.sumAmount, 0) : 0

  const columns: Column<Booking>[] = [
    { key: 'ellis', header: 'ELLIS Booking Code', sortable: true, align: 'left', render: (b) => b.ellisBookingCode, sortValue: (b) => b.ellisBookingCode },
    { key: 'cnfm', header: 'Hotel CNFM No.', render: (b) => b.hotelCnfmNo },
    { key: 'status', header: 'Booking Status', render: (b) => b.bookingStatus, sortable: true, sortValue: (b) => b.bookingStatus },
    { key: 'hotel', header: 'Hotel Name', align: 'left', render: (b) => b.hotelName, sortable: true, sortValue: (b) => b.hotelName },
    { key: 'traveler', header: '1st Traveler Name', align: 'left', render: (b) => b.travelerName },
    { key: 'ci', header: 'Check-in Date / Nts', render: (b) => `${b.checkInDate} / ${b.nights}`, sortable: true, sortValue: (b) => b.checkInDate },
    { key: 'room', header: 'Room Type / Count', align: 'left', render: (b) => `${b.roomType} / ${b.roomCount}` },
    { key: 'plan', header: 'Plan Name', align: 'left', render: (b) => b.planName },
    { key: 'meal', header: 'Meal Type', render: (b) => b.mealType },
    { key: 'bf', header: 'Free Breakfast', render: (b) => (b.freeBreakfast ? 'Yes' : 'No') },
    { key: 'bd', header: 'Booking Date', render: (b) => b.bookingDate, sortable: true, sortValue: (b) => b.bookingDate },
    { key: 'bcd', header: 'Booking Cancel Date', render: (b) => b.bookingCancelDate ?? '-' },
    { key: 'pay', header: 'V.Payment Status', render: (b) => b.paymentStatus },
    { key: 'cur', header: 'V.Currency', render: (b) => b.currency },
    { key: 'sum', header: 'V.Sum Amt', align: 'right', render: (b) => b.sumAmount.toLocaleString(), sortable: true, sortValue: (b) => b.sumAmount },
    { key: 'bill', header: 'Billing No.', render: (b) => b.billingNo ?? '-' },
    { key: 'disp', header: 'Dispute', render: (b) => (b.dispute ? 'Y' : 'N') },
    { key: 'dispr', header: 'Dispute Remark', align: 'left', render: (b) => b.disputeRemark || '-' },
    { key: 'contract', header: 'Contract Type', render: (b) => b.contractType },
    { key: 'old', header: 'Old Booking Code', render: (b) => b.oldBookingCode ?? '-' },
  ]

  const onExcel = () => {
    exportCsv(
      'bookings.csv',
      columns.map((c) => c.header),
      filtered.map((b) => [
        b.ellisBookingCode, b.hotelCnfmNo, b.bookingStatus, b.hotelName, b.travelerName,
        `${b.checkInDate} / ${b.nights}`, `${b.roomType} / ${b.roomCount}`, b.planName, b.mealType,
        b.freeBreakfast ? 'Yes' : 'No', b.bookingDate, b.bookingCancelDate ?? '', b.paymentStatus,
        b.currency, b.sumAmount, b.billingNo ?? '', b.dispute ? 'Y' : 'N', b.disputeRemark,
        b.contractType, b.oldBookingCode ?? '',
      ]),
    )
    toast.push('Bookings exported to CSV', 'success')
  }

  const onStatusChange = (id: string, status: BookingStatus) => {
    updateBookingStatus(id, status)
    toast.push(`Booking ${status.toLowerCase()}`, status === 'Cancelled' ? 'error' : 'success')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-base font-semibold text-danger">Payment Period: In every 15 Days ({bookings.length})</div>

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
        <Field label="Booking Date" span={2}>
          <div className="flex items-center gap-1.5">
            <Select className="w-32 shrink-0" value={draft.dateType} onChange={(v) => setDraft({ ...draft, dateType: v })} options={DATE_TYPE_OPTS} />
            <DateInput className="flex-1" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} />
            <span className="text-muted">~</span>
            <DateInput className="flex-1" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} />
          </div>
        </Field>
        <Field label="Hotel">
          <Select value={draft.hotel} onChange={(v) => setDraft({ ...draft, hotel: v })} options={hotelOpts} clearable />
        </Field>
        <Field label="Hotel CNFM No.">
          <TextInput className="w-full" value={draft.cnfm} onChange={(e) => setDraft({ ...draft, cnfm: e.target.value })} />
        </Field>
        <Field label="Traveler Name">
          <TextInput className="w-full" value={draft.traveler} onChange={(e) => setDraft({ ...draft, traveler: e.target.value })} />
        </Field>
        <Field label="BKG Status">
          <Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUS_OPTS} />
        </Field>
        <Field label="Contract Type">
          <Select value={draft.contract} onChange={(v) => setDraft({ ...draft, contract: v })} options={CONTRACT_OPTS} />
        </Field>
        <Field label="ELLIS Booking Code">
          <TextInput aria-label="ELLIS Booking Code" className="w-full" value={draft.ellis} onChange={(e) => setDraft({ ...draft, ellis: e.target.value })} />
        </Field>
        <Field label="V.Currency">
          <Select value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={CURRENCY_OPTS} />
        </Field>
        <Field label="Payment status">
          <Select value={draft.payment} onChange={(v) => setDraft({ ...draft, payment: v })} options={PAY_OPTS} />
        </Field>
        <Field label="">
          <Checkbox checked={draft.balanceOnly} onChange={(v) => setDraft({ ...draft, balanceOnly: v })} label="Balance ≠ 0" />
        </Field>
      </FilterPanel>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => toast.push('Billing issued for selected bookings (mock)', 'success')} disabled={selected.size === 0}>
          <ReceiptText size={14} /> Billing Issue
        </Button>
        <Button variant="secondary" onClick={onExcel}>
          <FileSpreadsheet size={14} /> Excel
        </Button>
      </div>

      <div>
        <DataGrid
          kendo
          columns={columns}
          rows={gridRows}
          rowKey={(b) => b.id}
          selectable
          selectedKeys={selected}
          onToggle={(k) =>
            setSelected((s) => {
              const n = new Set(s)
              if (n.has(k)) n.delete(k)
              else n.add(k)
              return n
            })
          }
          onToggleAll={(c) => setSelected(c ? new Set(gridRows.map((b) => b.id)) : new Set())}
          onRowClick={(b) => setDetailId(b.id)}
          minWidth={1900}
        />
        <Pager kendo page={page} pageSize={pageSize} total={gridTotal} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <div className="flex items-center justify-end gap-6 text-base text-ink">
        <span>
          Selected Billing Sum Amount: <b>{money(selectedSum, applied.currency || '')}</b>
        </span>
        <span>
          Total Billing Sum Amount: <b>{money(totalSum, applied.currency || '')}</b>
        </span>
      </div>

      <BookingDetail
        booking={bookings.find((b) => b.id === detailId) ?? null}
        onClose={() => setDetailId(null)}
        onStatusChange={onStatusChange}
      />
    </div>
  )
}
