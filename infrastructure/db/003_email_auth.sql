-- Migration: Add email/password auth columns, make clerk_id optional
-- Run once against existing Neon DB instances

ALTER TABLE users
  ALTER COLUMN clerk_id DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
