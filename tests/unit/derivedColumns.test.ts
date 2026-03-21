import { describe, it, expect } from 'vitest'
import { DERIVED_COLUMNS, CLOUDSQL_DERIVED_COLUMNS } from '@/lib/types'

// Helpers matching the logic in PricingTable.tsx
function computeDerived(
  price: number | null | undefined,
  vCpus: number | 'shared',
  memoryGb: number,
  metric: 'perVcpu' | 'perGb',
): number | undefined {
  if (vCpus === 'shared') return undefined
  if (price == null) return undefined
  const divisor = metric === 'perVcpu' ? vCpus : memoryGb
  return divisor > 0 ? price / divisor : undefined
}

describe('DERIVED_COLUMNS', () => {
  it('generates perVcpu and perGb columns for each pricing column', () => {
    const ids = DERIVED_COLUMNS.map((c) => c.id)
    // linuxSud should produce linuxSud_perVcpu and linuxSud_perGb
    expect(ids).toContain('linuxSud_perVcpu')
    expect(ids).toContain('linuxSud_perGb')
    expect(ids).toContain('linuxCud1yr_perVcpu')
    expect(ids).toContain('windowsSud_perGb')
  })

  it('all derived columns are hidden by default', () => {
    for (const col of DERIVED_COLUMNS) {
      expect(col.defaultVisible).toBe(false)
    }
  })

  it('all derived columns have group "derived"', () => {
    for (const col of DERIVED_COLUMNS) {
      expect(col.group).toBe('derived')
    }
  })
})

describe('CLOUDSQL_DERIVED_COLUMNS', () => {
  it('generates perVcpu and perGb for cloudsql pricing columns', () => {
    const ids = CLOUDSQL_DERIVED_COLUMNS.map((c) => c.id)
    expect(ids).toContain('mysqlZonal_perVcpu')
    expect(ids).toContain('mysqlZonal_perGb')
    expect(ids).toContain('postgresZonal_perVcpu')
  })

  it('all cloudsql derived columns are hidden by default', () => {
    for (const col of CLOUDSQL_DERIVED_COLUMNS) {
      expect(col.defaultVisible).toBe(false)
    }
  })
})

describe('derived column computation logic', () => {
  it('computes $/vCPU correctly', () => {
    const result = computeDerived(0.08, 4, 16, 'perVcpu')
    expect(result).toBeCloseTo(0.02)
  })

  it('computes $/GB correctly', () => {
    const result = computeDerived(0.08, 4, 16, 'perGb')
    expect(result).toBeCloseTo(0.005)
  })

  it('returns undefined for shared vCPUs', () => {
    expect(computeDerived(0.08, 'shared', 0.6, 'perVcpu')).toBeUndefined()
  })

  it('returns undefined for null price', () => {
    expect(computeDerived(null, 4, 16, 'perVcpu')).toBeUndefined()
  })

  it('returns undefined for undefined price', () => {
    expect(computeDerived(undefined, 4, 16, 'perGb')).toBeUndefined()
  })

  it('returns undefined when divisor is 0', () => {
    expect(computeDerived(0.08, 0, 0, 'perVcpu')).toBeUndefined()
  })
})
