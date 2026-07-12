/**
 * HotMemory — hot.md recent-session cache (issue #169).
 *
 * A connected-Markdown memory layer: when a session ends, a short bullet
 * summary is prepended to poc/knowledge/hot.md. On the next session start,
 * the loader reads hot.md first — cheap continuity with no vector search,
 * no embedding costs, and human-editable (Roderic can open the file).
 *
 * Keeps the last MAX_SESSIONS session entries, newest first.
 */

const fs = require('fs');
const path = require('path');

const MAX_SESSIONS = 3;
const MAX_BULLETS_PER_SESSION = 5;
const MAX_BULLET_LENGTH = 200;

const HEADER = `# hot.md — Recent Session Memory

<!-- Auto-maintained by the Thinking Foundry server. Newest session first,
     last ${MAX_SESSIONS} sessions kept. Safe to edit by hand. -->
`;

class HotMemory {
  /**
   * @param {object} [options]
   * @param {string} [options.filePath] - Override hot.md location (used in tests)
   */
  constructor({ filePath } = {}) {
    this.filePath = filePath || path.join(__dirname, '..', 'knowledge', 'hot.md');
  }

  /** Read the raw hot.md content, or '' if it doesn't exist yet. */
  read() {
    try {
      return fs.readFileSync(this.filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Parse existing session entries (blocks starting with "## Session").
   * @returns {string[]} entry blocks, newest first
   */
  _parseEntries(content) {
    if (!content) return [];
    return content
      .split(/^(?=## Session )/m)
      .filter((block) => block.startsWith('## Session '))
      .map((block) => block.trimEnd());
  }

  /**
   * Prepend a session summary and rewrite hot.md, keeping the newest
   * MAX_SESSIONS entries.
   *
   * @param {object} summary
   * @param {string} summary.endedAt - ISO timestamp of session end
   * @param {number} [summary.phaseReached] - Highest phase reached (0-7)
   * @param {string[]} summary.bullets - Key takeaways (truncated to 5 × 200 chars)
   * @param {string} [summary.sessionId] - Optional session identifier
   */
  appendSession({ endedAt, phaseReached, bullets = [], sessionId }) {
    const cleanBullets = bullets
      .filter((b) => b && b.trim())
      .slice(0, MAX_BULLETS_PER_SESSION)
      .map((b) => `- ${b.trim().replace(/\s+/g, ' ').slice(0, MAX_BULLET_LENGTH)}`);

    if (cleanBullets.length === 0) return false; // nothing worth remembering

    const meta = [
      phaseReached !== undefined ? `phase reached: ${phaseReached}` : null,
      sessionId ? `id: ${sessionId}` : null,
    ].filter(Boolean).join(', ');

    const entry = [`## Session ${endedAt}${meta ? ` (${meta})` : ''}`, '', ...cleanBullets].join('\n');
    const existing = this._parseEntries(this.read());
    const kept = [entry, ...existing].slice(0, MAX_SESSIONS);

    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${HEADER}\n${kept.join('\n\n')}\n`, 'utf-8');
    return true;
  }

  /**
   * Get hot memory formatted for system-prompt injection, or '' if empty.
   */
  getPromptContext() {
    const entries = this._parseEntries(this.read());
    if (entries.length === 0) return '';
    return `=== RECENT SESSIONS (hot memory) ===\n\n${entries.join('\n\n')}`;
  }
}

module.exports = { HotMemory, MAX_SESSIONS };
