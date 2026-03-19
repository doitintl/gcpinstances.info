/**
 * Fetches GCP Cloud SQL instance pricing from the Cloud Billing Catalog API
 * and writes a structured cloudsql-pricing.json to public/data/cloudsql-pricing.json.
 *
 * Usage: GOOGLE_CLOUD_API_KEY=<key> tsx scripts/fetch-cloudsql-pricing.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { type RawSku, fetchAllSkus, extractPrice, isSpecificRegion } from './billing-api.js'
import { CLOUDSQL_MACHINE_TYPES } from './cloudsql-machine-types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
if (!API_KEY) {
  console.error('Error: GOOGLE_CLOUD_API_KEY environment variable is not set.')
  console.error('Run: GOOGLE_CLOUD_API_KEY=<key> npm run fetch-cloudsql-pricing')
  process.exit(1)
}

const CLOUDSQL_SERVICE_ID = '9662-B51E-5089'
const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${CLOUDSQL_SERVICE_ID}/skus`

// ----- Types -----

type Engine = 'mysql' | 'postgresql' | 'sqlserver'
type ZoneType = 'zonal' | 'regional'
type Resource = 'cpu' | 'ram'

// Bundled prices for N1 Standard/Highmem/f1-micro/g1-small (MySQL only)
// key: `${instanceName}:${zoneType}:${region}`
type BundledKey = string

// Decomposed per-unit rates
// key: `${engine}:${series}:${zoneType}:${region}:${resource}`
// series can be 'N1', 'N2', 'gen2' (catch-all)
type DecompKey = string

// ----- Output types (matches src/lib/types.ts) -----

interface CloudSqlRegionPricing {
  mysqlZonal: number | null
  mysqlRegional: number | null
  postgresZonal: number | null
  postgresRegional: number | null
  sqlServerZonal: number | null
  sqlServerRegional: number | null
}

interface CloudSqlInstance {
  name: string
  series: string
  tier: string
  edition: string
  vCpus: number | 'shared'
  memoryGb: number
  pricing: Record<string, CloudSqlRegionPricing>
}

interface CloudSqlPricingData {
  updatedAt: string
  regions: string[]
  instances: CloudSqlInstance[]
}

// ----- Helpers -----

function parseEngine(desc: string): Engine | null {
  const d = desc.toLowerCase()
  if (d.includes('postgresql') || d.includes('postgres')) return 'postgresql'
  if (d.includes('sql server')) return 'sqlserver'
  if (d.includes('mysql')) return 'mysql'
  return null
}

function parseZoneType(desc: string): ZoneType | null {
  if (/\bregional\b/i.test(desc)) return 'regional'
  if (/\bzonal\b/i.test(desc)) return 'zonal'
  return null
}

// Parse series identifier from description (e.g. "N2 vCPU", "N1 RAM")
function parseSeries(desc: string): string {
  if (/\bN2D\b/i.test(desc)) return 'N2D'
  if (/\bN4\b/i.test(desc)) return 'N4'
  if (/\bC4A\b/i.test(desc)) return 'C4A'
  if (/\bN2\b/i.test(desc)) return 'N2'
  if (/\bN1\b/i.test(desc)) return 'N1'
  return 'gen2'
}

// SKUs to skip
const SKIP_RE = /extended.?support|fdc.?trial|read.?replica|serverless.?export|commit/i

// ----- SKU parsing -----

function parseSkus(skus: RawSku[]): {
  bundled: Map<BundledKey, number>
  decomp: Map<DecompKey, number>
} {
  const bundled = new Map<BundledKey, number>()
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

    const zoneType = parseZoneType(description)
    if (!zoneType) continue

    // --- Bundled N1 Standard ---
    if (rg === 'SQLGen2InstancesN1Standard') {
      const vcpuMatch = description.match(/(\d+)\s*vCPU/i)
      if (!vcpuMatch) continue
      const vcpus = parseInt(vcpuMatch[1])
      const instanceName = `db-n1-standard-${vcpus}`
      for (const region of regions) {
        const key: BundledKey = `${instanceName}:${zoneType}:${region}`
        if (!bundled.has(key)) bundled.set(key, price)
      }
      continue
    }

    // --- Bundled N1 Highmem ---
    if (rg === 'SQLGen2InstancesN1Highmem') {
      const vcpuMatch = description.match(/(\d+)\s*vCPU/i)
      if (!vcpuMatch) continue
      const vcpus = parseInt(vcpuMatch[1])
      const instanceName = `db-n1-highmem-${vcpus}`
      for (const region of regions) {
        const key: BundledKey = `${instanceName}:${zoneType}:${region}`
        if (!bundled.has(key)) bundled.set(key, price)
      }
      continue
    }

    // --- Bundled F1 Micro ---
    if (rg === 'SQLGen2InstancesF1Micro') {
      for (const region of regions) {
        const key: BundledKey = `db-f1-micro:${zoneType}:${region}`
        if (!bundled.has(key)) bundled.set(key, price)
      }
      continue
    }

    // --- Bundled G1 Small ---
    if (rg === 'SQLGen2InstancesG1Small') {
      for (const region of regions) {
        const key: BundledKey = `db-g1-small:${zoneType}:${region}`
        if (!bundled.has(key)) bundled.set(key, price)
      }
      continue
    }

    // --- Decomposed CPU ---
    if (rg === 'SQLGen2InstancesCPU' || rg === 'SQLInstancesCPU') {
      const engine = parseEngine(description)
      if (!engine) continue
      const series = parseSeries(description)
      for (const region of regions) {
        const key: DecompKey = `${engine}:${series}:${zoneType}:${region}:cpu`
        if (!decomp.has(key)) decomp.set(key, price)
      }
      continue
    }

    // --- Decomposed RAM ---
    if (rg === 'SQLGen2InstancesRAM' || rg === 'SQLInstancesRAM') {
      const engine = parseEngine(description)
      if (!engine) continue
      const series = parseSeries(description)
      for (const region of regions) {
        const key: DecompKey = `${engine}:${series}:${zoneType}:${region}:ram`
        if (!decomp.has(key)) decomp.set(key, price)
      }
      continue
    }
  }

  return { bundled, decomp }
}

// ----- Rate lookup -----

function getDecompRate(
  decomp: Map<DecompKey, number>,
  engine: Engine,
  series: string,
  zoneType: ZoneType,
  region: string,
  resource: Resource,
): number | null {
  // Try exact series first
  const exactKey: DecompKey = `${engine}:${series}:${zoneType}:${region}:${resource}`
  if (decomp.has(exactKey)) return decomp.get(exactKey)!

  // Fall back to gen2 catch-all
  const gen2Key: DecompKey = `${engine}:gen2:${zoneType}:${region}:${resource}`
  if (decomp.has(gen2Key)) return decomp.get(gen2Key)!

  // Cross-engine fallback: all engines share the same base rates
  for (const fallbackEngine of ['mysql', 'postgresql', 'sqlserver'] as Engine[]) {
    if (fallbackEngine === engine) continue
    const fbExact: DecompKey = `${fallbackEngine}:${series}:${zoneType}:${region}:${resource}`
    if (decomp.has(fbExact)) return decomp.get(fbExact)!
    const fbGen2: DecompKey = `${fallbackEngine}:gen2:${zoneType}:${region}:${resource}`
    if (decomp.has(fbGen2)) return decomp.get(fbGen2)!
  }

  return null
}

function computePrice(
  decomp: Map<DecompKey, number>,
  engine: Engine,
  series: string,
  zoneType: ZoneType,
  region: string,
  vCpus: number,
  memoryGb: number,
): number | null {
  const cpuRate = getDecompRate(decomp, engine, series, zoneType, region, 'cpu')
  const ramRate = getDecompRate(decomp, engine, series, zoneType, region, 'ram')
  if (cpuRate === null || ramRate === null) return null
  return Math.round((vCpus * cpuRate + memoryGb * ramRate) * 1e6) / 1e6
}

// ----- Pricing table builder -----

function buildPricingTable(
  bundled: Map<BundledKey, number>,
  decomp: Map<DecompKey, number>,
): CloudSqlInstance[] {
  // Collect all regions from both maps
  const allRegions = new Set<string>()
  for (const key of bundled.keys()) {
    const parts = key.split(':')
    allRegions.add(parts[parts.length - 1])
  }
  for (const key of decomp.keys()) {
    const parts = key.split(':')
    // key format: engine:series:zoneType:region:resource
    allRegions.add(parts[3])
  }

  const instances: CloudSqlInstance[] = []

  for (const spec of CLOUDSQL_MACHINE_TYPES) {
    const pricing: Record<string, CloudSqlRegionPricing> = {}

    for (const region of allRegions) {
      const isShared = spec.vCpus === 'shared'

      // SQL Server doesn't support f1-micro/g1-small
      const supportsSqlServer = !isShared

      let mysqlZonal: number | null = null
      let mysqlRegional: number | null = null
      let postgresZonal: number | null = null
      let postgresRegional: number | null = null
      let sqlServerZonal: number | null = null
      let sqlServerRegional: number | null = null

      if (isShared) {
        // Shared-core: use bundled prices (MySQL only from API, PG same rate)
        mysqlZonal = bundled.get(`${spec.name}:zonal:${region}`) ?? null
        mysqlRegional = bundled.get(`${spec.name}:regional:${region}`) ?? null
        // PG: same rate as MySQL (base rates are identical)
        postgresZonal = mysqlZonal
        postgresRegional = mysqlRegional
        // SQL Server: not supported for shared-core
        sqlServerZonal = null
        sqlServerRegional = null
      } else {
        const vCpus = spec.vCpus as number
        const { series, memoryGb } = spec

        // MySQL: prefer bundled for N1, fall back to decomposed
        if (spec.series === 'N1') {
          mysqlZonal = bundled.get(`${spec.name}:zonal:${region}`)
            ?? computePrice(decomp, 'mysql', series, 'zonal', region, vCpus, memoryGb)
          mysqlRegional = bundled.get(`${spec.name}:regional:${region}`)
            ?? computePrice(decomp, 'mysql', series, 'regional', region, vCpus, memoryGb)
        } else {
          mysqlZonal = computePrice(decomp, 'mysql', series, 'zonal', region, vCpus, memoryGb)
          mysqlRegional = computePrice(decomp, 'mysql', series, 'regional', region, vCpus, memoryGb)
        }

        // PostgreSQL: decomposed rates (same as MySQL base rates)
        postgresZonal = computePrice(decomp, 'postgresql', series, 'zonal', region, vCpus, memoryGb)
          ?? mysqlZonal  // fallback to MySQL (same rate)
        postgresRegional = computePrice(decomp, 'postgresql', series, 'regional', region, vCpus, memoryGb)
          ?? mysqlRegional

        // SQL Server: decomposed rates
        if (supportsSqlServer) {
          sqlServerZonal = computePrice(decomp, 'sqlserver', series, 'zonal', region, vCpus, memoryGb)
            ?? mysqlZonal  // fallback — same compute rate
          sqlServerRegional = computePrice(decomp, 'sqlserver', series, 'regional', region, vCpus, memoryGb)
            ?? mysqlRegional
        }
      }

      // Skip region if no pricing data at all
      if (
        mysqlZonal === null && mysqlRegional === null &&
        postgresZonal === null && postgresRegional === null
      ) continue

      pricing[region] = {
        mysqlZonal,
        mysqlRegional,
        postgresZonal,
        postgresRegional,
        sqlServerZonal,
        sqlServerRegional,
      }
    }

    if (Object.keys(pricing).length === 0) continue

    instances.push({
      name: spec.name,
      series: spec.series,
      tier: spec.tier,
      edition: spec.edition,
      vCpus: spec.vCpus,
      memoryGb: spec.memoryGb,
      pricing,
    })
  }

  return instances
}

// ----- Main -----

async function main() {
  console.log('Fetching GCP Cloud SQL SKUs...')
  const skus = await fetchAllSkus(BASE_URL, API_KEY!)
  console.log(`Total SKUs fetched: ${skus.length}`)

  console.log('Parsing SKUs...')
  const { bundled, decomp } = parseSkus(skus)
  console.log(`Parsed ${bundled.size} bundled prices, ${decomp.size} decomposed rates`)

  console.log('Building pricing table...')
  const instances = buildPricingTable(bundled, decomp)
  console.log(`Built pricing for ${instances.length} machine types`)

  // Collect regions from all instances
  const regionSet = new Set<string>()
  for (const inst of instances) {
    for (const region of Object.keys(inst.pricing)) regionSet.add(region)
  }
  const regions = Array.from(regionSet).sort()
  console.log(`Regions: ${regions.length}`)

  const output: CloudSqlPricingData = {
    updatedAt: new Date().toISOString(),
    regions,
    instances,
  }

  const outPath = join(ROOT, 'public', 'data', 'cloudsql-pricing.json')
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
