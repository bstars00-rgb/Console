import type { BookingStatus, PaymentStatus, DataStatus } from '../../data/types'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE: Record<Tone, string> = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/15 text-[#9a6a00] border-warning/40',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
  neutral: 'bg-canvas text-muted border-line',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-medium leading-none ${TONE[tone]}`}>
      {children}
    </span>
  )
}

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  Confirmed: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
  'No-show': 'neutral',
}
export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => (
  <Badge tone={BOOKING_TONE[status]}>{status}</Badge>
)

const PAY_TONE: Record<PaymentStatus, Tone> = {
  Paid: 'success',
  Unpaid: 'danger',
  Partial: 'warning',
  Refunded: 'info',
}
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAY_TONE[status]}>{status}</Badge>
)

const DATA_TONE: Record<DataStatus, Tone> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'danger',
  Draft: 'neutral',
}
export const DataStatusBadge = ({ status }: { status: DataStatus }) => (
  <Badge tone={DATA_TONE[status]}>{status}</Badge>
)
