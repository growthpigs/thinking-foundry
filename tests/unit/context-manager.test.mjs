import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ContextManager } = require('../../poc/server/context-manager.js');

describe('ContextManager', () => {
  it('records utterances in full transcript and rolling window', () => {
    const cm = new ContextManager();
    cm.addUtterance('user', 'I want to quit my job and start a company.');
    cm.addUtterance('assistant', 'What makes you sure the job is the problem?');
    expect(cm.fullTranscript).toHaveLength(2);
    expect(cm.recentExchanges).toHaveLength(2);
  });

  it('trims the rolling window to 10 and extracts key points from evicted entries', () => {
    const cm = new ContextManager();
    for (let i = 0; i < 12; i++) {
      cm.addUtterance('assistant', `Question number ${i}: what would happen if you waited a year?`);
    }
    expect(cm.recentExchanges).toHaveLength(10);
    expect(cm.fullTranscript).toHaveLength(12);
    // Two evicted assistant questions become key points
    expect(cm.keyPoints).toHaveLength(2);
    expect(cm.keyPoints[0].text).toContain('Question number 0');
  });

  it('ignores short evicted utterances when extracting key points', () => {
    const cm = new ContextManager();
    cm.extractKeyPoint({ role: 'assistant', text: 'Okay.', timestamp: 't' });
    cm.extractKeyPoint({ role: 'user', text: 'Yes.', timestamp: 't' });
    expect(cm.keyPoints).toHaveLength(0);
  });

  it('caps key points at 20 and trims to the most recent 15', () => {
    const cm = new ContextManager();
    for (let i = 0; i < 21; i++) {
      cm.extractKeyPoint({ role: 'user', text: `A sufficiently long user statement number ${i}.`, timestamp: 't' });
    }
    expect(cm.keyPoints).toHaveLength(15);
    expect(cm.keyPoints[14].text).toContain('number 20');
  });

  it('getCondensedContext includes phase outputs, key points, and recent turns', () => {
    const cm = new ContextManager();
    cm.setPhaseOutput(1, 'Root cause: fear of irrelevance, not the salary.');
    cm.addUtterance('user', 'I keep coming back to the same doubt about timing and money.');
    cm.addUtterance('assistant', 'What if the timing question is actually a courage question?');
    cm.extractKeyPoint({ role: 'user', text: 'The real issue is I have 8 months of runway.', timestamp: 't' });

    const ctx = cm.getCondensedContext();
    expect(ctx).toContain('PHASE RESULTS SO FAR:');
    expect(ctx).toContain('Root cause: fear of irrelevance');
    expect(ctx).toContain('KEY POINTS FROM CONVERSATION:');
    expect(ctx).toContain('RECENT CONVERSATION:');
    expect(ctx).toContain('You: What if the timing question');
  });

  it('getCondensedContext is empty for a fresh session', () => {
    const cm = new ContextManager();
    expect(cm.getCondensedContext()).toBe('');
  });

  it('getFullTranscript formats speakers as User/Foundry', () => {
    const cm = new ContextManager();
    cm.addUtterance('user', 'Hello.');
    cm.addUtterance('assistant', 'What decision brought you here?');
    const t = cm.getFullTranscript();
    expect(t).toContain('**User**');
    expect(t).toContain('**Foundry**');
  });
});
