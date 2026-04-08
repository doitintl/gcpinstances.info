/**
 * Fetches GCP AlloyDB instance pricing from the Cloud Billing Catalog API
 * and writes a structured alloydb-pricing.json to public/data/alloydb-pricing.json.
 *
 * AlloyDB is PostgreSQL-only and always regional HA (no engine/zonal dimensions).
 * Uses decomposed pricing only (per-vCPU + per-GB RAM).
 *
 * Usage: GOOGLE_CLOUD_API_KEY=<key> tsx scripts/fetch-alloydb-pricing.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { type RawSku, fetchAllSkus, extractPrice, isSpecificRegion } from './billing-api.js'
import { ALLOYDB_MACHINE_TYPES } from './alloydb-machine-types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
if (!API_KEY) {
  console.error('Error: GOOGLE_CLOUD_API_KEY environment variable is not set.')
  console.error('Run: GOOGLE_CLOUD_API_KEY=<key> npm run fetch-alloydb-pricing')
  process.exit(1)
}

const ALLOYDB_SERVICE_ID = 'C49F-B7F2-7416'
const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${ALLOYDB_SERVICE_ID}/skus`

// ----- Types -----

type Resource = 'cpu' | 'ram'

// Decomposed per-unit rates
// key: `${series}:${region}:${resource}`
type DecompKey = string

// ----- Output types -----

// CUD discount multipliers (from Google Cloud pricing docs)
// 1-year CUD: 25% off → 0.75 × on-demand
// 3-year CUD: 52% off → 0.48 × on-demand
const CUD_1YR_MULTIPLIER = 0.75
const CUD_3YR_MULTIPLIER = 0.48

interface AlloyDbRegionPricing {
  onDemand: number | null
  cud1yr: number | null
  cud3yr: number | null
}

interface AlloyDbInstance {
  name: string
  series: string
  tier: string
  vCpus: number
  memoryGb: number
  pricing: Record<string, AlloyDbRegionPricing>
}

interface AlloyDbPricingData {
  updatedAt: string
  regions: string[]
  instances: AlloyDbInstance[]
}

// ----- Helpers -----

// Parse series identifier from description (e.g. "N2 vCPU", "C4A RAM")
function parseSeries(desc: string): string {
  if (/\bC4A\b/i.test(desc)) return 'C4A'
  if (/\bC4\b/i.test(desc)) return 'C4'
  if (/\bZ3\b/i.test(desc)) return 'Z3'
  if (/\bN2\b/i.test(desc)) return 'N2'
  return 'gen2'
}

// SKUs to skip
const SKIP_RE = /free.?tier|commit|backup|storage|network/i

// ----- SKU parsing -----

function parseSkus(skus: RawSku[]): Map<DecompKey, number> {
  const decomp = new Map<DecompKey, number>()

  for (const sku of skus) {
    const { category, description, serviceRegions } = sku

    if (category.resourceFamily !== 'ApplicationServices') continue

    // Skip unwanted SKU types
    if (SKIP_RE.test(description)) continue
    if (category.usageType === 'Commit1Yr' || category.usageType === 'Commit3Yr') continue

    const price = extractPrice(sku)
    if (price === null || price === 0) continue

    const rg = category.resourceGroup
    const regions = serviceRegions.filter(isSpecificRegion)
    if (!regions.length) continue

    // Determine resource type from resourceGroup
    let resource: Resource | null = null
    if (/CPU/i.test(rg)) {
      resource = 'cpu'
    } else if (/RAM/i.test(rg)) {
      resource = 'ram'
    }
    if (!resource) continue

    const series = parseSeries(description)

    for (const region of regions) {
      const key: DecompKey = `${series}:${region}:${resource}`
      if (!decomp.has(key)) decomp.set(key, price)
    }
  }

  return decomp
}

// ----- Rate lookup -----

function getDecompRate(
  decomp: Map<DecompKey, number>,
  series: string,
  region: string,
  resource: Resource,
): number | null {
  // Try exact series first
  const exactKey: DecompKey = `${series}:${region}:${resource}`
  if (decomp.has(exactKey)) return decomp.get(exactKey)!

  // Fall back to gen2 catch-all
  const gen2Key: DecompKey = `gen2:${region}:${resource}`
  if (decomp.has(gen2Key)) return decomp.get(gen2Key)!

  return null
}

function computePrice(
  decomp: Map<DecompKey, number>,
  series: string,
  region: string,
  vCpus: number,
  memoryGb: number,
): number | null {
  const cpuRate = getDecompRate(decomp, series, region, 'cpu')
  const ramRate = getDecompRate(decomp, series, region, 'ram')
  if (cpuRate === null || ramRate === null) return null
  return Math.round((vCpus * cpuRate + memoryGb * ramRate) * 1e6) / 1e6
}

// ----- Pricing table builder -----

function buildPricingTable(decomp: Map<DecompKey, number>): AlloyDbInstance[] {
  // Collect all regions from decomposed rates
  const allRegions = new Set<string>()
  for (const key of decomp.keys()) {
    const parts = key.split(':')
    // key format: series:region:resource
    allRegions.add(parts[1])
  }

  const instances: AlloyDbInstance[] = []

  for (const spec of ALLOYDB_MACHINE_TYPES) {
    const pricing: Record<string, AlloyDbRegionPricing> = {}

    for (const region of allRegions) {
      const onDemand = computePrice(decomp, spec.series, region, spec.vCpus, spec.memoryGb)
      if (onDemand === null) continue

      const cud = (price: number | null, mult: number) =>
        price !== null ? Math.round(price * mult * 1e6) / 1e6 : null

      pricing[region] = {
        onDemand,
        cud1yr: cud(onDemand, CUD_1YR_MULTIPLIER),
        cud3yr: cud(onDemand, CUD_3YR_MULTIPLIER),
      }
    }

    if (Object.keys(pricing).length === 0) continue

    instances.push({
      name: spec.name,
      series: spec.series,
      tier: spec.tier,
      vCpus: spec.vCpus,
      memoryGb: spec.memoryGb,
      pricing,
    })
  }

  return instances
}

// ----- Main -----

async function main() {
  console.log('Fetching GCP AlloyDB SKUs...')
  const skus = await fetchAllSkus(BASE_URL, API_KEY!)
  console.log(`Total SKUs fetched: ${skus.length}`)

  console.log('Parsing SKUs...')
  const decomp = parseSkus(skus)
  console.log(`Parsed ${decomp.size} decomposed rates`)

  console.log('Building pricing table...')
  const instances = buildPricingTable(decomp)
  console.log(`Built pricing for ${instances.length} machine types`)

  // Collect regions from all instances
  const regionSet = new Set<string>()
  for (const inst of instances) {
    for (const region of Object.keys(inst.pricing)) regionSet.add(region)
  }
  const regions = Array.from(regionSet).sort()
  console.log(`Regions: ${regions.length}`)

  const output: AlloyDbPricingData = {
    updatedAt: new Date().toISOString(),
    regions,
    instances,
  }

  const outPath = join(ROOT, 'public', 'data', 'alloydb-pricing.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`Written to ${outPath}`)

  const totalPricingEntries = instances.reduce((acc, i) => acc + Object.keys(i.pricing).length, 0)
  console.log(`Total pricing entries: ${totalPricingEntries}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
