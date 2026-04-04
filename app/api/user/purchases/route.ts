import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/purchases — Fetch purchase history for the authenticated user.
 * Query params:
 *   userId — the buyer's user ID (will be replaced by auth context later)
 *   status — filter by purchase status (completed, refunded, etc.)
 *   limit  — results per page (default 20, max 50)
 *   cursor — pagination cursor (purchase ID)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const status = searchParams.get('status') ?? undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20;
    const cursor = searchParams.get('cursor') ?? undefined;

    const sql = getDb();

    const rows = (await sql`
      SELECT
        p.id, p.amount_cents, p.platform_fee_cents, p.status, p.created_at,
        t.id AS tool_id, t.slug AS tool_slug, t.title AS tool_title,
        t.category AS tool_category, t.thumbnail_url AS tool_thumbnail_url,
        t.preview_html AS tool_preview_html,
        u.username AS creator_username, u.display_name AS creator_display_name,
        u.avatar_url AS creator_avatar_url
      FROM purchases p
      JOIN tools t ON t.id = p.tool_id
      LEFT JOIN users u ON u.id = t.creator_id
      WHERE p.buyer_id = ${userId}
        ${status ? sql`AND p.status = ${status}` : sql``}
        ${cursor ? sql`AND p.created_at < (SELECT created_at FROM purchases WHERE id = ${cursor})` : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `) as Record<string, unknown>[];

    const purchases = rows.map((row) => ({
      id: row.id,
      amountCents: row.amount_cents,
      platformFeeCents: row.platform_fee_cents,
      status: row.status,
      createdAt: row.created_at ? String(row.created_at) : null,
      tool: {
        id: row.tool_id,
        slug: row.tool_slug,
        title: row.tool_title,
        category: row.tool_category,
        thumbnailUrl: row.tool_thumbnail_url,
        previewHtml: row.tool_preview_html,
      },
      creator: {
        username: row.creator_username,
        displayName: row.creator_display_name,
        avatarUrl: row.creator_avatar_url,
      },
    }));

    const nextCursor = rows.length === limit ? (rows[rows.length - 1].id as string) : null;

    return NextResponse.json({ purchases, cursor: nextCursor });
  } catch (error) {
    console.error('[purchases] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
