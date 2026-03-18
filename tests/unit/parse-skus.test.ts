import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// We test the parsing logic by running fetch-pricing parsing functions.
// Since they're in a script file, we replicate the core logic here and test the outputs.

// Load fixture SKUs
const fixtureSkus = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/sample-skus.json'), 'utf8')
)

// ---- replicated parsing utilities ----
function extractPrice(sku: { pricingInfo?: Array<{ pricingExpression?: { tieredRates?: Array<{ unitPrice?: { units?: string; nanos?: number } }> } }> }): number | null {
  const rates = sku.pricingInfo?.[0]?.pricingExpression?.tieredRates
  if (!rates?.length) return null
  const rate = rates[rates.length - 1]?.unitPrice
  if (!rate) return null
  return Number(rate.units || 0) + (rate.nanos || 0) / 1e9
}

function isSpecificRegion(region: string): boolean {
  return /^[a-z]+-[a-z]+\d+$/.test(region)
}

// ---- tests ----

describe('extractPrice', () => {
  it('extracts price from tieredRates', () => {
    const sku = fixtureSkus[0] // N1 CPU at $0.031611/h
    const price = extractPrice(sku)
    expect(price).toBeCloseTo(0.031611, 6)
  })

  it('handles nanos-only price', () => {
    const sku = fixtureSkus[1] // N1 RAM at $0.004237/GiB-h
    const price = extractPrice(sku)
    expect(price).toBeCloseTo(0.004237, 6)
  })

  it('returns null for missing pricingInfo', () => {
    const price = extractPrice({})
    expect(price).toBeNull()
  })
})

describe('isSpecificRegion', () => {
  it('accepts specific regions', () => {
    expect(isSpecificRegion('us-central1')).toBe(true)
    expect(isSpecificRegion('europe-west4')).toBe(true)
    expect(isSpecificRegion('asia-northeast1')).toBe(true)
  })

  it('rejects multi-regional names', () => {
    expect(isSpecificRegion('us')).toBe(false)
    expect(isSpecificRegion('europe')).toBe(false)
    expect(isSpecificRegion('americas')).toBe(false)
    expect(isSpecificRegion('global')).toBe(false)
  })
})

describe('SKU fixture data', () => {
  it('N1 CPU SKU has correct structure', () => {
    const sku = fixtureSkus[0]
    expect(sku.category.resourceFamily).toBe('Compute')
    expect(sku.category.resourceGroup).toBe('CPU')
    expect(sku.category.usageType).toBe('OnDemand')
    expect(sku.serviceRegions).toContain('us-central1')
    expect(extractPrice(sku)).toBeCloseTo(0.031611, 5)
  })

  it('Windows license SKU has resourceFamily License', () => {
    const windowsSku = fixtureSkus.find((s: { description: string }) => s.description.includes('Windows'))
    expect(windowsSku).toBeDefined()
    expect(windowsSku.category.resourceFamily).toBe('License')
    expect(extractPrice(windowsSku)).toBeCloseTo(0.046, 3)
  })

  it('F1Micro SKU has correct resourceGroup', () => {
    const f1sku = fixtureSkus.find((s: { category: { resourceGroup: string } }) => s.category.resourceGroup === 'F1Micro')
    expect(f1sku).toBeDefined()
    expect(extractPrice(f1sku)).toBeCloseTo(0.0076, 4)
  })
})
