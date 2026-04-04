import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stats — Public platform stats for the /stats page.
 *
 * Returns: total tools, creator leaderboard, category breakdown,
 * recent activity counter, and aggregate platform engagement.
 */
export async function GET() {
  try {
    const sql = getDb()

    const [
      overviewRows,
      leaderboardRows,
      categoryRows,
      recentRows,
      engagementRows,
    ] = await Promise.all([
      // 1. Big counters: total tools, unique creators, total views, total forks
      sql`
        SELECT
          (SELECT COUNT(*)::integer FROM tools WHERE status = 'active') AS total_tools,
          (SELECT COUNT(DISTINCT creator_id)::integer FROM tools WHERE status = 'active') AS unique_creators,
          (SELECT COALESCE(SUM(views_count), 0)::bigint FROM tools WHERE status = 'active') AS total_views,
          (SELECT COALESCE(SUM(remixes_count), 0)::bigint FROM tools WHERE status = 'active') AS total_forks
      `,

      // 2. Creator leaderboard: top 10 by tool count + total views
      sql`
        SELECT
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.is_verified,
          u.is_pro,
          u.tools_created,
          COALESCE(SUM(t.views_count), 0)::bigint AS total_views,
          COALESCE(SUM(t.remixes_count), 0)::bigint AS total_remixes,
          COALESCE(SUM(t.likes_count), 0)::bigint AS total_likes
        FROM users u
        LEFT JOIN tools t ON t.creator_id = u.id AND t.status = 'active'
        WHERE u.tools_created > 0
        GROUP BY u.id
        ORDER BY u.tools_created DESC, total_views DESC
        LIMIT 10
      `,

      // 3. Category breakdown
      sql`
        SELECT category, COUNT(*)::integer AS count
        FROM tools
        WHERE status = 'active'
        GROUP BY category
        ORDER BY count DESC
      `,

      // 4. Built in the last hour
      sql`
        SELECT COUNT(*)::integer AS last_hour
        FROM tools
        WHERE status = 'active'
          AND created_at > now() - interval '1 hour'
      `,

      // 5. Aggregate engagement stats
      sql`
        SELECT
          COALESCE(SUM(views_count), 0)::bigint AS views,
          COALESCE(SUM(uses_count), 0)::bigint AS uses,
          COALESCE(SUM(remixes_count), 0)::bigint AS forks,
          COALESCE(SUM(shares_count), 0)::bigint AS shares,
          COALESCE(SUM(likes_count), 0)::bigint AS likes
        FROM tools
        WHERE status = 'active'
      `,
    ])

    const overview = overviewRows[0] ?? {}
    const recent = recentRows[0] ?? {}
    const engagement = engagementRows[0] ?? {}

    return NextResponse.json(
      {
        overview: {
          totalTools: overview.total_tools ?? 0,
          uniqueCreators: overview.unique_creators ?? 0,
          totalViews: Number(overview.total_views ?? 0),
          totalForks: Number(overview.total_forks ?? 0),
        },
        leaderboard: leaderboardRows.map((r: Record<string, unknown>) => ({
          id: r.id,
          username: r.username,
          displayName: r.display_name,
          avatarUrl: r.avatar_url,
          isVerified: r.is_verified,
          isPro: r.is_pro,
          toolsCreated: r.tools_created,
          totalViews: Number(r.total_views ?? 0),
          totalRemixes: Number(r.total_remixes ?? 0),
          totalLikes: Number(r.total_likes ?? 0),
        })),
        categories: categoryRows.map((r: Record<string, unknown>) => ({
          category: r.category,
          count: r.count,
        })),
        builtLastHour: recent.last_hour ?? 0,
        engagement: {
          views: Number(engagement.views ?? 0),
          uses: Number(engagement.uses ?? 0),
          forks: Number(engagement.forks ?? 0),
          shares: Number(engagement.shares ?? 0),
          likes: Number(engagement.likes ?? 0),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('[stats] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
