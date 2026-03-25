import type { CostPeriod } from './types'
import { ALL_COLUMNS_WITH_DERIVED, CLOUDSQL_COLUMNS_WITH_DERIVED, MEMORYSTORE_COLUMNS_WITH_DERIVED, DEFAULT_VISIBLE_COLUMNS, DEFAULT_VISIBLE_CLOUDSQL_COLUMNS, DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS, CURRENCY_META } from './types'

export type Page = 'home' | 'cloudsql' | 'memorystore' | 'mcp-cli'

const VALID_PAGES = new Set<Page>(['home', 'cloudsql', 'memorystore', 'mcp-cli'])
const VALID_PERIODS = new Set<CostPeriod>(['hourly', 'monthly', 'yearly'])
const VALID_CURRENCIES = new Set(Object.keys(CURRENCY_META))

// Columns that are visible by default (for omitting from URL)
const DEFAULT_CE_COLS = ALL_COLUMNS_WITH_DERIVED.filter((c) => c.defaultVisible).map((c) => c.id)
const DEFAULT_SQL_COLS = CLOUDSQL_COLUMNS_WITH_DERIVED.filter((c) => c.defaultVisible).map((c) => c.id)
const DEFAULT_MS_COLS = MEMORYSTORE_COLUMNS_WITH_DERIVED.filter((c) => c.defaultVisible).map((c) => c.id)

const ALL_CE_IDS = new Set(ALL_COLUMNS_WITH_DERIVED.map((c) => c.id))
const ALL_SQL_IDS = new Set(CLOUDSQL_COLUMNS_WITH_DERIVED.map((c) => c.id))
const ALL_MS_IDS = new Set(MEMORYSTORE_COLUMNS_WITH_DERIVED.map((c) => c.id))

export interface UrlState {
  page: Page
  region: string
  costPeriod: CostPeriod
  currency: string
  minMemory: number
  minVCpus: number
  minCapacityGb: number
  globalSearch: string
  visibleColumns: Record<string, boolean>
  visibleCloudSqlColumns: Record<string, boolean>
  visibleMemorystoreColumns: Record<string, boolean>
}

function colsToRecord(ids: string[], allIds: Set<string>): Record<string, boolean> {
  const rec: Record<string, boolean> = {}
  for (const id of allIds) {
    rec[id] = ids.includes(id)
  }
  return rec
}

function visibleIds(vis: Record<string, boolean>): string[] {
  return Object.entries(vis)
    .filter(([, v]) => v)
    .map(([k]) => k)
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const bs = new Set(b)
  return a.every((v) => bs.has(v))
}

export function getInitialStateFromUrl(): UrlState {
  const hash = location.hash.slice(1) // strip leading #
  const qIdx = hash.indexOf('?')
  const pagePart = qIdx === -1 ? hash : hash.slice(0, qIdx)
  const queryPart = qIdx === -1 ? '' : hash.slice(qIdx + 1)

  const page: Page = VALID_PAGES.has(pagePart as Page) ? (pagePart as Page) : 'home'
  const params = new URLSearchParams(queryPart)

  const region = params.get('region') ?? 'us-central1'

  const periodParam = params.get('period') as CostPeriod | null
  const costPeriod: CostPeriod = periodParam && VALID_PERIODS.has(periodParam) ? periodParam : 'hourly'

  const currencyParam = params.get('currency')
  const currency = currencyParam && VALID_CURRENCIES.has(currencyParam) ? currencyParam : 'USD'

  const minMemory = Math.max(0, Number(params.get('minMem') ?? 0) || 0)
  const minVCpus = Math.max(0, Number(params.get('minCpu') ?? 0) || 0)

  const globalSearch = params.get('q') ?? ''

  const colsParam = params.get('cols')
  const visibleColumns = colsParam !== null
    ? colsToRecord(colsParam.split(',').filter((id) => ALL_CE_IDS.has(id)), ALL_CE_IDS)
    : { ...DEFAULT_VISIBLE_COLUMNS }

  const sqlColsParam = params.get('sqlcols')
  const visibleCloudSqlColumns = sqlColsParam !== null
    ? colsToRecord(sqlColsParam.split(',').filter((id) => ALL_SQL_IDS.has(id)), ALL_SQL_IDS)
    : { ...DEFAULT_VISIBLE_CLOUDSQL_COLUMNS }

  const msColsParam = params.get('mscols')
  const visibleMemorystoreColumns = msColsParam !== null
    ? colsToRecord(msColsParam.split(',').filter((id) => ALL_MS_IDS.has(id)), ALL_MS_IDS)
    : { ...DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS }

  const minCapacityGb = Math.max(0, Number(params.get('minCap') ?? 0) || 0)

  return { page, region, costPeriod, currency, minMemory, minVCpus, minCapacityGb, globalSearch, visibleColumns, visibleCloudSqlColumns, visibleMemorystoreColumns }
}

export function syncStateToUrl(
  page: Page,
  state: Omit<UrlState, 'page'>,
): void {
  const params = new URLSearchParams()

  if (state.region !== 'us-central1') params.set('region', state.region)
  if (state.costPeriod !== 'hourly') params.set('period', state.costPeriod)
  if (state.currency !== 'USD') params.set('currency', state.currency)
  if (state.minMemory > 0) params.set('minMem', String(state.minMemory))
  if (state.minVCpus > 0) params.set('minCpu', String(state.minVCpus))
  if (state.globalSearch) params.set('q', state.globalSearch)

  const ceVisible = visibleIds(state.visibleColumns)
  if (!setsEqual(ceVisible.sort(), [...DEFAULT_CE_COLS].sort())) {
    params.set('cols', ceVisible.join(','))
  }

  const sqlVisible = visibleIds(state.visibleCloudSqlColumns)
  if (!setsEqual(sqlVisible.sort(), [...DEFAULT_SQL_COLS].sort())) {
    params.set('sqlcols', sqlVisible.join(','))
  }

  const msVisible = visibleIds(state.visibleMemorystoreColumns)
  if (!setsEqual(msVisible.sort(), [...DEFAULT_MS_COLS].sort())) {
    params.set('mscols', msVisible.join(','))
  }

  if (state.minCapacityGb > 0) params.set('minCap', String(state.minCapacityGb))

  const pageStr = page === 'home' ? '' : page
  const query = params.size > 0 ? '?' + params.toString() : ''
  history.replaceState(null, '', '#' + pageStr + query)
}
