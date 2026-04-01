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

    // Clean up old tokens every 30 minutes (prevent memory leak)
    setInterval(() => {
      const cutoff = Date.now() - 25 * 60 * 60 * 1000; // 25 hours
      for (const [token, meta] of this.tokens) {
        if (new Date(meta.createdAt).getTime() < cutoff) {
          this.tokens.delete(token);
        }
      }
    }, 30 * 60 * 1000);
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
      email: options.email || null,
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
            <p class="reason">${(result.reason||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
            <p>Please request a new link from your session host.</p>
          </div></body></html>
        `);
      }

      // Serve session page with token + email injected
      const fs = require('fs');
      const meta = this.tokens.get(token);
      const userEmail = meta?.email || '';
      let sessionHtml = fs.readFileSync(
        require('path').join(staticDir, 'session.html'), 'utf-8'
      );
      sessionHtml = sessionHtml.replace(
        "window.__TF_TOKEN || ''",
        JSON.stringify(token)
      );
      sessionHtml = sessionHtml.replace(
        "window.__TF_EMAIL || ''",
        JSON.stringify(userEmail)
      );
      res.send(sessionHtml);
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

    // GET /admin — admin page: create session links + invite emails
    app.get('/admin', (req, res) => {
      res.send(`<!DOCTYPE html>
<html><head><title>Thinking Foundry — Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f8f7f4;color:#1c1917;padding:40px;max-width:640px;margin:0 auto}
  h1{font-family:'Instrument Serif',Georgia,serif;font-size:1.65rem;font-weight:400;margin-bottom:4px}
  p.sub{color:#57534e;font-size:0.85rem;margin-bottom:32px}
  .section{background:#fff;border:1px solid #e7e5e4;border-radius:14px;padding:24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(28,25,23,0.04)}
  .section h2{font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#57534e;margin-bottom:12px}
  form{display:flex;gap:8px}
  input{border:1px solid #e7e5e4;padding:10px 14px;border-radius:10px;font-size:0.85rem;flex:1;font-family:'Plus Jakarta Sans',system-ui;background:#f8f7f4;color:#1c1917}
  input:focus{outline:none;border-color:#292524;box-shadow:0 0 0 3px rgba(41,37,36,0.06)}
  input::placeholder{color:#d6d3d1}
  button{background:#292524;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:0.85rem;cursor:pointer;font-weight:600;font-family:'Plus Jakarta Sans',system-ui;white-space:nowrap}
  button:hover{background:#44403c}
  #result{display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:12px;font-size:0.85rem}
  #result a{color:#292524;word-break:break-all;font-weight:500}
  .copy{background:#fff;border:1px solid #e7e5e4;color:#1c1917;padding:6px 14px;border-radius:8px;cursor:pointer;margin-top:8px;display:inline-block;font-size:0.78rem}
  #inviteResult{display:none;padding:10px;border-radius:8px;margin-top:10px;font-size:0.82rem}
  #inviteResult.ok{display:block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
  #inviteResult.err{display:block;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #f5f5f4;font-size:0.82rem}
  th{color:#a8a29e;text-transform:uppercase;font-size:0.68rem;letter-spacing:0.05em;font-weight:600}
  .used{color:#a8a29e}.active{color:#15803d}
  .tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600}
  .tag.ok{background:#f0fdf4;color:#15803d}.tag.spent{background:#f5f5f4;color:#a8a29e}
  .chip{display:inline-flex;align-items:center;gap:4px;padding:5px 6px 5px 12px;margin:3px 4px 3px 0;background:#f8f7f4;border:1px solid #e7e5e4;border-radius:8px;font-size:0.8rem;line-height:1}
  .chip .rm{background:none;border:none;cursor:pointer;color:#a8a29e;font-size:0.85rem;line-height:1;padding:2px 4px;border-radius:4px;display:flex;align-items:center;justify-content:center}
  .chip .rm:hover{background:#fef2f2;color:#b91c1c}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:#292524;color:#fff;padding:10px 20px;border-radius:10px;font-size:0.82rem;font-weight:500;opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);z-index:100;pointer-events:none}
  .toast.show{transform:translateX(-50%) translateY(0);opacity:1}
  .toast.warn{background:#b91c1c}
  .confirm-bar{display:none;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-top:10px;font-size:0.82rem;color:#991b1b;align-items:center;gap:8px}
  .confirm-bar.show{display:flex}
  .confirm-bar button{font-size:0.78rem;padding:6px 14px;border-radius:8px}
  .confirm-bar .cancel{background:#fff;color:#1c1917;border:1px solid #e7e5e4}
  .confirm-bar .danger{background:#b91c1c;color:#fff;border:none}
</style></head>
<body>
  <h1>The Thinking Foundry</h1>
  <p class="sub">Admin -- manage users and session links</p>

  <div class="section">
    <h2>Invite User</h2>
    <form id="inviteForm">
      <input type="email" id="inviteEmail" placeholder="user@company.com" required />
      <button type="submit">Invite</button>
    </form>
    <div id="inviteResult"></div>
    <div id="whitelist" style="margin-top:12px"></div>
    <div class="confirm-bar" id="confirmBar">
      <span id="confirmText"></span>
      <span style="margin-left:auto;display:flex;gap:6px">
        <button class="cancel" onclick="cancelRemove()">Cancel</button>
        <button class="danger" onclick="confirmRemove()">Remove</button>
      </span>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <div class="section" style="background:var(--bg,#f8f7f4);border-style:dashed">
    <h2>How It Works</h2>
    <ol style="font-size:0.82rem;color:#57534e;line-height:1.7;padding-left:18px">
      <li>Invite a user's email above</li>
      <li>Send them the app URL: <strong style="user-select:all">https://thinking-foundry-production.up.railway.app</strong></li>
      <li>They enter their email, receive a magic link, set a PIN</li>
      <li>On return visits, they just enter their PIN</li>
    </ol>
  </div>

  <script>
    const API_KEY = new URLSearchParams(window.location.search).get('key') || localStorage.getItem('tf_admin_key') || prompt('Admin API key:');
    if (API_KEY) localStorage.setItem('tf_admin_key', API_KEY);
    if (!API_KEY) document.body.innerHTML = '<h1 style="font-family:Instrument Serif,serif">API key required</h1><p style="color:#57534e;margin-top:8px">Enter the admin key when prompted, or add ?key=YOUR_KEY to the URL.</p>';

    // Invite user
    document.getElementById('inviteForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inviteEmail').value.trim();
      const r = document.getElementById('inviteResult');
      const res = await fetch('/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Invited ' + email);
        r.style.display = 'none';
      } else {
        r.textContent = data.message || data.error || 'Failed';
        r.className = 'err';
        r.style.display = 'block';
      }
      document.getElementById('inviteEmail').value = '';
      loadWhitelist();
    });

    // Toast notification
    function showToast(msg, warn) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show' + (warn ? ' warn' : '');
      setTimeout(function() { t.className = 'toast'; }, 3000);
    }

    // Remove flow: inline confirm bar (no browser dialogs)
    var pendingRemoveEmail = null;

    function removeEmail(email) {
      pendingRemoveEmail = email;
      document.getElementById('confirmText').textContent = 'Remove ' + email + '?';
      document.getElementById('confirmBar').className = 'confirm-bar show';
    }

    function cancelRemove() {
      pendingRemoveEmail = null;
      document.getElementById('confirmBar').className = 'confirm-bar';
    }

    async function confirmRemove() {
      if (!pendingRemoveEmail) return;
      var email = pendingRemoveEmail;
      pendingRemoveEmail = null;
      document.getElementById('confirmBar').className = 'confirm-bar';

      var res = await fetch('/admin/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ email: email })
      });
      var data = await res.json();
      if (data.success) {
        showToast('Removed ' + email, true);
      } else {
        showToast('Failed to remove: ' + (data.message || 'unknown error'), true);
      }
      loadWhitelist();
    }

    async function loadWhitelist() {
      var res = await fetch('/admin/whitelist?key=' + API_KEY);
      var data = await res.json();
      var el = document.getElementById('whitelist');
      if (data.emails && data.emails.length > 0) {
        el.innerHTML = '<p style="font-size:0.75rem;color:#a8a29e;margin-bottom:6px">Whitelisted (' + data.emails.length + '):</p><div>' +
          data.emails.map(function(e) {
            return '<span class="chip">' + e + '<button class="rm" data-email="' + e + '" title="Remove">&times;</button></span>';
          }).join('') + '</div>';
        // Attach click handlers via delegation (avoids quote escaping issues)
        el.querySelectorAll('.rm').forEach(function(btn) {
          btn.onclick = function() { removeEmail(this.getAttribute('data-email')); };
        });
      } else {
        el.innerHTML = '<p style="font-size:0.78rem;color:#a8a29e">No users whitelisted yet. Invite someone above.</p>';
      }
    }

    if (API_KEY) { loadWhitelist(); }
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
