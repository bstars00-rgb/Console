import { describe, it, expect } from 'vitest'
import { translateDraft } from './aiTranslate'

describe('aiTranslate', () => {
  it('returns the real translation for a demo hotel name (translation memory)', () => {
    expect(translateDraft('Ohmy Grand Hotel Seoul', 'KO')).toBe('오마이 그랜드 호텔 서울')
    expect(translateDraft('Ohmy Grand Hotel Seoul', 'JA')).toBe('オーマイグランドホテルソウル')
  })

  it('EN target returns the source unchanged', () => {
    expect(translateDraft('Grand Hotel', 'EN')).toBe('Grand Hotel')
  })

  it('falls back to a glossary draft for unknown text', () => {
    const out = translateDraft('A quiet hotel near the pool', 'KO')
    expect(out).not.toBe('A quiet hotel near the pool') // some words were localized
    expect(out).toContain('호텔')
    expect(out).toContain('수영장')
  })

  it('handles empty input', () => {
    expect(translateDraft('   ', 'JA')).toBe('')
  })
})
