import { describe, it, expect } from 'vitest'
import { money } from './csv'

describe('money', () => {
  it('formats with thousands separators and currency', () => {
    expect(money(1234567, 'USD')).toBe('1,234,567 USD')
    expect(money(0, 'JPY')).toBe('0 JPY')
  })
})
