import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feed/activity
 * Returns real-time activity stats: active generations count and recently deployed tools.
 * Polled by the client every 10-15s to power the "building now" indicator.
 */
export async function GET() {
  try {
    const sql = getDb()

    const [buildingResult, recentDeploys] = await Promise.all([
      // Count recently active generation attempts (schema-safe: use status)
      sql`
        SELECT COUNT(*)::int AS count
        FROM generations
        WHERE created_at > now() - INTERVAL '60 seconds'
          AND status != 'failed'
      `,
      // Last 10 tools deployed in the last 5 minutes
      sql`
        SELECT t.id, t.slug, t.title, t.category,
          u.username AS creator_username,
          u.display_name AS creator_display_name,
          u.avatar_url AS creator_avatar_url,
          t.created_at
        FROM tools t
        JOIN users u ON u.id = t.creator_id
        WHERE t.status = 'active'
          AND t.created_at > now() - INTERVAL '5 minutes'
        ORDER BY t.created_at DESC
        LIMIT 10
      `,
    ])

    return NextResponse.json(
      {
        buildingNow: buildingResult[0]?.count ?? 0,
        recentDeploys: recentDeploys.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          category: r.category,
          creator: r.creator_display_name || r.creator_username,
          creatorAvatar: r.creator_avatar_url,
          createdAt: r.created_at ? String(r.created_at) : null,
        })),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
        },
      },
    )
  } catch (error) {
    console.error('[feed/activity] GET error:', error)
    return NextResponse.json({ buildingNow: 0, recentDeploys: [] })
  }
}
