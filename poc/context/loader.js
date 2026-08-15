/**
 * Unified Context Loader
 *
 * Loads knowledge frameworks and external context (Drive, GitHub)
 * into a formatted string for injection into the Gemini system prompt.
 *
 * Usage:
 *   const { ContextLoader } = require('./context/loader');
 *   const loader = new ContextLoader();
 *   const context = await loader.load({ phase: 0, frameworks: ['stoicism', 'mckinsey'] });
 */

const fs = require('fs');
const path = require('path');
const { HotMemory } = require('../server/hot-memory');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const INDEX_PATH = path.join(KNOWLEDGE_DIR, 'index.json');

// Prompt budget (#196). This block is prepended to the system instruction and
// re-sent in FULL on every Gemini setup, so its size is paid on every turn and
// every reconnect — it is latency, not just tokens.
//
// Per-entry cap: no single mentor file may dominate. ~2.5KB is comfortably more
// than a well-formed phase section (largest legitimate one measured: ~1.4KB).
const MAX_PHASE_CONTENT_CHARS = 2500;
// Total cap across all entries, after per-entry truncation. 8 entries x 2.5KB
// would be 20KB worst case; 12KB (~3K tokens) is the ceiling we actually accept.
const MAX_KNOWLEDGE_CONTEXT_CHARS = 12000;

class ContextLoader {
  constructor() {
    this.index = this._loadIndex();
    this.cache = new Map();
    this.hotMemory = new HotMemory();
  }

  /**
   * Load the knowledge index registry
   */
  _loadIndex() {
    try {
      const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[CONTEXT] Failed to load knowledge index:', err.message);
      return { knowledge: [], phaseNames: {} };
    }
  }

  /**
   * Load a single knowledge file by ID
   */
  _loadKnowledgeFile(id) {
    if (this.cache.has(id)) return this.cache.get(id);

    const entry = this.index.knowledge.find(k => k.id === id);
    if (!entry) {
      console.warn(`[CONTEXT] Knowledge entry not found: ${id}`);
      return null;
    }

    const filePath = path.join(KNOWLEDGE_DIR, entry.path);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.cache.set(id, { entry, content });
      return { entry, content };
    } catch (err) {
      console.warn(`[CONTEXT] Failed to load knowledge file ${entry.path}:`, err.message);
      return null;
    }
  }

  /**
   * Get knowledge entries relevant to a specific phase
   */
  getRelevantForPhase(phase) {
    return this.index.knowledge.filter(k => k.phases.includes(phase));
  }

  /**
   * Get knowledge entries matching specific tags
   */
  getByTags(tags) {
    return this.index.knowledge.filter(k =>
      tags.some(tag => k.tags.includes(tag))
    );
  }

  /**
   * Extract the phase-specific section from a knowledge file.
   * Looks for content under the "When to Apply" and "Example AI Prompts" sections
   * that reference the given phase.
   */
  _extractPhaseContent(content, phase, phaseName) {
    const lines = content.split('\n');
    let result = [];
    let inRelevantSection = false;
    let sectionDepth = 0;

    for (const line of lines) {
      // Check for phase-specific prompt sections
      const phaseLabel = `Phase ${phase}`;
      const phaseSlug = phaseName ? phaseName.toUpperCase() : '';
      const headingDepth = (line.match(/^#+/) || [''])[0].length;

      // HEADINGS ONLY. Matching prose was the bug: an ordinary bullet such as
      // hormozi.md's "Requires capital to survive Phase 1" set sectionDepth = 0,
      // and the exit test below (`currentDepth > 0 && currentDepth <= 0`) is then
      // unsatisfiable — so the extractor swallowed the rest of the file. Eight
      // mentor files x every phase took the system prompt from 702 chars at
      // Phase 0 to ~66-73KB from Phase 1 onward. See #196.
      if (headingDepth > 0 && (line.includes(phaseLabel) || (phaseSlug && line.includes(phaseSlug)))) {
        inRelevantSection = true;
        sectionDepth = headingDepth;
        result.push(line);
        continue;
      }

      if (inRelevantSection) {
        // sectionDepth is now guaranteed >= 1, so this can always fire.
        if (headingDepth > 0 && headingDepth <= sectionDepth && !line.includes(phaseLabel)) {
          inRelevantSection = false;
          continue;
        }
        result.push(line);
      }
    }

    // Belt as well as braces: even with the exit fixed, a future corpus edit
    // (one enormous section, or a heading matching every phase) could bloat the
    // prompt again. The budget makes that class of regression impossible rather
    // than merely unlikely.
    const extracted = result.join('\n').trim();
    if (extracted.length > MAX_PHASE_CONTENT_CHARS) {
      console.warn(
        `[CONTEXT] phase ${phase} extract truncated: ${extracted.length} > ${MAX_PHASE_CONTENT_CHARS} chars`
      );
      return extracted.slice(0, MAX_PHASE_CONTENT_CHARS).trimEnd() + '\n…[truncated]';
    }
    return extracted;
  }

  /**
   * Main load method. Takes a config and returns formatted context string.
   *
   * @param {Object} config
   * @param {number} config.phase - Current session phase (0-7)
   * @param {string[]} [config.frameworks] - Specific framework IDs to load. If omitted, loads all relevant to phase
   * @param {boolean} [config.fullContent=false] - Load full content (true) or phase-specific excerpts (false)
   * @param {string} [config.driveContext] - Pre-loaded Google Drive context string
   * @param {string} [config.githubContext] - Pre-loaded GitHub context string
   * @returns {Promise<string>} Formatted context string
   */
  async load(config = {}) {
    const { phase = 0, frameworks, fullContent = false, driveContext, githubContext, includeHotMemory = true } = config;
    const phaseName = this.index.phaseNames[phase] || 'user-stories';

    const sections = [];

    // --- Hot memory: recent-session bullets, read FIRST (cheap, no vector search — #169) ---
    if (includeHotMemory) {
      const hot = this.hotMemory.getPromptContext();
      if (hot) {
        sections.push(hot);
        sections.push('');
      }
    }

    // --- Knowledge Frameworks ---
    let entries;
    if (frameworks && frameworks.length > 0) {
      // Load specific frameworks requested
      entries = frameworks
        .map(id => this._loadKnowledgeFile(id))
        .filter(Boolean);
    } else {
      // Load all frameworks relevant to this phase
      const relevant = this.getRelevantForPhase(phase);
      entries = relevant
        .map(k => this._loadKnowledgeFile(k.id))
        .filter(Boolean);
    }

    if (entries.length > 0) {
      sections.push('=== KNOWLEDGE FRAMEWORKS ===\n');

      for (const { entry, content } of entries) {
        if (fullContent) {
          sections.push(`--- ${entry.name} ---`);
          sections.push(content);
          sections.push('');
        } else {
          // Extract phase-specific content for conciseness
          const phaseContent = this._extractPhaseContent(content, phase, phaseName);
          if (phaseContent) {
            sections.push(`--- ${entry.name} (Phase ${phase}: ${phaseName}) ---`);
            sections.push(phaseContent);
            sections.push('');
          } else {
            // Fallback: include description only
            sections.push(`--- ${entry.name} ---`);
            sections.push(entry.description);
            sections.push('');
          }
        }
      }

      // Total ceiling across every entry (#196). Per-entry truncation alone
      // still lets N entries sum past the budget, and the entry count is driven
      // by index.json — data, not code — so the cap belongs here too.
      const knowledgeSoFar = sections.join('\n');
      if (knowledgeSoFar.length > MAX_KNOWLEDGE_CONTEXT_CHARS) {
        console.warn(
          `[CONTEXT] phase ${phase} knowledge truncated: ${knowledgeSoFar.length} > ${MAX_KNOWLEDGE_CONTEXT_CHARS} chars`
        );
        sections.length = 0;
        sections.push(
          knowledgeSoFar.slice(0, MAX_KNOWLEDGE_CONTEXT_CHARS).trimEnd() + '\n…[truncated]'
        );
      }
    }

    // --- External Context: Google Drive ---
    if (driveContext) {
      sections.push('=== GOOGLE DRIVE CONTEXT ===\n');
      sections.push(driveContext);
      sections.push('');
    }

    // --- External Context: GitHub ---
    if (githubContext) {
      sections.push('=== GITHUB CONTEXT ===\n');
      sections.push(githubContext);
      sections.push('');
    }

    const result = sections.join('\n').trim();

    if (result) {
      console.log(`[CONTEXT] Loaded ${entries.length} knowledge entries for phase ${phase} (${result.length} chars)`);
    } else {
      console.log('[CONTEXT] No context loaded');
    }

    return result;
  }

  /**
   * List all available knowledge entries
   */
  listAll() {
    return this.index.knowledge.map(k => ({
      id: k.id,
      name: k.name,
      type: k.type,
      description: k.description,
      phases: k.phases,
      tags: k.tags
    }));
  }
}

module.exports = { ContextLoader };
