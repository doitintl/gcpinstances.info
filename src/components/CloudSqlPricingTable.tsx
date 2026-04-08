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
import type { CloudSqlInstance, CostPeriod, CloudSqlRegionPricing } from '../lib/types'
import { CLOUDSQL_COLUMNS, CLOUDSQL_COLUMNS_WITH_DERIVED, CLOUDSQL_DERIVED_COLUMNS } from '../lib/types'
import { formatPrice, formatMemory, formatVCpus, cn } from '../lib/utils'
import { CompareDialog } from './CompareDialog'
import { RegionCompareDialog } from './RegionCompareDialog'
import type { AnyInstance } from './CompareDialog'

const CLOUDSQL_BASE_ROWS: { label: string; get: (i: AnyInstance) => string }[] = [
  { label: 'Edition', get: (i) => (i as CloudSqlInstance).edition ?? '' },
  { label: 'vCPUs', get: (i) => formatVCpus((i as CloudSqlInstance).vCpus) },
  { label: 'Memory', get: (i) => formatMemory((i as CloudSqlInstance).memoryGb) },
  { label: 'Series', get: (i) => (i as CloudSqlInstance).series ?? '' },
  { label: 'Tier', get: (i) => (i as CloudSqlInstance).tier ?? '' },
]
import { ExportCsv } from './ExportCsv'
import { TooltipIcon } from './TooltipIcon'
import { ArrowUpDown, ArrowUp, ArrowDown, GitCompare, MapPin } from 'lucide-react'

interface Props {
  instances: CloudSqlInstance[]
  region: string
  costPeriod: CostPeriod
  currency: string
  visibleColumns: Record<string, boolean>
  exchangeRates: Record<string, number>
  allRegions?: string[]
}

const columnHelper = createColumnHelper<CloudSqlInstance>()

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="w-3 h-3 ml-1 inline-block" />
  if (isSorted === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline-block" />
  return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40" />
}

function PriceCell({ value }: { value: string }) {
  const isUnavailable = value === 'Unavailable'
  return (
    <span className={cn('font-mono text-sm tabular-nums dark:text-gray-100', isUnavailable && 'text-gray-500 dark:text-gray-500 not-italic')}>
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
  table: ReturnType<typeof useReactTable<CloudSqlInstance>>
  visibleRows: ReturnType<ReturnType<typeof useReactTable<CloudSqlInstance>>['getRowModel']>['rows']
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
      className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 flex-1 min-h-0"
    >
      <table className="min-w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {table.getFlatHeaders().map((header) => (
              <th
                key={header.id}
                scope="col"
                className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap bg-gray-50 dark:bg-gray-800"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder ? null : (
                  <div
                    className={cn('flex items-center', header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white')}
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
          <tr className="sticky z-10 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" style={{ top: '41px' }}>
            {table.getFlatHeaders().map((header) => (
              <th key={`filter-${header.id}`} className="px-3 py-1.5 bg-white dark:bg-gray-900">
                {header.column.getCanFilter() ? (
                  <input
                    value={(header.column.getFilterValue() as string) ?? ''}
                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={table.getFlatHeaders().length} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
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
                      'hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer',
                      idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/40',
                      selectedRows.has(row.original.name) && 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-400',
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

export function CloudSqlPricingTable({ instances, region, costPeriod, currency, visibleColumns, exchangeRates, allRegions = [] }: Props) {
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
        <span className="font-medium font-mono text-sm text-gray-900 dark:text-gray-100">{info.getValue()}</span>
      ),
      filterFn: 'includesString',
      size: 200,
    }),
    columnHelper.accessor('edition', {
      header: 'Edition',
      cell: (info) => {
        const edition = info.getValue()
        const isPlus = edition === 'Enterprise Plus'
        return (
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
            isPlus
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600',
          )}>
            {edition}
          </span>
        )
      },
      filterFn: 'includesString',
      enableSorting: false,
      size: 140,
    }),
    columnHelper.accessor('vCpus', {
      header: 'vCPUs',
      cell: (info) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">{formatVCpus(info.getValue())}</span>
      ),
      filterFn: (row, _colId, filterValue) => {
        const vCpus = row.original.vCpus
        if (typeof vCpus !== 'number') return true
        return vCpus >= Number(filterValue || 0)
      },
      sortingFn: (a, b) => {
        const av = a.original.vCpus === 'shared' ? -1 : a.original.vCpus
        const bv = b.original.vCpus === 'shared' ? -1 : b.original.vCpus
        return av - bv
      },
      size: 90,
    }),
    columnHelper.accessor('memoryGb', {
      header: 'Memory',
      cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-200">{formatMemory(info.getValue())}</span>,
      filterFn: (row, _colId, filterValue) => row.original.memoryGb >= Number(filterValue || 0),
      size: 110,
    }),
    // Pricing columns
    ...CLOUDSQL_COLUMNS.map((col) =>
      columnHelper.accessor((row) => row.pricing[region]?.[col.id as keyof CloudSqlRegionPricing] ?? undefined, {
        id: col.id,
        header: col.tooltip ? () => <>{col.label}<TooltipIcon text={col.tooltip!} /></> : col.label,
        cell: ({ row }) => (
          <PriceCell value={formatPrice(row.original.pricing[region]?.[col.id as keyof CloudSqlRegionPricing], currency, costPeriod, exchangeRates)} />
        ),
        filterFn: (row, _colId, filterValue) => {
          if (!filterValue) return true
          const price = row.original.pricing[region]?.[col.id as keyof CloudSqlRegionPricing]
          const s = formatPrice(price, currency, costPeriod, exchangeRates).toLowerCase()
          return s.includes(String(filterValue).toLowerCase())
        },
        sortUndefined: 'last',
        size: 200,
      }),
    ),
    // Derived columns: $/vCPU and $/GB
    ...CLOUDSQL_DERIVED_COLUMNS.map((col) => {
      const isPerVcpu = col.id.endsWith('_perVcpu')
      const baseId = isPerVcpu ? col.id.slice(0, -8) : col.id.slice(0, -6)
      return columnHelper.accessor(
        (row) => {
          if (row.vCpus === 'shared') return undefined
          const price = row.pricing[region]?.[baseId as keyof CloudSqlRegionPricing]
          if (price == null) return undefined
          const divisor = isPerVcpu ? (row.vCpus as number) : row.memoryGb
          return divisor > 0 ? price / divisor : undefined
        },
        {
          id: col.id,
          header: col.tooltip ? () => <>{col.label}<TooltipIcon text={col.tooltip!} /></> : col.label,
          cell: ({ getValue }) => {
            const v = getValue()
            return <PriceCell value={v == null ? 'Unavailable' : formatPrice(v, currency, costPeriod, exchangeRates)} />
          },
          filterFn: (row, _colId, filterValue) => {
            if (!filterValue) return true
            const v = row.original.vCpus === 'shared' ? undefined : (() => {
              const price = row.original.pricing[region]?.[baseId as keyof CloudSqlRegionPricing]
              if (price == null) return undefined
              const d = isPerVcpu ? (row.original.vCpus as number) : row.original.memoryGb
              return d > 0 ? price / d : undefined
            })()
            const s = v == null ? 'unavailable' : formatPrice(v, currency, costPeriod, exchangeRates).toLowerCase()
            return s.includes(String(filterValue).toLowerCase())
          },
          sortUndefined: 'last',
          size: 200,
        },
      )
    }),
  ], [region, currency, costPeriod, exchangeRates, toggleRow, selectedRows])

  const columnVisibility = useMemo(() => {
    const vis: Record<string, boolean> = {}
    for (const col of CLOUDSQL_COLUMNS_WITH_DERIVED) {
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
        inst.edition,
        inst.series,
        inst.tier,
        inst.vCpus,
        inst.memoryGb,
        p.mysqlZonal ?? '',
        p.mysqlRegional ?? '',
        p.postgresZonal ?? '',
        p.postgresRegional ?? '',
        p.sqlServerZonal ?? '',
        p.sqlServerRegional ?? '',
        p.mysqlZonalCud1yr ?? '',
        p.mysqlRegionalCud1yr ?? '',
        p.postgresZonalCud1yr ?? '',
        p.postgresRegionalCud1yr ?? '',
        p.sqlServerZonalCud1yr ?? '',
        p.sqlServerRegionalCud1yr ?? '',
        p.mysqlZonalCud3yr ?? '',
        p.mysqlRegionalCud3yr ?? '',
        p.postgresZonalCud3yr ?? '',
        p.postgresRegionalCud3yr ?? '',
        p.sqlServerZonalCud3yr ?? '',
        p.sqlServerRegionalCud3yr ?? '',
      ]
    })
  }, [visibleRows, region])

  return (
    <div className="mt-2 h-full flex flex-col min-h-0">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {visibleRows.length} instances
          {selectedRows.size > 0 && (
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">({selectedRows.size} selected)</span>
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
            filename={`gcp-cloudsql-${region}.csv`}
            headers={['Instance type', 'Edition', 'Series', 'Tier', 'vCPUs', 'Memory (GiB)', 'MySQL Zonal ($/hr)', 'MySQL Regional ($/hr)', 'PostgreSQL Zonal ($/hr)', 'PostgreSQL Regional ($/hr)', 'SQL Server Zonal ($/hr)', 'SQL Server Regional ($/hr)', 'MySQL Zonal CUD1yr', 'MySQL Regional CUD1yr', 'PostgreSQL Zonal CUD1yr', 'PostgreSQL Regional CUD1yr', 'SQL Server Zonal CUD1yr', 'SQL Server Regional CUD1yr', 'MySQL Zonal CUD3yr', 'MySQL Regional CUD3yr', 'PostgreSQL Zonal CUD3yr', 'PostgreSQL Regional CUD3yr', 'SQL Server Zonal CUD3yr', 'SQL Server Regional CUD3yr']}
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
        columns={CLOUDSQL_COLUMNS}
        baseRows={CLOUDSQL_BASE_ROWS}
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
        columns={CLOUDSQL_COLUMNS}
      />
    </div>
  )
}
