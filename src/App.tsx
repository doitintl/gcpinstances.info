import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { PricingData, CostPeriod, CloudSqlPricingData, ExchangeRatesData } from './lib/types'
import { CURRENCY_META, DEFAULT_VISIBLE_COLUMNS, DEFAULT_VISIBLE_CLOUDSQL_COLUMNS, CLOUDSQL_COLUMNS } from './lib/types'
import { PricingTable } from './components/PricingTable'
import { FiltersBar } from './components/FiltersBar'
import { CloudSqlPricingTable } from './components/CloudSqlPricingTable'
import { McpCliPage } from './components/McpCliPage'
import { trackPageView } from './lib/analytics'
import { Cloud, ExternalLink, Github, Terminal } from 'lucide-react'
import { cn } from './lib/utils'

type Page = 'home' | 'cloudsql' | 'mcp-cli'

function getPage(): Page {
  if (location.hash === '#mcp-cli') return 'mcp-cli'
  if (location.hash === '#cloudsql') return 'cloudsql'
  return 'home'
}

const CURRENCY_KEYS = Object.keys(CURRENCY_META)

export default function App() {
  const [page, setPage] = useState<Page>(getPage)
  const [data, setData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 })

  // Cloud SQL data (lazy loaded)
  const [cloudSqlData, setCloudSqlData] = useState<CloudSqlPricingData | null>(null)
  const [cloudSqlError, setCloudSqlError] = useState<string | null>(null)
  const cloudSqlFetchRef = useRef(false)
  // Derived: show loading spinner while on Cloud SQL tab before data or error arrives
  const cloudSqlLoading = page === 'cloudsql' && !cloudSqlData && !cloudSqlError

  // Shared filters
  const [region, setRegion] = useState('us-central1')
  const [costPeriod, setCostPeriod] = useState<CostPeriod>('hourly')
  const [currency, setCurrency] = useState('USD')
  const [minMemory, setMinMemory] = useState(0)
  const [minVCpus, setMinVCpus] = useState(0)
  const [globalSearch, setGlobalSearch] = useState('')

  // Per-tab column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLUMNS)
  const [visibleCloudSqlColumns, setVisibleCloudSqlColumns] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_CLOUDSQL_COLUMNS)

  useEffect(() => {
    const onHashChange = () => setPage(getPage())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Load Compute Engine pricing and exchange rates on mount (parallel)
  useEffect(() => {
    const pricingPromise = fetch('/data/pricing.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: PricingData) => {
        setData(d)
        if (d.regions.includes('us-central1')) setRegion('us-central1')
        else if (d.regions.length) setRegion(d.regions[0])
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

  const activeUpdatedAt = page === 'cloudsql' ? cloudSqlData?.updatedAt : data?.updatedAt
  const formattedDate = useMemo(() => activeUpdatedAt ? new Date(activeUpdatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '', [activeUpdatedAt])

  const handleClearFilters = useCallback(() => {
    setMinMemory(0)
    setMinVCpus(0)
    setGlobalSearch('')
  }, [])

  // Active regions depends on which tab is active
  const activeRegions = useMemo(() => {
    if (page === 'cloudsql') return cloudSqlData?.regions ?? data?.regions ?? []
    return data?.regions ?? []
  }, [page, data, cloudSqlData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Cloud className="w-12 h-12 animate-pulse text-blue-500" />
          <p className="text-lg font-medium">Loading pricing data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-medium">Failed to load pricing data</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight">GCP Instances</span>
              <span className="text-gray-500 text-sm">powered by</span>
              <img src="/DoitLogo.svg" alt="DoiT" className="h-5" />
            </div>
            {/* Tab navigation */}
            <nav className="flex items-center gap-1 ml-2">
              <a
                href="#home"
                onClick={() => trackPageView('home')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
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
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  page === 'cloudsql'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800',
                )}
              >
                Cloud SQL
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      {/* CTA Banner */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <span>Want to better understand your cloud spend?</span>
          <a
            href="https://www.doit.com/cloud-analytics/"
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
              columns={CLOUDSQL_COLUMNS}
            />
          </div>
          <div className="max-w-screen-2xl mx-auto px-4 pb-8 flex-1 w-full">
            {cloudSqlLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4 text-gray-500">
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
              />
            )}
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
            />
          </div>

          {/* Table */}
          <div className="max-w-screen-2xl mx-auto px-4 pb-8 flex-1 w-full">
            <PricingTable
              instances={filteredInstances}
              region={region}
              costPeriod={costPeriod}
              currency={currency}
              visibleColumns={visibleColumns}
              exchangeRates={exchangeRates}
            />
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/DoitLogo.svg" alt="DoiT" className="h-5" />
              <span className="text-sm">
                GCP Instance pricing comparison tool
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="https://www.doit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                doit.com
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.doit.com/cloud-analytics/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                Cloud Analytics
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/doitintl/gcp-instances"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
            This site is not maintained by or affiliated with Google. Data accuracy cannot be guaranteed.
            Pricing data sourced from the Google Cloud Billing Catalog API.
          </div>
        </div>
      </footer>
    </div>
  )
}
