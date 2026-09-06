import { describe, it, expect } from 'vitest'
import { categoryFromFilename, categoryFromPixels, clampCategory } from './aiPhotoAnalysis'

describe('aiPhotoAnalysis — filename keywords', () => {
  it('maps common hotel photo filenames to categories', () => {
    expect(categoryFromFilename('master-bathroom-01.jpg')?.category).toBe('bathroom')
    expect(categoryFromFilename('Lobby_Reception.png')?.category).toBe('lobby')
    expect(categoryFromFilename('rooftop_pool.webp')?.category).toBe('pool')
    expect(categoryFromFilename('breakfast_restaurant.jpg')?.category).toBe('restaurant')
    expect(categoryFromFilename('building_exterior.jpg')?.category).toBe('exterior')
    expect(categoryFromFilename('ocean_view_balcony.jpg')?.category).toBe('view')
    expect(categoryFromFilename('king_bedroom.jpg')?.category).toBe('bedroom')
    expect(categoryFromFilename('욕실_1.jpg')?.category).toBe('bathroom')
  })
  it('returns null when no keyword matches', () => {
    expect(categoryFromFilename('IMG_2931.jpg')).toBeNull()
  })
})

describe('aiPhotoAnalysis — pixel heuristic', () => {
  it('bright blue → pool', () => {
    const r = categoryFromPixels({ r: 90, g: 140, b: 210, brightness: 147, width: 1600, height: 1000 })
    expect(r.category).toBe('pool')
    expect(r.confidence).toBeGreaterThan(0.5)
  })
  it('very bright neutral → lobby', () => {
    expect(categoryFromPixels({ r: 200, g: 195, b: 190, brightness: 195, width: 1600, height: 1000 }).category).toBe('lobby')
  })
  it('warm & dark → restaurant', () => {
    expect(categoryFromPixels({ r: 140, g: 90, b: 70, brightness: 100, width: 1600, height: 1000 }).category).toBe('restaurant')
  })
  it('neutral mid → other with low confidence', () => {
    const r = categoryFromPixels({ r: 128, g: 128, b: 128, brightness: 128, width: 1600, height: 1000 })
    expect(r.category).toBe('other')
    expect(r.confidence).toBeLessThan(0.4)
  })
})

describe('aiPhotoAnalysis — clampCategory', () => {
  it('keeps allowed categories', () => {
    expect(clampCategory('bathroom', ['bedroom', 'bathroom', 'view', 'room'])).toBe('bathroom')
  })
  it('maps disallowed to a sensible fallback within scope', () => {
    // hotel scope has no 'bedroom'
    expect(clampCategory('bedroom', ['exterior', 'lobby', 'restaurant', 'pool', 'facility', 'other'])).toBe('other')
    // room scope has no 'lobby'
    expect(clampCategory('lobby', ['bedroom', 'bathroom', 'view', 'room'])).toBe('room')
    // pool → view in room scope
    expect(clampCategory('pool', ['bedroom', 'bathroom', 'view', 'room'])).toBe('view')
  })
})
