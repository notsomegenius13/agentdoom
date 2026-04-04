import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { assembleTool } from '@/lib/forge/assemble';
import type { ToolConfig } from '@/lib/forge/generate';
import { recordEvent } from '@/lib/feed/ranking';
import { randomUUID } from 'crypto';
import { getSeedToolBySlugOrId } from '@/lib/seed-tools';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

/**
 * POST /api/tools/fork — Fork/remix an existing tool
 *
 * Body:
 *   sourceToolId: string — the original tool ID
 *   config: ToolConfig — the modified configuration
 *   attribution: { originalCreator: string, originalTitle: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { sourceToolId, config, attribution } = body as {
      sourceToolId: string;
      config: ToolConfig;
      attribution: { originalCreator: string; originalTitle: string };
    };

    if (!sourceToolId || !config) {
      return NextResponse.json({ error: 'sourceToolId and config are required' }, { status: 400 });
    }

    const sql = getDb();

    // Resolve authenticated user ID if session exists
    let creatorId: string | null = null;
    if (session?.user?.email) {
      const userRows =
        (await sql`SELECT id FROM users WHERE email = ${session.user.email} LIMIT 1`) as Record<
          string,
          unknown
        >[];
      if (userRows[0]) creatorId = userRows[0].id as string;
    }

    // Verify source tool exists
    const sourceRows = (await sql`
      SELECT id, category, prompt, creator_id
      FROM tools
      WHERE id::text = ${sourceToolId} OR slug = ${sourceToolId}
      LIMIT 1
    `) as Record<string, unknown>[];

    const sourceRow = sourceRows[0];
    const seedSource = !sourceRow ? getSeedToolBySlugOrId(sourceToolId) : null;
    if (!sourceRow && !seedSource) {
      return NextResponse.json({ error: 'Source tool not found' }, { status: 404 });
    }
    const slug = generateSlug(config.title);

    // Assemble new preview HTML from modified config
    const previewHtml = assembleTool(config);

    // Extract primitives used
    const primitivesUsed = config.primitives.map((p) => p.type);
    const newToolId = randomUUID();

    const sourceCategory = (sourceRow?.category as string | undefined) ?? seedSource!.category;
    const remixedFrom = sourceRow?.id as string | undefined;

    // Create forked tool
    if (remixedFrom) {
      await sql`
        INSERT INTO tools (id, slug, title, description, prompt, category, preview_html, remixed_from, creator_id, status)
        VALUES (${newToolId}, ${slug}, ${config.title}, ${config.description},
                ${`Forked from "${attribution.originalTitle}" by ${attribution.originalCreator}`},
                ${sourceCategory}, ${previewHtml}, ${remixedFrom}::uuid, ${creatorId}, 'active')
      `;
    } else {
      await sql`
        INSERT INTO tools (id, slug, title, description, prompt, category, preview_html, creator_id, status)
        VALUES (${newToolId}, ${slug}, ${config.title}, ${config.description},
                ${`Forked from "${attribution.originalTitle}" by ${attribution.originalCreator}`},
                ${sourceCategory}, ${previewHtml}, ${creatorId}, 'active')
      `;
    }

    // Save config
    await sql`
      INSERT INTO tool_configs (tool_id, config, primitives_used, model_used, is_current)
      VALUES (${newToolId}::uuid, ${JSON.stringify(config)}::jsonb, ${primitivesUsed}, 'fork', true)
    `;

    // Record remix event (also bumps remixes_count via recordEvent)
    if (remixedFrom) {
      await recordEvent(remixedFrom, 'remix');
    }

    return NextResponse.json({ id: newToolId, slug });
  } catch (error) {
    console.error('[tools/fork] POST error:', error);
    return NextResponse.json({ error: 'Failed to fork tool' }, { status: 500 });
  }
}
