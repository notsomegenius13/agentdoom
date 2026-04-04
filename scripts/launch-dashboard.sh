#!/usr/bin/env bash
# launch-dashboard.sh — Fetch AgentDoom metrics and post a dashboard summary to Slack
# Designed for launch day visibility. Run on-demand or via cron.
set -uo pipefail

BASE_URL="${1:-https://agentdoom.ai}"
SLACK_SCRIPT="/Users/jarvis/unprompted-slack-bot/slack-post.sh"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Fetch analytics from the admin endpoint
ANALYTICS=$(curl -s --max-time 20 "${BASE_URL}/api/admin/analytics?period=24h" 2>/dev/null || echo "{}")

# Parse metrics with python
METRICS=$(echo "$ANALYTICS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    overview = data.get('overview', {})
    generations = data.get('generations', {})
    waitlist = data.get('waitlist', {})
    events = data.get('eventBreakdown', [])

    total_tools = overview.get('totalTools', 'N/A')
    total_users = overview.get('totalUsers', 'N/A')
    gen_count = generations.get('total', 'N/A')
    gen_success = generations.get('successRate', 'N/A')
    signups = waitlist.get('total', 'N/A')
    signups_period = waitlist.get('periodSignups', 'N/A')

    # Sum event counts
    views = uses = remixes = shares = 0
    for e in events:
        t = e.get('event_type', '')
        c = int(e.get('count', 0))
        if t == 'view': views = c
        elif t == 'use': uses = c
        elif t == 'remix': remixes = c
        elif t == 'share': shares = c

    print(f'total_tools={total_tools}')
    print(f'total_users={total_users}')
    print(f'gen_count={gen_count}')
    print(f'gen_success={gen_success}')
    print(f'signups={signups}')
    print(f'signups_24h={signups_period}')
    print(f'views={views}')
    print(f'uses={uses}')
    print(f'remixes={remixes}')
    print(f'shares={shares}')
except Exception as e:
    print(f'error={e}')
" 2>/dev/null)

# Check uptime
UPTIME_OK=0
UPTIME_TOTAL=0
for url in "${BASE_URL}" "${BASE_URL}/feed" "${BASE_URL}/api/feed"; do
  ((UPTIME_TOTAL++))
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  [[ "$status" == "200" ]] && ((UPTIME_OK++))
done

if [[ "$UPTIME_TOTAL" -gt 0 ]]; then
  UPTIME_PCT=$(python3 -c "print(f'{($UPTIME_OK/$UPTIME_TOTAL)*100:.0f}')")
else
  UPTIME_PCT="N/A"
fi

# Extract individual metrics
eval "$METRICS" 2>/dev/null || true

# Build dashboard message
MSG="📊 AgentDoom Launch Dashboard [$TIMESTAMP]

🟢 Uptime: ${UPTIME_PCT}% (${UPTIME_OK}/${UPTIME_TOTAL} endpoints up)

📈 Key Metrics (24h):
  • Signups: ${signups_24h:-N/A} new (${signups:-N/A} total)
  • Generations: ${gen_count:-N/A} (${gen_success:-N/A}% success)
  • Tools created: ${total_tools:-N/A}
  • Users: ${total_users:-N/A}

👀 Engagement (24h):
  • Views: ${views:-0}
  • Uses: ${uses:-0}
  • Remixes: ${remixes:-0}
  • Shares: ${shares:-0}"

# Post to Slack
"$SLACK_SCRIPT" nero "$MSG"

# Also print to stdout for logs
echo "$MSG"
