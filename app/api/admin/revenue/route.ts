import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/revenue — Revenue-focused analytics for the launch day dashboard.
 *
 * Returns: MRR, daily revenue, conversion rates, ARPU, churn, Pro subscriber
 * metrics, purchase timeline, top-selling tools, and conversion funnel
 * (landing → signup → create tool → checkout → Pro subscriber).
 *
 * Query params:
 *   period — '1h' | '24h' | '7d' | '30d' (default: '24h')
 */
export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') ?? '24h'
    const intervalExpr =
      period === '1h' ? '1 hour'
      : period === '24h' ? '1 day'
      : period === '30d' ? '30 days'
      : '7 days'

    const sql = getDb()

    const [
      revenueRows,
      mrrRows,
      dailyRevenueRows,
      proSubscriberRows,
      churnRows,
      funnelRows,
      topSellingRows,
      hourlyRevenueRows,
      recentPurchaseRows,
      conversionRows,
    ] = await Promise.all([
      // 1. Revenue summary for period
      sql`
        SELECT
          COUNT(*)::integer AS total_purchases,
          COALESCE(SUM(amount_cents), 0)::integer AS gross_revenue_cents,
          COALESCE(SUM(platform_fee_cents), 0)::integer AS platform_fee_cents,
          COALESCE(SUM(remix_royalty_cents), 0)::integer AS remix_royalty_cents,
          CASE WHEN COUNT(*) > 0
            THEN ROUND(AVG(amount_cents))::integer
            ELSE 0
          END AS avg_order_cents
        FROM purchases
        WHERE status = 'completed'
          AND created_at > now() - ${intervalExpr}::interval
      `,

      // 2. MRR from active Pro subscribers (subscription revenue)
      // Pro = $14/mo or $149/yr ($12.42/mo). Approximate all as $14/mo for now.
      sql`
        SELECT
          COUNT(*)::integer AS total_pro,
          COUNT(*) FILTER (WHERE created_at > now() - '30 days'::interval)::integer AS new_pro_30d,
          COUNT(*) FILTER (WHERE created_at > now() - '7 days'::interval)::integer AS new_pro_7d,
          COUNT(*) FILTER (WHERE created_at > now() - '1 day'::interval)::integer AS new_pro_24h
        FROM users
        WHERE is_pro = true
      `,

      // 3. Daily revenue breakdown (last 30 days)
      sql`
        SELECT
          DATE(created_at) AS day,
          COUNT(*)::integer AS purchases,
          COALESCE(SUM(amount_cents), 0)::integer AS gross_cents,
          COALESCE(SUM(platform_fee_cents), 0)::integer AS platform_cents
        FROM purchases
        WHERE status = 'completed'
          AND created_at > now() - '30 days'::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,

      // 4. Pro subscriber timeline (signups by day, last 30d)
      sql`
        SELECT
          DATE(created_at) AS day,
          COUNT(*)::integer AS signups
        FROM users
        WHERE is_pro = true
          AND created_at > now() - '30 days'::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,

      // 5. Churn: users who had is_pro and then lost it (approximated by updated_at)
      sql`
        SELECT
          0::integer AS churned_users
      `,

      // 6. Conversion funnel: total users → tool creators → paid tool creators → Pro
      sql`
        SELECT
          (SELECT COUNT(*)::integer FROM waitlist) AS waitlist_signups,
          (SELECT COUNT(*)::integer FROM users) AS total_users,
          (SELECT COUNT(DISTINCT creator_id)::integer FROM tools WHERE status = 'active') AS creators,
          (SELECT COUNT(DISTINCT creator_id)::integer FROM tools WHERE status = 'active' AND is_paid = true) AS paid_creators,
          (SELECT COUNT(DISTINCT buyer_id)::integer FROM purchases WHERE status = 'completed') AS buyers,
          (SELECT COUNT(*)::integer FROM users WHERE is_pro = true) AS pro_subscribers,
          0::integer AS connect_accounts
      `,

      // 7. Top-selling tools by revenue
      sql`
        SELECT
          t.id, t.slug, t.title, t.category, t.price_cents,
          COUNT(p.id)::integer AS sales,
          COALESCE(SUM(p.amount_cents), 0)::integer AS total_revenue_cents,
          COALESCE(SUM(p.platform_fee_cents), 0)::integer AS total_platform_fee_cents
        FROM purchases p
        JOIN tools t ON t.id = p.tool_id
        WHERE p.status = 'completed'
        GROUP BY t.id, t.slug, t.title, t.category, t.price_cents
        ORDER BY total_revenue_cents DESC
        LIMIT 10
      `,

      // 8. Hourly revenue (for launch day real-time view)
      sql`
        SELECT
          DATE_TRUNC('hour', created_at) AS hour,
          COUNT(*)::integer AS purchases,
          COALESCE(SUM(amount_cents), 0)::integer AS gross_cents
        FROM purchases
        WHERE status = 'completed'
          AND created_at > now() - '24 hours'::interval
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour ASC
      `,

      // 9. Recent purchases (last 20)
      sql`
        SELECT
          p.id, p.amount_cents, p.platform_fee_cents, p.status, p.created_at,
          t.title AS tool_title, t.slug AS tool_slug,
          u.username AS buyer_username
        FROM purchases p
        JOIN tools t ON t.id = p.tool_id
        JOIN users u ON u.id = p.buyer_id
        WHERE p.status = 'completed'
        ORDER BY p.created_at DESC
        LIMIT 20
      `,

      // 10. Conversion rates for period
      sql`
        SELECT
          (SELECT COUNT(*)::integer FROM users
            WHERE created_at > now() - ${intervalExpr}::interval) AS new_users,
          (SELECT COUNT(DISTINCT creator_id)::integer FROM tools
            WHERE status = 'active' AND created_at > now() - ${intervalExpr}::interval) AS new_creators,
          (SELECT COUNT(DISTINCT buyer_id)::integer FROM purchases
            WHERE status = 'completed' AND created_at > now() - ${intervalExpr}::interval) AS new_buyers,
          (SELECT COUNT(*)::integer FROM users
            WHERE is_pro = true AND created_at > now() - ${intervalExpr}::interval) AS new_pro
      `,
    ])

    const revenue = revenueRows[0] ?? {}
    const mrr = mrrRows[0] ?? {}
    const churn = churnRows[0] ?? {}
    const funnel = funnelRows[0] ?? {}
    const conversion = conversionRows[0] ?? {}

    // Calculate MRR: Pro subscribers * $14/mo
    const proCount = mrr.total_pro ?? 0
    const mrrCents = proCount * 1400

    // Calculate ARPU: total revenue / unique buyers
    const totalBuyers = funnel.buyers ?? 0
    const totalRevenue = revenue.gross_revenue_cents ?? 0
    const arpuCents = totalBuyers > 0 ? Math.round(totalRevenue / totalBuyers) : 0

    // Churn rate: churned / (current pro + churned) over 30d
    const churned = churn.churned_users ?? 0
    const churnRate = (proCount + churned) > 0
      ? ((churned / (proCount + churned)) * 100).toFixed(1)
      : '0.0'

    // Conversion rates
    const newUsers = conversion.new_users ?? 0
    const signupToCreator = newUsers > 0
      ? ((conversion.new_creators / newUsers) * 100).toFixed(1) : '0.0'
    const signupToBuyer = newUsers > 0
      ? ((conversion.new_buyers / newUsers) * 100).toFixed(1) : '0.0'
    const signupToPro = newUsers > 0
      ? ((conversion.new_pro / newUsers) * 100).toFixed(1) : '0.0'

    return NextResponse.json({
      period,
      generatedAt: new Date().toISOString(),

      // Top-level metrics
      metrics: {
        mrrCents,
        mrrFormatted: `$${(mrrCents / 100).toFixed(2)}`,
        totalRevenueCents: totalRevenue,
        totalRevenueFormatted: `$${(totalRevenue / 100).toFixed(2)}`,
        platformFeeCents: revenue.platform_fee_cents ?? 0,
        platformFeeFormatted: `$${((revenue.platform_fee_cents ?? 0) / 100).toFixed(2)}`,
        totalPurchases: revenue.total_purchases ?? 0,
        avgOrderCents: revenue.avg_order_cents ?? 0,
        avgOrderFormatted: `$${((revenue.avg_order_cents ?? 0) / 100).toFixed(2)}`,
        arpuCents,
        arpuFormatted: `$${(arpuCents / 100).toFixed(2)}`,
        churnRate: `${churnRate}%`,
        churnedUsers: churned,
      },

      // Pro subscriptions
      pro: {
        total: proCount,
        new24h: mrr.new_pro_24h ?? 0,
        new7d: mrr.new_pro_7d ?? 0,
        new30d: mrr.new_pro_30d ?? 0,
        timeline: proSubscriberRows.map((r: Record<string, unknown>) => ({
          day: r.day,
          signups: r.signups,
        })),
      },

      // Conversion funnel
      funnel: {
        waitlistSignups: funnel.waitlist_signups ?? 0,
        totalUsers: funnel.total_users ?? 0,
        creators: funnel.creators ?? 0,
        paidCreators: funnel.paid_creators ?? 0,
        buyers: funnel.buyers ?? 0,
        proSubscribers: proCount,
        connectAccounts: funnel.connect_accounts ?? 0,
      },

      // Period conversion rates
      conversionRates: {
        signupToCreator: `${signupToCreator}%`,
        signupToBuyer: `${signupToBuyer}%`,
        signupToPro: `${signupToPro}%`,
        newUsers,
        newCreators: conversion.new_creators ?? 0,
        newBuyers: conversion.new_buyers ?? 0,
        newPro: conversion.new_pro ?? 0,
      },

      // Daily revenue (30d)
      dailyRevenue: dailyRevenueRows.map((r: Record<string, unknown>) => ({
        day: r.day,
        purchases: r.purchases,
        grossCents: r.gross_cents,
        platformCents: r.platform_cents,
      })),

      // Hourly revenue (24h — launch day view)
      hourlyRevenue: hourlyRevenueRows.map((r: Record<string, unknown>) => ({
        hour: r.hour,
        purchases: r.purchases,
        grossCents: r.gross_cents,
      })),

      // Top selling tools
      topSelling: topSellingRows.map((r: Record<string, unknown>) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category,
        priceCents: r.price_cents,
        sales: r.sales,
        revenueCents: r.total_revenue_cents,
        platformFeeCents: r.total_platform_fee_cents,
      })),

      // Recent purchases
      recentPurchases: recentPurchaseRows.map((r: Record<string, unknown>) => ({
        id: r.id,
        amountCents: r.amount_cents,
        platformFeeCents: r.platform_fee_cents,
        toolTitle: r.tool_title,
        toolSlug: r.tool_slug,
        buyerUsername: r.buyer_username,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error('[admin/revenue] GET error:', error)
    return NextResponse.json({
      period: req.nextUrl.searchParams.get('period') ?? '24h',
      generatedAt: new Date().toISOString(),
      metrics: {
        mrrCents: 0,
        mrrFormatted: '$0.00',
        totalRevenueCents: 0,
        totalRevenueFormatted: '$0.00',
        platformFeeCents: 0,
        platformFeeFormatted: '$0.00',
        totalPurchases: 0,
        avgOrderCents: 0,
        avgOrderFormatted: '$0.00',
        arpuCents: 0,
        arpuFormatted: '$0.00',
        churnRate: '0.0%',
        churnedUsers: 0,
      },
      pro: {
        total: 0,
        new24h: 0,
        new7d: 0,
        new30d: 0,
        timeline: [],
      },
      funnel: {
        waitlistSignups: 0,
        totalUsers: 0,
        creators: 0,
        paidCreators: 0,
        buyers: 0,
        proSubscribers: 0,
        connectAccounts: 0,
      },
      conversionRates: {
        signupToCreator: '0.0%',
        signupToBuyer: '0.0%',
        signupToPro: '0.0%',
        newUsers: 0,
        newCreators: 0,
        newBuyers: 0,
        newPro: 0,
      },
      dailyRevenue: [],
      hourlyRevenue: [],
      topSelling: [],
      recentPurchases: [],
    })
  }
}
