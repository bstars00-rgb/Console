/**
 * Deterministic mock dataset for the vendor console prototype. Realistic shapes,
 * no real operational data. Seeded so the demo is stable before localStorage
 * persistence takes over.
 */
import { placeholderImage } from './placeholder'
import type {
  Hotel,
  RoomType,
  RatePlan,
  Booking,
  Billing,
  BoardPost,
  Promotion,
  AllotmentRow,
  BookingStatus,
  PaymentStatus,
  Currency,
  ContractType,
  MealType,
  LangText,
  HotelImage,
} from './types'

function lt(en: string, ko: string, ja: string, vi: string, zh: string): LangText {
  return { EN: en, KO: ko, JA: ja, VI: vi, ZH: zh }
}

function imgs(prefix: string, n: number, base = 0): HotelImage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-img-${i + 1}`,
    url: placeholderImage(`${prefix} ${i + 1}`, base + i),
    caption: `${prefix} photo ${i + 1}`,
    isRepresentative: i === 0,
  }))
}

// ---- Hotels -------------------------------------------------------------
export const HOTELS: Hotel[] = [
  {
    code: '1001097',
    grade: '4',
    name: lt('Hoa Binh Independence Hotel', '호아빈 독립 호텔', 'ホアビン独立ホテル', 'Khách sạn Độc Lập Hòa Bình', '和平独立酒店'),
    status: 'Approved',
    hotelType: 'Hotel',
    phone: '+84-24-1234-5678',
    country: 'Vietnam',
    regionName: 'Hanoi',
    regionCode: '144539',
    areas: 3,
    firstInsertUser: 'Doyeon Kim (Dodo)',
    firstInsertTime: '2024-10-07 09:18:37',
    lastUpdateUser: 'Truong Bich Tuyen (Tracy)',
    lastUpdateTime: '2026-08-18 12:14:01',
    address: '54 Hang Bong, Hoan Kiem, Hanoi, Vietnam',
    email: 'reservations@hoabinh-hotel.example',
    description:
      'A heritage 4-star hotel in the heart of Hanoi Old Quarter, blending French-colonial charm with modern comfort. Walking distance to Hoan Kiem Lake.',
    checkIn: '14:00',
    checkOut: '12:00',
    facilities: ['Free Wi-Fi', 'Restaurant', 'Rooftop Bar', 'Airport Shuttle', 'Laundry', 'Concierge', '24h Front Desk'],
    policies: ['Free cancellation up to 48h before check-in', 'Children under 6 stay free', 'Pets not allowed', 'Non-smoking rooms'],
    images: imgs('Hoa Binh', 5, 0),
  },
  {
    code: '2003011',
    grade: '5',
    name: lt('Ohmy Grand Hotel Seoul', '오마이 그랜드 호텔 서울', 'オーマイグランドホテルソウル', 'Khách sạn Ohmy Grand Seoul', '首尔欧买大酒店'),
    status: 'Approved',
    hotelType: 'Hotel',
    phone: '+82-2-733-0550',
    country: 'South Korea',
    regionName: 'Seoul',
    regionCode: '100001',
    areas: 5,
    firstInsertUser: 'Doyeon Kim (Dodo)',
    firstInsertTime: '2024-06-12 10:02:11',
    lastUpdateUser: 'Truong Bich Tuyen (Tracy)',
    lastUpdateTime: '2026-08-30 09:41:22',
    address: '120 Sejong-daero, Jung-gu, Seoul, South Korea',
    email: 'stay@ohmygrand-seoul.example',
    description:
      'A flagship 5-star property in downtown Seoul overlooking Gyeongbokgung Palace, featuring a spa, indoor pool, and three signature restaurants.',
    checkIn: '15:00',
    checkOut: '11:00',
    facilities: ['Free Wi-Fi', 'Indoor Pool', 'Spa & Sauna', 'Fitness Center', 'Business Center', 'Valet Parking', '3 Restaurants', 'Executive Lounge'],
    policies: ['Free cancellation up to 72h before check-in', 'City tax not included', 'Pets allowed (fee applies)', 'Non-smoking property'],
    images: imgs('Ohmy Grand', 6, 2),
  },
  {
    code: '2004521',
    grade: '4',
    name: lt('Sakura Bay Resort Osaka', '사쿠라 베이 리조트 오사카', 'さくらベイリゾート大阪', 'Sakura Bay Resort Osaka', '大阪樱花湾度假村'),
    status: 'Pending',
    hotelType: 'Resort',
    phone: '+81-6-6555-0000',
    country: 'Japan',
    regionName: 'Osaka',
    regionCode: '270001',
    areas: 4,
    firstInsertUser: 'Doyeon Kim (Dodo)',
    firstInsertTime: '2025-01-20 14:55:00',
    lastUpdateUser: 'Truong Bich Tuyen (Tracy)',
    lastUpdateTime: '2026-07-02 16:20:45',
    address: '1-9 Kaigan-dori, Minato-ku, Osaka, Japan',
    email: 'info@sakurabay-osaka.example',
    description:
      'A relaxed 4-star bayside resort near Osaka Bay, offering sea-view rooms, an onsen, and easy access to Universal Studios Japan.',
    checkIn: '15:00',
    checkOut: '10:00',
    facilities: ['Free Wi-Fi', 'Onsen', 'Restaurant', 'Karaoke', 'Bicycle Rental', 'Parking', 'Kids Play Area'],
    policies: ['Free cancellation up to 24h before check-in', 'Onsen tattoo policy applies', 'Children welcome', 'Non-smoking rooms available'],
    images: imgs('Sakura Bay', 5, 4),
  },
]

// ---- Room types ---------------------------------------------------------
const ROOM_TYPE_DEFS: Array<[string, string, string, number, string[]]> = [
  ['Deluxe Double', '디럭스 더블', 'デラックスダブル', 2, ['King Bed', 'City View', 'Air Conditioning', 'Minibar', 'Safe']],
  ['Deluxe Twin', '디럭스 트윈', 'デラックスツイン', 2, ['Twin Beds', 'City View', 'Air Conditioning', 'Minibar']],
  ['Superior King', '슈페리어 킹', 'スーペリアキング', 2, ['King Bed', 'Bathtub', 'Work Desk', 'Minibar']],
  ['Family Suite', '패밀리 스위트', 'ファミリースイート', 4, ['2 Bedrooms', 'Living Room', 'Kitchenette', 'Sofa Bed']],
  ['Executive Suite', '이그제큐티브 스위트', 'エグゼクティブスイート', 2, ['Lounge Access', 'Separate Living', 'Bathtub', 'Nespresso']],
  ['Standard Double', '스탠다드 더블', 'スタンダードダブル', 2, ['Double Bed', 'Air Conditioning', 'Shower']],
  ['Ocean View Twin', '오션뷰 트윈', 'オーシャンビューツイン', 2, ['Twin Beds', 'Ocean View', 'Balcony']],
  ['Japanese Tatami', '일본식 다다미', '和室', 3, ['Tatami', 'Futon', 'Onsen Access', 'Tea Set']],
  ['Premier Suite', '프리미어 스위트', 'プレミアスイート', 3, ['Corner Room', 'Panoramic View', 'Walk-in Closet']],
]

export const ROOM_TYPES: RoomType[] = ROOM_TYPE_DEFS.map((d, i) => {
  const hotel = HOTELS[i % HOTELS.length]
  const [en, ko, ja, occ, amenities] = d
  return {
    seq: 5001 + i,
    hotelCode: hotel.code,
    ellisRoomTypeCode: `RT${(10001 + i).toString()}`,
    cmsInfo: `CMS-${1000 + i}`,
    dataStatus: (['Approved', 'Approved', 'Pending', 'Approved'] as const)[i % 4],
    localPrice: `${[120, 95, 150, 260, 340, 80, 110, 130, 300][i]}.00`,
    name: lt(en as string, ko as string, ja as string, en as string, en as string),
    openSales: i % 5 !== 0,
    amenities: amenities as string[],
    maxOccupancy: occ as number,
    images: imgs(en as string, 3, i),
  }
})

// ---- Rate plans ---------------------------------------------------------
const PLAN_NAMES: Array<[string, ContractType]> = [
  ['Best Flexible Rate', 'Net'],
  ['Non-Refundable Saver', 'Net'],
  ['Breakfast Included', 'Commission'],
  ['Early Bird 21', 'Net'],
  ['Long Stay 3+', 'Sell-Rate'],
]

export const RATE_PLANS: RatePlan[] = ROOM_TYPES.flatMap((rt, ri) =>
  PLAN_NAMES.slice(0, (ri % 3) + 2).map((p, pi) => ({
    roomTypeSeq: rt.seq,
    hotelCode: rt.hotelCode,
    ellisRoomTypeCode: rt.ellisRoomTypeCode,
    cmsRoomTypeCode: rt.cmsInfo,
    roomTypeNameEN: rt.name.EN,
    planSeq: 7000 + ri * 10 + pi,
    ellisRoomPlanCode: `RP${8000 + ri * 10 + pi}`,
    cmsPlanCode: `CMSP-${ri}-${pi}`,
    dataStatus: (['Approved', 'Pending', 'Approved'] as const)[pi % 3],
    roomCharge: `${(90 + ri * 15 + pi * 12).toFixed(2)}`,
    planName: lt(p[0], p[0], p[0], p[0], p[0]),
    contractType: p[1],
    openSales: (ri + pi) % 4 !== 0,
  })),
)

// ---- Promotions ---------------------------------------------------------
export const PROMOTIONS: Promotion[] = ROOM_TYPES.slice(0, 6).map((rt, i) => ({
  roomTypeSeq: rt.seq,
  hotelCode: rt.hotelCode,
  ellisRoomTypeCode: rt.ellisRoomTypeCode,
  cmsRoomTypeCode: rt.cmsInfo,
  roomTypeNameEN: rt.name.EN,
  planSeq: 7000 + i * 10,
  ellisRoomPlanCode: `RP${8000 + i * 10}`,
  cmsPlanCode: `CMSP-${i}-0`,
  planNameEN: 'Best Flexible Rate',
  promotionSeq: 9001 + i,
  ellisPromotionCode: `PR${9001 + i}`,
  cmsPromotionCode: `CMSPR-${i}`,
  promotionType: (['Early Bird', 'Last Minute', 'Long Stay', 'Flash Sale'] as const)[i % 4],
  promotionNameEN: (['Early Bird 21 Days', 'Last Minute 3 Days', 'Stay 3 Pay 2', 'Weekend Flash Sale'] as const)[i % 4],
  bkgFrom: '2026-09-01',
  bkgTo: '2026-12-31',
  ciFrom: '2026-09-15',
  ciTo: '2027-01-31',
  appliedValue: (['-15%', '-25%', '3=2', '-30%'] as const)[i % 4],
  openSales: i % 3 !== 0,
}))

// ---- Bookings -----------------------------------------------------------
const FIRST = ['James', 'Sophia', 'Minjun', 'Yuki', 'Linh', 'Wei', 'Emma', 'Carlos', 'Aisha', 'Noah', 'Hana', 'Diego']
const LAST = ['Smith', 'Kim', 'Tanaka', 'Nguyen', 'Chen', 'Garcia', 'Brown', 'Park', 'Sato', 'Tran', 'Lee', 'Wang']
const STATUSES: BookingStatus[] = ['Confirmed', 'Pending', 'Cancelled', 'No-show']
const PAY: PaymentStatus[] = ['Paid', 'Unpaid', 'Partial', 'Refunded']
const CUR: Currency[] = ['USD', 'KRW', 'JPY', 'VND', 'CNY']
const MEALS: MealType[] = ['Room Only', 'Breakfast', 'Half Board', 'Full Board']
const CONTRACTS: ContractType[] = ['Net', 'Commission', 'Sell-Rate']

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0')
}
function dateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`
}

export const BOOKINGS: Booking[] = Array.from({ length: 34 }, (_, i) => {
  const hotel = HOTELS[i % HOTELS.length]
  const rt = ROOM_TYPES.filter((r) => r.hotelCode === hotel.code)[i % 2] ?? ROOM_TYPES[i % ROOM_TYPES.length]
  const status = STATUSES[i % STATUSES.length]
  const cur = CUR[i % CUR.length]
  const nights = (i % 5) + 1
  const rooms = (i % 3) + 1
  const ciMonth = 9 + (i % 3)
  const ciDay = ((i * 3) % 27) + 1
  const traveler = `${FIRST[i % FIRST.length]} ${LAST[(i + 3) % LAST.length]}`
  const rate = [180, 250000, 22000, 2600000, 880][i % CUR.length] * (1 + (i % 3) * 0.1)
  const sum = Math.round(rate * nights * rooms)
  const cancelled = status === 'Cancelled'
  return {
    id: `bk-${i + 1}`,
    ellisBookingCode: `S2609${pad(i + 1, 4)}H01`,
    hotelCnfmNo: `HC-${100000 + i * 7}`,
    bookingStatus: status,
    hotelCode: hotel.code,
    hotelName: hotel.name.EN,
    travelerName: traveler,
    travelers: [traveler, ...(rooms > 1 ? [`${FIRST[(i + 5) % FIRST.length]} ${LAST[(i + 1) % LAST.length]}`] : [])],
    checkInDate: dateStr(2026, ciMonth, ciDay),
    nights,
    roomType: rt.name.EN,
    roomCount: rooms,
    planName: PLAN_NAMES[i % PLAN_NAMES.length][0],
    mealType: MEALS[i % MEALS.length],
    freeBreakfast: i % 2 === 0,
    bookingDate: dateStr(2026, 8 + (i % 2), ((i * 2) % 27) + 1),
    bookingCancelDate: cancelled ? dateStr(2026, 9, ((i * 2) % 27) + 1) : null,
    paymentStatus: cancelled ? 'Refunded' : PAY[i % PAY.length],
    currency: cur,
    sumAmount: sum,
    billingNo: status === 'Confirmed' && i % 2 === 0 ? `BILL-${20260 + i}` : null,
    dispute: i % 9 === 0,
    disputeRemark: i % 9 === 0 ? 'Rate mismatch under review' : '',
    contractType: CONTRACTS[i % CONTRACTS.length],
    oldBookingCode: i % 6 === 0 ? `S2508${pad(i + 1, 4)}H01` : null,
    email: `${traveler.toLowerCase().replace(/\s/g, '.')}@example.com`,
    phone: `+1-555-0${pad(100 + i, 3)}`,
    specialRequest: i % 4 === 0 ? 'High floor, late check-in requested' : '',
    rooms: Array.from({ length: rooms }, (_, r) => ({
      roomType: rt.name.EN,
      planName: PLAN_NAMES[i % PLAN_NAMES.length][0],
      guestName: r === 0 ? traveler : `${FIRST[(i + r + 2) % FIRST.length]} ${LAST[(i + r) % LAST.length]}`,
      adults: 2,
      children: i % 3 === 0 ? 1 : 0,
      ratePerNight: Math.round(rate),
    })),
  }
})

// ---- Billings -----------------------------------------------------------
export const BILLINGS: Billing[] = BOOKINGS.filter((b) => b.billingNo).map((b, i) => {
  const paid = b.paymentStatus === 'Paid'
  const partial = b.paymentStatus === 'Partial'
  const paidAmount = paid ? b.sumAmount : partial ? Math.round(b.sumAmount * 0.5) : 0
  return {
    billingNo: b.billingNo as string,
    hotelName: b.hotelName,
    issuedDate: b.bookingDate,
    paymentStatus: b.paymentStatus,
    paidDate: paid ? dateStr(2026, 9, (i % 27) + 1) : null,
    currency: b.currency,
    sumAmount: b.sumAmount,
    paidAmount,
    balance: b.sumAmount - paidAmount,
    bookingItemCodes: [b.ellisBookingCode],
  }
})

// ---- Notices (9) & FAQ --------------------------------------------------
export const NOTICES: BoardPost[] = [
  { seq: 200344, type: 'General', pinned: true, title: 'Notice Regarding Transfer of Personal Information Due to Asset Transfer', body: 'Please review the attached notice regarding the transfer of personal information due to an asset transfer. Download the PDF for full details.', date: '2026-02-13', views: 180187, hasAttachment: true },
  { seq: 200332, type: 'System', pinned: false, title: '[Notice] Changes to Rate & Allotment management functions (Ver_2025.04.24)', body: 'The Rate & Allotment management screen has been updated with new bulk-edit controls. See the release notes for the full list of changes.', date: '2025-04-24', views: 93318, hasAttachment: true },
  { seq: 200318, type: 'System', pinned: false, title: '[Maintenance] Scheduled server maintenance on 2025-03-15 02:00–04:00 KST', body: 'The console will be temporarily unavailable during the maintenance window. We apologize for any inconvenience.', date: '2025-03-10', views: 41220, hasAttachment: false },
  { seq: 200301, type: 'General', pinned: false, title: 'Updated settlement schedule for Q2 2025', body: 'Settlement for the second quarter will follow the revised 15-day cycle. Contact your account manager with questions.', date: '2025-02-28', views: 28710, hasAttachment: true },
  { seq: 200288, type: 'System', pinned: false, title: '[Notice] New promotion types available', body: 'Flash Sale and Long Stay promotion types are now available in the Promotion menu.', date: '2025-01-19', views: 33902, hasAttachment: false },
  { seq: 200270, type: 'General', pinned: false, title: 'Year-end operating hours for Customer Center', body: 'The Customer Center will operate on reduced hours during the year-end holidays.', date: '2024-12-20', views: 19044, hasAttachment: false },
  { seq: 200255, type: 'System', pinned: false, title: '[Notice] Two-factor authentication rollout', body: 'Two-factor authentication will be gradually enabled for all vendor accounts.', date: '2024-11-30', views: 51233, hasAttachment: true },
  { seq: 200240, type: 'General', pinned: false, title: 'Improved image management for Hotel Content', body: 'You can now reorder images by drag-and-drop and set a representative image.', date: '2024-11-05', views: 22188, hasAttachment: false },
  { seq: 200221, type: 'System', pinned: false, title: '[Notice] API rate-limit adjustments', body: 'Channel API rate limits have been adjusted to improve stability during peak hours.', date: '2024-10-12', views: 15677, hasAttachment: false },
]

export const FAQS: BoardPost[] = [
  { seq: 200343, type: 'Booking', title: 'How do I confirm or cancel a booking?', body: 'Open the Bookings menu, select a booking to view its detail, then use the Confirm or Cancel action. A confirmation number is issued on confirmation.', date: '2026-09-03', views: 665, hasAttachment: false },
  { seq: 200320, type: 'Billing', title: 'When are settlements paid out?', body: 'Settlements follow a 15-day cycle. See the Billings menu for issued and paid amounts and balances.', date: '2026-08-11', views: 1204, hasAttachment: false },
  { seq: 200298, type: 'Content', title: 'How do I set a representative hotel image?', body: 'In Hotel Content, open the hotel, go to Images, and mark an image as representative. Drag to reorder.', date: '2026-07-22', views: 902, hasAttachment: true },
  { seq: 200277, type: 'Rate', title: 'How do I bulk-update allotment?', body: 'Use Rate & Allotment, select a date range on the calendar, and apply a bulk update.', date: '2026-06-30', views: 1533, hasAttachment: false },
  { seq: 200250, type: 'Booking', title: 'What do the booking statuses mean?', body: 'Confirmed, Pending, Cancelled, and No-show describe the lifecycle of a reservation.', date: '2026-05-14', views: 2011, hasAttachment: false },
]

// ---- Allotment calendar rows -------------------------------------------
export function buildAllotmentRows(hotelCode: string, year: number, month: number): AllotmentRow[] {
  const roomTypes = ROOM_TYPES.filter((r) => r.hotelCode === hotelCode)
  const daysInMonth = new Date(year, month, 0).getDate()
  return roomTypes.flatMap((rt, ri) =>
    ['Best Flexible Rate', 'Breakfast Included'].map((plan, pi) => ({
      roomTypeSeq: rt.seq,
      roomTypeName: rt.name.EN,
      planName: plan,
      currency: 'USD' as Currency,
      days: Array.from({ length: daysInMonth }, (_, d) => {
        const base = 90 + ri * 20 + pi * 15
        const weekend = [0, 6].includes(new Date(year, month - 1, d + 1).getDay())
        return {
          date: dateStr(year, month, d + 1),
          rate: Math.round(base * (weekend ? 1.25 : 1) + ((d * 7) % 20)),
          allotment: ((d + ri + pi) % 6) === 0 ? 0 : ((d + ri) % 8) + 2,
          closed: (d + ri + pi) % 11 === 0,
        }
      }),
    })),
  )
}
