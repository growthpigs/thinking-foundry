/**
 * Email Auth — Magic link + PIN + Device cookie
 *
 * Flow:
 *   First visit: Enter email → magic link via Resend → click → set PIN → cookie saved
 *   Return visit (same device): Enter PIN → in
 *   New device: Enter email → magic link → set PIN
 *
 * No SMS. No Twilio. No OAuth. Just email + PIN + cookie.
 * Resend free tier: 3000 emails/month.
 */

const crypto = require('crypto');

class EmailAuth {
  constructor({ resendApiKey, baseUrl } = {}) {
    this.resendApiKey = resendApiKey !== undefined ? resendApiKey : process.env.RESEND_API_KEY;
    this.baseUrl = baseUrl || process.env.BASE_URL || '';

    // In-memory stores (MVP — move to Supabase later for multi-instance)
    this.magicLinks = new Map(); // token → { email, expiresAt }
    this.users = new Map(); // email → { pinHash, createdAt }
    this.deviceTokens = new Map(); // deviceToken → email

    // Email whitelist — only pre-approved emails can request magic links
    // Loaded from: ALLOWED_EMAILS env var + Supabase (persisted across deploys)
    this.allowedEmails = new Set();
    if (process.env.ALLOWED_EMAILS) {
      process.env.ALLOWED_EMAILS.split(',').forEach(e => this.allowedEmails.add(e.trim().toLowerCase()));
    }

    // Supabase for persistent whitelist
    this.supabase = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      const { createClient } = require('@supabase/supabase-js');
      this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      this._loadWhitelistFromDb();
    }
  }

  /**
   * Load whitelist from Supabase on startup.
   * Non-blocking — merges with env var whitelist.
   */
  async _loadWhitelistFromDb() {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('allowed_emails')
        .select('email, pin_hash, device_token');
      if (error) {
        // Table might not exist yet — that's fine, env var whitelist still works
        console.log('[AUTH] allowed_emails table not found — using env var whitelist only');
        return;
      }
      if (data) {
        data.forEach(row => {
          this.allowedEmails.add(row.email.toLowerCase());
          // Warm in-memory caches for PIN + device token
          if (row.pin_hash) {
            this.users.set(row.email.toLowerCase(), { pinHash: row.pin_hash });
          }
          if (row.device_token) {
            this.deviceTokens.set(row.device_token, row.email.toLowerCase());
          }
        });
        const withPin = data.filter(r => r.pin_hash).length;
        console.log(`[AUTH] Loaded ${data.length} emails from Supabase (${withPin} with PINs)`);
      }
    } catch (err) {
      console.warn('[AUTH] Failed to load whitelist from DB:', err.message);
    }
  }

  /**
   * Send a magic link email.
   * @param {string} email
   * @returns {{ sent: boolean, message: string }}
   */
  /**
   * Add an email to the whitelist.
   * @param {string} email
   */
  async addAllowedEmail(email) {
    const normalized = email.toLowerCase().trim();
    this.allowedEmails.add(normalized);
    console.log(`[AUTH] Added to whitelist: ${normalized}`);

    // Persist to Supabase
    if (this.supabase) {
      const { error } = await this.supabase
        .from('allowed_emails')
        .upsert({ email: normalized }, { onConflict: 'email' });
      if (error) console.warn('[AUTH] Failed to persist email to DB:', error.message);
    }
  }

  /**
   * Remove an email from the whitelist.
   * @param {string} email
   */
  async removeAllowedEmail(email) {
    const normalized = email.toLowerCase().trim();
    this.allowedEmails.delete(normalized);

    if (this.supabase) {
      const { error } = await this.supabase
        .from('allowed_emails')
        .delete()
        .eq('email', normalized);
      if (error) console.warn('[AUTH] Failed to remove email from DB:', error.message);
    }
  }

  /**
   * Get all allowed emails.
   * @returns {string[]}
   */
  getAllowedEmails() {
    return Array.from(this.allowedEmails);
  }

  async sendMagicLink(email) {
    if (!email || !email.includes('@')) {
      return { sent: false, message: 'Invalid email address' };
    }

    // Whitelist check — ONLY pre-approved emails can use the system
    // Empty whitelist = nobody gets in (secure by default)
    if (!this.allowedEmails.has(email.toLowerCase())) {
      return { sent: false, message: 'This email is not registered. Please contact your session host.' };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Persist magic link to Supabase (survives deploys)
    if (this.supabase) {
      const { error } = await this.supabase.from('auth_magic_links')
        .upsert({ token, email: email.toLowerCase(), expires_at: expiresAt });
      if (error) console.warn('[AUTH] Failed to persist magic link:', error.message);
    }
    // Also keep in memory as fast cache
    this.magicLinks.set(token, { email: email.toLowerCase(), expiresAt: new Date(expiresAt).getTime() });

    const link = this.baseUrl
      ? `${this.baseUrl}/auth/verify/${token}`
      : `/auth/verify/${token}`;

    // Send email via Resend
    if (this.resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'The Thinking Foundry <onboarding@resend.dev>',
            to: [email],
            subject: 'Your Thinking Foundry session link',
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
                <h2 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">The Thinking Foundry</h2>
                <p style="color:#666;margin-bottom:24px;">Click below to access your session. This link expires in 15 minutes.</p>
                <a href="${link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Open Session</a>
                <p style="color:#999;font-size:0.8rem;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });
        const data = await res.json();
        if (data.id) {
          console.log(`[AUTH] Magic link sent to ${email}`);
          return { sent: true, message: 'Check your email for the session link' };
        } else {
          console.error('[AUTH] Resend error:', data);
          return { sent: false, message: 'Failed to send email. Try again.' };
        }
      } catch (err) {
        console.error('[AUTH] Email send error:', err.message);
        return { sent: false, message: 'Email service unavailable' };
      }
    } else {
      // No Resend key — return the link directly (dev mode)
      console.log(`[AUTH] No RESEND_API_KEY — magic link: ${link}`);
      return { sent: true, message: 'Dev mode: ' + link, devLink: link };
    }
  }

  /**
   * Verify a magic link token.
   * @param {string} token
   * @returns {{ valid: boolean, email?: string, reason?: string }}
   */
  async verifyMagicLink(token) {
    // Check in-memory first (fast path)
    let entry = this.magicLinks.get(token);

    // Fall back to Supabase (survives deploys)
    if (!entry && this.supabase) {
      const { data } = await this.supabase.from('auth_magic_links')
        .select('email, expires_at')
        .eq('token', token)
        .single();
      if (data) {
        entry = { email: data.email, expiresAt: new Date(data.expires_at).getTime() };
      }
    }

    if (!entry) return { valid: false, reason: 'Link not found or already used' };
    if (Date.now() > entry.expiresAt) {
      this.magicLinks.delete(token);
      if (this.supabase) {
        await this.supabase.from('auth_magic_links').delete().eq('token', token);
      }
      return { valid: false, reason: 'Link expired' };
    }
    return { valid: true, email: entry.email };
  }

  /**
   * Set PIN for a user (first time or new device).
   * @param {string} email
   * @param {string} pin - 4-digit PIN
   * @param {string} magicToken - The magic link token (consumed on success)
   * @returns {{ success: boolean, deviceToken?: string, message?: string }}
   */
  async setPin(email, pin, magicToken) {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, message: 'PIN must be exactly 4 digits' };
    }

    // Hash the PIN
    const pinHash = crypto.createHash('sha256').update(pin + email).digest('hex');
    const deviceToken = crypto.randomUUID();
    const normalized = email.toLowerCase();

    // Persist to Supabase (pin_hash + device_token on allowed_emails row)
    if (this.supabase) {
      const { error } = await this.supabase.from('allowed_emails')
        .update({ pin_hash: pinHash, device_token: deviceToken })
        .eq('email', normalized);
      if (error) console.warn('[AUTH] Failed to persist PIN:', error.message);
    }

    // Also keep in memory as fast cache
    this.users.set(normalized, { pinHash, createdAt: new Date().toISOString() });
    this.deviceTokens.set(deviceToken, normalized);

    // Consume magic link
    if (magicToken) {
      this.magicLinks.delete(magicToken);
      if (this.supabase) {
        await this.supabase.from('auth_magic_links').delete().eq('token', magicToken);
      }
    }

    console.log(`[AUTH] PIN set for ${email}, device token created`);
    return { success: true, deviceToken };
  }

  /**
   * Verify PIN + device cookie for returning users.
   * @param {string} deviceToken - From cookie
   * @param {string} pin - 4-digit PIN
   * @returns {{ valid: boolean, email?: string, message?: string }}
   */
  async verifyPin(deviceToken, pin) {
    // Check in-memory first (fast path)
    let email = this.deviceTokens.get(deviceToken);
    let storedPinHash = null;

    if (email) {
      const user = this.users.get(email);
      storedPinHash = user?.pinHash;
    }

    // Fall back to Supabase (survives deploys)
    if (!email && this.supabase) {
      const { data } = await this.supabase.from('allowed_emails')
        .select('email, pin_hash')
        .eq('device_token', deviceToken)
        .single();
      if (data) {
        email = data.email;
        storedPinHash = data.pin_hash;
        // Warm the in-memory cache
        this.deviceTokens.set(deviceToken, email);
        this.users.set(email, { pinHash: storedPinHash });
      }
    }

    if (!email) return { valid: false, message: 'Device not recognized. Please use your email link.' };
    if (!storedPinHash) return { valid: false, message: 'No PIN set. Please use your email link.' };

    const pinHash = crypto.createHash('sha256').update(pin + email).digest('hex');
    if (pinHash !== storedPinHash) {
      return { valid: false, message: 'Wrong PIN' };
    }

    return { valid: true, email };
  }

  /**
   * Register Express routes for email auth.
   * @param {import('express').Application} app
   */
  registerRoutes(app) {
    // Landing page — check for device cookie or show email form
    app.get('/', (req, res) => {
      res.send(this._renderAuthPage());
    });

    // Send magic link
    app.post('/auth/send-link', async (req, res) => {
      const { email } = req.body || {};
      const result = await this.sendMagicLink(email);
      res.json(result);
    });

    // Verify magic link → show PIN setup
    app.get('/auth/verify/:token', async (req, res) => {
      const result = await this.verifyMagicLink(req.params.token);
      if (!result.valid) {
        return res.status(403).send(this._renderError(result.reason));
      }
      res.send(this._renderPinSetup(result.email, req.params.token));
    });

    // Set PIN
    app.post('/auth/set-pin', async (req, res) => {
      const { email, pin, magicToken } = req.body || {};
      const result = await this.setPin(email, pin, magicToken);
      if (result.success) {
        res.json({ success: true, deviceToken: result.deviceToken });
      } else {
        res.json(result);
      }
    });

    // Verify PIN (returning user)
    app.post('/auth/verify-pin', async (req, res) => {
      const { deviceToken, pin } = req.body || {};
      const result = await this.verifyPin(deviceToken, pin);
      res.json(result);
    });
  }

  _renderAuthPage() {
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Thinking Foundry</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8f7f4;color:#1c1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:50vh;background:linear-gradient(180deg,#eae8e4 0%,#f8f7f4 100%);z-index:0}
.card{position:relative;z-index:1;max-width:420px;width:100%;background:#fff;border:1px solid #e7e5e4;border-radius:20px;padding:40px 36px;box-shadow:0 4px 16px rgba(28,25,23,0.08)}
h1{font-family:'Instrument Serif',Georgia,serif;font-size:1.65rem;font-weight:400;margin-bottom:4px}
.sub{color:#57534e;font-size:0.85rem;margin-bottom:28px;line-height:1.5}
label{display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;letter-spacing:0.04em;text-transform:uppercase}
input{width:100%;border:1px solid #e7e5e4;padding:12px 14px;border-radius:10px;font-size:1rem;font-family:'Plus Jakarta Sans',system-ui;margin-bottom:16px;background:#f8f7f4;transition:all 0.15s}
input:focus{outline:none;border-color:#292524;box-shadow:0 0 0 3px rgba(41,37,36,0.06)}
input::placeholder{color:#d6d3d1}
.btn{width:100%;padding:14px;border:none;border-radius:10px;background:#292524;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',system-ui;transition:all 0.2s;letter-spacing:0.01em}
.btn:hover{background:#44403c;box-shadow:0 1px 3px rgba(28,25,23,0.06)}
.btn:disabled{background:#d6d3d1;cursor:not-allowed}
.btn.secondary{background:#fff;color:#1c1917;border:1px solid #e7e5e4}
.btn.secondary:hover{background:#f5f5f4;border-color:#292524}
.msg{padding:12px;border-radius:10px;font-size:0.85rem;margin-bottom:16px;display:none}
.msg.ok{display:block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
.msg.err{display:block;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.pin-input{text-align:center;font-size:2rem;letter-spacing:12px;font-weight:600}
.divider{text-align:center;color:#a8a29e;font-size:0.8rem;margin:20px 0;position:relative}
.divider::before,.divider::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:#e7e5e4}
.divider::before{left:0}.divider::after{right:0}
#pinSection{display:none}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);padding:10px 20px;border-radius:10px;font-size:0.82rem;font-weight:500;opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);z-index:100;pointer-events:none;background:#292524;color:#fff}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1}
.toast.err{background:#b91c1c}
</style></head>
<body>
<div class="toast" id="toast"></div>
<div class="card">
  <h1>The Thinking Foundry</h1>
  <p class="sub">Structured thinking. From confusion to clarity.</p>

  <div id="pinSection">
    <label>Enter your PIN</label>
    <input type="password" id="pinInput" class="pin-input" maxlength="4" placeholder="----" inputmode="numeric" pattern="[0-9]*">
    <button class="btn" onclick="verifyPin()">Continue</button>
    <div class="divider">or</div>
    <button class="btn secondary" onclick="showEmail()">Use a different email</button>
  </div>

  <div id="emailSection">
    <div id="message" class="msg"></div>
    <label>Email address</label>
    <input type="email" id="emailInput" placeholder="you@company.com">
    <button class="btn" id="sendBtn" onclick="sendLink()">Send magic link</button>
  </div>
</div>

<script>
var deviceToken = localStorage.getItem('tf_device_token');
var savedEmail = localStorage.getItem('tf_email');

if (deviceToken && savedEmail) {
  document.getElementById('pinSection').style.display = 'block';
  document.getElementById('emailSection').style.display = 'none';
}

function showToast(msg, isErr) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  setTimeout(function() { t.className = 'toast'; }, 3500);
}

function showEmail() {
  document.getElementById('pinSection').style.display = 'none';
  document.getElementById('emailSection').style.display = 'block';
}

function showMsg(text, ok) {
  var el = document.getElementById('message');
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

async function sendLink() {
  var email = document.getElementById('emailInput').value.trim();
  if (!email) return;
  document.getElementById('sendBtn').disabled = true;
  document.getElementById('sendBtn').textContent = 'Sending...';

  var res = await fetch('/auth/send-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  });
  var data = await res.json();
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('sendBtn').textContent = 'Send magic link';

  if (data.sent) {
    showMsg(data.message, true);
    localStorage.setItem('tf_email', email);
    if (data.devLink) window.location.href = data.devLink;
  } else {
    showMsg(data.message, false);
  }
}

async function verifyPin() {
  var pin = document.getElementById('pinInput').value;
  if (pin.length !== 4) return;

  var res = await fetch('/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken: deviceToken, pin: pin })
  });
  var data = await res.json();

  if (data.valid) {
    window.location.href = '/session/new?email=' + encodeURIComponent(data.email || savedEmail || '');
  } else {
    showToast(data.message || 'Verification failed', true);
  }
}
</script>
</body></html>`;
  }

  _renderPinSetup(email, magicToken) {
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Set PIN - The Thinking Foundry</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8f7f4;color:#1c1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:50vh;background:linear-gradient(180deg,#eae8e4 0%,#f8f7f4 100%);z-index:0}
.card{position:relative;z-index:1;max-width:420px;width:100%;background:#fff;border:1px solid #e7e5e4;border-radius:20px;padding:40px 36px;box-shadow:0 4px 16px rgba(28,25,23,0.08)}
h1{font-family:'Instrument Serif',Georgia,serif;font-size:1.65rem;font-weight:400;margin-bottom:4px}
.sub{color:#57534e;font-size:0.85rem;margin-bottom:28px;line-height:1.5}
label{display:block;font-size:0.75rem;font-weight:600;margin-bottom:6px;letter-spacing:0.04em;text-transform:uppercase}
input{width:100%;border:1px solid #e7e5e4;padding:12px 14px;border-radius:10px;font-size:2rem;font-family:'Plus Jakarta Sans',system-ui;margin-bottom:16px;text-align:center;letter-spacing:12px;font-weight:600;background:#f8f7f4;transition:all 0.15s}
input:focus{outline:none;border-color:#292524;box-shadow:0 0 0 3px rgba(41,37,36,0.06)}
.btn{width:100%;padding:14px;border:none;border-radius:10px;background:#292524;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',system-ui;transition:all 0.2s}
.btn:hover{background:#44403c}
.email{color:#292524;font-weight:600}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);padding:10px 20px;border-radius:10px;font-size:0.82rem;font-weight:500;opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);z-index:100;pointer-events:none;background:#b91c1c;color:#fff}
.toast.show{transform:translateX(-50%) translateY(0);opacity:1}
</style></head>
<body>
<div class="toast" id="toast"></div>
<div class="card">
  <h1>Set your PIN</h1>
  <p class="sub">Choose a 4-digit PIN for <span class="email">${email.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}</span>. You will use this to quickly access future sessions on this device.</p>
  <label>4-digit PIN</label>
  <input type="password" id="pinInput" maxlength="4" placeholder="----" inputmode="numeric" pattern="[0-9]*" autofocus>
  <button class="btn" onclick="setPin()">Set PIN and start session</button>
</div>
<script>
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show';
  setTimeout(function() { t.className = 'toast'; }, 3500);
}
async function setPin() {
  var pin = document.getElementById('pinInput').value;
  if (pin.length !== 4 || !/^\\d{4}$/.test(pin)) { showToast('PIN must be exactly 4 digits'); return; }

  var res = await fetch('/auth/set-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ${JSON.stringify(email)}, pin: pin, magicToken: ${JSON.stringify(magicToken)} })
  });
  var data = await res.json();

  if (data.success) {
    localStorage.setItem('tf_device_token', data.deviceToken);
    localStorage.setItem('tf_email', ${JSON.stringify(email)});
    window.location.href = '/session/new?email=' + encodeURIComponent(${JSON.stringify(email)});
  } else {
    showToast(data.message || 'Failed to set PIN');
  }
}
</script>
</body></html>`;
  }

  _renderError(reason) {
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Invalid - The Thinking Foundry</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8f7f4;color:#1c1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:50vh;background:linear-gradient(180deg,#eae8e4 0%,#f8f7f4 100%);z-index:0}
.card{position:relative;z-index:1;max-width:420px;width:100%;background:#fff;border:1px solid #e7e5e4;border-radius:20px;padding:40px 36px;text-align:center;box-shadow:0 4px 16px rgba(28,25,23,0.08)}
h1{font-family:'Instrument Serif',Georgia,serif;font-size:1.5rem;font-weight:400;margin-bottom:8px}
p{color:#57534e;font-size:0.875rem}
a{display:inline-block;margin-top:20px;color:#292524;text-decoration:none;font-weight:600}
</style></head>
<body>
<div class="card">
  <h1>Link Invalid</h1>
  <p>${reason.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
  <a href="/">Request a new link</a>
</div>
</body></html>`;
  }
}

module.exports = { EmailAuth };
