import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ResearchBudget, DailyLedger, estimateUsd } = require('../../poc/server/research-budget.js');

// A fresh ledger per test — the module-level `sharedDaily` is process-wide by
// design, and letting tests share it makes them order-dependent.
const budget = (opts = {}) => new ResearchBudget({
  enabled: true,
  daily: new DailyLedger(),
  env: {},
  ...opts,
});

describe('ResearchBudget — the cap actually stops calls', () => {
  // The point of slice 0. A constant named SESSION_BUDGET that nothing consults
  // is not a cost control, and that is the failure mode worth a test.
  it('stops invoking fn once the session budget is spent', async () => {
    const fn = vi.fn(async () => ({ usage: { inputTokens: 200_000, outputTokens: 100_000 } }));
    const b = budget({ sessionUsd: 1.0 });

    // 200k in + 100k out = 0.15 + 0.375 = $0.525 per call
    expect(await b.run(fn, { estInputTokens: 200_000, estOutputTokens: 100_000 })).not.toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call would reach $1.05 > $1.00 — blocked BEFORE fn runs.
    expect(await b.run(fn, { estInputTokens: 200_000, estOutputTokens: 100_000 })).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1); // not 2 — the money was never spent
    expect(b.blocked).toBe(1);
  });

  it('stops on the daily ceiling even when the session has room', async () => {
    const daily = new DailyLedger();
    const fn = vi.fn(async () => ({ usage: { inputTokens: 1_000_000, outputTokens: 0 } }));

    const first = budget({ daily, sessionUsd: 100, dailyUsd: 1.0 });
    await first.run(fn, { estInputTokens: 1_000_000 });  // $0.75

    // A brand-new session with its own generous session cap still cannot spend:
    // many cheap sessions must not add up past the day's ceiling.
    const second = budget({ daily, sessionUsd: 100, dailyUsd: 1.0 });
    expect(await second.run(fn, { estInputTokens: 1_000_000 })).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('is off unless explicitly enabled', async () => {
    const fn = vi.fn(async () => ({}));
    const off = new ResearchBudget({ daily: new DailyLedger(), env: {} });
    expect(off.enabled).toBe(false);
    expect(await off.run(fn)).toBeNull();
    expect(fn).not.toHaveBeenCalled();

    const on = new ResearchBudget({ daily: new DailyLedger(), env: { RESEARCH_ENABLED: 'true' } });
    expect(on.enabled).toBe(true);
  });

  it('charges what the call ACTUALLY cost, not what we guessed', async () => {
    // An estimate that undershoots must not let spend walk past the ceiling.
    const b = budget({ sessionUsd: 10 });
    await b.run(async () => ({ usage: { inputTokens: 1_000_000, outputTokens: 1_000_000 } }),
      { estInputTokens: 10, estOutputTokens: 10 });

    expect(b.summary().sessionUsd).toBeCloseTo(0.75 + 3.75, 4); // real cost, not ~$0
  });

  it('charges a failed call too', async () => {
    // A crash-looping agent burns upstream tokens on every attempt. A cap that
    // only counts successes would let it spend without limit.
    const b = budget({ sessionUsd: 10 });
    await expect(
      b.run(async () => { throw new Error('vendor 500'); }, { estInputTokens: 1_000_000 })
    ).rejects.toThrow('vendor 500');

    expect(b.summary().sessionUsd).toBeCloseTo(0.75, 4);
  });

  it('degrades silently — a blocked call is null, never a throw', async () => {
    const b = budget({ sessionUsd: 0 });
    await expect(b.run(async () => ({}))).resolves.toBeNull();
  });

  // Regression: `spent + est > cap` alone let a zero-estimate call through at
  // cap 0, so a budget of nothing still permitted research. Found by the test
  // above on first run.
  it('a zero cap blocks even a call estimated at zero', async () => {
    const fn = vi.fn(async () => ({}));
    const b = budget({ sessionUsd: 0 });
    expect(await b.run(fn, { estInputTokens: 0, estOutputTokens: 0 })).toBeNull();
    expect(fn).not.toHaveBeenCalled();
    expect(b.check(0)).toEqual({ ok: false, reason: 'session-budget-exhausted' });
  });

  it('a zero DAILY cap blocks even a call estimated at zero', async () => {
    const fn = vi.fn(async () => ({}));
    const b = budget({ sessionUsd: 100, dailyUsd: 0 });
    expect(await b.run(fn)).toBeNull();
    expect(fn).not.toHaveBeenCalled();
    expect(b.check(0).reason).toBe('daily-budget-exhausted');
  });

  it('rolls the daily ledger over at midnight UTC', () => {
    let now = Date.parse('2026-08-15T23:59:00Z');
    const daily = new DailyLedger(() => now);
    daily.record(19.99);
    expect(daily.spent()).toBeCloseTo(19.99, 4);

    now = Date.parse('2026-08-16T00:01:00Z');
    expect(daily.spent()).toBe(0);
  });

  it('falls back to defaults on unparseable or negative env values', () => {
    const b = new ResearchBudget({
      daily: new DailyLedger(),
      env: { RESEARCH_ENABLED: 'true', RESEARCH_SESSION_BUDGET_USD: 'lots', RESEARCH_DAILY_BUDGET_USD: '-5' },
    });
    expect(b.sessionUsd).toBe(0.50);
    expect(b.dailyUsd).toBe(20.00);
  });

  it('prices against the published 3.7 Flash rates', () => {
    expect(estimateUsd(1_000_000, 0)).toBeCloseTo(0.75, 6);
    expect(estimateUsd(0, 1_000_000)).toBeCloseTo(3.75, 6);
  });

  it('reports a spend summary so the real per-session cost can be measured', async () => {
    const b = budget({ sessionUsd: 10, dailyUsd: 50 });
    await b.run(async () => ({ usage: { inputTokens: 100_000, outputTokens: 20_000 } }));
    const s = b.summary();
    expect(s).toMatchObject({ enabled: true, calls: 1, blocked: 0, sessionCapUsd: 10, dailyCapUsd: 50 });
    expect(s.sessionUsd).toBeGreaterThan(0);
  });
});
