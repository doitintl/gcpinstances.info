import { X, Search, Columns3, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useMemo, type RefObject } from 'react'
import type { CostPeriod, ColumnDef } from '../lib/types'
import { ALL_COLUMNS_WITH_DERIVED } from '../lib/types'
import { REGION_LOCATIONS } from '../lib/regionLocations'
import { cn } from '../lib/utils'

interface Props {
  regions: string[]
  region: string
  setRegion: (r: string) => void
  costPeriod: CostPeriod
  setCostPeriod: (p: CostPeriod) => void
  currency: string
  setCurrency: (c: string) => void
  currencies: string[]
  minMemory: number
  setMinMemory: (n: number) => void
  minVCpus: number
  setMinVCpus: (n: number) => void
  minCapacityGb?: number
  setMinCapacityGb?: (n: number) => void
  filterMode?: 'compute' | 'memorystore'
  globalSearch: string
  setGlobalSearch: (s: string) => void
  visibleColumns: Record<string, boolean>
  setVisibleColumns: (cols: Record<string, boolean>) => void
  onClearFilters: () => void
  instanceCount: number
  totalCount: number
  columns?: ColumnDef[]
  searchInputRef?: RefObject<HTMLInputElement | null>
}

const GROUP_LABELS: Record<string, string> = {
  spec: 'Instance specs',
  linux: 'Linux pricing',
  windows: 'Windows pricing',
  mysql: 'MySQL pricing',
  postgresql: 'PostgreSQL pricing',
  sqlserver: 'SQL Server pricing',
  memorystore: 'Memorystore pricing',
  derived: 'Cost efficiency',
}

const COST_PERIODS: { value: CostPeriod; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

function Select({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
  className?: string
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <label htmlFor={id} className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[120px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Searchable single-select for GCP regions. Shows "us-central1 (Iowa, US)"
 * for each entry and supports keyboard-friendly text filtering on either the
 * region id or its location.
 */
function RegionCombobox({
  regions,
  value,
  onChange,
}: {
  regions: string[]
  value: string
  onChange: (r: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape; focus search on open
  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((r) => {
      if (r.toLowerCase().includes(q)) return true
      const loc = REGION_LOCATIONS[r]
      return loc ? loc.toLowerCase().includes(q) : false
    })
  }, [regions, query])

  const selectedLabel = value
  const selectedLoc = REGION_LOCATIONS[value]

  return (
    <div className="flex flex-col gap-0.5 min-w-[220px]">
      <label htmlFor="region-combobox" className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">Region</label>
      <div className="relative" ref={containerRef}>
        <button
          id="region-combobox"
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span className="truncate text-left">
            <span className="font-mono">{selectedLabel}</span>
            {selectedLoc && (
              <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({selectedLoc})</span>
            )}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-[340px] max-h-80 flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search region or location…"
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">No regions match.</div>
              ) : (
                filtered.map((r) => {
                  const loc = REGION_LOCATIONS[r]
                  const isSelected = r === value
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onChange(r)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={cn(
                        'w-full text-left flex items-baseline gap-1 px-2 py-1.5 rounded-md whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-800',
                        isSelected && 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                      )}
                    >
                      <span className="text-sm font-mono">{r}</span>
                      {loc && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">({loc})</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: number
  onChange: (n: number) => void
  label: string
  placeholder?: string
}) {
  const id = label.toLowerCase().replace(/\s+|\(|\)/g, '-').replace(/-+/g, '-').replace(/-$/, '')
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder ?? '0'}
        className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      />
    </div>
  )
}

export function FiltersBar({
  regions,
  region,
  setRegion,
  costPeriod,
  setCostPeriod,
  currency,
  setCurrency,
  currencies,
  minMemory,
  setMinMemory,
  minVCpus,
  setMinVCpus,
  minCapacityGb,
  setMinCapacityGb,
  filterMode = 'compute',
  globalSearch,
  setGlobalSearch,
  visibleColumns,
  setVisibleColumns,
  onClearFilters,
  instanceCount,
  totalCount,
  columns = ALL_COLUMNS_WITH_DERIVED,
  searchInputRef,
}: Props) {
  const groups = Array.from(new Set(columns.map((c) => c.group)))
  const hasFilters = minMemory > 0 || minVCpus > 0 || (minCapacityGb ?? 0) > 0 || globalSearch.length > 0
  const [colsOpen, setColsOpen] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!colsOpen) return
    function handleClick(e: MouseEvent) {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) {
        setColsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [colsOpen])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Region */}
        <RegionCombobox
          regions={regions}
          value={region}
          onChange={setRegion}
        />

        {/* Cost period */}
        <Select
          label="Cost period"
          value={costPeriod}
          onChange={(v) => setCostPeriod(v as CostPeriod)}
          options={COST_PERIODS}
        />

        {/* Currency */}
        <Select
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={currencies.map((c) => ({ value: c, label: c }))}
        />

        {filterMode === 'memorystore' ? (
          <NumberInput
            label="Min capacity (GB)"
            value={minCapacityGb ?? 0}
            onChange={setMinCapacityGb ?? (() => {})}
          />
        ) : (
          <>
            {/* Min memory */}
            <NumberInput
              label="Min memory (GiB)"
              value={minMemory}
              onChange={setMinMemory}
            />

            {/* Min vCPUs */}
            <NumberInput
              label="Min vCPUs"
              value={minVCpus}
              onChange={setMinVCpus}
            />
          </>
        )}

        {/* Column visibility */}
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">Columns</label>
          <div className="relative" ref={colsRef}>
            <button
              onClick={() => setColsOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Columns3 className="w-4 h-4 text-gray-500" />
              Columns
            </button>
            <div className={`absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 min-w-[240px] max-h-[60vh] overflow-y-auto ${colsOpen ? 'block' : 'hidden'}`}>
              {groups.map((group) => (
                <div key={group}>
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 pt-2 pb-1">
                    {GROUP_LABELS[group] ?? group}
                  </div>
                  {columns.filter((c) => c.group === group).map((col) => (
                    <label key={col.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id] ?? col.defaultVisible}
                        onChange={(e) =>
                          setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{col.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex flex-col gap-0.5 self-end">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Global search */}
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search instances... (/)"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 w-52 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {instanceCount < totalCount && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Showing {instanceCount} of {totalCount} instances
        </p>
      )}
    </div>
  )
}
