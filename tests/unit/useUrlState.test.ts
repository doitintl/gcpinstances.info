import { describe, it, expect, beforeEach } from 'vitest'
import { getInitialStateFromUrl, syncStateToUrl } from '@/lib/useUrlState'
import { DEFAULT_VISIBLE_COLUMNS, DEFAULT_VISIBLE_CLOUDSQL_COLUMNS, DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS, DEFAULT_VISIBLE_ALLOYDB_COLUMNS } from '@/lib/types'

function setHash(hash: string) {
  // jsdom location.hash setter strips the leading #
  Object.defineProperty(window, 'location', {
    value: { ...window.location, hash, pathname: '/', search: '' },
    writable: true,
    configurable: true,
  })
}

function setPath(pathname: string, search = '') {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, pathname, search, hash: '' },
    writable: true,
    configurable: true,
  })
}

function mockReplaceState() {
  const calls: string[] = []
  const original = history.replaceState.bind(history)
  history.replaceState = (_data: unknown, _title: string, url: string) => {
    calls.push(url)
  }
  return { calls, restore: () => { history.replaceState = original } }
}

beforeEach(() => {
  setHash('')
})

describe('getInitialStateFromUrl', () => {
  it('returns defaults when hash is empty', () => {
    setHash('')
    const state = getInitialStateFromUrl()
    expect(state.page).toBe('home')
    expect(state.region).toBe('us-central1')
    expect(state.costPeriod).toBe('hourly')
    expect(state.currency).toBe('USD')
    expect(state.minMemory).toBe(0)
    expect(state.minVCpus).toBe(0)
    expect(state.globalSearch).toBe('')
    expect(state.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS)
    expect(state.visibleCloudSqlColumns).toEqual(DEFAULT_VISIBLE_CLOUDSQL_COLUMNS)
    expect(state.visibleMemorystoreColumns).toEqual(DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS)
    expect(state.visibleAlloyDbColumns).toEqual(DEFAULT_VISIBLE_ALLOYDB_COLUMNS)
    expect(state.minCapacityGb).toBe(0)
  })

  it('parses page from hash (legacy)', () => {
    setHash('#cloudsql')
    expect(getInitialStateFromUrl().page).toBe('cloudsql')

    setHash('#mcp-cli')
    expect(getInitialStateFromUrl().page).toBe('mcp-cli')

    setHash('#home')
    expect(getInitialStateFromUrl().page).toBe('home')
  })

  it('parses page from pathname', () => {
    setPath('/cloudsql/')
    expect(getInitialStateFromUrl().page).toBe('cloudsql')

    setPath('/memorystore/')
    expect(getInitialStateFromUrl().page).toBe('memorystore')

    setPath('/alloydb/')
    expect(getInitialStateFromUrl().page).toBe('alloydb')

    setPath('/mcp-cli/')
    expect(getInitialStateFromUrl().page).toBe('mcp-cli')

    setPath('/')
    expect(getInitialStateFromUrl().page).toBe('home')
  })

  it('parses query params from search string (path routing)', () => {
    setPath('/cloudsql/', '?region=europe-west1&period=monthly')
    const state = getInitialStateFromUrl()
    expect(state.page).toBe('cloudsql')
    expect(state.region).toBe('europe-west1')
    expect(state.costPeriod).toBe('monthly')
  })

  it('falls back to home for unknown page', () => {
    setHash('#unknown-page')
    expect(getInitialStateFromUrl().page).toBe('home')
  })

  it('parses region param', () => {
    setHash('#home?region=europe-west1')
    expect(getInitialStateFromUrl().region).toBe('europe-west1')
  })

  it('parses period param', () => {
    setHash('#home?period=monthly')
    expect(getInitialStateFromUrl().costPeriod).toBe('monthly')

    setHash('#home?period=yearly')
    expect(getInitialStateFromUrl().costPeriod).toBe('yearly')
  })

  it('falls back to hourly for invalid period', () => {
    setHash('#home?period=weekly')
    expect(getInitialStateFromUrl().costPeriod).toBe('hourly')
  })

  it('parses currency param', () => {
    setHash('#home?currency=EUR')
    expect(getInitialStateFromUrl().currency).toBe('EUR')
  })

  it('falls back to USD for unknown currency', () => {
    setHash('#home?currency=XYZ')
    expect(getInitialStateFromUrl().currency).toBe('USD')
  })

  it('parses minMem and minCpu', () => {
    setHash('#home?minMem=8&minCpu=4')
    const state = getInitialStateFromUrl()
    expect(state.minMemory).toBe(8)
    expect(state.minVCpus).toBe(4)
  })

  it('treats negative minMem/minCpu as 0', () => {
    setHash('#home?minMem=-5&minCpu=-2')
    const state = getInitialStateFromUrl()
    expect(state.minMemory).toBe(0)
    expect(state.minVCpus).toBe(0)
  })

  it('parses global search q param', () => {
    setHash('#home?q=n2-standard')
    expect(getInitialStateFromUrl().globalSearch).toBe('n2-standard')
  })

  it('parses cols param into visibleColumns', () => {
    setHash('#home?cols=linuxSud,linuxCud1yr')
    const state = getInitialStateFromUrl()
    expect(state.visibleColumns['linuxSud']).toBe(true)
    expect(state.visibleColumns['linuxCud1yr']).toBe(true)
    expect(state.visibleColumns['windowsSud']).toBe(false)
  })

  it('ignores invalid column ids in cols param', () => {
    setHash('#home?cols=linuxSud,notAColumn')
    const state = getInitialStateFromUrl()
    expect(state.visibleColumns['linuxSud']).toBe(true)
    // notAColumn should not appear
    expect('notAColumn' in state.visibleColumns).toBe(false)
  })

  it('parses sqlcols param into visibleCloudSqlColumns', () => {
    setHash('#cloudsql?sqlcols=mysqlZonal,postgresZonal')
    const state = getInitialStateFromUrl()
    expect(state.visibleCloudSqlColumns['mysqlZonal']).toBe(true)
    expect(state.visibleCloudSqlColumns['postgresZonal']).toBe(true)
    expect(state.visibleCloudSqlColumns['mysqlRegional']).toBe(false)
  })

  it('parses all params together', () => {
    setHash('#cloudsql?region=us-east1&period=monthly&currency=GBP&minMem=16&minCpu=8&q=db-n2')
    const state = getInitialStateFromUrl()
    expect(state.page).toBe('cloudsql')
    expect(state.region).toBe('us-east1')
    expect(state.costPeriod).toBe('monthly')
    expect(state.currency).toBe('GBP')
    expect(state.minMemory).toBe(16)
    expect(state.minVCpus).toBe(8)
    expect(state.globalSearch).toBe('db-n2')
  })
})

describe('syncStateToUrl', () => {
  it('omits all params when state is default', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'hourly',
      currency: 'USD',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toBe('/')
    restore()
  })

  it('includes non-default region', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'europe-west1',
      costPeriod: 'hourly',
      currency: 'USD',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toContain('region=europe-west1')
    restore()
  })

  it('includes non-default period', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'monthly',
      currency: 'USD',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toContain('period=monthly')
    restore()
  })

  it('includes non-default currency', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'hourly',
      currency: 'EUR',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toContain('currency=EUR')
    restore()
  })

  it('includes minMem and minCpu when > 0', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'hourly',
      currency: 'USD',
      minMemory: 8,
      minVCpus: 4,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toContain('minMem=8')
    expect(calls[0]).toContain('minCpu=4')
    restore()
  })

  it('includes cols when different from defaults', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'hourly',
      currency: 'USD',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS, linuxOnDemand: true },
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).toContain('cols=')
    restore()
  })

  it('omits cols when same as defaults', () => {
    const { calls, restore } = mockReplaceState()
    syncStateToUrl('home', {
      region: 'us-central1',
      costPeriod: 'hourly',
      currency: 'USD',
      minMemory: 0,
      minVCpus: 0,
      globalSearch: '',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
      minCapacityGb: 0,
    })
    expect(calls[0]).not.toContain('cols=')
    restore()
  })

  it('round-trips: sync then parse gives back same state', () => {
    const original = {
      region: 'asia-east1',
      costPeriod: 'yearly' as const,
      currency: 'JPY',
      minMemory: 16,
      minVCpus: 4,
      minCapacityGb: 0,
      globalSearch: 'n2',
      visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS, linuxOnDemand: true, windowsSud: false },
      visibleCloudSqlColumns: DEFAULT_VISIBLE_CLOUDSQL_COLUMNS,
      visibleMemorystoreColumns: DEFAULT_VISIBLE_MEMORYSTORE_COLUMNS,
      visibleAlloyDbColumns: DEFAULT_VISIBLE_ALLOYDB_COLUMNS,
    }

    // Capture URL set by syncStateToUrl
    let capturedUrl = ''
    const origReplace = history.replaceState.bind(history)
    history.replaceState = (_d: unknown, _t: string, url: string) => { capturedUrl = url }

    syncStateToUrl('home', original)
    history.replaceState = origReplace

    // Parse the captured path-based URL (e.g. "/?region=asia-east1&...")
    const qIdx = capturedUrl.indexOf('?')
    const pathname = qIdx === -1 ? capturedUrl : capturedUrl.slice(0, qIdx)
    const search = qIdx === -1 ? '' : capturedUrl.slice(qIdx)
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname, search, hash: '' },
      writable: true,
      configurable: true,
    })

    const parsed = getInitialStateFromUrl()
    expect(parsed.region).toBe(original.region)
    expect(parsed.costPeriod).toBe(original.costPeriod)
    expect(parsed.currency).toBe(original.currency)
    expect(parsed.minMemory).toBe(original.minMemory)
    expect(parsed.minVCpus).toBe(original.minVCpus)
    expect(parsed.globalSearch).toBe(original.globalSearch)
  })
})
