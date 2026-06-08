/**
 * Admin routes — whitelist management.
 *
 * All routes are protected by the admin API key (checked via linkAuth.isAdminKey).
 *
 * Mounted at:
 *   POST   /admin/invite      { email }
 *   DELETE /admin/invite      { email }
 *   GET    /admin/whitelist
 */

function registerAdminRoutes(app, { linkAuth, emailAuth }) {
  app.post('/admin/invite', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.json({ success: false, message: 'Invalid email' });
    }
    try {
      await emailAuth.addAllowedEmail(email);
      res.json({ success: true, message: 'User invited: ' + email });
    } catch (err) {
      console.error('[AUTH] Invite error:', err.message);
      res.json({ success: false, message: 'Failed to invite: ' + err.message });
    }
  });

  app.delete('/admin/invite', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }
    const { email } = req.body || {};
    if (!email) return res.json({ success: false, message: 'No email provided' });
    try {
      await emailAuth.removeAllowedEmail(email);
      res.json({ success: true, message: 'Removed: ' + email });
    } catch (err) {
      console.error('[AUTH] Remove error:', err.message);
      res.json({ success: false, message: 'Failed to remove: ' + err.message });
    }
  });

  app.get('/admin/whitelist', (req, res) => {
    const apiKey = req.headers['x-api-key'] || req.query.key;
    if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }
    res.json({ emails: emailAuth.getAllowedEmails() });
  });
}

module.exports = { registerAdminRoutes };
