/**
 * FrameworkFetcher — JIT framework knowledge via Gemini function calling.
 *
 * Implements Constitution Article 12: Just-In-Time, Not Just-In-Case.
 * Frameworks are loaded when the conversation needs them, not pre-stuffed.
 *
 * Queries Supabase pgvector for relevant framework chunks and returns
 * them as function call responses to Gemini Live.
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const FRAMEWORK_IDS = [
  'hormozi', 'yc', 'ideo', 'mckinsey',
  'lean', 'stoicism', 'nate-b-jones', 'indydev-dan',
];

class FrameworkFetcher {
  /**
   * @param {object} options
   * @param {string} [options.supabaseUrl]
   * @param {string} [options.supabaseKey]
   * @param {string} [options.geminiApiKey] - For embedding queries (semantic search)
   */
  constructor({ supabaseUrl, supabaseKey, geminiApiKey } = {}) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error('FrameworkFetcher: SUPABASE_URL and SUPABASE_KEY required');
    }

    this.supabase = createClient(url, key);
    this.geminiApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    this.fetchLog = []; // Track which frameworks were fetched this session
  }

  /**
   * Fetch all chunks for a specific framework by ID.
   * Used by the fetch_framework tool call.
   *
   * @param {string} frameworkId - e.g., 'hormozi', 'yc', 'stoicism'
   * @returns {string} Concatenated framework content
   */
  async fetchFramework(frameworkId) {
    if (!FRAMEWORK_IDS.includes(frameworkId)) {
      return `Unknown framework: ${frameworkId}. Available: ${FRAMEWORK_IDS.join(', ')}`;
    }

    const { data, error } = await this.supabase
      .from('frameworks_knowledge')
      .select('section, content')
      .eq('framework_id', frameworkId)
      .order('id', { ascending: true });

    if (error) {
      console.error(`[FRAMEWORK] Fetch error for ${frameworkId}: ${error.message}`);
      return `Error fetching ${frameworkId} framework.`;
    }

    if (!data || data.length === 0) {
      return `No content found for framework: ${frameworkId}`;
    }

    // Log the fetch
    if (!this.fetchLog.includes(frameworkId)) {
      this.fetchLog.push(frameworkId);
    }

    const content = data
      .map(chunk => `### ${chunk.section}\n${chunk.content}`)
      .join('\n\n---\n\n');

    console.log(`[FRAMEWORK] Fetched ${frameworkId}: ${data.length} chunks, ${content.length} chars`);
    return content;
  }

  /**
   * Semantic search across all frameworks using pgvector.
   * Used by the search_knowledge tool call.
   *
   * @param {string} queryText - What to search for
   * @param {number} [phase] - Optional phase filter (0-7)
   * @param {number} [limit=5] - Max results
   * @returns {string} Formatted search results
   */
  async searchByContext(queryText, phase, limit = 5) {
    // Generate embedding for the query
    const embedding = await this._embedQuery(queryText);

    if (!embedding) {
      // Fallback to text search if embedding fails
      return this._textSearch(queryText, phase, limit);
    }

    // Use the pgvector search function
    const { data, error } = await this.supabase.rpc('search_framework_knowledge', {
      query_embedding: embedding,
      match_count: limit,
      phase_filter: phase ?? null,
    });

    if (error) {
      console.error(`[FRAMEWORK] Semantic search error: ${error.message}`);
      return this._textSearch(queryText, phase, limit);
    }

    if (!data || data.length === 0) {
      return `No relevant framework content found for: "${queryText}"`;
    }

    // Log frameworks used
    for (const result of data) {
      if (!this.fetchLog.includes(result.framework_id)) {
        this.fetchLog.push(result.framework_id);
      }
    }

    const formatted = data.map((r, i) =>
      `**${i + 1}. ${r.framework_id} — ${r.section}** (relevance: ${(r.similarity * 100).toFixed(0)}%)\n${r.content}`
    ).join('\n\n---\n\n');

    console.log(`[FRAMEWORK] Search "${queryText}": ${data.length} results from ${[...new Set(data.map(r => r.framework_id))].join(', ')}`);
    return formatted;
  }

  /**
   * Fallback text search when embedding generation fails.
   */
  async _textSearch(queryText, phase, limit) {
    const { data, error } = await this.supabase.rpc('search_framework_knowledge_by_text', {
      query_text: queryText,
      match_count: limit,
      phase_filter: phase ?? null,
    });

    if (error || !data || data.length === 0) {
      return `No results found for: "${queryText}"`;
    }

    return data.map((r, i) =>
      `**${i + 1}. ${r.framework_id} — ${r.section}**\n${r.content}`
    ).join('\n\n---\n\n');
  }

  /**
   * Generate embedding for a query string.
   * @returns {number[]|null} 768-dim vector or null on failure
   */
  async _embedQuery(text) {
    if (!this.geminiApiKey) return null;

    try {
      const client = new GoogleGenerativeAI(this.geminiApiKey);
      const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      });
      return result.embedding.values;
    } catch (err) {
      console.error(`[FRAMEWORK] Embedding failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get Gemini function declarations for the Live API setup.
   * These are passed in the BidiGenerateContentSetup message.
   *
   * @returns {Array} Function declarations for Gemini tool use
   */
  static getGeminiFunctionDeclarations() {
    return [
      {
        name: 'fetch_framework',
        description: 'Fetch thinking framework content by name. Use when the conversation needs depth on pricing (hormozi), growth (yc), design (ideo), strategy (mckinsey), validated learning (lean), decision quality (nate-b-jones), or development patterns (indydev-dan). Stoicism is already in your system prompt — only fetch for deeper Stoic principles.',
        parameters: {
          type: 'OBJECT',
          properties: {
            framework_id: {
              type: 'STRING',
              enum: FRAMEWORK_IDS,
              description: 'The framework to fetch',
            },
          },
          required: ['framework_id'],
        },
      },
      {
        name: 'search_knowledge',
        description: 'Semantic search across all frameworks for a specific topic. Use when you need cross-framework perspective on a concept like "pricing", "risk", or "market validation".',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'What to search for',
            },
            phase: {
              type: 'NUMBER',
              description: 'Current phase number (0-7) to filter relevant chunks',
            },
          },
          required: ['query'],
        },
      },
    ];
  }

  /**
   * Handle a function call from Gemini.
   * Returns the function response to send back.
   *
   * @param {object} functionCall - { name, args }
   * @returns {{ name: string, response: object }}
   */
  async handleFunctionCall(functionCall) {
    const { name, args } = functionCall;

    switch (name) {
      case 'fetch_framework': {
        const content = await this.fetchFramework(args.framework_id);
        return { name, response: { content } };
      }
      case 'search_knowledge': {
        const content = await this.searchByContext(args.query, args.phase);
        return { name, response: { content } };
      }
      default:
        console.warn(`[FRAMEWORK] Unknown function call: ${name}`);
        return { name, response: { error: `Unknown function: ${name}` } };
    }
  }

  /**
   * Get list of frameworks fetched during this session.
   * Used to update sessions.frameworks_used in Supabase.
   */
  getFrameworksUsed() {
    return [...this.fetchLog];
  }
}

module.exports = { FrameworkFetcher, FRAMEWORK_IDS };
