/**
 * REST API routes — GitHub preview and export.
 *
 * Mounted at:
 *   GET  /api/github-preview?owner=X&repo=Y
 *   POST /api/export        { sessionName, transcript, phases }
 */

const { GitHubConnector } = require('../context/github-connector');
const { exportToGitHub } = require('./github-export');

function registerRestRoutes(app) {
  app.get('/api/github-preview', async (req, res) => {
    const { owner, repo } = req.query;
    if (!owner || !repo) return res.json({ ok: false, error: 'Missing owner or repo' });

    try {
      const gh = new GitHubConnector();
      const readme = await gh.fetchReadme(owner, repo);
      const issues = await gh.fetchRecentIssues(owner, repo, 5);
      const summary = `${owner}/${repo} — README ${readme ? `(${readme.length} chars)` : '(none)'}, ${issues.length} open issues`;
      res.json({ ok: true, summary });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  app.post('/api/export', async (req, res) => {
    try {
      const { sessionName, transcript, phases } = req.body;
      const result = await exportToGitHub({ sessionName, transcript, phases });
      res.json({ ok: true, issueUrl: result.html_url });
    } catch (err) {
      console.error('[EXPORT] Error:', err.message);
      res.status(500).json({ ok: false, error: err.message });
    }
  });
}

module.exports = { registerRestRoutes };
