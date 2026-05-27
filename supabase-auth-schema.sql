-- DEPRECATED 2026-05-27 — superseded by live schema.
--
-- This file describes a `users` + `device_tokens` auth pattern that was
-- never deployed. The live auth schema on Supabase project
-- vkizhvkgjimthhfefzhy uses `allowed_emails` (email PK, pin_hash,
-- device_token, created_at) + `auth_magic_links` (token, email,
-- expires_at, created_at) instead. RLS was enabled on the live tables
-- via Supabase Management API on 2026-05-27 (closed Supabase advisor
-- alert "rls_disabled_in_public" + "sensitive_columns_exposed").
--
-- To inspect or modify the live auth schema, use:
--   bun ~/.claude/PAI/TOOLS/supabase-sql.ts vkizhvkgjimthhfefzhy \
--     "SELECT column_name FROM information_schema.columns
--      WHERE table_schema='public' AND table_name='allowed_emails'"
--
-- Original POC schema below, kept for historical reference only:

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  device_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_email ON device_tokens(email);
