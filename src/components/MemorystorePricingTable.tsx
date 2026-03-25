import { useState, useMemo, useCallback, useRef, memo, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { MemorystoreInstance, CostPeriod, MemorystoreRegionPricing } from '../lib/types'
import { MEMORYSTORE_COLUMNS, MEMORYSTORE_COLUMNS_WITH_DERIVED } from '../lib/types'
import { formatPrice, cn } from '../lib/utils'
import { CompareDialog } from './CompareDialog'
import { RegionCompareDialog } from './RegionCompareDialog'
import type { AnyInstance } from './CompareDialog'

const MEMORYSTORE_BASE_ROWS: { label: string; get: (i: AnyInstance) => string }[] = [
  { label: 'Product', get: (i) => (i as MemorystoreInstance).product ?? '' },
  { label: 'Node Type', get: (i) => (i as MemorystoreInstance).nodeType ?? '' },
  { label: 'Capacity (GB)', get: (i) => {
    const cap = (i as MemorystoreInstance).capacityGb
    return cap != null ? `${cap} GB` : 'N/A'
  }},
  { label: 'vCPUs', get: (i) => {
    const v = (i as MemorystoreInstance).vCpus
    return v === 'shared' ? 'shared' : v != null ? `${v}` : 'N/A'
  }},
  { label: 'Memory', get: (i) => {
    const m = (i as MemorystoreInstance).memoryGb
    return m != null ? `${m} GiB` : 'N/A'
  }},
  { label: 'Pricing Unit', get: (i) => (i as MemorystoreInstance).pricingUnit ?? '' },
]
import { ExportCsv } from './ExportCsv'
import { TooltipIcon } from './TooltipIcon'
import { ArrowUpDown, ArrowUp, ArrowDown, GitCompare, MapPin } from 'lucide-react'

interface Props {
  instances: MemorystoreInstance[]
  region: string
  costPeriod: CostPeriod
  currency: string
  visibleColumns: Record<string, boolean>
  exchangeRates: Record<string, number>
  allRegions?: string[]
}

const columnHelper = createColumnHelper<MemorystoreInstance>()

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="w-3 h-3 ml-1 inline-block" />
  if (isSorted === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline-block" />
  return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40" />
}

function PriceCell({ value }: { value: string }) {
  const isUnavailable = value === 'Unavailable'
  return (
    <span className={cn('font-mono text-sm tabular-nums', isUnavailable && 'text-gray-400 not-italic')}>
      {value}
    </span>
  )
}

const RowCheckbox = memo(function RowCheckbox({ name, isSelected, toggle }: {
  name: string
  isSelected: boolean
  toggle: (name: string) => void
}) {
  const handleChange = useCallback(() => toggle(name), [name, toggle])
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={handleChange}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      aria-label={`Select ${name}`}
    />
  )
})

const ROW_HEIGHT = 41

function VirtualTable({
  table,
  visibleRows,
  selectedRows,
  toggleRow,
}: {
  table: ReturnType<typeof useReactTable<MemorystoreInstance>>
  visibleRows: ReturnType<ReturnType<typeof useReactTable<MemorystoreInstance>>['getRowModel']>['rows']
  selectedRows: Set<string>
  toggleRow: (name: string) => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })

  return (
    <div
      ref={parentRef}
      className="overflow-auto rounded-xl border border-gray-200 shadow-sm bg-white flex-1 min-h-0"
    >
      <table className="min-w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 border-b border-gray-200">
            {table.getFlatHeaders().map((header) => (
              <th
                key={header.id}
                className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap bg-gray-50"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder ? null : (
                  <div
                    className={cn('flex items-center', header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-900')}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon isSorted={header.column.getIsSorted()} />
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
          <tr className="sticky z-10 border-b border-gray-100 bg-white" style={{ top: '41px' }}>
            {table.getFlatHeaders().map((header) => (
              <th key={`filter-${header.id}`} className="px-3 py-1.5 bg-white">
                {header.column.getCanFilter() ? (
                  <input
                    value={(header.column.getFilterValue() as string) ?? ''}
                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={table.getFlatHeaders().length} className="px-4 py-12 text-center text-gray-400 text-sm">
                No instances match your filters.
              </td>
            </tr>
          ) : (
            <>
              {virtualizer.getVirtualItems().length > 0 && virtualizer.getVirtualItems()[0].start > 0 && (
                <tr><td colSpan={table.getFlatHeaders().length} style={{ height: virtualizer.getVirtualItems()[0].start, padding: 0 }} /></tr>
              )}
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = visibleRows[virtualRow.index]
                const idx = virtualRow.index
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={cn(
                      'hover:bg-blue-50 transition-colors cursor-pointer',
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                      selectedRows.has(row.original.name) && 'bg-blue-50 border-l-2 border-l-blue-400',
                    )}
                    onClick={() => toggleRow(row.original.name)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2.5 text-sm"
                        onClick={cell.column.id === 'select' ? (e) => e.stopPropagation() : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {virtualizer.getVirtualItems().length > 0 && (
                <tr><td colSpan={table.getFlatHeaders().length} style={{
                  height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.start ?? 0) - (virtualizer.getVirtualItems().at(-1)?.size ?? 0),
                  padding: 0,
                }} /></tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function MemorystorePricingTable({ instances, region, costPeriod, currency, visibleColumns, exchangeRates, allRegions = [] }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const [regionCompareOpen, setRegionCompareOpen] = useState(false)

  useEffect(() => { setSelectedRows(new Set()) }, [region])

  const toggleRow = useCallback((name: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: () => null,
      cell: ({ row }) => (
        <RowCheckbox name={row.original.name} isSelected={selectedRows.has(row.original.name)} toggle={toggleRow} />
      ),
      size: 36,
      enableSorting: false,
    }),
    columnHelper.accessor('name', {
      header: 'Instance type',
      cell: (info) => (
        <span className="font-medium font-mono text-sm text-gray-900">{info.getValue()}</span>
      ),
      filterFn: 'includesString',
      size: 260,
    }),
    columnHelper.accessor('product', {
      header: 'Product',
      cell: (info) => {
        const product = info.getValue()
        const colorMap: Record<string, string> = {
          'Redis': 'bg-red-100 text-red-700',
          'Redis Cluster': 'bg-orange-100 text-orange-700',
          'Valkey': 'bg-blue-100 text-blue-700',
        }
        return (
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
            colorMap[product] ?? 'bg-gray-100 text-gray-600',
          )}>
            {product}
          </span>
        )
      },
      filterFn: 'includesString',
      enableSorting: false,
      size: 130,
    }),
    columnHelper.accessor('nodeType', {
      header: 'Type',
      cell: (info) => <span className="text-sm text-gray-700">{info.getValue()}</span>,
      filterFn: 'includesString',
      size: 150,
    }),
    columnHelper.accessor('capacityGb', {
      header: 'Capacity (GB)',
      cell: (info) => {
        const v = info.getValue()
        return <span className="text-sm text-gray-700">{v != null ? `${v}` : '—'}</span>
      },
      sortUndefined: 'last',
      size: 110,
    }),
    columnHelper.accessor('vCpus', {
      header: 'vCPUs',
      cell: (info) => {
        const v = info.getValue()
        return <span className="text-sm text-gray-700">{v === 'shared' ? 'shared' : v != null ? `${v}` : '—'}</span>
      },
      sortingFn: (a, b) => {
        const av = a.original.vCpus === 'shared' ? -1 : a.original.vCpus ?? -2
        const bv = b.original.vCpus === 'shared' ? -1 : b.original.vCpus ?? -2
        return av - bv
      },
      size: 80,
    }),
    columnHelper.accessor('memoryGb', {
      header: 'Memory',
      cell: (info) => {
        const v = info.getValue()
        return <span className="text-sm text-gray-700">{v != null ? `${v} GiB` : '—'}</span>
      },
      sortUndefined: 'last',
      size: 100,
    }),
    columnHelper.accessor('pricingUnit', {
      header: 'Unit',
      cell: (info) => <span className="text-xs text-gray-500">{info.getValue()}</span>,
      enableSorting: false,
      size: 80,
    }),
    // Pricing columns
    ...MEMORYSTORE_COLUMNS.map((col) =>
      columnHelper.accessor((row) => row.pricing[region]?.[col.id as keyof MemorystoreRegionPricing] ?? undefined, {
        id: col.id,
        header: col.tooltip ? () => <>{col.label}<TooltipIcon text={col.tooltip!} /></> : col.label,
        cell: ({ row }) => (
          <PriceCell value={formatPrice(row.original.pricing[region]?.[col.id as keyof MemorystoreRegionPricing], currency, costPeriod, exchangeRates)} />
        ),
        filterFn: (row, _colId, filterValue) => {
          if (!filterValue) return true
          const price = row.original.pricing[region]?.[col.id as keyof MemorystoreRegionPricing]
          const s = formatPrice(price, currency, costPeriod, exchangeRates).toLowerCase()
          return s.includes(String(filterValue).toLowerCase())
        },
        sortUndefined: 'last',
        size: 200,
      }),
    ),
  ], [region, currency, costPeriod, exchangeRates, toggleRow, selectedRows])

  const columnVisibility = useMemo(() => {
    const vis: Record<string, boolean> = {}
    for (const col of MEMORYSTORE_COLUMNS_WITH_DERIVED) {
      vis[col.id] = visibleColumns[col.id] ?? col.defaultVisible
    }
    return vis
  }, [visibleColumns])

  const table = useReactTable({
    data: instances,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const selectedInstances = useMemo(
    () => instances.filter((i) => selectedRows.has(i.name)),
    [instances, selectedRows],
  )

  const visibleRows = table.getRowModel().rows

  const getExportRows = useCallback(() => {
    return visibleRows.map((r) => {
      const inst = r.original
      const p = inst.pricing[region] ?? {}
      return [
        inst.name,
        inst.product,
        inst.nodeType,
        inst.capacityGb ?? '',
        inst.vCpus ?? '',
        inst.memoryGb ?? '',
        inst.pricingUnit,
        p.onDemand ?? '',
        p.cud1yr ?? '',
        p.cud3yr ?? '',
      ]
    })
  }, [visibleRows, region])

  return (
    <div className="mt-2 h-full flex flex-col min-h-0">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm text-gray-500">
          {visibleRows.length} instances
          {selectedRows.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">({selectedRows.size} selected)</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareOpen(true)}
            disabled={selectedRows.size < 2}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
              selectedRows.size >= 2
                ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            <GitCompare className="w-4 h-4" />
            Compare {selectedRows.size > 0 ? `(${selectedRows.size})` : ''}
          </button>
          <button
            onClick={() => setRegionCompareOpen(true)}
            disabled={selectedRows.size < 1}
            title="Compare selected instances across regions"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
              selectedRows.size >= 1
                ? 'border-green-600 text-green-600 hover:bg-green-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            <MapPin className="w-4 h-4" />
            Compare Regions {selectedRows.size > 0 ? `(${selectedRows.size})` : ''}
          </button>
          <ExportCsv
            filename={`gcp-memorystore-${region}.csv`}
            headers={['Instance type', 'Product', 'Node Type', 'Capacity (GB)', 'vCPUs', 'Memory (GiB)', 'Pricing Unit', 'On Demand ($/unit)', 'CUD 1yr ($/unit)', 'CUD 3yr ($/unit)']}
            getRows={getExportRows}
          />
        </div>
      </div>

      <VirtualTable
        table={table}
        visibleRows={visibleRows}
        selectedRows={selectedRows}
        toggleRow={toggleRow}
      />

      <CompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        instances={selectedInstances}
        region={region}
        currency={currency}
        costPeriod={costPeriod}
        exchangeRates={exchangeRates}
        columns={MEMORYSTORE_COLUMNS}
        baseRows={MEMORYSTORE_BASE_ROWS}
      />

      <RegionCompareDialog
        open={regionCompareOpen}
        onClose={() => setRegionCompareOpen(false)}
        instances={selectedInstances}
        allRegions={allRegions}
        initialRegion={region}
        currency={currency}
        costPeriod={costPeriod}
        exchangeRates={exchangeRates}
        columns={MEMORYSTORE_COLUMNS}
      />
    </div>
  )
}
