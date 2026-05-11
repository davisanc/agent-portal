CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'creator', 'admin')) DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  platform TEXT NOT NULL CHECK (platform IN ('copilot-studio', 'foundry', 'bedrock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_platform ON agents(platform);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);
