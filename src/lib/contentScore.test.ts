import { describe, it, expect } from 'vitest'
import { computeContentScore, quickWins, topRecommendation, bandFor } from './contentScore'
import { HOTELS, ROOM_TYPES } from '../data/seed'
import type { Hotel } from '../data/types'

const roomsOf = (code: string) => ROOM_TYPES.filter((r) => r.hotelCode === code)
const hotel = (code: string) => HOTELS.find((h) => h.code === code)!

describe('contentScore — mock hotel targets', () => {
  it('Sakura (A) is a low-completeness hotel (~32)', () => {
    const r = computeContentScore(hotel('2004521'), roomsOf('2004521'))
    expect(r.total).toBeGreaterThanOrEqual(25)
    expect(r.total).toBeLessThanOrEqual(40)
    expect(r.band.tone).toBe('red')
  })

  it('Hoa Binh (B) is a medium-completeness hotel (~68)', () => {
    const r = computeContentScore(hotel('1001097'), roomsOf('1001097'))
    expect(r.total).toBeGreaterThanOrEqual(60)
    expect(r.total).toBeLessThanOrEqual(79)
    expect(r.band.tone).toBe('yellow')
  })

  it('Ohmy Grand (C) is a high-completeness hotel (~94)', () => {
    const r = computeContentScore(hotel('2003011'), roomsOf('2003011'))
    expect(r.total).toBeGreaterThanOrEqual(88)
    expect(r.total).toBeLessThanOrEqual(97)
    expect(r.band.tone).toBe('blue')
  })
})

describe('contentScore — mechanics', () => {
  const base = () => hotel('1001097')

  it('adds up to the correct category maxima (100 total possible)', () => {
    const r = computeContentScore(base(), roomsOf('1001097'))
    const maxSum = r.categories.reduce((s, c) => s + c.max, 0)
    expect(maxSum).toBe(100)
  })

  it('removing a required field lowers the score', () => {
    const h = structuredClone(base()) as Hotel
    const before = computeContentScore(h, roomsOf('1001097')).total
    h.checkIn = ''
    h.checkOut = ''
    const after = computeContentScore(h, roomsOf('1001097')).total
    expect(after).toBeLessThan(before)
    expect(before - after).toBe(4) // check-in (2) + check-out (2)
  })

  it('adding photos raises the score', () => {
    const h = structuredClone(base()) as Hotel
    const before = computeContentScore(h, roomsOf('1001097')).total
    // Push hotel photos over 20 to earn the +5 item.
    while (h.images.length < 20) h.images.push({ id: `x${h.images.length}`, url: '', caption: '', isRepresentative: false, category: 'other', width: 1280, height: 800 })
    const after = computeContentScore(h, roomsOf('1001097')).total
    expect(after).toBeGreaterThan(before)
  })

  it('quick wins are sorted required-first then by efficiency', () => {
    const r = computeContentScore(base(), roomsOf('1001097'))
    const qw = quickWins(r, 6)
    expect(qw.length).toBeGreaterThan(0)
    // required items come before optional ones
    const firstOptionalIdx = qw.findIndex((i) => !i.required)
    if (firstOptionalIdx > 0) {
      expect(qw.slice(0, firstOptionalIdx).every((i) => i.required)).toBe(true)
    }
  })

  it('topRecommendation returns an incomplete item', () => {
    const r = computeContentScore(base(), roomsOf('1001097'))
    const top = topRecommendation(r)
    expect(top).not.toBeNull()
    expect(top!.earned).toBe(false)
  })

  it('bands map correctly', () => {
    expect(bandFor(10).tone).toBe('red')
    expect(bandFor(50).tone).toBe('orange')
    expect(bandFor(70).tone).toBe('yellow')
    expect(bandFor(90).tone).toBe('blue')
    expect(bandFor(98).tone).toBe('green')
  })
})
