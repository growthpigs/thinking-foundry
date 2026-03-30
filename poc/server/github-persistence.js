/**
 * GitHubPersistence — Source-of-truth layer for thinking sessions.
 *
 * ONE GitHub issue per phase, created in the Vault repo.
 * Batch-flushed from Supabase every 2-3 minutes.
 *
 * Implements Articles 15-17 of the Constitution:
 * - GitHub Issues ARE the thinking documents
 * - Real-time capture (via Supabase → GitHub flush)
 * - Verification requires evidence (point to the issue)
 */

const { Octokit } = require('@octokit/rest');

const PHASE_NAMES = [
  'Setup',      // 0
  'Mine',       // 1
  'Scout',      // 2
  'Assay',      // 3
  'Crucible',   // 4
  'Auditor',    // 5
  'Plan',       // 6
  'Verify',     // 7
];

class GitHubPersistence {
  /**
   * @param {object} options
   * @param {string} options.token - GitHub personal access token
   * @param {string} options.owner - Repository owner (e.g., 'growthpigs')
   * @param {string} options.repo - Repository name (e.g., 'thinking-foundry-vault')
   */
  constructor({ token, owner, repo } = {}) {
    const ghToken = token || process.env.GITHUB_TOKEN;
    if (!ghToken) throw new Error('GitHubPersistence: GITHUB_TOKEN required');

    this.octokit = new Octokit({ auth: ghToken });
    this.owner = owner || 'growthpigs';
    this.repo = repo || 'thinking-foundry-vault';

    // Track issues created in this session
    this.phaseIssues = new Map(); // phase number → { number, url }
  }

  /**
   * Create a GitHub issue for a specific phase.
   *
   * @param {string} sessionName - Human-readable session name
   * @param {number} phase - Phase number (0-7)
   * @returns {{ number: number, url: string }}
   */
  async createPhaseIssue(sessionName, phase) {
    const phaseName = PHASE_NAMES[phase] || `Phase ${phase}`;
    const title = `[SESSION] ${sessionName} — Phase ${phase}: ${phaseName}`;

    const body = [
      `# Phase ${phase}: ${phaseName}`,
      '',
      `**Session:** ${sessionName}`,
      `**Phase:** ${phase} — ${phaseName}`,
      `**Started:** ${new Date().toISOString()}`,
      `**Status:** In Progress`,
      '',
      '---',
      '',
      '## Notes',
      '',
      '_Waiting for first flush from Supabase buffer..._',
      '',
      '---',
      '',
      '## Carry-Forward',
      '',
      '_Will be added at phase completion._',
    ].join('\n');

    const labels = ['session', `phase:${phaseName.toLowerCase()}`];

    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
    });

    const issue = { number: data.number, url: data.html_url };
    this.phaseIssues.set(phase, issue);
    console.log(`[GITHUB] Created issue #${issue.number} for Phase ${phase}: ${phaseName}`);
    return issue;
  }

  /**
   * Update a phase issue's body with coalesced notes from Supabase flush.
   * Called every 2-3 minutes by the flush interval.
   *
   * @param {number} issueNumber - GitHub issue number
   * @param {string} coalescedNotes - Formatted notes to replace the Notes section
   */
  async updatePhaseIssue(issueNumber, coalescedNotes) {
    // Get current body
    const { data: issue } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    // Replace the Notes section content
    const body = issue.body ?? '';
    const updatedBody = body.replace(
      /## Notes\n\n[\s\S]*?(?=\n---\n\n## Carry-Forward)/,
      `## Notes\n\n${coalescedNotes}\n`
    );

    if (updatedBody === body) {
      console.warn(`[GITHUB] updatePhaseIssue #${issueNumber}: Notes section not found — body structure may have changed`);
      return;
    }

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: updatedBody,
    });

    console.log(`[GITHUB] Updated issue #${issueNumber} with coalesced notes`);
  }

  /**
   * Add carry-forward document as a comment on the phase issue.
   * Implements Article 8: One carry-forward per phase.
   *
   * @param {number} issueNumber - GitHub issue number
   * @param {string} carryForwardText - The synthesized carry-forward
   * @param {number} [confidence] - Confidence score from The Squeeze
   * @param {string} [squeezeNotes] - Notes from The Squeeze
   */
  async addCarryForward(issueNumber, carryForwardText, confidence, squeezeNotes) {
    const comment = [
      '## Carry-Forward Document',
      '',
      carryForwardText,
      '',
      '---',
      '',
      `**Confidence:** ${confidence || 'N/A'}/10`,
      squeezeNotes ? `**Squeeze Notes:** ${squeezeNotes}` : '',
      `**Generated:** ${new Date().toISOString()}`,
    ].filter(Boolean).join('\n');

    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: comment,
    });

    // Also update the Carry-Forward section in the issue body
    const { data: issue } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    const updatedBody = issue.body.replace(
      /## Carry-Forward\n\n[\s\S]*/,
      `## Carry-Forward\n\n${carryForwardText}\n\n**Confidence:** ${confidence || 'N/A'}/10`
    );

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: updatedBody,
      labels: undefined, // Don't change labels
    });

    console.log(`[GITHUB] Added carry-forward to issue #${issueNumber}`);
  }

  /**
   * Close a phase issue when the phase is complete.
   * @param {number} issueNumber - GitHub issue number
   */
  async closePhaseIssue(issueNumber) {
    // Update status in body
    const { data: issue } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    const updatedBody = issue.body
      .replace('**Status:** In Progress', `**Status:** Complete`)
      .replace(/\n\n---\n\n## Notes/, `\n**Completed:** ${new Date().toISOString()}\n\n---\n\n## Notes`);

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: updatedBody,
      state: 'closed',
    });

    console.log(`[GITHUB] Closed issue #${issueNumber}`);
  }

  /**
   * Cross-reference all phase issues in a session.
   * Adds a comment to the first issue linking to all others.
   *
   * @param {Array<{phase, number, url}>} sessionIssues - All issues from this session
   */
  async linkSessionIssues(sessionIssues) {
    if (sessionIssues.length < 2) return;

    const links = sessionIssues
      .sort((a, b) => a.phase - b.phase)
      .map(i => `- Phase ${i.phase} (${PHASE_NAMES[i.phase]}): #${i.number}`)
      .join('\n');

    const comment = [
      '## Session Index',
      '',
      `This session produced ${sessionIssues.length} phase issues:`,
      '',
      links,
      '',
      `_Session completed: ${new Date().toISOString()}_`,
    ].join('\n');

    // Add index comment to the first issue
    const firstIssue = sessionIssues.sort((a, b) => a.phase - b.phase)[0];
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: firstIssue.number,
      body: comment,
    });

    console.log(`[GITHUB] Linked ${sessionIssues.length} session issues on #${firstIssue.number}`);
  }

  /**
   * Coalesce raw utterances into formatted notes for a GitHub issue update.
   * Groups by speaker, adds timestamps, highlights key points.
   *
   * @param {Array<{speaker, text, is_key_point, created_at}>} utterances
   * @returns {string} Formatted markdown notes
   */
  static coalesceNotes(utterances) {
    if (!Array.isArray(utterances) || utterances.length === 0) return '_No new notes._';

    const lines = [];
    let lastSpeaker = null;

    for (const u of utterances) {
      const rawTime = new Date(u.created_at);
      const time = isNaN(rawTime) ? '??:??' : rawTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const text = u.text ?? '_(empty)_';
      const prefix = u.is_key_point ? '**' : '';
      const suffix = u.is_key_point ? '** ⭐' : '';

      if (u.speaker !== lastSpeaker) {
        if (lastSpeaker !== null) lines.push('');
        const label = u.speaker === 'ai' ? '🤖 AI' : u.speaker === 'user' ? '🗣️ User' : '⚙️ System';
        lines.push(`### ${label} (${time})`);
        lastSpeaker = u.speaker;
      }

      lines.push(`${prefix}${text}${suffix}`);
    }

    return lines.join('\n');
  }

  /**
   * Get all issues created in this session.
   * @returns {Array<{phase, number, url}>}
   */
  getSessionIssues() {
    return Array.from(this.phaseIssues.entries()).map(([phase, issue]) => ({
      phase,
      ...issue,
    }));
  }
}

module.exports = { GitHubPersistence, PHASE_NAMES };
