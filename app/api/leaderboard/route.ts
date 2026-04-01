import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/leaderboard — Top tools by views or forks.
 * Query params:
 *   by    — 'views' (default) or 'forks'
 *   limit — number of results (default 10, max 20)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const by = searchParams.get('by') === 'forks' ? 'forks' : 'views';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    const sql = getDb();

    const rows =
      by === 'forks'
        ? await sql`
          SELECT
            t.id, t.slug, t.title, t.category,
            t.views_count, t.remixes_count, t.likes_count,
            t.is_paid, t.price_cents,
            u.username AS creator_username,
            u.display_name AS creator_display_name,
            u.avatar_url AS creator_avatar_url,
            u.is_verified AS creator_is_verified
          FROM tools t
          JOIN users u ON u.id = t.creator_id
          WHERE t.status = 'active'
          ORDER BY t.remixes_count DESC, t.created_at DESC
          LIMIT ${limit}
        `
        : await sql`
          SELECT
            t.id, t.slug, t.title, t.category,
            t.views_count, t.remixes_count, t.likes_count,
            t.is_paid, t.price_cents,
            u.username AS creator_username,
            u.display_name AS creator_display_name,
            u.avatar_url AS creator_avatar_url,
            u.is_verified AS creator_is_verified
          FROM tools t
          JOIN users u ON u.id = t.creator_id
          WHERE t.status = 'active'
          ORDER BY t.views_count DESC, t.created_at DESC
          LIMIT ${limit}
        `;

    const tools = (rows as Record<string, unknown>[]).map((row, index) => ({
      rank: index + 1,
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      viewsCount: row.views_count,
      forksCount: row.remixes_count,
      likesCount: row.likes_count,
      isPaid: row.is_paid,
      priceCents: row.price_cents,
      creator: {
        username: row.creator_username,
        displayName: row.creator_display_name,
        avatarUrl: row.creator_avatar_url,
        isVerified: row.creator_is_verified,
      },
    }));

    return NextResponse.json(
      { by, tools },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('[leaderboard] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
