#!/usr/bin/env bash
# health-check.sh — Hit key AgentDoom endpoints and report status
set -euo pipefail

BASE_URL="${1:-https://agentdoom.ai}"
PASS=0
FAIL=0
RESULTS=()

check_get() {
  local name="$1" url="$2" expect_body="${3:-}"
  local status body

  body=$(curl -s --max-time 15 "$url" 2>/dev/null || true)
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")

  local ok=true
  [[ "$status" != "200" ]] && ok=false
  if [[ -n "$expect_body" && "$ok" == "true" ]]; then
    echo "$body" | grep -qi "$expect_body" || ok=false
  fi

  if [[ "$ok" == "true" ]]; then
    RESULTS+=("✅ $name — HTTP $status")
    ((PASS++))
  else
    RESULTS+=("❌ $name — HTTP $status${expect_body:+ (expected body: $expect_body)}")
    ((FAIL++))
  fi
}

check_post() {
  local name="$1" url="$2"
  local status

  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' --max-time 15 "$url" 2>/dev/null || echo "000")

  if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
    RESULTS+=("✅ $name — HTTP $status")
    ((PASS++))
  else
    RESULTS+=("❌ $name — HTTP $status")
    ((FAIL++))
  fi
}

echo "🏥 AgentDoom Health Check"
echo "   Target: $BASE_URL"
echo "   Time:   $(date)"
echo ""

check_get  "Health check"  "$BASE_URL/api/health"     "healthy"
check_get  "Landing page"  "$BASE_URL"
check_get  "Feed page"     "$BASE_URL/feed"
check_get  "API feed"      "$BASE_URL/api/feed"      "tool"
check_post "API generate"  "$BASE_URL/api/generate"

echo "Results:"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done

echo ""
TOTAL=$((PASS + FAIL))
echo "Score: $PASS/$TOTAL passed"

if [[ "$FAIL" -gt 0 ]]; then
  echo "⚠️  $FAIL check(s) failed"
  exit 1
else
  echo "🟢 All checks passed"
  exit 0
fi
