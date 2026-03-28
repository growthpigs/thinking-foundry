/**
 * GitHub Repository Context Connector
 *
 * Fetches context from a GitHub repository (README, issues, key files)
 * for injection into the Gemini system prompt.
 *
 * Requires GITHUB_TOKEN env var for authenticated requests.
 * Falls back gracefully if no token is configured.
 *
 * Usage:
 *   const { GitHubConnector } = require('./context/github-connector');
 *   const gh = new GitHubConnector();
 *   const context = await gh.fetchRepoContext('owner', 'repo');
 */

class GitHubConnector {
  constructor() {
    this.octokit = null;
    this.initialized = false;
  }

  /**
   * Lazy initialization of Octokit client.
   * Returns false if no GitHub token is available.
   */
  async _init() {
    if (this.initialized) return !!this.octokit;

    this.initialized = true;

    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        console.log('[GITHUB-CTX] No GITHUB_TOKEN env var — GitHub context disabled');
        return false;
      }

      const { Octokit } = require('@octokit/rest');
      this.octokit = new Octokit({ auth: token });
      console.log('[GITHUB-CTX] GitHub connector initialized');
      return true;
    } catch (err) {
      console.warn('[GITHUB-CTX] Failed to initialize:', err.message);
      return false;
    }
  }

  /**
   * Fetch the README content of a repository.
   *
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<string|null>} README content or null
   */
  async fetchReadme(owner, repo) {
    if (!await this._init()) return null;

    try {
      const { data } = await this.octokit.repos.getReadme({ owner, repo });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      console.log(`[GITHUB-CTX] Fetched README for ${owner}/${repo} (${content.length} chars)`);
      return content;
    } catch (err) {
      console.warn(`[GITHUB-CTX] Failed to fetch README for ${owner}/${repo}:`, err.message);
      return null;
    }
  }

  /**
   * Fetch recent open issues from a repository.
   *
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} [limit=10] - Maximum issues to fetch
   * @returns {Promise<Array>} Array of issue summaries
   */
  async fetchRecentIssues(owner, repo, limit = 10) {
    if (!await this._init()) return [];

    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: limit
      });

      const issues = data
        .filter(i => !i.pull_request) // Exclude PRs
        .map(i => ({
          number: i.number,
          title: i.title,
          labels: i.labels.map(l => l.name),
          body: i.body ? i.body.substring(0, 500) : ''
        }));

      console.log(`[GITHUB-CTX] Fetched ${issues.length} issues for ${owner}/${repo}`);
      return issues;
    } catch (err) {
      console.warn(`[GITHUB-CTX] Failed to fetch issues for ${owner}/${repo}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch a specific file's content from a repository.
   *
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} filePath - Path to file in the repo
   * @returns {Promise<string|null>} File content or null
   */
  async fetchFile(owner, repo, filePath) {
    if (!await this._init()) return null;

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: filePath
      });

      if (data.type !== 'file') return null;

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      console.log(`[GITHUB-CTX] Fetched ${filePath} from ${owner}/${repo} (${content.length} chars)`);
      return content;
    } catch (err) {
      console.warn(`[GITHUB-CTX] Failed to fetch ${filePath} from ${owner}/${repo}:`, err.message);
      return null;
    }
  }

  /**
   * Fetch comprehensive repo context: README + recent issues + optional key files.
   *
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} [options]
   * @param {number} [options.issueLimit=5] - Max issues to include
   * @param {string[]} [options.files] - Additional file paths to fetch
   * @returns {Promise<string>} Formatted context string
   */
  async fetchRepoContext(owner, repo, options = {}) {
    if (!await this._init()) return '';

    const { issueLimit = 5, files = [] } = options;
    const sections = [];

    // Repository info
    sections.push(`Repository: ${owner}/${repo}\n`);

    // README
    const readme = await this.fetchReadme(owner, repo);
    if (readme) {
      // Truncate long READMEs
      const truncated = readme.length > 3000 ? readme.substring(0, 3000) + '\n...[truncated]' : readme;
      sections.push('--- README ---');
      sections.push(truncated);
      sections.push('');
    }

    // Recent issues
    const issues = await this.fetchRecentIssues(owner, repo, issueLimit);
    if (issues.length > 0) {
      sections.push('--- Recent Open Issues ---');
      for (const issue of issues) {
        const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';
        sections.push(`#${issue.number}: ${issue.title}${labels}`);
        if (issue.body) {
          sections.push(`  ${issue.body.substring(0, 200).replace(/\n/g, ' ')}`);
        }
      }
      sections.push('');
    }

    // Additional files
    for (const filePath of files) {
      const content = await this.fetchFile(owner, repo, filePath);
      if (content) {
        const truncated = content.length > 2000 ? content.substring(0, 2000) + '\n...[truncated]' : content;
        sections.push(`--- ${filePath} ---`);
        sections.push(truncated);
        sections.push('');
      }
    }

    const result = sections.join('\n').trim();
    console.log(`[GITHUB-CTX] Full repo context for ${owner}/${repo}: ${result.length} chars`);
    return result;
  }

  /**
   * Check if the GitHub connector is available (has token)
   */
  async isAvailable() {
    return await this._init();
  }
}

module.exports = { GitHubConnector };
