import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { PricingData, CostPeriod, CloudSqlPricingData, MemorystorePricingData, AlloyDbPricingData, ExchangeRatesData } from './lib/types'
import { CURRENCY_META, CLOUDSQL_COLUMNS_WITH_DERIVED, MEMORYSTORE_COLUMNS_WITH_DERIVED, ALLOYDB_COLUMNS_WITH_DERIVED } from './lib/types'
import { getInitialStateFromUrl, syncStateToUrl } from './lib/useUrlState'
import type { Page } from './lib/useUrlState'
import { useKeyboardShortcuts } from './lib/useKeyboardShortcuts'
import { PricingTable } from './components/PricingTable'
import { FiltersBar } from './components/FiltersBar'
import { CloudSqlPricingTable } from './components/CloudSqlPricingTable'
import { MemorystorePricingTable } from './components/MemorystorePricingTable'
import { AlloyDbPricingTable } from './components/AlloyDbPricingTable'
import { McpCliPage } from './components/McpCliPage'
import { DarkModeToggle } from './components/DarkModeToggle'
import { AboutDialog } from './components/AboutDialog'
import { trackPageView } from './lib/analytics'
import { Cloud, ExternalLink, Github, Info, Star, Terminal } from 'lucide-react'
import { cn, buildDoitUrl } from './lib/utils'

const CURRENCY_KEYS = Object.keys(CURRENCY_META)

export default function App() {
  // Initialize all filter state from URL on first render
  const [initialState] = useState(getInitialStateFromUrl)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  useKeyboardShortcuts(searchInputRef)

  const [page, setPage] = useState<Page>(initialState.page)
  const [data, setData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 })

  // Cloud SQL data (lazy loaded)
  const [cloudSqlData, setCloudSqlData] = useState<CloudSqlPricingData | null>(null)
  const [cloudSqlError, setCloudSqlError] = useState<string | null>(null)
  const cloudSqlFetchRef = useRef(false)
  const cloudSqlLoading = page === 'cloudsql' && !cloudSqlData && !cloudSqlError

  // Memorystore data (lazy loaded)
  const [memorystoreData, setMemorystoreData] = useState<MemorystorePricingData | null>(null)
  const [memorystoreError, setMemorystoreError] = useState<string | null>(null)
  const memorystoreFetchRef = useRef(false)
  const memorystoreLoading = page === 'memorystore' && !memorystoreData && !memorystoreError

  // AlloyDB data (lazy loaded)
  const [alloydbData, setAlloydbData] = useState<AlloyDbPricingData | null>(null)
  const [alloydbError, setAlloydbError] = useState<string | null>(null)
  const alloydbFetchRef = useRef(false)
  const alloydbLoading = page === 'alloydb' && !alloydbData && !alloydbError

  // Shared filters — initialized from URL
  const [region, setRegion] = useState(initialState.region)
  const [costPeriod, setCostPeriod] = useState<CostPeriod>(initialState.costPeriod)
  const [currency, setCurrency] = useState(initialState.currency)
  const [minMemory, setMinMemory] = useState(initialState.minMemory)
  const [minVCpus, setMinVCpus] = useState(initialState.minVCpus)
  const [minCapacityGb, setMinCapacityGb] = useState(initialState.minCapacityGb)
  const [globalSearch, setGlobalSearch] = useState(initialState.globalSearch)

  const [aboutOpen, setAboutOpen] = useState(false)

  // Per-tab column visibility — initialized from URL
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(initialState.visibleColumns)
  const [visibleCloudSqlColumns, setVisibleCloudSqlColumns] = useState<Record<string, boolean>>(initialState.visibleCloudSqlColumns)
  const [visibleMemorystoreColumns, setVisibleMemorystoreColumns] = useState<Record<string, boolean>>(initialState.visibleMemorystoreColumns)
  const [visibleAlloyDbColumns, setVisibleAlloyDbColumns] = useState<Record<string, boolean>>(initialState.visibleAlloyDbColumns)

  // Sync state to URL whenever any filter changes
  useEffect(() => {
    syncStateToUrl(page, { region, costPeriod, currency, minMemory, minVCpus, minCapacityGb, globalSearch, visibleColumns, visibleCloudSqlColumns, visibleMemorystoreColumns, visibleAlloyDbColumns })
  }, [page, region, costPeriod, currency, minMemory, minVCpus, minCapacityGb, globalSearch, visibleColumns, visibleCloudSqlColumns, visibleMemorystoreColumns, visibleAlloyDbColumns])

  useEffect(() => {
    const onHashChange = () => {
      // On popstate/hashchange, re-read URL state
      const urlState = getInitialStateFromUrl()
      setPage(urlState.page)
      setRegion(urlState.region)
      setCostPeriod(urlState.costPeriod)
      setCurrency(urlState.currency)
      setMinMemory(urlState.minMemory)
      setMinVCpus(urlState.minVCpus)
      setMinCapacityGb(urlState.minCapacityGb)
      setGlobalSearch(urlState.globalSearch)
      setVisibleColumns(urlState.visibleColumns)
      setVisibleCloudSqlColumns(urlState.visibleCloudSqlColumns)
      setVisibleMemorystoreColumns(urlState.visibleMemorystoreColumns)
      setVisibleAlloyDbColumns(urlState.visibleAlloyDbColumns)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Load Compute Engine pricing and exchange rates on mount (parallel)
  useEffect(() => {
    const pricingPromise = fetch('/data/pricing.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: PricingData) => {
        setData(d)
        // Only override region if the URL-specified region doesn't exist in this dataset
        setRegion((prev) => {
          if (d.regions.includes(prev)) return prev
          if (d.regions.includes('us-central1')) return 'us-central1'
          return d.regions[0] ?? prev
        })
      })

    const ratesPromise = fetch('/data/exchange-rates.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: ExchangeRatesData) => setExchangeRates(d.rates))
      .catch(() => { /* keep default { USD: 1 } */ })

    Promise.all([pricingPromise, ratesPromise])
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Lazy load Cloud SQL pricing on first visit to that tab
  useEffect(() => {
    if (page !== 'cloudsql' || cloudSqlFetchRef.current) return
    cloudSqlFetchRef.current = true
    fetch('/data/cloudsql-pricing.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: CloudSqlPricingData) => {
        setCloudSqlData(d)
        setRegion((prev) => {
          if (d.regions.includes(prev)) return prev
          return d.regions.includes('us-central1') ? 'us-central1' : d.regions[0] ?? prev
        })
      })
      .catch((e) => setCloudSqlError(String(e)))
  }, [page])

  // Lazy load Memorystore pricing on first visit to that tab
  useEffect(() => {
    if (page !== 'memorystore' || memorystoreFetchRef.current) return
    memorystoreFetchRef.current = true
    fetch('/data/memorystore-pricing.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: MemorystorePricingData) => {
        setMemorystoreData(d)
        setRegion((prev) => {
          if (d.regions.includes(prev)) return prev
          return d.regions.includes('us-central1') ? 'us-central1' : d.regions[0] ?? prev
        })
      })
      .catch((e) => setMemorystoreError(String(e)))
  }, [page])

  // Lazy load AlloyDB pricing on first visit to that tab
  useEffect(() => {
    if (page !== 'alloydb' || alloydbFetchRef.current) return
    alloydbFetchRef.current = true
    fetch('/data/alloydb-pricing.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: AlloyDbPricingData) => {
        setAlloydbData(d)
        setRegion((prev) => {
          if (d.regions.includes(prev)) return prev
          return d.regions.includes('us-central1') ? 'us-central1' : d.regions[0] ?? prev
        })
      })
      .catch((e) => setAlloydbError(String(e)))
  }, [page])

  const filteredInstances = useMemo(() => {
    if (!data) return []
    return data.instances.filter((inst) => {
      const vCpus = inst.vCpus === 'shared' ? 0 : inst.vCpus
      if (vCpus < minVCpus) return false
      if (inst.memoryGb < minMemory) return false
      if (globalSearch) {
        const q = globalSearch.toLowerCase()
        if (!inst.name.toLowerCase().includes(q) &&
            !inst.series.toLowerCase().includes(q) &&
            !inst.family.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [data, minVCpus, minMemory, globalSearch])

  const filteredCloudSqlInstances = useMemo(() => {
    if (!cloudSqlData) return []
    return cloudSqlData.instances.filter((inst) => {
      const vCpus = inst.vCpus === 'shared' ? 0 : inst.vCpus
      if (vCpus < minVCpus) return false
      if (inst.memoryGb < minMemory) return false
      if (globalSearch) {
        const q = globalSearch.toLowerCase()
        if (!inst.name.toLowerCase().includes(q) &&
            !inst.series.toLowerCase().includes(q) &&
            !inst.tier.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [cloudSqlData, minVCpus, minMemory, globalSearch])

  const filteredMemorystoreInstances = useMemo(() => {
    if (!memorystoreData) return []
    return memorystoreData.instances.filter((inst) => {
      if (minCapacityGb > 0 && inst.capacityGb != null && inst.capacityGb < minCapacityGb) return false
      if (globalSearch) {
        const q = globalSearch.toLowerCase()
        if (!inst.name.toLowerCase().includes(q) &&
            !inst.product.toLowerCase().includes(q) &&
            !inst.nodeType.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [memorystoreData, minCapacityGb, globalSearch])

  const filteredAlloyDbInstances = useMemo(() => {
    if (!alloydbData) return []
    return alloydbData.instances.filter((inst) => {
      if (inst.vCpus < minVCpus) return false
      if (inst.memoryGb < minMemory) return false
      if (globalSearch) {
        const q = globalSearch.toLowerCase()
        if (!inst.name.toLowerCase().includes(q) &&
            !inst.series.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [alloydbData, minVCpus, minMemory, globalSearch])

  const activeUpdatedAt = page === 'alloydb' ? alloydbData?.updatedAt : page === 'memorystore' ? memorystoreData?.updatedAt : page === 'cloudsql' ? cloudSqlData?.updatedAt : data?.updatedAt
  const formattedDate = useMemo(() => activeUpdatedAt ? new Date(activeUpdatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '', [activeUpdatedAt])

  const handleClearFilters = useCallback(() => {
    setMinMemory(0)
    setMinVCpus(0)
    setMinCapacityGb(0)
    setGlobalSearch('')
  }, [])

  const activeRegions = useMemo(() => {
    if (page === 'alloydb') return alloydbData?.regions ?? data?.regions ?? []
    if (page === 'memorystore') return memorystoreData?.regions ?? data?.regions ?? []
    if (page === 'cloudsql') return cloudSqlData?.regions ?? data?.regions ?? []
    return data?.regions ?? []
  }, [page, data, cloudSqlData, memorystoreData, alloydbData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <Cloud className="w-12 h-12 animate-pulse text-blue-500" />
          <p className="text-lg font-medium">Loading pricing data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 font-medium">Failed to load pricing data</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100 flex flex-col overflow-hidden transition-colors">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          {/* Brand + mobile actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">GCP Instances</span>
              <span className="hidden sm:inline text-gray-600 text-sm">powered by</span>
              <img src="/DoitLogo.svg" alt="DoiT" className="h-4 sm:h-5" />
            </div>
            {/* Mobile-only: MCP button + dark mode toggle */}
            <div className="sm:hidden flex items-center gap-2">
              <a
                href="#mcp-cli"
                onClick={() => trackPageView('mcp-cli')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-sm shadow-blue-500/40"
              >
                <Terminal className="w-3 h-3" />
                MCP &amp; CLI
              </a>
              <DarkModeToggle />
            </div>
          </div>
          {/* Tab navigation — scrollable on mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:ml-4">
            <a
              href="#home"
              onClick={() => trackPageView('home')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                page === 'home' || page === 'mcp-cli'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800',
              )}
            >
              Compute Engine
            </a>
            <a
              href="#cloudsql"
              onClick={() => trackPageView('cloudsql')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                page === 'cloudsql'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800',
              )}
            >
              Cloud SQL
            </a>
            <a
              href="#memorystore"
              onClick={() => trackPageView('memorystore')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                page === 'memorystore'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800',
              )}
            >
              Memorystore
            </a>
            <a
              href="#alloydb"
              onClick={() => trackPageView('alloydb')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                page === 'alloydb'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800',
              )}
            >
              AlloyDB
            </a>
          </nav>
          {/* Desktop-only: last updated + MCP */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Last updated: {formattedDate}
            </div>
            <a
              href="#mcp-cli"
              onClick={() => trackPageView('mcp-cli')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-sm shadow-blue-500/40"
            >
              <Terminal className="w-3 h-3" />
              MCP &amp; CLI
            </a>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* CTA Banner */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <span>Want to better understand your cloud spend?</span>
          <a
            href={buildDoitUrl('cloud-analytics/', 'cloud-analytics', 'top-banner')}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline decoration-2 underline-offset-2 hover:text-indigo-100 inline-flex items-center gap-1"
          >
            Check out DoiT Cloud Analytics
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {page === 'mcp-cli' ? (
        <McpCliPage />
      ) : page === 'alloydb' ? (
        <>
          <div className="max-w-screen-2xl mx-auto px-4 pt-4 w-full">
            <FiltersBar
              regions={activeRegions}
              region={region}
              setRegion={setRegion}
              costPeriod={costPeriod}
              setCostPeriod={setCostPeriod}
              currency={currency}
              setCurrency={setCurrency}
              currencies={CURRENCY_KEYS}
              minMemory={minMemory}
              setMinMemory={setMinMemory}
              minVCpus={minVCpus}
              setMinVCpus={setMinVCpus}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              visibleColumns={visibleAlloyDbColumns}
              setVisibleColumns={setVisibleAlloyDbColumns}
              onClearFilters={handleClearFilters}
              instanceCount={filteredAlloyDbInstances.length}
              totalCount={alloydbData?.instances.length ?? 0}
              columns={ALLOYDB_COLUMNS_WITH_DERIVED}
              searchInputRef={searchInputRef}
            />
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <div className="absolute inset-0 max-w-screen-2xl mx-auto px-4 pb-4">
              {alloydbLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                    <Cloud className="w-10 h-10 animate-pulse text-blue-500" />
                    <p className="text-base font-medium">Loading AlloyDB pricing...</p>
                  </div>
                </div>
              ) : alloydbError ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <p className="text-red-500 font-medium">Failed to load AlloyDB pricing</p>
                    <p className="text-gray-400 text-sm mt-1">{alloydbError}</p>
                  </div>
                </div>
              ) : (
                <AlloyDbPricingTable
                  instances={filteredAlloyDbInstances}
                  region={region}
                  costPeriod={costPeriod}
                  currency={currency}
                  visibleColumns={visibleAlloyDbColumns}
                  exchangeRates={exchangeRates}
                  allRegions={activeRegions}
                />
              )}
            </div>
          </div>
        </>
      ) : page === 'memorystore' ? (
        <>
          <div className="max-w-screen-2xl mx-auto px-4 pt-4 w-full">
            <FiltersBar
              regions={activeRegions}
              region={region}
              setRegion={setRegion}
              costPeriod={costPeriod}
              setCostPeriod={setCostPeriod}
              currency={currency}
              setCurrency={setCurrency}
              currencies={CURRENCY_KEYS}
              minMemory={minMemory}
              setMinMemory={setMinMemory}
              minVCpus={minVCpus}
              setMinVCpus={setMinVCpus}
              minCapacityGb={minCapacityGb}
              setMinCapacityGb={setMinCapacityGb}
              filterMode="memorystore"
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              visibleColumns={visibleMemorystoreColumns}
              setVisibleColumns={setVisibleMemorystoreColumns}
              onClearFilters={handleClearFilters}
              instanceCount={filteredMemorystoreInstances.length}
              totalCount={memorystoreData?.instances.length ?? 0}
              columns={MEMORYSTORE_COLUMNS_WITH_DERIVED}
              searchInputRef={searchInputRef}
            />
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <div className="absolute inset-0 max-w-screen-2xl mx-auto px-4 pb-4">
              {memorystoreLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                    <Cloud className="w-10 h-10 animate-pulse text-blue-500" />
                    <p className="text-base font-medium">Loading Memorystore pricing...</p>
                  </div>
                </div>
              ) : memorystoreError ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <p className="text-red-500 font-medium">Failed to load Memorystore pricing</p>
                    <p className="text-gray-400 text-sm mt-1">{memorystoreError}</p>
                  </div>
                </div>
              ) : (
                <MemorystorePricingTable
                  instances={filteredMemorystoreInstances}
                  region={region}
                  costPeriod={costPeriod}
                  currency={currency}
                  visibleColumns={visibleMemorystoreColumns}
                  exchangeRates={exchangeRates}
                  allRegions={activeRegions}
                />
              )}
            </div>
          </div>
        </>
      ) : page === 'cloudsql' ? (
        <>
          <div className="max-w-screen-2xl mx-auto px-4 pt-4 w-full">
            <FiltersBar
              regions={activeRegions}
              region={region}
              setRegion={setRegion}
              costPeriod={costPeriod}
              setCostPeriod={setCostPeriod}
              currency={currency}
              setCurrency={setCurrency}
              currencies={CURRENCY_KEYS}
              minMemory={minMemory}
              setMinMemory={setMinMemory}
              minVCpus={minVCpus}
              setMinVCpus={setMinVCpus}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              visibleColumns={visibleCloudSqlColumns}
              setVisibleColumns={setVisibleCloudSqlColumns}
              onClearFilters={handleClearFilters}
              instanceCount={filteredCloudSqlInstances.length}
              totalCount={cloudSqlData?.instances.length ?? 0}
              columns={CLOUDSQL_COLUMNS_WITH_DERIVED}
              searchInputRef={searchInputRef}
            />
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <div className="absolute inset-0 max-w-screen-2xl mx-auto px-4 pb-4">
              {cloudSqlLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                    <Cloud className="w-10 h-10 animate-pulse text-blue-500" />
                    <p className="text-base font-medium">Loading Cloud SQL pricing...</p>
                  </div>
                </div>
              ) : cloudSqlError ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <p className="text-red-500 font-medium">Failed to load Cloud SQL pricing</p>
                    <p className="text-gray-400 text-sm mt-1">{cloudSqlError}</p>
                  </div>
                </div>
              ) : (
                <CloudSqlPricingTable
                  instances={filteredCloudSqlInstances}
                  region={region}
                  costPeriod={costPeriod}
                  currency={currency}
                  visibleColumns={visibleCloudSqlColumns}
                  exchangeRates={exchangeRates}
                  allRegions={activeRegions}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Filters */}
          <div className="max-w-screen-2xl mx-auto px-4 pt-4 w-full">
            <FiltersBar
              regions={data.regions}
              region={region}
              setRegion={setRegion}
              costPeriod={costPeriod}
              setCostPeriod={setCostPeriod}
              currency={currency}
              setCurrency={setCurrency}
              currencies={CURRENCY_KEYS}
              minMemory={minMemory}
              setMinMemory={setMinMemory}
              minVCpus={minVCpus}
              setMinVCpus={setMinVCpus}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              onClearFilters={handleClearFilters}
              instanceCount={filteredInstances.length}
              totalCount={data.instances.length}
              searchInputRef={searchInputRef}
            />
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 w-full relative">
            <div className="absolute inset-0 max-w-screen-2xl mx-auto px-4 pb-4">
              <PricingTable
                instances={filteredInstances}
                region={region}
                costPeriod={costPeriod}
                currency={currency}
                visibleColumns={visibleColumns}
                exchangeRates={exchangeRates}
                allRegions={data.regions}
              />
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800 dark:border-gray-900">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <img src="/DoitLogo.svg" alt="DoiT" className="h-4" />
            <span className="hidden sm:inline text-gray-500">Not affiliated with Google</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAboutOpen(true)}
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              About
            </button>
            <a href={buildDoitUrl('', 'brand', 'footer')} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1 hover:text-white transition-colors">
              doit.com
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://github.com/doitintl/gcpinstances.info"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1.5 border border-gray-600 rounded-full px-2.5 py-0.5 hover:border-gray-400"
            >
              <Star className="w-3 h-3" />
              <Github className="w-3 h-3" />
              Star on GitHub
            </a>
          </div>
        </div>
      </footer>
      <AboutDialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        formattedDate={formattedDate}
      />
    </div>
  )
}
