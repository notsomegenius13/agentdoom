#!/usr/bin/env bash
# rollback.sh — Revert to the previous Vercel production deployment
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔄 AgentDoom Rollback"
echo "   Time: $(date)"
echo ""

# List recent production deployments
echo "Fetching recent production deployments..."
DEPLOYMENTS=$(vercel ls --prod --json 2>/dev/null || true)

if [[ -z "$DEPLOYMENTS" ]]; then
  echo "❌ Could not fetch deployments. Make sure vercel CLI is authenticated."
  exit 1
fi

# Get the previous production deployment URL (second most recent)
PREV_URL=$(echo "$DEPLOYMENTS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
deploys = [d for d in data.get('deployments', data) if d.get('target') == 'production' or d.get('state') == 'READY']
if len(deploys) < 2:
    print('NONE')
else:
    print(deploys[1].get('url', 'NONE'))
" 2>/dev/null || echo "NONE")

if [[ "$PREV_URL" == "NONE" ]]; then
  echo "❌ No previous production deployment found to rollback to."
  echo "   Need at least 2 production deployments."
  exit 1
fi

echo "Rolling back to: $PREV_URL"
echo ""

vercel promote "$PREV_URL" --yes
ROLLBACK_EXIT=$?

if [[ $ROLLBACK_EXIT -eq 0 ]]; then
  echo ""
  echo "✅ Rollback complete. Previous deployment promoted to production."
  echo "   Running health check..."
  echo ""
  bash "$(dirname "$0")/health-check.sh"
else
  echo ""
  echo "❌ Rollback failed with exit code $ROLLBACK_EXIT"
  exit $ROLLBACK_EXIT
fi
