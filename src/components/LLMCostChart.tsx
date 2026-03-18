import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  ALL_PROVIDERS,
  MODEL_RELEASES,
  PROVIDER_COLORS,
  buildChartSeries,
  type Provider,
} from '../data/llmPricing'

type PriceType = 'input' | 'output' | 'blended'

// Format a price value for axis ticks and tooltip
function formatPrice(v: number): string {
  if (v >= 10) return `$${v.toFixed(0)}`
  if (v >= 1) return `$${v.toFixed(2)}`
  return `$${v.toFixed(3)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

interface TooltipEntry {
  provider: Provider
  value: number
  modelName: string | null
  color: string
}

interface ChartPayload {
  name: string
  value: unknown
  payload: Record<string, unknown>
  color?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ChartPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const entries: TooltipEntry[] = payload
    .filter((p) => p.value != null && typeof p.value === 'number')
    .map((p) => {
      const provider = p.name as Provider
      const modelKey = `${provider}_model`
      const modelName = (p.payload[modelKey] as string | null) ?? null
      return { provider, value: p.value as number, modelName, color: p.color ?? '#888' }
    })

  if (!entries.length) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl max-w-xs">
      <p className="text-gray-400 mb-2 font-medium">{label ? formatDate(label) : ''}</p>
      {entries.map(({ provider, value, modelName, color }) => (
        <div key={provider} className="flex items-start gap-2 mb-1.5 last:mb-0">
          <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <span className="text-white font-semibold">{formatPrice(value)}</span>
            <span className="text-gray-400 ml-1">/ M tokens</span>
            {modelName && <p className="text-gray-300 mt-0.5">{modelName}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Custom log-scale Y-axis tick values
const LOG_TICKS = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100]

export function LLMCostChart() {
  const [priceType, setPriceType] = useState<PriceType>('input')
  const [sotaOnly, setSotaOnly] = useState(true)
  const [activeProviders, setActiveProviders] = useState<Set<Provider>>(new Set(ALL_PROVIDERS))

  const toggleProvider = (p: Provider) => {
    setActiveProviders((prev) => {
      const next = new Set(prev)
      if (next.has(p)) {
        if (next.size > 1) next.delete(p)
      } else {
        next.add(p)
      }
      return next
    })
  }

  const providers = ALL_PROVIDERS.filter((p) => activeProviders.has(p))

  const chartData = useMemo(
    () => buildChartSeries(providers, sotaOnly, priceType),
    [providers, sotaOnly, priceType],
  )

  const today = new Date().toISOString().slice(0, 10)

  // Sorted model releases for the table section
  const tableReleases = useMemo(() => {
    const filtered = sotaOnly ? MODEL_RELEASES.filter((r) => r.isSota) : MODEL_RELEASES
    return [...filtered]
      .filter((r) => activeProviders.has(r.provider))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [sotaOnly, activeProviders])

  const priceLabel =
    priceType === 'input' ? 'Input' : priceType === 'output' ? 'Output' : 'Blended (1:3 ratio)'

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Price type */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Price type</p>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
            {(['input', 'output', 'blended'] as PriceType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPriceType(t)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  priceType === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* SOTA toggle */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Models</p>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() => setSotaOnly(v)}
                className={`px-3 py-1.5 transition-colors ${
                  sotaOnly === v
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {v ? 'Flagship only' : 'All models'}
              </button>
            ))}
          </div>
        </div>

        {/* Provider filters */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Providers</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PROVIDERS.map((p) => {
              const on = activeProviders.has(p)
              return (
                <button
                  key={p}
                  onClick={() => toggleProvider(p)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    on ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'
                  }`}
                  style={on ? { backgroundColor: PROVIDER_COLORS[p] } : undefined}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{priceLabel} price per million tokens (log scale)</p>
          <p className="text-xs text-gray-400">Hover for details</p>
        </div>
        <ResponsiveContainer width="100%" height={480}>
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              scale="log"
              domain={[0.05, 150]}
              ticks={LOG_TICKS}
              tickFormatter={(v) => formatPrice(v)}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as ChartPayload[] | undefined}
                  label={props.label as string | undefined}
                />
              )}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 12, color: PROVIDER_COLORS[value as Provider] ?? '#374151' }}>
                  {value}
                </span>
              )}
            />
            {providers.map((provider) => (
              <Line
                key={provider}
                type="stepAfter"
                dataKey={provider}
                stroke={PROVIDER_COLORS[provider]}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props
                  const modelKey = `${provider}_model`
                  // Only draw a dot when this provider has a release at this exact date
                  const hasRelease = MODEL_RELEASES.some(
                    (r) => r.provider === provider && r.date === payload.date &&
                    (!sotaOnly || r.isSota),
                  )
                  if (!hasRelease || payload[provider] == null) return <g key={`dot-${provider}-${payload.date}`} />
                  return (
                    <circle
                      key={`dot-${provider}-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={PROVIDER_COLORS[provider]}
                      stroke="white"
                      strokeWidth={1.5}
                      opacity={payload[modelKey] ? 1 : 0}
                    />
                  )
                }}
                activeDot={{ r: 5, strokeWidth: 1.5, stroke: 'white' }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine
              x={today}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: 'Today', position: 'insideTopRight', fontSize: 10, fill: '#9ca3af' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model release table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Model releases</h3>
          <span className="text-xs text-gray-400">{tableReleases.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Input / M</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Output / M</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableReleases.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 font-medium"
                      style={{ color: PROVIDER_COLORS[r.provider] }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PROVIDER_COLORS[r.provider] }}
                      />
                      {r.provider}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                    {r.model}
                    {r.isSota && (
                      <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-normal">
                        flagship
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700 whitespace-nowrap">
                    {formatPrice(r.inputPricePerM)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700 whitespace-nowrap">
                    {formatPrice(r.outputPricePerM)}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs hidden md:table-cell">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center pb-2">
        Prices are USD per million tokens at launch. Open-source model prices (Meta) via Together.ai.
        Data reflects public API pricing; batch/cached/volume discounts excluded.
        Sources: official provider pricing pages. Not financial advice.
      </p>
    </div>
  )
}
