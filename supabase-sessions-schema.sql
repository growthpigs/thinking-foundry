-- Thinking Foundry — Session Persistence Schema (FSD v4.0)
--
-- Three tables for the Supabase buffer layer:
-- 1. sessions — session metadata and state
-- 2. utterances — real-time scratchpad (<50ms writes)
-- 3. phase_summaries — carry-forward documents per phase
--
-- Run AFTER supabase-schema.sql (knowledge base must exist first).

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'in_progress', 'paused', 'completed')),
  current_phase INTEGER DEFAULT 0 CHECK (current_phase >= 0 AND current_phase <= 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  github_issues JSONB DEFAULT '[]', -- [{phase, issue_number, issue_url}]
  crucible_audio_url TEXT,
  frameworks_used TEXT[] DEFAULT '{}', -- which frameworks were fetched during session
  total_pauses INTEGER DEFAULT 0, -- count of pause events
  metadata JSONB DEFAULT '{}' -- extensible metadata (user agent, etc.)
);

-- Utterances (real-time buffer — the scratchpad)
CREATE TABLE utterances (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase >= 0 AND phase <= 8),
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'ai', 'system')),
  text TEXT NOT NULL,
  is_key_point BOOLEAN DEFAULT false,
  is_flushed_to_github BOOLEAN DEFAULT false, -- tracks which utterances have been batch-flushed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase carry-forward summaries
CREATE TABLE phase_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase >= 0 AND phase <= 8),
  carry_forward TEXT NOT NULL, -- the ONE document that moves to next phase
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10), -- from The Squeeze
  squeeze_notes TEXT, -- what was assumed, what was missed
  github_issue_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, phase)
);

-- Indexes for performance
CREATE INDEX idx_utterances_session_phase ON utterances(session_id, phase);
CREATE INDEX idx_utterances_unflushed ON utterances(session_id, is_flushed_to_github) WHERE is_flushed_to_github = false;
CREATE INDEX idx_phase_summaries_session ON phase_summaries(session_id);
CREATE INDEX idx_sessions_access_token ON sessions(access_token);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Atomic pause increment (used by SupabaseBuffer.pauseSession)
CREATE OR REPLACE FUNCTION increment_pauses(session_uuid UUID)
RETURNS void AS $$
  UPDATE sessions
  SET status = 'paused',
      total_pauses = total_pauses + 1
  WHERE id = session_uuid;
$$ LANGUAGE SQL;

-- RLS policies (enable when auth is added post-MVP)
-- For MVP: service role key is used, no RLS needed
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE utterances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE phase_summaries ENABLE ROW LEVEL SECURITY;
