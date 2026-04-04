import { getDb } from '../db';
import type { RankingWeights } from './types';
import { V2_WEIGHTS } from './types';

/**
 * Feed Ranking Engine — V1: Curated + Chronological with engagement boost
 *
 * Scoring formula:
 *   score = W_f * freshness + W_e * engagement + W_c * creator + W_t * trending
 *
 * Freshness:  exponential decay from created_at (half-life = 24h)
 * Engagement: normalized(views + 3*uses + 5*remixes + 2*shares + 1*likes)
 * Creator:    verified=1.0, pro=0.5, regular=0.0
 * Trending:   event velocity in last 4 hours vs 24-hour baseline
 */

const FRESHNESS_HALF_LIFE_HOURS = 24;
const TRENDING_WINDOW_HOURS = 4;
const TRENDING_BASELINE_HOURS = 24;

/**
 * Recompute ranking scores for all active tools and write to tool_ranking_scores.
 * Designed to be called on a cron (every 5-15 min) or after significant events.
 */
export async function recomputeRankings(weights: RankingWeights = V2_WEIGHTS): Promise<number> {
  const sql = getDb();

  // Single query: compute all scores and upsert into tool_ranking_scores
  const result = await sql`
    WITH engagement AS (
      SELECT
        t.id AS tool_id,
        -- Engagement signal weights: remix rate (3x), share rate (2x),
        -- view-to-use ratio (1.5x), likes (1x), base views (0.5x)
        LEAST(1.0, (
          0.5 * COALESCE(t.views_count, 0)
          + 1.5 * COALESCE(t.uses_count, 0)
          + 3.0 * COALESCE(t.remixes_count, 0)
          + 2.0 * COALESCE(t.shares_count, 0)
          + 1.0 * COALESCE(t.likes_count, 0)
        ) / GREATEST(1.0, (
          SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY
            0.5 * COALESCE(t2.views_count, 0)
            + 1.5 * COALESCE(t2.uses_count, 0)
            + 3.0 * COALESCE(t2.remixes_count, 0)
            + 2.0 * COALESCE(t2.shares_count, 0)
            + 1.0 * COALESCE(t2.likes_count, 0)
          ) FROM tools t2 WHERE t2.status = 'active'
        ))) AS engagement_score,

        -- Freshness: exponential decay with 24h half-life
        EXP(-0.693 * EXTRACT(EPOCH FROM (now() - t.created_at)) / (${FRESHNESS_HALF_LIFE_HOURS} * 3600))
          AS freshness_score,

        -- Creator reputation
        CASE
          WHEN u.is_verified THEN 1.0
          WHEN u.is_pro THEN 0.5
          ELSE 0.0
        END AS creator_score
      FROM tools t
      JOIN users u ON u.id = t.creator_id
      WHERE t.status = 'active'
    ),
    trending AS (
      SELECT
        e.tool_id,
        LEAST(1.0,
          COALESCE(COUNT(*) FILTER (
            WHERE e.created_at > now() - ${TRENDING_WINDOW_HOURS} * INTERVAL '1 hour'
          ), 0)::REAL
          / GREATEST(1.0,
            COUNT(*) FILTER (
              WHERE e.created_at > now() - ${TRENDING_BASELINE_HOURS} * INTERVAL '1 hour'
            )::REAL * (${TRENDING_WINDOW_HOURS}::REAL / ${TRENDING_BASELINE_HOURS}::REAL)
          )
        ) AS trending_score
      FROM feed_events e
      WHERE e.created_at > now() - ${TRENDING_BASELINE_HOURS} * INTERVAL '1 hour'
      GROUP BY e.tool_id
    ),
    scored AS (
      SELECT
        eng.tool_id,
        (${weights.freshness} * eng.freshness_score
         + ${weights.engagement} * eng.engagement_score
         + ${weights.creator} * eng.creator_score
         + ${weights.trending} * COALESCE(tr.trending_score, 0)
        ) AS score,
        COALESCE(tr.trending_score, 0) AS trending_score,
        eng.freshness_score,
        eng.engagement_score,
        eng.creator_score
      FROM engagement eng
      LEFT JOIN trending tr ON tr.tool_id = eng.tool_id
    )
    INSERT INTO tool_ranking_scores (tool_id, score, trending_score, freshness_score, engagement_score, creator_score, last_computed_at)
    SELECT tool_id, score, trending_score, freshness_score, engagement_score, creator_score, now()
    FROM scored
    ON CONFLICT (tool_id) DO UPDATE SET
      score = EXCLUDED.score,
      trending_score = EXCLUDED.trending_score,
      freshness_score = EXCLUDED.freshness_score,
      engagement_score = EXCLUDED.engagement_score,
      creator_score = EXCLUDED.creator_score,
      last_computed_at = now()
    RETURNING tool_id
  `;

  return result.length;
}

/**
 * Record a feed engagement event and bump the denormalized counter on the tool.
 */
export async function recordEvent(
  toolId: string,
  eventType: string,
  userId?: string,
  sessionId?: string,
  referrer?: string,
): Promise<void> {
  const sql = getDb();

  // Insert event
  await sql`
    INSERT INTO feed_events (tool_id, user_id, event_type, session_id, referrer)
    VALUES (${toolId}, ${userId ?? null}, ${eventType}, ${sessionId ?? null}, ${referrer ?? null})
  `;

  // Bump denormalized counter on tools table
  const counterColumn = EVENT_TO_COUNTER[eventType];
  if (counterColumn === 'views_count') {
    await sql`UPDATE tools SET views_count = views_count + 1, updated_at = now() WHERE id = ${toolId}`;
  } else if (counterColumn === 'uses_count') {
    await sql`UPDATE tools SET uses_count = uses_count + 1, updated_at = now() WHERE id = ${toolId}`;
  } else if (counterColumn === 'remixes_count') {
    await sql`UPDATE tools SET remixes_count = remixes_count + 1, updated_at = now() WHERE id = ${toolId}`;
  } else if (counterColumn === 'shares_count') {
    await sql`UPDATE tools SET shares_count = shares_count + 1, updated_at = now() WHERE id = ${toolId}`;
  } else if (counterColumn === 'likes_count') {
    await sql`UPDATE tools SET likes_count = likes_count + 1, updated_at = now() WHERE id = ${toolId}`;
  }
}

const EVENT_TO_COUNTER: Record<string, string> = {
  view: 'views_count',
  use: 'uses_count',
  remix: 'remixes_count',
  share: 'shares_count',
  like: 'likes_count',
  deploy: 'views_count', // deploys count as views for now
};
