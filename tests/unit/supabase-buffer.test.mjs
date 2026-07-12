import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { SupabaseBuffer, PHASE_NAMES } = require('../../poc/server/supabase-buffer.js');

/** Chainable fake for the supabase-js query builder. */
function makeFakeSupabase(overrides = {}) {
  const calls = [];
  const result = { data: null, error: null, ...overrides };
  const builder = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') {
        // Awaiting the chain resolves to the canned result
        return (resolve) => resolve(result);
      }
      return (...args) => {
        calls.push([prop, ...args]);
        return builder;
      };
    },
  });
  return {
    client: { from: (table) => { calls.push(['from', table]); return builder; }, rpc: (...a) => { calls.push(['rpc', ...a]); return Promise.resolve(result); } },
    calls,
    result,
  };
}

describe('SupabaseBuffer', () => {
  it('throws without credentials', () => {
    const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;
    expect(() => new SupabaseBuffer()).toThrow(/required/);
    if (saved.url) process.env.SUPABASE_URL = saved.url;
    if (saved.key) process.env.SUPABASE_KEY = saved.key;
  });

  describe('with a mocked client', () => {
    let buffer, fake;

    beforeEach(() => {
      buffer = new SupabaseBuffer({ supabaseUrl: 'https://test.supabase.co', supabaseKey: 'test-key' });
      fake = makeFakeSupabase();
      buffer.supabase = fake.client;
    });

    it('startSession stores the returned session id', async () => {
      fake.result.data = { id: 'session-uuid-1' };
      const id = await buffer.startSession('tok123');
      expect(id).toBe('session-uuid-1');
      expect(buffer.sessionId).toBe('session-uuid-1');
      expect(fake.calls[0]).toEqual(['from', 'sessions']);
      expect(fake.calls.some(([m]) => m === 'insert')).toBe(true);
    });

    it('startSession throws on error', async () => {
      fake.result.error = { message: 'nope' };
      await expect(buffer.startSession('tok')).rejects.toThrow(/startSession failed: nope/);
    });

    it('writeUtterance requires an active session', async () => {
      await expect(buffer.writeUtterance(0, 'user', 'hi')).rejects.toThrow(/No active session/);
    });

    it('writeUtterance skips empty text without touching the DB', async () => {
      buffer.sessionId = 'sid';
      await buffer.writeUtterance(1, 'user', '   ');
      expect(fake.calls).toHaveLength(0);
    });

    it('writeUtterance trims text and inserts', async () => {
      buffer.sessionId = 'sid';
      await buffer.writeUtterance(2, 'ai', '  an insight  ', true);
      const insert = fake.calls.find(([m]) => m === 'insert');
      expect(insert[1]).toMatchObject({ session_id: 'sid', phase: 2, speaker: 'ai', text: 'an insight', is_key_point: true });
    });

    it('markFlushed is a no-op for an empty id list', async () => {
      await buffer.markFlushed([]);
      await buffer.markFlushed(null);
      expect(fake.calls).toHaveLength(0);
    });

    it('getUnflushedUtterances returns [] with no session', async () => {
      expect(await buffer.getUnflushedUtterances()).toEqual([]);
    });

    it('endSession marks completed and clears the session id', async () => {
      buffer.sessionId = 'sid';
      await buffer.endSession();
      expect(buffer.sessionId).toBeNull();
      const update = fake.calls.find(([m]) => m === 'update');
      expect(update[1]).toMatchObject({ status: 'completed' });
    });

    it('saveCarryForward upserts on session_id,phase', async () => {
      buffer.sessionId = 'sid';
      await buffer.saveCarryForward(1, 'Root cause found.', 8, 'squeeze notes', 'https://github.com/x/1');
      const upsert = fake.calls.find(([m]) => m === 'upsert');
      expect(upsert[1]).toMatchObject({ phase: 1, carry_forward: 'Root cause found.', confidence: 8 });
      expect(upsert[2]).toMatchObject({ onConflict: 'session_id,phase' });
    });
  });

  it('exports the 8 canonical phase names', () => {
    expect(PHASE_NAMES).toHaveLength(8);
    expect(PHASE_NAMES[1]).toBe('Mine');
    expect(PHASE_NAMES[7]).toBe('Verify');
  });
});
