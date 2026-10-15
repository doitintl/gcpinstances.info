import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseSkus, isSpecialModeSku } from '../../scripts/sku-parse'
import { buildPricingTable } from '../../scripts/fetch-pricing'
import type { RawSku } from '../../scripts/billing-api'

// These run the REAL parser (scripts/sku-parse.ts). The older parse-skus tests replicate the logic
// instead, which is how the validator's own copy was able to drift away from the fetch.

type Group = 'CPU' | 'RAM' | 'GPU'
function sku(description: string, group: Group, usageType: string, price: number, regions = ['us-central1']): RawSku {
  const units = Math.floor(price)
  return {
    description,
    category: { resourceFamily: 'Compute', resourceGroup: group, usageType },
    serviceRegions: regions,
    pricingInfo: [{ pricingExpression: { tieredRates: [{ unitPrice: { units: String(units), nanos: Math.round((price - units) * 1e9) } }] } }],
  } as unknown as RawSku
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]))
}

const MEGA_ORDINARY = sku('Nvidia H100 80GB Plus GPU running in Americas', 'GPU', 'OnDemand', 10.344276)
const MEGA_CALENDAR = sku('Reserved Nvidia H100 80GB Mega GPU in Americas in Calendar Mode', 'GPU', 'OnDemand', 4.841121)
const MEGA_DWS = sku('Nvidia H100 Mega 80GB GPU attached to DWS Defined Duration VMs running in Americas', 'GPU', 'OnDemand', 4.423936)

describe('which SKU wins does not depend on the order Google returns them', () => {
  it('an ordinary SKU beats calendar-mode and DWS SKUs in every one of the 6 orders', () => {
    for (const order of permutations([MEGA_ORDINARY, MEGA_CALENDAR, MEGA_DWS])) {
      const { gpuRates, specialModeOnly } = parseSkus(order)
      expect(gpuRates.get('H100_MEGA_80GB:us-central1:OnDemand')?.pricePerGpu).toBeCloseTo(10.344276, 6)
      expect(specialModeOnly).toEqual([])
    }
  })

  it('the same holds for the whole machine: a3-megagpu-8g is about $92.7/hr, not half that', () => {
    const cpu = sku('A3Plus Instance Core running in Americas', 'CPU', 'OnDemand', 0.026924)
    const ram = sku('A3Plus Instance Ram running in Americas', 'RAM', 'OnDemand', 0.002344)
    const prices = new Set<number>()
    for (const order of permutations([MEGA_ORDINARY, MEGA_CALENDAR, MEGA_DWS, cpu, ram])) {
      const { rates, gpuRates, windowsLicenses } = parseSkus(order)
      const m = buildPricingTable(rates, gpuRates, windowsLicenses).find((i) => i.name === 'a3-megagpu-8g')
      prices.add(m!.pricing['us-central1'].linuxOnDemand as number)
    }
    expect(prices.size).toBe(1)
    expect([...prices][0]).toBeCloseTo(92.74, 1)
  })

  it('falls back to a calendar-mode / DWS SKU only when nothing ordinary exists, and says so', () => {
    for (const order of permutations([MEGA_CALENDAR, MEGA_DWS])) {
      const { gpuRates, specialModeOnly } = parseSkus(order)
      // both are special: the cheaper of the two, whichever comes first
      expect(gpuRates.get('H100_MEGA_80GB:us-central1:OnDemand')?.pricePerGpu).toBeCloseTo(4.423936, 6)
      expect(specialModeOnly).toContain('gpu:H100_MEGA_80GB:us-central1:OnDemand')
    }
  })

  it('two ordinary SKUs at different prices: a stable choice (the lower) and a reported conflict', () => {
    const a = sku('Memory-optimized Instance Core running in Tokyo', 'CPU', 'OnDemand', 0.0426)
    const b = sku('Memory-optimized Instance Core running in Japan', 'CPU', 'OnDemand', 0.0426489)
    for (const order of permutations([a, b])) {
      const { rates, conflicts } = parseSkus(order.map((s) => ({ ...s, serviceRegions: ['asia-northeast1'] }) as RawSku))
      expect(rates.get('M1:cpu:asia-northeast1:OnDemand:linux')?.pricePerUnit).toBeCloseTo(0.0426, 7)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].candidates).toHaveLength(2)
    }
  })
})

describe('SKUs that are not an on-demand price are not filed as one', () => {
  it('a 5-year commitment (generic usageType "Commit") is not on-demand', () => {
    const real = sku('N4A Instance Core running in Johannesburg', 'CPU', 'OnDemand', 0.02914, ['africa-south1'])
    const fiveYear = sku('Commitment v1: N4A Core in Johannesburg for 5 Years', 'CPU', 'Commit', 0.0125551, ['africa-south1'])
    for (const order of permutations([real, fiveYear])) {
      const { rates } = parseSkus(order)
      expect(rates.get('N4A:cpu:africa-south1:OnDemand:linux')?.pricePerUnit).toBeCloseTo(0.02914, 6)
      expect([...rates.keys()].some((k) => k.includes('Cud'))).toBe(false)
    }
  })

  it('add-on "Premium for" SKUs are not rates: M1 stays at the base price', () => {
    const base = sku('Memory-optimized Instance Core running in Johannesburg', 'CPU', 'OnDemand', 0.0383135, ['africa-south1'])
    const premium = sku('Memory Optimized Upgrade Premium for Memory-optimized Instance Core running in Johannesburg', 'CPU', 'OnDemand', 0.004980749, ['africa-south1'])
    const surcharge = sku('Committed Use Discount Premium for E2 Custom Instance Core running in Johannesburg', 'CPU', 'CmtCudPremium', 0.001, ['africa-south1'])
    for (const order of permutations([base, premium, surcharge])) {
      const { rates, conflicts } = parseSkus(order)
      expect(rates.get('M1:cpu:africa-south1:OnDemand:linux')?.pricePerUnit).toBeCloseTo(0.0383135, 7)
      expect(conflicts).toEqual([])
    }
  })

  it('a spot GPU SKU that Google tags OnDemand is a Preemptible price', () => {
    const onDemand = sku('A4 Nvidia B200 (1 gpu slice) running in Americas', 'GPU', 'OnDemand', 16.11)
    const spot = sku('Spot Preemptible A4 Nvidia B200 (1 gpu slice) running in Americas', 'GPU', 'OnDemand', 4.9542)
    for (const order of permutations([onDemand, spot])) {
      const { gpuRates, conflicts } = parseSkus(order)
      expect(gpuRates.get('B200:us-central1:OnDemand')?.pricePerGpu).toBeCloseTo(16.11, 6)
      expect(gpuRates.get('B200:us-central1:Preemptible')?.pricePerGpu).toBeCloseTo(4.9542, 6)
      expect(conflicts).toEqual([])
    }
  })
})

describe('GPU naming', () => {
  it('"H100 80GB Plus" is the Mega GPU; a plain H100 is not', () => {
    const plain = sku('Nvidia H100 80GB GPU running in Americas', 'GPU', 'OnDemand', 9.796551)
    const { gpuRates } = parseSkus([MEGA_ORDINARY, plain])
    expect(gpuRates.get('H100_MEGA_80GB:us-central1:OnDemand')?.pricePerGpu).toBeCloseTo(10.344276, 6)
    expect(gpuRates.get('H100_80GB:us-central1:OnDemand')?.pricePerGpu).toBeCloseTo(9.796551, 6)
  })
})

describe('special-mode detection', () => {
  it.each([
    ['Reserved Nvidia H100 80GB Mega GPU in Americas in Calendar Mode', true],
    ['Nvidia H100 Mega 80GB GPU attached to DWS Defined Duration VMs running in Americas', true],
    ['Nvidia L4 GPU attached to DWS Defined Duration VMs running in Frankfurt', true],
    ['Reserved A2 Ram in Netherlands', true],
    ['Nvidia H100 80GB Plus GPU running in Americas', false],
    ['N1 Predefined Instance Core running in Americas', false],
    ['Nvidia Tesla A100 80GB GPU running in Netherlands', false],
  ])('%s -> %s', (description, expected) => {
    expect(isSpecialModeSku(description)).toBe(expected)
  })
})

describe('the fetch, the validator and the drift check share one parser', () => {
  const read = (f: string) => readFileSync(join(__dirname, '../../scripts', f), 'utf8')
  it('the validator imports the shared parser and has no copy of the pattern tables', () => {
    const v = read('validate-pricing.ts')
    expect(v).toContain("from './sku-parse.js'")
    expect(v).not.toMatch(/const SERIES_PATTERNS|const GPU_TYPE_PATTERNS|const SKIP_RE/)
  })
  it('fetch-pricing imports it too, and only runs main() when run as a script', () => {
    const f = read('fetch-pricing.ts')
    expect(f).toContain("from './sku-parse.js'")
    expect(f).not.toMatch(/const SERIES_PATTERNS|const GPU_TYPE_PATTERNS/)
    expect(f).toContain('pathToFileURL(process.argv[1]).href')
  })
  it('the drift check reads the series list from where it now lives', () => {
    expect(read('check-drift.ts')).toContain("new URL('./sku-parse.ts', import.meta.url)")
    expect(read('sku-parse.ts')).toContain('const SERIES_PATTERNS')
  })
})
