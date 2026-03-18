# GCP Instances

A fast, open-source tool for comparing Google Cloud Platform compute instance pricing across regions, machine types, and commitment levels.

**Live site:** [gcpinstances.doit.com](https://gcpinstances.doit.com)

## Features

- 190+ predefined machine types with real-time pricing from the GCP Billing API
- Filter by region, vCPUs, memory, and free-text search
- Compare Linux and Windows pricing: On Demand, SUD, Preemptible, 1yr and 3yr CUD
- Side-by-side instance comparison
- Export to CSV
- Toggle columns for specs (CPU type, GPU, SSD, network) and pricing tiers
- Pricing data refreshed daily via GitHub Actions

## Quick Start

```bash
npm install
npm run dev
```

The app loads pricing data from `public/data/pricing.json`. To regenerate it with fresh data, see [DATA_PIPELINE.md](DATA_PIPELINE.md).

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Table:** TanStack Table + TanStack Virtual (virtualized rows)
- **Data:** Static JSON, updated daily by GitHub Actions
- **Tests:** Vitest + React Testing Library

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit and smoke tests |
| `npm run fetch-pricing` | Fetch fresh pricing data (requires API key) |
| `npm run validate` | Validate pricing data accuracy |

## License

MIT
