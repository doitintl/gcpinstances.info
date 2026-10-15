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
  /** Calendar-mode / DWS / flex-start SKU: used only when no ordinary SKU exists (see preferCandidate). */
  special?: boolean
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
  // Google lists the Mega GPU as 'Mega' in some SKUs and 'Plus' in others (the machine is A3Plus too).
  [/H100.*\b(?:Mega|Plus)\b|\b(?:Mega|Plus)\b.*H100/i, 'H100_MEGA_80GB'],
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

/**
 * SKUs for how a machine is bought or scheduled, not for what it costs to run on demand:
 * calendar-mode and DWS (Dynamic Workload Scheduler) reservations, defined-duration and
 * flex-start capacity. Google tags several of them usageType "OnDemand" and describes them
 * like the ordinary SKU with a prefix or suffix, so without this they compete with the real
 * on-demand price for the same key. For the H100 Mega GPU in us-central1 the catalogue held
 * only two such SKUs next to the real one, which is how a3-megagpu-8g came out at about half
 * its real price, and at a different price on days Google listed them in another order.
 */
/**
 * Usage types that are prices this site publishes. Anything else is skipped, not defaulted to
 * on-demand, which is what used to happen: a generic 'Commit' SKU (a 5-year term, e.g.
 * "Commitment v1: N4A Core in Johannesburg for 5 Years") and the 'CmtCudPremium' surcharges
 * were filed under on-demand, and whichever came first in the catalogue won.
 */
export const PUBLISHED_USAGE_TYPES = new Set(['OnDemand', 'Preemptible', 'Commit1Yr', 'Commit3Yr'])

/**
 * Surcharges that sit on top of a base rate, not rates of their own: "Memory Optimized Upgrade
 * Premium for …", "Sole Tenancy Premium for …", "Committed Use Discount Premium for …". The
 * M1 upgrade premium is cheaper than the base SKU and shares its series, resource and region,
 * so it used to compete with it. The base alone prices m1-ultramem-40 at $6.29/hr in
 * us-central1 against Google's published ~$6.30; adding the premium would give $7.11.
 */
export const ADD_ON_SKU_RE = /\bpremium for\b/i

export const SPECIAL_MODE_RE = /calendar mode|\bDWS\b|defined duration|flex[- ]?start|^reserved\b/i
export function isSpecialModeSku(description: string): boolean {
  return SPECIAL_MODE_RE.test(description)
}

/**
 * Which of two SKUs for the same key to keep: independent of the order Google returns them in.
 * An ordinary SKU always beats a special-mode one; between equals the lower price wins (what the
 * old comment here promised: "keep the first (lowest) rate", which kept the first, not the
 * lowest). A different order can no longer change a price.
 */
export function preferCandidate(
  existing: { price: number; special: boolean } | undefined,
  candidate: { price: number; special: boolean },
): boolean {
  if (!existing) return true
  if (existing.special !== candidate.special) return existing.special
  return candidate.price < existing.price
}

// GPU rates keyed as `${gpuType}:${region}:${usageType}` → price per GPU-hour
export type GpuRateKey = string

export interface GpuRate {
  gpuType: string
  region: string
  usageType: ResourceRate['usageType']
  pricePerGpu: number
  special?: boolean
}

/** A key two ordinary SKUs both claim, at different prices: the parser still picks one, deterministically, but a person should look. */
/** Keys whose only SKU is a calendar-mode / DWS / reserved one: Google lists no ordinary on-demand price, so that one is shown. */
export type SpecialModeOnlyKey = string

export interface SkuConflict { key: string; candidates: { price: number; description: string }[] }

export function parseSkus(skus: RawSku[]): {
  rates: Map<PriceKey, ResourceRate>
  gpuRates: Map<GpuRateKey, GpuRate>
  windowsLicenses: WindowsLicense[]
  conflicts: SkuConflict[]
  specialModeOnly: SpecialModeOnlyKey[]
} {
  const rates = new Map<PriceKey, ResourceRate>()
  const gpuRates = new Map<GpuRateKey, GpuRate>()
  const windowsLicenses: WindowsLicense[] = []
  const candidatesByKey = new Map<string, { price: number; description: string }[]>()
  const noteCandidate = (key: string, price: number, description: string, special: boolean) => {
    if (special) return
    const list = candidatesByKey.get(key) ?? []
    if (!list.some((c) => c.price === price)) list.push({ price, description })
    candidatesByKey.set(key, list)
  }

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
    if (!PUBLISHED_USAGE_TYPES.has(usageType) || ADD_ON_SKU_RE.test(description)) continue
    const special = isSpecialModeSku(description)

    // --- GPU SKUs (resourceGroup 'GPU') ---
    // Price is per GPU-hour; keyed by gpu type + region + usage type
    if (rg === 'GPU') {
      const gpuType = matchGpuType(description)
      if (!gpuType) continue

      const regions = serviceRegions.filter(isSpecificRegion)
      if (!regions.length) continue

      let parsedUsageType: ResourceRate['usageType']
      // Some spot SKUs carry usageType OnDemand and say so only in the description (the A4 B200
      // 'Spot Preemptible' slice), which put a spot price next to the on-demand one.
      if (usageType === 'Preemptible' || /\bspot\b|\bpreemptible\b/i.test(description)) parsedUsageType = 'Preemptible'
      else if (usageType === 'Commit1Yr') parsedUsageType = 'Cud1yr'
      else if (usageType === 'Commit3Yr') parsedUsageType = 'Cud3yr'
      else parsedUsageType = 'OnDemand'

      for (const region of regions) {
        const key: GpuRateKey = `${gpuType}:${region}:${parsedUsageType}`
        noteCandidate('gpu:' + key, price, description, special)
        const prev = gpuRates.get(key)
        if (preferCandidate(prev && { price: prev.pricePerGpu, special: !!prev.special }, { price, special })) {
          gpuRates.set(key, { gpuType, region, usageType: parsedUsageType, pricePerGpu: price, special })
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
      noteCandidate(key, price, description, special)
      const prev = rates.get(key)
      if (preferCandidate(prev && { price: prev.pricePerUnit, special: !!prev.special }, { price, special })) {
        rates.set(key, { series, resource, region, usageType: parsedUsageType, os, pricePerUnit: price, special })
      }
    }
  }

  const conflicts: SkuConflict[] = []
  for (const [key, candidates] of candidatesByKey) if (candidates.length > 1) conflicts.push({ key, candidates })
  const specialModeOnly: SpecialModeOnlyKey[] = [
    ...[...rates].filter(([, r]) => r.special).map(([k]) => k),
    ...[...gpuRates].filter(([, r]) => r.special).map(([k]) => 'gpu:' + k),
  ].sort()
  return { rates, gpuRates, windowsLicenses, conflicts, specialModeOnly }
}
