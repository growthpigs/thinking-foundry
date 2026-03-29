# Supabase Setup Guide for Thinking Foundry Knowledge Base

This guide walks through setting up Supabase for semantic search over 78 knowledge chunks from the 8 thinking frameworks.

## Overview

**What we're building:**
- A PostgreSQL database with pgvector extension (for embeddings)
- A `frameworks_knowledge` table with 768-dim embeddings from Gemini Embedding 2
- Semantic search functions for querying by similarity
- Backend for ResearchDispatcher (Phase 2 of Foundry)

**Architecture:**
```
chunks.json (78 chunks)
    ↓
Gemini Embedding 2 (generates vectors)
    ↓
Supabase pgvector (stores embeddings + content)
    ↓
ResearchDispatcher.query(constraints) → top K relevant chunks
    ↓
Phase 2 (SCOUT) receives personalized research context
```

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in
2. Click "New Project"
3. Choose organization + region (closest to users or servers)
4. Create a strong password (save this!)
5. Wait for project to initialize (~2 min)

**Keep these credentials safe:**
- Project URL: `https://[project-id].supabase.co`
- Service Role Key: Found in Settings → API → Service role key (NOT the anon key!)
- API Key (anon): Found in Settings → API → Anon public key

## Step 2: Set Up Database Schema

1. In Supabase, go to SQL Editor
2. Open `supabase-schema.sql` from this repo
3. Copy entire SQL content
4. Paste into SQL Editor
5. Click "Run" (green play button)

**What this does:**
- Enables pgvector extension
- Creates `frameworks_knowledge` table with columns:
  - `id`: chunk unique ID
  - `framework_id`: which framework (stoicism, yc, etc.)
  - `section`: section title
  - `content`: full text content (~100-600 words)
  - `words`: word count
  - `phases`: applicable Foundry phases [0-7]
  - `embedding`: 768-dim vector from Gemini Embedding 2
  - `source`: traceability (framework/section)
- Creates indexes for fast semantic search
- Creates search functions for SQL queries

**Verification:**
```sql
-- Run this in SQL Editor to verify table exists
SELECT * FROM frameworks_knowledge LIMIT 1;
-- Should return empty table (no rows yet)
```

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# .env.local
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_KEY=eyJhbGc... (service role key from Step 1)
GEMINI_API_KEY=AIza... (from console.cloud.google.com/apis/credentials)
```

**Getting the keys:**

**Supabase keys:**
1. Go to Project Settings → API
2. Copy "Project URL" → `SUPABASE_URL`
3. Under "Service Role Key", click "Reveal" → copy → `SUPABASE_KEY`

**Gemini API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key" → Create new in Google Cloud
3. Copy → `GEMINI_API_KEY`

## Step 4: Install Dependencies

```bash
# From thinking-foundry directory
npm install @supabase/supabase-js @google/generative-ai
```

## Step 5: Seed the Database

```bash
# Run the seeding script
SUPABASE_URL=https://[your-id].supabase.co \
SUPABASE_KEY=eyJ... \
GEMINI_API_KEY=AIza... \
node seed-supabase.js
```

**What happens:**
1. Loads 78 chunks from `chunks.json`
2. Generates embeddings using Gemini Embedding 2 (cost ~$0.004)
3. Inserts chunks + embeddings into Supabase
4. Verifies by running test query

**Expected output:**
```
🌱 SUPABASE KNOWLEDGE BASE SEEDING

📖 Loading chunks...
✓ Loaded 78 chunks

🔄 Generating 78 embeddings
   [1/78] Processing batch...
   [11/78] Processing batch...
   ...
✅ Generated 78 embeddings

📤 Inserting 78 chunks into Supabase
   Inserting batch [1/78]...
   ✓ 78 rows inserted

🔍 Verifying seeding...
   ✓ Found 3 matching chunks

✅ SEEDING COMPLETE
```

## Step 6: Test Semantic Search

In Supabase SQL Editor, test the search function:

```sql
-- Generate embedding for test query (requires client-side generation for now)
-- For now, use basic text search to verify data:

SELECT id, framework_id, section, words
FROM frameworks_knowledge
WHERE content ILIKE '%pricing%'
LIMIT 5;

-- Or use the text search function:
SELECT * FROM search_framework_knowledge_by_text(
  'pricing strategy',
  match_count => 10,
  phase_filter => 3  -- ASSAY phase
);
```

Expected results: Chunks about pricing from Hormozi + other frameworks

## Step 7: Verify Index Performance

The pgvector IVFFlat index should be created automatically. Verify:

```sql
-- Check index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'frameworks_knowledge';

-- Should show: idx_frameworks_knowledge_embedding
```

## Architecture: How ResearchDispatcher Will Use This

When Phase 1 (MINE) completes, Phase 2 (SCOUT) will:

1. **ConstraintExtractor** parses user's constraints:
   ```
   { budget: "50k", timeline: "3 months", pain: "user retention", ... }
   ```

2. **ResearchDispatcher** queries Supabase:
   ```javascript
   // Pseudo-code
   const query = "How do we improve user retention on a 50k budget?";
   const embedding = await gemini.embed(query);

   const results = await supabase
     .rpc('search_framework_knowledge', {
       query_embedding: embedding,
       match_count: 10,
       phase_filter: 2  // SCOUT phase
     });

   // Returns top 10 semantic matches from 78 chunks
   ```

3. **Phase 2 prompt injection** includes these chunks:
   ```
   "Here's what we know about retention (from Lean + Hormozi + IDEO):
   [Top 3 most relevant chunks from ResearchDispatcher]"
   ```

## Cost Breakdown

- **Gemini Embedding 2**: ~$0.0002 per 1000 tokens
  - 78 chunks × 266 words avg = 20,774 words
  - Cost to seed: ~$0.004 (one-time)
  - Cost per query: ~$0.0000004 per search (negligible)

- **Supabase**: Free tier includes 500MB storage + 2GB bandwidth
  - 78 chunks = negligible storage (~2MB)
  - Semantic searches = negligible bandwidth
  - Should stay on free tier

- **Alternative cost**: Running embeddings locally (Ollama + Sentence Transformers) = $0 but slower

## Troubleshooting

**Error: "pgvector extension not found"**
- Ensure you ran the entire `supabase-schema.sql`
- Extensions require project to be on Pro plan or have manual enablement

**Error: "Vector dimension mismatch"**
- Gemini Embedding 2 produces 768-dim vectors (confirmed)
- If using different model, update column to `vector(384)` or `vector(1536)`

**Error: "Seeding timeout"**
- Gemini Embedding API has rate limits
- Script includes 500ms delay between batches
- If still timing out, increase `DELAY_BETWEEN_BATCHES` to 1000ms

**Embeddings not generating**
- Verify `GEMINI_API_KEY` is correct and has Embedding API enabled
- Check Google Cloud quota for Generative Language API

**Search returning no results**
- Verify chunks were inserted: `SELECT COUNT(*) FROM frameworks_knowledge;`
- Ensure you're filtering by phases that contain relevant content
- Try text search instead of semantic search first

## Next Steps

1. ✅ Supabase database set up with 78 chunks + embeddings
2. **Build ResearchDispatcher** → Query this table for constraints
3. **Build ConstraintExtractor** → Extract user constraints from Phase 1
4. **Test end-to-end** → Phase 1 transcript → constraints → research → Phase 2 injection

## Files in This Setup

| File | Purpose |
|------|---------|
| `chunks.json` | 78 semantic chunks with metadata (ready to embed) |
| `chunk-frameworks.js` | Script to regenerate chunks if frameworks change |
| `supabase-schema.sql` | SQL to set up pgvector table + indexes + functions |
| `seed-supabase.js` | Node script to generate embeddings + seed database |
| `SUPABASE-SETUP.md` | This guide |
