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
const { createClient } = require('@supabase/supabase-js');

class EmailAuth {
  constructor({ supabaseUrl, supabaseKey, resendApiKey, baseUrl } = {}) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;
    this.resendApiKey = resendApiKey || process.env.RESEND_API_KEY;
    this.baseUrl = baseUrl || process.env.BASE_URL || '';

    if (!url || !key) throw new Error('EmailAuth: SUPABASE_URL and SUPABASE_KEY required');
    this.supabase = createClient(url, key);

    // In-memory magic link store (MVP — move to Supabase later for multi-instance)
    this.magicLinks = new Map(); // token → { email, expiresAt }
  }

  /**
   * Send a magic link email.
   * @param {string} email
   * @returns {{ sent: boolean, message: string }}
   */
  async sendMagicLink(email) {
    if (!email || !email.includes('@')) {
      return { sent: false, message: 'Invalid email address' };
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    this.magicLinks.set(token, { email: email.toLowerCase(), expiresAt });

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
            from: 'The Thinking Foundry <noreply@thinkingfoundry.app>',
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
  verifyMagicLink(token) {
    const entry = this.magicLinks.get(token);
    if (!entry) return { valid: false, reason: 'Link not found or already used' };
    if (Date.now() > entry.expiresAt) {
      this.magicLinks.delete(token);
      return { valid: false, reason: 'Link expired' };
    }
    // Don't delete yet — consumed after PIN is set
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

    // Upsert user
    const { error } = await this.supabase
      .from('users')
      .upsert({
        email: email.toLowerCase(),
        pin_hash: pinHash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (error) {
      console.error('[AUTH] User upsert error:', error.message);
      return { success: false, message: 'Failed to save PIN' };
    }

    // Save device token
    await this.supabase
      .from('device_tokens')
      .insert({
        email: email.toLowerCase(),
        device_token: deviceToken,
        created_at: new Date().toISOString(),
      });

    // Consume magic link
    if (magicToken) this.magicLinks.delete(magicToken);

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
    // Look up device
    const { data: device } = await this.supabase
      .from('device_tokens')
      .select('email')
      .eq('device_token', deviceToken)
      .single();

    if (!device) return { valid: false, message: 'Device not recognized. Please use your email link.' };

    // Look up user + verify PIN
    const { data: user } = await this.supabase
      .from('users')
      .select('pin_hash')
      .eq('email', device.email)
      .single();

    if (!user) return { valid: false, message: 'User not found' };

    const pinHash = crypto.createHash('sha256').update(pin + device.email).digest('hex');
    if (pinHash !== user.pin_hash) {
      return { valid: false, message: 'Wrong PIN' };
    }

    return { valid: true, email: device.email };
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
    app.get('/auth/verify/:token', (req, res) => {
      const result = this.verifyMagicLink(req.params.token);
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
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',system-ui,sans-serif;background:#faf9f7;color:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{max-width:400px;width:100%;background:#fff;border:1px solid #e8e5e3;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
h1{font-family:'DM Serif Display',Georgia,serif;font-size:1.75rem;font-weight:400;margin-bottom:4px}
.sub{color:#8b8685;font-size:0.875rem;margin-bottom:28px}
label{display:block;font-size:0.8rem;font-weight:600;margin-bottom:6px}
input{width:100%;border:1px solid #e8e5e3;padding:12px 14px;border-radius:8px;font-size:1rem;font-family:'DM Sans',system-ui;margin-bottom:16px}
input:focus{outline:none;border-color:#4f46e5}
input::placeholder{color:#b5b0ae}
.btn{width:100%;padding:14px;border:none;border-radius:10px;background:#4f46e5;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;font-family:'DM Sans',system-ui}
.btn:hover{background:#4338ca}
.btn:disabled{background:#d4d4d8;cursor:not-allowed}
.msg{padding:12px;border-radius:8px;font-size:0.85rem;margin-bottom:16px;display:none}
.msg.ok{display:block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
.msg.err{display:block;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.pin-input{text-align:center;font-size:2rem;letter-spacing:12px;font-weight:600}
.divider{text-align:center;color:#b5b0ae;font-size:0.8rem;margin:20px 0;position:relative}
.divider::before,.divider::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:#e8e5e3}
.divider::before{left:0}.divider::after{right:0}
#pinSection{display:none}
</style></head>
<body>
<div class="card">
  <h1>The Thinking Foundry</h1>
  <p class="sub">Structured thinking. From confusion to clarity.</p>

  <div id="pinSection">
    <label>Enter your PIN</label>
    <input type="password" id="pinInput" class="pin-input" maxlength="4" placeholder="----" inputmode="numeric" pattern="[0-9]*">
    <button class="btn" onclick="verifyPin()">Continue</button>
    <div class="divider">or</div>
    <button class="btn" style="background:#fff;color:#1a1a1a;border:1px solid #e8e5e3" onclick="showEmail()">Use a different email</button>
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
    window.location.href = '/session/new';
  } else {
    alert(data.message);
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
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',system-ui,sans-serif;background:#faf9f7;color:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{max-width:400px;width:100%;background:#fff;border:1px solid #e8e5e3;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
h1{font-family:'DM Serif Display',Georgia,serif;font-size:1.75rem;font-weight:400;margin-bottom:4px}
.sub{color:#8b8685;font-size:0.875rem;margin-bottom:28px}
label{display:block;font-size:0.8rem;font-weight:600;margin-bottom:6px}
input{width:100%;border:1px solid #e8e5e3;padding:12px 14px;border-radius:8px;font-size:2rem;font-family:'DM Sans',system-ui;margin-bottom:16px;text-align:center;letter-spacing:12px;font-weight:600}
input:focus{outline:none;border-color:#4f46e5}
.btn{width:100%;padding:14px;border:none;border-radius:10px;background:#4f46e5;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;font-family:'DM Sans',system-ui}
.btn:hover{background:#4338ca}
.email{color:#4f46e5;font-weight:500}
</style></head>
<body>
<div class="card">
  <h1>Set your PIN</h1>
  <p class="sub">Choose a 4-digit PIN for <span class="email">${email}</span>. You will use this to quickly access future sessions on this device.</p>
  <label>4-digit PIN</label>
  <input type="password" id="pinInput" maxlength="4" placeholder="----" inputmode="numeric" pattern="[0-9]*" autofocus>
  <button class="btn" onclick="setPin()">Set PIN and start session</button>
</div>
<script>
async function setPin() {
  var pin = document.getElementById('pinInput').value;
  if (pin.length !== 4 || !/^\\d{4}$/.test(pin)) { alert('PIN must be 4 digits'); return; }

  var res = await fetch('/auth/set-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '${email}', pin: pin, magicToken: '${magicToken}' })
  });
  var data = await res.json();

  if (data.success) {
    localStorage.setItem('tf_device_token', data.deviceToken);
    localStorage.setItem('tf_email', '${email}');
    window.location.href = '/session/new';
  } else {
    alert(data.message || 'Failed to set PIN');
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
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',system-ui,sans-serif;background:#faf9f7;color:#1a1a1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{max-width:400px;width:100%;background:#fff;border:1px solid #e8e5e3;border-radius:16px;padding:40px 36px;text-align:center}
h1{font-family:'DM Serif Display',Georgia,serif;font-size:1.5rem;font-weight:400;margin-bottom:8px}
p{color:#8b8685;font-size:0.875rem}
a{display:inline-block;margin-top:20px;color:#4f46e5;text-decoration:none;font-weight:500}
</style></head>
<body>
<div class="card">
  <h1>Link Invalid</h1>
  <p>${reason}</p>
  <a href="/">Request a new link</a>
</div>
</body></html>`;
  }
}

module.exports = { EmailAuth };
