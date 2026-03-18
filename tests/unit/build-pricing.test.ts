import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { InstancePricing } from '../../scripts/fetch-pricing.js'

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

  it('e2-micro Linux SUD is null (shared-core)', () => {
    const inst = data.instances.find((i) => i.name === 'e2-micro')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.linuxSud).toBeNull()
  })

  it('e2-micro Windows SUD is $0.092 (2 vCPUs × $0.046)', () => {
    const inst = data.instances.find((i) => i.name === 'e2-micro')
    const pricing = inst?.pricing?.['us-central1']
    expect(pricing?.windowsSud).toBeCloseTo(0.092, 3)
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
