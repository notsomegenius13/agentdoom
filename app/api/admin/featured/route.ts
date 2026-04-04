import { NextRequest, NextResponse } from 'next/server'
import { setFeaturedTool } from '@/lib/feed'

/**
 * POST /api/admin/featured — Set the Tool of the Day (admin only).
 *
 * Body:
 *   toolId  — UUID of the tool to feature (required)
 *   reason  — optional reason/tagline for featuring
 *   date    — optional date string (YYYY-MM-DD), defaults to today
 */
export async function POST(req: NextRequest) {
  try {
    // V1: simple auth via CRON_SECRET header (same pattern as other admin endpoints)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { toolId, reason, date } = body

    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json({ error: 'toolId is required' }, { status: 400 })
    }

    await setFeaturedTool(toolId, reason, date)

    return NextResponse.json({ ok: true, toolId, date: date ?? new Date().toISOString().split('T')[0] })
  } catch (error) {
    console.error('[admin/featured] Error:', error)
    return NextResponse.json({ error: 'Failed to set featured tool' }, { status: 500 })
  }
}
