import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getSeedToolBySlugOrId } from '@/lib/seed-tools';

/**
 * GET /api/tools/:toolId — Fetch a single tool with its config
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const { toolId } = await params;
    const sql = getDb();

    const rows = (await sql`
      SELECT t.id, t.slug, t.title, t.description, t.category,
             t.preview_html, t.deploy_url, t.is_paid, t.price_cents,
             t.remixed_from, t.remixes_count,
             t.views_count, t.likes_count, t.uses_count, t.shares_count,
             t.creator_id,
             u.username AS creator_username,
             u.display_name AS creator_display_name,
             u.avatar_url AS creator_avatar_url,
             u.is_verified AS creator_is_verified,
             u.is_pro AS creator_is_pro,
             tc.config,
             original.slug AS original_slug,
             original.title AS original_title
      FROM tools t
      LEFT JOIN users u ON u.id = t.creator_id
      LEFT JOIN tool_configs tc ON tc.tool_id = t.id AND tc.is_current = true
      LEFT JOIN tools original ON original.id = t.remixed_from
      WHERE t.id::text = ${toolId} OR t.slug = ${toolId}
    `) as Record<string, unknown>[];

    const row = rows[0];
    if (!row) {
      let seedTool = null;
      try {
        seedTool = getSeedToolBySlugOrId(toolId);
      } catch (seedError) {
        console.warn('[tools] seed fallback lookup failed:', seedError);
      }

      if (!seedTool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          id: `seed:${seedTool.slug}`,
          slug: seedTool.slug,
          title: seedTool.title,
          description: seedTool.description,
          category: seedTool.category,
          previewHtml: seedTool.previewHtml,
          deployUrl: null,
          isPaid: false,
          priceCents: 0,
          remixedFrom: null,
          remixedFromSlug: null,
          remixedFromTitle: null,
          remixesCount: 0,
          viewsCount: 0,
          likesCount: 0,
          usesCount: 0,
          sharesCount: 0,
          creatorId: 'seed-creator',
          creator: {
            username: 'agentdoom',
            displayName: 'AgentDoom',
            avatarUrl: null,
            isVerified: true,
            stripeAccountId: null,
            isPro: false,
          },
          config: seedTool.config,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        },
      );
    }

    return NextResponse.json(
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        previewHtml: row.preview_html,
        deployUrl: row.deploy_url,
        isPaid: row.is_paid,
        priceCents: row.price_cents,
        remixedFrom: row.remixed_from,
        remixedFromSlug: row.original_slug ?? null,
        remixedFromTitle: row.original_title ?? null,
        remixesCount: row.remixes_count,
        viewsCount: (row.views_count as number) ?? 0,
        likesCount: (row.likes_count as number) ?? 0,
        usesCount: (row.uses_count as number) ?? 0,
        sharesCount: (row.shares_count as number) ?? 0,
        creatorId: row.creator_id,
        creator: {
          username: row.creator_username ?? 'agentdoom',
          displayName: row.creator_display_name,
          avatarUrl: row.creator_avatar_url,
          isVerified: row.creator_is_verified,
          stripeAccountId: null,
          isPro: row.creator_is_pro ?? false,
        },
        config: row.config,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error('[tools] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
  }
}

/**
 * PUT /api/tools/:toolId — Update tool metadata (title, description, price, status)
 * Body: { title?, description?, priceCents?, isPaid?, status?, category? }
 * Auth: Only the tool creator or an admin can update.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { toolId } = await params;
    const body = await req.json();
    const sql = getDb();

    // Validate tool exists
    const existing =
      (await sql`SELECT id, creator_id FROM tools WHERE id::text = ${toolId}`) as Record<
        string,
        unknown
      >[];
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Verify the authenticated user is the tool creator
    const creatorId = existing[0].creator_id as string;
    const userRows =
      (await sql`SELECT id FROM users WHERE email = ${session.user.email}`) as Record<
        string,
        unknown
      >[];
    if (userRows.length === 0 || userRows[0].id !== creatorId) {
      return NextResponse.json({ error: 'Not authorized to modify this tool' }, { status: 403 });
    }

    const { title, description, priceCents, isPaid, status, category } = body;

    // Validate status if provided
    const validStatuses = ['active', 'draft', 'moderated', 'deleted'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate price if setting to paid
    if (isPaid && (priceCents === undefined || priceCents < 300)) {
      return NextResponse.json(
        { error: 'Paid tools require a minimum price of $3.00 (300 cents)' },
        { status: 400 },
      );
    }

    const actualId = existing[0].id as string;

    const rows = (await sql`
      UPDATE tools SET
        title = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        price_cents = COALESCE(${priceCents ?? null}, price_cents),
        is_paid = COALESCE(${isPaid ?? null}, is_paid),
        status = COALESCE(${status ?? null}, status),
        category = COALESCE(${category ?? null}, category),
        updated_at = now()
      WHERE id = ${actualId}
      RETURNING id, slug, title, description, category, is_paid, price_cents, status, updated_at
    `) as Record<string, unknown>[];

    const row = rows[0];

    return NextResponse.json({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      isPaid: row.is_paid,
      priceCents: row.price_cents,
      status: row.status,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    });
  } catch (error) {
    console.error('[tools] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

/**
 * DELETE /api/tools/:toolId — Soft-delete a tool (sets status to 'deleted')
 * Auth: Only the tool creator or an admin can delete.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { toolId } = await params;
    const sql = getDb();

    // Fetch tool to verify ownership
    const existing = (await sql`
      SELECT id, creator_id FROM tools
      WHERE (id::text = ${toolId} OR slug = ${toolId}) AND status != 'deleted'
    `) as Record<string, unknown>[];

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tool not found or already deleted' }, { status: 404 });
    }

    // Verify the authenticated user is the tool creator
    const creatorId = existing[0].creator_id as string;
    const userRows =
      (await sql`SELECT id FROM users WHERE email = ${session.user.email}`) as Record<
        string,
        unknown
      >[];
    if (userRows.length === 0 || userRows[0].id !== creatorId) {
      return NextResponse.json({ error: 'Not authorized to delete this tool' }, { status: 403 });
    }

    const actualId = existing[0].id as string;
    await sql`
      UPDATE tools SET status = 'deleted', updated_at = now()
      WHERE id = ${actualId}
    `;

    return NextResponse.json({ id: actualId, slug: existing[0].slug, deleted: true });
  } catch (error) {
    console.error('[tools] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
