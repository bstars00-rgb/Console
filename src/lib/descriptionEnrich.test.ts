import { describe, it, expect } from 'vitest'
import { enrichDescription, describeGaps } from './descriptionEnrich'
import { HOTELS, ROOM_TYPES } from '../data/seed'

const hotel = (code: string) => HOTELS.find((h) => h.code === code)!
const roomsOf = (code: string) => ROOM_TYPES.filter((r) => r.hotelCode === code)

describe('descriptionEnrich', () => {
  it('produces a rich, data-driven paragraph for a well-populated hotel', () => {
    const h = hotel('2003011') // Ohmy Grand
    const text = enrichDescription(h, roomsOf('2003011'), 'rich')
    expect(text).toContain('Ohmy Grand Hotel Seoul')
    expect(text.length).toBeGreaterThan(120) // enough for the "detailed" score item
    expect(text.toLowerCase()).toContain('room type')
    // mentions at least one real facility
    expect(h.facilities.some((f) => text.includes(f.split(' ')[0]))).toBe(true)
  })

  it('handles a sparse hotel without crashing and still names it', () => {
    const bare = { ...hotel('2004521'), facilities: [], nearby: [], grade: '' }
    const text = enrichDescription(bare, [], 'standard')
    expect(text).toContain('Sakura Bay Resort Osaka')
    expect(text.length).toBeGreaterThan(20)
  })

  it('tones differ', () => {
    const h = hotel('1001097')
    const rooms = roomsOf('1001097')
    const warm = enrichDescription(h, rooms, 'warm')
    const concise = enrichDescription(h, rooms, 'standard')
    expect(warm).not.toBe(concise)
    expect(warm.toLowerCase()).toContain('welcome')
  })

  it('describeGaps flags missing enrichment inputs', () => {
    const gaps = describeGaps({ ...hotel('2004521'), facilities: [], nearby: [], grade: '' }, [])
    expect(gaps).toContain('시설 및 서비스')
    expect(gaps).toContain('주변 정보')
    expect(gaps).toContain('성급')
  })
})
