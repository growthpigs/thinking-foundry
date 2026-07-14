import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { GeminiLiveManager } = require('../../poc/server/gemini-live.js');

class FakeWs extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1; // WebSocket.OPEN
    this.sent = [];
  }
  send(msg) { this.sent.push(JSON.parse(msg)); }
  close(code, reason) {
    this.readyState = 3;
    this.emit('close', code, String(reason || ''));
  }
}

const lastSetup = (ws) => ws.sent.filter((m) => m.setup).pop()?.setup;

describe('GeminiLiveManager — native session resumption', () => {
  let mgr;

  beforeEach(() => {
    vi.useFakeTimers();
    mgr = new GeminiLiveManager({ apiKey: 'test-key' });
  });
  afterEach(() => {
    mgr.close();
    vi.useRealTimers();
  });

  it('setup opts into sessionResumption and contextWindowCompression by default', () => {
    const ws = new FakeWs();
    mgr.sendSetup(ws, 0, '');
    const setup = lastSetup(ws);
    expect(setup.sessionResumption).toEqual({});
    expect(setup.contextWindowCompression).toEqual({ slidingWindow: {} });
    expect(setup.generationConfig.responseModalities).toEqual(['AUDIO']); // must stay AUDIO-only
  });

  it('can be disabled via option (kill switch)', () => {
    const off = new GeminiLiveManager({ apiKey: 'k', nativeResumption: false });
    const ws = new FakeWs();
    off.sendSetup(ws, 0, '');
    const setup = lastSetup(ws);
    expect(setup.sessionResumption).toBeUndefined();
    expect(setup.contextWindowCompression).toBeUndefined();
  });

  it('stores resumption handles and reuses the latest on the next setup', () => {
    const ws = new FakeWs();
    mgr.activeWs = ws;
    mgr.wireHandlers(ws, false);

    ws.emit('message', JSON.stringify({ sessionResumptionUpdate: { newHandle: 'h1', resumable: true } }));
    ws.emit('message', JSON.stringify({ sessionResumptionUpdate: { newHandle: 'h2', resumable: true } }));
    // non-resumable updates must not clobber the last good handle
    ws.emit('message', JSON.stringify({ sessionResumptionUpdate: { newHandle: 'bad', resumable: false } }));
    expect(mgr.resumptionHandle).toBe('h2');

    const next = new FakeWs();
    mgr.sendSetup(next, 1, 'context');
    expect(lastSetup(next).sessionResumption).toEqual({ handle: 'h2' });
  });

  it('parses protobuf durations in both wire formats', () => {
    expect(mgr._parseDuration('10s')).toBe(10000);
    expect(mgr._parseDuration('2.5s')).toBe(2500);
    expect(mgr._parseDuration({ seconds: 3, nanos: 500000000 })).toBe(3500);
    expect(mgr._parseDuration(undefined)).toBeNull();
    expect(mgr._parseDuration('weird')).toBeNull();
  });

  it('GoAway triggers an early swap once the standby completes setup', () => {
    const active = new FakeWs();
    mgr.activeWs = active;
    mgr.connectionStartTime = Date.now();
    mgr.wireHandlers(active, false);

    const created = [];
    mgr.createConnection = () => { const f = new FakeWs(); created.push(f); return f; };
    const onReconnecting = vi.fn();
    const onReconnected = vi.fn();
    mgr.onReconnecting = onReconnecting;
    mgr.onReconnected = onReconnected;

    active.emit('message', JSON.stringify({ goAway: { timeLeft: '8s' } }));

    expect(onReconnecting).toHaveBeenCalled();
    expect(created).toHaveLength(1);
    const standby = created[0];

    standby.emit('open');
    expect(lastSetup(standby)).toBeTruthy(); // setup sent on open
    standby.emit('message', JSON.stringify({ setupComplete: {} }));

    vi.advanceTimersByTime(150); // poll notices setupComplete
    expect(mgr.activeWs).toBe(standby);
    expect(onReconnected).toHaveBeenCalled(); // old ws closed → swap finished
    expect(active.readyState).toBe(3);
  });

  it('GoAway deadline without setupComplete falls back to forceReconnect — never swaps onto a pre-setup connection', () => {
    const active = new FakeWs();
    mgr.activeWs = active;
    mgr.connectionStartTime = Date.now();
    mgr.wireHandlers(active, false);
    mgr.createConnection = () => new FakeWs();
    mgr.forceReconnect = vi.fn();

    active.emit('message', JSON.stringify({ goAway: { timeLeft: '2s' } }));
    vi.advanceTimersByTime(2000);
    // Standby socket is OPEN but its setup was never acknowledged — swapping
    // would route audio to a pre-setup connection, so we must NOT swap.
    expect(mgr.activeWs).toBe(active);
    expect(mgr.forceReconnect).toHaveBeenCalled();
  });

  it('audio, barge-in, and GoAway keep working on a PROMOTED connection (stale-flag regression)', () => {
    const onAudio = vi.fn();
    const onInterrupted = vi.fn();
    mgr.onAudio = onAudio;
    mgr.onInterrupted = onInterrupted;

    // Wire a socket as STANDBY, then promote it the way performSwap does
    const promoted = new FakeWs();
    mgr.standbyWs = promoted;
    mgr.wireHandlers(promoted, true);
    mgr.activeWs = promoted;
    mgr.standbyWs = null;
    mgr.isSwapping = false;
    mgr.connectionStartTime = Date.now();

    promoted.emit('message', JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { data: 'QUJD' } }] }, interrupted: true } }));
    expect(onAudio).toHaveBeenCalledWith('QUJD'); // was dropped by the old !isStandby gating
    expect(onInterrupted).toHaveBeenCalled();

    mgr.createConnection = () => new FakeWs();
    promoted.emit('message', JSON.stringify({ goAway: { timeLeft: '8s' } }));
    expect(mgr.standbyWs).not.toBeNull(); // GoAway handled on promoted socket
  });

  it('GoAway closes a pre-existing scheduled standby instead of orphaning it', () => {
    const active = new FakeWs();
    mgr.activeWs = active;
    mgr.connectionStartTime = Date.now();
    mgr.wireHandlers(active, false);

    const scheduledStandby = new FakeWs();
    mgr.standbyWs = scheduledStandby;
    mgr.wireHandlers(scheduledStandby, true);
    mgr.createConnection = () => new FakeWs();

    active.emit('message', JSON.stringify({ goAway: { timeLeft: '8s' } }));
    expect(scheduledStandby.readyState).toBe(3); // closed, not leaked
    expect(mgr.standbyWs).not.toBe(scheduledStandby);

    // The orphan's late setupComplete must NOT arm the swap flag
    scheduledStandby.readyState = 1;
    scheduledStandby.emit('message', JSON.stringify({ setupComplete: {} }));
    expect(mgr.standbySetupComplete).toBe(false);
  });

  it('resumption handles are only accepted from the ACTIVE connection', () => {
    const active = new FakeWs();
    const standby = new FakeWs();
    mgr.activeWs = active;
    mgr.standbyWs = standby;
    mgr.wireHandlers(active, false);
    mgr.wireHandlers(standby, true);

    active.emit('message', JSON.stringify({ sessionResumptionUpdate: { newHandle: 'active-h', resumable: true } }));
    standby.emit('message', JSON.stringify({ sessionResumptionUpdate: { newHandle: 'standby-h', resumable: true } }));
    expect(mgr.resumptionHandle).toBe('active-h');
  });

  it('forceReconnect clears the resumption handle on phase change, keeps it same-phase', async () => {
    mgr.resumptionHandle = 'h-old';
    mgr.phase = 1;
    const fresh = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => fresh.emit('open'), 0); return fresh; };

    const p = mgr.forceReconnect(2, 'ctx'); // phase change
    await vi.advanceTimersByTimeAsync(10);
    await p;
    expect(mgr.resumptionHandle).toBeNull();

    mgr.resumptionHandle = 'h-same';
    const fresh2 = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => fresh2.emit('open'), 0); return fresh2; };
    const p2 = mgr.forceReconnect(2, 'ctx'); // same phase (swap-failure fallback)
    await vi.advanceTimersByTimeAsync(10);
    await p2;
    expect(mgr.resumptionHandle).toBe('h-same');
  });

  it('forceReconnect can drop the handle on a SAME-phase reconnect (live context injection)', async () => {
    // add-context reconnects at the same phase but with a changed system prompt.
    // A resumed server-side session may ignore the new systemInstruction, so the
    // caller must be able to force a fresh session — continuity via condensed context.
    mgr.resumptionHandle = 'h-stale';
    mgr.phase = 2;
    const fresh = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => fresh.emit('open'), 0); return fresh; };

    const p = mgr.forceReconnect(2, 'ctx', { dropResumptionHandle: true });
    await vi.advanceTimersByTimeAsync(10);
    await p;

    expect(mgr.resumptionHandle).toBeNull();
    // The setup actually sent must NOT carry the stale handle either
    expect(lastSetup(fresh).sessionResumption).toEqual({});
  });

  it('one-shot context rides exactly one reconnect and never leaks into later setups', async () => {
    mgr.phase = 2;
    const fresh = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => fresh.emit('open'), 0); return fresh; };

    const p = mgr.forceReconnect(2, 'ctx', { oneShotContext: 'ACKNOWLEDGE THE SHARED DOC NOW' });
    await vi.advanceTimersByTimeAsync(10);
    await p;

    // Present in the setup for THIS reconnect…
    expect(lastSetup(fresh).systemInstruction.parts[0].text).toContain('ACKNOWLEDGE THE SHARED DOC NOW');

    // …absent from every later setup (e.g. the scheduled 13:30 standby),
    // so the AI isn't re-told to acknowledge a doc shared 14 minutes ago.
    const later = new FakeWs();
    mgr.sendSetup(later, 2, 'ctx');
    expect(lastSetup(later).systemInstruction.parts[0].text).not.toContain('ACKNOWLEDGE THE SHARED DOC NOW');
  });

  it('one-shot survives a FAILED reconnect and rides the next successful setup exactly once', async () => {
    // If the fresh socket errors before 'open', no setup was sent — the
    // directive must stay pending (not be silently discarded) and then ride
    // the next setup that actually goes out, once.
    mgr.phase = 2;
    const failing = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => failing.emit('error', new Error('boom')), 0); return failing; };

    const p = mgr.forceReconnect(2, 'ctx', { oneShotContext: 'ACK THE DOC' });
    await vi.advanceTimersByTimeAsync(10);
    await p;

    expect(mgr.oneShotContext).toBe('ACK THE DOC'); // still pending — never delivered

    const next = new FakeWs();
    mgr.sendSetup(next, 2, 'ctx');
    expect(lastSetup(next).systemInstruction.parts[0].text).toContain('ACK THE DOC');

    const after = new FakeWs();
    mgr.sendSetup(after, 2, 'ctx');
    expect(lastSetup(after).systemInstruction.parts[0].text).not.toContain('ACK THE DOC');
  });

  it('close() during a GoAway swap does not throw or fire callbacks', () => {
    const active = new FakeWs();
    mgr.activeWs = active;
    mgr.connectionStartTime = Date.now();
    mgr.wireHandlers(active, false);
    mgr.createConnection = () => new FakeWs();

    active.emit('message', JSON.stringify({ goAway: { timeLeft: '5s' } }));
    mgr.close();
    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
  });
});

describe('GeminiLiveManager — forceReconnect serialization', () => {
  let mgr;

  beforeEach(() => {
    vi.useFakeTimers();
    mgr = new GeminiLiveManager({ apiKey: 'test-key' });
  });
  afterEach(() => {
    mgr.close();
    vi.useRealTimers();
  });

  // Each dial returns a fresh FakeWs that emits 'open' a few ms later —
  // long enough for a second forceReconnect to arrive while the first is
  // still in flight, which is exactly the race being tested.
  const trackDials = (created, openAfterMs = 5) => () => {
    const f = new FakeWs();
    created.push(f);
    setTimeout(() => f.emit('open'), openAfterMs);
    return f;
  };

  it('overlapping reconnects are serialized — one surviving connection, one timer set, no double counting', async () => {
    const created = [];
    mgr.createConnection = trackDials(created);
    const initial = new FakeWs();
    mgr.activeWs = initial;
    mgr.connectionStartTime = Date.now();
    mgr.phase = 1;

    // A phase transition and an add-context share fire back-to-back — the
    // second call arrives while the first reconnect is still dialing.
    const p1 = mgr.forceReconnect(2, 'ctx-transition');
    const p2 = mgr.forceReconnect(2, 'ctx-share', { dropResumptionHandle: true, oneShotContext: 'ACK THE DOC' });

    await vi.advanceTimersByTimeAsync(50);
    await Promise.all([p1, p2]);

    expect(created).toHaveLength(2);              // second dial waited for the first to complete
    expect(mgr.activeWs).toBe(created[1]);        // latest request wins
    expect(initial.readyState).toBe(3);           // every predecessor closed —
    expect(created[0].readyState).toBe(3);        // nothing leaked open
    expect(mgr.reconnectionCount).toBe(2);        // +1 per COMPLETED reconnect, no double-increment
    expect(mgr.reconnectTimers).toHaveLength(3);  // exactly one armed prepare/setup/swap set
    expect(mgr.contextSummary).toBe('ctx-share');

    // The one-shot rides the FINAL surviving connection's setup, exactly once
    const carries = (ws) => ws.sent.filter((m) => m.setup?.systemInstruction.parts[0].text.includes('ACK THE DOC'));
    expect(carries(created[0])).toHaveLength(0);
    expect(carries(created[1])).toHaveLength(1);
    expect(mgr.oneShotContext).toBeNull();
  });

  it('three rapid reconnects settle on the last requested phase and context', async () => {
    const created = [];
    mgr.createConnection = trackDials(created);
    mgr.activeWs = new FakeWs();
    mgr.connectionStartTime = Date.now();
    mgr.phase = 0;

    const all = Promise.all([
      mgr.forceReconnect(1, 'a'),
      mgr.forceReconnect(2, 'b'),
      mgr.forceReconnect(3, 'c'),
    ]);
    await vi.advanceTimersByTimeAsync(100);
    await all;

    expect(created).toHaveLength(3);
    expect(mgr.activeWs).toBe(created[2]);
    expect(mgr.phase).toBe(3);
    expect(mgr.contextSummary).toBe('c');
    expect(mgr.reconnectionCount).toBe(3);
    expect(created[0].readyState).toBe(3);
    expect(created[1].readyState).toBe(3);
  });

  it('a reconnect whose socket errors before open does not block later reconnects (queue not poisoned)', async () => {
    mgr.activeWs = new FakeWs();
    mgr.connectionStartTime = Date.now();
    mgr.phase = 1;

    const failing = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => failing.emit('error', new Error('boom')), 0); return failing; };
    const p1 = mgr.forceReconnect(2, 'ctx', { oneShotContext: 'ACK' });
    await vi.advanceTimersByTimeAsync(10);
    await p1;
    expect(mgr.oneShotContext).toBe('ACK'); // never delivered — still pending

    const fresh = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => fresh.emit('open'), 0); return fresh; };
    const p2 = mgr.forceReconnect(2, 'ctx');
    await vi.advanceTimersByTimeAsync(10);
    await p2;

    expect(mgr.activeWs).toBe(fresh); // the queued reconnect ran
    expect(lastSetup(fresh).systemInstruction.parts[0].text).toContain('ACK'); // one-shot rode the next success
  });

  it('a failed dial falls back to the still-open previous connection instead of stranding the session', async () => {
    const oldActive = new FakeWs();
    mgr.activeWs = oldActive;
    mgr.connectionStartTime = Date.now();
    mgr.phase = 1;

    const failing = new FakeWs();
    mgr.createConnection = () => { setTimeout(() => failing.emit('error', new Error('dial refused')), 1); return failing; };

    const p = mgr.forceReconnect(2, 'ctx');
    await vi.advanceTimersByTimeAsync(10);
    await p;

    expect(mgr.activeWs).toBe(oldActive);        // restored — session keeps talking on the old line
    expect(oldActive.readyState).toBe(1);        // old connection untouched
    expect(failing.readyState).toBe(3);          // dead dial closed, not leaked
    expect(mgr.isSwapping).toBe(false);          // future closes reach onClose
    expect(mgr.reconnectTimers).toHaveLength(3); // swap timers re-armed for the old line
  });

  it('a dial that never opens NOR errors times out, releases the queue, and recovers', async () => {
    const oldActive = new FakeWs();
    mgr.activeWs = oldActive;
    mgr.connectionStartTime = Date.now();
    mgr.phase = 1;

    const hung = new FakeWs(); // network black-hole: no open, no error
    const fresh = new FakeWs();
    let dials = 0;
    mgr.createConnection = () => {
      dials++;
      if (dials === 1) return hung;
      setTimeout(() => fresh.emit('open'), 1);
      return fresh;
    };

    const p1 = mgr.forceReconnect(2, 'ctx-hung');
    const p2 = mgr.forceReconnect(3, 'ctx-next'); // queued behind the hung dial

    await vi.advanceTimersByTimeAsync(14000);
    expect(dials).toBe(1);          // still head-of-line blocked
    expect(mgr.activeWs).toBe(hung);

    await vi.advanceTimersByTimeAsync(2000); // 15s dial timeout fires
    await Promise.all([p1, p2]);

    expect(hung.readyState).toBe(3);   // hung socket closed
    expect(dials).toBe(2);             // queue released — second reconnect ran
    expect(mgr.activeWs).toBe(fresh);
    expect(mgr.phase).toBe(3);
    expect(oldActive.readyState).toBe(3); // superseded by the successful reconnect
  });

  it('stress: 10 randomly interleaved reconnects with intermittent failures preserve every invariant', async () => {
    const initial = new FakeWs();
    mgr.activeWs = initial;
    mgr.connectionStartTime = Date.now();
    mgr.phase = 0;

    const created = [];
    let dials = 0;
    mgr.createConnection = () => {
      const f = new FakeWs();
      created.push(f);
      const n = ++dials;
      if (n % 4 === 0) setTimeout(() => f.emit('error', new Error('boom')), n % 7); // every 4th dial fails
      else setTimeout(() => f.emit('open'), n % 7);
      return f;
    };

    const ps = [];
    for (let i = 1; i <= 10; i++) {
      ps.push(mgr.forceReconnect(i % 8, `ctx-${i}`, i % 3 === 0 ? { oneShotContext: `SHOT-${i}` } : {}));
    }
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all(ps);

    expect(created).toHaveLength(10); // serialized: every request dialed exactly once
    // THE invariant: exactly one socket open across everything ever created
    const open = [initial, ...created].filter((w) => w.readyState === 1);
    expect(open).toHaveLength(1);
    expect(open[0]).toBe(mgr.activeWs);
    expect(mgr.phase).toBe(2);                   // last request (10 % 8) won
    expect(mgr.contextSummary).toBe('ctx-10');
    expect(mgr.reconnectTimers).toHaveLength(3); // one armed timer set
    expect(mgr.oneShotContext).toBeNull();       // every one-shot consumed
  });

  it('close() while reconnects are in flight/queued prevents further dials', async () => {
    const created = [];
    mgr.createConnection = trackDials(created);
    mgr.activeWs = new FakeWs();
    mgr.connectionStartTime = Date.now();
    mgr.phase = 1;

    const p1 = mgr.forceReconnect(2, 'a');
    const p2 = mgr.forceReconnect(3, 'b');
    await vi.advanceTimersByTimeAsync(0); // first step dequeues and dials
    expect(created).toHaveLength(1);

    mgr.close();
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([p1, p2]);
    expect(created).toHaveLength(1); // queued step no-oped after close()
  });
});
