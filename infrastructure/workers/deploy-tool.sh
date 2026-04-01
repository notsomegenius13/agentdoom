#!/usr/bin/env bash
# Deploy a generated tool bundle to Cloudflare Workers KV
# Usage: ./deploy-tool.sh <slug> <html-file-path>
#
# Called programmatically by Forge after generation + validation.

set -euo pipefail

SLUG="${1:?Usage: deploy-tool.sh <slug> <html-file-path>}"
HTML_FILE="${2:?Usage: deploy-tool.sh <slug> <html-file-path>}"
KV_NAMESPACE_ID="${KV_NAMESPACE_ID:?Set KV_NAMESPACE_ID env var}"

if [ ! -f "$HTML_FILE" ]; then
  echo "Error: HTML file not found: $HTML_FILE" >&2
  exit 1
fi

# Validate slug format
if ! echo "$SLUG" | grep -qE '^[a-z0-9-]+$'; then
  echo "Error: Invalid slug format. Use lowercase alphanumeric and hyphens only." >&2
  exit 1
fi

echo "Deploying tool '$SLUG' from $HTML_FILE..."

npx wrangler kv:key put \
  --namespace-id "$KV_NAMESPACE_ID" \
  "$SLUG" \
  --path "$HTML_FILE"

echo "Deployed: /t/$SLUG"
