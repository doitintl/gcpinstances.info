import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import type { Instance, CloudSqlInstance, MemorystoreInstance, AlloyDbInstance, CostPeriod, RegionPricing, CloudSqlRegionPricing, MemorystoreRegionPricing, AlloyDbRegionPricing, ColumnDef } from '../lib/types'
import { formatPrice, formatMemory, formatVCpus } from '../lib/utils'
import { REGION_LOCATIONS } from '../lib/regionLocations'

type AnyInstance = Instance | CloudSqlInstance | MemorystoreInstance | AlloyDbInstance

interface Props {
  open: boolean
  onClose: () => void
  instances: AnyInstance[]
  allRegions: string[]
  initialRegion: string
  /**
   * Optional default set of regions to pre-select when the dialog opens.
   * Regions not present in `allRegions` are ignored. If none of the given
   * regions are available, falls back to `initialRegion`.
   */
  defaultRegions?: string[]
  currency: string
  costPeriod: CostPeriod
  exchangeRates: Record<string, number>
  columns: ColumnDef[]
}

function getPricingValue(
  inst: AnyInstance,
  region: string,
  colId: string,
): number | null | undefined {
  const pricing = inst.pricing[region] as (RegionPricing & CloudSqlRegionPricing & MemorystoreRegionPricing & AlloyDbRegionPricing) | undefined
  return pricing?.[colId as keyof (RegionPricing & CloudSqlRegionPricing & MemorystoreRegionPricing)]
}

export function RegionCompareDialog({
  open,
  onClose,
  instances,
  allRegions,
  initialRegion,
  defaultRegions,
  currency,
  costPeriod,
  exchangeRates,
  columns,
}: Props) {
  // Compute the initial region selection: intersection of `defaultRegions`
  // with `allRegions`, falling back to a fixed set of three geographically-
  // spread regions (US, Europe, APAC) and finally to `initialRegion`.
  const FALLBACK_DEFAULT_REGIONS = ['us-central1', 'europe-west1', 'asia-southeast1']
  const resolveInitialSelection = (): string[] => {
    const candidates = defaultRegions && defaultRegions.length > 0
      ? defaultRegions
      : FALLBACK_DEFAULT_REGIONS
    const available = candidates.filter((r) => allRegions.includes(r))
    if (available.length > 0) return available
    return [initialRegion]
  }

  const [selectedRegions, setSelectedRegions] = useState<string[]>(resolveInitialSelection)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Reset selected regions when dialog opens
  useEffect(() => {
    if (open) setSelectedRegions(resolveInitialSelection())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialRegion, defaultRegions?.join(',')])

  // Close the region dropdown when clicking outside of its toggle/panel
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // Escape closes dialog
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const pricingCols = columns.filter(
    (c) => c.group === 'linux' || c.group === 'windows' ||
           c.group === 'mysql' || c.group === 'postgresql' || c.group === 'sqlserver',
  )

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Compare by Region</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region selector */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Regions:</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {selectedRegions.length === 0
                ? 'Select regions…'
                : `${selectedRegions.length} region${selectedRegions.length > 1 ? 's' : ''} selected`}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-[340px] max-h-72 overflow-y-auto">
                {allRegions.map((r) => {
                  const loc = REGION_LOCATIONS[r]
                  return (
                    <label
                      key={r}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md whitespace-nowrap"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRegions.includes(r)}
                        onChange={() => toggleRegion(r)}
                        className="shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-mono shrink-0">{r}</span>
                      {loc && <span className="text-xs text-gray-400 truncate">({loc})</span>}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedRegions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
              >
                {r}
                <button
                  onClick={() => toggleRegion(r)}
                  className="hover:text-blue-900"
                  aria-label={`Remove ${r}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tables */}
        <div className="overflow-auto flex-1 px-6 py-4 space-y-6">
          {selectedRegions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Select at least one region to compare.</p>
          ) : instances.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No instances selected.</p>
          ) : (
            instances.map((inst) => {
              return (
                <div key={inst.name}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 font-mono">{inst.name}</h3>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 pr-4 pl-2 w-48">
                          Pricing field
                        </th>
                        {selectedRegions.map((r) => {
                          const loc = REGION_LOCATIONS[r]
                          return (
                            <th key={r} className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide py-2 px-4 font-mono whitespace-nowrap">
                              <span>{r}</span>
                              {loc && (
                                <span className="ml-1 text-[10px] font-normal normal-case text-gray-400 tracking-normal">
                                  ({loc})
                                </span>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Spec rows */}
                      <tr className="hover:bg-gray-50">
                        <td className="py-2 pr-4 pl-2 text-xs text-gray-500 font-medium">vCPUs</td>
                        {selectedRegions.map((r) => (
                          <td key={r} className="py-2 px-4 font-mono text-xs text-gray-700">
                            {'vCpus' in inst && inst.vCpus != null ? formatVCpus(inst.vCpus as number | 'shared') : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-2 pr-4 pl-2 text-xs text-gray-500 font-medium">Memory</td>
                        {selectedRegions.map((r) => (
                          <td key={r} className="py-2 px-4 font-mono text-xs text-gray-700">
                            {'memoryGb' in inst && inst.memoryGb != null ? formatMemory(inst.memoryGb as number) : '—'}
                          </td>
                        ))}
                      </tr>
                      {/* Pricing rows */}
                      {pricingCols.map((col) => {
                        // Find minimum non-null price across selected regions
                        const prices = selectedRegions.map((r) => getPricingValue(inst, r, col.id))
                        const validPrices = prices.filter((p): p is number => typeof p === 'number')
                        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null

                        return (
                          <tr key={col.id} className="hover:bg-gray-50">
                            <td className="py-2 pr-4 pl-2 text-xs text-gray-500 font-medium">
                              {col.label.replace(' cost', '')}
                            </td>
                            {selectedRegions.map((r, ri) => {
                              const raw = prices[ri]
                              const isMin = minPrice !== null && raw === minPrice && validPrices.length > 1
                              const formatted = formatPrice(raw, currency, costPeriod, exchangeRates)
                              const isUnavailable = formatted === 'Unavailable'
                              return (
                                <td
                                  key={r}
                                  className={`py-2 px-4 font-mono text-xs ${
                                    isUnavailable
                                      ? 'text-gray-400'
                                      : isMin
                                        ? 'bg-green-50 text-green-700 font-semibold'
                                        : 'text-gray-900'
                                  }`}
                                >
                                  {formatted}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
