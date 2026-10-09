/**
 * SKU parsing, shared by the fetch (scripts/fetch-pricing.ts), the live validator
 * (scripts/validate-pricing.ts) and the unit tests.
 *
 * It lives in one place because it used to live in two: the validator carried a
 * hand-copied "mirror" of the fetch parser, the two drifted (the validator never
 * learned the A3Plus spelling), and a check that was meant to catch a wrong price
 * could disagree with the fetch for reasons that had nothing to do with prices.
 * Importing this module has no side effects, so tests can run the real parser.
 */
import { type RawSku, extractPrice, isSpecificRegion } from './billing-api.js'
// Keyed as `${series}:${resource}:${region}:${usageType}:${os}`
export type PriceKey = string

export interface ResourceRate {
  series: string
  resource: 'cpu' | 'ram'
  region: string
  usageType: 'OnDemand' | 'Cud1yr' | 'Cud3yr' | 'Preemptible'
  os: 'linux' | 'windows'
  pricePerUnit: number  // USD per vCPU-hour or per GiB-hour
}


export interface WindowsLicense {
  region: string  // empty string = global
  tier1Price: number  // flat rate for 1-4 vCPU instances (per hour total)
  tier2Price: number  // per-vCPU rate for 5+ vCPU instances
}


// Hoisted regex constants for the hot SKU parsing loop
export const CPU_RE = /\bcore\b|\bcpu\b/i
export const RAM_RE = /\bram\b|\bmemory\b/i
export const SKIP_KEYWORDS_RE = /custom|sole.?tenancy|extended|sole tenancy premium/i

// Series detection patterns — more specific prefixes must come before broader ones.
// C3D is handled separately before this list (see parseSkus) to avoid C3 matching first.
// Longest-prefix first: the loop takes the first match, so C4D must be tried
// before C4 and N4D before N4 or the shorter pattern swallows them. Every series
// the Cloud Billing catalogue publishes Core/Ram SKUs for needs an entry here —
// an unmatched description is silently dropped, which is how C4D was absent from
// the site for months while Google had been selling it. scripts/check-drift.ts
// fails the build when the catalogue grows a series this list does not know.
export const SERIES_PATTERNS: [RegExp, string][] = [
  [/^A3Ultra\s+/i,           'A3Ultra'],
  // Google prices the Mega shape under both names; both feed A3Mega's rates so
  // a region that has switched spelling still resolves.
  [/^A3Plus\s+/i,            'A3Mega'],
  [/^A3Mega\s+/i,            'A3Mega'],
  [/^A3\s+/i,               'A3'],
  [/^A4X\s+/i,              'A4X'],
  [/^A4\s+/i,               'A4'],
  [/^A2\s+/i,               'A2'],
  [/^G4\s+/i,              'G4'],
  [/^G2\s+/i,               'G2'],
  [/^C4A\s+/i,              'C4A'],
  [/^C4D\s+/i,              'C4D'],
  [/^C4N\s+/i,              'C4N'],
  [/^C4\s+/i,               'C4'],
  [/^C3D\s+/i,              'C3D'],
  [/^C3\s+/i,               'C3'],
  [/^C2D\s+/i,              'C2D'],
  [/^C2\s+/i,               'C2'],
  [/^Compute[ -]optimized/i, 'C2'],
  [/^H4D\s+/i,              'H4D'],
  [/^H3\s+/i,               'H3'],
  [/^N4A\s+/i,              'N4A'],
  [/^N4D\s+/i,              'N4D'],
  [/^N4\s+/i,               'N4'],
  [/^N2D\s+/i,              'N2D'],
  [/^N2\s+/i,               'N2'],
  [/^N1\s+/i,               'N1'],
  [/^E2\s+/i,               'E2'],
  [/^T2D\s+/i,              'T2D'],
  [/^T2A\s+/i,              'T2A'],
  [/^M4N\s+/i,              'M4N'],
  [/^M4\s+/i,               'M4'],
  [/^M3\s+/i,               'M3'],
  [/^M2\s+/i,               'M2'],
  [/^M1\s+/i,               'M1'],
  // The shape is part of the SKU name, not a separate field:
  // "Z4D-HIGHMEM-HIGHLSSD Instance Ram running in Iowa".
  [/^Z4D-HIGHMEM-HIGHLSSD\s+/i,     'Z4DHighLssd'],
  [/^Z4D-HIGHMEM-STANDARDLSSD\s+/i, 'Z4DStandardLssd'],
  [/^Z3\s+/i,               'Z3'],
  [/^X4\s+/i,               'X4'],
  [/^Memory[ -]optimized/i,  'M1'],
]

// Maps GPU SKU description patterns to canonical GpuType keys (from machine-types.ts).
// More specific patterns must come before broader ones (e.g. A100 80GB before A100, H100 Mega before H100).
export const GPU_TYPE_PATTERNS: [RegExp, string][] = [
  [/H200/i,               'H200_141GB'],
  [/A100 80GB/i,          'A100_80GB'],
  [/A100 40GB/i,          'A100_40GB'],
  [/A100/i,               'A100_40GB'],  // fallback for unqualified A100 (most are 40GB)
  [/H100.*Mega|Mega.*H100/i, 'H100_MEGA_80GB'],
  [/H100/i,               'H100_80GB'],
  [/\bL4\b/i,             'L4'],
  [/B200/i,               'B200'],
]

export function matchGpuType(description: string): string | null {
  for (const [pattern, gpuType] of GPU_TYPE_PATTERNS) {
    if (pattern.test(description)) return gpuType
  }
  return null
}

// GPU rates keyed as `${gpuType}:${region}:${usageType}` → price per GPU-hour
export type GpuRateKey = string

export interface GpuRate {
  gpuType: string
  region: string
  usageType: ResourceRate['usageType']
  pricePerGpu: number
}

export function parseSkus(skus: RawSku[]): {
  rates: Map<PriceKey, ResourceRate>
  gpuRates: Map<GpuRateKey, GpuRate>
  windowsLicenses: WindowsLicense[]
} {
  const rates = new Map<PriceKey, ResourceRate>()
  const gpuRates = new Map<GpuRateKey, GpuRate>()
  const windowsLicenses: WindowsLicense[] = []

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

    // --- GPU SKUs (resourceGroup 'GPU') ---
    // Price is per GPU-hour; keyed by gpu type + region + usage type
    if (rg === 'GPU') {
      const gpuType = matchGpuType(description)
      if (!gpuType) continue

      const regions = serviceRegions.filter(isSpecificRegion)
      if (!regions.length) continue

      let parsedUsageType: ResourceRate['usageType']
      if (usageType === 'Preemptible') parsedUsageType = 'Preemptible'
      else if (usageType === 'Commit1Yr') parsedUsageType = 'Cud1yr'
      else if (usageType === 'Commit3Yr') parsedUsageType = 'Cud3yr'
      else parsedUsageType = 'OnDemand'

      for (const region of regions) {
        const key: GpuRateKey = `${gpuType}:${region}:${parsedUsageType}`
        if (!gpuRates.has(key)) {
          gpuRates.set(key, { gpuType, region, usageType: parsedUsageType, pricePerGpu: price })
        }
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

  return { rates, gpuRates, windowsLicenses }
}
