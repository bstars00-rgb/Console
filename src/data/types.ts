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
  // content-detail fields
  address: string
  email: string
  description: string
  checkIn: string
  checkOut: string
  facilities: string[]
  policies: string[]
  images: HotelImage[]
}

export interface HotelImage {
  id: string
  url: string
  caption: string
  isRepresentative: boolean
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
