#!/usr/bin/env node
/**
 * Fill in Linux pricing for the shared-core E2 machine types (e2-micro,
 * e2-small, e2-medium) in public/data/pricing.json, deriving per-region
 * E2 vCPU and RAM rates from the existing e2-standard-2 (2c / 8 GB) and
 * e2-highcpu-2 (2c / 2 GB) pricing.
 *
 * Runs without a GCP API key and is idempotent: it simply overwrites the
 * shared-core E2 pricing entries with the freshly computed values.
 *
 * Usage: node scripts/fill-shared-e2-pricing.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRICING_PATH = join(__dirname, '..', 'public', 'data', 'pricing.json')

const SHARED = [
  { name: 'e2-micro',  billedVcpus: 0.25, memGb: 1, reportedVcpus: 2 },
  { name: 'e2-small',  billedVcpus: 0.5,  memGb: 2, reportedVcpus: 2 },
  { name: 'e2-medium', billedVcpus: 1,    memGb: 4, reportedVcpus: 2 },
]

const round = (v) => Math.round(v * 1e6) / 1e6

const data = JSON.parse(readFileSync(PRICING_PATH, 'utf8'))
const byName = new Map(data.instances.map((i) => [i.name, i]))

const std2 = byName.get('e2-standard-2')
const hc2  = byName.get('e2-highcpu-2')
if (!std2 || !hc2) {
  console.error('Missing e2-standard-2 or e2-highcpu-2 in pricing.json — cannot derive rates.')
  process.exit(1)
}

// Tiers we derive. For each one, we solve {2c + 8r = std2, 2c + 2r = hc2}
// across the region, per pricing field.
const TIERS = [
  'linuxOnDemand',
  'linuxSud',
  'linuxPreemptible',
  'linuxCud1yr',
  'linuxCud3yr',
]

// Windows license premium is price_std2_windows - price_std2_linux (per-instance add-on for 1-4 vCPU tier).
const regions = Object.keys(std2.pricing)

let updatedRegions = 0

for (const shared of SHARED) {
  const inst = byName.get(shared.name)
  if (!inst) {
    console.warn(`Machine ${shared.name} not found, skipping.`)
    continue
  }

  for (const region of regions) {
    const s = std2.pricing[region]
    const h = hc2.pricing[region]
    if (!s || !h) continue

    const rates = {}
    for (const tier of TIERS) {
      const sv = s[tier]
      const hv = h[tier]
      if (typeof sv !== 'number' || typeof hv !== 'number') {
        rates[tier] = null
        continue
      }
      // 2c + 8r = sv, 2c + 2r = hv  ⇒  r = (sv - hv) / 6, c = (hv - 2r) / 2
      const r = (sv - hv) / 6
      const c = (hv - 2 * r) / 2
      rates[tier] = round(shared.billedVcpus * c + shared.memGb * r)
    }

    // Windows license premium for a shared-core instance is the tier-1 (1-4 vCPU)
    // premium, which is the same flat add-on we see on e2-standard-2: windows - linux.
    const wLicense = typeof s.windowsOnDemand === 'number' && typeof s.linuxOnDemand === 'number'
      ? s.windowsOnDemand - s.linuxOnDemand
      : 0

    const withLicense = (linux) =>
      typeof linux === 'number' ? round(linux + wLicense) : null

    inst.pricing[region] = {
      linuxOnDemand:      rates.linuxOnDemand,
      linuxSud:           rates.linuxSud,
      linuxPreemptible:   rates.linuxPreemptible,
      linuxCud1yr:        rates.linuxCud1yr,
      linuxCud3yr:        rates.linuxCud3yr,
      windowsOnDemand:    withLicense(rates.linuxOnDemand),
      windowsSud:         withLicense(rates.linuxSud),
      windowsPreemptible: withLicense(rates.linuxPreemptible),
      windowsCud1yr:      withLicense(rates.linuxCud1yr),
      windowsCud3yr:      withLicense(rates.linuxCud3yr),
    }
    updatedRegions++
  }
}

writeFileSync(PRICING_PATH, JSON.stringify(data, null, 2))
console.log(`Updated shared-core E2 pricing for ${updatedRegions} (instance,region) entries.`)
