-- AgentDoom.ai — PostgreSQL Schema (Neon)
-- Run against DATABASE_URL to initialize the database.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);

-- Tools
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}',
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'removed', 'flagged')),
    view_count BIGINT NOT NULL DEFAULT 0,
    remix_count BIGINT NOT NULL DEFAULT 0,
    share_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tools_slug ON tools (slug);
CREATE INDEX idx_tools_creator ON tools (creator_id);
CREATE INDEX idx_tools_status ON tools (status);
CREATE INDEX idx_tools_created ON tools (created_at DESC);

-- Generations (audit log of every generation request)
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    classification JSONB,
    config JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'success', 'failed', 'retried')),
    latency_ms INTEGER,
    model_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generations_user ON generations (user_id);
CREATE INDEX idx_generations_status ON generations (status);
CREATE INDEX idx_generations_created ON generations (created_at DESC);

-- Primitives (component library registry)
CREATE TABLE primitives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    schema_json JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_primitives_category ON primitives (category);
CREATE INDEX idx_primitives_name ON primitives (name);

-- Remixes (tracks remix lineage)
CREATE TABLE remixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    remixed_tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    modifier_prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_remixes_original ON remixes (original_tool_id);
CREATE INDEX idx_remixes_remixed ON remixes (remixed_tool_id);
