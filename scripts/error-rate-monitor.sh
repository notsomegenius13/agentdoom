#!/usr/bin/env bash
# error-rate-monitor.sh — Check Vercel production logs for 500 errors, alert if threshold exceeded
# Designed to run via cron every 5 minutes
set -uo pipefail

SLACK_SCRIPT="/Users/jarvis/unprompted-slack-bot/slack-post.sh"
PROJECT_DIR="/Users/jarvis/agentdoom"
ERROR_THRESHOLD="${1:-5}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

cd "$PROJECT_DIR"

# Fetch recent production logs as JSON, filter for 500-level status codes
LOGS=$(vercel logs --environment production --json --limit 100 --no-branch 2>/dev/null || echo "")

if [[ -z "$LOGS" ]]; then
  echo "[$TIMESTAMP] Warning: Could not fetch Vercel logs"
  exit 0
fi

# Count 5xx errors from JSON log output
ERROR_COUNT=$(echo "$LOGS" | python3 -c "
import sys, json
count = 0
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        status = entry.get('statusCode', entry.get('status', 0))
        if isinstance(status, int) and 500 <= status < 600:
            count += 1
        elif isinstance(status, str) and status.startswith('5'):
            count += 1
    except (json.JSONDecodeError, ValueError):
        continue
print(count)
" 2>/dev/null || echo "0")

# Also extract error-level log entries
ERROR_LEVEL_COUNT=$(echo "$LOGS" | python3 -c "
import sys, json
count = 0
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        level = entry.get('level', '').lower()
        if level in ('error', 'fatal'):
            count += 1
    except (json.JSONDecodeError, ValueError):
        continue
print(count)
" 2>/dev/null || echo "0")

TOTAL_ERRORS=$((ERROR_COUNT + ERROR_LEVEL_COUNT))

echo "[$TIMESTAMP] 5xx responses: $ERROR_COUNT, Error-level logs: $ERROR_LEVEL_COUNT, Total: $TOTAL_ERRORS (threshold: $ERROR_THRESHOLD)"

if [[ "$TOTAL_ERRORS" -ge "$ERROR_THRESHOLD" ]]; then
  # Get sample error paths for context
  SAMPLE_ERRORS=$(echo "$LOGS" | python3 -c "
import sys, json
errors = []
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        status = entry.get('statusCode', entry.get('status', 0))
        level = entry.get('level', '').lower()
        is_error = False
        if isinstance(status, int) and 500 <= status < 600:
            is_error = True
        elif isinstance(status, str) and status.startswith('5'):
            is_error = True
        elif level in ('error', 'fatal'):
            is_error = True
        if is_error:
            path = entry.get('path', entry.get('requestPath', 'unknown'))
            msg = entry.get('message', '')[:80]
            errors.append(f'  • {path} — {msg}' if msg else f'  • {path}')
    except (json.JSONDecodeError, ValueError):
        continue
for e in errors[:5]:
    print(e)
" 2>/dev/null || echo "  (could not parse details)")

  "$SLACK_SCRIPT" nero "🔴 AgentDoom ERROR RATE ALERT [$TIMESTAMP]
$TOTAL_ERRORS errors detected in last 100 requests (threshold: $ERROR_THRESHOLD)
- 5xx responses: $ERROR_COUNT
- Error-level logs: $ERROR_LEVEL_COUNT

Sample errors:
$SAMPLE_ERRORS"
  exit 1
fi

exit 0
