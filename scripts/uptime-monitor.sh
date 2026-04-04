#!/usr/bin/env bash
# uptime-monitor.sh — Check AgentDoom endpoints every run, alert Slack on failure
# Designed to run via cron every 5 minutes
set -uo pipefail

BASE_URL="${1:-https://agentdoom.ai}"
SLACK_SCRIPT="/Users/jarvis/unprompted-slack-bot/slack-post.sh"
STATE_FILE="/tmp/agentdoom-uptime-state.json"

ENDPOINTS=(
  "Homepage|${BASE_URL}"
  "Feed|${BASE_URL}/feed"
  "API Feed|${BASE_URL}/api/feed"
)

FAILURES=()
RESULTS=()
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

for entry in "${ENDPOINTS[@]}"; do
  name="${entry%%|*}"
  url="${entry##*|}"

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "200" ]]; then
    RESULTS+=("✅ $name — $status")
  else
    RESULTS+=("❌ $name — $status")
    FAILURES+=("$name (HTTP $status)")
  fi
done

# Update state file with results
cat > "$STATE_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "total_checks": ${#ENDPOINTS[@]},
  "failures": ${#FAILURES[@]},
  "status": "$([ ${#FAILURES[@]} -eq 0 ] && echo 'healthy' || echo 'degraded')"
}
EOF

# Alert to Slack if any failures
if [[ ${#FAILURES[@]} -gt 0 ]]; then
  FAIL_LIST=$(printf ', %s' "${FAILURES[@]}")
  FAIL_LIST="${FAIL_LIST:2}"
  "$SLACK_SCRIPT" nero "🚨 AgentDoom DOWNTIME ALERT [$TIMESTAMP]
Failing endpoints: $FAIL_LIST

$(printf '%s\n' "${RESULTS[@]}")"
  exit 1
fi

# Quiet on success (cron-friendly), but log
echo "[$TIMESTAMP] All ${#ENDPOINTS[@]} endpoints healthy"
exit 0
