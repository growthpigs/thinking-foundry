import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
import { mkdtempSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { HotMemory, MAX_SESSIONS } = require('../../poc/server/hot-memory.js');

describe('HotMemory (hot.md — #169)', () => {
  let hot, filePath;

  beforeEach(() => {
    filePath = join(mkdtempSync(join(tmpdir(), 'hot-')), 'hot.md');
    hot = new HotMemory({ filePath });
  });

  it('read returns empty string when hot.md does not exist', () => {
    expect(hot.read()).toBe('');
    expect(hot.getPromptContext()).toBe('');
  });

  it('appendSession writes a session entry with bullets', () => {
    const ok = hot.appendSession({
      endedAt: '2026-07-12T10:00:00Z',
      phaseReached: 4,
      bullets: ['Root cause: pricing fear, not product', 'Decided to test €99 tier'],
    });
    expect(ok).toBe(true);
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('## Session 2026-07-12T10:00:00Z (phase reached: 4)');
    expect(content).toContain('- Root cause: pricing fear, not product');
  });

  it('skips writing when there are no meaningful bullets', () => {
    expect(hot.appendSession({ endedAt: 'x', bullets: ['', '   '] })).toBe(false);
    expect(existsSync(filePath)).toBe(false);
  });

  it('keeps only the newest MAX_SESSIONS entries, newest first', () => {
    for (let i = 1; i <= 5; i++) {
      hot.appendSession({ endedAt: `2026-07-0${i}T00:00:00Z`, bullets: [`takeaway ${i}`] });
    }
    const entries = hot._parseEntries(hot.read());
    expect(entries).toHaveLength(MAX_SESSIONS);
    expect(entries[0]).toContain('2026-07-05');
    expect(entries[2]).toContain('2026-07-03');
    expect(hot.read()).not.toContain('takeaway 1');
  });

  it('caps bullets at 5 and truncates long ones', () => {
    hot.appendSession({
      endedAt: 't',
      bullets: ['one', 'two', 'three', 'four', 'five', 'six', 'x'.repeat(500)],
    });
    const content = hot.read();
    expect(content).toContain('- five');
    expect(content).not.toContain('- six');
    expect(content).not.toContain('x'.repeat(201));
  });

  it('normalizes whitespace inside bullets', () => {
    hot.appendSession({ endedAt: 't', bullets: ['line\nbreaks   and   spaces'] });
    expect(hot.read()).toContain('- line breaks and spaces');
  });

  it('getPromptContext formats entries for system-prompt injection', () => {
    hot.appendSession({ endedAt: 't1', bullets: ['a decision was made'] });
    const ctx = hot.getPromptContext();
    expect(ctx).toContain('=== RECENT SESSIONS (hot memory) ===');
    expect(ctx).toContain('- a decision was made');
  });

  it('survives hand-edited files (parses only ## Session blocks)', () => {
    hot.appendSession({ endedAt: 't1', bullets: ['first'] });
    // Simulate Roderic adding notes above the entries
    const edited = hot.read().replace('# hot.md', '# hot.md\n\nMy manual note.\n');
    require('fs').writeFileSync(filePath, edited);
    hot.appendSession({ endedAt: 't2', bullets: ['second'] });
    const entries = hot._parseEntries(hot.read());
    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('second');
  });
});
