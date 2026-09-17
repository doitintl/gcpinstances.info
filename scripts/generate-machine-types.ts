/**
 * Emit MACHINE_TYPES entries for a machine family, straight from the Compute
 * Engine API.
 *
 * The specs in machine-types.ts were hand-written, which is why fourteen
 * families Google had already launched were absent: adding one meant typing out
 * every shape by hand, so nobody did. vCPU and memory are facts the API already
 * knows — asking it removes both the tedium and the transcription errors.
 *
 * Usage:
 *   npx tsx scripts/generate-machine-types.ts c4d c4a n4d
 *   npx tsx scripts/generate-machine-types.ts --all-missing
 *
 * Prints TypeScript to stdout. It deliberately does not edit machine-types.ts:
 * the qualitative fields (family, cpuType, localSsd) are judgement, and pasting
 * is where that judgement gets applied.
 */

import { execFileSync } from 'node:child_process'
import { MACHINE_TYPE_MAP } from './machine-types.js'

interface ApiMachineType {
  name: string
  guestCpus: number
  memoryMb: number
  accelerators?: { guestAcceleratorType: string; guestAcceleratorCount: number }[]
}

// Google's own taxonomy, which is what the table's "family" column shows.
const FAMILY_OF: Record<string, string> = {
  c4a: 'Compute optimized', c4d: 'Compute optimized', c4n: 'Compute optimized',
  n4a: 'General purpose',   n4d: 'General purpose',
  m2:  'Memory optimized',  m4:  'Memory optimized',  m4n: 'Memory optimized',
  x4:  'Memory optimized',
  z3:  'Storage optimized', z4d: 'Storage optimized',
  g4:  'Accelerator optimized', a4: 'Accelerator optimized', a4x: 'Accelerator optimized',
  h4d: 'High performance computing',
}

function fetchFamily(family: string): ApiMachineType[] {
  const out = execFileSync('gcloud', [
    'compute', 'machine-types', 'list',
    `--filter=name~^${family}-`,
    '--format=json(name,guestCpus,memoryMb,accelerators)',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })

  // The same machine type is listed once per zone; collapse to distinct names.
  const seen = new Map<string, ApiMachineType>()
  for (const m of JSON.parse(out) as ApiMachineType[]) seen.set(m.name, m)
  return [...seen.values()].sort(byShapeThenSize)
}

/** standard before highcpu before highmem, then ascending vCPU — so a generated
 *  block reads like the hand-written ones it sits beside. */
function byShapeThenSize(a: ApiMachineType, b: ApiMachineType): number {
  const order = ['standard', 'highcpu', 'highmem', 'ultramem', 'megamem', 'metal']
  const shape = (n: string) => {
    const i = order.findIndex((s) => n.includes(`-${s}`))
    return i < 0 ? order.length : i
  }
  return shape(a.name) - shape(b.name) || a.guestCpus - b.guestCpus || a.name.localeCompare(b.name)
}

function emit(family: string): string {
  const types = fetchFamily(family)
  if (!types.length) return `  // ${family}: no machine types returned by the API\n`

  const series = family.toUpperCase()
  const fam = FAMILY_OF[family] ?? 'General purpose'
  const pad = Math.max(...types.map((t) => t.name.length)) + 2

  const lines = types.map((t) => {
    const gpu = t.accelerators?.[0]
    const memGb = t.memoryMb / 1024
    // Whole numbers stay whole; the API reports a few shapes in fractional GiB.
    const mem = Number.isInteger(memGb) ? String(memGb) : memGb.toFixed(2).replace(/0+$/, '')
    const bits = [
      `name: '${t.name}',`.padEnd(pad + 8),
      `series: '${series}',`,
      `family: '${fam}',`,
      `vCpus: ${String(t.guestCpus).padStart(3)},`,
      `memoryGb: ${mem}`,
    ]
    if (gpu) bits.push(`, gpuCount: ${gpu.guestAcceleratorCount}`)
    return `  { ${bits.join(' ')} },`
  })

  const already = types.filter((t) => MACHINE_TYPE_MAP.has(t.name)).length
  const header = `  // --- ${series} (${fam}) — ${types.length} types from the Compute Engine API` +
    (already ? `, ${already} already defined` : '') + ' ---'
  return [header, ...lines].join('\n') + '\n'
}

const args = process.argv.slice(2)
const families = args.includes('--all-missing')
  ? Object.keys(FAMILY_OF).filter((f) =>
      ![...MACHINE_TYPE_MAP.keys()].some((n) => n.startsWith(`${f}-`)))
  : args

if (!families.length) {
  console.error('Usage: generate-machine-types.ts <family>... | --all-missing')
  process.exit(1)
}
for (const f of families) process.stdout.write(emit(f))
