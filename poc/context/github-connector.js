/**
 * GitHub Repository Context Connector
 *
 * Fetches context from a GitHub repository (README, issues, key files)
 * for injection into the Gemini system prompt.
 *
 * Works WITHOUT auth for public repos (using fetch).
 * Uses GITHUB_TOKEN when available for private repos + higher rate limits.
 */

class GitHubConnector {
  constructor() {
    this.token = process.env.GITHUB_TOKEN || null;
    if (this.token) {
      console.log('[GITHUB-CTX] Using authenticated requests');
    } else {
      console.log('[GITHUB-CTX] No token — using unauthenticated requests (public repos only)');
    }
  }

  _headers() {
    const h = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ThinkingFoundry' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _fetch(url) {
    const res = await fetch(url, { headers: this._headers() });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async fetchReadme(owner, repo) {
    try {
      const data = await this._fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      console.log(`[GITHUB-CTX] Fetched README for ${owner}/${repo} (${content.length} chars)`);
      return content;
    } catch (err) {
      console.warn(`[GITHUB-CTX] Failed to fetch README: ${err.message}`);
      return null;
    }
  }

  async fetchRecentIssues(owner, repo, limit = 5) {
    try {
      const data = await this._fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=updated&direction=desc&per_page=${limit}`);
      const issues = data
        .filter(i => !i.pull_request)
        .map(i => ({
          number: i.number,
          title: i.title,
          labels: i.labels.map(l => l.name),
          body: i.body ? i.body.substring(0, 500) : ''
        }));
      console.log(`[GITHUB-CTX] Fetched ${issues.length} issues for ${owner}/${repo}`);
      return issues;
    } catch (err) {
      console.warn(`[GITHUB-CTX] Failed to fetch issues: ${err.message}`);
      return [];
    }
  }

  async fetchRepoContext(owner, repo) {
    const sections = [`Repository: ${owner}/${repo}\n`];

    const readme = await this.fetchReadme(owner, repo);
    if (readme) {
      const truncated = readme.length > 3000 ? readme.substring(0, 3000) + '\n...[truncated]' : readme;
      sections.push('--- README ---', truncated, '');
    }

    const issues = await this.fetchRecentIssues(owner, repo);
    if (issues.length > 0) {
      sections.push('--- Recent Open Issues ---');
      for (const issue of issues) {
        const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';
        sections.push(`#${issue.number}: ${issue.title}${labels}`);
        if (issue.body) sections.push(`  ${issue.body.substring(0, 200).replace(/\n/g, ' ')}`);
      }
      sections.push('');
    }

    const result = sections.join('\n').trim();
    console.log(`[GITHUB-CTX] Full context for ${owner}/${repo}: ${result.length} chars`);
    return result;
  }

  async isAvailable() { return true; }
}

module.exports = { GitHubConnector };
