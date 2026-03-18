import { useState, useEffect, useMemo, useCallback } from 'react'
import type { PricingData, CostPeriod } from './lib/types'
import { CURRENCIES, DEFAULT_VISIBLE_COLUMNS } from './lib/types'
import { PricingTable } from './components/PricingTable'
import { FiltersBar } from './components/FiltersBar'
import { Cloud, ExternalLink, Github } from 'lucide-react'

const CURRENCY_KEYS = Object.keys(CURRENCIES)

export default function App() {
  const [data, setData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [region, setRegion] = useState('us-central1')
  const [costPeriod, setCostPeriod] = useState<CostPeriod>('hourly')
  const [currency, setCurrency] = useState('USD')
  const [minMemory, setMinMemory] = useState(0)
  const [minVCpus, setMinVCpus] = useState(0)
  const [globalSearch, setGlobalSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLUMNS)

  useEffect(() => {
    fetch('/data/pricing.json')
      .then((r) => r.json())
      .then((d: PricingData) => {
        setData(d)
        if (d.regions.includes('us-central1')) setRegion('us-central1')
        else if (d.regions.length) setRegion(d.regions[0])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

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

  const formattedDate = useMemo(() => data ? new Date(data.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '', [data])

  const handleClearFilters = useCallback(() => {
    setMinMemory(0)
    setMinVCpus(0)
    setGlobalSearch('')
  }, [])

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
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">GCP Instances</span>
            <span className="text-gray-500 text-sm">powered by</span>
            <img src="/DoitLogo.svg" alt="DoiT" className="h-5" />
          </div>
          <div className="text-xs text-gray-400">
            Last updated: {formattedDate}
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
        />
      </div>

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
