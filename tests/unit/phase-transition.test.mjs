import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PhaseTransitionHandler, PHASE_NAME_TO_NUMBER } = require('../../poc/server/phase-transition.js');

describe('PhaseTransitionHandler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const makeHandler = (opts = {}) => {
    const onTransition = vi.fn();
    const handler = new PhaseTransitionHandler({ onTransition, ...opts });
    return { handler, onTransition };
  };

  it('detects "moving to phase N" and fires the callback', () => {
    const { handler, onTransition } = makeHandler();
    const result = handler.processAiUtterance("Great. Let's move to phase 2.", 1);
    expect(result).toMatchObject({ transition: true, fromPhase: 1, toPhase: 2 });
    expect(onTransition).toHaveBeenCalledWith(1, 2, expect.any(Object));
  });

  it('detects phase transitions by name', () => {
    const { handler } = makeHandler();
    const result = handler.processAiUtterance("Time for the Crucible.", 3);
    expect(result).toMatchObject({ transition: true, toPhase: PHASE_NAME_TO_NUMBER.crucible });
  });

  it('"I have what I need for phase N" advances to N+1', () => {
    const { handler } = makeHandler();
    const result = handler.processAiUtterance('I have what I need for phase 0.', 0);
    expect(result).toMatchObject({ transition: true, fromPhase: 0, toPhase: 1 });
  });

  it('generic completion signal advances to the next phase', () => {
    const { handler } = makeHandler();
    const result = handler.processAiUtterance("That's enough for this phase.", 4);
    expect(result).toMatchObject({ transition: true, toPhase: 5 });
  });

  it('returns null for ordinary conversation', () => {
    const { handler } = makeHandler();
    expect(handler.processAiUtterance('Why do you think that is?', 1)).toBeNull();
    expect(handler.processAiUtterance('Tell me more about your timeline.', 1)).toBeNull();
  });

  it('does not fire a transition to the current phase', () => {
    const { handler, onTransition } = makeHandler();
    expect(handler.processAiUtterance("Let's move to phase 2.", 2)).toBeNull();
    expect(onTransition).not.toHaveBeenCalled();
  });

  it('debounces transitions within 5 seconds', () => {
    const { handler, onTransition } = makeHandler();
    handler.processAiUtterance("Moving to phase 1.", 0);
    expect(handler.processAiUtterance("Moving to phase 2.", 1)).toBeNull();
    vi.advanceTimersByTime(6000);
    expect(handler.processAiUtterance("Moving to phase 2.", 1)).toMatchObject({ toPhase: 2 });
    expect(onTransition).toHaveBeenCalledTimes(2);
  });

  it('extracts confidence stated before the transition (The Squeeze)', () => {
    const { handler } = makeHandler();
    handler.processAiUtterance('My confidence: 8/10 on this direction.', 1);
    const result = handler.processAiUtterance("Let's move to phase 2.", 1);
    expect(result.confidence).toBe(8);
  });

  it('detects intent mode and adjusts the confidence threshold', () => {
    const onModeDetected = vi.fn();
    const { handler } = makeHandler({ onModeDetected });
    handler.processAiUtterance('Understood. [MODE:commit] This is a commitment decision.', 0);
    expect(handler.intentMode).toBe('commit');
    expect(handler.minConfidence).toBe(8);
    expect(onModeDetected).toHaveBeenCalledWith('commit', 8);
  });

  it('manualTransition validates target phase and debounces', () => {
    const { handler, onTransition } = makeHandler();
    expect(handler.manualTransition(0, 9)).toMatchObject({ transition: false, blocked: true });
    expect(handler.manualTransition(0, 1)).toMatchObject({ transition: true, toPhase: 1 });
    expect(handler.manualTransition(1, 2)).toMatchObject({ transition: false, blocked: true });
    expect(onTransition).toHaveBeenCalledTimes(1);
    expect(onTransition).toHaveBeenCalledWith(0, 1, expect.objectContaining({ manual: true }));
  });

  it('buffers utterances so split transition signals still match', () => {
    const { handler } = makeHandler();
    handler.processAiUtterance("Good. Let's move", 1);
    const result = handler.processAiUtterance('to phase 2 now.', 1);
    expect(result).toMatchObject({ transition: true, toPhase: 2 });
  });
});
