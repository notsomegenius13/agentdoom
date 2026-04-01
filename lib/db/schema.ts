/**
 * AgentDoom Database Schema — PostgreSQL via Neon
 * Tables: users, tools, tool_configs, generations, primitives
 */

export const SCHEMA_SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  tools_created INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

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
`
