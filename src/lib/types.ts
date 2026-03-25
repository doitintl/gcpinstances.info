export interface RegionPricing {
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

export interface Instance {
  name: string
  series: string
  family: string
  vCpus: number | 'shared'
  memoryGb: number
  // Spec fields
  cpuType: string | null
  localSsd: boolean
  networkPerformance: string | null
  gpuSupport: boolean
  gpuCount: number | null   // number of GPUs attached (null for non-GPU instances)
  gpuType: string | null    // canonical GPU model string (e.g. 'H100_80GB')
  soleTenantSupport: boolean
  nestedVirtualizationSupport: boolean
  coremarkScore: number | null
  pricing: Record<string, RegionPricing>
}

export interface PricingData {
  updatedAt: string
  regions: string[]
  instances: Instance[]
}

export type CostPeriod = 'hourly' | 'monthly' | 'yearly'

export const COST_MULTIPLIERS: Record<CostPeriod, number> = {
  hourly: 1,
  monthly: 730,
  yearly: 8760,
}

export const CURRENCY_META: Record<string, { symbol: string }> = {
  USD: { symbol: '$' },
  EUR: { symbol: '\u20ac' },
  GBP: { symbol: '\u00a3' },
  JPY: { symbol: '\u00a5' },
  AUD: { symbol: 'A$' },
  CAD: { symbol: 'CA$' },
  DKK: { symbol: 'kr' },
  NOK: { symbol: 'kr' },
  SEK: { symbol: 'kr' },
  CHF: { symbol: 'CHF' },
  ZAR: { symbol: 'R' },
  ILS: { symbol: '\u20aa' },
}

export interface ExchangeRatesData {
  updatedAt: string
  base: string
  rates: Record<string, number>
}

// ----- Cloud SQL types -----

export interface CloudSqlRegionPricing {
  mysqlZonal: number | null
  mysqlRegional: number | null
  postgresZonal: number | null
  postgresRegional: number | null
  sqlServerZonal: number | null
  sqlServerRegional: number | null
  mysqlZonalCud1yr: number | null
  mysqlZonalCud3yr: number | null
  mysqlRegionalCud1yr: number | null
  mysqlRegionalCud3yr: number | null
  postgresZonalCud1yr: number | null
  postgresZonalCud3yr: number | null
  postgresRegionalCud1yr: number | null
  postgresRegionalCud3yr: number | null
  sqlServerZonalCud1yr: number | null
  sqlServerZonalCud3yr: number | null
  sqlServerRegionalCud1yr: number | null
  sqlServerRegionalCud3yr: number | null
}

export interface CloudSqlInstance {
  name: string
  series: string
  tier: string
  edition: string
  vCpus: number | 'shared'
  memoryGb: number
  pricing: Record<string, CloudSqlRegionPricing>
}

export interface CloudSqlPricingData {
  updatedAt: string
  regions: string[]
  instances: CloudSqlInstance[]
}

// Column definitions shared across PricingTable, FiltersBar, CompareDialog
export interface ColumnDef {
  id: string
  label: string
  defaultVisible: boolean
  group: 'spec' | 'linux' | 'windows' | 'mysql' | 'postgresql' | 'sqlserver' | 'memorystore' | 'derived'
  tooltip?: string
}

export const ALL_COLUMNS: ColumnDef[] = [
  // Spec columns (hidden by default)
  { id: 'cpuType', label: 'CPU Type', defaultVisible: false, group: 'spec' },
  { id: 'localSsd', label: 'Local SSD support', defaultVisible: false, group: 'spec' },
  { id: 'networkPerformance', label: 'Network performance', defaultVisible: false, group: 'spec' },
  { id: 'gpuSupport', label: 'GPU support', defaultVisible: false, group: 'spec' },
  { id: 'soleTenantSupport', label: 'Sole tenant support', defaultVisible: false, group: 'spec' },
  { id: 'nestedVirtualizationSupport', label: 'Nested virtualization support', defaultVisible: false, group: 'spec' },
  { id: 'coremarkScore', label: 'Linux Coremark benchmark', defaultVisible: false, group: 'spec',
    tooltip: 'CoreMark CPU benchmark — higher = better single-thread performance' },
  // Linux pricing columns
  { id: 'linuxOnDemand', label: 'Linux On Demand cost', defaultVisible: false, group: 'linux',
    tooltip: 'Pay-as-you-go pricing, billed per second (1-min minimum)' },
  { id: 'linuxSud', label: 'Linux SUD cost', defaultVisible: true, group: 'linux',
    tooltip: 'Sustained Use Discount — automatic discount (up to 30%) for running more than 25% of the month' },
  { id: 'linuxPreemptible', label: 'Linux Preemptible cost', defaultVisible: false, group: 'linux',
    tooltip: 'Spot/Preemptible VMs — up to 60-91% off, can be reclaimed with 30s notice' },
  { id: 'linuxCud1yr', label: 'Linux 1 year CUD cost', defaultVisible: true, group: 'linux',
    tooltip: 'Committed Use Discount — 37% off for a 1-year commitment' },
  { id: 'linuxCud3yr', label: 'Linux 3 year CUD cost', defaultVisible: false, group: 'linux',
    tooltip: 'Committed Use Discount — 55% off for a 3-year commitment' },
  // Windows pricing columns
  { id: 'windowsOnDemand', label: 'Windows On Demand cost', defaultVisible: false, group: 'windows',
    tooltip: 'Pay-as-you-go pricing, billed per second (1-min minimum)' },
  { id: 'windowsSud', label: 'Windows SUD cost', defaultVisible: true, group: 'windows',
    tooltip: 'Sustained Use Discount — automatic discount (up to 30%) for running more than 25% of the month' },
  { id: 'windowsPreemptible', label: 'Windows Preemptible cost', defaultVisible: false, group: 'windows',
    tooltip: 'Spot/Preemptible VMs — up to 60-91% off, can be reclaimed with 30s notice' },
  { id: 'windowsCud1yr', label: 'Windows 1 year CUD cost', defaultVisible: true, group: 'windows',
    tooltip: 'Committed Use Discount — 37% off for a 1-year commitment' },
  { id: 'windowsCud3yr', label: 'Windows 3 year CUD cost', defaultVisible: false, group: 'windows',
    tooltip: 'Committed Use Discount — 55% off for a 3-year commitment' },
]

// Derived columns: $/vCPU and $/GB for each pricing column
const BASE_PRICING_COLS = ALL_COLUMNS.filter((c) => c.group === 'linux' || c.group === 'windows')
export const DERIVED_COLUMNS: ColumnDef[] = BASE_PRICING_COLS.flatMap((col) => [
  {
    id: `${col.id}_perVcpu`,
    label: `${col.label.replace(' cost', '')} $/vCPU`,
    defaultVisible: false,
    group: 'derived' as const,
    tooltip: `${col.label.replace(' cost', '')} price divided by vCPU count`,
  },
  {
    id: `${col.id}_perGb`,
    label: `${col.label.replace(' cost', '')} $/GB`,
    defaultVisible: false,
    group: 'derived' as const,
    tooltip: `${col.label.replace(' cost', '')} price divided by memory (GB)`,
  },
])

export const ALL_COLUMNS_WITH_DERIVED: ColumnDef[] = [...ALL_COLUMNS, ...DERIVED_COLUMNS]

export const DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = Object.fromEntries(
  ALL_COLUMNS_WITH_DERIVED.map((c) => [c.id, c.defaultVisible]),
)

// Pricing field IDs for use in PricingTable / CompareDialog
export const PRICING_FIELD_IDS = ALL_COLUMNS
  .filter((c) => c.group === 'linux' || c.group === 'windows')
  .map((c) => c.id) as (keyof RegionPricing)[]

// ----- Cloud SQL column definitions -----

export const CLOUDSQL_COLUMNS: ColumnDef[] = [
  { id: 'mysqlZonal',      label: 'MySQL Zonal cost',          defaultVisible: true,  group: 'mysql',
    tooltip: 'Single-zone (no HA) — lower cost, no automatic failover' },
  { id: 'mysqlRegional',   label: 'MySQL Regional (HA) cost',  defaultVisible: false, group: 'mysql',
    tooltip: 'Multi-zone with automatic failover (~2× zonal price)' },
  { id: 'postgresZonal',   label: 'PostgreSQL Zonal cost',     defaultVisible: true,  group: 'postgresql',
    tooltip: 'Single-zone (no HA) — lower cost, no automatic failover' },
  { id: 'postgresRegional',label: 'PostgreSQL Regional (HA) cost', defaultVisible: false, group: 'postgresql',
    tooltip: 'Multi-zone with automatic failover (~2× zonal price)' },
  { id: 'sqlServerZonal',  label: 'SQL Server Zonal cost',     defaultVisible: false, group: 'sqlserver',
    tooltip: 'Single-zone (no HA) — lower cost, no automatic failover' },
  { id: 'sqlServerRegional',label: 'SQL Server Regional (HA) cost', defaultVisible: false, group: 'sqlserver',
    tooltip: 'Multi-zone with automatic failover (~2× zonal price)' },
  // CUD 1-year columns (25% off on-demand)
  { id: 'mysqlZonalCud1yr',      label: 'MySQL Zonal CUD 1yr',          defaultVisible: false, group: 'mysql',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  { id: 'mysqlRegionalCud1yr',   label: 'MySQL Regional CUD 1yr',       defaultVisible: false, group: 'mysql',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  { id: 'postgresZonalCud1yr',   label: 'PostgreSQL Zonal CUD 1yr',     defaultVisible: false, group: 'postgresql',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  { id: 'postgresRegionalCud1yr',label: 'PostgreSQL Regional CUD 1yr',  defaultVisible: false, group: 'postgresql',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  { id: 'sqlServerZonalCud1yr',  label: 'SQL Server Zonal CUD 1yr',     defaultVisible: false, group: 'sqlserver',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  { id: 'sqlServerRegionalCud1yr',label: 'SQL Server Regional CUD 1yr', defaultVisible: false, group: 'sqlserver',
    tooltip: '1-year Committed Use Discount — 25% off on-demand (not available for shared-core)' },
  // CUD 3-year columns (52% off on-demand)
  { id: 'mysqlZonalCud3yr',      label: 'MySQL Zonal CUD 3yr',          defaultVisible: false, group: 'mysql',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
  { id: 'mysqlRegionalCud3yr',   label: 'MySQL Regional CUD 3yr',       defaultVisible: false, group: 'mysql',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
  { id: 'postgresZonalCud3yr',   label: 'PostgreSQL Zonal CUD 3yr',     defaultVisible: false, group: 'postgresql',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
  { id: 'postgresRegionalCud3yr',label: 'PostgreSQL Regional CUD 3yr',  defaultVisible: false, group: 'postgresql',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
  { id: 'sqlServerZonalCud3yr',  label: 'SQL Server Zonal CUD 3yr',     defaultVisible: false, group: 'sqlserver',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
  { id: 'sqlServerRegionalCud3yr',label: 'SQL Server Regional CUD 3yr', defaultVisible: false, group: 'sqlserver',
    tooltip: '3-year Committed Use Discount — 52% off on-demand (not available for shared-core)' },
]

export const CLOUDSQL_DERIVED_COLUMNS: ColumnDef[] = CLOUDSQL_COLUMNS.flatMap((col) => [
  {
    id: `${col.id}_perVcpu`,
    label: `${col.label.replace(' cost', '')} $/vCPU`,
    defaultVisible: false,
    group: 'derived' as const,
    tooltip: `${col.label.replace(' cost', '')} price divided by vCPU count`,
  },
  {
    id: `${col.id}_perGb`,
    label: `${col.label.replace(' cost', '')} $/GB`,
    defaultVisible: false,
    group: 'derived' as const,
    tooltip: `${col.label.replace(' cost', '')} price divided by memory (GB)`,
  },
])

export const CLOUDSQL_COLUMNS_WITH_DERIVED: ColumnDef[] = [...CLOUDSQL_COLUMNS, ...CLOUDSQL_DERIVED_COLUMNS]

export const DEFAULT_VISIBLE_CLOUDSQL_COLUMNS: Record<string, boolean> = Object.fromEntries(
  CLOUDSQL_COLUMNS_WITH_DERIVED.map((c) => [c.id, c.defaultVisible]),
)

// ----- Memorystore types -----

export interface MemorystoreRegionPricing {
  onDemand: number | null
  cud1yr: number | null
  cud3yr: number | null
}

export interface MemorystoreInstance {
  name: string
  product: string         // 'Redis' | 'Redis Cluster' | 'Valkey'
  nodeType: string        // M1-M5 or node type name
  capacityGb: number | null
  vCpus: number | 'shared' | null
  memoryGb: number | null
  pricingUnit: string     // 'GiB/h' or 'node/h'
  pricing: Record<string, MemorystoreRegionPricing>
}

export interface MemorystorePricingData {
  updatedAt: string
  regions: string[]
  instances: MemorystoreInstance[]
}

// ----- Memorystore column definitions -----

export const MEMORYSTORE_COLUMNS: ColumnDef[] = [
  { id: 'onDemand', label: 'On Demand cost', defaultVisible: true, group: 'memorystore',
    tooltip: 'Pay-as-you-go pricing — per GiB/hour for Redis standalone, per node/hour for Cluster & Valkey' },
  { id: 'cud1yr', label: 'CUD 1 Year cost', defaultVisible: true, group: 'memorystore',
    tooltip: 'Committed Use Discount — 20% off for a 1-year commitment (Redis M2-M5 only)' },
  { id: 'cud3yr', label: 'CUD 3 Year cost', defaultVisible: false, group: 'memorystore',
    tooltip: 'Committed Use Discount — 40% off for a 3-year commitment (Redis M2-M5 only)' },
]

export const MEMORYSTORE_COLUMNS_WITH_DERIVED: ColumnDef[] = [...MEMORYSTORE_COLUMNS]

export const DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS: Record<string, boolean> = Object.fromEntries(
  MEMORYSTORE_COLUMNS_WITH_DERIVED.map((c) => [c.id, c.defaultVisible]),
)
