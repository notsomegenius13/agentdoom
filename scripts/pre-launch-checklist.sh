#!/usr/bin/env bash
# pre-launch-checklist.sh — Run all checks and print GO/NO-GO status
set -uo pipefail

cd "$(dirname "$0")/.."

PASS=0
FAIL=0
RESULTS=()

run_check() {
  local name="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    RESULTS+=("✅ $name")
    ((PASS++))
  else
    RESULTS+=("❌ $name")
    ((FAIL++))
  fi
}

echo "📋 AgentDoom Pre-Launch Checklist"
echo "   Time: $(date)"
echo ""

# Code quality checks
echo "Running checks..."
run_check "Lint"                npm run lint
run_check "Type check"          npm run type-check
run_check "Unit tests"          npm run test
run_check "Build"               npm run build

# Health check (against production)
if bash "$(dirname "$0")/health-check.sh" > /dev/null 2>&1; then
  RESULTS+=("✅ Production health check")
  ((PASS++))
else
  RESULTS+=("❌ Production health check")
  ((FAIL++))
fi

# Vercel CLI available
if command -v vercel > /dev/null 2>&1; then
  RESULTS+=("✅ Vercel CLI installed")
  ((PASS++))
else
  RESULTS+=("❌ Vercel CLI not found")
  ((FAIL++))
fi

# Git status clean
if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  RESULTS+=("✅ Git working tree clean")
  ((PASS++))
else
  RESULTS+=("⚠️  Git working tree has uncommitted changes")
  ((FAIL++))
fi

echo ""
echo "━━━ Results ━━━"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done

TOTAL=$((PASS + FAIL))
echo ""
echo "Score: $PASS/$TOTAL checks passed"
echo ""

if [[ "$FAIL" -eq 0 ]]; then
  echo "🟢 GO — All systems ready for launch!"
  exit 0
else
  echo "🔴 NO-GO — $FAIL issue(s) must be resolved before launch."
  exit 1
fi
