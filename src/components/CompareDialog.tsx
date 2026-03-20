import { X } from 'lucide-react'
import type { Instance, CostPeriod, RegionPricing, ColumnDef, CloudSqlInstance, CloudSqlRegionPricing } from '../lib/types'
import { ALL_COLUMNS } from '../lib/types'
import { formatPrice, formatMemory, formatVCpus } from '../lib/utils'

export type AnyInstance = Instance | CloudSqlInstance

interface Props {
  open: boolean
  onClose: () => void
  instances: AnyInstance[]
  region: string
  currency: string
  costPeriod: CostPeriod
  exchangeRates: Record<string, number>
  columns?: ColumnDef[]
  baseRows?: { label: string; get: (i: AnyInstance) => string }[]
}

const CE_BASE_ROWS: { label: string; get: (i: AnyInstance) => string }[] = [
  { label: 'vCPUs', get: (i) => formatVCpus(i.vCpus) },
  { label: 'Memory', get: (i) => formatMemory(i.memoryGb) },
  { label: 'Series', get: (i) => i.series },
  { label: 'Family', get: (i) => (i as Instance).family ?? '' },
  { label: 'CPU Type', get: (i) => (i as Instance).cpuType ?? 'N/A' },
  { label: 'Local SSD', get: (i) => (i as Instance).localSsd ? 'Yes' : 'No' },
  { label: 'GPU support', get: (i) => (i as Instance).gpuSupport ? 'Yes' : 'No' },
]


export function CompareDialog({
  open,
  onClose,
  instances,
  region,
  currency,
  costPeriod,
  exchangeRates,
  columns = ALL_COLUMNS,
  baseRows = CE_BASE_ROWS,
}: Props) {
  if (!open) return null

  const pricingCols = columns.filter(
    (c) => c.group === 'linux' || c.group === 'windows' ||
           c.group === 'mysql' || c.group === 'postgresql' || c.group === 'sqlserver',
  )

  const pricingRows = pricingCols.map((col) => ({
    label: col.label.replace(' cost', ''),
    get: (i: AnyInstance) => {
      const regionPricing = i.pricing[region] as (RegionPricing & CloudSqlRegionPricing) | undefined
      return formatPrice(regionPricing?.[col.id as keyof (RegionPricing & CloudSqlRegionPricing)], currency, costPeriod, exchangeRates)
    },
  }))

  const rows = [...baseRows, ...pricingRows]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Compare Instances</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 pb-3 pr-6 w-36">Attribute</th>
                {instances.map((inst) => (
                  <th key={inst.name} className="text-left pb-3 px-4">
                    <span className="font-mono text-sm font-semibold text-gray-900">{inst.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-6 text-sm text-gray-500 font-medium">{row.label}</td>
                  {instances.map((inst) => {
                    const val = row.get(inst)
                    const isUnavailable = val === 'Unavailable'
                    return (
                      <td key={inst.name} className="py-2.5 px-4">
                        <span className={`font-mono text-sm ${isUnavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                          {val}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
