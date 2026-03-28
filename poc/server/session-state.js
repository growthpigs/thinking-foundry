/**
 * Session State Machine
 *
 * Tracks which phase the Thinking Foundry session is in.
 * Phases progress linearly but can be revisited.
 */

const PHASES = {
  0: { name: 'User Stories', slug: 'user-stories', description: 'Capture the raw problem' },
  1: { name: 'MINE', slug: 'mine', description: 'Deep listening, 5 Whys, challenge assumptions' },
  2: { name: 'SCOUT', slug: 'scout', description: 'Generate 7-10 possibilities' },
  3: { name: 'ASSAY', slug: 'assay', description: 'Filter to your constraints' },
  4: { name: 'CRUCIBLE', slug: 'crucible', description: 'Stress-test remaining paths' },
  5: { name: 'AUDITOR', slug: 'auditor', description: 'Quality check, confidence score' },
  6: { name: 'PLAN', slug: 'plan', description: 'Clear specific answers' },
  7: { name: 'VERIFY', slug: 'verify', description: 'Summarize and export' }
};

class SessionState {
  constructor() {
    this.currentPhase = 0;
    this.phaseHistory = [{ phase: 0, enteredAt: new Date().toISOString() }];
    this.sessionStartedAt = new Date().toISOString();
  }

  setPhase(phase) {
    if (phase < 0 || phase > 7) {
      throw new Error(`Invalid phase: ${phase}. Must be 0-7.`);
    }
    this.currentPhase = phase;
    this.phaseHistory.push({ phase, enteredAt: new Date().toISOString() });
    return this.getPhaseInfo();
  }

  nextPhase() {
    if (this.currentPhase >= 7) {
      return this.getPhaseInfo(); // Already at final phase
    }
    return this.setPhase(this.currentPhase + 1);
  }

  previousPhase() {
    if (this.currentPhase <= 0) {
      return this.getPhaseInfo();
    }
    return this.setPhase(this.currentPhase - 1);
  }

  getPhaseInfo(phase) {
    const p = phase !== undefined ? phase : this.currentPhase;
    return { phase: p, ...PHASES[p] };
  }

  getAllPhases() {
    return Object.entries(PHASES).map(([num, info]) => ({
      phase: parseInt(num),
      ...info,
      isCurrent: parseInt(num) === this.currentPhase,
      visited: this.phaseHistory.some(h => h.phase === parseInt(num))
    }));
  }

  getSessionDuration() {
    const start = new Date(this.sessionStartedAt);
    const now = new Date();
    return Math.floor((now - start) / 1000); // seconds
  }

  toJSON() {
    return {
      currentPhase: this.currentPhase,
      phaseInfo: this.getPhaseInfo(),
      phaseHistory: this.phaseHistory,
      sessionStartedAt: this.sessionStartedAt,
      durationSeconds: this.getSessionDuration()
    };
  }
}

module.exports = { SessionState, PHASES };
