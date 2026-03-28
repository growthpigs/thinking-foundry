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

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const INDEX_PATH = path.join(KNOWLEDGE_DIR, 'index.json');

class ContextLoader {
  constructor() {
    this.index = this._loadIndex();
    this.cache = new Map();
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

      if (line.includes(phaseLabel) || (phaseSlug && line.includes(phaseSlug))) {
        inRelevantSection = true;
        sectionDepth = (line.match(/^#+/) || [''])[0].length;
        result.push(line);
        continue;
      }

      if (inRelevantSection) {
        const currentDepth = (line.match(/^#+/) || [''])[0].length;
        // Stop at next section of same or higher level
        if (currentDepth > 0 && currentDepth <= sectionDepth && !line.includes(phaseLabel)) {
          inRelevantSection = false;
          continue;
        }
        result.push(line);
      }
    }

    return result.join('\n').trim();
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
    const { phase = 0, frameworks, fullContent = false, driveContext, githubContext } = config;
    const phaseName = this.index.phaseNames[phase] || 'user-stories';

    const sections = [];

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
