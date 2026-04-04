import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/analytics — Platform-wide analytics for the admin dashboard.
 *
 * Returns: tool generation stats, remix rate, share rate, waitlist signups,
 * funnel metrics, revenue, and daily time series.
 *
 * Query params:
 *   period — '24h' | '7d' | '30d' (default: '7d')
 */
export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') ?? '7d'
    const intervalExpr =
      period === '24h' ? "1 day" : period === '30d' ? "30 days" : "7 days"

    const sql = getDb()

    // Run all queries in parallel
    const [
      overviewRows,
      generationRows,
      generationTimelineRows,
      eventBreakdownRows,
      eventTimelineRows,
      remixRows,
      waitlistRows,
      waitlistTimelineRows,
      revenueRows,
      topToolRows,
      categoryRows,
      funnelRows,
    ] = await Promise.all([
      // 1. Overview: total tools, users, events
      sql`
        SELECT
          (SELECT COUNT(*)::integer FROM tools WHERE status = 'active') AS total_tools,
          (SELECT COUNT(*)::integer FROM users) AS total_users,
          (SELECT COUNT(*)::integer FROM waitlist) AS total_waitlist,
          (SELECT COUNT(*)::integer FROM feed_events
            WHERE created_at > now() - ${intervalExpr}::interval) AS total_events,
          (SELECT COUNT(*)::integer FROM generations
            WHERE created_at > now() - ${intervalExpr}::interval) AS total_generations
      `,

      // 2. Generation stats
      sql`
        SELECT
          COUNT(*)::integer AS total,
          COUNT(*) FILTER (WHERE status = 'success')::integer AS succeeded,
          COUNT(*) FILTER (WHERE status = 'failed')::integer AS failed,
          ROUND(AVG(latency_ms))::integer AS avg_latency_ms,
          0::numeric AS total_cost_cents
        FROM generations
        WHERE created_at > now() - ${intervalExpr}::interval
      `,

      // 3. Generation timeline (daily)
      sql`
        SELECT
          DATE(created_at) AS day,
          COUNT(*)::integer AS total,
          COUNT(*) FILTER (WHERE status = 'success')::integer AS succeeded,
          COUNT(*) FILTER (WHERE status = 'failed')::integer AS failed
        FROM generations
        WHERE created_at > now() - ${intervalExpr}::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,

      // 4. Event breakdown by type
      sql`
        SELECT event_type, COUNT(*)::integer AS count
        FROM feed_events
        WHERE created_at > now() - ${intervalExpr}::interval
        GROUP BY event_type
        ORDER BY count DESC
      `,

      // 5. Event timeline (daily, by type)
      sql`
        SELECT
          DATE(created_at) AS day,
          event_type,
          COUNT(*)::integer AS count
        FROM feed_events
        WHERE created_at > now() - ${intervalExpr}::interval
        GROUP BY DATE(created_at), event_type
        ORDER BY day ASC
      `,

      // 6. Remix stats
      sql`
        SELECT
          COUNT(*)::integer AS total_remixes,
          COUNT(DISTINCT remixed_from)::integer AS unique_sources
        FROM tools
        WHERE remixed_from IS NOT NULL
          AND created_at > now() - ${intervalExpr}::interval
      `,

      // 7. Waitlist stats
      sql`
        SELECT
          COUNT(*)::integer AS total,
          COUNT(*) FILTER (WHERE created_at > now() - ${intervalExpr}::interval)::integer AS period_signups
        FROM waitlist
      `,

      // 8. Waitlist timeline (daily)
      sql`
        SELECT DATE(created_at) AS day, COUNT(*)::integer AS signups
        FROM waitlist
        WHERE created_at > now() - ${intervalExpr}::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,

      // 9. Revenue (purchases)
      sql`
        SELECT
          COUNT(*)::integer AS total_purchases,
          COALESCE(SUM(amount_cents), 0)::integer AS gross_revenue_cents,
          COALESCE(SUM(platform_fee_cents), 0)::integer AS platform_fee_cents
        FROM purchases
        WHERE status = 'completed'
          AND created_at > now() - ${intervalExpr}::interval
      `,

      // 10. Top tools by engagement
      sql`
        SELECT
          t.id, t.slug, t.title, t.category,
          t.views_count, t.uses_count, t.remixes_count, t.shares_count, t.likes_count,
          (t.views_count + 3 * t.uses_count + 5 * t.remixes_count + 2 * t.shares_count + t.likes_count) AS score
        FROM tools t
        WHERE t.status = 'active'
        ORDER BY score DESC
        LIMIT 10
      `,

      // 11. Category distribution
      sql`
        SELECT category, COUNT(*)::integer AS count
        FROM tools
        WHERE status = 'active'
        GROUP BY category
        ORDER BY count DESC
      `,

      // 12. Funnel: generation attempts -> tools created -> tools with views -> tools with uses -> tools with remixes -> tools with shares
      sql`
        SELECT
          (SELECT COUNT(*)::integer FROM generations
            WHERE created_at > now() - ${intervalExpr}::interval) AS generation_attempts,
          (SELECT COUNT(*)::integer FROM tools
            WHERE status = 'active' AND created_at > now() - ${intervalExpr}::interval) AS tools_created,
          (SELECT COUNT(*)::integer FROM tools
            WHERE status = 'active' AND views_count > 0 AND created_at > now() - ${intervalExpr}::interval) AS tools_with_views,
          (SELECT COUNT(*)::integer FROM tools
            WHERE status = 'active' AND uses_count > 0 AND created_at > now() - ${intervalExpr}::interval) AS tools_with_uses,
          (SELECT COUNT(*)::integer FROM tools
            WHERE status = 'active' AND remixes_count > 0 AND created_at > now() - ${intervalExpr}::interval) AS tools_with_remixes,
          (SELECT COUNT(*)::integer FROM tools
            WHERE status = 'active' AND shares_count > 0 AND created_at > now() - ${intervalExpr}::interval) AS tools_with_shares
      `,
    ])

    const overview = overviewRows[0] ?? {}
    const generation = generationRows[0] ?? {}
    const remix = remixRows[0] ?? {}
    const waitlist = waitlistRows[0] ?? {}
    const revenue = revenueRows[0] ?? {}
    const funnel = funnelRows[0] ?? {}

    // Compute rates
    const totalToolsInPeriod = funnel.tools_created ?? 0
    const remixRate = totalToolsInPeriod > 0
      ? ((remix.total_remixes ?? 0) / totalToolsInPeriod * 100).toFixed(1)
      : '0.0'
    const shareRate = totalToolsInPeriod > 0
      ? ((funnel.tools_with_shares ?? 0) / totalToolsInPeriod * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      period,
      overview: {
        totalTools: overview.total_tools ?? 0,
        totalUsers: overview.total_users ?? 0,
        totalWaitlist: overview.total_waitlist ?? 0,
        totalEvents: overview.total_events ?? 0,
        totalGenerations: overview.total_generations ?? 0,
      },
      generation: {
        total: generation.total ?? 0,
        succeeded: generation.succeeded ?? 0,
        failed: generation.failed ?? 0,
        successRate: generation.total > 0
          ? ((generation.succeeded / generation.total) * 100).toFixed(1)
          : '0.0',
        avgLatencyMs: generation.avg_latency_ms ?? 0,
        totalCostCents: generation.total_cost_cents ?? 0,
      },
      generationTimeline: generationTimelineRows.map((r: Record<string, unknown>) => ({
        day: r.day,
        total: r.total,
        succeeded: r.succeeded,
        failed: r.failed,
      })),
      events: {
        breakdown: eventBreakdownRows.map((r: Record<string, unknown>) => ({
          type: r.event_type,
          count: r.count,
        })),
        timeline: eventTimelineRows.map((r: Record<string, unknown>) => ({
          day: r.day,
          type: r.event_type,
          count: r.count,
        })),
      },
      remix: {
        total: remix.total_remixes ?? 0,
        uniqueSources: remix.unique_sources ?? 0,
        remixRate: `${remixRate}%`,
      },
      waitlist: {
        total: waitlist.total ?? 0,
        periodSignups: waitlist.period_signups ?? 0,
        timeline: waitlistTimelineRows.map((r: Record<string, unknown>) => ({
          day: r.day,
          signups: r.signups,
        })),
      },
      revenue: {
        totalPurchases: revenue.total_purchases ?? 0,
        grossRevenueCents: revenue.gross_revenue_cents ?? 0,
        platformFeeCents: revenue.platform_fee_cents ?? 0,
      },
      funnel: {
        generationAttempts: funnel.generation_attempts ?? 0,
        toolsCreated: funnel.tools_created ?? 0,
        toolsWithViews: funnel.tools_with_views ?? 0,
        toolsWithUses: funnel.tools_with_uses ?? 0,
        toolsWithRemixes: funnel.tools_with_remixes ?? 0,
        toolsWithShares: funnel.tools_with_shares ?? 0,
      },
      shareRate: `${shareRate}%`,
      topTools: topToolRows.map((r: Record<string, unknown>) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category,
        views: r.views_count,
        uses: r.uses_count,
        remixes: r.remixes_count,
        shares: r.shares_count,
        likes: r.likes_count,
        score: r.score,
      })),
      categories: categoryRows.map((r: Record<string, unknown>) => ({
        category: r.category,
        count: r.count,
      })),
    })
  } catch (error) {
    console.error('[admin/analytics] GET error:', error)
    return NextResponse.json({
      period: req.nextUrl.searchParams.get('period') ?? '7d',
      overview: {
        totalTools: 0,
        totalUsers: 0,
        totalWaitlist: 0,
        totalEvents: 0,
        totalGenerations: 0,
      },
      generation: {
        total: 0,
        succeeded: 0,
        failed: 0,
        successRate: '0.0',
        avgLatencyMs: 0,
        totalCostCents: 0,
      },
      generationTimeline: [],
      events: {
        breakdown: [],
        timeline: [],
      },
      remix: {
        total: 0,
        uniqueSources: 0,
        remixRate: '0.0%',
      },
      waitlist: {
        total: 0,
        periodSignups: 0,
        timeline: [],
      },
      revenue: {
        totalPurchases: 0,
        grossRevenueCents: 0,
        platformFeeCents: 0,
      },
      funnel: {
        generationAttempts: 0,
        toolsCreated: 0,
        toolsWithViews: 0,
        toolsWithUses: 0,
        toolsWithRemixes: 0,
        toolsWithShares: 0,
      },
      shareRate: '0.0%',
      topTools: [],
      categories: [],
    })
  }
}
