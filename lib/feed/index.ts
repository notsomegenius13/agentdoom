import { getDb } from '../db';
import type { FeedTool, FeedSection, FeedResponse, FeedQuery } from './types';

export { recomputeRankings, recordEvent } from './ranking';
export type { FeedTool, FeedSection, FeedResponse, FeedQuery, EventType } from './types';

const DEFAULT_LIMIT = 20;
const TRENDING_LIMIT = 10;
const JUST_SHIPPED_LIMIT = 8;
const CURATED_LIMIT = 6;

/**
 * Get the full feed for a user. V1: sections-based layout.
 *
 * Sections returned (in order):
 *  1. Curated picks (editorial)
 *  2. Trending (highest trending_score in last 4h)
 *  3. Just shipped (newest active tools, last 2h)
 *  4. Chronological feed (ranked, paginated via cursor)
 */
export async function getFeed(query: FeedQuery = {}): Promise<FeedResponse> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const sections: FeedSection[] = [];

  // Only include spotlight sections on first page (no cursor)
  if (!query.cursor) {
    const [curated, trending, justShipped] = await Promise.all([
      getCurated(query.category),
      getTrending(query.category),
      getJustShipped(query.category),
    ]);

    if (curated.length > 0) {
      sections.push({ type: 'curated', title: "Editor's Picks", tools: curated });
    }
    if (trending.length > 0) {
      sections.push({ type: 'trending', title: 'Trending Now', tools: trending });
    }
    if (justShipped.length > 0) {
      sections.push({ type: 'just_shipped', title: 'Just Shipped', tools: justShipped });
    }
  }

  // Main chronological feed (ranked by score, paginated)
  const ranked = await getRankedFeed(query.category, query.cursor, limit);
  if (ranked.length > 0) {
    sections.push({ type: 'chronological', title: 'For You', tools: ranked });
  }

  const nextCursor = ranked.length === limit ? ranked[ranked.length - 1].id : null;

  return { sections, cursor: nextCursor };
}

/** Curated editorial picks from active collections */
async function getCurated(category?: string): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM curated_collection_tools cct
    JOIN curated_collections cc ON cc.id = cct.collection_id
    JOIN tools t ON t.id = cct.tool_id
    JOIN users u ON u.id = t.creator_id
    WHERE cc.is_active = true
      AND t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
    ORDER BY cc.position, cct.position
    LIMIT ${CURATED_LIMIT}
  `;
  return rows.map(mapToolRow);
}

/** Tools with highest trending_score in the last 4 hours */
async function getTrending(category?: string): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      AND rs.trending_score > 0
      ${category ? sql`AND t.category = ${category}` : sql``}
    ORDER BY rs.trending_score DESC
    LIMIT ${TRENDING_LIMIT}
  `;
  return rows.map(mapToolRow);
}

/** Most recently created active tools (last 2 hours) */
async function getJustShipped(category?: string): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    WHERE t.status = 'active'
      AND t.created_at > now() - INTERVAL '2 hours'
      ${category ? sql`AND t.category = ${category}` : sql``}
    ORDER BY t.created_at DESC
    LIMIT ${JUST_SHIPPED_LIMIT}
  `;
  return rows.map(mapToolRow);
}

/** Main feed: ranked by score, cursor-paginated */
async function getRankedFeed(
  category?: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY COALESCE(rs.score, 0) DESC, t.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapToolRow);
}

/** Shared column selection for tool queries */
function toolColumns() {
  return getDb()`
    t.id, t.slug, t.title, t.description, t.prompt, t.category,
    t.deploy_url, t.thumbnail_url, t.preview_html,
    t.is_paid, t.price_cents,
    t.views_count, t.uses_count, t.remixes_count, t.shares_count, t.likes_count,
    t.remixed_from, t.created_at,
    u.id AS creator_id, u.username AS creator_username,
    u.display_name AS creator_display_name, u.avatar_url AS creator_avatar_url,
    u.is_verified AS creator_is_verified
  `;
}

function mapToolRow(row: Record<string, unknown>): FeedTool {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string | null,
    prompt: row.prompt as string,
    category: row.category as string,
    creator: {
      id: row.creator_id as string,
      username: row.creator_username as string,
      displayName: row.creator_display_name as string | null,
      avatarUrl: row.creator_avatar_url as string | null,
      isVerified: row.creator_is_verified as boolean,
    },
    deployUrl: row.deploy_url as string | null,
    thumbnailUrl: row.thumbnail_url as string | null,
    previewHtml: row.preview_html as string | null,
    isPaid: row.is_paid as boolean,
    priceCents: row.price_cents as number,
    viewsCount: row.views_count as number,
    usesCount: row.uses_count as number,
    remixesCount: row.remixes_count as number,
    sharesCount: row.shares_count as number,
    likesCount: row.likes_count as number,
    remixedFrom: row.remixed_from as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}
