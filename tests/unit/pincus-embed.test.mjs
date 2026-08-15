import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { ContextLoader } = require('../../poc/context/loader.js');

const PROMPTS = path.join(__dirname, '..', '..', 'poc', 'prompts');
const readPrompt = (f) => fs.readFileSync(path.join(PROMPTS, f), 'utf-8');

// thinking-foundry#189. Roderic, 2026-08-15: "Pincus should be there the whole
// time, especially from the very beginning, because he knows what good ideas
// are." A corpus file that is written but not registered, or registered but not
// reachable in the prompt, is the soul-file.md failure again — good prose that
// nothing loads.
describe('Pincus embed (#189)', () => {
  const loader = new ContextLoader();
  const entry = () => loader.index.knowledge.find((k) => k.id === 'pincus');

  it('is registered in the knowledge index for every phase', () => {
    const e = entry();
    expect(e, 'pincus missing from index.json').toBeTruthy();
    expect(e.phases).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('the registered corpus file actually exists', () => {
    const file = path.join(__dirname, '..', '..', 'poc', 'knowledge', entry().path);
    expect(fs.existsSync(file), `${file} not found`).toBe(true);
  });

  // The load-bearing one: registration is not the same as reaching the model.
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('reaches the composed system prompt at phase %i', async (p) => {
    const out = await loader.load({ phase: p, includeHotMemory: false });
    expect(out).toContain('Pincus');
  });

  it('carries instinct-vs-idea into Phase 0 and Phase 1 context', async () => {
    for (const p of [0, 1]) {
      const out = await loader.load({ phase: p, includeHotMemory: false });
      expect(out.toLowerCase(), `phase ${p}`).toMatch(/instinct/);
    }
  });

  // The corpus makes her ABLE to cite it; the phase prompt makes it FIRE.
  it('Phase 0 prompt instructs the instinct/idea split from the first exchange', () => {
    const t = readPrompt('phase-0-user-stories.txt');
    expect(t).toMatch(/INSTINCT vs IDEA/i);
    expect(t).toMatch(/first exchange/i);
    expect(t.toLowerCase()).toContain('sms taxi');
  });

  it('Phase 1 prompt uses rival implementations as the mining tool', () => {
    const t = readPrompt('phase-1-mine.txt');
    expect(t).toMatch(/INSTINCT vs IDEA/i);
    expect(t).toMatch(/rival implementations/i);
  });

  // Attribution discipline — same rule settled for the standalone skill: name
  // him, cite the public framework, never imply endorsement.
  it('states non-affiliation and bans invented quotes', () => {
    const file = path.join(__dirname, '..', '..', 'poc', 'knowledge', entry().path);
    const md = fs.readFileSync(file, 'utf-8');
    expect(md).toMatch(/[Nn]ot affiliated/);
    expect(md).toMatch(/[Nn]ever invent quotes/);
  });

  // Guard the reason this is affordable at all: without the #196 budget this
  // 9th entry would have added another ~50KB to every turn.
  it('adding a 9th mentor keeps every phase inside the prompt budget', async () => {
    for (let p = 0; p <= 7; p++) {
      const out = await loader.load({ phase: p, includeHotMemory: false });
      expect(out.length, `phase ${p} = ${out.length} chars`).toBeLessThanOrEqual(12000);
    }
  });
});
