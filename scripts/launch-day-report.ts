#!/usr/bin/env npx tsx
/**
 * Launch Day Revenue Report
 *
 * Generates an hourly revenue + signup report for launch day monitoring.
 * Posts to Slack #revenue-factory if SLACK_REVENUE_WEBHOOK_URL is set.
 *
 * Usage:
 *   npx tsx scripts/launch-day-report.ts
 *   npx tsx scripts/launch-day-report.ts --post-slack
 *
 * Requires: DATABASE_URL env var
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const postToSlack = process.argv.includes('--post-slack')

async function generateReport() {
  const [
    revenueRows,
    mrrRows,
    hourlyRows,
    funnelRows,
    topToolRows,
    recentRows,
  ] = await Promise.all([
    // Revenue today
    sql`
      SELECT
        COUNT(*)::integer AS purchases,
        COALESCE(SUM(amount_cents), 0)::integer AS gross_cents,
        COALESCE(SUM(platform_fee_cents), 0)::integer AS platform_cents,
        CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(amount_cents))::integer ELSE 0 END AS avg_cents
      FROM purchases
      WHERE status = 'completed' AND created_at > CURRENT_DATE
    `,
    // Pro subscribers
    sql`
      SELECT
        COUNT(*)::integer AS total_pro,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE)::integer AS new_today
      FROM users WHERE is_pro = true
    `,
    // Hourly breakdown today
    sql`
      SELECT
        EXTRACT(HOUR FROM created_at)::integer AS hour,
        COUNT(*)::integer AS purchases,
        COALESCE(SUM(amount_cents), 0)::integer AS gross_cents
      FROM purchases
      WHERE status = 'completed' AND created_at > CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `,
    // Funnel today
    sql`
      SELECT
        (SELECT COUNT(*)::integer FROM users WHERE created_at > CURRENT_DATE) AS new_users,
        (SELECT COUNT(DISTINCT creator_id)::integer FROM tools WHERE status = 'active' AND created_at > CURRENT_DATE) AS new_creators,
        (SELECT COUNT(DISTINCT buyer_id)::integer FROM purchases WHERE status = 'completed' AND created_at > CURRENT_DATE) AS new_buyers,
        (SELECT COUNT(*)::integer FROM users WHERE is_pro = true AND created_at > CURRENT_DATE) AS new_pro
    `,
    // Top tools today
    sql`
      SELECT t.title, COUNT(p.id)::integer AS sales, COALESCE(SUM(p.amount_cents), 0)::integer AS revenue_cents
      FROM purchases p JOIN tools t ON t.id = p.tool_id
      WHERE p.status = 'completed' AND p.created_at > CURRENT_DATE
      GROUP BY t.title ORDER BY revenue_cents DESC LIMIT 5
    `,
    // Last 5 purchases
    sql`
      SELECT t.title, p.amount_cents, u.username, p.created_at
      FROM purchases p
      JOIN tools t ON t.id = p.tool_id
      JOIN users u ON u.id = p.buyer_id
      WHERE p.status = 'completed'
      ORDER BY p.created_at DESC LIMIT 5
    `,
  ])

  const rev = revenueRows[0] || {}
  const mrr = mrrRows[0] || {}
  const funnel = funnelRows[0] || {}
  const now = new Date()

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  let report = `
📊 *AgentDoom Launch Day Report*
🕐 ${now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
${'─'.repeat(40)}

*💰 Revenue Today*
  Gross Revenue:   ${fmt(rev.gross_cents || 0)}
  Platform Fees:   ${fmt(rev.platform_cents || 0)}
  Purchases:       ${rev.purchases || 0}
  Avg Order:       ${fmt(rev.avg_cents || 0)}

*🔁 MRR*
  Active Pro:      ${mrr.total_pro || 0} subscribers
  New Today:       ${mrr.new_today || 0}
  Est. MRR:        ${fmt((mrr.total_pro || 0) * 1400)}

*📈 Funnel Today*
  New Signups:     ${funnel.new_users || 0}
  → Creators:     ${funnel.new_creators || 0}
  → Buyers:       ${funnel.new_buyers || 0}
  → Pro:          ${funnel.new_pro || 0}
`

  if ((hourlyRows as Array<Record<string, unknown>>).length > 0) {
    report += `\n*⏰ Hourly Revenue*\n`
    for (const row of hourlyRows as Array<Record<string, unknown>>) {
      const h = row.hour as number
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      const bar = '█'.repeat(Math.max(1, Math.round((row.gross_cents as number) / 500)))
      report += `  ${label.padStart(4)}  ${bar} ${fmt(row.gross_cents as number)} (${row.purchases} sales)\n`
    }
  }

  if ((topToolRows as Array<Record<string, unknown>>).length > 0) {
    report += `\n*🏆 Top Sellers Today*\n`
    for (const [i, row] of (topToolRows as Array<Record<string, unknown>>).entries()) {
      report += `  ${i + 1}. ${row.title} — ${(row.sales as number)} sales (${fmt(row.revenue_cents as number)})\n`
    }
  }

  if ((recentRows as Array<Record<string, unknown>>).length > 0) {
    report += `\n*🛒 Recent Purchases*\n`
    for (const row of recentRows as Array<Record<string, unknown>>) {
      const time = new Date(row.created_at as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      report += `  ${time} — ${row.title} (${fmt(row.amount_cents as number)}) by @${row.username}\n`
    }
  }

  report += `\n${'─'.repeat(40)}\nDashboard: /admin/revenue\n`

  console.log(report)

  // Post to Slack if requested
  if (postToSlack) {
    const webhookUrl = process.env.SLACK_REVENUE_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('SLACK_REVENUE_WEBHOOK_URL not set, skipping Slack post')
      return
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: report }),
    })
    console.log(res.ok ? '✅ Posted to Slack' : `❌ Slack post failed: ${res.status}`)
  }
}

generateReport().catch((err) => {
  console.error('Report generation failed:', err)
  process.exit(1)
})
