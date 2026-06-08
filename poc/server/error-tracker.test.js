const test = require('node:test');
const assert = require('node:assert/strict');
const { ErrorTracker } = require('./error-tracker');

test('track() returns a function that records errors', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = []; // silence console
  const handler = tracker.track('TEST_CATEGORY', { foo: 'bar' });
  handler(new Error('boom'));
  assert.equal(tracker.counters.get('TEST_CATEGORY'), 1);
});

test('record() accumulates count per category', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [];
  tracker.record('CAT_A', new Error('a1'));
  tracker.record('CAT_A', new Error('a2'));
  tracker.record('CAT_B', new Error('b1'));
  assert.equal(tracker.counters.get('CAT_A'), 2);
  assert.equal(tracker.counters.get('CAT_B'), 1);
});

test('recent errors are capped at MAX per category', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [];
  for (let i = 0; i < 20; i++) {
    tracker.record('CAT', new Error('err ' + i));
  }
  const recent = tracker.getRecent('CAT');
  assert.equal(recent.length, 10); // MAX_RECENT_PER_CATEGORY
  assert.match(recent[recent.length - 1].message, /err 19/);
});

test('getCounters returns snapshot object', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [];
  tracker.record('X', new Error('e'));
  tracker.record('Y', new Error('e'));
  tracker.record('Y', new Error('e'));
  const counters = tracker.getCounters();
  assert.deepEqual(counters, { X: 1, Y: 2 });
});

test('reset clears counters and recent', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [];
  tracker.record('X', new Error('e'));
  tracker.reset();
  assert.equal(tracker.counters.size, 0);
  assert.equal(tracker.recent.size, 0);
});

test('sinks are called with structured entries', () => {
  const tracker = new ErrorTracker();
  const captured = [];
  tracker.sinks = [(entry) => captured.push(entry)];
  tracker.record('TEST', new Error('hello'), { sessionId: 'abc' });
  assert.equal(captured.length, 1);
  assert.equal(captured[0].category, 'TEST');
  assert.equal(captured[0].message, 'hello');
  assert.equal(captured[0].context.sessionId, 'abc');
  assert.ok(captured[0].timestamp);
});

test('crashing sink does not break tracker', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [
    () => { throw new Error('sink crashed'); },
    // If this second sink is called, the crash was isolated
  ];
  let secondCalled = false;
  tracker.addSink(() => { secondCalled = true; });
  tracker.record('X', new Error('e'));
  assert.equal(secondCalled, true);
});

test('handles non-Error values (strings, undefined)', () => {
  const tracker = new ErrorTracker();
  tracker.sinks = [];
  tracker.record('X', 'a string error');
  tracker.record('X', undefined);
  tracker.record('X', { message: 'obj' });
  assert.equal(tracker.counters.get('X'), 3);
});
