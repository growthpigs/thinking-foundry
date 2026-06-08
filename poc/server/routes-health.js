/**
 * Health check route — validates all critical components.
 *
 * Mounted at GET /health. Returns { status, checks, timestamp }.
 * Status is "healthy" if gemini + knowledgeBase + semanticSearch are OK,
 * "degraded" otherwise.
 */

const { DriveManager } = require('./drive-manager');
const { errorTracker } = require('./error-tracker');

function registerHealthRoute(app) {
  app.get('/health', async (req, res) => {
    const checks = {};

    // 1. Gemini API key
    checks.gemini = !!process.env.GEMINI_API_KEY;

    // 2. Supabase connection + knowledge base
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { count } = await sb.from('frameworks_knowledge').select('id', { count: 'exact', head: true });
        checks.knowledgeBase = { ok: count > 0, chunks: count };

        // Verify search RPC works
        const dummy = new Array(768).fill(0);
        const { error: rpcErr } = await sb.rpc('search_framework_knowledge', {
          query_embedding: dummy, match_count: 1, phase_filter: null
        });
        checks.semanticSearch = { ok: !rpcErr, error: rpcErr?.message };

        // Check auth tables
        const { count: emailCount } = await sb.from('allowed_emails').select('email', { count: 'exact', head: true });
        checks.whitelist = { ok: emailCount > 0, count: emailCount };
      } else {
        checks.supabase = { ok: false, error: 'Not configured' };
      }
    } catch (err) {
      checks.supabase = { ok: false, error: err.message };
    }

    // 3. Google Drive SA
    checks.drive = DriveManager.isConfigured();

    // 4. Deepgram
    checks.deepgram = !!process.env.DEEPGRAM_API_KEY;

    // 5. GitHub
    checks.github = !!process.env.GITHUB_TOKEN;

    // 6. Resend
    checks.resend = !!process.env.RESEND_API_KEY;

    // 7. Framework tools
    try {
      const { FrameworkFetcher } = require('./framework-fetcher');
      const tools = FrameworkFetcher.getGeminiFunctionDeclarations();
      checks.tools = { ok: tools.length > 0, count: tools.length, names: tools.map(t => t.name) };
    } catch (err) {
      checks.tools = { ok: false, error: err.message };
    }

    // Error tracker counters (visible for monitoring silent failures)
    checks.errors = errorTracker.getCounters();

    // Overall status
    const critical = checks.gemini && checks.knowledgeBase?.ok && checks.semanticSearch?.ok;
    const status = critical ? 'healthy' : 'degraded';

    res.json({ status, checks, timestamp: new Date().toISOString() });
  });
}

module.exports = { registerHealthRoute };
