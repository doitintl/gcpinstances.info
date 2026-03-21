import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingTable } from '@/components/PricingTable'
import { CloudSqlPricingTable } from '@/components/CloudSqlPricingTable'
import type { Instance, CloudSqlInstance } from '@/lib/types'
import samplePricing from '../fixtures/sample-pricing.json'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, i) => ({ index: i, start: i * 41, size: 41, key: i })),
    getTotalSize: () => count * 41,
    measureElement: () => {},
  }),
}))

const instances = samplePricing.instances as Instance[]

const defaultExchangeRates = { USD: 1, EUR: 0.92, GBP: 0.75, JPY: 149.5, AUD: 1.53, CAD: 1.36, DKK: 6.89, NOK: 10.55, SEK: 10.42, CHF: 0.90, ZAR: 18.63, ILS: 3.71 }

const defaultProps = {
  instances,
  region: 'us-central1',
  costPeriod: 'hourly' as const,
  currency: 'USD',
  visibleColumns: { linuxSud: true, linuxCud1yr: true, windowsSud: true, windowsCud1yr: true },
  exchangeRates: defaultExchangeRates,
}

describe('PricingTable tooltips', () => {
  it('renders tooltip text for Linux SUD column header', () => {
    render(<PricingTable {...defaultProps} />)
    // Tooltip text is rendered in the DOM (hidden via CSS opacity, not conditional rendering)
    const els = screen.getAllByText(/Sustained Use Discount/)
    expect(els.length).toBeGreaterThan(0)
  })

  it('renders tooltip text for Linux CUD 1yr column header', () => {
    render(<PricingTable {...defaultProps} />)
    // Two CUD tooltips rendered (1yr and 3yr are both listed in this column set via visible)
    const cudTexts = screen.getAllByText(/37% off for a 1-year commitment/)
    expect(cudTexts.length).toBeGreaterThan(0)
  })

  it('renders tooltip text for Windows SUD column header', () => {
    render(<PricingTable {...defaultProps} />)
    const sudTexts = screen.getAllByText(/Sustained Use Discount/)
    // Should have at least 2: Linux SUD + Windows SUD
    expect(sudTexts.length).toBeGreaterThanOrEqual(2)
  })
})

describe('CloudSqlPricingTable tooltips', () => {
  const sqlInstances: CloudSqlInstance[] = [
    {
      name: 'db-n1-standard-1',
      series: 'N1',
      tier: 'standard',
      edition: 'Enterprise',
      vCpus: 1,
      memoryGb: 3.75,
      pricing: {
        'us-central1': {
          mysqlZonal: 0.10,
          mysqlRegional: 0.20,
          postgresZonal: 0.10,
          postgresRegional: 0.20,
          sqlServerZonal: null,
          sqlServerRegional: null,
        },
      },
    },
  ]

  it('renders tooltip text for MySQL Zonal column header', () => {
    render(
      <CloudSqlPricingTable
        instances={sqlInstances}
        region="us-central1"
        costPeriod="hourly"
        currency="USD"
        visibleColumns={{ mysqlZonal: true, postgresZonal: true, mysqlRegional: false, postgresRegional: false, sqlServerZonal: false, sqlServerRegional: false }}
        exchangeRates={defaultExchangeRates}
      />,
    )
    const els = screen.getAllByText(/Single-zone \(no HA\)/)
    expect(els.length).toBeGreaterThan(0)
  })
})
