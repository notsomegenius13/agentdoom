import { NextRequest, NextResponse } from 'next/server'
import { getCategoryFeed } from '@/lib/feed'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['money', 'productivity', 'social', 'creator', 'business', 'utility']

/**
 * GET /api/feed/category?id=money — Tools in a specific category, ranked by score.
 *
 * Query params:
 *   id     — category slug (required)
 *   cursor — pagination cursor
 *   limit  — items per page (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const id = (searchParams.get('id') ?? searchParams.get('category') ?? '').trim().toLowerCase()

    if (!id || !VALID_CATEGORIES.includes(id)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      )
    }

    const cursor = searchParams.get('cursor') ?? undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20

    const result = await getCategoryFeed(id, cursor, limit)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[feed/category] Error:', error)
    return NextResponse.json({ error: 'Failed to load category feed' }, { status: 500 })
  }
}
