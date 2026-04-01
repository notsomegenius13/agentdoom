import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/user/earnings — Creator earnings summary and transaction history.
 * Query params:
 *   userId — the creator's user ID (will be replaced by auth context later)
 *   period — 'all' | '30d' | '7d' | 'today' (default: 'all')
 *   limit  — transactions per page (default 20, max 50)
 *   cursor — pagination cursor (purchase ID)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const period = searchParams.get('period') ?? 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20;
    const cursor = searchParams.get('cursor') ?? undefined;

    const sql = getDb();

    // Period filter interval
    const periodFilter =
      period === '30d'
        ? sql`AND p.created_at > now() - INTERVAL '30 days'`
        : period === '7d'
          ? sql`AND p.created_at > now() - INTERVAL '7 days'`
          : period === 'today'
            ? sql`AND p.created_at > now() - INTERVAL '1 day'`
            : sql``;

    // Summary: total earnings, total sales, average sale
    const summaryRows = (await sql`
      SELECT
        COUNT(*)::INTEGER AS total_sales,
        COALESCE(SUM(p.amount_cents - p.platform_fee_cents - p.remix_royalty_cents), 0)::INTEGER AS total_earnings_cents,
        COALESCE(AVG(p.amount_cents - p.platform_fee_cents - p.remix_royalty_cents), 0)::INTEGER AS avg_earning_cents
      FROM purchases p
      JOIN tools t ON t.id = p.tool_id
      WHERE t.creator_id = ${userId}
        AND p.status = 'completed'
        ${periodFilter}
    `) as Record<string, unknown>[];

    const summary = summaryRows[0] ?? {
      total_sales: 0,
      total_earnings_cents: 0,
      avg_earning_cents: 0,
    };

    // Remix royalties earned (where this creator's tool was remixed and sold)
    const royaltyRows = (await sql`
      SELECT
        COALESCE(SUM(p.remix_royalty_cents), 0)::INTEGER AS total_royalties_cents,
        COUNT(*)::INTEGER AS royalty_count
      FROM purchases p
      JOIN tools remixed ON remixed.id = p.tool_id
      JOIN tools original ON original.id = remixed.remixed_from
      WHERE original.creator_id = ${userId}
        AND p.status = 'completed'
        AND p.remix_royalty_cents > 0
        ${periodFilter}
    `) as Record<string, unknown>[];

    const royalties = royaltyRows[0] ?? { total_royalties_cents: 0, royalty_count: 0 };

    // Recent transactions
    const txRows = (await sql`
      SELECT
        p.id, p.amount_cents, p.platform_fee_cents, p.remix_royalty_cents,
        p.status, p.created_at,
        t.id AS tool_id, t.slug AS tool_slug, t.title AS tool_title,
        buyer.username AS buyer_username
      FROM purchases p
      JOIN tools t ON t.id = p.tool_id
      LEFT JOIN users buyer ON buyer.id = p.buyer_id
      WHERE t.creator_id = ${userId}
        AND p.status = 'completed'
        ${periodFilter}
        ${cursor ? sql`AND p.created_at < (SELECT created_at FROM purchases WHERE id = ${cursor})` : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `) as Record<string, unknown>[];

    const transactions = txRows.map((row) => ({
      id: row.id,
      amountCents: row.amount_cents,
      platformFeeCents: row.platform_fee_cents,
      remixRoyaltyCents: row.remix_royalty_cents,
      netEarningsCents:
        (row.amount_cents as number) -
        (row.platform_fee_cents as number) -
        (row.remix_royalty_cents as number),
      status: row.status,
      createdAt: row.created_at ? String(row.created_at) : null,
      tool: {
        id: row.tool_id,
        slug: row.tool_slug,
        title: row.tool_title,
      },
      buyerUsername: row.buyer_username,
    }));

    const nextCursor = txRows.length === limit ? (txRows[txRows.length - 1].id as string) : null;

    // Top-selling tools
    const topToolsRows = (await sql`
      SELECT
        t.id, t.slug, t.title, t.price_cents,
        COUNT(p.id)::INTEGER AS sales_count,
        COALESCE(SUM(p.amount_cents - p.platform_fee_cents - p.remix_royalty_cents), 0)::INTEGER AS tool_earnings_cents
      FROM tools t
      JOIN purchases p ON p.tool_id = t.id AND p.status = 'completed'
      WHERE t.creator_id = ${userId}
        ${periodFilter}
      GROUP BY t.id
      ORDER BY tool_earnings_cents DESC
      LIMIT 5
    `) as Record<string, unknown>[];

    const topTools = topToolsRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      priceCents: row.price_cents,
      salesCount: row.sales_count,
      earningsCents: row.tool_earnings_cents,
    }));

    return NextResponse.json({
      period,
      summary: {
        totalSales: summary.total_sales,
        totalEarningsCents: summary.total_earnings_cents,
        avgEarningCents: summary.avg_earning_cents,
        totalRoyaltiesCents: royalties.total_royalties_cents,
        royaltyCount: royalties.royalty_count,
      },
      topTools,
      transactions,
      cursor: nextCursor,
    });
  } catch (error) {
    console.error('[earnings] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
