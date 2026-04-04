import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/creators — Top creators leaderboard
 * Ranked by total remixes across all their tools.
 * Query params: limit (default 20)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const sql = getDb();

    const rows = (await sql`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.is_verified,
        u.is_pro,
        u.tools_created,
        u.created_at,
        COALESCE(SUM(t.remixes_count), 0)::int AS total_remixes,
        COALESCE(SUM(t.views_count), 0)::int AS total_views,
        COALESCE(SUM(t.likes_count), 0)::int AS total_likes,
        COALESCE(SUM(t.shares_count), 0)::int AS total_shares
      FROM users u
      LEFT JOIN tools t ON t.creator_id = u.id AND t.status = 'active'
      WHERE u.tools_created > 0
      GROUP BY u.id
      ORDER BY total_remixes DESC, total_likes DESC, u.tools_created DESC
      LIMIT ${limit}
    `) as Record<string, unknown>[];

    const creators = rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      isVerified: row.is_verified,
      isPro: row.is_pro,
      toolsCreated: row.tools_created,
      followersCount: 0,
      totalRemixes: row.total_remixes,
      totalViews: row.total_views,
      totalLikes: row.total_likes,
      totalShares: row.total_shares,
      createdAt: row.created_at ? String(row.created_at) : null,
    }));

    return NextResponse.json({ creators });
  } catch (error) {
    console.error('[creators] GET error:', error);
    return NextResponse.json({ creators: [] });
  }
}
