import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ContextLoader } = require('../../poc/context/loader.js');

// #196 — the system prompt is re-sent in full on every Gemini setup, so its size
// is latency on every turn, not just tokens. These assert against the REAL
// corpus in poc/knowledge, deliberately: the bug was triggered by ordinary prose
// in a mentor file ("Requires capital to survive Phase 1"), so a fixture corpus
// would have passed while production burned.
describe('ContextLoader — phase content budget (#196)', () => {
  const loader = new ContextLoader();
  const PHASES = [0, 1, 2, 3, 4, 5, 6, 7];
  const SLUGS = {
    0: 'user-stories', 1: 'mine', 2: 'scout', 3: 'assay',
    4: 'crucible', 5: 'auditor', 6: 'plan', 7: 'verify',
  };

  const entries = () => loader.index.knowledge;
  const read = (entry) => {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(
      path.join(__dirname, '..', '..', 'poc', 'knowledge', entry.path), 'utf-8'
    );
  };

  // The headline regression. Pre-fix these were 48,717-72,730 chars; Phase 0 was
  // 702 only by accident (no mentor file contains the literal "Phase 0"), which
  // is why the session felt fine until the first phase transition.
  it.each(PHASES)('phase %i extract stays within the per-entry budget', (phase) => {
    for (const entry of entries()) {
      if (!entry.phases.includes(phase)) continue;
      const extracted = loader._extractPhaseContent(read(entry), phase, SLUGS[phase]);
      expect(
        extracted.length,
        `${entry.id} @ phase ${phase} produced ${extracted.length} chars`
      ).toBeLessThanOrEqual(2500 + 20); // + truncation marker
    }
  });

  it.each(PHASES)('phase %i total knowledge stays under 12KB', (phase) => {
    let total = 0;
    for (const entry of entries()) {
      if (!entry.phases.includes(phase)) continue;
      total += loader._extractPhaseContent(read(entry), phase, SLUGS[phase]).length;
    }
    expect(total, `phase ${phase} total = ${total} chars`).toBeLessThanOrEqual(12000);
  });

  // The mechanism, not just the symptom: prose mentioning a phase must never
  // open a section. This is the exact line from hormozi.md:96 that triggered it.
  it('does not open a section on prose mentioning a phase', () => {
    const md = [
      '# Some Framework',
      '## Real Heading',
      'intro line',
      '- Requires capital to survive Phase 1, but builds "premium" brand equity',
      'THIS MUST NOT BE SWALLOWED',
      '## Another Heading',
      'nor this',
    ].join('\n');

    const out = loader._extractPhaseContent(md, 1, 'mine');
    expect(out).not.toContain('THIS MUST NOT BE SWALLOWED');
    expect(out).not.toContain('nor this');
  });

  // A genuine heading match must still work — proving the fix did not simply
  // disable extraction, which would pass every budget assertion above.
  it('still extracts a real phase heading and stops at the next peer', () => {
    const md = [
      '## Phase 1: Mine',
      'keep this line',
      '### deeper still kept',
      'also kept',
      '## Phase 2: Scout',
      'must not be included',
    ].join('\n');

    const out = loader._extractPhaseContent(md, 1, 'mine');
    expect(out).toContain('keep this line');
    expect(out).toContain('also kept');
    expect(out).not.toContain('must not be included');
  });
});
