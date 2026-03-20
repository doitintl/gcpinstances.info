import { writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '../public/data/exchange-rates.json')

const TARGET_CURRENCIES = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'DKK', 'NOK', 'SEK', 'CHF', 'ZAR', 'ILS']

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  DKK: 6.89,
  NOK: 10.55,
  SEK: 10.42,
  CHF: 0.90,
  ZAR: 18.63,
  ILS: 3.71,
}

async function fetchRates() {
  const url = `https://api.frankfurter.app/latest?from=USD&to=${TARGET_CURRENCIES.join(',')}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { date: string; rates: Record<string, number> }

    const rates = { USD: 1, ...data.rates }
    const output = {
      updatedAt: new Date().toISOString(),
      base: 'USD',
      rates,
    }

    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')
    console.log(`Exchange rates updated: ${data.date}`)
  } catch (err) {
    console.warn(`Warning: Failed to fetch exchange rates: ${err}`)

    if (existsSync(OUTPUT_PATH)) {
      console.log('Keeping existing exchange-rates.json')
      process.exit(0)
    }

    const output = {
      updatedAt: new Date().toISOString(),
      base: 'USD',
      rates: FALLBACK_RATES,
    }
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')
    console.log('Wrote fallback exchange rates')
  }
}

fetchRates()
