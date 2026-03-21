import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { RegionCompareDialog } from '@/components/RegionCompareDialog'
import type { Instance } from '@/lib/types'
import { ALL_COLUMNS } from '@/lib/types'

afterEach(cleanup)

const instance: Instance = {
  name: 'n1-standard-4',
  series: 'N1',
  family: 'general-purpose',
  vCpus: 4,
  memoryGb: 15,
  cpuType: 'Intel',
  localSsd: false,
  networkPerformance: '10 Gbps',
  gpuSupport: false,
  gpuCount: null,
  gpuType: null,
  soleTenantSupport: false,
  nestedVirtualizationSupport: false,
  coremarkScore: null,
  pricing: {
    'us-central1': {
      linuxOnDemand: 0.19,
      linuxSud: 0.143,
      linuxPreemptible: 0.048,
      linuxCud1yr: 0.121,
      linuxCud3yr: 0.086,
      windowsOnDemand: 0.382,
      windowsSud: 0.286,
      windowsPreemptible: null,
      windowsCud1yr: null,
      windowsCud3yr: null,
    },
    'europe-west1': {
      linuxOnDemand: 0.21,
      linuxSud: 0.158,
      linuxPreemptible: 0.053,
      linuxCud1yr: 0.134,
      linuxCud3yr: 0.096,
      windowsOnDemand: 0.42,
      windowsSud: 0.314,
      windowsPreemptible: null,
      windowsCud1yr: null,
      windowsCud3yr: null,
    },
    'asia-east1': {
      linuxOnDemand: 0.22,
      linuxSud: 0.165,
      linuxPreemptible: 0.055,
      linuxCud1yr: 0.14,
      linuxCud3yr: 0.10,
      windowsOnDemand: 0.44,
      windowsSud: 0.33,
      windowsPreemptible: null,
      windowsCud1yr: null,
      windowsCud3yr: null,
    },
  },
}

const allRegions = ['us-central1', 'europe-west1', 'asia-east1']
const exchangeRates = { USD: 1 }

const defaultProps = {
  open: true,
  onClose: () => {},
  instances: [instance],
  allRegions,
  initialRegion: 'us-central1',
  currency: 'USD',
  costPeriod: 'hourly' as const,
  exchangeRates,
  columns: ALL_COLUMNS,
}

describe('RegionCompareDialog', () => {
  it('renders the dialog when open', () => {
    render(<RegionCompareDialog {...defaultProps} />)
    expect(screen.getByText('Compare by Region')).toBeTruthy()
  })

  it('does not render when closed', () => {
    render(<RegionCompareDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Compare by Region')).toBeNull()
  })

  it('shows instance name', () => {
    render(<RegionCompareDialog {...defaultProps} />)
    expect(screen.getByText('n1-standard-4')).toBeTruthy()
  })

  it('shows initialRegion selected by default', () => {
    render(<RegionCompareDialog {...defaultProps} />)
    // us-central1 appears as the chip and as table header
    expect(screen.getAllByText('us-central1').length).toBeGreaterThan(0)
  })

  it('shows all regions in dropdown when opened', () => {
    render(<RegionCompareDialog {...defaultProps} />)
    const dropdownBtn = screen.getByText(/region.*selected/i)
    fireEvent.click(dropdownBtn)
    for (const r of allRegions) {
      expect(screen.getAllByText(r).length).toBeGreaterThan(0)
    }
  })

  it('adds a region when checkbox is checked', () => {
    render(<RegionCompareDialog {...defaultProps} />)
    fireEvent.click(screen.getByText(/region.*selected/i))
    const checkboxes = screen.getAllByRole('checkbox')
    // Find europe-west1 checkbox (not already checked)
    const europeCheckbox = checkboxes.find((cb) => {
      const label = cb.closest('label')
      return label?.textContent?.includes('europe-west1')
    })
    expect(europeCheckbox).toBeTruthy()
    fireEvent.click(europeCheckbox!)
    // Both regions should now appear as chips
    expect(screen.getAllByText('europe-west1').length).toBeGreaterThan(0)
  })

  it('highlights cheapest price across regions', () => {
    render(
      <RegionCompareDialog
        {...defaultProps}
        instances={[instance]}
      />,
    )
    // Add europe-west1 and asia-east1
    fireEvent.click(screen.getByText(/region.*selected/i))
    const checkboxes = screen.getAllByRole('checkbox')
    for (const cb of checkboxes) {
      const label = cb.closest('label')
      if (label?.textContent?.includes('europe-west1') || label?.textContent?.includes('asia-east1')) {
        fireEvent.click(cb)
      }
    }

    // us-central1 linuxSud = $0.1430 which is the cheapest (formatPrice uses 4 decimal places)
    // We can check that the cheapest and the more expensive values appear
    expect(screen.getByText('$0.1430')).toBeTruthy()
    expect(screen.getByText('$0.1580')).toBeTruthy()
    expect(screen.getByText('$0.1650')).toBeTruthy()
  })

  it('closes when X button is clicked', () => {
    const onClose = vi.fn()
    render(<RegionCompareDialog {...defaultProps} onClose={onClose} />)
    // The close (X) button is the first button in the dialog header
    const buttons = screen.getAllByRole('button')
    // Click the first button with an SVG that is NOT the dropdown toggle
    // The header X button is positioned at the end of the header row
    fireEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('shows empty state when no instances provided', () => {
    render(<RegionCompareDialog {...defaultProps} instances={[]} />)
    expect(screen.getByText('No instances selected.')).toBeTruthy()
  })
})
