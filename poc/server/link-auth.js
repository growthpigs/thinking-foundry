/**
 * Link-Based Authentication — stateless, no login, just click.
 *
 * MVP auth: send someone a unique link → they click it → session starts.
 * No passwords, no forms, no OAuth. Just crypto.randomUUID tokens.
 *
 * Flow:
 *   1. Admin creates link: POST /admin/create-link → { url, token }
 *   2. User clicks link: GET /s/:token → validates → renders session UI
 *   3. Session UI connects WebSocket with token as accessToken
 *   4. Token marked as used after WebSocket connects
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

class LinkAuth {
  /**
   * @param {object} options
   * @param {string} [options.supabaseUrl]
   * @param {string} [options.supabaseKey]
   * @param {string} [options.adminApiKey] - For protecting the create-link endpoint
   * @param {string} [options.baseUrl] - Public base URL for generated links
   */
  constructor({ supabaseUrl, supabaseKey, adminApiKey, baseUrl } = {}) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error('LinkAuth: SUPABASE_URL and SUPABASE_KEY required');
    }

    this.supabase = createClient(url, key);
    this.adminApiKey = adminApiKey || process.env.ADMIN_API_KEY || 'tf-admin-' + crypto.randomUUID().slice(0, 8);
    this.baseUrl = baseUrl || process.env.BASE_URL || '';

    // In-memory token store (for MVP — Supabase is the real store via sessions table)
    // Tokens map to { createdAt, used, sessionId }
    this.tokens = new Map();
  }

  /**
   * Generate a new session link.
   * Creates a token and optionally a placeholder session in Supabase.
   *
   * @param {object} [options]
   * @param {string} [options.label] - Human-readable label for the session
   * @returns {{ token: string, url: string, createdAt: string }}
   */
  async createLink(options = {}) {
    const token = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Store token metadata
    this.tokens.set(token, {
      createdAt,
      used: false,
      sessionId: null,
      label: options.label || null,
    });

    const url = this.baseUrl
      ? `${this.baseUrl}/s/${token}`
      : `/s/${token}`;

    console.log(`[AUTH] Created link: ${url} (label: ${options.label || 'none'})`);

    return { token, url, createdAt };
  }

  /**
   * Validate a token. Returns metadata if valid, null if invalid/expired/used.
   *
   * @param {string} token
   * @returns {{ valid: boolean, reason?: string, token?: object }}
   */
  validateToken(token) {
    const meta = this.tokens.get(token);

    if (!meta) {
      return { valid: false, reason: 'Token not found' };
    }

    if (meta.used) {
      return { valid: false, reason: 'Token already used' };
    }

    // Check expiry (24 hours)
    const age = Date.now() - new Date(meta.createdAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      return { valid: false, reason: 'Token expired (24h)' };
    }

    return { valid: true, token: meta };
  }

  /**
   * Mark a token as used (after WebSocket session starts).
   * @param {string} token
   * @param {string} sessionId - The Supabase session UUID
   */
  markUsed(token, sessionId) {
    const meta = this.tokens.get(token);
    if (meta) {
      meta.used = true;
      meta.sessionId = sessionId;
      console.log(`[AUTH] Token marked as used: ${token.substring(0, 8)}... → session ${sessionId}`);
    }
  }

  /**
   * Check if the admin API key is valid.
   * @param {string} key
   * @returns {boolean}
   */
  isAdminKey(key) {
    return key === this.adminApiKey;
  }

  /**
   * Get the admin API key (for logging at startup).
   * @returns {string}
   */
  getAdminKey() {
    return this.adminApiKey;
  }

  /**
   * Register Express routes for link auth.
   * @param {import('express').Application} app
   * @param {string} staticDir - Path to the public directory
   */
  registerRoutes(app, staticDir) {
    const path = require('path');

    // GET /s/:token — validate token and serve the session UI
    app.get('/s/:token', (req, res) => {
      const { token } = req.params;
      const result = this.validateToken(token);

      if (!result.valid) {
        return res.status(403).send(`
          <!DOCTYPE html>
          <html><head><title>Invalid Link</title>
          <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff;}
          .box{text-align:center;max-width:400px;}.reason{color:#f87171;margin:1em 0;}</style></head>
          <body><div class="box">
            <h1>Link Invalid</h1>
            <p class="reason">${result.reason}</p>
            <p>Please request a new link from your session host.</p>
          </div></body></html>
        `);
      }

      // Serve the session UI with the token embedded
      // The client JS reads it and passes it in the WebSocket session-setup message
      res.send(`
        <!DOCTYPE html>
        <html><head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Thinking Foundry</title>
          <link rel="stylesheet" href="/style.css">
          <script>window.__TF_TOKEN = "${token}";</script>
        </head>
        <body>
          <script src="/app.js"></script>
        </body></html>
      `);
    });

    // POST /admin/create-link — generate a new session link
    app.post('/admin/create-link', async (req, res) => {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

      if (!this.isAdminKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid admin API key' });
      }

      const { label } = req.body || {};
      const link = await this.createLink({ label });

      res.json({
        ok: true,
        token: link.token,
        url: link.url,
        createdAt: link.createdAt,
      });
    });

    // GET /admin — simple admin page to create session links
    app.get('/admin', (req, res) => {
      res.send(`<!DOCTYPE html>
<html><head><title>Thinking Foundry — Admin</title>
<style>
  body { font-family: system-ui; background: #0a0a0f; color: #e4e4e7; margin: 0; padding: 40px; }
  h1 { font-size: 1.5rem; margin-bottom: 8px; }
  p.sub { color: #71717a; font-size: 0.875rem; margin-bottom: 32px; }
  form { display: flex; gap: 12px; margin-bottom: 24px; }
  input { background: #111118; border: 1px solid #2a2a34; color: #e4e4e7; padding: 12px 16px; border-radius: 8px; font-size: 1rem; flex: 1; }
  input::placeholder { color: #52525b; }
  button { background: #6366f1; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; }
  button:hover { background: #4f46e5; }
  #result { display: none; background: #111118; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-top: 16px; }
  #result a { color: #6366f1; word-break: break-all; }
  #result .copy { background: #1a1a24; border: 1px solid #2a2a34; color: #e4e4e7; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 8px; display: inline-block; font-size: 0.875rem; }
  #links { margin-top: 32px; }
  #links table { width: 100%; border-collapse: collapse; }
  #links th, #links td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #1a1a24; font-size: 0.875rem; }
  #links th { color: #71717a; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
  .used { color: #71717a; }
  .active { color: #22c55e; }
</style></head>
<body>
  <h1>The Thinking Foundry — Admin</h1>
  <p class="sub">Create session links for your users</p>

  <form id="createForm">
    <input type="text" id="nameInput" placeholder="Person's name (for your records)" required />
    <button type="submit">Create Link</button>
  </form>

  <div id="result">
    <p style="margin:0 0 8px 0; font-size:0.875rem; color:#71717a;">Session link created for <strong id="resultName"></strong>:</p>
    <a id="resultLink" href="#" target="_blank"></a>
    <br/>
    <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('resultLink').href); this.textContent='Copied!'">Copy link</button>
  </div>

  <div id="links">
    <h3 style="font-size:1rem; color:#a1a1aa;">Active Links</h3>
    <table><thead><tr><th>Name</th><th>Status</th><th>Created</th></tr></thead><tbody id="linksBody"></tbody></table>
  </div>

  <script>
    const API_KEY = new URLSearchParams(window.location.search).get('key') || prompt('Admin API key:');
    if (!API_KEY) document.body.innerHTML = '<h1>API key required</h1><p>Add ?key=YOUR_KEY to the URL</p>';

    document.getElementById('createForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('nameInput').value;
      const res = await fetch('/admin/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ label: name })
      });
      const data = await res.json();
      if (data.ok) {
        const fullUrl = data.url.startsWith('http') ? data.url : window.location.origin + data.url;
        document.getElementById('result').style.display = 'block';
        document.getElementById('resultName').textContent = name;
        document.getElementById('resultLink').href = fullUrl;
        document.getElementById('resultLink').textContent = fullUrl;
        document.getElementById('nameInput').value = '';
        loadLinks();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    });

    async function loadLinks() {
      const res = await fetch('/admin/links?key=' + API_KEY);
      const data = await res.json();
      if (data.ok) {
        document.getElementById('linksBody').innerHTML = data.links.map(l =>
          '<tr><td>' + (l.label || '—') + '</td><td class="' + (l.used ? 'used' : 'active') + '">' + (l.used ? 'Used' : 'Active') + '</td><td>' + new Date(l.createdAt).toLocaleString() + '</td></tr>'
        ).join('');
      }
    }
    if (API_KEY) loadLinks();
  </script>
</body></html>`);
    });

    // GET /admin/links — list active tokens (admin only)
    app.get('/admin/links', (req, res) => {
      const apiKey = req.headers['x-api-key'] || req.query.key;

      if (!this.isAdminKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid admin API key' });
      }

      const links = Array.from(this.tokens.entries()).map(([token, meta]) => ({
        token: token.substring(0, 8) + '...',
        createdAt: meta.createdAt,
        used: meta.used,
        sessionId: meta.sessionId,
        label: meta.label,
      }));

      res.json({ ok: true, links });
    });
  }
}

module.exports = { LinkAuth };
