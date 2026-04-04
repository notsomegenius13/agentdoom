import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ToolConfig } from '@/lib/forge/generate';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function ensureLocalCreator(name?: string): Promise<string> {
  const sql = getDb();
  const existing = (await sql`
    SELECT id FROM users WHERE username = 'localcreator' LIMIT 1
  `) as Record<string, unknown>[];

  if (existing.length > 0) {
    return existing[0].id as string;
  }

  const userId = randomUUID();
  await sql`
    INSERT INTO users (id, clerk_id, username, display_name, is_verified, is_pro)
    VALUES (${userId}::uuid, 'localcreator', 'localcreator', ${name ?? 'Local Creator'}, false, false)
  `;
  return userId;
}

/**
 * POST /api/tools — Create a new tool record from Create Tool flow.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      pricing,
      priceCents,
      previewHtml,
      config,
      creatorName,
    } = body as {
      title?: string;
      description?: string;
      category?: string;
      pricing?: 'free' | 'paid';
      priceCents?: number;
      previewHtml?: string;
      config?: ToolConfig;
      creatorName?: string;
    };

    if (!title || !description || !category || !previewHtml || !config) {
      return NextResponse.json(
        { error: 'title, description, category, previewHtml, and config are required' },
        { status: 400 },
      );
    }

    const isPaid = pricing === 'paid';
    const normalizedPriceCents = isPaid ? Math.max(300, priceCents ?? 300) : 0;
    const sql = getDb();
    const creatorId = await ensureLocalCreator(creatorName);

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
    const toolId = randomUUID();
    const primitivesUsed = config.primitives.map((p) => p.type);

    await sql`
      INSERT INTO tools (
        id, slug, title, description, prompt, creator_id, category,
        is_paid, price_cents, preview_html, status
      )
      VALUES (
        ${toolId}::uuid, ${slug}, ${title}, ${description},
        ${`Creator tool: ${title}`},
        ${creatorId}::uuid, ${category},
        ${isPaid}, ${normalizedPriceCents}, ${previewHtml}, 'active'
      )
    `;

    await sql`
      INSERT INTO tool_configs (tool_id, config, primitives_used, model_used, is_current)
      VALUES (${toolId}::uuid, ${JSON.stringify(config)}::jsonb, ${primitivesUsed}, 'create-tool', true)
    `;

    return NextResponse.json({
      id: toolId,
      slug,
      title,
      description,
      category,
      isPaid,
      priceCents: normalizedPriceCents,
    });
  } catch (error) {
    console.error('[tools] POST error:', error);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
