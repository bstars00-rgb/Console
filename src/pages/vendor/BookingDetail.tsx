import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/controls'
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge'
import { money } from '../../lib/csv'
import type { Booking, BookingStatus } from '../../data/types'

export function BookingDetail({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: Booking | null
  onClose: () => void
  onStatusChange: (id: string, status: BookingStatus) => void
}) {
  const [voucher, setVoucher] = useState(false)
  if (!booking) return null
  const b = booking
  const canConfirm = b.bookingStatus === 'Pending'
  const canCancel = b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending'

  return (
    <>
      <Modal
        open={!!booking && !voucher}
        onClose={onClose}
        title={`Booking ${b.ellisBookingCode}`}
        width={640}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={() => setVoucher(true)}>
              <Printer size={14} /> Voucher
            </Button>
            <div className="flex gap-2">
              {canConfirm && (
                <Button variant="primary" onClick={() => onStatusChange(b.id, 'Confirmed')}>
                  Confirm
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" onClick={() => onStatusChange(b.id, 'Cancelled')}>
                  Cancel booking
                </Button>
              )}
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Section title="Reservation">
            <Row k="Booking Status" v={<BookingStatusBadge status={b.bookingStatus} />} />
            <Row k="Confirmation No." v={b.hotelCnfmNo} />
            <Row k="ELLIS Code" v={b.ellisBookingCode} />
            <Row k="Contract Type" v={b.contractType} />
            <Row k="Booking Date" v={b.bookingDate} />
            {b.bookingCancelDate && <Row k="Cancel Date" v={b.bookingCancelDate} />}
            {b.oldBookingCode && <Row k="Old Booking Code" v={b.oldBookingCode} />}
          </Section>

          <Section title="Customer">
            <Row k="1st Traveler" v={b.travelerName} />
            <Row k="Email" v={b.email} />
            <Row k="Phone" v={b.phone} />
            {b.specialRequest && <Row k="Special Request" v={b.specialRequest} />}
          </Section>

          <Section title="Stay & Rooms">
            <Row k="Hotel" v={b.hotelName} />
            <Row k="Check-in / Nights" v={`${b.checkInDate} / ${b.nights} night(s)`} />
            <Row k="Meal" v={`${b.mealType}${b.freeBreakfast ? ' · Free breakfast' : ''}`} />
            <div className="mt-1 overflow-hidden rounded border border-line">
              <table className="w-full text-md">
                <thead className="bg-canvas text-base font-semibold">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Guest</th>
                    <th className="px-2 py-1.5 text-left">Room / Plan</th>
                    <th className="px-2 py-1.5 text-center">Adults</th>
                    <th className="px-2 py-1.5 text-center">Children</th>
                    <th className="px-2 py-1.5 text-right">Rate/Night</th>
                  </tr>
                </thead>
                <tbody>
                  {b.rooms.map((r, i) => (
                    <tr key={i} className="border-t border-line-soft">
                      <td className="px-2 py-1.5">{r.guestName}</td>
                      <td className="px-2 py-1.5">{`${r.roomType} · ${r.planName}`}</td>
                      <td className="px-2 py-1.5 text-center">{r.adults}</td>
                      <td className="px-2 py-1.5 text-center">{r.children}</td>
                      <td className="px-2 py-1.5 text-right">{money(r.ratePerNight, b.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Payment">
            <Row k="Payment Status" v={<PaymentStatusBadge status={b.paymentStatus} />} />
            <Row k="Currency" v={b.currency} />
            <Row k="Total Amount" v={<b>{money(b.sumAmount, b.currency)}</b>} />
            <Row k="Billing No." v={b.billingNo ?? '-'} />
            {b.dispute && <Row k="Dispute" v={b.disputeRemark || 'Under review'} />}
          </Section>
        </div>
      </Modal>

      <VoucherModal open={voucher} onClose={() => setVoucher(false)} booking={b} />
    </>
  )
}

function VoucherModal({ open, onClose, booking }: { open: boolean; onClose: () => void; booking: Booking }) {
  const b = booking
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking Voucher"
      width={600}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </Button>
        </>
      }
    >
      <div className="rounded border border-line p-5">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <div>
            <div className="text-lg font-bold text-primary">OHMYHOTEL&amp;CO</div>
            <div className="text-caption text-muted">Booking Confirmation Voucher</div>
          </div>
          <div className="text-right text-base">
            <div className="font-semibold">{b.hotelCnfmNo}</div>
            <BookingStatusBadge status={b.bookingStatus} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
          <Row k="Hotel" v={b.hotelName} />
          <Row k="Guest" v={b.travelerName} />
          <Row k="Check-in" v={b.checkInDate} />
          <Row k="Nights" v={String(b.nights)} />
          <Row k="Room" v={`${b.roomType} × ${b.roomCount}`} />
          <Row k="Plan" v={b.planName} />
          <Row k="Meal" v={b.mealType} />
          <Row k="Total" v={money(b.sumAmount, b.currency)} />
        </dl>
        <p className="mt-4 border-t border-line pt-3 text-caption text-muted">
          Present this voucher at check-in. Prototype document — not a real reservation.
        </p>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 border-b border-line pb-1 text-md font-semibold text-ink">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">{children}</dl>
    </section>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 flex-1 break-words text-ink">{v}</dd>
    </div>
  )
}
