import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/tools/:toolId/analytics — Tool-level analytics for the creator dashboard.
 * Query params:
 *   period — '7d' | '30d' | '90d' (default: '30d')
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params
    const period = req.nextUrl.searchParams.get('period') ?? '30d'

    const intervalDays = period === '7d' ? 7 : period === '90d' ? 90 : 30

    const sql = getDb()

    // Verify tool exists
    const toolRows = await sql`
      SELECT id, title, slug, views_count, uses_count, remixes_count, shares_count, likes_count, price_cents, is_paid
      FROM tools WHERE id::text = ${toolId} OR slug = ${toolId}
    ` as Record<string, unknown>[]

    if (toolRows.length === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    const tool = toolRows[0]
    const actualToolId = tool.id as string

    // Daily event breakdown for the period
    const dailyRows = await sql`
      SELECT
        DATE(created_at) AS day,
        event_type,
        COUNT(*)::INTEGER AS count
      FROM feed_events
      WHERE tool_id = ${actualToolId}
        AND created_at > now() - (${intervalDays} || ' days')::INTERVAL
      GROUP BY DATE(created_at), event_type
      ORDER BY day DESC
    ` as Record<string, unknown>[]

    // Purchase stats for this tool
    const purchaseRows = await sql`
      SELECT
        COUNT(*)::INTEGER AS total_purchases,
        COALESCE(SUM(amount_cents), 0)::INTEGER AS total_revenue_cents,
        COALESCE(SUM(amount_cents - platform_fee_cents - remix_royalty_cents), 0)::INTEGER AS net_earnings_cents
      FROM purchases
      WHERE tool_id = ${actualToolId}
        AND status = 'completed'
        AND created_at > now() - (${intervalDays} || ' days')::INTERVAL
    ` as Record<string, unknown>[]

    const purchaseStats = purchaseRows[0] ?? { total_purchases: 0, total_revenue_cents: 0, net_earnings_cents: 0 }

    // Top referrers
    const referrerRows = await sql`
      SELECT referrer, COUNT(*)::INTEGER AS count
      FROM feed_events
      WHERE tool_id = ${actualToolId}
        AND referrer IS NOT NULL
        AND created_at > now() - (${intervalDays} || ' days')::INTERVAL
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    ` as Record<string, unknown>[]

    return NextResponse.json({
      tool: {
        id: tool.id,
        title: tool.title,
        slug: tool.slug,
        isPaid: tool.is_paid,
        priceCents: tool.price_cents,
      },
      period,
      totals: {
        views: tool.views_count,
        uses: tool.uses_count,
        remixes: tool.remixes_count,
        shares: tool.shares_count,
        likes: tool.likes_count,
      },
      purchases: {
        count: purchaseStats.total_purchases,
        revenueCents: purchaseStats.total_revenue_cents,
        netEarningsCents: purchaseStats.net_earnings_cents,
      },
      daily: dailyRows.map((row) => ({
        day: row.day,
        eventType: row.event_type,
        count: row.count,
      })),
      topReferrers: referrerRows.map((row) => ({
        referrer: row.referrer,
        count: row.count,
      })),
    })
  } catch (error) {
    console.error('[analytics] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
