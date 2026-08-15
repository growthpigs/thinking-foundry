import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// #198. The first fix for the transcript-doubling bug went into
// poc/public/app.js — which the live session UI never loads. session.html is
// self-contained and carries its own microphone code, so the fix shipped, was
// merged, deployed, and did nothing.
//
// These assert against the file the server actually SERVES for a session.
// "Which file is live" is the question that has bitten twice tonight
// (style.css, then app.js), so it gets a test rather than a memory.
const PUBLIC = path.join(__dirname, '..', '..', 'poc', 'public');
const session = fs.readFileSync(path.join(PUBLIC, 'session.html'), 'utf-8');

describe('session.html is the live client and guards its mic (#198)', () => {
  it('loads no external scripts — so it is genuinely self-contained', () => {
    const external = session.match(/<script[^>]+src=/gi) || [];
    expect(
      external,
      `session.html loads ${external.length} external script(s); if that changes, ` +
      'the "which file is live" assumption in these tests needs revisiting'
    ).toHaveLength(0);
  });

  it('owns its microphone code (not delegated to app.js)', () => {
    expect(session).toMatch(/navigator\.mediaDevices\.getUserMedia/);
    expect(session).toMatch(/createScriptProcessor/);
  });

  // The actual regression: startMic must not stack a second processor.
  it('startMic tears down existing capture before restarting', () => {
    const start = session.slice(session.indexOf('function startMic()'));
    const body = start.slice(0, start.indexOf('navigator.mediaDevices'));
    expect(body, 'startMic() has no idempotency guard — reconnect will double the audio')
      .toMatch(/if \(processor \|\| micCtx \|\| micStream\)/);
    expect(body).toMatch(/stopMic\(\)/);
  });

  it('stopMic releases the processor and context, not just the tracks', () => {
    const stop = session.slice(session.indexOf('function stopMic()'));
    const body = stop.slice(0, stop.indexOf('function startMic()'));
    expect(body).toMatch(/processor\.disconnect\(\)/);
    expect(body).toMatch(/micCtx\.close\(\)/);
    expect(body).toMatch(/getTracks\(\)/);
  });

  // The trigger: the server re-emits status:connected on every reconnect, and
  // the client calls startMic on it. That pairing is the bug's mechanism, so
  // pin it — if either side moves, this should fail loudly.
  it('still calls startMic on status:connected (the reconnect path)', () => {
    expect(session).toMatch(/state === 'connected'[\s\S]{0,200}startMic\(\)/);
  });

  // Streaming display must replace, never append — a doubled transcript is the
  // very bug above wearing a different hat.
  it('the finished AI bullet replaces the provisional streaming line', () => {
    const add = session.slice(session.indexOf('function addBullet('));
    expect(add.slice(0, 300)).toMatch(/clearStreamingBullet\(\)/);
  });
});
