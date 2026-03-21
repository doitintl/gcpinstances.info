import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '@/components/PricingTable'
import { FiltersBar } from '@/components/FiltersBar'
import type { Instance } from '@/lib/types'
import samplePricing from '../fixtures/sample-pricing.json'

// Mock useVirtualizer to render all rows in jsdom (no scrollable container)
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, i) => ({
      index: i,
      start: i * 41,
      size: 41,
      key: i,
    })),
    getTotalSize: () => count * 41,
    measureElement: () => {},
  }),
}))

const instances = samplePricing.instances as Instance[]

const defaultVisibleColumns = {
  linuxSud: true,
  linuxCud1yr: true,
  windowsSud: true,
  windowsCud1yr: true,
}

const defaultExchangeRates = { USD: 1, EUR: 0.92, GBP: 0.75, JPY: 149.5, AUD: 1.53, CAD: 1.36, DKK: 6.89, NOK: 10.55, SEK: 10.42, CHF: 0.90, ZAR: 18.63, ILS: 3.71 }

describe('PricingTable', () => {
  const defaultProps = {
    instances,
    region: 'us-central1',
    costPeriod: 'hourly' as const,
    currency: 'USD',
    visibleColumns: defaultVisibleColumns,
    exchangeRates: defaultExchangeRates,
  }

  it('renders all instance rows', () => {
    render(<PricingTable {...defaultProps} />)
    for (const inst of instances) {
      expect(screen.getByText(inst.name)).toBeTruthy()
    }
  })

  it('renders column headers', () => {
    render(<PricingTable {...defaultProps} />)
    expect(screen.getByText('Machine type')).toBeTruthy()
    expect(screen.getByText('vCPUs')).toBeTruthy()
    expect(screen.getByText('Memory')).toBeTruthy()
    expect(screen.getByText('Linux SUD cost')).toBeTruthy()
    expect(screen.getByText('Linux 1 year CUD cost')).toBeTruthy()
    expect(screen.getByText('Windows SUD cost')).toBeTruthy()
    expect(screen.getByText('Windows 1 year CUD cost')).toBeTruthy()
  })

  it('shows Unavailable for null prices', () => {
    render(<PricingTable {...defaultProps} />)
    const unavailables = screen.getAllByText('Unavailable')
    expect(unavailables.length).toBeGreaterThan(0)
  })

  it('shows prices for region with data', () => {
    render(<PricingTable {...defaultProps} />)
    // n1-standard-1 linux SUD should be ~$0.0333
    expect(screen.getByText('$0.0333')).toBeTruthy()
  })

  it('switches to monthly prices', () => {
    const { rerender } = render(<PricingTable {...defaultProps} />)
    // Hourly: $0.0333
    expect(screen.getByText('$0.0333')).toBeTruthy()

    rerender(<PricingTable {...defaultProps} costPeriod="monthly" />)
    // Monthly: 0.03325 * 730 ≈ $24.2725
    expect(screen.getByText('$24.2725')).toBeTruthy()
  })

  it('hides columns when visibility is false', () => {
    render(
      <PricingTable
        {...defaultProps}
        visibleColumns={{ ...defaultVisibleColumns, windowsSud: false, windowsCud1yr: false }}
      />,
    )
    expect(screen.queryByText('Windows SUD cost')).toBeNull()
    expect(screen.queryByText('Windows 1 year CUD cost')).toBeNull()
    expect(screen.getByText('Linux SUD cost')).toBeTruthy()
  })

  it('shows empty state when no instances', () => {
    render(<PricingTable {...defaultProps} instances={[]} />)
    expect(screen.getByText('No instances match your filters.')).toBeTruthy()
  })

  it('enables compare button when 2+ rows selected', () => {
    render(<PricingTable {...defaultProps} />)
    // Use getAllByRole since there are now two compare buttons (Compare + Compare Regions)
    const compareBtns = screen.getAllByRole('button', { name: /compare/i })
    // The first is "Compare", the second is "Compare Regions"
    const compareBtn = compareBtns[0]
    expect(compareBtn).toBeDisabled()

    // Click first two data rows (in the body table)
    const bodyRows = screen.getAllByRole('row').filter(r => r.querySelector('td'))
    fireEvent.click(bodyRows[0])
    fireEvent.click(bodyRows[1])

    expect(compareBtn).not.toBeDisabled()
  })

  it('per-column filter narrows results', () => {
    render(<PricingTable {...defaultProps} />)
    const searchInputs = screen.getAllByPlaceholderText('Search...')
    // First search input is for Machine type column
    fireEvent.change(searchInputs[0], { target: { value: 'n1-standard-1' } })
    // Only n1-standard-1 should be visible
    expect(screen.getByText('n1-standard-1')).toBeTruthy()
    expect(screen.queryByText('n2-standard-8')).toBeNull()
  })
})

describe('FiltersBar', () => {
  const defaultProps = {
    regions: ['us-central1', 'europe-west1', 'asia-east1'],
    region: 'us-central1',
    setRegion: vi.fn(),
    costPeriod: 'hourly' as const,
    setCostPeriod: vi.fn(),
    currency: 'USD',
    setCurrency: vi.fn(),
    currencies: ['USD', 'EUR', 'GBP'],
    minMemory: 0,
    setMinMemory: vi.fn(),
    minVCpus: 0,
    setMinVCpus: vi.fn(),
    globalSearch: '',
    setGlobalSearch: vi.fn(),
    visibleColumns: defaultVisibleColumns,
    setVisibleColumns: vi.fn(),
    onClearFilters: vi.fn(),
    instanceCount: 5,
    totalCount: 5,
  }

  it('renders all filter controls', () => {
    render(<FiltersBar {...defaultProps} />)
    expect(screen.getByLabelText('Region')).toBeTruthy()
    expect(screen.getByLabelText('Cost period')).toBeTruthy()
    expect(screen.getByLabelText('Currency')).toBeTruthy()
    expect(screen.getByLabelText('Min memory (GiB)')).toBeTruthy()
    expect(screen.getByLabelText('Min vCPUs')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search instances... (/)')).toBeTruthy()
  })

  it('calls setRegion when region changes', () => {
    render(<FiltersBar {...defaultProps} />)
    const select = screen.getByLabelText('Region')
    fireEvent.change(select, { target: { value: 'europe-west1' } })
    expect(defaultProps.setRegion).toHaveBeenCalledWith('europe-west1')
  })

  it('calls setGlobalSearch on input', () => {
    render(<FiltersBar {...defaultProps} />)
    const input = screen.getByPlaceholderText('Search instances... (/)')
    fireEvent.change(input, { target: { value: 'n2' } })
    expect(defaultProps.setGlobalSearch).toHaveBeenCalledWith('n2')
  })

  it('does not show Clear filters when no filters active', () => {
    render(<FiltersBar {...defaultProps} />)
    expect(screen.queryByText('Clear filters')).toBeNull()
  })

  it('shows Clear filters when search is active', () => {
    render(<FiltersBar {...defaultProps} globalSearch="n2" />)
    expect(screen.getByText('Clear filters')).toBeTruthy()
  })

  it('calls onClearFilters when Clear button clicked', () => {
    render(<FiltersBar {...defaultProps} globalSearch="n2" />)
    fireEvent.click(screen.getByText('Clear filters'))
    expect(defaultProps.onClearFilters).toHaveBeenCalled()
  })

  it('shows filtered count when instanceCount < totalCount', () => {
    render(<FiltersBar {...defaultProps} instanceCount={2} totalCount={5} />)
    expect(screen.getByText('Showing 2 of 5 instances')).toBeTruthy()
  })

  it('does not show count when all instances visible', () => {
    render(<FiltersBar {...defaultProps} instanceCount={5} totalCount={5} />)
    expect(screen.queryByText(/Showing/)).toBeNull()
  })
})
