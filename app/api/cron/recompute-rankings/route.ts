import { NextRequest, NextResponse } from 'next/server'
import { recomputeRankings, autoSelectFeaturedTool } from '@/lib/feed'

/**
 * GET /api/cron/recompute-rankings — Vercel Cron handler.
 * Recomputes tool ranking scores. Runs every 10 minutes.
 * Also auto-selects Tool of the Day if none has been picked today.
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const start = Date.now()
    const count = await recomputeRankings()

    // Auto-select Tool of the Day if no admin pick exists for today
    let featuredToolId: string | null = null;
    try {
      featuredToolId = await autoSelectFeaturedTool();
      if (featuredToolId) {
        console.log(`[cron] Auto-selected Tool of the Day: ${featuredToolId}`);
      }
    } catch (err) {
      console.error('[cron] Failed to auto-select featured tool:', err);
    }

    const duration = Date.now() - start

    console.log(`[cron/recompute-rankings] Scored ${count} tools in ${duration}ms`)

    return NextResponse.json({
      ok: true,
      toolsScored: count,
      durationMs: duration,
      featuredToolId,
    })
  } catch (error) {
    console.error('[cron/recompute-rankings] Error:', error)
    return NextResponse.json({ error: 'Ranking recomputation failed' }, { status: 500 })
  }
}
