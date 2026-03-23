import { X, Search, Columns3 } from 'lucide-react'
import { useState, useRef, useEffect, type RefObject } from 'react'
import type { CostPeriod, ColumnDef } from '../lib/types'
import { ALL_COLUMNS_WITH_DERIVED } from '../lib/types'
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
      <label htmlFor={id} className="text-xs text-gray-500 font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors min-w-[120px]"
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
      <label htmlFor={id} className="text-xs text-gray-500 font-medium">{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder ?? '0'}
        className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-gray-300 transition-colors"
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
  const hasFilters = minMemory > 0 || minVCpus > 0 || globalSearch.length > 0
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Region */}
        <Select
          label="Region"
          value={region}
          onChange={setRegion}
          options={regions.map((r) => ({ value: r, label: r }))}
          className="min-w-[140px]"
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

        {/* Column visibility */}
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-gray-500 font-medium">Columns</label>
          <div className="relative" ref={colsRef}>
            <button
              onClick={() => setColsOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Columns3 className="w-4 h-4 text-gray-500" />
              Columns
            </button>
            <div className={`absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[240px] max-h-[60vh] overflow-y-auto ${colsOpen ? 'block' : 'hidden'}`}>
              {groups.map((group) => (
                <div key={group}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-2 pb-1">
                    {GROUP_LABELS[group] ?? group}
                  </div>
                  {columns.filter((c) => c.group === group).map((col) => (
                    <label key={col.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded-md">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id] ?? col.defaultVisible}
                        onChange={(e) =>
                          setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
          <label className="text-xs text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search instances... (/)"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white w-52 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-gray-300 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {instanceCount < totalCount && (
        <p className="text-xs text-gray-400 mt-2">
          Showing {instanceCount} of {totalCount} instances
        </p>
      )}
    </div>
  )
}
