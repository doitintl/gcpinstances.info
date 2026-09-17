import { execFileSync } from 'node:child_process'

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

/** Bearer token from the local gcloud install.
 *
 *  The committed API key is IP-restricted, which is correct for CI and useless
 *  on a laptop — so a developer could not run any of the fetchers locally. With
 *  this they can, using their own credentials, and CI keeps using the key. */
export function localAccessToken(): string | null {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
  } catch {
    return null
  }
}

export async function fetchAllSkus(baseUrl: string, apiKey?: string): Promise<RawSku[]> {
  const token = apiKey ? null : localAccessToken()
  if (!apiKey && !token) {
    throw new Error('No credentials: set GOOGLE_CLOUD_API_KEY or run `gcloud auth login`')
  }
  const skus: RawSku[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(baseUrl)
    if (apiKey) url.searchParams.set('key', apiKey)
    url.searchParams.set('pageSize', '5000')
    url.searchParams.set('currencyCode', 'USD')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    console.log(`Fetching SKUs page${pageToken ? ` (token: ${pageToken.slice(0, 20)}...)` : ''}...`)
    const res = await fetch(url.toString(),
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
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
