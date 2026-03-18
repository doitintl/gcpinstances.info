export type Provider = 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Mistral' | 'xAI'

export interface ModelRelease {
  date: string // YYYY-MM-DD
  model: string
  provider: Provider
  inputPricePerM: number // USD per million input tokens
  outputPricePerM: number // USD per million output tokens
  isSota?: boolean // Considered state-of-the-art at release
  notes?: string
}

export const PROVIDER_COLORS: Record<Provider, string> = {
  OpenAI: '#10b981',
  Anthropic: '#f97316',
  Google: '#3b82f6',
  Meta: '#8b5cf6',
  Mistral: '#eab308',
  xAI: '#ec4899',
}

export const ALL_PROVIDERS: Provider[] = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'xAI']

// Historical flagship model releases with pricing (USD per million tokens).
// Sources: provider API pricing pages (public). Prices are point-in-time at launch
// unless noted. Open-source model prices are via third-party hosted APIs (Together.ai).
// Data is current through mid-2025; later releases may not be reflected.
export const MODEL_RELEASES: ModelRelease[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────────────
  {
    date: '2023-03-14',
    model: 'GPT-4',
    provider: 'OpenAI',
    inputPricePerM: 30,
    outputPricePerM: 60,
    isSota: true,
    notes: 'First release of GPT-4',
  },
  {
    date: '2023-11-06',
    model: 'GPT-4 Turbo',
    provider: 'OpenAI',
    inputPricePerM: 10,
    outputPricePerM: 30,
    isSota: true,
    notes: '128K context; 3× cheaper than GPT-4',
  },
  {
    date: '2024-05-13',
    model: 'GPT-4o',
    provider: 'OpenAI',
    inputPricePerM: 5,
    outputPricePerM: 15,
    isSota: true,
    notes: 'Multimodal; 2× cheaper than GPT-4 Turbo',
  },
  {
    date: '2024-07-18',
    model: 'GPT-4o mini',
    provider: 'OpenAI',
    inputPricePerM: 0.15,
    outputPricePerM: 0.6,
    isSota: false,
    notes: 'Efficient model replacing GPT-3.5 Turbo',
  },
  {
    date: '2024-09-12',
    model: 'o1-preview',
    provider: 'OpenAI',
    inputPricePerM: 15,
    outputPricePerM: 60,
    isSota: true,
    notes: 'First public reasoning model',
  },
  {
    date: '2024-11-20',
    model: 'GPT-4o (reduced)',
    provider: 'OpenAI',
    inputPricePerM: 2.5,
    outputPricePerM: 10,
    isSota: false,
    notes: 'GPT-4o price reduction',
  },
  {
    date: '2025-01-31',
    model: 'o3-mini',
    provider: 'OpenAI',
    inputPricePerM: 1.1,
    outputPricePerM: 4.4,
    isSota: true,
    notes: 'Efficient reasoning model',
  },
  {
    date: '2025-04-14',
    model: 'GPT-4.1',
    provider: 'OpenAI',
    inputPricePerM: 2,
    outputPricePerM: 8,
    isSota: false,
    notes: 'Coding-focused; replaces GPT-4o in many tasks',
  },
  {
    date: '2025-04-16',
    model: 'o3',
    provider: 'OpenAI',
    inputPricePerM: 10,
    outputPricePerM: 40,
    isSota: true,
    notes: 'Full reasoning model; top benchmark scores',
  },
  {
    date: '2025-04-16',
    model: 'o4-mini',
    provider: 'OpenAI',
    inputPricePerM: 1.1,
    outputPricePerM: 4.4,
    isSota: false,
    notes: 'Efficient reasoning; multimodal',
  },

  // ── Anthropic ───────────────────────────────────────────────────────────────
  {
    date: '2023-03-14',
    model: 'Claude 1',
    provider: 'Anthropic',
    inputPricePerM: 11,
    outputPricePerM: 33,
    isSota: true,
    notes: 'Approximate; public API launch pricing',
  },
  {
    date: '2023-07-11',
    model: 'Claude 2',
    provider: 'Anthropic',
    inputPricePerM: 8,
    outputPricePerM: 24,
    isSota: true,
    notes: 'Improved reasoning and context (100K)',
  },
  {
    date: '2023-11-21',
    model: 'Claude 2.1',
    provider: 'Anthropic',
    inputPricePerM: 8,
    outputPricePerM: 24,
    isSota: true,
    notes: 'Reduced hallucinations; 200K context',
  },
  {
    date: '2024-03-04',
    model: 'Claude 3 Opus',
    provider: 'Anthropic',
    inputPricePerM: 15,
    outputPricePerM: 75,
    isSota: true,
    notes: 'Major quality jump; highest output price in market',
  },
  {
    date: '2024-06-20',
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputPricePerM: 3,
    outputPricePerM: 15,
    isSota: true,
    notes: 'Matched Opus quality at 5× lower cost',
  },
  {
    date: '2024-10-22',
    model: 'Claude 3.5 Sonnet v2',
    provider: 'Anthropic',
    inputPricePerM: 3,
    outputPricePerM: 15,
    isSota: true,
    notes: 'Improved coding and computer use',
  },
  {
    date: '2024-11-04',
    model: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    inputPricePerM: 0.8,
    outputPricePerM: 4,
    isSota: false,
    notes: 'Efficient; best-in-class for size',
  },
  {
    date: '2025-02-24',
    model: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    inputPricePerM: 3,
    outputPricePerM: 15,
    isSota: true,
    notes: 'Extended thinking; hybrid reasoning',
  },

  // ── Google ──────────────────────────────────────────────────────────────────
  {
    date: '2023-05-10',
    model: 'PaLM 2 Text Bison',
    provider: 'Google',
    inputPricePerM: 1,
    outputPricePerM: 2,
    isSota: true,
    notes: 'Vertex AI; approx. converted from character-based pricing',
  },
  {
    date: '2023-12-13',
    model: 'Gemini 1.0 Pro',
    provider: 'Google',
    inputPricePerM: 0.5,
    outputPricePerM: 1.5,
    isSota: true,
    notes: 'Google AI Studio / Vertex AI launch',
  },
  {
    date: '2024-04-09',
    model: 'Gemini 1.5 Pro',
    provider: 'Google',
    inputPricePerM: 3.5,
    outputPricePerM: 10.5,
    isSota: true,
    notes: 'Up to 1M token context; ≤128K price shown',
  },
  {
    date: '2024-05-24',
    model: 'Gemini 1.5 Flash',
    provider: 'Google',
    inputPricePerM: 0.35,
    outputPricePerM: 1.05,
    isSota: false,
    notes: 'Speed/cost optimised variant',
  },
  {
    date: '2024-09-24',
    model: 'Gemini 1.5 Pro (reduced)',
    provider: 'Google',
    inputPricePerM: 1.25,
    outputPricePerM: 5,
    isSota: true,
    notes: 'Price cut ~64%',
  },
  {
    date: '2025-02-05',
    model: 'Gemini 2.0 Flash',
    provider: 'Google',
    inputPricePerM: 0.1,
    outputPricePerM: 0.4,
    isSota: false,
    notes: 'Major price reduction; fast and capable',
  },
  {
    date: '2025-03-25',
    model: 'Gemini 2.5 Pro',
    provider: 'Google',
    inputPricePerM: 1.25,
    outputPricePerM: 10,
    isSota: true,
    notes: 'Thinking model; top benchmark scores',
  },

  // ── Meta (open-source, prices via Together.ai) ──────────────────────────────
  {
    date: '2023-07-18',
    model: 'Llama 2 70B',
    provider: 'Meta',
    inputPricePerM: 0.9,
    outputPricePerM: 0.9,
    isSota: true,
    notes: 'Via Together.ai; open weights released',
  },
  {
    date: '2024-04-18',
    model: 'Llama 3 70B',
    provider: 'Meta',
    inputPricePerM: 0.9,
    outputPricePerM: 0.9,
    isSota: true,
    notes: 'Via Together.ai; significant capability jump',
  },
  {
    date: '2024-07-23',
    model: 'Llama 3.1 405B',
    provider: 'Meta',
    inputPricePerM: 3.5,
    outputPricePerM: 3.5,
    isSota: true,
    notes: 'Via Together.ai; first open-source GPT-4 competitor',
  },
  {
    date: '2024-12-06',
    model: 'Llama 3.3 70B',
    provider: 'Meta',
    inputPricePerM: 0.9,
    outputPricePerM: 0.9,
    isSota: false,
    notes: 'Via Together.ai; 405B-level perf at 70B size',
  },

  // ── Mistral ─────────────────────────────────────────────────────────────────
  {
    date: '2024-02-26',
    model: 'Mistral Large',
    provider: 'Mistral',
    inputPricePerM: 8,
    outputPricePerM: 24,
    isSota: true,
    notes: 'First flagship model; competitive with GPT-4',
  },
  {
    date: '2024-07-24',
    model: 'Mistral Large 2',
    provider: 'Mistral',
    inputPricePerM: 3,
    outputPricePerM: 9,
    isSota: true,
    notes: '62.5% price cut vs Large 1',
  },
  {
    date: '2025-01-15',
    model: 'Mistral Large 25.01',
    provider: 'Mistral',
    inputPricePerM: 2,
    outputPricePerM: 6,
    isSota: true,
    notes: 'Updated flagship with improved reasoning',
  },

  // ── xAI ─────────────────────────────────────────────────────────────────────
  {
    date: '2024-08-14',
    model: 'Grok-2',
    provider: 'xAI',
    inputPricePerM: 2,
    outputPricePerM: 10,
    isSota: true,
    notes: 'First commercially available Grok model',
  },
  {
    date: '2025-02-17',
    model: 'Grok-3',
    provider: 'xAI',
    inputPricePerM: 3,
    outputPricePerM: 15,
    isSota: true,
    notes: 'Top reasoning benchmark scores',
  },
]

// Build a step-function time-series for the chart.
// For each date milestone, carry forward the most recent model price.
export function buildChartSeries(
  providers: Provider[],
  sotaOnly: boolean,
  priceType: 'input' | 'output' | 'blended',
) {
  const releases = sotaOnly ? MODEL_RELEASES.filter((r) => r.isSota) : MODEL_RELEASES

  // Collect all unique dates + sentinel start/end
  const uniqueDates = [...new Set(releases.map((r) => r.date))].sort()
  const START = '2023-01-01'
  const END = new Date().toISOString().slice(0, 10)
  const allDates = [START, ...uniqueDates, END]

  const getPrice = (r: ModelRelease) => {
    if (priceType === 'input') return r.inputPricePerM
    if (priceType === 'output') return r.outputPricePerM
    // Blended: assume 1:3 input:output token ratio in practice
    return (r.inputPricePerM + 3 * r.outputPricePerM) / 4
  }

  return allDates.map((date) => {
    const point: Record<string, string | number | null> = { date }
    for (const provider of providers) {
      const prior = releases
        .filter((r) => r.provider === provider && r.date <= date)
        .sort((a, b) => b.date.localeCompare(a.date))
      point[provider] = prior.length > 0 ? getPrice(prior[0]) : null
      // Attach model name for tooltip
      point[`${provider}_model`] = prior.length > 0 ? prior[0].model : null
    }
    return point
  })
}

// Find the model active at a specific date for a provider
export function getActiveModel(
  provider: Provider,
  date: string,
  sotaOnly: boolean,
): ModelRelease | null {
  const releases = sotaOnly ? MODEL_RELEASES.filter((r) => r.isSota) : MODEL_RELEASES
  const prior = releases
    .filter((r) => r.provider === provider && r.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))
  return prior.length > 0 ? prior[0] : null
}
