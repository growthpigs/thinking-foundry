#!/usr/bin/env node
/**
 * Supabase Knowledge Base Seeding Script
 *
 * Loads chunks from chunks.json, generates embeddings using Gemini Embedding 2,
 * and seeds Supabase database with vectors for semantic search.
 *
 * Requirements:
 *   - SUPABASE_URL: https://xxxx.supabase.co
 *   - SUPABASE_KEY: Service role key (NOT anon key!)
 *   - GEMINI_API_KEY: Google AI API key
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_KEY=... GEMINI_API_KEY=... node seed-supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 10; // Gemini batch embedding limit
const DELAY_BETWEEN_BATCHES = 500; // ms

// Validation
if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error(`
❌ Missing environment variables:
   SUPABASE_URL (required): Supabase project URL
   SUPABASE_KEY (required): Service role key from Supabase settings
   GEMINI_API_KEY (required): Google AI API key

Usage:
   SUPABASE_URL=https://xxx.supabase.co \\
   SUPABASE_KEY=eyJ... \\
   GEMINI_API_KEY=AIza... \\
   node seed-supabase.js
  `);
  process.exit(1);
}

/**
 * Generate embeddings for texts using Gemini Embedding 2
 * Batches requests to stay under rate limits
 */
async function generateEmbeddings(texts) {
  const client = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });

  console.log(`\n🔄 Generating ${texts.length} embeddings (batch size: ${BATCH_SIZE})`);

  const embeddings = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`   [${i + 1}/${texts.length}] Processing batch...`);

    try {
      // Use individual embedContent calls with outputDimensionality for 768-dim vectors
      for (const text of batch) {
        const result = await model.embedContent({
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        });
        embeddings.push(result.embedding.values);
      }

      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (err) {
      console.error(`   ❌ Error generating embeddings: ${err.message}`);
      throw err;
    }
  }

  console.log(`✅ Generated ${embeddings.length} embeddings`);
  return embeddings;
}

/**
 * Insert chunks with embeddings into Supabase
 */
async function insertChunksIntoSupabase(chunks, embeddings) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log(`\n📤 Inserting ${chunks.length} chunks into Supabase`);

  const rows = chunks.map((chunk, idx) => ({
    id: chunk.id,
    framework_id: chunk.framework_id,
    section: chunk.section,
    content: chunk.content,
    source: chunk.source,
    words: chunk.words,
    phases: chunk.phases,
    embedding: embeddings[idx],
  }));

  // Batch insert (Supabase can handle 1000+ per request)
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`   Inserting batch [${i + 1}/${rows.length}]...`);

    try {
      const { error } = await supabase
        .from('frameworks_knowledge')
        .insert(batch);

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        throw error;
      }

      inserted += batch.length;
      console.log(`   ✓ ${inserted} rows inserted`);
    } catch (err) {
      console.error(`   ❌ Batch insertion failed: ${err.message}`);
      throw err;
    }
  }

  console.log(`✅ All ${inserted} chunks inserted successfully`);
  return inserted;
}

/**
 * Verify insertion by running a test search
 */
async function verifySeeding(testQuery) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log(`\n🔍 Verifying seeding with test search: "${testQuery}"`);

  try {
    const { data, error } = await supabase
      .from('frameworks_knowledge')
      .select('id, framework_id, section, words')
      .ilike('content', `%${testQuery}%`)
      .limit(3);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn(`   ⚠️  No results found for test query`);
      return false;
    }

    console.log(`   ✓ Found ${data.length} matching chunks:`);
    data.forEach((row, idx) => {
      console.log(`     ${idx + 1}. ${row.id} (${row.words} words)`);
    });

    return true;
  } catch (err) {
    console.error(`   ❌ Verification failed: ${err.message}`);
    return false;
  }
}

/**
 * Main seeding pipeline
 */
async function seedDatabase() {
  console.log('🌱 SUPABASE KNOWLEDGE BASE SEEDING\n');
  console.log('='.repeat(70));

  try {
    // Load chunks
    console.log('📖 Loading chunks...');
    const chunksFile = path.join(__dirname, 'chunks.json');
    const { chunks } = JSON.parse(fs.readFileSync(chunksFile, 'utf8'));
    console.log(`✓ Loaded ${chunks.length} chunks`);

    // Generate embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(texts);

    // Insert into Supabase
    const inserted = await insertChunksIntoSupabase(chunks, embeddings);

    // Verify
    const verified = await verifySeeding('growth');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(`
✅ SEEDING COMPLETE

Status:
  Chunks loaded: ${chunks.length}
  Embeddings generated: ${embeddings.length}
  Rows inserted: ${inserted}
  Verification: ${verified ? '✅ Passed' : '⚠️  Check manually'}

Next steps:
  1. Verify pgvector index is created
  2. Test semantic search: SELECT search_framework_knowledge(...)
  3. Build ResearchDispatcher to query this table

Supabase URL: ${SUPABASE_URL}
    `);
  } catch (err) {
    console.error(`\n❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

// Run pipeline
seedDatabase();
