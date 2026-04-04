#!/usr/bin/env bash
# setup-monitoring-cron.sh — Install AgentDoom monitoring cron jobs
# Run this script manually: bash scripts/setup-monitoring-cron.sh
set -euo pipefail

CRON_FILE="/tmp/agentdoom-crontab.txt"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Preserve existing crontab entries
(crontab -l 2>/dev/null | grep -v 'agentdoom' || true) > "$CRON_FILE"

cat >> "$CRON_FILE" <<EOF

# AgentDoom Launch Day Monitoring (installed $(date '+%Y-%m-%d'))
# Uptime check every 5 minutes — alerts Slack #nero on failure
*/5 * * * * ${SCRIPT_DIR}/uptime-monitor.sh >> /tmp/agentdoom-uptime.log 2>&1
# Error rate check every 5 minutes — alerts if >5 errors in last 100 requests
*/5 * * * * ${SCRIPT_DIR}/error-rate-monitor.sh >> /tmp/agentdoom-errors.log 2>&1
# Launch dashboard every 30 minutes — posts metrics summary to Slack #nero
3,33 * * * * ${SCRIPT_DIR}/launch-dashboard.sh >> /tmp/agentdoom-dashboard.log 2>&1
EOF

crontab "$CRON_FILE"
echo "✅ Monitoring cron jobs installed. Verify with: crontab -l"
