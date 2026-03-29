-- Supabase Schema Setup for Thinking Foundry Knowledge Base
--
-- Creates pgvector extension and tables for semantic search over framework chunks.
-- Run this in Supabase SQL Editor after creating a project.

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Main knowledge chunks table
CREATE TABLE frameworks_knowledge (
  -- Core identifiers
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL,

  -- Content
  section TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,

  -- Metadata
  words INTEGER NOT NULL,
  phases INTEGER[] NOT NULL,  -- Array of applicable phases (0-7)

  -- Embeddings (using Gemini Embedding 2 which produces 768-dim vectors)
  embedding vector(768),

  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Indexes
  CONSTRAINT valid_words CHECK (words >= 100 AND words <= 600),
  CONSTRAINT valid_phases CHECK (phases && ARRAY[0,1,2,3,4,5,6,7])
);

-- Create indexes for efficient semantic search
CREATE INDEX idx_frameworks_knowledge_embedding
  ON frameworks_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index on framework_id for filtering
CREATE INDEX idx_frameworks_knowledge_framework_id
  ON frameworks_knowledge(framework_id);

-- Index on phases for phase-specific retrieval
CREATE INDEX idx_frameworks_knowledge_phases
  ON frameworks_knowledge
  USING gin(phases);

-- Index on source for debugging/tracing
CREATE INDEX idx_frameworks_knowledge_source
  ON frameworks_knowledge(source);

-- Function to search by similarity
-- Usage: SELECT * FROM search_framework_knowledge('your query', 5) LIMIT 5;
CREATE OR REPLACE FUNCTION search_framework_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 10,
  phase_filter INT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  framework_id TEXT,
  section TEXT,
  content TEXT,
  words INTEGER,
  similarity FLOAT
) AS $$
  SELECT
    fk.id,
    fk.framework_id,
    fk.section,
    fk.content,
    fk.words,
    1 - (fk.embedding <=> query_embedding) AS similarity
  FROM frameworks_knowledge fk
  WHERE
    (phase_filter IS NULL OR phase_filter = ANY(fk.phases))
    AND fk.embedding IS NOT NULL
  ORDER BY fk.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL;

-- Function to search by text query (requires embedding client-side or via PostgREST function)
CREATE OR REPLACE FUNCTION search_framework_knowledge_by_text(
  query_text TEXT,
  match_count INT DEFAULT 10,
  phase_filter INT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  framework_id TEXT,
  section TEXT,
  content TEXT,
  words INTEGER,
  source TEXT
) AS $$
  SELECT
    fk.id,
    fk.framework_id,
    fk.section,
    fk.content,
    fk.words,
    fk.source
  FROM frameworks_knowledge fk
  WHERE
    (phase_filter IS NULL OR phase_filter = ANY(fk.phases))
    AND (
      fk.content ILIKE '%' || query_text || '%'
      OR fk.section ILIKE '%' || query_text || '%'
    )
  LIMIT match_count;
$$ LANGUAGE SQL;

-- RLS Policy: Enable read access (no auth required for search)
ALTER TABLE frameworks_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON frameworks_knowledge
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role write"
  ON frameworks_knowledge
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON frameworks_knowledge TO authenticated;
GRANT SELECT ON frameworks_knowledge TO anon;
GRANT INSERT, UPDATE ON frameworks_knowledge TO authenticated;
