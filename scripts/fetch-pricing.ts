/**
 * Fetches GCP Compute Engine instance pricing from the Cloud Billing Catalog API
 * and writes a structured pricing.json to public/data/pricing.json.
 *
 * Usage: GOOGLE_CLOUD_API_KEY=<key> tsx scripts/fetch-pricing.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { MACHINE_TYPES, MACHINE_TYPE_MAP, SERIES_SPECS, COREMARK_SCORES } from './machine-types.js'
import { fetchAllSkus } from './billing-api.js'
import {
  parseSkus, type PriceKey, type ResourceRate, type WindowsLicense, type GpuRateKey, type GpuRate,
} from './sku-parse.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Either an API key (CI) or local gcloud credentials (a laptop) will do —
// fetchAllSkus picks whichever is available and fails if neither is.
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY

const COMPUTE_SERVICE_ID = '6F81-5844-456A'
const BASE_URL = `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_SERVICE_ID}/skus`

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
  gpuCount: number | null
  gpuType: string | null
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

// ----- SKU parsing -----

// Windows license pricing is per-vCPU-hour with tiers:
// tier1: 1-4 vCPUs (per-instance rate), tier2: 5+ vCPUs (per-vCPU rate)

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

function getGpuRate(
  gpuRates: Map<GpuRateKey, GpuRate>,
  gpuType: string,
  region: string,
  usageType: ResourceRate['usageType'],
): number | null {
  return gpuRates.get(`${gpuType}:${region}:${usageType}`)?.pricePerGpu ?? null
}

export function buildPricingTable(
  rates: Map<PriceKey, ResourceRate>,
  gpuRates: Map<GpuRateKey, GpuRate>,
  windowsLicenses: WindowsLicense[],
): InstancePricing[] {
  // Collect all regions from the rates map
  const allRegions = new Set<string>()
  for (const rate of rates.values()) allRegions.add(rate.region)

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

      if (spec.vCpus === 'shared') continue

      // Shared-core E2 (micro/small/medium): billed as a fraction of an E2 vCPU
      // (e2-micro=0.25, e2-small=0.5, e2-medium=1) plus actual memory, using
      // the same E2 CPU/RAM SKU rates as the full-size E2 instances.
      if (spec.sharedCore) {
        const billedVcpus = spec.billedVcpus ?? 0
        const memGb = spec.memoryGb
        const wpShared = calcWindowsLicensePremium(spec.vCpus as number, windowsPerVcpuRate)

        const cpuOD  = getRate(rates, 'E2', 'cpu', region, 'OnDemand',    'linux')
        const ramOD  = getRate(rates, 'E2', 'ram', region, 'OnDemand',    'linux')
        const cpuP   = getRate(rates, 'E2', 'cpu', region, 'Preemptible', 'linux')
        const ramP   = getRate(rates, 'E2', 'ram', region, 'Preemptible', 'linux')
        const cpuC1  = getRate(rates, 'E2', 'cpu', region, 'Cud1yr',      'linux')
        const ramC1  = getRate(rates, 'E2', 'ram', region, 'Cud1yr',      'linux')
        const cpuC3  = getRate(rates, 'E2', 'cpu', region, 'Cud3yr',      'linux')
        const ramC3  = getRate(rates, 'E2', 'ram', region, 'Cud3yr',      'linux')

        const calc = (cpu: number | null, ram: number | null) =>
          cpu !== null && ram !== null ? round(billedVcpus * cpu + memGb * ram) : null

        const linuxOD  = calc(cpuOD,  ramOD)
        const linuxP   = calc(cpuP,   ramP)
        const linuxC1  = calc(cpuC1,  ramC1)
        const linuxC3  = calc(cpuC3,  ramC3)

        // E2 series has no SUD — SUD rate equals on-demand
        const linuxSud = linuxOD

        if (linuxOD !== null || wpShared > 0) {
          pricing[region] = {
            linuxOnDemand:       linuxOD,
            linuxSud:            linuxSud,
            linuxPreemptible:    linuxP,
            linuxCud1yr:         linuxC1,
            linuxCud3yr:         linuxC3,
            windowsOnDemand:     linuxOD !== null ? round(linuxOD + wpShared) : (wpShared > 0 ? round(wpShared) : null),
            windowsSud:          linuxSud !== null ? round(linuxSud + wpShared) : (wpShared > 0 ? round(wpShared) : null),
            windowsPreemptible:  linuxP !== null ? round(linuxP + wpShared) : null,
            windowsCud1yr:       linuxC1 !== null ? round(linuxC1 + wpShared) : (wpShared > 0 ? round(wpShared) : null),
            windowsCud3yr:       linuxC3 !== null ? round(linuxC3 + wpShared) : null,
          }
        }
        continue
      }

      const { series, vCpus, memoryGb } = spec
      const gpuCount = spec.gpuCount ?? 0
      const gpuType = spec.gpuType ?? null

      // CPU and RAM on-demand rates are required — skip region if missing
      const linuxCpuOD = getRate(rates, series, 'cpu', region, 'OnDemand', 'linux')
      const linuxRamOD = getRate(rates, series, 'ram', region, 'OnDemand', 'linux')
      if (linuxCpuOD === null || linuxRamOD === null) continue

      // GPU on-demand rate is required for GPU instances — skip region if missing
      const gpuOnDemandRate = gpuCount > 0 && gpuType
        ? getGpuRate(gpuRates, gpuType, region, 'OnDemand')
        : 0
      if (gpuCount > 0 && gpuOnDemandRate === null) continue

      // Returns the GPU add-on cost for a given usage tier.
      // Falls back to null (not 0) if a GPU CUD rate doesn't exist — showing null pricing
      // is more accurate than showing on-demand GPU cost inside a CUD price.
      const gpuAddon = (usageType: ResourceRate['usageType']): number | null => {
        if (gpuCount === 0 || gpuType === null) return 0
        const rate = getGpuRate(gpuRates, gpuType, region, usageType)
        return rate !== null ? gpuCount * rate : null
      }

      // Base compute price (CPU + RAM), before GPU add-on.
      // SUD is computed on the base price only (GPU cost does not get SUD).
      const baseLinuxOD = vCpus * linuxCpuOD + memoryGb * linuxRamOD
      const linuxOD = round(baseLinuxOD + gpuCount * (gpuOnDemandRate as number))
      const linuxSud = round(getSudRate(series, baseLinuxOD) + gpuCount * (gpuOnDemandRate as number))

      const gpuPreemptible = gpuAddon('Preemptible')
      const linuxPreemptible = (() => {
        const base = calcRate(
          getRate(rates, series, 'cpu', region, 'Preemptible', 'linux'),
          getRate(rates, series, 'ram', region, 'Preemptible', 'linux'),
          vCpus, memoryGb,
        )
        if (base === null || gpuPreemptible === null) return null
        return round(base + gpuPreemptible)
      })()

      const gpuCud1yr = gpuAddon('Cud1yr')
      const linuxCud1yr = (() => {
        const base = calcRate(
          getRate(rates, series, 'cpu', region, 'Cud1yr', 'linux'),
          getRate(rates, series, 'ram', region, 'Cud1yr', 'linux'),
          vCpus, memoryGb,
        )
        if (base === null || gpuCud1yr === null) return null
        return round(base + gpuCud1yr)
      })()

      const gpuCud3yr = gpuAddon('Cud3yr')
      const linuxCud3yr = (() => {
        const base = calcRate(
          getRate(rates, series, 'cpu', region, 'Cud3yr', 'linux'),
          getRate(rates, series, 'ram', region, 'Cud3yr', 'linux'),
          vCpus, memoryGb,
        )
        if (base === null || gpuCud3yr === null) return null
        return round(base + gpuCud3yr)
      })()

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
      gpuCount: spec.gpuCount ?? null,
      gpuType: spec.gpuType ?? null,
      soleTenantSupport: spec.soleTenantSupport ?? seriesDefaults.soleTenantSupport ?? false,
      nestedVirtualizationSupport: spec.nestedVirtualization ?? seriesDefaults.nestedVirtualization ?? false,
      coremarkScore: spec.coremarkScore ?? COREMARK_SCORES[spec.name] ?? null,
      pricing,
    })
  }

  return instances
}

// ----- Main -----

async function main() {
  console.log('Fetching GCP Compute Engine SKUs...')
  const skus = await fetchAllSkus(BASE_URL, API_KEY)
  console.log(`Total SKUs fetched: ${skus.length}`)

  console.log('Parsing SKUs...')
  const { rates, gpuRates, windowsLicenses, conflicts, specialModeOnly } = parseSkus(skus)
  console.log(`Parsed ${rates.size} resource rates, ${gpuRates.size} GPU rates`)
  console.log(`Windows licenses: ${windowsLicenses.length}`)
  // Not failures: places where the catalogue itself is ambiguous, shown so a human can look.
  if (specialModeOnly.length) {
    console.warn(`::warning::${specialModeOnly.length} rates come from a calendar-mode/DWS/reserved SKU because Google lists no ordinary on-demand SKU for them`)
  }
  if (conflicts.length) {
    console.warn(`::warning::${conflicts.length} rate keys have two ordinary SKUs at different prices (the lower is used):`)
    for (const c of conflicts) console.warn(`  ${c.key}: ` + c.candidates.map((x) => `${x.price} "${x.description}"`).join(' | '))
  }

  console.log('Building pricing table...')
  const instances = buildPricingTable(rates, gpuRates, windowsLicenses)
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

// Only when run as a script: importing this module (tests, the validator) must not start a fetch.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
