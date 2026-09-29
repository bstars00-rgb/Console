/**
 * Domain types for the vendor console. Field names follow the labels/columns
 * observed on the original site. All data is mock; no real records are used.
 */

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'No-show'
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial' | 'Refunded'
export type ContractType = 'Net' | 'Commission' | 'Sell-Rate'
export type Currency = 'USD' | 'KRW' | 'JPY' | 'VND' | 'CNY'
export type DataStatus = 'Approved' | 'Pending' | 'Rejected' | 'Draft'
export type MealType = 'Room Only' | 'Breakfast' | 'Half Board' | 'Full Board'

// ---- Content-booster ("Boost your hotel") types -------------------------
export type PhotoCategory =
  | 'exterior'
  | 'lobby'
  | 'restaurant'
  | 'pool'
  | 'facility'
  | 'room'
  | 'bedroom'
  | 'bathroom'
  | 'view'
  | 'other'

export type PublishStatus =
  | 'Editing'
  | 'Saving'
  | 'Saved'
  | 'Draft'
  | 'Needs review'
  | 'Published'
  | 'Rejected'

/** Who last touched the content — used by internal sales staff overview. */
export type ContentEditor = 'hotel' | 'internal'

export interface LangText {
  EN: string
  KO: string
  JA: string
  VI: string
  ZH: string
}

export interface Hotel {
  code: string
  grade: string // star grade
  name: LangText
  status: DataStatus
  hotelType: string
  phone: string
  country: string
  regionName: string
  regionCode: string
  areas: number
  firstInsertUser: string
  firstInsertTime: string
  lastUpdateUser: string
  lastUpdateTime: string
  // content-detail fields (Hotel Master modal)
  registerStatus: 'Approval Pending' | 'Approved' | 'Sale Suspended'
  province: string
  additionalRegions: string[]
  chainBrand: string
  fax: string
  postCode: string
  email: string
  address: string
  addresses: LangText
  description: string
  descriptions: LangText
  checkIn: string
  checkOut: string
  facilities: string[]
  policies: string[]
  images: HotelImage[]
  // location & booster metadata (optional mock fields)
  latitude?: number
  longitude?: number
  nearby?: NearbyPlace[]
  publishStatus?: PublishStatus
  contentUpdatedBy?: ContentEditor
  translationReview?: Partial<Record<keyof LangText, boolean>>
}

export interface NearbyPlace {
  name: string
  category: 'Transport' | 'Attraction' | 'Dining' | 'Shopping'
  distanceKm: number
}

export interface HotelImage {
  id: string
  url: string
  caption: string
  isRepresentative: boolean
  category?: PhotoCategory
  tags?: string[]
  width?: number
  height?: number
  /** Confidence (0..1) of the prototype AI category suggestion, if analyzed. */
  aiConfidence?: number
}

export interface RoomType {
  seq: number
  hotelCode: string
  ellisRoomTypeCode: string
  cmsInfo: string
  dataStatus: DataStatus
  localPrice: string
  name: LangText
  openSales: boolean
  amenities: string[]
  maxOccupancy: number
  images: HotelImage[]
  // room-detail booster fields (optional mock)
  sizeSqm?: number
  bedConfig?: string
  view?: string
}

export interface RatePlan {
  roomTypeSeq: number
  hotelCode: string
  ellisRoomTypeCode: string
  cmsRoomTypeCode: string
  roomTypeNameEN: string
  planSeq: number
  ellisRoomPlanCode: string
  cmsPlanCode: string
  dataStatus: DataStatus
  roomCharge: string
  planName: LangText
  contractType: ContractType
  openSales: boolean
}

export interface Promotion {
  roomTypeSeq: number
  hotelCode: string
  ellisRoomTypeCode: string
  cmsRoomTypeCode: string
  roomTypeNameEN: string
  planSeq: number
  ellisRoomPlanCode: string
  cmsPlanCode: string
  planNameEN: string
  promotionSeq: number
  ellisPromotionCode: string
  cmsPromotionCode: string
  promotionType: string
  promotionNameEN: string
  bkgFrom: string
  bkgTo: string
  ciFrom: string
  ciTo: string
  appliedValue: string
  openSales: boolean
}

export interface Booking {
  id: string
  ellisBookingCode: string
  hotelCnfmNo: string
  bookingStatus: BookingStatus
  hotelCode: string
  hotelName: string
  travelerName: string
  travelers: string[]
  checkInDate: string
  nights: number
  roomType: string
  roomCount: number
  planName: string
  mealType: MealType
  freeBreakfast: boolean
  bookingDate: string
  bookingCancelDate: string | null
  paymentStatus: PaymentStatus
  currency: Currency
  sumAmount: number
  billingNo: string | null
  dispute: boolean
  disputeRemark: string
  contractType: ContractType
  oldBookingCode: string | null
  // detail
  email: string
  phone: string
  specialRequest: string
  rooms: BookingRoom[]
}

export interface BookingRoom {
  roomType: string
  planName: string
  guestName: string
  adults: number
  children: number
  ratePerNight: number
}

export interface Billing {
  billingNo: string
  hotelName: string
  issuedDate: string
  paymentStatus: PaymentStatus
  paidDate: string | null
  currency: Currency
  sumAmount: number
  paidAmount: number
  balance: number
  bookingItemCodes: string[]
}

export interface BoardPost {
  seq: number
  type: string
  title: string
  body: string
  date: string
  views: number
  hasAttachment: boolean
  pinned?: boolean
}

export interface AllotmentDay {
  date: string // YYYY-MM-DD
  rate: number
  allotment: number
  closed: boolean
}

export interface AllotmentRow {
  roomTypeSeq: number
  roomTypeName: string
  planName: string
  currency: Currency
  days: AllotmentDay[]
}

// ---- Group RFP (단체 견적 요청) — 역경매 공급측 -------------------------------
// 셀러(고객사)가 마켓플레이스에 넣은 단체 문의가 호텔(벤더) 콘솔에 RFP로 도착한다.
// 호텔은 여기서 경쟁 견적을 제출(blind)하거나 거절한다. 낙찰 시 리퀘스트 예약으로 확정.
// (마켓플레이스 GroupInquiry와 동일 개념 — 콘솔은 공급측 뷰)
export type RfpStatus = 'New' | 'Quoted' | 'Won' | 'Lost' | 'Declined' | 'Expired'

export interface RfpRoomReq {
  roomType: string
  count: number
}

export interface VendorQuote {
  /** 견적 금액 — 계약형태(Net국가=net / Commission국가=단가)에 따름 */
  amount: number
  currency: Currency
  /** 가용 확보 여부/메모 (예: "Twin 5 + Single 5 전실 확보") */
  availability: string
  cancellation: string
  freeCancelUntil?: string
  validUntil: string
  note?: string
  submittedAt: string
}

export interface GroupRfp {
  id: string
  ref: string
  sellerName: string
  country: string
  region: string
  /** 계약 형태 — 이 요금을 net으로 낼지 단가+커미션으로 낼지 안내 */
  contractType: ContractType
  anchorName?: string
  anchorRadiusMin?: number
  checkIn: string
  checkOut: string
  nights: number
  rooms: RfpRoomReq[]
  mealPlan: MealType
  guests: number
  nationality?: string
  groupType?: string
  scope: 'rooms' | 'rooms_plus'
  ancillary?: string[]
  holdRequired?: boolean
  goldenKey?: string
  /** 고객 예산(참고) — 경쟁 견적 제출 가이드용 */
  budgetPerRoomNight?: number
  budgetTotal?: number
  currency: Currency
  quoteDeadline: string
  status: RfpStatus
  quote?: VendorQuote
}
