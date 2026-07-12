import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { SESSION_CONTROL_DECLARATIONS, SESSION_CONTROL_TOOL_NAMES } = require('../../poc/server/session-tools.js');
const { PhaseTransitionHandler } = require('../../poc/server/phase-transition.js');
const { GeminiLiveManager } = require('../../poc/server/gemini-live.js');

describe('session control tool declarations', () => {
  it('declares advance_phase and set_intent_mode with required params', () => {
    const byName = Object.fromEntries(SESSION_CONTROL_DECLARATIONS.map((d) => [d.name, d]));
    expect(byName.advance_phase.parameters.required).toEqual(['to_phase', 'confidence', 'carry_forward']);
    expect(byName.set_intent_mode.parameters.required).toEqual(['mode']);
    expect(SESSION_CONTROL_TOOL_NAMES.has('advance_phase')).toBe(true);
    expect(SESSION_CONTROL_TOOL_NAMES.has('fetch_framework')).toBe(false);
  });
});

describe('PhaseTransitionHandler.toolTransition (advance_phase)', () => {
  let handler, onTransition;

  beforeEach(() => {
    vi.useFakeTimers();
    onTransition = vi.fn();
    handler = new PhaseTransitionHandler({ onTransition });
  });
  afterEach(() => vi.useRealTimers());

  it('accepts a valid transition and passes the AI-written carry-forward', () => {
    const result = handler.toolTransition(1, {
      to_phase: 2, confidence: 8,
      carry_forward: 'Root cause: fear of irrelevance. Constraint: 8 months runway.',
      reason: 'Root cause identified and confirmed by user.',
    });
    expect(result.ok).toBe(true);
    expect(onTransition).toHaveBeenCalledWith(1, 2, expect.objectContaining({
      confidence: 8,
      carryForward: 'Root cause: fear of irrelevance. Constraint: 8 months runway.',
      source: 'tool',
    }));
  });

  it('blocks forward transitions below the confidence threshold — feedback the AI hears', () => {
    const result = handler.toolTransition(1, { to_phase: 2, confidence: 4, carry_forward: 'x' });
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.message).toMatch(/confidence 4 is below the required 6/);
    expect(onTransition).not.toHaveBeenCalled();
  });

  it('allows going BACK to a phase regardless of confidence (revisiting is not gated)', () => {
    const result = handler.toolTransition(4, { to_phase: 1, confidence: 2, carry_forward: 'need to re-mine' });
    expect(result.ok).toBe(true);
  });

  it('commit mode raises the gate to 8', () => {
    handler.toolSetMode('commit');
    expect(handler.toolTransition(0, { to_phase: 1, confidence: 7, carry_forward: 'x' }).blocked).toBe(true);
    expect(handler.toolTransition(0, { to_phase: 1, confidence: 8, carry_forward: 'x' }).ok).toBe(true);
  });

  it('rejects missing/invalid confidence and invalid phases with instructive messages', () => {
    expect(handler.toolTransition(0, { to_phase: 1, carry_forward: 'x' }).message).toMatch(/confidence.*required/);
    expect(handler.toolTransition(0, { to_phase: 9, confidence: 9, carry_forward: 'x' }).ok).toBe(false);
    expect(handler.toolTransition(2, { to_phase: 2, confidence: 9, carry_forward: 'x' }).message).toMatch(/Already in phase 2/);
    expect(onTransition).not.toHaveBeenCalled();
  });

  it('debounces rapid successive transitions', () => {
    expect(handler.toolTransition(0, { to_phase: 1, confidence: 9, carry_forward: 'a' }).ok).toBe(true);
    expect(handler.toolTransition(1, { to_phase: 2, confidence: 9, carry_forward: 'b' }).blocked).toBe(true);
    vi.advanceTimersByTime(6000);
    expect(handler.toolTransition(1, { to_phase: 2, confidence: 9, carry_forward: 'b' }).ok).toBe(true);
  });
});

describe('PhaseTransitionHandler.toolSetMode (set_intent_mode)', () => {
  it('sets mode + threshold and notifies', () => {
    const onModeDetected = vi.fn();
    const handler = new PhaseTransitionHandler({ onModeDetected });
    expect(handler.toolSetMode('Explore').ok).toBe(true);
    expect(handler.intentMode).toBe('explore');
    expect(handler.minConfidence).toBe(5);
    expect(onModeDetected).toHaveBeenCalledWith('explore', 5);
    expect(handler.toolSetMode('yolo').ok).toBe(false);
  });
});

describe('GeminiLiveManager control-tool routing', () => {
  class FakeWs extends EventEmitter {
    constructor() { super(); this.readyState = 1; this.sent = []; }
    send(m) { this.sent.push(JSON.parse(m)); }
    close() { this.readyState = 3; this.emit('close', 1000, ''); }
  }

  it('routes control tools to onControlCall and replies with its message', async () => {
    const onControlCall = vi.fn().mockReturnValue({ ok: true, message: 'Transition to phase 2 accepted.' });
    const mgr = new GeminiLiveManager({
      apiKey: 'k',
      onControlCall,
      controlToolNames: SESSION_CONTROL_TOOL_NAMES,
    });
    const ws = new FakeWs();
    mgr.activeWs = ws;
    mgr.wireHandlers(ws, false);

    ws.emit('message', JSON.stringify({
      toolCall: { functionCalls: [{ id: 'c1', name: 'advance_phase', args: { to_phase: 2, confidence: 9, carry_forward: 'done' } }] }
    }));
    await vi.waitFor(() => expect(ws.sent.length).toBeGreaterThan(0));

    expect(onControlCall).toHaveBeenCalledWith({ name: 'advance_phase', args: { to_phase: 2, confidence: 9, carry_forward: 'done' } });
    const resp = ws.sent[0].toolResponse.functionResponses[0];
    expect(resp).toMatchObject({ id: 'c1', name: 'advance_phase', response: { result: 'Transition to phase 2 accepted.' } });
    mgr.close();
  });

  it('does not send control tools to the framework fetcher', async () => {
    const frameworkFetcher = { handleFunctionCall: vi.fn() };
    const mgr = new GeminiLiveManager({
      apiKey: 'k',
      frameworkFetcher,
      onControlCall: vi.fn().mockReturnValue({ message: 'ok' }),
      controlToolNames: SESSION_CONTROL_TOOL_NAMES,
    });
    const ws = new FakeWs();
    mgr.activeWs = ws;
    mgr.wireHandlers(ws, false);

    ws.emit('message', JSON.stringify({
      toolCall: { functionCalls: [
        { id: '1', name: 'set_intent_mode', args: { mode: 'commit' } },
        { id: '2', name: 'fetch_framework', args: { framework: 'yc' } },
      ] }
    }));
    await vi.waitFor(() => expect(mgr.onControlCall).toHaveBeenCalledTimes(1));

    expect(frameworkFetcher.handleFunctionCall).toHaveBeenCalledTimes(1);
    expect(frameworkFetcher.handleFunctionCall).toHaveBeenCalledWith({ name: 'fetch_framework', args: { framework: 'yc' } });
    mgr.close();
  });
});
