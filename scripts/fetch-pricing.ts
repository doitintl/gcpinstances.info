/**
 * Fetches GCP Compute Engine instance pricing from the Cloud Billing Catalog API
 * and writes a structured pricing.json to public/data/pricing.json.
 *
 * Usage: GOOGLE_CLOUD_API_KEY=<key> tsx scripts/fetch-pricing.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { MACHINE_TYPES, MACHINE_TYPE_MAP, SERIES_SPECS } from './machine-types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
if (!API_KEY) {
  console.error('Error: GOOGLE_CLOUD_API_KEY environment variable is not set.')
  console.error('Run: GOOGLE_CLOUD_API_KEY=<key> npm run fetch-pricing')
  process.exit(1)
}

const COMPUTE_SERVICE_ID = '6F81-5844-456A'
const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_SERVICE_ID}/skus`

// ----- Types -----

interface RawSku {
  name: string
  skuId: string
  description: string
  category: {
    serviceDisplayName: string
    resourceFamily: string
    resourceGroup: string
    usageType: string
  }
  serviceRegions: string[]
  pricingInfo: Array<{
    pricingExpression: {
      usageUnit: string
      tieredRates: Array<{
        unitPrice: { currencyCode: string; units: string; nanos: number }
      }>
    }
  }>
}

// Keyed as `${series}:${resource}:${region}:${usageType}:${os}`
type PriceKey = string

interface ResourceRate {
  series: string
  resource: 'cpu' | 'ram'
  region: string
  usageType: 'OnDemand' | 'Cud1yr' | 'Cud3yr' | 'Preemptible'
  os: 'linux' | 'windows'
  pricePerUnit: number  // USD per vCPU-hour or per GiB-hour
}

export interface InstanceRegionPricing {
  linuxOnDemand: number | null
  linuxSud: number | null
  linuxPreemptible: number | null
  linuxCud1yr: number | null
  linuxCud3yr: number | null
  windowsOnDemand: number | null
  windowsSud: number | null
  windowsPreemptible: number | null
  windowsCud1yr: number | null
  windowsCud3yr: number | null
}

export interface InstancePricing {
  name: string
  series: string
  family: string
  vCpus: number | 'shared'
  memoryGb: number
  cpuType: string | null
  localSsd: boolean
  networkPerformance: string | null
  gpuSupport: boolean
  soleTenantSupport: boolean
  nestedVirtualizationSupport: boolean
  coremarkScore: number | null
  pricing: Record<string, InstanceRegionPricing>
}

export interface PricingData {
  updatedAt: string
  regions: string[]
  instances: InstancePricing[]
}

// ----- SUD (Sustained Use Discount) factors -----
// SUD applies automatically for N1, N2, N2D series when instances run the whole month.
// Effective rate for full-month usage = on-demand * (1 - sud_discount).
// Other series (E2, T2D, T2A, C2, C2D, C3, M*, N4) do not receive SUD.
// E2 has its own discount model; for simplicity we show on-demand as SUD here.
const SUD_DISCOUNT: Record<string, number> = {
  N1: 0.30,
  N2: 0.20,
  N2D: 0.20,
}

function getSudRate(series: string, onDemandRate: number): number {
  const discount = SUD_DISCOUNT[series] ?? 0
  return onDemandRate * (1 - discount)
}

// ----- SKU fetching -----

async function fetchAllSkus(): Promise<RawSku[]> {
  const skus: RawSku[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(BASE_URL)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('pageSize', '5000')
    url.searchParams.set('currencyCode', 'USD')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    console.log(`Fetching SKUs page${pageToken ? ` (token: ${pageToken.slice(0, 20)}...)` : ''}...`)
    const res = await fetch(url.toString())
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`API request failed: ${res.status} ${res.statusText}\n${body}`)
    }

    const data = await res.json() as { skus: RawSku[]; nextPageToken?: string }
    skus.push(...(data.skus ?? []))
    pageToken = data.nextPageToken
    console.log(`  Got ${data.skus?.length ?? 0} SKUs (total: ${skus.length})`)
  } while (pageToken)

  return skus
}

// ----- SKU parsing -----

function extractPrice(sku: RawSku): number | null {
  const rates = sku.pricingInfo?.[0]?.pricingExpression?.tieredRates
  if (!rates?.length) return null
  // Use the last tiered rate (usually the catch-all rate)
  const rate = rates[rates.length - 1]?.unitPrice
  if (!rate) return null
  return Number(rate.units || 0) + (rate.nanos || 0) / 1e9
}

// Map from Billing API region descriptions to GCP region names
// The API returns regions like "us-central1", "europe-west1" etc. directly in serviceRegions
// For some SKUs it's multi-regional like "us", "europe" — we skip those.
const SPECIFIC_REGION_RE = /^[a-z]+-[a-z]+\d+$/
function isSpecificRegion(region: string): boolean {
  return SPECIFIC_REGION_RE.test(region)
}

// Windows license pricing is per-vCPU-hour with tiers:
// tier1: 1-4 vCPUs (per-instance rate), tier2: 5+ vCPUs (per-vCPU rate)
interface WindowsLicense {
  region: string  // empty string = global
  tier1Price: number  // flat rate for 1-4 vCPU instances (per hour total)
  tier2Price: number  // per-vCPU rate for 5+ vCPU instances
}

// Hoisted regex constants for the hot SKU parsing loop
const CPU_RE = /\bcore\b|\bcpu\b/i
const RAM_RE = /\bram\b|\bmemory\b/i
const SKIP_KEYWORDS_RE = /custom|sole.?tenancy|extended|sole tenancy premium/i
const SERIES_PATTERNS: [RegExp, string][] = [
  [/^C3\s+/i,             'C3'],
  [/^C2D\s+/i,            'C2D'],
  [/^C2\s+/i,             'C2'],
  [/^Compute[ -]optimized/i, 'C2'],
  [/^N4\s+/i,             'N4'],
  [/^N2D\s+/i,            'N2D'],
  [/^N2\s+/i,             'N2'],
  [/^N1\s+/i,             'N1'],
  [/^E2\s+/i,             'E2'],
  [/^T2D\s+/i,            'T2D'],
  [/^T2A\s+/i,            'T2A'],
  [/^M3\s+/i,             'M3'],
  [/^M2\s+/i,             'M2'],
  [/^M1\s+/i,             'M1'],
  [/^Memory[ -]optimized/i, 'M1'],
]

function parseSkus(skus: RawSku[]): {
  rates: Map<PriceKey, ResourceRate>
  windowsLicenses: WindowsLicense[]
  f1MicroRates: Map<string, { linux: number | null; cud1yr: number | null }>
  g1SmallRates: Map<string, { linux: number | null; cud1yr: number | null }>
} {
  const rates = new Map<PriceKey, ResourceRate>()
  const windowsLicenses: WindowsLicense[] = []
  const f1MicroRates = new Map<string, { linux: number | null; cud1yr: number | null }>()
  const g1SmallRates = new Map<string, { linux: number | null; cud1yr: number | null }>()

  for (const sku of skus) {
    const { category, description, serviceRegions } = sku

    // Handle Windows licensing SKUs (resourceFamily = 'License')
    if (category.resourceFamily === 'License' && description.toLowerCase().includes('licensing fee for windows')) {
      const price = extractPrice(sku)
      if (price === null || price === 0) continue

      const isOnVm = /\bon\s+vm\b/i.test(description)
      if (!isOnVm) continue

      let license = windowsLicenses.find((l) => l.region === '')
      if (!license) {
        license = { region: '', tier1Price: 0, tier2Price: price }
        windowsLicenses.push(license)
      } else if (description.toLowerCase().includes('standard')) {
        license.tier2Price = price
      } else if (license.tier2Price === 0) {
        license.tier2Price = price
      }
      continue
    }

    if (category.resourceFamily !== 'Compute') continue

    const price = extractPrice(sku)
    if (price === null || price === 0) continue

    const rg = category.resourceGroup
    const usageType = category.usageType

    // --- f1-micro ---
    if (rg === 'F1Micro') {
      const regions = serviceRegions.filter(isSpecificRegion)
      if (!regions.length) continue
      const isCud = description.toLowerCase().includes('commit')
      for (const region of regions) {
        const existing = f1MicroRates.get(region) ?? { linux: null, cud1yr: null }
        if (isCud) existing.cud1yr = price
        else existing.linux = price
        f1MicroRates.set(region, existing)
      }
      continue
    }

    // --- g1-small ---
    if (rg === 'G1Small') {
      const regions = serviceRegions.filter(isSpecificRegion)
      if (!regions.length) continue
      const isCud = description.toLowerCase().includes('commit')
      for (const region of regions) {
        const existing = g1SmallRates.get(region) ?? { linux: null, cud1yr: null }
        if (isCud) existing.cud1yr = price
        else existing.linux = price
        g1SmallRates.set(region, existing)
      }
      continue
    }

    // --- CPU / RAM SKUs ---
    if (rg !== 'CPU' && rg !== 'RAM' && rg !== 'N1Standard') continue

    // Determine usageType
    let parsedUsageType: ResourceRate['usageType']
    if (usageType === 'Preemptible') {
      parsedUsageType = 'Preemptible'
    } else if (usageType === 'Commit1Yr' || description.toLowerCase().includes('commit1yr')) {
      parsedUsageType = 'Cud1yr'
    } else if (usageType === 'Commit3Yr' || description.toLowerCase().includes('commit3yr')) {
      parsedUsageType = 'Cud3yr'
    } else {
      parsedUsageType = 'OnDemand'
    }

    // Determine OS
    const os: ResourceRate['os'] = description.toLowerCase().includes('windows') ? 'windows' : 'linux'

    // Strip CUD/Spot prefix from description for series matching
    const cleanDesc = description
      .replace(/^Commit[13]Yr:\s*/i, '')
      .replace(/^Commitment\s+v\d+:\s*/i, '')
      .replace(/^Spot\s+Preemptible\s+/i, '')
      .replace(/^DWS\s+[^:]+:\s*/i, '')
      .replace(/^Reserved\s+/i, '')

    // Determine series and resource type
    let series: string | null = null
    let resource: 'cpu' | 'ram' | null = null

    const isCpu = CPU_RE.test(cleanDesc)
    const isRam = RAM_RE.test(cleanDesc)
    if (!isCpu && !isRam) continue

    resource = isCpu ? 'cpu' : 'ram'

    // Series detection — handle C3/C3D ambiguity
    if (/^C3D\s+/i.test(cleanDesc)) {
      series = 'C3D'
    } else {
      for (const [pattern, s] of SERIES_PATTERNS) {
        if (pattern.test(cleanDesc)) {
          series = s
          break
        }
      }
    }

    if (!series) continue

    // Skip custom/sole-tenancy/extended variants — we only want predefined pricing
    if (SKIP_KEYWORDS_RE.test(cleanDesc)) continue

    const regions = serviceRegions.filter(isSpecificRegion)
    if (!regions.length) continue

    for (const region of regions) {
      const key: PriceKey = `${series}:${resource}:${region}:${parsedUsageType}:${os}`
      // Keep the first (lowest) rate in case of duplicates
      if (!rates.has(key)) {
        rates.set(key, { series, resource, region, usageType: parsedUsageType, os, pricePerUnit: price })
      }
    }
  }

  return { rates, windowsLicenses, f1MicroRates, g1SmallRates }
}

// ----- Price calculation -----

function getRate(
  rates: Map<PriceKey, ResourceRate>,
  series: string,
  resource: 'cpu' | 'ram',
  region: string,
  usageType: ResourceRate['usageType'],
  os: 'linux' | 'windows' = 'linux',
): number | null {
  const key: PriceKey = `${series}:${resource}:${region}:${usageType}:${os}`
  return rates.get(key)?.pricePerUnit ?? null
}

function calcWindowsLicensePremium(vCpus: number, perVcpuRate: number): number {
  return perVcpuRate * vCpus
}

function buildPricingTable(
  rates: Map<PriceKey, ResourceRate>,
  windowsLicenses: WindowsLicense[],
  f1MicroRates: Map<string, { linux: number | null; cud1yr: number | null }>,
  g1SmallRates: Map<string, { linux: number | null; cud1yr: number | null }>,
): InstancePricing[] {
  // Collect all regions from the rates map
  const allRegions = new Set<string>()
  for (const rate of rates.values()) allRegions.add(rate.region)
  for (const region of f1MicroRates.keys()) allRegions.add(region)
  for (const region of g1SmallRates.keys()) allRegions.add(region)

  // Resolve the global Windows license once, not per-instance
  const globalWindowsLicense = windowsLicenses.find((l) => l.region === '')
  const windowsPerVcpuRate = globalWindowsLicense?.tier2Price ?? 0

  const instances: InstancePricing[] = []

  for (const spec of MACHINE_TYPES) {
    const pricing: Record<string, InstanceRegionPricing> = {}

    const round = (v: number) => Math.round(v * 1e6) / 1e6
    const calcRate = (cpuRate: number | null, ramRate: number | null, vCpus: number, memGb: number) =>
      cpuRate !== null && ramRate !== null ? round(vCpus * cpuRate + memGb * ramRate) : null

    for (const region of allRegions) {
      const nullPricing: InstanceRegionPricing = {
        linuxOnDemand: null, linuxSud: null, linuxPreemptible: null, linuxCud1yr: null, linuxCud3yr: null,
        windowsOnDemand: null, windowsSud: null, windowsPreemptible: null, windowsCud1yr: null, windowsCud3yr: null,
      }

      // --- Special cases: f1-micro, g1-small ---
      if (spec.name === 'f1-micro') {
        const r = f1MicroRates.get(region)
        if (!r) continue
        pricing[region] = { ...nullPricing, linuxOnDemand: r.linux, linuxSud: r.linux, linuxCud1yr: r.cud1yr }
        continue
      }
      if (spec.name === 'g1-small') {
        const r = g1SmallRates.get(region)
        if (!r) continue
        pricing[region] = { ...nullPricing, linuxOnDemand: r.linux, linuxSud: r.linux, linuxCud1yr: r.cud1yr }
        continue
      }

      if (spec.vCpus === 'shared') continue

      // Shared-core E2 (micro/small/medium): Linux pricing not available, Windows = license only
      if (spec.sharedCore) {
        const wp = calcWindowsLicensePremium(spec.vCpus as number, windowsPerVcpuRate)
        if (wp > 0) {
          pricing[region] = { ...nullPricing, windowsOnDemand: round(wp), windowsSud: round(wp), windowsCud1yr: round(wp) }
        }
        continue
      }

      const { series, vCpus, memoryGb } = spec

      const linuxCpuOD = getRate(rates, series, 'cpu', region, 'OnDemand', 'linux')
      const linuxRamOD = getRate(rates, series, 'ram', region, 'OnDemand', 'linux')
      if (linuxCpuOD === null || linuxRamOD === null) continue

      const linuxOD = round(vCpus * linuxCpuOD + memoryGb * linuxRamOD)
      const linuxSud = round(getSudRate(series, linuxOD))
      const linuxPreemptible = calcRate(
        getRate(rates, series, 'cpu', region, 'Preemptible', 'linux'),
        getRate(rates, series, 'ram', region, 'Preemptible', 'linux'),
        vCpus, memoryGb,
      )
      const linuxCud1yr = calcRate(
        getRate(rates, series, 'cpu', region, 'Cud1yr', 'linux'),
        getRate(rates, series, 'ram', region, 'Cud1yr', 'linux'),
        vCpus, memoryGb,
      )
      const linuxCud3yr = calcRate(
        getRate(rates, series, 'cpu', region, 'Cud3yr', 'linux'),
        getRate(rates, series, 'ram', region, 'Cud3yr', 'linux'),
        vCpus, memoryGb,
      )

      const wp = calcWindowsLicensePremium(vCpus, windowsPerVcpuRate)

      pricing[region] = {
        linuxOnDemand: linuxOD,
        linuxSud: linuxSud,
        linuxPreemptible: linuxPreemptible,
        linuxCud1yr: linuxCud1yr,
        linuxCud3yr: linuxCud3yr,
        windowsOnDemand: round(linuxOD + wp),
        windowsSud: round(linuxSud + wp),
        windowsPreemptible: linuxPreemptible !== null ? round(linuxPreemptible + wp) : null,
        windowsCud1yr: linuxCud1yr !== null ? round(linuxCud1yr + wp) : null,
        windowsCud3yr: linuxCud3yr !== null ? round(linuxCud3yr + wp) : null,
      }
    }

    if (Object.keys(pricing).length === 0) continue

    // Merge series-level specs
    const seriesDefaults = SERIES_SPECS[spec.series] ?? {}

    instances.push({
      name: spec.name,
      series: spec.series,
      family: spec.family,
      vCpus: spec.vCpus,
      memoryGb: spec.memoryGb,
      cpuType: spec.cpuType ?? seriesDefaults.cpuType ?? null,
      localSsd: spec.localSsd ?? seriesDefaults.localSsd ?? false,
      networkPerformance: spec.networkBandwidth ?? seriesDefaults.networkBandwidth ?? null,
      gpuSupport: spec.gpuSupport ?? seriesDefaults.gpuSupport ?? false,
      soleTenantSupport: spec.soleTenantSupport ?? seriesDefaults.soleTenantSupport ?? false,
      nestedVirtualizationSupport: spec.nestedVirtualization ?? seriesDefaults.nestedVirtualization ?? false,
      coremarkScore: spec.coremarkScore ?? null,
      pricing,
    })
  }

  return instances
}

// ----- Main -----

async function main() {
  console.log('Fetching GCP Compute Engine SKUs...')
  const skus = await fetchAllSkus()
  console.log(`Total SKUs fetched: ${skus.length}`)

  console.log('Parsing SKUs...')
  const { rates, windowsLicenses, f1MicroRates, g1SmallRates } = parseSkus(skus)
  console.log(`Parsed ${rates.size} resource rates`)
  console.log(`Windows licenses: ${windowsLicenses.length}`)

  console.log('Building pricing table...')
  const instances = buildPricingTable(rates, windowsLicenses, f1MicroRates, g1SmallRates)
  console.log(`Built pricing for ${instances.length} machine types`)

  // Collect regions from all instances
  const regionSet = new Set<string>()
  for (const inst of instances) {
    for (const region of Object.keys(inst.pricing)) regionSet.add(region)
  }
  const regions = Array.from(regionSet).sort()
  console.log(`Regions: ${regions.length}`)

  const output: PricingData = {
    updatedAt: new Date().toISOString(),
    regions,
    instances,
  }

  const outPath = join(ROOT, 'public', 'data', 'pricing.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`Written to ${outPath}`)

  // Summary
  const totalPricingEntries = instances.reduce((acc, i) => acc + Object.keys(i.pricing).length, 0)
  console.log(`Total pricing entries: ${totalPricingEntries}`)

  // Check for known machine types
  const found = MACHINE_TYPE_MAP.size
  console.log(`Machine types with data: ${instances.length}/${found}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
