/**
 * 단체 역경매 — Marketplace ↔ Vendor Console **실연동 버스** (프로토타입).
 *
 * 두 앱은 라이브에서 같은 출처(bstars00-rgb.github.io)라 localStorage를 공유한다.
 * 마켓플레이스가 올린 문의를 콘솔이 RFP로 받고, 호텔 견적·거절·컨펌/거절을 다시 버스에 쓴다.
 * 낙찰·계약 동의·결제·고객사 취소는 마켓플레이스가 쓴다. (로컬 개발은 포트가 달라 연동되지 않음 — 라이브에서 확인)
 *
 * ⚠ Marketplace 저장소의 `prototype/src/utils/groupBus.ts`와 **같은 스키마**를 유지할 것. 실서비스에선 ELLIS API로 대체.
 * ※ 키가 'omh:' 네임스페이스 밖이라 콘솔 데모 초기화(resetDemo)로 지워지지 않는다(양쪽 공용 데이터).
 */
import type { Currency, GroupRfp, Hotel, MealType, RfpStatus, VendorQuote } from './types'

export const BUS_KEY = 'omh_grp_bus_v1'
const BUS_EVENT = 'omh-grp-bus'

export interface BusRoom {
  roomType: string
  count: number
}

export interface BusInquiry {
  ref: string
  sellerName: string
  country: string
  region: string
  /** 영문 도시명 — 우리 호텔 도시와 일치해야 도착(지역 타깃팅 B: 도시 일치 필수) */
  regionEn: string
  hotelName?: string
  anchorName?: string
  anchorRadiusMin?: number
  checkIn: string
  checkOut: string
  nights: number
  rooms: BusRoom[]
  mealPlan: string
  guests: number
  nationality?: string
  groupType?: string
  scope: 'rooms' | 'rooms_plus'
  ancillary?: string[]
  ancillaryNote?: string
  holdRequired?: boolean
  goldenKey?: string
  notes?: string
  budgetPerRoomNight?: number
  budgetTotal?: number
  currency: string
  contractType: 'Net' | 'Commission'
  commissionPct?: number
  quoteDeadline: string
  publishedAt: string
}

export interface BusQuote {
  ref: string
  quoteId: string
  hotelCode: string
  hotelName: string
  city: string
  star?: number
  amount: number
  currency: string
  availability: string
  /** 취소 마감(YYYY-MM-DD, 그날 23:59까지) — 이후 취소 불가·환불 불가. 없으면 처음부터 취소·환불 불가 */
  cancelDeadline?: string
  paymentDeadlineHours: number
  validUntil: string
  note?: string
  submittedAt: string
}

export interface BusDecline {
  ref: string
  hotelCode: string
  at: string
}

export type CancelReason = 'hotel_rejected' | 'unpaid_timeout' | 'seller_cancelled'

export interface BusDeal {
  ref: string
  /** 마켓플레이스 견적 id — 콘솔 견적은 `CQ-${quoteId}` */
  quoteId: string
  awardedAt: string
  paymentDeadlineHours: number
  hotelDecision?: 'confirmed' | 'rejected'
  decidedAt?: string
  contractAcceptedAt?: string
  paidAt?: string
  cancelledAt?: string
  cancelReason?: CancelReason
}

export interface GroupBus {
  v: 1
  inquiries: BusInquiry[]
  quotes: BusQuote[]
  declines: BusDecline[]
  deals: BusDeal[]
}

const EMPTY: GroupBus = { v: 1, inquiries: [], quotes: [], declines: [], deals: [] }

let cacheRaw: string | null = null
let cacheBus: GroupBus = EMPTY

/** 현재 버스 상태 (같은 원문이면 같은 참조 — useSyncExternalStore 스냅샷 안정) */
export function readBus(): GroupBus {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(BUS_KEY)
  } catch {
    return cacheBus
  }
  if (raw === cacheRaw) return cacheBus
  cacheRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as GroupBus) : EMPTY
    cacheBus = parsed && parsed.v === 1 ? { ...EMPTY, ...parsed } : EMPTY
  } catch {
    cacheBus = EMPTY
  }
  return cacheBus
}

export function writeBus(mutate: (b: GroupBus) => GroupBus): GroupBus {
  const next = mutate(readBus())
  try {
    localStorage.setItem(BUS_KEY, JSON.stringify(next))
  } catch {
    /* 저장 실패 시 연동 없이 동작 */
  }
  window.dispatchEvent(new Event(BUS_EVENT))
  return readBus()
}

export function subscribeBus(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === BUS_KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(BUS_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(BUS_EVENT, onChange)
  }
}

export const dealOf = (b: GroupBus, ref: string) => b.deals.find((d) => d.ref === ref)

export function upsertDeal(ref: string, patch: Partial<BusDeal>) {
  return writeBus((b) => ({
    ...b,
    deals: b.deals.some((d) => d.ref === ref)
      ? b.deals.map((d) => (d.ref === ref ? { ...d, ...patch } : d))
      : [...b.deals, { ref, quoteId: '', awardedAt: new Date().toISOString(), paymentDeadlineHours: 3, ...patch }],
  }))
}

/** 호텔 견적 제출 (같은 호텔이 다시 내면 교체) */
export function addBusQuote(q: BusQuote) {
  return writeBus((b) => ({ ...b, quotes: [...b.quotes.filter((x) => !(x.ref === q.ref && x.hotelCode === q.hotelCode)), q] }))
}

export function addBusDecline(ref: string, hotelCode: string) {
  return writeBus((b) => ({ ...b, declines: [...b.declines.filter((x) => !(x.ref === ref && x.hotelCode === hotelCode)), { ref, hotelCode, at: new Date().toISOString() }] }))
}

/** 결제 마감 시각(ms) — 호텔 컨펌 시각 + 결제 마감 시간 */
export function paymentDueMs(d: BusDeal): number | null {
  if (d.hotelDecision !== 'confirmed' || !d.decidedAt) return null
  return new Date(d.decidedAt).getTime() + d.paymentDeadlineHours * 3600000
}

export const isUnpaidOverdue = (d: BusDeal, now: number) => {
  const due = paymentDueMs(d)
  return due !== null && !d.paidAt && !d.cancelledAt && now > due
}

/** 결제 마감 경과 건 자동취소 기록 (어느 앱에서든 먼저 본 쪽이 기록) */
export function sweepUnpaid(now = Date.now()) {
  if (!readBus().deals.some((d) => isUnpaidOverdue(d, now))) return
  writeBus((x) => ({
    ...x,
    deals: x.deals.map((d) =>
      isUnpaidOverdue(d, now) ? { ...d, cancelledAt: new Date(paymentDueMs(d) ?? now).toISOString(), cancelReason: 'unpaid_timeout' as const } : d,
    ),
  }))
}

/** 취소 마감 지났나 — 마감일 23:59(로컬)까지 취소 가능. 마감 없음 = 취소 불가 */
export function cancelClosed(cancelDeadline: string | undefined | null, now = Date.now()): boolean {
  if (!cancelDeadline) return true
  return now > new Date(`${cancelDeadline.slice(0, 10)}T23:59:59`).getTime()
}

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  hotel_rejected: '호텔 거절 — 문의 취소',
  unpaid_timeout: '결제 마감 경과 — 자동취소',
  seller_cancelled: '고객사 취소(취소 마감 전 · 전액 환불)',
}

export const cancelLabel = (deadline?: string) =>
  deadline ? `${deadline.slice(0, 10)} 23:59까지 무료취소 · 이후 취소·환불 불가` : '취소·환불 불가 (마감 없음)'

const MEALS: MealType[] = ['Room Only', 'Breakfast', 'Half Board', 'Full Board']

/**
 * 버스 문의 → 콘솔 RFP. **우리 호텔 도시와 일치하는 문의만** 도착한다(지역 타깃팅 B).
 * 상태: 거절 Declined · 견적 Quoted · 낙찰(우리 견적) Won → 컨펌 Confirmed / 거절·취소 Cancelled · 타 호텔 낙찰 Lost.
 */
export function busToRfps(bus: GroupBus, hotels: Hotel[]): GroupRfp[] {
  const out: GroupRfp[] = []
  for (const inq of bus.inquiries) {
    const our = hotels.find((h) => h.regionName.toLowerCase() === inq.regionEn.toLowerCase())
    if (!our) continue
    // 셀러가 호텔을 특정했으면 그 호텔에만 발송 (도시가 같아도 다른 호텔은 받지 않음)
    if (inq.hotelName && inq.hotelName.toLowerCase() !== our.name.EN.toLowerCase()) continue
    const mine = bus.quotes.find((q) => q.ref === inq.ref && q.hotelCode === our.code)
    const declined = bus.declines.some((d) => d.ref === inq.ref && d.hotelCode === our.code)
    const deal = dealOf(bus, inq.ref)
    let status: RfpStatus = declined ? 'Declined' : mine ? 'Quoted' : 'New'
    if (deal && mine) {
      if (deal.quoteId === `CQ-${mine.quoteId}`) {
        status = deal.cancelledAt || deal.hotelDecision === 'rejected' ? 'Cancelled' : deal.hotelDecision === 'confirmed' ? 'Confirmed' : 'Won'
      } else {
        status = 'Lost'
      }
    }
    const won = deal && mine && deal.quoteId === `CQ-${mine.quoteId}` ? deal : undefined
    const due = won ? paymentDueMs(won) : null
    const quote: VendorQuote | undefined = mine
      ? {
          amount: mine.amount,
          currency: mine.currency as Currency,
          availability: mine.availability,
          cancelDeadline: mine.cancelDeadline,
          cancellation: cancelLabel(mine.cancelDeadline),
          paymentDeadlineHours: mine.paymentDeadlineHours,
          validUntil: mine.validUntil,
          note: mine.note,
          submittedAt: mine.submittedAt.slice(0, 10),
        }
      : undefined
    out.push({
      id: `mkt-${inq.ref}`,
      ref: inq.ref,
      sellerName: inq.sellerName,
      country: inq.country,
      region: our.regionName,
      area: inq.region !== inq.regionEn ? inq.region : undefined,
      contractType: inq.contractType,
      commissionPct: inq.commissionPct,
      anchorName: inq.anchorName,
      anchorRadiusMin: inq.anchorRadiusMin,
      checkIn: inq.checkIn,
      checkOut: inq.checkOut,
      nights: inq.nights,
      rooms: inq.rooms,
      mealPlan: MEALS.includes(inq.mealPlan as MealType) ? (inq.mealPlan as MealType) : 'Room Only',
      guests: inq.guests,
      nationality: inq.nationality,
      groupType: inq.groupType,
      scope: inq.scope,
      ancillary: inq.ancillary,
      holdRequired: inq.holdRequired,
      goldenKey: inq.goldenKey,
      budgetPerRoomNight: inq.budgetPerRoomNight,
      budgetTotal: inq.budgetTotal,
      currency: inq.currency as Currency,
      quoteDeadline: inq.quoteDeadline,
      status,
      quote,
      source: 'marketplace',
      ourHotelCode: our.code,
      ourHotelName: our.name.EN,
      decidedAt: won?.decidedAt,
      paymentDueAt: due ? new Date(due).toISOString() : undefined,
      paidAt: won?.paidAt,
      cancelReason: won?.cancelReason ?? (won?.hotelDecision === 'rejected' ? 'hotel_rejected' : undefined),
    })
  }
  return out
}
