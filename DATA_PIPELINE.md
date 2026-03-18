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
5. Writes the result to `public/data/pricing.json`

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
