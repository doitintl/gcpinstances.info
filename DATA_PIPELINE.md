# Data Pipeline

Pricing data flows from Google's Cloud Billing Catalog API into a static JSON file that the frontend reads at runtime.

## Architecture

```
Google Cloud Billing Catalog API
        |
        v
scripts/fetch-pricing.ts          (parses ~31k SKUs into per-instance pricing)
        |
        v
public/data/pricing.json           (static file served to the browser)
        |
        v
React frontend                     (client-side filtering, sorting, display)
```

## How It Works

1. `scripts/fetch-pricing.ts` calls the [Cloud Billing Catalog API](https://cloud.google.com/billing/docs/reference/rest/v1/services.skus/list) for all Compute Engine SKUs
2. Parses SKU descriptions to extract per-vCPU and per-GiB rates by series, region, and usage type (On Demand, Preemptible, CUD 1yr, CUD 3yr)
3. Combines rates with machine type specs from `scripts/machine-types.ts` to compute per-instance prices
4. Adds Windows licensing premium ($0.046/vCPU-hour)
5. Attaches the Linux CoreMark score for each machine type from `COREMARK_SCORES` in `scripts/machine-types.ts`
6. Writes the result to `public/data/pricing.json`

### CoreMark scores

CoreMark scores are **not** fetched from an API — they live in `COREMARK_SCORES` in
`scripts/machine-types.ts`.

Google retired the score tables from the **English** page in early 2026; it now only
documents how to run PerfKitBenchmarker yourself. But three localized versions still serve
the full tables and are the live source for this data:

- [`?hl=ko`](https://cloud.google.com/compute/docs/coremark-scores-of-vm-instances?hl=ko) (Korean)
- [`?hl=ja`](https://cloud.google.com/compute/docs/coremark-scores-of-vm-instances?hl=ja) (Japanese)
- [`?hl=zh-cn`](https://cloud.google.com/compute/docs/coremark-scores-of-vm-instances?hl=zh-cn) (Simplified Chinese)

Dropping the `?hl=` parameter gives you the English page, which no longer has the data. All
other locales tested (de, fr, es, it, pt-br, ru, zh-tw, and others) have also had the tables
removed.

All three were cross-checked against each other and against the last English revision:
**228 machine types, zero disagreements on any value.**

These pages could be trimmed to match English at any time, so treat `COREMARK_SCORES` as
the source of truth rather than assuming a refresh is always possible. Machine types
released after the last benchmark run (C4, A3, the newer A2 GPU shapes, shared-core E2)
have no published score and render as `N/A`; to fill those in, benchmark with
PerfKitBenchmarker or get numbers from a Google account team.

## API Key Setup

The Cloud Billing Catalog API requires a free API key (no billing account needed).

### Option A: Automated Setup

```bash
bash scripts/setup-api-key.sh [YOUR_GCP_PROJECT_ID]
```

This creates a restricted API key and saves it to `.env.local`.

### Option B: Manual Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an API key
3. Restrict it to **Cloud Billing API** only
4. Save to `.env.local`:
   ```
   GOOGLE_CLOUD_API_KEY=your_key_here
   ```

### Running Locally

```bash
npm run fetch-pricing     # generates public/data/pricing.json
npm run validate          # spot-checks accuracy against live API
```

## Secret Management

| Context | Where the key lives |
|---------|-------------------|
| Local development | `.env.local` (gitignored via `*.local`) |
| GitHub Actions | Repository secret: `GOOGLE_CLOUD_API_KEY` |
| Frontend / browser | **Never.** The key is only used server-side in scripts and CI. |

The API key is restricted to the Cloud Billing Catalog API (read-only, free quota). It is never embedded in the frontend bundle or exposed to end users.

To add the secret to GitHub Actions:
1. Go to your repo **Settings > Secrets and variables > Actions**
2. Add a new repository secret named `GOOGLE_CLOUD_API_KEY`
3. Paste the API key value

## Daily Refresh

`.github/workflows/fetch-pricing.yml` runs daily at 06:00 UTC:
1. Fetches fresh pricing data
2. Validates accuracy
3. Commits updated `pricing.json` if prices changed

## Data Validation

`scripts/validate-pricing.ts` performs two checks:

- **Truth table:** 12 hardcoded spot-checks against known GCP prices
- **Live validation:** Samples 5 random instances and recomputes their prices from fresh API data

Run with: `npm run validate`
