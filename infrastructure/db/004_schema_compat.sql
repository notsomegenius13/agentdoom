-- Migration: Legacy schema compatibility upgrade
-- Purpose:
-- 1) Upgrade early schema.sql databases to current app expectations
-- 2) Keep migration idempotent and safe to re-run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------
-- users table compatibility
-- ----------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS clerk_id TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tools_created INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ----------------------------
-- tools table compatibility
-- ----------------------------
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'utility',
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deploy_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_html TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remixes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remixed_from UUID REFERENCES tools(id),
  ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill new counters from legacy names when available.
UPDATE tools
SET views_count = COALESCE((to_jsonb(tools)->>'view_count')::INTEGER, views_count, 0)
WHERE views_count = 0;

UPDATE tools
SET remixes_count = COALESCE((to_jsonb(tools)->>'remix_count')::INTEGER, remixes_count, 0)
WHERE remixes_count = 0;

UPDATE tools
SET shares_count = COALESCE((to_jsonb(tools)->>'share_count')::INTEGER, shares_count, 0)
WHERE shares_count = 0;

-- Backfill common nullable fields.
UPDATE tools
SET description = COALESCE(description, '')
WHERE description IS NULL;

UPDATE tools
SET category = COALESCE(category, 'utility')
WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_creator ON tools(creator_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_status_created ON tools(status, created_at DESC);

-- ----------------------------
-- tool_configs table (required by tool create/remix/seed flows)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  config JSONB NOT NULL,
  primitives_used TEXT[] NOT NULL,
  model_used TEXT NOT NULL,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_configs_tool ON tool_configs(tool_id);

-- ----------------------------
-- generations compatibility
-- ----------------------------
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS complexity_score REAL,
  ADD COLUMN IF NOT EXISTS primitives_selected TEXT[],
  ADD COLUMN IF NOT EXISTS model_latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS model_cost_cents REAL,
  ADD COLUMN IF NOT EXISTS validation_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tool_id UUID REFERENCES tools(id),
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- ----------------------------
-- feed/discovery tables
-- ----------------------------
CREATE TABLE IF NOT EXISTS curated_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curated_collection_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES curated_collections(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_curated_collection_tools_collection ON curated_collection_tools(collection_id);
CREATE INDEX IF NOT EXISTS idx_curated_collection_tools_tool ON curated_collection_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_curated_collection_tools_coll ON curated_collection_tools(collection_id, position);

CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'use', 'remix', 'share', 'like', 'unlike', 'purchase', 'deploy')),
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_events_tool ON feed_events(tool_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_user ON feed_events(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_type ON feed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_created_at ON feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_type_created ON feed_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_trending ON feed_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS tool_ranking_scores (
  tool_id UUID PRIMARY KEY REFERENCES tools(id) ON DELETE CASCADE,
  score REAL DEFAULT 0,
  trending_score REAL DEFAULT 0,
  freshness_score REAL DEFAULT 0,
  engagement_score REAL DEFAULT 0,
  creator_score REAL DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_ranking_score ON tool_ranking_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_tool_ranking_trending ON tool_ranking_scores(trending_score DESC);

CREATE TABLE IF NOT EXISTS user_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool_id)
);

-- ----------------------------
-- moderation/reporting compatibility
-- ----------------------------
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'block', 'review')),
  risk_score INTEGER NOT NULL DEFAULT 0,
  flags JSONB NOT NULL DEFAULT '[]',
  model_used TEXT NOT NULL,
  duration_ms INTEGER,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_tool ON moderation_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_verdict ON moderation_logs(verdict);
