/**
 * AgentDoom Database Schema — PostgreSQL via Neon
 * Tables: users, tools, tool_configs, generations, primitives
 */

export const SCHEMA_SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  stripe_customer_id TEXT,
  stripe_charges_enabled BOOLEAN DEFAULT false,
  stripe_payouts_enabled BOOLEAN DEFAULT false,
  tools_created INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tools (the deployed micro-apps)
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'moderated', 'deleted')),
  is_paid BOOLEAN DEFAULT false,
  price_cents INTEGER DEFAULT 0,
  deploy_url TEXT,
  preview_html TEXT,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  remixes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  remixed_from UUID REFERENCES tools(id),
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_creator ON tools(creator_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_status_created ON tools(status, created_at DESC);

-- Tool Configurations (the JSON config that Forge generates)
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

-- Generations (audit log of every generation attempt)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  category TEXT,
  complexity_score REAL,
  primitives_selected TEXT[],
  model_used TEXT NOT NULL,
  model_latency_ms INTEGER,
  model_cost_cents REAL,
  validation_passed BOOLEAN,
  retry_count INTEGER DEFAULT 0,
  tool_id UUID REFERENCES tools(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- Primitives (the component library registry)
CREATE TABLE IF NOT EXISTS primitives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  config_schema JSONB NOT NULL,
  component_path TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  avg_render_time_ms REAL,
  test_coverage REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_primitives_category ON primitives(category);
CREATE INDEX IF NOT EXISTS idx_primitives_name ON primitives(name);

-- Purchases (marketplace transactions)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) NOT NULL,
  buyer_id UUID REFERENCES users(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0,
  remix_royalty_cents INTEGER DEFAULT 0,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_tool ON purchases(tool_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- Moderation Logs (auto-scan results for every generated tool)
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

-- Reports (user-submitted reports on tools)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id),
  reporter_id UUID REFERENCES users(id),
  reason TEXT NOT NULL CHECK (reason IN ('harmful', 'copyright', 'phishing', 'spam', 'nsfw', 'malware', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'auto_resolved', 'escalated', 'dismissed', 'actioned')),
  triage_action TEXT CHECK (triage_action IN ('auto_block', 'escalate', 'dismiss')),
  triage_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_tool ON reports(tool_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- Curated Collections (editorial picks for feed)
CREATE TABLE IF NOT EXISTS curated_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Feed Events (engagement tracking for ranking engine)
CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'use', 'remix', 'share', 'like', 'unlike', 'purchase', 'deploy')),
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_events_tool ON feed_events(tool_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_created_at ON feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_type_created ON feed_events(event_type, created_at DESC);

-- Tool Ranking Scores (precomputed by cron, used by feed)
CREATE TABLE IF NOT EXISTS tool_ranking_scores (
  tool_id UUID PRIMARY KEY REFERENCES tools(id) ON DELETE CASCADE,
  score REAL DEFAULT 0,
  trending_score REAL DEFAULT 0,
  freshness_score REAL DEFAULT 0,
  engagement_score REAL DEFAULT 0,
  creator_score REAL DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now()
);

-- Featured Tools (Tool of the Day)
CREATE TABLE IF NOT EXISTS featured_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  featured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  selected_by TEXT DEFAULT 'auto' CHECK (selected_by IN ('auto', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(featured_date)
);

CREATE INDEX IF NOT EXISTS idx_featured_tools_date ON featured_tools(featured_date DESC);
CREATE INDEX IF NOT EXISTS idx_featured_tools_tool ON featured_tools(tool_id);

-- Waitlist signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ;
`;
