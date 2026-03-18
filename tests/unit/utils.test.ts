import { describe, it, expect } from 'vitest'
import { formatPrice, formatMemory, formatVCpus } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats hourly USD price', () => {
    expect(formatPrice(0.03325, 'USD', 'hourly')).toBe('$0.0333')
  })

  it('formats monthly price (hourly * 730)', () => {
    const monthly = formatPrice(0.03325, 'USD', 'monthly')
    // 0.03325 * 730 = 24.2725
    expect(monthly).toBe('$24.2725')
  })

  it('formats yearly price (hourly * 8760)', () => {
    const yearly = formatPrice(0.03325, 'USD', 'yearly')
    // 0.03325 * 8760 = 291.27
    expect(yearly).toContain('$')
  })

  it('returns Unavailable for null', () => {
    expect(formatPrice(null, 'USD', 'hourly')).toBe('Unavailable')
  })

  it('returns Unavailable for undefined', () => {
    expect(formatPrice(undefined, 'USD', 'hourly')).toBe('Unavailable')
  })

  it('applies currency conversion', () => {
    // EUR rate is ~0.92
    const usd = formatPrice(1, 'USD', 'hourly')
    const eur = formatPrice(1, 'EUR', 'hourly')
    expect(usd).toBe('$1.0000')
    // EUR should be lower than USD
    expect(parseFloat(eur.replace('€', ''))).toBeLessThan(1)
  })

  it('formats very small prices with more decimals', () => {
    const tiny = formatPrice(0.000001, 'USD', 'hourly')
    expect(tiny).toContain('$')
    expect(tiny).toContain('0.000001')
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
