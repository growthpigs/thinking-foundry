/**
 * Research Dispatcher — Queries knowledge base for constraints
 *
 * STUB VERSION (Phase 2 work)
 *
 * After Phase 1 (MINE) captures user constraints, ResearchDispatcher:
 * 1. Receives constraints { budget, timeline, pain, market, etc. }
 * 2. Formulates semantic search queries against constraint vectors
 * 3. Retrieves top-K relevant chunks from frameworks_knowledge (Supabase)
 * 4. Returns personalized research findings for Phase 2 injection
 *
 * Architecture:
 * ```
 * Phase 1 (MINE) running live
 *   ├─ Every 3-5 user utterances
 *   └─> ConstraintExtractor.extract(transcript) → session.constraintBuffer
 *
 * Parallel background:
 *   └─> ResearchDispatcher.dispatch(constraints) → session.researchBuffer
 *       ├─ Generate query embeddings (semantic representation of constraints)
 *       ├─ Search frameworks_knowledge table (pgvector + semantic sim)
 *       ├─ Rank results by relevance to user's specific constraints
 *       └─ Store in session.researchBuffer (appends to session.programMd)
 *
 * Phase transition (Phase 1 → Phase 2):
 *   └─> Reconnect with knowledgeContext = session.programMd (includes research)
 *       └─> Phase 2 prompt sees personalized findings from Phase 1
 * ```
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ResearchDispatcher {
  constructor(supabaseUrl, supabaseKey, geminiKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.gemini = new GoogleGenerativeAI(geminiKey);
    this.embeddingModel = this.gemini.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Cache for embedding queries (avoid duplicate API calls)
    this.embeddingCache = new Map();
  }

  /**
   * Generate embedding for a text query
   * Caches results to avoid redundant API calls
   */
  async getEmbedding(text) {
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text);
    }

    try {
      const result = await this.embeddingModel.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      });
      const embedding = result.embedding.values;
      this.embeddingCache.set(text, embedding);
      return embedding;
    } catch (err) {
      console.error('[ResearchDispatcher] Embedding error:', err.message);
      return null;
    }
  }

  /**
   * Formulate semantic search queries from constraints
   *
   * Constraints structure (from ConstraintExtractor):
   * {
   *   budget: "50k-100k",
   *   timeline: "6 months",
   *   pain: "user retention",
   *   market: "B2B SaaS",
   *   stage: "Series A",
   *   values: ["growth", "transparency"]
   * }
   */
  formulateQueries(constraints) {
    const queries = [];

    if (constraints.pain) {
      queries.push(`How do we solve ${constraints.pain}?`);
      queries.push(`What frameworks address ${constraints.pain}?`);
    }

    if (constraints.market) {
      queries.push(`Best practices for ${constraints.market} growth`);
    }

    if (constraints.budget && constraints.timeline) {
      queries.push(`Grow efficiently on ${constraints.budget} budget in ${constraints.timeline}`);
    }

    if (constraints.stage) {
      queries.push(`${constraints.stage} stage strategy and metrics`);
    }

    if (constraints.values && constraints.values.length > 0) {
      const valueStr = constraints.values.join(' and ');
      queries.push(`Building with ${valueStr} as core principles`);
    }

    // Always add a generic catch-all for relevant frameworks
    queries.push('Key frameworks for startup decision-making');

    return queries;
  }

  /**
   * Query Supabase for relevant knowledge chunks
   *
   * Returns top-K chunks ranked by semantic similarity to query
   */
  async queryKnowledgeBase(queryEmbedding, phase = null, limit = 10) {
    try {
      // Call the pgvector search function
      const { data, error } = await this.supabase.rpc('search_framework_knowledge', {
        query_embedding: queryEmbedding,
        match_count: limit,
        phase_filter: phase,
      });

      if (error) {
        console.error('[ResearchDispatcher] Query error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[ResearchDispatcher] Search error:', err.message);
      return [];
    }
  }

  /**
   * Main dispatch function — gathers research findings for constraints
   *
   * Returns structured findings ready for Phase 2 injection
   */
  async dispatch(constraints, phase = 2) {
    console.log('[ResearchDispatcher] Dispatching for constraints:', Object.keys(constraints));

    const queries = this.formulateQueries(constraints);
    const findings = {
      constraints,
      queries,
      results: [],
      summary: '',
      timestamp: new Date().toISOString(),
    };

    // Generate embeddings for each query (parallelized)
    const embeddings = await Promise.all(
      queries.map(q => this.getEmbedding(q))
    );

    // Search for each query
    const allResults = [];
    for (let i = 0; i < queries.length; i++) {
      const embedding = embeddings[i];
      if (!embedding) continue;

      const results = await this.queryKnowledgeBase(embedding, phase, 5);
      allResults.push(...results);
    }

    // Deduplicate and rank by relevance
    const seen = new Set();
    const uniqueResults = [];
    for (const result of allResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id);
        uniqueResults.push(result);
      }
    }

    // Sort by similarity (highest first)
    uniqueResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    findings.results = uniqueResults.slice(0, 10); // Top 10

    // Generate summary
    findings.summary = this.generateSummary(findings);

    return findings;
  }

  /**
   * Generate markdown summary of findings for Phase 2 injection
   */
  generateSummary(findings) {
    const { constraints, results } = findings;

    let summary = `## Research Findings (Based on Phase 1 Constraints)\n\n`;
    summary += `**Your situation:** ${constraints.pain || 'General growth'} in ${constraints.market || 'your market'}\n`;
    summary += `**Timeline:** ${constraints.timeline || 'To be determined'} | **Budget:** ${constraints.budget || 'Not specified'}\n\n`;

    // Group by framework
    const byFramework = {};
    results.forEach(r => {
      if (!byFramework[r.framework_id]) byFramework[r.framework_id] = [];
      byFramework[r.framework_id].push(r);
    });

    summary += `### Relevant Frameworks\n`;
    for (const [framework, chunks] of Object.entries(byFramework)) {
      summary += `\n**${framework}:** ${chunks.length} relevant section(s)\n`;
      chunks.slice(0, 2).forEach(chunk => {
        summary += `- *${chunk.section}* (${chunk.words} words)\n`;
      });
    }

    summary += `\n### Key Sections to Review\n`;
    results.slice(0, 5).forEach((r, idx) => {
      summary += `${idx + 1}. **${r.section}** (${r.framework_id}) — ${r.words} words\n`;
    });

    return summary;
  }

  /**
   * Format findings as markdown for injection into Phase 2 context
   *
   * This becomes part of session.programMd and is injected into Gemini
   * during the Phase 1 → Phase 2 reconnection
   */
  formatForInjection(findings) {
    const lines = [
      `## Personalized Research (From Phase 1 Constraints)`,
      `Generated: ${findings.timestamp}`,
      ``,
      findings.summary,
      ``,
      `### Full Content (Top Relevant Sections)`,
    ];

    findings.results.slice(0, 5).forEach((result, idx) => {
      lines.push(
        ``,
        `#### ${idx + 1}. ${result.section}`,
        `*From: ${result.framework_id}* | *Applicable phases: ${result.phases.join(', ')}*`,
        ``,
        result.content
      );
    });

    return lines.join('\n');
  }
}

module.exports = ResearchDispatcher;

// Example usage (for testing):
// const dispatcher = new ResearchDispatcher(url, key, geminiKey);
// const findings = await dispatcher.dispatch({
//   budget: "50k",
//   timeline: "6 months",
//   pain: "user retention"
// });
