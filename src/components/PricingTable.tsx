import { useState, useMemo, useCallback, useRef, memo } from 'react'
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
import type { Instance, CostPeriod, RegionPricing } from '../lib/types'
import { ALL_COLUMNS } from '../lib/types'
import { formatPrice, formatMemory, formatVCpus, cn } from '../lib/utils'
import { CompareDialog } from './CompareDialog'
import { ExportCsv } from './ExportCsv'
import { ArrowUpDown, ArrowUp, ArrowDown, GitCompare } from 'lucide-react'

interface Props {
  instances: Instance[]
  region: string
  costPeriod: CostPeriod
  currency: string
  visibleColumns: Record<string, boolean>
}

const columnHelper = createColumnHelper<Instance>()

const PRICING_COLS = ALL_COLUMNS.filter((c) => c.group === 'linux' || c.group === 'windows')
const SPEC_COLS = ALL_COLUMNS.filter((c) => c.group === 'spec')

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

// Memoized so only the toggled row re-renders when selectedRows changes
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
  table: ReturnType<typeof useReactTable<Instance>>
  visibleRows: ReturnType<ReturnType<typeof useReactTable<Instance>>['getRowModel']>['rows']
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
      className="overflow-auto rounded-xl border border-gray-200 shadow-sm bg-white"
      style={{ maxHeight: 'calc(100vh - 280px)' }}
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
          <tr className="border-b border-gray-100">
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
              {/* Spacer for virtual rows above viewport */}
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
              {/* Spacer for virtual rows below viewport */}
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

export function PricingTable({ instances, region, costPeriod, currency, visibleColumns }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)
  const toggleRow = useCallback((name: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  // Columns no longer depend on selectedRows — checkbox state is local to RowCheckbox
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
      header: 'Machine type',
      cell: (info) => (
        <span className="font-medium font-mono text-sm text-gray-900">{info.getValue()}</span>
      ),
      filterFn: 'includesString',
      size: 180,
    }),
    columnHelper.accessor('vCpus', {
      header: 'vCPUs',
      cell: (info) => (
        <span className="text-sm text-gray-700">{formatVCpus(info.getValue())}</span>
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
      cell: (info) => <span className="text-sm text-gray-700">{formatMemory(info.getValue())}</span>,
      filterFn: (row, _colId, filterValue) => row.original.memoryGb >= Number(filterValue || 0),
      size: 110,
    }),
    // Spec columns
    ...SPEC_COLS.map((col) =>
      columnHelper.display({
        id: col.id,
        header: col.label,
        cell: ({ row }) => {
          const inst = row.original
          const val = (inst as unknown as Record<string, unknown>)[col.id]
          if (typeof val === 'boolean') return <span className="text-sm text-gray-700">{val ? 'Yes' : 'No'}</span>
          if (typeof val === 'number') return <span className="font-mono text-sm text-gray-700">{val.toLocaleString()}</span>
          return <span className="text-sm text-gray-500">{val != null ? String(val) : 'N/A'}</span>
        },
        size: 150,
        enableColumnFilter: false,
      }),
    ),
    // Pricing columns
    ...PRICING_COLS.map((col) =>
      columnHelper.display({
        id: col.id,
        header: col.label,
        cell: ({ row }) => (
          <PriceCell value={formatPrice(row.original.pricing[region]?.[col.id as keyof RegionPricing], currency, costPeriod)} />
        ),
        size: 160,
        enableColumnFilter: false,
      }),
    ),
  ], [region, currency, costPeriod, toggleRow, selectedRows])

  const columnVisibility = useMemo(() => {
    const vis: Record<string, boolean> = {}
    for (const col of ALL_COLUMNS) {
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

  const exportInstances = useMemo(
    () => visibleRows.map((r) => r.original),
    [visibleRows],
  )

  return (
    <div className="mt-2">
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
          <ExportCsv instances={exportInstances} region={region} />
        </div>
      </div>

      {/* Table with virtual scrolling */}
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
      />
    </div>
  )
}
