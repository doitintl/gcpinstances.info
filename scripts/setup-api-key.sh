#!/usr/bin/env bash
# Sets up a GCP API key restricted to the Cloud Billing Catalog API.
# Usage: bash scripts/setup-api-key.sh [PROJECT_ID]
# Requires: gcloud CLI authenticated

set -euo pipefail

PROJECT_ID="${1:-}"

# Auto-detect project if not provided
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project specified."
  echo "Usage: bash scripts/setup-api-key.sh YOUR_PROJECT_ID"
  echo "  or: gcloud config set project YOUR_PROJECT_ID && bash scripts/setup-api-key.sh"
  exit 1
fi

echo "Using GCP project: $PROJECT_ID"

# Enable the Cloud Billing API
echo "Enabling Cloud Billing API..."
gcloud services enable cloudbilling.googleapis.com --project="$PROJECT_ID"

# Check if a key already exists
echo "Checking for existing API keys..."
EXISTING=$(gcloud alpha services api-keys list \
  --project="$PROJECT_ID" \
  --filter="displayName='GCP Pricing Tool'" \
  --format="value(name)" 2>/dev/null | head -1 || true)

if [ -n "$EXISTING" ]; then
  echo "Found existing key: $EXISTING"
  KEY_STRING=$(gcloud alpha services api-keys get-key-string "$EXISTING" \
    --project="$PROJECT_ID" \
    --format="value(keyString)")
else
  # Create a new restricted API key
  echo "Creating API key restricted to Cloud Billing Catalog API..."
  KEY_NAME=$(gcloud alpha services api-keys create \
    --display-name="GCP Pricing Tool" \
    --api-target=service=cloudbilling.googleapis.com \
    --project="$PROJECT_ID" \
    --format="value(name)" 2>&1 | grep "keys/" | head -1)

  echo "Created key: $KEY_NAME"
  KEY_STRING=$(gcloud alpha services api-keys get-key-string "$KEY_NAME" \
    --project="$PROJECT_ID" \
    --format="value(keyString)")
fi

if [ -z "$KEY_STRING" ]; then
  echo "Error: Could not retrieve API key string."
  exit 1
fi

# Write to .env.local
ENV_FILE="$(dirname "$0")/../.env.local"
if grep -q "GOOGLE_CLOUD_API_KEY" "$ENV_FILE" 2>/dev/null; then
  # Update existing
  sed -i.bak "s/^GOOGLE_CLOUD_API_KEY=.*/GOOGLE_CLOUD_API_KEY=$KEY_STRING/" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
else
  echo "GOOGLE_CLOUD_API_KEY=$KEY_STRING" >> "$ENV_FILE"
fi

echo ""
echo "API key written to .env.local"
echo ""
echo "Next steps:"
echo "  1. Run: npm run fetch-pricing  (to generate initial pricing data)"
echo "  2. Add the key as a GitHub Actions secret:"
echo "     gh secret set GOOGLE_CLOUD_API_KEY < .env.local"
echo "     (or paste the value from .env.local into Settings > Secrets)"
