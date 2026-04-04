-- Migration: Add composite index for SSE live feed query performance
-- The /api/feed/live endpoint queries: WHERE status = 'active' AND created_at > X
-- A composite index on (status, created_at DESC) avoids scanning the full tools table.
--
-- Applied: 2026-04-01

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tools_status_created
  ON tools(status, created_at DESC);
