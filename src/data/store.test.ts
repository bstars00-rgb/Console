import { describe, it, expect, beforeEach } from 'vitest'
import { getBookings, getHotels, updateBookingStatus, updateHotel, resetDemo } from './store'
import { clearNamespace } from '../lib/storage'

describe('data store', () => {
  beforeEach(() => {
    clearNamespace()
    resetDemo()
  })

  it('seeds a realistic dataset', () => {
    expect(getBookings().length).toBeGreaterThanOrEqual(30)
    expect(getHotels().length).toBeGreaterThanOrEqual(3)
    const statuses = new Set(getBookings().map((b) => b.bookingStatus))
    expect(statuses.has('Confirmed')).toBe(true)
    expect(statuses.has('Cancelled')).toBe(true)
  })

  it('updates a booking status and persists it', () => {
    const first = getBookings()[0]
    updateBookingStatus(first.id, 'Cancelled')
    const updated = getBookings().find((b) => b.id === first.id)!
    expect(updated.bookingStatus).toBe('Cancelled')
    expect(updated.bookingCancelDate).not.toBeNull()

    // persisted to localStorage
    const raw = JSON.parse(localStorage.getItem('omh:db')!)
    expect(raw.bookings.find((b: { id: string }) => b.id === first.id).bookingStatus).toBe('Cancelled')
  })

  it('updates hotel content and bumps the update time', () => {
    const hotel = getHotels()[0]
    updateHotel(hotel.code, { description: 'A new description for testing.' })
    const updated = getHotels().find((h) => h.code === hotel.code)!
    expect(updated.description).toBe('A new description for testing.')
    expect(updated.lastUpdateTime).not.toBe(hotel.lastUpdateTime)
  })

  it('reset restores the seed data', () => {
    const first = getBookings()[0]
    updateBookingStatus(first.id, 'No-show')
    resetDemo()
    expect(getBookings().find((b) => b.id === first.id)!.bookingStatus).not.toBe('No-show')
  })
})
