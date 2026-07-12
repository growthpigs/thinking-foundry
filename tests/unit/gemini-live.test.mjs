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

  it('GoAway swaps at the deadline even if setupComplete never arrives', () => {
    const active = new FakeWs();
    mgr.activeWs = active;
    mgr.connectionStartTime = Date.now();
    mgr.wireHandlers(active, false);
    mgr.createConnection = () => new FakeWs();
    mgr.forceReconnect = vi.fn(); // performSwap falls back here if standby isn't OPEN

    active.emit('message', JSON.stringify({ goAway: { timeLeft: '2s' } }));
    vi.advanceTimersByTime(2000);
    // Standby was created and is OPEN (FakeWs default), so a real swap happens
    expect(mgr.activeWs).not.toBe(active);
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
