/**
 * Validates the accuracy of public/data/pricing.json by spot-checking
 * a sample of instances against freshly fetched GCP Billing API rates.
 *
 * Usage:
 *   tsx scripts/validate-pricing.ts
 *   GOOGLE_CLOUD_API_KEY=<key> tsx scripts/validate-pricing.ts
 *   GOOGLE_CLOUD_API_KEY=<key> SAMPLE_SIZE=20 tsx scripts/validate-pricing.ts
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { extractPrice, isSpecificRegion } from './billing-api.js'
import type { RawSku } from './billing-api.js'
import type { InstancePricing, PricingData, InstanceRegionPricing } from './fetch-pricing.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
const SAMPLE_SIZE = Number(process.env.SAMPLE_SIZE ?? 20)
const TOLERANCE = 0.001  // 0.1% tolerance for floating-point differences

// Known correct values — cross-referenced against the GCP Billing API and
// Google's public pricing page. Update these if GCP changes base rates.
// null expected values assert the field is unavailable for that instance/region.
const TRUTH_TABLE: Array<{
  name: string
  region: string
  field: keyof InstanceRegionPricing
  expected: number | null
}> = [
  // ── Existing baseline ────────────────────────────────────────────────────
  { name: 'n1-standard-1',  region: 'us-central1', field: 'linuxSud',       expected: 0.03325 },
  { name: 'n1-standard-1',  region: 'us-central1', field: 'windowsSud',     expected: 0.07925 },
  { name: 'e2-micro',       region: 'us-central1', field: 'linuxSud',       expected: null },
  { name: 'e2-micro',       region: 'us-central1', field: 'windowsSud',     expected: 0.092 },
  { name: 'e2-highcpu-2',   region: 'us-central1', field: 'linuxSud',       expected: 0.04947 },
  { name: 'e2-highcpu-2',   region: 'us-central1', field: 'linuxCud1yr',    expected: 0.03117 },
  { name: 'n2d-highcpu-2',  region: 'us-central1', field: 'linuxSud',       expected: 0.0499 },
  { name: 'n2d-highcpu-2',  region: 'us-central1', field: 'linuxCud1yr',    expected: 0.0393 },
  { name: 't2a-standard-1', region: 'us-central1', field: 'linuxSud',       expected: 0.0385 },
  { name: 't2a-standard-1', region: 'us-central1', field: 'windowsSud',     expected: 0.0845 },
  { name: 't2d-standard-1', region: 'us-central1', field: 'linuxCud1yr',    expected: 0.02661 },
  { name: 't2d-standard-1', region: 'us-central1', field: 'windowsCud1yr',  expected: 0.07261 },

  // ── OnDemand coverage ────────────────────────────────────────────────────
  { name: 'n1-standard-1',  region: 'us-central1', field: 'linuxOnDemand',  expected: 0.0475 },
  { name: 'n1-standard-1',  region: 'us-central1', field: 'windowsOnDemand',expected: 0.0935 },
  { name: 'e2-standard-4',  region: 'us-central1', field: 'linuxOnDemand',  expected: 0.134023 },
  { name: 'e2-standard-4',  region: 'us-central1', field: 'windowsOnDemand',expected: 0.318023 },
  { name: 'n2-standard-8',  region: 'us-central1', field: 'linuxOnDemand',  expected: 0.388472 },
  { name: 'c3-standard-4',  region: 'us-central1', field: 'linuxOnDemand',  expected: 0.201608 },

  // ── Preemptible coverage ─────────────────────────────────────────────────
  { name: 'n1-standard-1',  region: 'us-central1', field: 'linuxPreemptible',   expected: 0.014361 },
  { name: 'n1-standard-1',  region: 'us-central1', field: 'windowsPreemptible', expected: 0.060361 },
  { name: 'e2-standard-4',  region: 'us-central1', field: 'linuxPreemptible',   expected: 0.061736 },
  { name: 't2d-standard-2', region: 'us-central1', field: 'linuxPreemptible',   expected: 0.017648 },

  // ── CUD 3yr coverage ─────────────────────────────────────────────────────
  { name: 't2d-standard-1', region: 'us-central1', field: 'linuxCud3yr',    expected: 0.019012 },
  { name: 't2d-standard-1', region: 'us-central1', field: 'windowsCud3yr',  expected: 0.065012 },
  { name: 'e2-standard-4',  region: 'us-central1', field: 'linuxCud3yr',    expected: 0.06031 },
  { name: 'c3-standard-4',  region: 'us-central1', field: 'linuxCud3yr',    expected: 0.090724 },

  // ── Multi-region ─────────────────────────────────────────────────────────
  { name: 'n1-standard-1',  region: 'europe-west1',    field: 'linuxOnDemand',  expected: 0.052252 },
  { name: 'n1-standard-1',  region: 'europe-west1',    field: 'linuxSud',       expected: 0.036576 },
  { name: 'n2-standard-8',  region: 'europe-west1',    field: 'linuxOnDemand',  expected: 0.427336 },
  { name: 'n2-standard-8',  region: 'europe-west1',    field: 'linuxSud',       expected: 0.341869 },
  { name: 'n2-standard-8',  region: 'europe-west1',    field: 'linuxCud1yr',    expected: 0.269208 },
  { name: 'n2-standard-8',  region: 'asia-northeast1', field: 'linuxOnDemand',  expected: 0.498352 },
  { name: 'n2-standard-8',  region: 'asia-northeast1', field: 'linuxSud',       expected: 0.398682 },
  { name: 'n2-standard-8',  region: 'asia-northeast1', field: 'linuxCud1yr',    expected: 0.31396 },
  { name: 'c3-standard-4',  region: 'europe-west1',    field: 'linuxOnDemand',  expected: 0.221991 },
  { name: 'c3-standard-4',  region: 'asia-northeast1', field: 'linuxOnDemand',  expected: 0.258905 },

  // ── GPU instances ─────────────────────────────────────────────────────────
  // A2 has 0% SUD discount, so linuxSud == linuxOnDemand
  { name: 'a2-highgpu-1g',  region: 'us-central1', field: 'linuxOnDemand',  expected: 3.673385 },
  { name: 'a2-highgpu-1g',  region: 'us-central1', field: 'linuxSud',       expected: 3.673385 },
  { name: 'a2-highgpu-1g',  region: 'us-central1', field: 'linuxCud1yr',    expected: 2.314207 },
  { name: 'a2-highgpu-1g',  region: 'us-central1', field: 'linuxCud3yr',    expected: 1.285709 },
  { name: 'a2-highgpu-1g',  region: 'us-central1', field: 'linuxPreemptible',expected: 1.80385 },

  // ── Shared-core ───────────────────────────────────────────────────────────
  // e2-small/medium: Linux SUD is null (shared-core without Linux SKU); Windows = license-only
  { name: 'e2-small',       region: 'us-central1', field: 'linuxSud',       expected: null },
  { name: 'e2-small',       region: 'us-central1', field: 'windowsSud',     expected: 0.092 },
  { name: 'e2-medium',      region: 'us-central1', field: 'linuxSud',       expected: null },
  { name: 'e2-medium',      region: 'us-central1', field: 'windowsSud',     expected: 0.092 },

  // ── Null-value invariants ─────────────────────────────────────────────────
  // N1 has no CUD SKUs — GCP does not offer committed use for N1
  { name: 'n1-standard-1',  region: 'us-central1', field: 'linuxCud1yr',    expected: null },
  { name: 'n1-standard-1',  region: 'us-central1', field: 'linuxCud3yr',    expected: null },
  // T2A (Arm) has no CUD SKUs
  { name: 't2a-standard-1', region: 'us-central1', field: 'linuxCud1yr',    expected: null },
]

// SUD (Sustained Use Discount) factors — must match fetch-pricing.ts
const SUD_DISCOUNT: Record<string, number> = { N1: 0.30, N2: 0.20, N2D: 0.20 }

// Series detection patterns (same order as fetch-pricing.ts to avoid C3/C3D mismatches)
const SERIES_PATTERNS: [RegExp, string][] = [
  [/^A3Mega\s+/i, 'A3Mega'],
  [/^A3\s+/i,     'A3'],
  [/^A2\s+/i,     'A2'],
  [/^G2\s+/i,     'G2'],
  [/^C4\s+/i,     'C4'],
  [/^C3D\s+/i,    'C3D'],
  [/^C3\s+/i,     'C3'],
  [/^C2D\s+/i,    'C2D'],
  [/^C2\s+/i,     'C2'],
  [/^Compute[ -]optimized/i, 'C2'],
  [/^H3\s+/i,     'H3'],
  [/^N4\s+/i,     'N4'],
  [/^N2D\s+/i,    'N2D'],
  [/^N2\s+/i,     'N2'],
  [/^N1\s+/i,     'N1'],
  [/^E2\s+/i,     'E2'],
  [/^T2D\s+/i,    'T2D'],
  [/^T2A\s+/i,    'T2A'],
  [/^M3\s+/i,     'M3'],
  [/^M2\s+/i,     'M2'],
  [/^M1\s+/i,     'M1'],
  [/^Memory[ -]optimized/i, 'M1'],
]

// GPU model patterns (same as fetch-pricing.ts)
const GPU_TYPE_PATTERNS: [RegExp, string][] = [
  [/A100 80GB/i,              'A100_80GB'],
  [/A100 40GB/i,              'A100_40GB'],
  [/A100/i,                   'A100_40GB'],
  [/H100.*Mega|Mega.*H100/i,  'H100_MEGA_80GB'],
  [/H100/i,                   'H100_80GB'],
  [/\bL4\b/i,                 'L4'],
  [/B200/i,                   'B200'],
]

const CPU_RE   = /\bcore\b|\bcpu\b/i
const RAM_RE   = /\bram\b|\bmemory\b/i
const SKIP_RE  = /custom|sole.?tenancy|extended/i

// ── Rates map types ────────────────────────────────────────────────────────

type UsageType = 'OnDemand' | 'Preemptible' | 'Cud1yr' | 'Cud3yr'
// key: `${series}:${resource}:${region}:${usageType}:${os}`
type RatesMap  = Map<string, number>
// key: `${gpuType}:${region}:${usageType}`
type GpuRates  = Map<string, number>

interface ParsedRates {
  rates: RatesMap
  gpuRates: GpuRates
  windowsPerVcpuRate: number
}

// ── Helper: build rates map from raw SKUs (mirrors parseSkus in fetch-pricing.ts) ──

function buildRatesMap(skus: RawSku[]): ParsedRates {
  const rates: RatesMap = new Map()
  const gpuRates: GpuRates = new Map()
  let windowsPerVcpuRate = 0

  for (const sku of skus) {
    const { category, description, serviceRegions } = sku
    const price = extractPrice(sku)
    if (price === null || price === 0) continue

    // Windows license (global, per-vCPU standard rate)
    if (
      category.resourceFamily === 'License' &&
      description.toLowerCase().includes('licensing fee for windows') &&
      /\bon\s+vm\b/i.test(description) &&
      windowsPerVcpuRate === 0
    ) {
      windowsPerVcpuRate = price
      continue
    }

    if (category.resourceFamily !== 'Compute') continue

    const rg = category.resourceGroup

    // GPU SKUs
    if (rg === 'GPU') {
      let gpuType: string | null = null
      for (const [pat, type] of GPU_TYPE_PATTERNS) {
        if (pat.test(description)) { gpuType = type; break }
      }
      if (!gpuType) continue

      const usageType = mapUsageType(category.usageType)
      for (const region of serviceRegions.filter(isSpecificRegion)) {
        const key = `${gpuType}:${region}:${usageType}`
        if (!gpuRates.has(key)) gpuRates.set(key, price)
      }
      continue
    }

    if (rg !== 'CPU' && rg !== 'RAM' && rg !== 'N1Standard') continue

    const usageType = mapUsageType(category.usageType)
    const os: 'linux' | 'windows' = description.toLowerCase().includes('windows') ? 'windows' : 'linux'

    // Strip per-type prefixes before series matching (same as fetch-pricing.ts)
    const cleanDesc = description
      .replace(/^Commit[13]Yr:\s*/i, '')
      .replace(/^Commitment\s+v\d+:\s*/i, '')
      .replace(/^Spot\s+Preemptible\s+/i, '')
      .replace(/^DWS\s+[^:]+:\s*/i, '')
      .replace(/^Reserved\s+/i, '')

    if (SKIP_RE.test(cleanDesc)) continue

    const isCpu = CPU_RE.test(cleanDesc)
    const isRam = RAM_RE.test(cleanDesc)
    if (!isCpu && !isRam) continue
    const resource = isCpu ? 'cpu' : 'ram'

    let series: string | null = null
    if (/^C3D\s+/i.test(cleanDesc)) {
      series = 'C3D'
    } else {
      for (const [pattern, s] of SERIES_PATTERNS) {
        if (pattern.test(cleanDesc)) { series = s; break }
      }
    }
    if (!series) continue

    for (const region of serviceRegions.filter(isSpecificRegion)) {
      const key = `${series}:${resource}:${region}:${usageType}:${os}`
      if (!rates.has(key)) rates.set(key, price)
    }
  }

  return { rates, gpuRates, windowsPerVcpuRate }
}

function mapUsageType(raw: string): UsageType {
  if (raw === 'Preemptible') return 'Preemptible'
  if (raw === 'Commit1Yr')   return 'Cud1yr'
  if (raw === 'Commit3Yr')   return 'Cud3yr'
  return 'OnDemand'
}

function getRate(rates: RatesMap, series: string, resource: 'cpu' | 'ram', region: string, usageType: UsageType, os: 'linux' | 'windows' = 'linux'): number | null {
  return rates.get(`${series}:${resource}:${region}:${usageType}:${os}`) ?? null
}

function getGpuRate(gpuRates: GpuRates, gpuType: string, region: string, usageType: UsageType): number | null {
  return gpuRates.get(`${gpuType}:${region}:${usageType}`) ?? null
}

// ── isWithinTolerance / ValidationResult ──────────────────────────────────

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

// ── Truth table validation ─────────────────────────────────────────────────

function validateTruthTable(data: PricingData): ValidationResult[] {
  return TRUTH_TABLE.map((check) => {
    const inst = data.instances.find((i: InstancePricing) => i.name === check.name)
    const actual = inst?.pricing?.[check.region]?.[check.field] ?? null
    const pass = isWithinTolerance(actual as number | null, check.expected)
    return { ...check, actual: actual as number | null, pass }
  })
}

// ── Per-instance live validation helper ───────────────────────────────────

const round6 = (v: number) => Math.round(v * 1e6) / 1e6

function validateInstanceRegion(
  inst: InstancePricing,
  region: string,
  { rates, gpuRates, windowsPerVcpuRate }: ParsedRates,
): ValidationResult[] {
  if (inst.vCpus === 'shared') return []

  const p = inst.pricing[region]
  if (!p) return []

  const { series, vCpus, memoryGb } = inst
  const gpuCount = inst.gpuCount ?? 0
  const gpuType  = inst.gpuType  ?? null

  const cpuOD  = getRate(rates, series, 'cpu', region, 'OnDemand')
  const ramOD  = getRate(rates, series, 'ram', region, 'OnDemand')
  if (cpuOD === null || ramOD === null) return []

  const baseOD    = vCpus * cpuOD + memoryGb * ramOD
  const gpuOD     = gpuCount > 0 && gpuType ? (getGpuRate(gpuRates, gpuType, region, 'OnDemand') ?? null) : 0
  if (gpuOD === null) return []

  const sudDiscount = SUD_DISCOUNT[series] ?? 0
  const results: ValidationResult[] = []

  const check = (field: keyof InstanceRegionPricing, expected: number | null) => {
    const actual = p[field]
    results.push({
      name: inst.name,
      region,
      field,
      expected: expected !== null ? round6(expected) : null,
      actual:   actual  as number | null,
      pass: isWithinTolerance(actual as number | null, expected),
    })
  }

  // linuxOnDemand
  check('linuxOnDemand', baseOD + gpuCount * (gpuOD as number))

  // linuxSud — SUD applies only to base CPU+RAM; GPU add-on is at full OD rate
  const baseSud = baseOD * (1 - sudDiscount)
  check('linuxSud', baseSud + gpuCount * (gpuOD as number))

  // linuxPreemptible
  const cpuPre = getRate(rates, series, 'cpu', region, 'Preemptible')
  const ramPre = getRate(rates, series, 'ram', region, 'Preemptible')
  if (cpuPre !== null && ramPre !== null) {
    const gpuPre = gpuCount > 0 && gpuType ? (getGpuRate(gpuRates, gpuType, region, 'Preemptible') ?? null) : 0
    if (gpuPre !== null) {
      check('linuxPreemptible', vCpus * cpuPre + memoryGb * ramPre + gpuCount * gpuPre)
    }
  }

  // linuxCud1yr
  const cpuC1 = getRate(rates, series, 'cpu', region, 'Cud1yr')
  const ramC1 = getRate(rates, series, 'ram', region, 'Cud1yr')
  if (cpuC1 !== null && ramC1 !== null) {
    const gpuC1 = gpuCount > 0 && gpuType ? (getGpuRate(gpuRates, gpuType, region, 'Cud1yr') ?? null) : 0
    if (gpuC1 !== null) {
      check('linuxCud1yr', vCpus * cpuC1 + memoryGb * ramC1 + gpuCount * gpuC1)
    }
  }

  // windowsOnDemand — linux + per-vCPU Windows license premium
  if (windowsPerVcpuRate > 0) {
    const wp = vCpus * windowsPerVcpuRate
    check('windowsOnDemand', baseOD + gpuCount * (gpuOD as number) + wp)
  }

  return results
}

// ── Live validation ────────────────────────────────────────────────────────

async function validateLive(data: PricingData): Promise<ValidationResult[]> {
  if (!API_KEY) {
    console.log('No GOOGLE_CLOUD_API_KEY set — skipping live validation')
    return []
  }

  const COMPUTE_SERVICE_ID = '6F81-5844-456A'
  const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_SERVICE_ID}/skus`

  console.log('Fetching fresh rates from GCP Billing API...')
  const skus: RawSku[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(BASE_URL)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('pageSize', '5000')
    url.searchParams.set('currencyCode', 'USD')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await fetch(url.toString())
    const d = await res.json() as { skus: RawSku[]; nextPageToken?: string }
    skus.push(...(d.skus ?? []))
    pageToken = d.nextPageToken
  } while (pageToken)

  console.log(`Fetched ${skus.length} SKUs`)

  const parsed = buildRatesMap(skus)
  console.log(`Built rates map: ${parsed.rates.size} CPU/RAM rates, ${parsed.gpuRates.size} GPU rates`)
  console.log(`Windows per-vCPU rate: $${parsed.windowsPerVcpuRate}`)

  const results: ValidationResult[] = []
  const sharedCoreNames = new Set(['e2-micro', 'e2-small', 'e2-medium'])

  const sampleRegion = (region: string, n: number) => {
    const eligible = data.instances.filter(
      (i: InstancePricing) =>
        i.vCpus !== 'shared' &&
        !sharedCoreNames.has(i.name) &&
        i.pricing?.[region]?.linuxOnDemand != null,
    )
    return eligible.sort(() => Math.random() - 0.5).slice(0, n)
  }

  // us-central1: SAMPLE_SIZE instances
  console.log(`\nSampling ${SAMPLE_SIZE} instances from us-central1...`)
  for (const inst of sampleRegion('us-central1', SAMPLE_SIZE)) {
    const r = validateInstanceRegion(inst, 'us-central1', parsed)
    if (r.length === 0) console.log(`  Skipping ${inst.name} — no matching SKUs`)
    results.push(...r)
  }

  // europe-west1: 3 instances
  console.log('Sampling 3 instances from europe-west1...')
  for (const inst of sampleRegion('europe-west1', 3)) {
    results.push(...validateInstanceRegion(inst, 'europe-west1', parsed))
  }

  // asia-northeast1: 3 instances
  console.log('Sampling 3 instances from asia-northeast1...')
  for (const inst of sampleRegion('asia-northeast1', 3)) {
    results.push(...validateInstanceRegion(inst, 'asia-northeast1', parsed))
  }

  return results
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading pricing.json...')
  const data = loadPricingJson()
  console.log(`Loaded ${data.instances.length} instances, ${data.regions.length} regions`)
  console.log(`Data updated at: ${data.updatedAt}`)
  console.log()

  // ── Layer 1: Truth Table ──────────────────────────────────────────────────
  console.log('=== Layer 1 — Truth Table Validation ===')
  const truthResults = validateTruthTable(data)
  let truthFailed = 0
  for (const r of truthResults) {
    const status = r.pass ? '✓' : '✗'
    const expStr = r.expected === null ? 'null' : r.expected.toFixed(6)
    const actStr = r.actual   === null ? 'null' : r.actual.toFixed(6)
    if (!r.pass) {
      console.log(`  ${status} ${r.name} [${r.region}] ${r.field}: expected=${expStr}, got=${actStr}`)
      truthFailed++
    }
  }
  if (truthFailed === 0) console.log('  All entries matched.')
  console.log(`Truth table: ${truthResults.length - truthFailed}/${truthResults.length} passed`)
  console.log()

  // ── Layer 2: Live API Validation ──────────────────────────────────────────
  let liveResults: ValidationResult[] = []
  let liveFailed = 0

  if (API_KEY) {
    console.log(`=== Layer 2 — Live API Validation (sample size: ${SAMPLE_SIZE}) ===`)
    liveResults = await validateLive(data)
    for (const r of liveResults) {
      const status = r.pass ? '✓' : '✗'
      const line = `  ${status} ${r.name} [${r.region}] ${r.field}: expected=${r.expected?.toFixed(6) ?? 'null'}, got=${r.actual?.toFixed(6) ?? 'null'}`
      if (!r.pass) {
        console.log(line)
        liveFailed++
      }
    }
    if (liveFailed === 0 && liveResults.length > 0) console.log('  All sampled instances matched.')
    console.log(`Live checks: ${liveResults.length - liveFailed}/${liveResults.length} passed`)
    console.log()
  }

  // ── Verification Report ───────────────────────────────────────────────────
  const totalFailed = truthFailed + liveFailed
  console.log('=== GCP Pricing Data Verification Report ===')
  console.log(`Date:                 ${new Date().toISOString().slice(0, 10)}`)
  console.log(`pricing.json updated: ${data.updatedAt}`)
  console.log()
  console.log(`Layer 1 — Truth Table:        ${truthResults.length - truthFailed}/${truthResults.length} passed`)
  if (API_KEY) {
    console.log(`Layer 2 — Live API (n=${liveResults.length.toString().padStart(2)}):   ${liveResults.length - liveFailed}/${liveResults.length} passed`)
  } else {
    console.log('Layer 2 — Live API:           skipped (no GOOGLE_CLOUD_API_KEY)')
  }
  console.log()

  if (totalFailed > 0) {
    console.error(`VALIDATION FAILED: ${totalFailed} check(s) failed`)
    process.exit(1)
  } else {
    console.log('All validation checks passed ✓')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
