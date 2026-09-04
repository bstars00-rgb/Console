import { useMemo, useState } from 'react'
import { FileSpreadsheet, Trash2, MinusCircle } from 'lucide-react'
import { FilterPanel, Field } from '../../components/ui/FilterPanel'
import { Select, TextInput, DateInput, Button } from '../../components/ui/controls'
import { DataGrid, type Column } from '../../components/ui/DataGrid'
import { Pager } from '../../components/ui/Pager'
import { PaymentStatusBadge, BookingStatusBadge } from '../../components/ui/Badge'
import { useBillings, useBookings } from '../../data/hooks'
import type { Billing, Booking } from '../../data/types'
import { usePagedFilter } from '../../lib/usePagedFilter'
import { useSelection } from '../../lib/useSelection'
import { exportCsv, money } from '../../lib/csv'
import { useToast } from '../../components/ui/Toast'

const PAY = ['', 'Paid', 'Unpaid', 'Partial', 'Refunded'].map((v) => ({ value: v, label: v || 'All' }))
const CUR = ['', 'USD', 'KRW', 'JPY', 'VND', 'CNY'].map((v) => ({ value: v, label: v || 'Select' }))
const BAL = [{ value: '', label: 'All' }, { value: 'nonzero', label: 'Balance ≠ 0' }, { value: 'zero', label: 'Balance = 0' }]

export default function BillingsPage() {
  const billings = useBillings()
  const bookings = useBookings()
  const toast = useToast()
  const sel = useSelection()
  const [status, setStatus] = useState('')
  const [billingNo, setBillingNo] = useState('')
  const [currency, setCurrency] = useState('')
  const [balance, setBalance] = useState('')
  const [issuedFrom, setIssuedFrom] = useState('')
  const [issuedTo, setIssuedTo] = useState('')
  const [applied, setApplied] = useState(0)
  const [activeBilling, setActiveBilling] = useState<string | null>(null)

  const predicate = (r: Billing) => {
    if (status && r.paymentStatus !== status) return false
    if (currency && r.currency !== currency) return false
    if (billingNo && !r.billingNo.toLowerCase().includes(billingNo.toLowerCase())) return false
    if (balance === 'nonzero' && r.balance === 0) return false
    if (balance === 'zero' && r.balance !== 0) return false
    if (issuedFrom && r.issuedDate < issuedFrom) return false
    if (issuedTo && r.issuedDate > issuedTo) return false
    return true
  }
  const { page, pageSize, total, pageRows, setPage, setPageSize, resetPage } = usePagedFilter(billings, predicate, [applied])

  const billingCols: Column<Billing>[] = [
    { key: 'no', header: 'Billing No.', align: 'left', render: (r) => r.billingNo, sortable: true, sortValue: (r) => r.billingNo },
    { key: 'hotel', header: 'Hotel Name', align: 'left', render: (r) => r.hotelName },
    { key: 'issued', header: 'Issued Date', render: (r) => r.issuedDate, sortable: true, sortValue: (r) => r.issuedDate },
    { key: 'pay', header: 'Payment Status', render: (r) => <PaymentStatusBadge status={r.paymentStatus} /> },
    { key: 'paid', header: 'Paid Date', render: (r) => r.paidDate ?? '-' },
    { key: 'cur', header: 'Vendor Currency', render: (r) => r.currency },
    { key: 'sum', header: 'Vendor Sum Amount', align: 'right', render: (r) => r.sumAmount.toLocaleString(), sortable: true, sortValue: (r) => r.sumAmount },
    { key: 'paidamt', header: 'Paid Amount', align: 'right', render: (r) => r.paidAmount.toLocaleString() },
    { key: 'bal', header: 'Balance', align: 'right', render: (r) => r.balance.toLocaleString() },
  ]

  const detailRows: Booking[] = useMemo(() => {
    const b = billings.find((x) => x.billingNo === activeBilling)
    if (!b) return []
    return bookings.filter((bk) => b.bookingItemCodes.includes(bk.ellisBookingCode))
  }, [activeBilling, billings, bookings])

  const detailCols: Column<Booking>[] = [
    { key: 'code', header: 'Booking Item Code', align: 'left', render: (b) => b.ellisBookingCode },
    { key: 'status', header: 'Booking Status', render: (b) => <BookingStatusBadge status={b.bookingStatus} /> },
    { key: 'cnfm', header: 'V. CNFM No.', render: (b) => b.hotelCnfmNo },
    { key: 'hotel', header: 'Hotel Name', align: 'left', render: (b) => b.hotelName },
    { key: 'traveler', header: 'Traveler', align: 'left', render: (b) => b.travelerName },
    { key: 'ci', header: 'C/I', render: (b) => b.checkInDate },
    { key: 'nts', header: 'Nts', render: (b) => b.nights },
    { key: 'cur', header: 'V. Cur', render: (b) => b.currency },
    { key: 'sum', header: 'V. Sum Amt', align: 'right', render: (b) => b.sumAmount.toLocaleString() },
    { key: 'disp', header: 'Dispute', render: (b) => (b.dispute ? 'Y' : 'N') },
  ]

  const doSearch = () => { setApplied((n) => n + 1); resetPage(); setActiveBilling(null) }
  const reset = () => { setStatus(''); setBillingNo(''); setCurrency(''); setBalance(''); setIssuedFrom(''); setIssuedTo(''); setApplied((n) => n + 1); resetPage() }

  return (
    <div className="flex flex-col gap-3">
      <FilterPanel actions={<><Button variant="primary" onClick={doSearch}>Search</Button><Button variant="secondary" onClick={reset}>Reset</Button></>}>
        <Field label="Issued Date" span={2}>
          <div className="flex items-center gap-1.5">
            <DateInput className="flex-1" value={issuedFrom} onChange={setIssuedFrom} />
            <span className="text-muted">~</span>
            <DateInput className="flex-1" value={issuedTo} onChange={setIssuedTo} />
          </div>
        </Field>
        <Field label="Payment Status"><Select value={status} onChange={setStatus} options={PAY} /></Field>
        <Field label="Billing No."><TextInput className="w-full" value={billingNo} onChange={(e) => setBillingNo(e.target.value)} /></Field>
        <Field label="Currency"><Select value={currency} onChange={setCurrency} options={CUR} placeholder="Select" /></Field>
        <Field label="Balance"><Select value={balance} onChange={setBalance} options={BAL} /></Field>
      </FilterPanel>

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-ink">Billing list</span>
        <div className="flex gap-2">
          <Button variant="danger" disabled={sel.selected.size === 0} onClick={() => { toast.push(`Deleted ${sel.selected.size} billing(s) (mock)`, 'error'); sel.clear() }}><Trash2 size={14} /> Delete</Button>
          <Button variant="secondary" disabled={!activeBilling} onClick={() => toast.push('Booking removed from billing (mock)', 'success')}><MinusCircle size={14} /> Remove Booking</Button>
          <Button variant="secondary" onClick={() => { exportCsv('billings.csv', billingCols.map((c) => c.header), pageRows.map((r) => [r.billingNo, r.hotelName, r.issuedDate, r.paymentStatus, r.paidDate ?? '', r.currency, r.sumAmount, r.paidAmount, r.balance])); toast.push('Billings exported', 'success') }}><FileSpreadsheet size={14} /> Excel</Button>
        </div>
      </div>

      <DataGrid
        columns={billingCols}
        rows={pageRows}
        rowKey={(r) => r.billingNo}
        selectable
        selectedKeys={sel.selected}
        onToggle={sel.toggle}
        onToggleAll={(c) => sel.toggleAll(pageRows.map((r) => r.billingNo), c)}
        onRowClick={(r) => setActiveBilling(r.billingNo)}
        minWidth={1100}
      />
      <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />

      <div className="mt-2">
        <span className="text-base font-semibold text-ink">
          Bookings in billing {activeBilling ? <span className="text-primary">{activeBilling}</span> : <span className="text-faint">— select a billing row</span>}
        </span>
        <div className="mt-2">
          <DataGrid columns={detailCols} rows={detailRows} rowKey={(b) => b.id} minWidth={1100} emptyMessage="Select a billing to view its bookings." maxHeight={300} />
        </div>
        {activeBilling && detailRows.length > 0 && (
          <div className="mt-2 flex justify-end text-base text-ink">
            Total: <b className="ml-1">{money(detailRows.reduce((s, b) => s + b.sumAmount, 0), detailRows[0].currency)}</b>
          </div>
        )}
      </div>
    </div>
  )
}
