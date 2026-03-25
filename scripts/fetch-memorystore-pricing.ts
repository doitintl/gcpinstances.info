/**
 * Fetches GCP Memorystore pricing from the Cloud Billing Catalog API
 * and writes memorystore-pricing.json to public/data/.
 *
 * Covers:
 *  - Memorystore for Redis (standalone): Basic & Standard tiers, M1-M5 capacity
 *  - Memorystore for Redis Cluster: node-based pricing
 *  - Memorystore for Valkey: node-based pricing
 *
 * Usage: GOOGLE_CLOUD_API_KEY=<key> tsx scripts/fetch-memorystore-pricing.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { type RawSku, fetchAllSkus, extractPrice, isSpecificRegion } from './billing-api.js'
import { MEMORYSTORE_MACHINE_TYPES } from './memorystore-machine-types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
if (!API_KEY) {
  console.error('Error: GOOGLE_CLOUD_API_KEY environment variable is not set.')
  console.error('Run: GOOGLE_CLOUD_API_KEY=<key> npm run fetch-memorystore-pricing')
  process.exit(1)
}

// Service IDs from GCP Billing Catalog
const REDIS_SERVICE_ID = '5AF5-2C11-D467'      // Cloud Memorystore for Redis
const VALKEY_SERVICE_ID = 'A2B5-E0F1-B0F3'     // Cloud Memorystore (Valkey)

const REDIS_BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${REDIS_SERVICE_ID}/skus`
const VALKEY_BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${VALKEY_SERVICE_ID}/skus`

// ----- Output types (matches src/lib/types.ts) -----

interface MemorystoreRegionPricing {
  onDemand: number | null
  cud1yr: number | null
  cud3yr: number | null
}

// CUD discount multipliers (from Google Cloud pricing docs)
// 1-year CUD: 20% off → 0.80 × on-demand
// 3-year CUD: 40% off → 0.60 × on-demand
// M1 tiers have no CUD pricing
const CUD_1YR_MULTIPLIER = 0.80
const CUD_3YR_MULTIPLIER = 0.60
const NO_CUD_NODE_TYPES = new Set(['M1'])

interface MemorystoreInstance {
  name: string
  product: string
  nodeType: string
  capacityGb: number | null
  vCpus: number | 'shared' | null
  memoryGb: number | null
  pricingUnit: string
  pricing: Record<string, MemorystoreRegionPricing>
}

interface MemorystorePricingData {
  updatedAt: string
  regions: string[]
  instances: MemorystoreInstance[]
}

// ----- SKU description → pricing key -----

// SKUs to skip (network, backups, storage, commitments)
const SKIP_RE = /network|egress|backup|aof|storage|commit|cross.?region/i

/**
 * Parse Redis service SKUs.
 * Returns a map: pricingKey → Map<region, price>
 *
 * pricingKey examples:
 *   "redis:basic:M1"       → Redis Capacity Basic M1 (per GiBy.h)
 *   "redis:standard:M3"    → Redis Capacity Standard M3 (per GiBy.h)
 *   "redis-cluster:Shared Core Nano" → per node/h
 *   "redis-cluster:Default"          → per node/h
 *   "redis-cluster-cap:M4"           → Redis Standard Node Capacity M4 (per GiBy.h)
 */
function parseRedisSkus(skus: RawSku[]): Map<string, Map<string, number>> {
  const rates = new Map<string, Map<string, number>>()

  for (const sku of skus) {
    const { category, description, serviceRegions } = sku
    if (category.resourceFamily !== 'ApplicationServices') continue
    if (category.resourceGroup !== 'Redis') continue
    if (SKIP_RE.test(description)) continue

    const price = extractPrice(sku)
    if (price === null || price === 0) continue

    const regions = serviceRegions.filter(isSpecificRegion)
    if (!regions.length) continue

    const desc = description

    // Redis Capacity Basic M1-M5 (per GiBy.h)
    const capacityBasicMatch = desc.match(/^Redis Capacity Basic (M\d)\b/)
    if (capacityBasicMatch) {
      const key = `redis:basic:${capacityBasicMatch[1]}`
      setRates(rates, key, regions, price)
      continue
    }

    // Redis Capacity Standard M1-M5 (per GiBy.h)
    const capacityStdMatch = desc.match(/^Redis Capacity Standard (M\d)\b/)
    if (capacityStdMatch) {
      const key = `redis:standard:${capacityStdMatch[1]}`
      setRates(rates, key, regions, price)
      continue
    }

    // Redis Standard Node Capacity M2-M5 (per GiBy.h, Redis Cluster capacity pricing)
    const stdNodeCapMatch = desc.match(/^Redis Standard Node Capacity (M\d)\b/)
    if (stdNodeCapMatch) {
      const key = `redis-cluster-cap:${stdNodeCapMatch[1]}`
      setRates(rates, key, regions, price)
      continue
    }

    // Redis Cluster Node types (per node/h)
    const clusterNodeMatch = desc.match(/^Redis Cluster Node (Shared Core Nano|Standard Small|Default|Highmem XLarge)\b/)
    if (clusterNodeMatch) {
      const key = `redis-cluster:${clusterNodeMatch[1]}`
      setRates(rates, key, regions, price)
      continue
    }
  }

  return rates
}

/**
 * Parse Valkey service SKUs.
 * Returns: pricingKey → Map<region, price>
 *
 * pricingKey examples:
 *   "valkey:Shared Core Nano" → per node/h
 *   "valkey:Highmem XLarge"   → per node/h
 */
function parseValkeySkus(skus: RawSku[]): Map<string, Map<string, number>> {
  const rates = new Map<string, Map<string, number>>()

  for (const sku of skus) {
    const { category, description, serviceRegions } = sku
    if (category.resourceFamily !== 'ApplicationServices') continue
    if (category.resourceGroup !== 'Valkey') continue
    if (SKIP_RE.test(description)) continue

    const price = extractPrice(sku)
    if (price === null || price === 0) continue

    const regions = serviceRegions.filter(isSpecificRegion)
    if (!regions.length) continue

    // Valkey node types (per node/h)
    const nodeMatch = description.match(/^(Shared Core Nano|Standard Small|Highmem Medium|Highmem XLarge) Node\b/)
    if (nodeMatch) {
      const key = `valkey:${nodeMatch[1]}`
      setRates(rates, key, regions, price)
      continue
    }
  }

  return rates
}

function setRates(
  rates: Map<string, Map<string, number>>,
  key: string,
  regions: string[],
  price: number,
) {
  if (!rates.has(key)) rates.set(key, new Map())
  const regionMap = rates.get(key)!
  for (const region of regions) {
    if (!regionMap.has(region)) regionMap.set(region, price)
  }
}

// ----- Map pricing keys to machine types -----

function getPricingKey(mt: typeof MEMORYSTORE_MACHINE_TYPES[0]): string {
  if (mt.product === 'Redis') {
    // redis-basic-m1 → redis:basic:M1
    const parts = mt.name.split('-')
    const tier = parts[1]     // basic or standard
    const mTier = parts[2].toUpperCase()  // M1-M5
    return `redis:${tier}:${mTier}`
  }
  if (mt.product === 'Redis Cluster') {
    // redis-cluster-shared-core-nano → redis-cluster:Shared Core Nano
    return `redis-cluster:${mt.nodeType}`
  }
  if (mt.product === 'Valkey') {
    return `valkey:${mt.nodeType}`
  }
  throw new Error(`Unknown product: ${mt.product}`)
}

// ----- Build pricing table -----

function buildPricingTable(
  redisRates: Map<string, Map<string, number>>,
  valkeyRates: Map<string, Map<string, number>>,
): MemorystoreInstance[] {
  const allRates = new Map([...redisRates, ...valkeyRates])
  const instances: MemorystoreInstance[] = []

  for (const mt of MEMORYSTORE_MACHINE_TYPES) {
    const key = getPricingKey(mt)
    const regionPrices = allRates.get(key)

    if (!regionPrices || regionPrices.size === 0) {
      console.warn(`  No pricing data for ${mt.name} (key: ${key})`)
      continue
    }

    // CUD pricing: only for Redis standalone M2-M5 tiers
    const hasCud = mt.product === 'Redis' && !NO_CUD_NODE_TYPES.has(mt.nodeType)

    const pricing: Record<string, MemorystoreRegionPricing> = {}
    for (const [region, price] of regionPrices) {
      const onDemand = Math.round(price * 1e6) / 1e6
      pricing[region] = {
        onDemand,
        cud1yr: hasCud ? Math.round(onDemand * CUD_1YR_MULTIPLIER * 1e6) / 1e6 : null,
        cud3yr: hasCud ? Math.round(onDemand * CUD_3YR_MULTIPLIER * 1e6) / 1e6 : null,
      }
    }

    const pricingUnit = mt.capacityGb !== null ? 'GiB/h' : 'node/h'

    instances.push({
      name: mt.name,
      product: mt.product,
      nodeType: mt.nodeType,
      capacityGb: mt.capacityGb,
      vCpus: mt.vCpus,
      memoryGb: mt.memoryGb,
      pricingUnit,
      pricing,
    })
  }

  return instances
}

// ----- Main -----

async function main() {
  console.log('Fetching Memorystore for Redis SKUs...')
  const redisSkus = await fetchAllSkus(REDIS_BASE_URL, API_KEY!)
  console.log(`Total Redis SKUs: ${redisSkus.length}`)

  console.log('Fetching Memorystore for Valkey SKUs...')
  const valkeySkus = await fetchAllSkus(VALKEY_BASE_URL, API_KEY!)
  console.log(`Total Valkey SKUs: ${valkeySkus.length}`)

  console.log('Parsing Redis SKUs...')
  const redisRates = parseRedisSkus(redisSkus)
  console.log(`Parsed ${redisRates.size} Redis pricing keys`)

  console.log('Parsing Valkey SKUs...')
  const valkeyRates = parseValkeySkus(valkeySkus)
  console.log(`Parsed ${valkeyRates.size} Valkey pricing keys`)

  console.log('Building pricing table...')
  const instances = buildPricingTable(redisRates, valkeyRates)
  console.log(`Built pricing for ${instances.length} instance types`)

  // Collect regions
  const regionSet = new Set<string>()
  for (const inst of instances) {
    for (const region of Object.keys(inst.pricing)) regionSet.add(region)
  }
  const regions = Array.from(regionSet).sort()
  console.log(`Regions: ${regions.length}`)

  const output: MemorystorePricingData = {
    updatedAt: new Date().toISOString(),
    regions,
    instances,
  }

  const outPath = join(ROOT, 'public', 'data', 'memorystore-pricing.json')
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
