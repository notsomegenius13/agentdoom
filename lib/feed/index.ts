import { getDb } from '../db';
import type {
  FeedTool,
  FeaturedTool,
  FeedSection,
  FeedResponse,
  FeedQuery,
  FeedSort,
  SearchResult,
} from './types';

export { recomputeRankings, recordEvent } from './ranking';
export type {
  FeedTool,
  FeaturedTool,
  FeedSection,
  FeedResponse,
  FeedQuery,
  FeedSort,
  EventType,
  SearchResult,
} from './types';

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

  // Creator-specific feed: skip spotlight sections, return flat list
  if (query.creator) {
    const tools = await getCreatorTools(query.creator, query.category, query.cursor, limit);
    if (tools.length > 0) {
      sections.push({ type: 'chronological', title: 'Published Tools', tools });
    }
    const nextCursor = tools.length === limit ? tools[tools.length - 1].id : null;
    return { sections, cursor: nextCursor };
  }

  // Only include spotlight sections on first page (no cursor)
  if (!query.cursor) {
    const [featured, curated, trending, justShipped] = await Promise.all([
      getFeaturedTool(),
      getCurated(query.category),
      getTrending(query.category),
      getJustShipped(query.category),
    ]);

    if (featured) {
      sections.push({ type: 'featured', title: 'Tool of the Day', tools: [featured.tool] });
    }
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

  // Main feed (sorted by requested mode, paginated)
  const sort = query.sort ?? 'popular';
  const mainTools = await getSortedFeed(sort, query.category, query.cursor, limit);
  if (mainTools.length > 0) {
    const sortTitles: Record<string, string> = {
      trending: 'Trending',
      new: 'New',
      popular: 'For You',
    };
    sections.push({
      type: 'chronological',
      title: sortTitles[sort] ?? 'For You',
      tools: mainTools,
    });
  }

  const nextCursor = mainTools.length === limit ? mainTools[mainTools.length - 1].id : null;

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
    LEFT JOIN tools orig ON orig.id = t.remixed_from
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
    LEFT JOIN tools orig ON orig.id = t.remixed_from
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
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE t.status = 'active'
      AND t.created_at > now() - INTERVAL '2 hours'
      ${category ? sql`AND t.category = ${category}` : sql``}
    ORDER BY t.created_at DESC
    LIMIT ${JUST_SHIPPED_LIMIT}
  `;
  return rows.map(mapToolRow);
}

/** Dispatch feed query based on sort mode */
async function getSortedFeed(
  sort: FeedSort,
  category?: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<FeedTool[]> {
  switch (sort) {
    case 'trending':
      return getTrendingSorted(category, cursor, limit);
    case 'new':
      return getNewestFeed(category, cursor, limit);
    case 'popular':
    default:
      return getRankedFeed(category, cursor, limit);
  }
}

/** Sort by trending_score (engagement velocity) */
async function getTrendingSorted(
  category?: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    LEFT JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY COALESCE(rs.trending_score, 0) DESC, t.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapToolRow);
}

/** Sort by newest first (reverse chronological) */
async function getNewestFeed(
  category?: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY t.created_at DESC
    LIMIT ${limit}
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
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    LEFT JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY COALESCE(rs.score, 0) DESC, t.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapToolRow);
}

/** Tools by a specific creator (for profile pages) */
async function getCreatorTools(
  creatorUsername: string,
  category?: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<FeedTool[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE u.username = ${creatorUsername}
      AND t.status = 'active'
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY t.created_at DESC
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
    u.is_verified AS creator_is_verified,
    orig.slug AS remixed_from_slug, orig.title AS remixed_from_title
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
    remixedFromSlug: row.remixed_from_slug as string | null,
    remixedFromTitle: row.remixed_from_title as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

/**
 * GET /api/feed/trending — standalone trending endpoint.
 * Returns tools ranked by trending_score, optionally filtered by category.
 */
export async function getTrendingFeed(
  category?: string,
  cursor?: string,
  limit: number = 20,
): Promise<{ tools: FeedTool[]; cursor: string | null }> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      AND rs.trending_score > 0
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY rs.trending_score DESC, t.created_at DESC
    LIMIT ${limit}
  `;
  const tools = rows.map(mapToolRow);
  return {
    tools,
    cursor: tools.length === limit ? tools[tools.length - 1].id : null,
  };
}

/**
 * GET /api/feed/category/:id — tools in a specific category, ranked by score.
 */
export async function getCategoryFeed(
  category: string,
  cursor?: string,
  limit: number = 20,
): Promise<{ tools: FeedTool[]; cursor: string | null }> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    LEFT JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      AND t.category = ${category}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY COALESCE(rs.score, 0) DESC, t.created_at DESC
    LIMIT ${limit}
  `;
  const tools = rows.map(mapToolRow);
  return {
    tools,
    cursor: tools.length === limit ? tools[tools.length - 1].id : null,
  };
}

/**
 * Full-text search across tool titles and descriptions.
 * Uses PostgreSQL ILIKE for V1 (upgrade to tsvector for scale).
 */
export async function searchFeed(
  query: string,
  category?: string,
  cursor?: string,
  limit: number = 20,
): Promise<SearchResult> {
  const sql = getDb();
  const pattern = `%${query}%`;

  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    LEFT JOIN tool_ranking_scores rs ON rs.tool_id = t.id
    WHERE t.status = 'active'
      AND (t.title ILIKE ${pattern} OR t.description ILIKE ${pattern})
      ${category ? sql`AND t.category = ${category}` : sql``}
      ${cursor ? sql`AND t.id < ${cursor}` : sql``}
    ORDER BY
      CASE WHEN t.title ILIKE ${pattern} THEN 0 ELSE 1 END,
      COALESCE(rs.score, 0) DESC,
      t.created_at DESC
    LIMIT ${limit}
  `;

  const countResult = await sql`
    SELECT COUNT(*)::int AS total
    FROM tools t
    WHERE t.status = 'active'
      AND (t.title ILIKE ${pattern} OR t.description ILIKE ${pattern})
      ${category ? sql`AND t.category = ${category}` : sql``}
  `;

  const tools = rows.map(mapToolRow);
  return {
    tools,
    total: countResult[0]?.total ?? 0,
    cursor: tools.length === limit ? tools[tools.length - 1].id : null,
  };
}

/**
 * Get a single tool by slug. Used for server-side metadata generation.
 */
export async function getToolBySlug(slug: string): Promise<FeedTool | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()}
    FROM tools t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE t.slug = ${slug}
      AND t.status = 'active'
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return mapToolRow(rows[0]);
}

/**
 * Get today's featured tool (Tool of the Day).
 * Returns null if no tool is featured today.
 */
export async function getFeaturedTool(): Promise<FeaturedTool | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()},
      ft.featured_date, ft.reason AS featured_reason, ft.selected_by
    FROM featured_tools ft
    JOIN tools t ON t.id = ft.tool_id
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE ft.featured_date = CURRENT_DATE
      AND t.status = 'active'
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    tool: mapToolRow(row),
    featuredDate: (row.featured_date as Date).toISOString().split('T')[0],
    reason: row.featured_reason as string | null,
    selectedBy: row.selected_by as 'auto' | 'admin',
  };
}

/**
 * Get featured tool history, ordered by date descending.
 */
export async function getFeaturedHistory(
  cursor?: string,
  limit: number = 20,
): Promise<{ items: FeaturedTool[]; cursor: string | null }> {
  const sql = getDb();
  const rows = await sql`
    SELECT ${toolColumns()},
      ft.featured_date, ft.reason AS featured_reason, ft.selected_by, ft.id AS ft_id
    FROM featured_tools ft
    JOIN tools t ON t.id = ft.tool_id
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN tools orig ON orig.id = t.remixed_from
    WHERE t.status = 'active'
      ${cursor ? sql`AND ft.featured_date < ${cursor}` : sql``}
    ORDER BY ft.featured_date DESC
    LIMIT ${limit}
  `;
  const items: FeaturedTool[] = rows.map((row) => ({
    tool: mapToolRow(row),
    featuredDate: (row.featured_date as Date).toISOString().split('T')[0],
    reason: row.featured_reason as string | null,
    selectedBy: row.selected_by as 'auto' | 'admin',
  }));
  return {
    items,
    cursor: items.length === limit ? items[items.length - 1].featuredDate : null,
  };
}

/**
 * Set a tool as featured for a specific date (admin pick).
 * Upserts — replaces any existing pick for that date.
 */
export async function setFeaturedTool(
  toolId: string,
  reason?: string,
  date?: string,
): Promise<void> {
  const sql = getDb();
  const featuredDate = date ?? new Date().toISOString().split('T')[0];
  await sql`
    INSERT INTO featured_tools (tool_id, featured_date, reason, selected_by)
    VALUES (${toolId}, ${featuredDate}, ${reason ?? null}, 'admin')
    ON CONFLICT (featured_date) DO UPDATE SET
      tool_id = EXCLUDED.tool_id,
      reason = EXCLUDED.reason,
      selected_by = 'admin'
  `;
}

/**
 * Auto-select Tool of the Day: highest engagement tool from yesterday
 * that hasn't been featured in the last 7 days.
 */
export async function autoSelectFeaturedTool(): Promise<string | null> {
  const sql = getDb();

  // Check if an admin already picked today
  const existing = await sql`
    SELECT 1 FROM featured_tools
    WHERE featured_date = CURRENT_DATE AND selected_by = 'admin'
  `;
  if (existing.length > 0) return null;

  // Pick tool with most engagement events yesterday, not featured recently
  const rows = await sql`
    SELECT t.id
    FROM tools t
    JOIN feed_events fe ON fe.tool_id = t.id
    WHERE t.status = 'active'
      AND fe.created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND fe.created_at < CURRENT_DATE
      AND t.id NOT IN (
        SELECT tool_id FROM featured_tools
        WHERE featured_date > CURRENT_DATE - INTERVAL '7 days'
      )
    GROUP BY t.id
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  const toolId = rows[0].id as string;
  await sql`
    INSERT INTO featured_tools (tool_id, featured_date, reason, selected_by)
    VALUES (${toolId}, CURRENT_DATE, 'Most engaged tool from yesterday', 'auto')
    ON CONFLICT (featured_date) DO UPDATE SET
      tool_id = EXCLUDED.tool_id,
      reason = EXCLUDED.reason,
      selected_by = 'auto'
  `;
  return toolId;
}

/**
 * Toggle like/unlike for a user on a tool.
 * Returns the new like state (true = liked, false = unliked).
 */
export async function toggleLike(userId: string, toolId: string): Promise<boolean> {
  const sql = getDb();

  // Check if already liked
  const existing = await sql`
    SELECT 1 FROM user_likes WHERE user_id = ${userId} AND tool_id = ${toolId}
  `;

  if (existing.length > 0) {
    // Unlike
    await sql`DELETE FROM user_likes WHERE user_id = ${userId} AND tool_id = ${toolId}`;
    await sql`UPDATE tools SET likes_count = GREATEST(0, likes_count - 1), updated_at = now() WHERE id = ${toolId}`;
    return false;
  } else {
    // Like
    await sql`INSERT INTO user_likes (user_id, tool_id) VALUES (${userId}, ${toolId}) ON CONFLICT DO NOTHING`;
    await sql`UPDATE tools SET likes_count = likes_count + 1, updated_at = now() WHERE id = ${toolId}`;
    return true;
  }
}
