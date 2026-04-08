import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { InstancePricing } from '../../scripts/fetch-pricing.js'
import { formatPrice } from '../../src/lib/utils.js'

// Load and validate the generated pricing.json (integration test of the pipeline)
describe('pricing.json output', () => {
  const pricingPath = join(__dirname, '../../public/data/pricing.json')
  let data: { updatedAt: string; regions: string[]; instances: InstancePricing[] }

  try {
    data = JSON.parse(readFileSync(pricingPath, 'utf8'))
  } catch {
    it.skip('pricing.json not found — run npm run fetch-pricing first', () => {})
    // @ts-expect-error -- won't be reached
    return
  }

  it('has updatedAt timestamp', () => {
    expect(data.updatedAt).toBeTruthy()
    expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(0)
  })

  it('has at least 30 regions', () => {
    expect(data.regions.length).toBeGreaterThanOrEqual(30)
    expect(data.regions).toContain('us-central1')
    expect(data.regions).toContain('europe-west1')
  })

  it('has at least 100 machine types', () => {
    expect(data.instances.length).toBeGreaterThanOrEqual(100)
  })

  it('n1-standard-1 us-central1 Linux SUD is correct', () => {
    const inst = data.instances.find((i) => i.name === 'n1-standard-1')
    expect(inst).toBeDefined()
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxSud).toBeCloseTo(0.03325, 4)
  })

  it('n1-standard-1 us-central1 Windows SUD is correct', () => {
    const inst = data.instances.find((i) => i.name === 'n1-standard-1')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.windowsSud).toBeCloseTo(0.07925, 4)
  })

  it('e2-micro Linux on-demand is ~$0.00838/hr (0.25 vCPU × E2 rate + 1 GB RAM)', () => {
    const inst = data.instances.find((i) => i.name === 'e2-micro')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxOnDemand).toBeCloseTo(0.00838, 4)
    // E2 has no sustained-use discount — SUD equals on-demand
    expect(pricing?.linuxSud).toBe(pricing?.linuxOnDemand)
  })

  it('e2-micro Windows SUD includes Linux base + $0.092 license (2 vCPUs × $0.046)', () => {
    const inst = data.instances.find((i) => i.name === 'e2-micro')
    const pricing = inst?.pricing?.['us-central1']
    // Windows = Linux base + fixed Windows license premium for the 1-4 vCPU tier
    expect(pricing?.windowsSud).toBeCloseTo((pricing?.linuxSud ?? 0) + 0.092, 3)
  })

  it('t2a-standard-1 Linux SUD is correct', () => {
    const inst = data.instances.find((i) => i.name === 't2a-standard-1')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxSud).toBeCloseTo(0.0385, 4)
  })

  it('t2d-standard-1 CUD1yr values are correct', () => {
    const inst = data.instances.find((i) => i.name === 't2d-standard-1')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxCud1yr).toBeCloseTo(0.02661, 4)
    expect(pricing?.windowsCud1yr).toBeCloseTo(0.07261, 4)
  })

  it('n1-standard-1 has On Demand and Preemptible prices', () => {
    const inst = data.instances.find((i) => i.name === 'n1-standard-1')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxOnDemand).toBeDefined()
    expect(pricing?.linuxOnDemand).toBeGreaterThan(0)
    expect(pricing?.linuxPreemptible).toBeDefined()
    expect(pricing?.linuxPreemptible).toBeGreaterThan(0)
  })

  it('t2d-standard-1 has 3yr CUD prices', () => {
    const inst = data.instances.find((i) => i.name === 't2d-standard-1')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxCud3yr).toBeCloseTo(0.019012, 4)
    expect(pricing?.windowsCud3yr).toBeCloseTo(0.065012, 4)
  })

  it('instances have spec fields', () => {
    const n1 = data.instances.find((i) => i.name === 'n1-standard-1')
    expect(n1?.cpuType).toBeTruthy()
    expect(n1?.localSsd).toBe(true)
    expect(n1?.gpuSupport).toBe(true)
  })

  it('all instances have name, series, family, vCpus, memoryGb', () => {
    for (const inst of data.instances) {
      expect(inst.name).toBeTruthy()
      expect(inst.series).toBeTruthy()
      expect(inst.family).toBeTruthy()
      expect(inst.vCpus).toBeDefined()
      expect(typeof inst.memoryGb).toBe('number')
    }
  })

  it('all pricing values are null or positive numbers', () => {
    for (const inst of data.instances) {
      for (const regionPricing of Object.values(inst.pricing)) {
        const fields = ['linuxSud', 'linuxCud1yr', 'windowsSud', 'windowsCud1yr'] as const
        for (const field of fields) {
          const val = regionPricing[field]
          if (val !== null) {
            expect(typeof val).toBe('number')
            expect(val).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})

// ── formatPrice unit tests ────────────────────────────────────────────────

describe('formatPrice', () => {
  const USD = { USD: 1 }
  const EUR_RATES = { EUR: 0.92 }

  it('returns "Unavailable" for null', () => {
    expect(formatPrice(null, 'USD', 'hourly', USD)).toBe('Unavailable')
  })

  it('returns "Unavailable" for undefined', () => {
    expect(formatPrice(undefined, 'USD', 'hourly', USD)).toBe('Unavailable')
  })

  it('formats hourly USD correctly — n1-standard-1 linuxSud', () => {
    // 0.03325 < 0.01? No → toFixed(4)
    expect(formatPrice(0.03325, 'USD', 'hourly', USD)).toBe('$0.0333')
  })

  it('formats monthly USD correctly — n1-standard-1 linuxSud × 730', () => {
    // 0.03325 × 730 = 24.2725
    expect(formatPrice(0.03325, 'USD', 'monthly', USD)).toBe('$24.2725')
  })

  it('formats yearly USD correctly — n1-standard-1 linuxSud × 8760', () => {
    // 0.03325 × 8760 = 291.27
    expect(formatPrice(0.03325, 'USD', 'yearly', USD)).toBe('$291.2700')
  })

  it('applies EUR conversion with € symbol', () => {
    // 0.03325 × 0.92 = 0.030590 → toFixed(4)
    expect(formatPrice(0.03325, 'EUR', 'hourly', EUR_RATES)).toBe('€0.0306')
  })

  it('formats very small values with 6 decimal places', () => {
    // values < $0.01 use toFixed(6)
    expect(formatPrice(0.000711, 'USD', 'hourly', USD)).toBe('$0.000711')
  })

  it('derived $/vCPU — n2-standard-8 linuxSud ÷ 8', () => {
    // n2-standard-8 us-central1 linuxSud = 0.310778, vCpus = 8
    const perVcpu = 0.310778 / 8  // 0.03884725
    expect(formatPrice(perVcpu, 'USD', 'hourly', USD)).toBe('$0.0388')
  })

})
