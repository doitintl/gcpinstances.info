import { describe, it, expect } from 'vitest'
import { formatPrice, formatMemory, formatVCpus, parseNumericFilter } from '@/lib/utils'

const rates = { USD: 1, EUR: 0.92, GBP: 0.75, JPY: 149.5, AUD: 1.53, CAD: 1.36, DKK: 6.89, NOK: 10.55, SEK: 10.42, CHF: 0.90, ZAR: 18.63, ILS: 3.71 }

describe('formatPrice', () => {
  it('formats hourly USD price', () => {
    expect(formatPrice(0.03325, 'USD', 'hourly', rates)).toBe('$0.0333')
  })

  it('formats monthly price (hourly * 730)', () => {
    const monthly = formatPrice(0.03325, 'USD', 'monthly', rates)
    // 0.03325 * 730 = 24.2725
    expect(monthly).toBe('$24.2725')
  })

  it('formats yearly price (hourly * 8760)', () => {
    const yearly = formatPrice(0.03325, 'USD', 'yearly', rates)
    // 0.03325 * 8760 = 291.27
    expect(yearly).toContain('$')
  })

  it('returns Unavailable for null', () => {
    expect(formatPrice(null, 'USD', 'hourly', rates)).toBe('Unavailable')
  })

  it('returns Unavailable for undefined', () => {
    expect(formatPrice(undefined, 'USD', 'hourly', rates)).toBe('Unavailable')
  })

  it('applies currency conversion', () => {
    // EUR rate is 0.92
    const usd = formatPrice(1, 'USD', 'hourly', rates)
    const eur = formatPrice(1, 'EUR', 'hourly', rates)
    expect(usd).toBe('$1.0000')
    // EUR should be lower than USD
    expect(parseFloat(eur.replace('€', ''))).toBeLessThan(1)
  })

  it('formats very small prices with more decimals', () => {
    const tiny = formatPrice(0.000001, 'USD', 'hourly', rates)
    expect(tiny).toContain('$')
    expect(tiny).toContain('0.000001')
  })

  it('falls back to rate=1 for unknown currency', () => {
    expect(formatPrice(1, 'XYZ', 'hourly', rates)).toBe('$1.0000')
  })

  it('formats ILS with ₪ symbol', () => {
    expect(formatPrice(1, 'ILS', 'hourly', rates)).toBe('₪3.7100')
  })

  it('formats CHF with CHF symbol', () => {
    expect(formatPrice(1, 'CHF', 'hourly', rates)).toBe('CHF0.9000')
  })
})

describe('formatMemory', () => {
  it('formats GiB', () => {
    expect(formatMemory(32)).toBe('32 GiB')
    expect(formatMemory(3.75)).toBe('3.75 GiB')
  })

  it('formats fractional GiB in MiB', () => {
    expect(formatMemory(0.6)).toBe('614 MiB')
  })

  it('formats large memory', () => {
    expect(formatMemory(128)).toBe('128 GiB')
  })
})

describe('formatVCpus', () => {
  it('formats numeric vCPUs', () => {
    expect(formatVCpus(1)).toBe('1')
    expect(formatVCpus(8)).toBe('8')
    expect(formatVCpus(96)).toBe('96')
  })

  it('formats shared vCPUs', () => {
    expect(formatVCpus('shared')).toBe('shared')
  })
})

describe('parseNumericFilter', () => {
  it('returns null for empty or non-numeric input', () => {
    expect(parseNumericFilter('')).toBeNull()
    expect(parseNumericFilter('   ')).toBeNull()
    expect(parseNumericFilter('shared')).toBeNull()
    expect(parseNumericFilter('>')).toBeNull()
    expect(parseNumericFilter('>=abc')).toBeNull()
  })

  it('parses bare number as equality at input precision', () => {
    const p = parseNumericFilter('5')!
    expect(p(5)).toBe(true)
    // Rounds to integer precision: 4.5 → 5
    expect(p(4.5)).toBe(true)
    expect(p(5.4)).toBe(true)
    expect(p(4.4)).toBe(false)
    expect(p(5.5)).toBe(false)
  })

  it('parses equality with explicit decimals', () => {
    const p = parseNumericFilter('0.05')!
    expect(p(0.05)).toBe(true)
    expect(p(0.054)).toBe(true)
    expect(p(0.046)).toBe(true)
    expect(p(0.06)).toBe(false)
  })

  it('parses > operator', () => {
    const p = parseNumericFilter('>5')!
    expect(p(5)).toBe(false)
    expect(p(5.1)).toBe(true)
    expect(p(4.9)).toBe(false)
  })

  it('parses >= operator', () => {
    const p = parseNumericFilter('>=5')!
    expect(p(5)).toBe(true)
    expect(p(4.9)).toBe(false)
  })

  it('parses < and <= operators', () => {
    expect(parseNumericFilter('<5')!(5)).toBe(false)
    expect(parseNumericFilter('<5')!(4.9)).toBe(true)
    expect(parseNumericFilter('<=5')!(5)).toBe(true)
  })

  it('parses != and <> operators', () => {
    expect(parseNumericFilter('!=5')!(5)).toBe(false)
    expect(parseNumericFilter('!=5')!(4)).toBe(true)
    expect(parseNumericFilter('<>5')!(5)).toBe(false)
    expect(parseNumericFilter('<>5')!(4)).toBe(true)
  })

  it('returns false for null/undefined values', () => {
    const p = parseNumericFilter('>5')!
    expect(p(null)).toBe(false)
    expect(p(undefined)).toBe(false)
  })

  it('tolerates whitespace around operator', () => {
    const p = parseNumericFilter('>= 5')!
    expect(p(5)).toBe(true)
    expect(p(4)).toBe(false)
  })
})
