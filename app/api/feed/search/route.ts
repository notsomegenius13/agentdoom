import { NextRequest, NextResponse } from 'next/server'
import { searchFeed } from '@/lib/feed'
import { getSeedFeedResponse } from '@/lib/seed-tools'

/**
 * GET /api/feed/search — Full-text search across tools.
 *
 * Query params:
 *   q        — search query (required, min 2 chars)
 *   category — filter by tool category
 *   cursor   — pagination cursor
 *   limit    — items per page (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const category = searchParams.get('category') ?? undefined
  const cursor = searchParams.get('cursor') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20

  try {
    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 },
      )
    }

    const result = await searchFeed(q.trim(), category, cursor, limit)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('[feed/search] Error:', error)
    const fallback = getSeedFeedResponse(category, limit)
    const qLower = (q ?? '').trim().toLowerCase()
    const tools = fallback.sections[0].tools.filter((tool) => {
      return tool.title.toLowerCase().includes(qLower) || (tool.description ?? '').toLowerCase().includes(qLower)
    })

    return NextResponse.json({
      tools,
      total: tools.length,
      cursor: null,
    })
  }
}
