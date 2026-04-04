import { NextRequest, NextResponse } from 'next/server'
import { getFeed } from '@/lib/feed'
import type { FeedSort } from '@/lib/feed/types'
import { getSeedFeedResponse } from '@/lib/seed-tools'

const VALID_SORTS = ['trending', 'new', 'popular'] as const

/**
 * GET /api/feed — Returns the feed sections for the homepage.
 *
 * Query params:
 *   category — filter by tool category (money, productivity, social, creator, business, utility)
 *   sort     — sort mode: trending, new, or popular (default: popular)
 *   cursor   — pagination cursor (tool ID from previous page)
 *   limit    — items per page (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') ?? undefined
  const creator = searchParams.get('creator') ?? undefined
  const cursor = searchParams.get('cursor') ?? undefined
  const sortParam = searchParams.get('sort') ?? undefined
  const sort: FeedSort | undefined = sortParam && VALID_SORTS.includes(sortParam as FeedSort)
    ? (sortParam as FeedSort)
    : undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : undefined

  try {
    const feed = await getFeed({ category, creator, cursor, limit, sort })

    if (!creator && !cursor && feed.sections.length === 0) {
      const fallbackFeed = getSeedFeedResponse(category, limit ?? 20)
      return NextResponse.json(fallbackFeed, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      })
    }

    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[feed] Error:', error)
    const fallbackFeed = getSeedFeedResponse(category, limit ?? 20)
    return NextResponse.json(fallbackFeed, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  }
}
