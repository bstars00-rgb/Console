import { describe, it, expect, beforeEach } from 'vitest'
import {
  BUS_KEY, readBus, writeBus, addBusQuote, addBusDecline, upsertDeal, busToRfps, cancelClosed, sweepUnpaid, type BusInquiry,
} from './groupBus'
import { HOTELS } from './seed'

/** 마켓플레이스가 하는 일(문의 배포)을 테스트에서 대신 */
const publishTestInquiry = (i: BusInquiry) => writeBus((b) => ({ ...b, inquiries: [...b.inquiries, i] }))

const inq = (ref: string, regionEn: string) => ({
  ref, sellerName: 'ATTIC TOURS (KR)', country: 'Japan', region: '오사카', regionEn,
  checkIn: '2026-12-01', checkOut: '2026-12-03', nights: 2, rooms: [{ roomType: 'Twin', count: 6 }],
  mealPlan: 'Breakfast', guests: 12, scope: 'rooms' as const, currency: 'JPY',
  contractType: 'Commission' as const, commissionPct: 12,
  quoteDeadline: new Date(Date.now() + 48 * 3600000).toISOString(), publishedAt: new Date().toISOString(),
})

describe('group RFP bus (Marketplace ↔ Console)', () => {
  beforeEach(() => localStorage.removeItem(BUS_KEY))

  it('delivers only inquiries in a city where we have a hotel (geo-targeting B)', () => {
    publishTestInquiry(inq('GRP-T-1', 'Osaka'))
    publishTestInquiry(inq('GRP-T-2', 'Busan'))
    const rfps = busToRfps(readBus(), HOTELS)
    expect(rfps.map((r) => r.ref)).toEqual(['GRP-T-1'])
    expect(rfps[0].status).toBe('New')
    expect(rfps[0].source).toBe('marketplace')
    expect(rfps[0].commissionPct).toBe(12)
  })

  it('derives Quoted → Won → Confirmed from quotes and the deal', () => {
    publishTestInquiry(inq('GRP-T-3', 'Osaka'))
    const our = busToRfps(readBus(), HOTELS)[0]
    addBusQuote({
      ref: 'GRP-T-3', quoteId: 'GRP-T-3-H', hotelCode: our.ourHotelCode!, hotelName: 'Our Hotel', city: 'Osaka',
      amount: 300000, currency: 'JPY', availability: 'Twin 6', cancelDeadline: '2026-11-24', paymentDeadlineHours: 3,
      validUntil: '2026-11-01', submittedAt: new Date().toISOString(),
    })
    expect(busToRfps(readBus(), HOTELS)[0].status).toBe('Quoted')
    upsertDeal('GRP-T-3', { quoteId: 'CQ-GRP-T-3-H', paymentDeadlineHours: 3 })
    expect(busToRfps(readBus(), HOTELS)[0].status).toBe('Won')
    upsertDeal('GRP-T-3', { hotelDecision: 'confirmed', decidedAt: new Date().toISOString() })
    const confirmed = busToRfps(readBus(), HOTELS)[0]
    expect(confirmed.status).toBe('Confirmed')
    expect(confirmed.paymentDueAt).toBeDefined()
    expect(confirmed.quote?.cancellation).toContain('이후 취소·환불 불가')
  })

  it('marks Lost when another hotel wins, Declined when we decline', () => {
    publishTestInquiry(inq('GRP-T-4', 'Osaka'))
    publishTestInquiry(inq('GRP-T-5', 'Osaka'))
    const code = busToRfps(readBus(), HOTELS)[0].ourHotelCode!
    addBusQuote({
      ref: 'GRP-T-4', quoteId: 'GRP-T-4-H', hotelCode: code, hotelName: 'Our Hotel', city: 'Osaka',
      amount: 1, currency: 'JPY', availability: '-', paymentDeadlineHours: 3, validUntil: '2026-11-01', submittedAt: new Date().toISOString(),
    })
    upsertDeal('GRP-T-4', { quoteId: 'Q-other-hotel', paymentDeadlineHours: 3 })
    addBusDecline('GRP-T-5', code)
    const byRef = Object.fromEntries(busToRfps(readBus(), HOTELS).map((r) => [r.ref, r.status]))
    expect(byRef['GRP-T-4']).toBe('Lost')
    expect(byRef['GRP-T-5']).toBe('Declined')
  })

  it('auto-cancels a confirmed deal that is not paid by the payment deadline', () => {
    upsertDeal('GRP-T-6', { quoteId: 'CQ-x', paymentDeadlineHours: 3, hotelDecision: 'confirmed', decidedAt: new Date(Date.now() - 4 * 3600000).toISOString() })
    sweepUnpaid()
    const deal = readBus().deals.find((d) => d.ref === 'GRP-T-6')!
    expect(deal.cancelReason).toBe('unpaid_timeout')
    expect(deal.cancelledAt).toBeDefined()
  })

  it('closes cancellation after the hotel-set deadline (no deadline = never cancellable)', () => {
    const noon = (d: string) => new Date(`${d}T12:00:00`).getTime()
    expect(cancelClosed('2026-11-24', noon('2026-11-24'))).toBe(false)
    expect(cancelClosed('2026-11-24', noon('2026-11-25'))).toBe(true)
    expect(cancelClosed(undefined)).toBe(true)
  })
})
