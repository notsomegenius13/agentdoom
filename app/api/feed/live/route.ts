import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feed/live
 * Server-Sent Events stream that pushes newly deployed tools in real time.
 * The client connects once and receives events as tools are created.
 * On Vercel, SSE connections are limited to ~25s (serverless timeout),
 * so the client auto-reconnects using EventSource.
 */
export async function GET() {
  const encoder = new TextEncoder()
  let cancelled = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (cancelled) return
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        )
      }

      // Send initial heartbeat
      send('connected', { ts: Date.now() })

      const sql = getDb()
      let lastSeenAt = new Date().toISOString()

      // Poll every 3 seconds for new tools (serverless-friendly approach)
      const poll = async () => {
        if (cancelled) return

        try {
          const rows = await sql`
            SELECT t.id, t.slug, t.title, t.category,
              u.username AS creator_username,
              u.display_name AS creator_display_name,
              u.avatar_url AS creator_avatar_url,
              t.created_at
            FROM tools t
            JOIN users u ON u.id = t.creator_id
            WHERE t.status = 'active'
              AND t.created_at > ${lastSeenAt}
            ORDER BY t.created_at ASC
            LIMIT 5
          `

          for (const row of rows) {
            send('new_tool', {
              id: row.id,
              slug: row.slug,
              title: row.title,
              category: row.category,
              creator: row.creator_display_name || row.creator_username,
              creatorAvatar: row.creator_avatar_url,
              createdAt: (row.created_at as Date).toISOString(),
            })
            lastSeenAt = (row.created_at as Date).toISOString()
          }

          // Also send building count
          const buildingResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM generations
            WHERE created_at > now() - INTERVAL '60 seconds'
              AND status != 'failed'
          `
          send('activity', {
            buildingNow: buildingResult[0]?.count ?? 0,
            ts: Date.now(),
          })
        } catch (err) {
          console.error('Live feed poll error:', err)
        }

        // Schedule next poll (up to ~25s total for Vercel serverless limit)
        if (!cancelled) {
          setTimeout(poll, 3000)
        }
      }

      // Start polling
      setTimeout(poll, 1000)

      // Auto-close after 25 seconds (Vercel serverless limit is 30s)
      setTimeout(() => {
        cancelled = true
        try {
          send('reconnect', { after: 1000 })
          controller.close()
        } catch {
          // stream already closed
        }
      }, 25000)
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  })
}
