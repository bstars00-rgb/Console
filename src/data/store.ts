/**
 * Reactive, localStorage-backed data store. Seeds from mock data on first run,
 * persists every mutation, restores on refresh, and supports a full demo reset.
 * Components subscribe via the hooks in ./hooks.ts (useSyncExternalStore).
 */
import { readJSON, writeJSON, clearNamespace } from '../lib/storage'
import { HOTELS, ROOM_TYPES, RATE_PLANS, BOOKINGS, BILLINGS, NOTICES, FAQS, PROMOTIONS } from './seed'
import type { Hotel, RoomType, RatePlan, Booking, Billing, BoardPost, Promotion, BookingStatus, HotelImage } from './types'

const VERSION = 5

interface DB {
  version: number
  hotels: Hotel[]
  roomTypes: RoomType[]
  ratePlans: RatePlan[]
  bookings: Booking[]
  billings: Billing[]
  notices: BoardPost[]
  faqs: BoardPost[]
  promotions: Promotion[]
}

function seedDB(): DB {
  return {
    version: VERSION,
    hotels: HOTELS,
    roomTypes: ROOM_TYPES,
    ratePlans: RATE_PLANS,
    bookings: BOOKINGS,
    billings: BILLINGS,
    notices: NOTICES,
    faqs: FAQS,
    promotions: PROMOTIONS,
  }
}

const DB_KEY = 'db'

function load(): DB {
  const stored = readJSON<DB | null>(DB_KEY, null)
  if (!stored || stored.version !== VERSION) {
    const fresh = seedDB()
    writeJSON(DB_KEY, fresh)
    return fresh
  }
  return stored
}

let db: DB = load()
const listeners = new Set<() => void>()

function commit() {
  writeJSON(DB_KEY, db)
  listeners.forEach((l) => l())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---- Selectors (return stable references between mutations) --------------
export const getHotels = () => db.hotels
export const getRoomTypes = () => db.roomTypes
export const getRatePlans = () => db.ratePlans
export const getBookings = () => db.bookings
export const getBillings = () => db.billings
export const getNotices = () => db.notices
export const getFaqs = () => db.faqs
export const getPromotions = () => db.promotions

// ---- Mutations ----------------------------------------------------------
export function updateBookingStatus(id: string, status: BookingStatus) {
  db = {
    ...db,
    bookings: db.bookings.map((b) =>
      b.id === id
        ? {
            ...b,
            bookingStatus: status,
            bookingCancelDate: status === 'Cancelled' ? new Date().toISOString().slice(0, 10) : b.bookingCancelDate,
            paymentStatus: status === 'Cancelled' ? 'Refunded' : b.paymentStatus,
          }
        : b,
    ),
  }
  commit()
}

export function updateHotel(code: string, patch: Partial<Hotel>) {
  db = { ...db, hotels: db.hotels.map((h) => (h.code === code ? { ...h, ...patch, lastUpdateTime: nowStr() } : h)) }
  commit()
}

export function updateRoomType(seq: number, patch: Partial<RoomType>) {
  db = { ...db, roomTypes: db.roomTypes.map((r) => (r.seq === seq ? { ...r, ...patch } : r)) }
  commit()
}

export function setHotelImages(code: string, images: HotelImage[]) {
  updateHotel(code, { images })
}

export function resetDemo() {
  clearNamespace()
  db = seedDB()
  writeJSON(DB_KEY, db)
  listeners.forEach((l) => l())
}

function nowStr(): string {
  const d = new Date()
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
