import { NextRequest, NextResponse } from 'next/server'
import { getFeaturedTool, getFeaturedHistory } from '@/lib/feed'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feed/featured — Returns today's featured tool or featured history.
 *
 * Query params:
 *   history — if "true", returns paginated history instead of today's pick
 *   cursor  — pagination cursor (date string) for history mode
 *   limit   — items per page for history (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const isHistory = searchParams.get('history') === 'true'

    if (isHistory) {
      const cursor = searchParams.get('cursor') ?? undefined
      const limitParam = searchParams.get('limit')
      const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20
      const result = await getFeaturedHistory(cursor, limit)
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      })
    }

    const featured = await getFeaturedTool()
    if (!featured) {
      return NextResponse.json({ tool: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      })
    }

    return NextResponse.json(featured, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('[feed/featured] Error:', error)
    return NextResponse.json({ error: 'Failed to load featured tool' }, { status: 500 })
  }
}
