#!/usr/bin/env bash
# deploy.sh — Full deployment pipeline: lint → test → build → deploy → health check
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🚀 AgentDoom Deploy Pipeline"
echo "   Time: $(date)"
echo ""

# Step 1: Lint
echo "━━━ Step 1/5: Lint ━━━"
npm run lint
echo "✅ Lint passed"
echo ""

# Step 2: Type check
echo "━━━ Step 2/5: Type Check ━━━"
npm run type-check
echo "✅ Type check passed"
echo ""

# Step 3: Test
echo "━━━ Step 3/5: Test ━━━"
npm run test
echo "✅ Tests passed"
echo ""

# Step 4: Deploy to Vercel production
echo "━━━ Step 4/5: Deploy to Vercel (prod) ━━━"
vercel deploy --prod --yes
DEPLOY_EXIT=$?
if [[ $DEPLOY_EXIT -ne 0 ]]; then
  echo "❌ Vercel deploy failed (exit $DEPLOY_EXIT)"
  exit $DEPLOY_EXIT
fi
echo "✅ Deploy succeeded"
echo ""

# Step 5: Health check
echo "━━━ Step 5/5: Health Check ━━━"
# Wait a few seconds for deployment to propagate
sleep 5
if bash "$(dirname "$0")/health-check.sh"; then
  echo ""
  echo "🎉 Deploy complete — all checks passed!"
else
  echo ""
  echo "⚠️  Health check failed after deploy!"
  echo "   Run ./scripts/rollback.sh to revert."
  exit 1
fi
