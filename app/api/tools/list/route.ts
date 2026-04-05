import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getSeedFeedResponse } from '@/lib/seed-tools';

/**
 * GET /api/tools/list — List tools. Supports ?creator=me to return only the authenticated user's tools.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') ?? undefined;
  const creator = searchParams.get('creator') ?? undefined;
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam ?? '50', 10) || 50, 1), 100);

  // Handle creator=me: return only the authenticated user's tools
  if (creator === 'me') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      const sql = getDb();
      const userRows = (await sql`
        SELECT id FROM users WHERE email = ${session.user.email.toLowerCase()} LIMIT 1
      `) as Record<string, unknown>[];
      if (userRows.length === 0) {
        return NextResponse.json({ tools: [] });
      }
      const userId = userRows[0].id as string;
      const rows = (await sql`
        SELECT t.id, t.slug, t.title, t.description, t.category,
               t.preview_html, t.is_paid, t.price_cents,
               t.views_count, t.likes_count, t.remixes_count, t.created_at
        FROM tools t
        WHERE t.status = 'active' AND t.creator_id = ${userId}::uuid
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      `) as Record<string, unknown>[];
      return NextResponse.json({
        tools: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          category: row.category,
          previewHtml: row.preview_html ?? null,
          isPaid: row.is_paid,
          priceCents: row.price_cents,
          createdAt: row.created_at ? String(row.created_at) : null,
          viewsCount: (row.views_count as number) ?? 0,
          likesCount: (row.likes_count as number) ?? 0,
          remixesCount: (row.remixes_count as number) ?? 0,
        })),
      });
    } catch (error) {
      console.error('[tools/list] creator=me error:', error);
      return NextResponse.json({ error: 'Failed to fetch your tools' }, { status: 500 });
    }
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        t.id,
        t.slug,
        t.title,
        t.description,
        t.category,
        t.deploy_url,
        t.is_paid,
        t.price_cents,
        t.created_at,
        u.username AS creator_username,
        u.display_name AS creator_display_name
      FROM tools t
      LEFT JOIN users u ON u.id = t.creator_id
      WHERE t.status = 'active'
        ${category ? sql`AND t.category = ${category}` : sql``}
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `) as Record<string, unknown>[];

    if (rows.length > 0) {
      return NextResponse.json(
        {
          tools: rows.map((row) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            category: row.category,
            deployUrl: row.deploy_url,
            isPaid: row.is_paid,
            priceCents: row.price_cents,
            createdAt: row.created_at ? String(row.created_at) : null,
            creator: {
              username: row.creator_username ?? 'agentdoom',
              displayName: row.creator_display_name ?? 'AgentDoom',
            },
          })),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        },
      );
    }

    const seedFallback = getSeedFeedResponse(category, limit);
    const tools = seedFallback.sections.flatMap((section) => section.tools);
    return NextResponse.json(
      {
        tools: tools.map((tool) => ({
          id: tool.id,
          slug: tool.slug,
          title: tool.title,
          description: tool.description,
          category: tool.category,
          deployUrl: tool.deployUrl,
          isPaid: tool.isPaid,
          priceCents: tool.priceCents,
          createdAt: tool.createdAt,
          creator: {
            username: tool.creator.username,
            displayName: tool.creator.displayName,
          },
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error('[tools/list] GET error:', error);
    const seedFallback = getSeedFeedResponse(category, limit);
    const tools = seedFallback.sections.flatMap((section) => section.tools);
    return NextResponse.json(
      {
        tools: tools.map((tool) => ({
          id: tool.id,
          slug: tool.slug,
          title: tool.title,
          description: tool.description,
          category: tool.category,
          deployUrl: tool.deployUrl,
          isPaid: tool.isPaid,
          priceCents: tool.priceCents,
          createdAt: tool.createdAt,
          creator: {
            username: tool.creator.username,
            displayName: tool.creator.displayName,
          },
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  }
}
