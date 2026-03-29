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
