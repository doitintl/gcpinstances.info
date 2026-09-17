/**
 * Fail when Google's catalogue has outgrown what this pipeline can parse.
 *
 * Issue #266 was C4D missing from every region while Google had been selling it
 * for months. Nothing was broken and nothing was stale — the daily refresh ran
 * and succeeded every morning. It simply re-derived the same eighteen families
 * each time, because a SKU has to clear two hand-maintained gates to appear:
 *
 *   1. SERIES_PATTERNS in fetch-pricing.ts — an unmatched description is dropped
 *   2. MACHINE_TYPES in machine-types.ts   — no spec means nothing to price
 *
 * Neither gate announces itself when it is out of date, so the failure mode is a
 * green pipeline producing confidently incomplete data. This turns that silence
 * into a build failure.
 *
 * Usage:
 *   GOOGLE_CLOUD_API_KEY=<key> npx tsx scripts/check-drift.ts
 *   npx tsx scripts/check-drift.ts --warn-only     # report, exit 0
 *
 * Checks, in order of how much they matter:
 *
 *   A  series with Core/Ram SKUs in the catalogue and no SERIES_PATTERNS entry
 *      — the pipeline cannot even see these
 *   B  series with a pattern but no machine specs
 *      — parsed and then discarded, which is how M2 sat half-wired
 *   C  machine types in the generated data whose specs we hold but the
 *      catalogue no longer prices, i.e. quietly retired shapes
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { fetchAllSkus } from './billing-api.js'
import { SERIES_SPECS, MACHINE_TYPES } from './machine-types.js'

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY
const WARN_ONLY = process.argv.includes('--warn-only')
const COMPUTE_SERVICE = 'services/6F81-5844-456A'

// Accelerator and TPU SKUs are priced per-device, not per-vCPU, and TPU shapes
// are not VMs the table lists. Excluded deliberately rather than by accident.
const IGNORED_SERIES = new Set(['TPU', 'CT3', 'CT3P', 'CT5L', 'CT5LP', 'CT5P', 'CT6E', 'TPU7X'])

// Series with no vCPU/RAM SKUs because Google prices them another way, so their
// absence from the catalogue scan is expected rather than drift:
//   M1, C2, M2  priced through the generic "Memory optimized" /
//           "Compute optimized" descriptions, which the parser maps via its own
//           catch-all patterns rather than a series-prefixed one
//   A4, A4X priced per GPU slice ("A4 Nvidia B200 (1 gpu slice)")
//   X4      not present in the public catalogue at all
const PRICED_ELSEWHERE = new Set(['M1', 'C2', 'M2', 'A4', 'A4X', 'X4'])

async function fetchDescriptions(): Promise<string[]> {
  // The shared fetcher, so this checker authenticates exactly the way the
  // pipeline it guards does — including the gcloud fallback.
  const skus = await fetchAllSkus(`https://cloudbilling.googleapis.com/v1/${COMPUTE_SERVICE}/skus`, API_KEY)
  return skus.map((s) => s.description).filter(Boolean)
}

/** Series names the catalogue prices vCPU or RAM for.
 *
 *  Read off the description's own leading token rather than by trying the
 *  parser's patterns, so a series nobody has taught the parser about still
 *  shows up here — which is the entire point of the check.
 *
 *  The shapes this has to survive, all real:
 *    C2D AMD Instance Ram                         vendor token after the series
 *    M3 Memory-optimized Instance Ram             descriptor after the series
 *    Z4D-HIGHMEM-STANDARDLSSD Instance Ram        shape appended to the series
 *    C4A Arm Instance Ram                         architecture token
 *    Commitment v1: T2D AMD Ram in Turin          commitment prefix
 *    Sole Tenancy Premium for N2D AMD ... Core    premium prefix
 *
 *  Descriptions with no series token at all — "Custom Instance Core",
 *  "Compute optimized Ram" — are left unattributed on purpose: they are the
 *  generic SKUs the parser maps through its own catch-all patterns, and
 *  guessing a series for them would invent drift that is not there.
 */
const PREFIXES = new RegExp(
  '^(?:' +
  'Commitment v\\d+:\\s*|' +
  'Spot Preemptible\\s+|Preemptible\\s+|' +
  'Sole Tenancy Premium for\\s+|' +
  'Sole Tenancy Overcommit Premium for\\s+|' +
  'Committed Use Discount Premium for\\s+|' +
  'DWS Defined Duration\\s+|' +
  'Reserved\\s+|' +
  'Custom Extended\\s+' +
  ')+', 'i')

const SERIES_IN_DESC = new RegExp(
  '^([A-Z]\\d+[A-Za-z]*)(?:-[A-Z0-9-]+)?\\s+' +
  '(?:AMD\\s+|Arm\\s+|Intel\\s+|Memory-optimized\\s+|Compute-optimized\\s+|' +
  'Custom\\s+|Predefined\\s+|Sole Tenancy\\s+|Instance\\s+|Extended\\s+)*' +
  '(?:Core|Cpu|Ram)\\b', 'i')

function seriesInCatalogue(descriptions: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const d of descriptions) {
    if (!/\b(Core|Ram)\b/i.test(d)) continue
    const m = SERIES_IN_DESC.exec(d.replace(PREFIXES, ''))
    if (!m) continue
    const series = m[1].toUpperCase()
    if (IGNORED_SERIES.has(series)) continue
    counts.set(series, (counts.get(series) ?? 0) + 1)
  }
  return counts
}

/** The description prefixes the parser can match, and the series each maps to.
 *
 *  Keyed on what the regex *matches* rather than on the label it assigns,
 *  because the two differ: A3Plus and A3Mega are the same machine under two
 *  catalogue spellings, and both patterns deliberately resolve to A3Mega's
 *  rates. Comparing catalogue series against labels alone would report that
 *  alias as missing for ever.
 */
function parserPrefixes(): Map<string, Set<string>> {
  const src = readFileSync(fileURLToPath(new URL('./fetch-pricing.ts', import.meta.url)), 'utf8')
  const start = src.indexOf('const SERIES_PATTERNS')
  const block = src.slice(start, src.indexOf('\n]', start))
  const out = new Map<string, Set<string>>()
  for (const m of block.matchAll(/\[\/\^([A-Za-z0-9-]+)\\s\+\/i,\s*'([A-Za-z0-9]+)'\]/g)) {
    // Compared on the base token, the same reduction seriesInCatalogue makes:
    // the catalogue calls it Z4D, the pattern matches Z4D-HIGHMEM-HIGHLSSD, and
    // those are the same series at different granularity.
    const base = baseSeries(m[1])
    if (!out.has(base)) out.set(base, new Set())
    out.get(base)!.add(m[2].toUpperCase())
  }
  return out
}

/** The series token without a shape suffix: Z4D-HIGHMEM-HIGHLSSD -> Z4D. */
function baseSeries(token: string): string {
  return token.toUpperCase().split('-')[0]
}

// ── the other three datasets ────────────────────────────────────────────────
//
// Compute gets the detailed treatment above because its parser is the one this
// file can read. For Cloud SQL, AlloyDB and Memorystore the useful question is
// the end-to-end one: Google prices a machine series, do we ship anything for
// it? That catches the same failure — Cloud SQL had 828 C4 SKUs and shipped
// none — without needing to model three more bespoke parseSeries ladders.
interface Dataset {
  name: string
  service: string
  file: string
  /** Series Google prices that we deliberately do not ship, and why. */
  skip: Record<string, string>
}

// Memorystore for Memcached (9C2E-5AAC-D058) is deliberately absent: Google
// deprecated it in January 2026, blocks new projects from February 2027 and
// shuts it down in January 2029, steering users to Valkey — which is covered.
// Its 184 SKUs price custom per-core and per-GiB rather than fixed nodes, so
// adding it would mean a second pricing model for a product being switched off.
// https://docs.cloud.google.com/memorystore/docs/memcached/deprecation/memcached
const DATASETS: Dataset[] = [
  { name: 'Cloud SQL', service: '9662-B51E-5089', file: 'cloudsql-pricing.json', skip: {} },
  { name: 'AlloyDB', service: 'C49F-B7F2-7416', file: 'alloydb-pricing.json', skip: {} },
  {
    name: 'Memorystore',
    service: 'A2B5-E0F1-B0F3',
    file: 'memorystore-pricing.json',
    skip: {},
  },
]

// Machine series tokens worth looking for. Matched anywhere in a description,
// because the three services phrase them differently: Cloud SQL writes
// "Enterprise Plus C4 vCPU", AlloyDB "for Z3 Highmem High LSSD instances".
const SERIES_TOKENS = [
  'N1', 'N2D', 'N2', 'N4A', 'N4D', 'N4',
  'C2D', 'C2', 'C3D', 'C3', 'C4A', 'C4D', 'C4N', 'C4',
  'M1', 'M2', 'M3', 'M4', 'E2', 'T2A', 'T2D', 'Z3', 'Z4D',
]

async function checkDataset(d: Dataset): Promise<void> {
  let shipped: Set<string>
  try {
    const data = JSON.parse(
      readFileSync(fileURLToPath(new URL(`../public/data/${d.file}`, import.meta.url)), 'utf8'),
    ) as { instances?: { series?: string; pricing?: Record<string, unknown> }[] }
    // Variant suffixes are stripped so a series split for pricing reasons still
    // answers for its base name: AlloyDB ships Z3StandardLssd and Z3HighLssd,
    // and the catalogue calls both Z3.
    shipped = new Set(
      (data.instances ?? [])
        .filter((i) => Object.keys(i.pricing ?? {}).length > 0)
        .map((i) => (i.series ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''))
        .map((sr) => sr.replace(/(STANDARD|HIGH)?LSSD$/, '')))
  } catch {
    notes.push(`${d.name}: ${d.file} not readable — skipped`)
    return
  }

  const skus = await fetchAllSkus(`https://cloudbilling.googleapis.com/v1/services/${d.service}/skus`, API_KEY)
  const priced = new Map<string, number>()
  for (const s of skus) {
    const desc = s.description ?? ''
    if (!/\b(vCPU|Core|RAM|Cpu)\b/i.test(desc)) continue
    for (const t of SERIES_TOKENS) {
      // First match wins, so the list is ordered longest-first per family and
      // C4A is never counted as C4.
      if (new RegExp(`\\b${t}\\b`, 'i').test(desc)) {
        priced.set(t, (priced.get(t) ?? 0) + 1)
        break
      }
    }
  }

  const missing = [...priced.entries()]
    .filter(([t]) => !shipped.has(t) && !(t in d.skip))
    .sort((a, b) => b[1] - a[1])

  if (missing.length) {
    problems.push(
      `${d.name}: ${missing.length} machine series priced by Google with nothing shipped:\n` +
      missing.map(([t, n]) => `    ${t.padEnd(6)} ${n} SKUs`).join('\n') +
      `\n  Add a branch to parseSeries in scripts/fetch-${d.file.replace('-pricing.json', '')}-pricing.ts` +
      ` and specs to scripts/${d.file.replace('-pricing.json', '')}-machine-types.ts.`)
  } else if (priced.size === 0) {
    // Not a pass: it means no SKU description carried a series token this knows
    // about. Memorystore prices by node capacity rather than machine series, so
    // zero is expected there and the check simply does not apply.
    console.log(`${d.name}: no machine-series SKUs recognised — not checked`)
  } else {
    console.log(`${d.name}: ${priced.size} series priced, all shipped`)
  }
}

const problems: string[] = []
const notes: string[] = []

const descriptions = await fetchDescriptions()
const catalogue = seriesInCatalogue(descriptions)
const prefixes = parserPrefixes()
const specSeries = new Set(MACHINE_TYPES.map((m) => m.series.toUpperCase()))

console.log(`check-drift: ${descriptions.length} SKUs, ${catalogue.size} series with vCPU/RAM pricing\n`)

// A — the catalogue knows a series the parser does not.
const unseen = [...catalogue.entries()]
  .filter(([s]) => !prefixes.has(baseSeries(s)))
  .sort((a, b) => b[1] - a[1])
if (unseen.length) {
  problems.push(
    `${unseen.length} series priced by Google with no SERIES_PATTERNS entry — ` +
    'their SKUs are being dropped:\n' +
    unseen.map(([s, n]) => `    ${s.padEnd(9)} ${n} SKUs`).join('\n') +
    '\n  Add a pattern in scripts/fetch-pricing.ts, longest prefix first.')
}

// B — parsed, then discarded for want of a spec.
// A pattern's label has to correspond to specs, or its SKUs are parsed and
// then thrown away for want of anything to price.
const allLabels = [...new Set([...prefixes.values()].flatMap((set) => [...set]))]
const orphanPatterns = allLabels
  .filter((label) => !specSeries.has(label) &&
    !Object.keys(SERIES_SPECS).some((k) => k.toUpperCase() === label))
if (orphanPatterns.length) {
  problems.push(
    `${orphanPatterns.length} series match a pattern but have no machine specs, ` +
    `so nothing can be priced: ${orphanPatterns.join(', ')}\n` +
    '  Generate them: npx tsx scripts/generate-machine-types.ts ' +
    orphanPatterns.map((s) => s.toLowerCase()).join(' '))
}

// C — the end-to-end check: a series Google prices that produced no priced
// instance. The structural checks above both passed for Z4D while it produced
// nothing, because its SKUs are named "Z4D-HIGHMEM-HIGHLSSD Instance Ram" and
// the pattern expected whitespace after the series. A pattern can exist, and
// specs can exist, and the two can still fail to meet.
const dataPath = fileURLToPath(new URL('../public/data/pricing.json', import.meta.url))
let pricedSeries: Set<string> | null = null
try {
  const data = JSON.parse(readFileSync(dataPath, 'utf8')) as {
    instances: { series?: string; pricing?: Record<string, unknown> }[]
  }
  pricedSeries = new Set(
    data.instances
      .filter((i) => Object.keys(i.pricing ?? {}).length > 0)
      .map((i) => (i.series ?? '').toUpperCase()))
} catch {
  notes.push('public/data/pricing.json not readable — skipped the end-to-end check')
}

if (pricedSeries) {
  const silent = [...catalogue.entries()]
    .filter(([series]) => {
      if (PRICED_ELSEWHERE.has(series)) return false
      const labels = prefixes.get(baseSeries(series)) ?? new Set([series])
      return ![...labels].some((l) => pricedSeries!.has(l))
    })
    .sort((a, b) => b[1] - a[1])
  if (silent.length) {
    problems.push(
      `${silent.length} series are priced by Google and matched by a pattern, yet ` +
      'produced no priced instance — the pattern and the specs are not meeting:\n' +
      silent.map(([s, n]) => `    ${s.padEnd(9)} ${n} SKUs`).join('\n') +
      '\n  Check that the pattern matches the real description text and that\n' +
      '  machine-types.ts uses the same series label the pattern assigns.')
  }
}

// D — specs for shapes Google has stopped pricing. Informational: a retired
// shape lingering in the table is untidy, not wrong, and Google occasionally
// drops a SKU from the catalogue before the machine type disappears.
const labelToBase = new Map<string, string>()
for (const [base, labels] of prefixes) for (const l of labels) labelToBase.set(l, base)
const retired = [...specSeries].filter((s) => {
  const base = labelToBase.get(s) ?? s
  return !catalogue.has(base) && !IGNORED_SERIES.has(base) && !PRICED_ELSEWHERE.has(base)
})
if (retired.length) {
  notes.push(`series with specs but no current vCPU/RAM SKUs: ${retired.sort().join(', ')}`)
}

for (const d of DATASETS) await checkDataset(d)
console.log()

for (const n of notes) console.log(`note: ${n}\n`)

if (!problems.length) {
  console.log('No drift: every series Google prices has a pattern and specs.')
  process.exit(0)
}
for (const p of problems) console.error(`DRIFT: ${p}\n`)
console.error(
  problems.length === 1 ? '1 problem found.' : `${problems.length} problems found.`)
process.exit(WARN_ONLY ? 0 : 1)
