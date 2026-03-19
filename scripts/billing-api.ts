/**
 * Shared GCP Billing Catalog API utilities.
 * Used by fetch-pricing.ts (Compute Engine) and fetch-cloudsql-pricing.ts (Cloud SQL).
 */

export interface RawSku {
  name: string
  skuId: string
  description: string
  category: {
    serviceDisplayName: string
    resourceFamily: string
    resourceGroup: string
    usageType: string
  }
  serviceRegions: string[]
  pricingInfo: Array<{
    pricingExpression: {
      usageUnit: string
      tieredRates: Array<{
        unitPrice: { currencyCode: string; units: string; nanos: number }
      }>
    }
  }>
}

export async function fetchAllSkus(baseUrl: string, apiKey: string): Promise<RawSku[]> {
  const skus: RawSku[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(baseUrl)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('pageSize', '5000')
    url.searchParams.set('currencyCode', 'USD')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    console.log(`Fetching SKUs page${pageToken ? ` (token: ${pageToken.slice(0, 20)}...)` : ''}...`)
    const res = await fetch(url.toString())
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`API request failed: ${res.status} ${res.statusText}\n${body}`)
    }

    const data = await res.json() as { skus: RawSku[]; nextPageToken?: string }
    skus.push(...(data.skus ?? []))
    pageToken = data.nextPageToken
    console.log(`  Got ${data.skus?.length ?? 0} SKUs (total: ${skus.length})`)
  } while (pageToken)

  return skus
}

export function extractPrice(sku: RawSku): number | null {
  const rates = sku.pricingInfo?.[0]?.pricingExpression?.tieredRates
  if (!rates?.length) return null
  const rate = rates[rates.length - 1]?.unitPrice
  if (!rate) return null
  return Number(rate.units || 0) + (rate.nanos || 0) / 1e9
}

const SPECIFIC_REGION_RE = /^[a-z]+-[a-z]+\d+$/
export function isSpecificRegion(region: string): boolean {
  return SPECIFIC_REGION_RE.test(region)
}
