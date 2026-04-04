import { NextRequest, NextResponse } from 'next/server'
import { getTrendingFeed } from '@/lib/feed'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feed/trending — Trending tools ranked by engagement velocity.
 *
 * Query params:
 *   category — filter by tool category
 *   cursor   — pagination cursor
 *   limit    — items per page (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category') ?? undefined
    const cursor = searchParams.get('cursor') ?? undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20

    const result = await getTrendingFeed(category, cursor, limit)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('[feed/trending] Error:', error)
    return NextResponse.json({ error: 'Failed to load trending feed' }, { status: 500 })
  }
}
