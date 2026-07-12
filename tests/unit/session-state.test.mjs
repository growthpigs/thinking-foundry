import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { SessionState, PHASES } = require('../../poc/server/session-state.js');

describe('SessionState', () => {
  it('starts at phase 0 with history recorded', () => {
    const s = new SessionState();
    expect(s.currentPhase).toBe(0);
    expect(s.phaseHistory).toHaveLength(1);
    expect(s.phaseHistory[0].phase).toBe(0);
  });

  it('setPhase moves to a valid phase and appends history', () => {
    const s = new SessionState();
    const info = s.setPhase(3);
    expect(s.currentPhase).toBe(3);
    expect(info).toMatchObject({ phase: 3, name: 'ASSAY', slug: 'assay' });
    expect(s.phaseHistory).toHaveLength(2);
  });

  it('setPhase rejects out-of-range phases', () => {
    const s = new SessionState();
    expect(() => s.setPhase(-1)).toThrow(/Invalid phase/);
    expect(() => s.setPhase(8)).toThrow(/Invalid phase/);
  });

  it('nextPhase clamps at 7, previousPhase clamps at 0', () => {
    const s = new SessionState();
    expect(s.previousPhase().phase).toBe(0);
    s.setPhase(7);
    expect(s.nextPhase().phase).toBe(7);
    expect(s.phaseHistory.filter((h) => h.phase === 7)).toHaveLength(1);
  });

  it('nextPhase advances linearly through all 8 phases', () => {
    const s = new SessionState();
    for (let i = 1; i <= 7; i++) {
      expect(s.nextPhase().phase).toBe(i);
    }
  });

  it('getAllPhases reports visited and current flags', () => {
    const s = new SessionState();
    s.setPhase(2);
    const all = s.getAllPhases();
    expect(all).toHaveLength(8);
    expect(all[2]).toMatchObject({ isCurrent: true, visited: true });
    expect(all[0]).toMatchObject({ isCurrent: false, visited: true });
    expect(all[5]).toMatchObject({ isCurrent: false, visited: false });
  });

  it('toJSON exposes a serializable snapshot', () => {
    const s = new SessionState();
    const json = s.toJSON();
    expect(json.currentPhase).toBe(0);
    expect(json.phaseInfo.name).toBe(PHASES[0].name);
    expect(typeof json.durationSeconds).toBe('number');
  });
});
