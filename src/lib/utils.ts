import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { COST_MULTIPLIERS, CURRENCY_META, type CostPeriod } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  value: number | null | undefined,
  currency: string,
  period: CostPeriod,
  rates: Record<string, number>,
): string {
  if (value == null) return 'Unavailable'
  const symbol = CURRENCY_META[currency]?.symbol ?? '$'
  const rate = rates[currency] ?? 1
  const converted = value * rate * COST_MULTIPLIERS[period]
  if (converted === 0) return 'Free'
  if (converted < 0.01) return `${symbol}${converted.toFixed(6)}`
  return `${symbol}${converted.toFixed(4)}`
}

export function formatMemory(gb: number): string {
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MiB`
  return `${gb % 1 === 0 ? gb : gb.toFixed(2)} GiB`
}

export function formatVCpus(vCpus: number | 'shared'): string {
  if (vCpus === 'shared') return 'shared'
  return `${vCpus}`
}

/**
 * Parse a numeric filter expression typed by the user into a predicate.
 *
 * Supported syntax (whitespace tolerated):
 *   "5"          → equal to 5
 *   "=5"         → equal to 5
 *   ">5"         → strictly greater than 5
 *   "<5"         → strictly less than 5
 *   ">=5"        → greater than or equal to 5
 *   "<=5"        → less than or equal to 5
 *   "!=5", "<>5" → not equal to 5
 *
 * Equality matching is performed at the precision of the user's input — e.g.
 * "5" rounds the value to 0 decimal places before comparing, "0.05" rounds
 * to 2 decimal places. This makes equality intuitive for both integer
 * columns (vCPUs) and floating-point columns (memory, prices).
 *
 * Returns `null` when the expression isn't a valid numeric filter, so callers
 * can fall back to substring matching on the formatted value.
 */
export function parseNumericFilter(
  expr: string,
): ((value: number | null | undefined) => boolean) | null {
  const s = expr.trim()
  if (!s) return null
  const match = /^(>=|<=|!=|<>|>|<|=)?\s*(-?\d+(?:\.\d+)?)$/.exec(s)
  if (!match) return null
  const op = match[1] ?? '='
  const raw = match[2]
  const target = Number(raw)
  if (Number.isNaN(target)) return null
  const decimals = (raw.split('.')[1] ?? '').length
  const factor = 10 ** decimals
  const roundToInputPrecision = (x: number) => Math.round(x * factor) / factor

  return (value) => {
    if (value == null || Number.isNaN(value)) return false
    switch (op) {
      case '=':  return roundToInputPrecision(value) === target
      case '>':  return value > target
      case '<':  return value < target
      case '>=': return value >= target
      case '<=': return value <= target
      case '!=':
      case '<>': return roundToInputPrecision(value) !== target
      default:   return false
    }
  }
}

export function buildDoitUrl(path: string, campaign: string, content: string): string {
  const base = `https://www.doit.com/${path}`.replace(/\/+$/, '/')
  const params = new URLSearchParams({
    utm_source: 'gcpinstances',
    utm_medium: 'referral',
    utm_campaign: campaign,
    utm_content: content,
  })
  return `${base}?${params}`
}
