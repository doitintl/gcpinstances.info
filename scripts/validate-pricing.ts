/**
 * Validates the accuracy of public/data/pricing.json by spot-checking
 * a sample of instances against freshly fetched GCP Billing API rates.
 *
 * Usage:
 *   GOOGLE_CLOUD_API_KEY=<key> tsx scripts/validate-pricing.ts
 *   GOOGLE_CLOUD_API_KEY=<key> SAMPLE_SIZE=10 tsx scripts/validate-pricing.ts
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { InstancePricing, PricingData } from './fetch-pricing.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
const SAMPLE_SIZE = Number(process.env.SAMPLE_SIZE ?? 5)
const TOLERANCE = 0.001  // 0.1% tolerance for floating-point differences

// Known correct values from GCP pricing page (spot-check truth table)
// These are the ground-truth values used when no API key is available.
// Update these if GCP changes their base pricing.
const TRUTH_TABLE: Array<{
  name: string
  region: string
  field: keyof import('./fetch-pricing.js').InstanceRegionPricing
  expected: number | null
}> = [
  { name: 'n1-standard-1', region: 'us-central1', field: 'linuxSud', expected: 0.03325 },
  { name: 'n1-standard-1', region: 'us-central1', field: 'windowsSud', expected: 0.07925 },
  { name: 'e2-micro', region: 'us-central1', field: 'linuxSud', expected: null },
  { name: 'e2-micro', region: 'us-central1', field: 'windowsSud', expected: 0.092 },
  { name: 'e2-highcpu-2', region: 'us-central1', field: 'linuxSud', expected: 0.04947 },
  { name: 'e2-highcpu-2', region: 'us-central1', field: 'linuxCud1yr', expected: 0.03117 },
  { name: 'n2d-highcpu-2', region: 'us-central1', field: 'linuxSud', expected: 0.0499 },
  { name: 'n2d-highcpu-2', region: 'us-central1', field: 'linuxCud1yr', expected: 0.0393 },
  { name: 't2a-standard-1', region: 'us-central1', field: 'linuxSud', expected: 0.0385 },
  { name: 't2a-standard-1', region: 'us-central1', field: 'windowsSud', expected: 0.0845 },
  { name: 't2d-standard-1', region: 'us-central1', field: 'linuxCud1yr', expected: 0.02661 },
  { name: 't2d-standard-1', region: 'us-central1', field: 'windowsCud1yr', expected: 0.07261 },
]

function loadPricingJson(): PricingData {
  const path = join(ROOT, 'public', 'data', 'pricing.json')
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    console.error(`Error: Could not read ${path}`)
    console.error('Run: npm run fetch-pricing')
    process.exit(1)
  }
}

function isWithinTolerance(actual: number | null, expected: number | null): boolean {
  if (actual === null && expected === null) return true
  if (actual === null || expected === null) return false
  if (expected === 0) return actual === 0
  return Math.abs(actual - expected) / Math.abs(expected) <= TOLERANCE
}

interface ValidationResult {
  name: string
  region: string
  field: string
  expected: number | null
  actual: number | null
  pass: boolean
}

// Truth table validation (no API key required)
function validateTruthTable(data: PricingData): ValidationResult[] {
  return TRUTH_TABLE.map((check) => {
    const inst = data.instances.find((i: InstancePricing) => i.name === check.name)
    const actual = inst?.pricing?.[check.region]?.[check.field] ?? null
    const pass = isWithinTolerance(actual as number | null, check.expected)
    return { ...check, actual: actual as number | null, pass }
  })
}

// Sampled live validation (requires API key)
async function validateLive(data: PricingData): Promise<ValidationResult[]> {
  if (!API_KEY) {
    console.log('No GOOGLE_CLOUD_API_KEY set — skipping live validation')
    return []
  }

  const COMPUTE_SERVICE_ID = '6F81-5844-456A'
  const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_SERVICE_ID}/skus`

  // Fetch fresh rates
  console.log('Fetching fresh rates from GCP Billing API...')
  const skus: Array<{
    description: string
    category: { resourceFamily: string; resourceGroup: string; usageType: string }
    serviceRegions: string[]
    pricingInfo: Array<{ pricingExpression: { tieredRates: Array<{ unitPrice: { units: string; nanos: number } }> } }>
  }> = []
  let pageToken: string | undefined
  do {
    const url = new URL(BASE_URL)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('pageSize', '5000')
    url.searchParams.set('currencyCode', 'USD')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await fetch(url.toString())
    const d = await res.json() as { skus: typeof skus; nextPageToken?: string }
    skus.push(...(d.skus ?? []))
    pageToken = d.nextPageToken
  } while (pageToken)

  console.log(`Fetched ${skus.length} SKUs for live validation`)

  // Pick a random sample of instances with us-central1 pricing
  const instWithData = data.instances.filter(
    (i: InstancePricing) => i.pricing?.['us-central1']?.linuxSud !== undefined,
  )
  const sample = instWithData
    .sort(() => Math.random() - 0.5)
    .slice(0, SAMPLE_SIZE)

  const results: ValidationResult[] = []

  const sharedCoreNames = new Set(['f1-micro', 'g1-small', 'e2-micro', 'e2-small', 'e2-medium'])

  for (const inst of sample) {
    if (inst.vCpus === 'shared') continue
    if (sharedCoreNames.has(inst.name)) continue
    const region = 'us-central1'
    const p = inst.pricing[region]
    if (!p) continue

    // Find CPU and RAM rates for this series in us-central1
    // Use a word-boundary match to avoid N2 matching N2D, etc.
    const seriesPattern = new RegExp(`^${inst.series}\\s`, 'i')
    const cpuSku = skus.find(
      (s) =>
        s.category.resourceFamily === 'Compute' &&
        s.category.usageType === 'OnDemand' &&
        s.serviceRegions?.includes(region) &&
        seriesPattern.test(s.description) &&
        (s.description.includes('Core') || s.description.includes('Cpu')) &&
        !s.description.toLowerCase().includes('custom') &&
        !s.description.toLowerCase().includes('sole') &&
        !s.description.toLowerCase().includes('extended'),
    )
    const ramSku = skus.find(
      (s) =>
        s.category.resourceFamily === 'Compute' &&
        s.category.usageType === 'OnDemand' &&
        s.serviceRegions?.includes(region) &&
        seriesPattern.test(s.description) &&
        s.description.includes('Ram') &&
        !s.description.toLowerCase().includes('custom') &&
        !s.description.toLowerCase().includes('sole') &&
        !s.description.toLowerCase().includes('extended'),
    )

    if (!cpuSku || !ramSku) {
      console.log(`  Skipping ${inst.name} — no matching SKUs for series ${inst.series}`)
      continue
    }

    const extractP = (sku: typeof cpuSku) => {
      const rates = sku.pricingInfo?.[0]?.pricingExpression?.tieredRates ?? []
      const r = rates[rates.length - 1]?.unitPrice
      return r ? Number(r.units || 0) + (r.nanos || 0) / 1e9 : 0
    }

    const cpuRate = extractP(cpuSku)
    const ramRate = extractP(ramSku)
    const vCpus = inst.vCpus as number
    const SUD_DISCOUNT: Record<string, number> = { N1: 0.30, N2: 0.20, N2D: 0.20 }
    const linuxOD = vCpus * cpuRate + inst.memoryGb * ramRate
    const expectedLinuxSud = linuxOD * (1 - (SUD_DISCOUNT[inst.series] ?? 0))

    const pass = isWithinTolerance(p.linuxSud, expectedLinuxSud)
    results.push({
      name: inst.name,
      region,
      field: 'linuxSud',
      expected: Math.round(expectedLinuxSud * 1e6) / 1e6,
      actual: p.linuxSud,
      pass,
    })
  }

  return results
}

async function main() {
  console.log('Loading pricing.json...')
  const data = loadPricingJson()
  console.log(`Loaded ${data.instances.length} instances, ${data.regions.length} regions`)
  console.log(`Data updated at: ${data.updatedAt}`)
  console.log()

  // Truth table check
  console.log('=== Truth Table Validation ===')
  const truthResults = validateTruthTable(data)
  let failed = 0
  for (const r of truthResults) {
    const status = r.pass ? '✓' : '✗'
    const expectedStr = r.expected === null ? 'null' : r.expected.toFixed(6)
    const actualStr = r.actual === null ? 'null' : r.actual.toFixed(6)
    console.log(`  ${status} ${r.name} [${r.region}] ${r.field}: expected=${expectedStr}, got=${actualStr}`)
    if (!r.pass) failed++
  }
  console.log(`Truth table: ${truthResults.length - failed}/${truthResults.length} passed`)
  console.log()

  // Live validation
  if (API_KEY) {
    console.log(`=== Live Validation (sample size: ${SAMPLE_SIZE}) ===`)
    const liveResults = await validateLive(data)
    let liveFailed = 0
    for (const r of liveResults) {
      const status = r.pass ? '✓' : '✗'
      console.log(`  ${status} ${r.name} ${r.field}: expected=${r.expected?.toFixed(6)}, got=${r.actual?.toFixed(6)}`)
      if (!r.pass) liveFailed++
    }
    if (liveResults.length > 0) {
      console.log(`Live checks: ${liveResults.length - liveFailed}/${liveResults.length} passed`)
      failed += liveFailed
    }
    console.log()
  }

  if (failed > 0) {
    console.error(`VALIDATION FAILED: ${failed} check(s) failed`)
    process.exit(1)
  } else {
    console.log('All validation checks passed ✓')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
