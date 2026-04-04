-- AgentDoom Feed & Discovery Schema Extension
-- Adds tables for feed ranking, engagement tracking, and curated collections.

-- Feed engagement events (granular event log for ranking signals)
CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'use', 'remix', 'share', 'like', 'unlike', 'purchase', 'deploy'
  )),
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_events_tool ON feed_events(tool_id);
CREATE INDEX idx_feed_events_user ON feed_events(user_id);
CREATE INDEX idx_feed_events_type ON feed_events(event_type);
CREATE INDEX idx_feed_events_created ON feed_events(created_at DESC);
-- Composite index for trending queries (last N hours by event type)
CREATE INDEX idx_feed_events_trending ON feed_events(event_type, created_at DESC);

-- Curated collections (editorial picks, themed lists)
CREATE TABLE IF NOT EXISTS curated_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_curated_collections_active ON curated_collections(is_active, position);

-- Collection <-> tool membership
CREATE TABLE IF NOT EXISTS curated_collection_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES curated_collections(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, tool_id)
);

CREATE INDEX idx_curated_collection_tools_coll ON curated_collection_tools(collection_id, position);

-- Materialized ranking scores (refreshed periodically, used for fast feed queries)
CREATE TABLE IF NOT EXISTS tool_ranking_scores (
  tool_id UUID PRIMARY KEY REFERENCES tools(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  trending_score REAL NOT NULL DEFAULT 0,
  freshness_score REAL NOT NULL DEFAULT 0,
  engagement_score REAL NOT NULL DEFAULT 0,
  creator_score REAL NOT NULL DEFAULT 0,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_ranking_score ON tool_ranking_scores(score DESC);
CREATE INDEX idx_tool_ranking_trending ON tool_ranking_scores(trending_score DESC);

-- User likes (deduplicated, for like/unlike tracking)
CREATE TABLE IF NOT EXISTS user_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool_id)
);
