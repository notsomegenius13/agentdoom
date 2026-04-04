/**
 * Seed tools import script
 * Reads seed tool JSON configs from data/seed-tools/,
 * assembles preview HTML, and inserts them into the database.
 *
 * Usage: npx tsx scripts/seed-tools.ts
 * Requires: DATABASE_URL environment variable
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { neon } from '@neondatabase/serverless'
import { assembleTool } from '../lib/forge/assemble'
import type { ToolConfig } from '../lib/forge/generate'

const DATA_DIR = join(__dirname, '..', 'data', 'seed-tools')
const ENGAGEMENT_PATH = join(__dirname, '..', 'data', 'seed', 'engagement-seed.json')
const CREATORS_PATH = join(__dirname, '..', 'data', 'seed', 'creator-profiles.json')

/** Normalize categories to match UI filter options */
const CATEGORY_MAP: Record<string, string> = {
  health: 'productivity',
  fun: 'social',
  utilities: 'utility',
}

function normalizeCategory(cat: string): string {
  return CATEGORY_MAP[cat] ?? cat
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

async function ensureSeedCreators(
  sql: ReturnType<typeof neon<false, false>>,
): Promise<Map<string, string>> {
  const creators = JSON.parse(readFileSync(CREATORS_PATH, 'utf-8'))
  const idMap = new Map<string, string>() // creator-001 → real UUID

  for (const profile of creators.profiles) {
    // Check if user already exists by username
    const existing = await sql`SELECT id FROM users WHERE username = ${profile.username}` as Record<string, unknown>[]
    if (existing.length > 0) {
      idMap.set(profile.id, existing[0].id as string)
      console.log(`  CREATOR EXISTS: ${profile.displayName} (@${profile.username})`)
      continue
    }

    const userId = randomUUID()
    await sql`
      INSERT INTO users (id, clerk_id, username, display_name, bio, is_verified, is_pro, tools_created)
      VALUES (
        ${userId}::uuid, ${'seed-' + profile.id}, ${profile.username},
        ${profile.displayName}, ${profile.bio},
        ${profile.verified ?? false}, ${false},
        ${profile.toolCount ?? 0}
      )
    `
    idMap.set(profile.id, userId)
    console.log(`  CREATOR OK: ${profile.displayName} (@${profile.username})`)
  }

  return idMap
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const sql = neon(databaseUrl, { fullResults: false, arrayMode: false })

  // Step 1: Create seed creators
  console.log('Creating seed creator profiles...')
  const creatorIdMap = await ensureSeedCreators(sql)

  // Load index
  const index = JSON.parse(readFileSync(join(DATA_DIR, 'index.json'), 'utf-8'))
  const tools: Array<{ file: string; category: string; primitives: string[] }> = index.tools

  // Load engagement data (includes creatorId mapping)
  const engagementMap = new Map<string, { views: number; forks: number; likes: number; shares: number; creatorId: string }>()
  try {
    const engagement = JSON.parse(readFileSync(ENGAGEMENT_PATH, 'utf-8'))
    for (const e of engagement.toolEngagement) {
      engagementMap.set(e.slug, { views: e.views, forks: e.forks, likes: e.likes, shares: e.shares, creatorId: e.creatorId })
    }
  } catch {
    console.log('No engagement seed data found, using defaults')
  }

  console.log(`\nFound ${tools.length} seed tools to import`)

  // Default creator for tools without engagement data
  const defaultCreatorId = creatorIdMap.values().next().value

  let imported = 0
  let skipped = 0

  for (const entry of tools) {
    const configPath = join(DATA_DIR, entry.file)
    const config: ToolConfig & { category?: string } = JSON.parse(readFileSync(configPath, 'utf-8'))
    const slug = generateSlug(config.title)
    const category = normalizeCategory(config.category || entry.category)

    // Check if already exists
    const existing = await sql`SELECT id FROM tools WHERE slug = ${slug}` as Record<string, unknown>[]
    if (existing.length > 0) {
      console.log(`  SKIP: "${config.title}" (slug "${slug}" already exists)`)
      skipped++
      continue
    }

    // Assemble preview HTML
    let previewHtml: string
    try {
      previewHtml = assembleTool(config as ToolConfig)
    } catch (err) {
      console.error(`  ERROR assembling "${config.title}":`, err)
      continue
    }

    const toolId = randomUUID()
    const primitivesUsed = config.primitives.map((p) => p.type)
    const engagement = engagementMap.get(slug)

    // Resolve creator UUID from engagement data or use default
    const seedCreatorKey = engagement?.creatorId ?? 'creator-001'
    const creatorId = creatorIdMap.get(seedCreatorKey) ?? defaultCreatorId

    // Insert tool with creator_id
    await sql`
      INSERT INTO tools (id, slug, title, description, prompt, category, creator_id, preview_html, status,
        views_count, remixes_count, likes_count, shares_count)
      VALUES (
        ${toolId}::uuid, ${slug}, ${config.title}, ${config.description},
        ${'Seed tool: ' + config.title}, ${category}, ${creatorId}::uuid, ${previewHtml}, 'active',
        ${engagement?.views || 0}, ${engagement?.forks || 0},
        ${engagement?.likes || 0}, ${engagement?.shares || 0}
      )
    `

    // Insert config
    await sql`
      INSERT INTO tool_configs (tool_id, config, primitives_used, model_used, is_current)
      VALUES (${toolId}::uuid, ${JSON.stringify(config)}::jsonb, ${primitivesUsed}, 'seed', true)
    `

    console.log(`  OK: "${config.title}" → ${slug} [${category}] (${primitivesUsed.join(', ')})`)
    imported++
  }

  // Step 3: Compute initial ranking scores
  if (imported > 0) {
    console.log('\nComputing initial ranking scores...')
    const scored = await sql`
      INSERT INTO tool_ranking_scores (tool_id, score, trending_score, freshness_score, engagement_score, creator_score, last_computed_at)
      SELECT
        t.id,
        0.40 * 1.0
          + 0.25 * LEAST(1.0, (COALESCE(t.views_count, 0) + 3.0 * COALESCE(t.uses_count, 0) + 5.0 * COALESCE(t.remixes_count, 0) + 2.0 * COALESCE(t.shares_count, 0) + COALESCE(t.likes_count, 0))
            / GREATEST(1.0, (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY COALESCE(t2.views_count,0) + 3.0*COALESCE(t2.uses_count,0) + 5.0*COALESCE(t2.remixes_count,0) + 2.0*COALESCE(t2.shares_count,0) + COALESCE(t2.likes_count,0)) FROM tools t2 WHERE t2.status = 'active')))
          + 0.10 * CASE WHEN u.is_verified THEN 1.0 WHEN u.is_pro THEN 0.5 ELSE 0.0 END
          + 0.25 * 0.0
        AS score,
        0.0 AS trending_score,
        1.0 AS freshness_score,
        LEAST(1.0, (COALESCE(t.views_count, 0) + 3.0 * COALESCE(t.uses_count, 0) + 5.0 * COALESCE(t.remixes_count, 0) + 2.0 * COALESCE(t.shares_count, 0) + COALESCE(t.likes_count, 0))
          / GREATEST(1.0, (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY COALESCE(t2.views_count,0) + 3.0*COALESCE(t2.uses_count,0) + 5.0*COALESCE(t2.remixes_count,0) + 2.0*COALESCE(t2.shares_count,0) + COALESCE(t2.likes_count,0)) FROM tools t2 WHERE t2.status = 'active'))) AS engagement_score,
        CASE WHEN u.is_verified THEN 1.0 WHEN u.is_pro THEN 0.5 ELSE 0.0 END AS creator_score,
        now()
      FROM tools t
      JOIN users u ON u.id = t.creator_id
      WHERE t.status = 'active'
      ON CONFLICT (tool_id) DO UPDATE SET
        score = EXCLUDED.score,
        freshness_score = EXCLUDED.freshness_score,
        engagement_score = EXCLUDED.engagement_score,
        creator_score = EXCLUDED.creator_score,
        last_computed_at = now()
      RETURNING tool_id
    ` as Record<string, unknown>[]
    console.log(`Ranked ${scored.length} tools`)
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped`)
}

main().catch((err) => {
  console.error('Seed script failed:', err)
  process.exit(1)
})
