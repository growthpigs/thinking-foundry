/**
 * ResearchBudget — the spend ceiling for background research (#192 slice 0).
 *
 * Built BEFORE the agents that spend, not after. A free lead magnet with
 * background agents firing on every entity mention is an unbounded cost
 * surface, and until now the poc had no cap anywhere: no per-session budget,
 * no daily kill switch, no counter. A session is ~$1.40 with one model; nobody
 * has measured it with N agent calls per session, and "we'll add limits later"
 * is how a $32k cloud bill happens.
 *
 * Two independent ceilings, both fail-closed:
 *   1. per-session  — one runaway conversation cannot bankrupt the day
 *   2. per-day      — many cheap sessions cannot either
 *
 * Degradation is SILENT to the user. When the budget is gone the session keeps
 * running with no research, because a thinking session that continues without
 * a lookup is fine and one that dies mid-sentence is not.
 *
 * This module does not know what a research call *is*. It only answers
 * "may I spend?" and "here is what I spent". Keeping it ignorant of the caller
 * is what makes it testable without a network.
 */

// gemini-3.7-flash introductory pricing, USD per 1M tokens, as published
// 2026-08-13. Introductory rates expire 2026-12-31, after which input rises to
// 1.50 and output to 7.50 — update these two constants then, or the cap silently
// permits ~2x the intended spend.
const USD_PER_1M_INPUT = 0.75;
const USD_PER_1M_OUTPUT = 3.75;

const DEFAULT_SESSION_USD = 0.50;
const DEFAULT_DAILY_USD = 20.00;

const num = (raw, fallback) => {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Cost in USD of a call with the given token counts. */
function estimateUsd(inputTokens = 0, outputTokens = 0) {
  return (inputTokens / 1e6) * USD_PER_1M_INPUT
       + (outputTokens / 1e6) * USD_PER_1M_OUTPUT;
}

/**
 * Day-scoped spend, shared across every session in the process.
 * Deliberately in-memory: a process restart resets it, which is the safe
 * direction to be wrong in for a poc. Persist it when this leaves the poc.
 */
class DailyLedger {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.day = null;
    this.spentUsd = 0;
  }

  _roll() {
    const today = new Date(this.now()).toISOString().slice(0, 10);
    if (this.day !== today) {
      this.day = today;
      this.spentUsd = 0;
    }
  }

  spent() { this._roll(); return this.spentUsd; }
  record(usd) { this._roll(); this.spentUsd += usd; }
}

const sharedDaily = new DailyLedger();

class ResearchBudget {
  /**
   * @param {object} opts
   * @param {number} [opts.sessionUsd]  per-session ceiling
   * @param {number} [opts.dailyUsd]    per-day ceiling, process-wide
   * @param {boolean} [opts.enabled]    master switch; false blocks everything
   * @param {DailyLedger} [opts.daily]  injectable for tests
   * @param {object} [opts.env]         injectable for tests
   */
  constructor(opts = {}) {
    const env = opts.env || process.env;

    // Background research is OFF unless explicitly enabled. An operator who has
    // not thought about cost gets no spend — the same default the war-room cost
    // doctrine settled on after a five-figure surprise.
    this.enabled = opts.enabled !== undefined
      ? opts.enabled
      : env.RESEARCH_ENABLED === 'true';

    this.sessionUsd = opts.sessionUsd !== undefined
      ? opts.sessionUsd
      : num(env.RESEARCH_SESSION_BUDGET_USD, DEFAULT_SESSION_USD);

    this.dailyUsd = opts.dailyUsd !== undefined
      ? opts.dailyUsd
      : num(env.RESEARCH_DAILY_BUDGET_USD, DEFAULT_DAILY_USD);

    this.daily = opts.daily || sharedDaily;

    this.spentUsd = 0;
    this.calls = 0;
    this.blocked = 0;
  }

  /**
   * May a call costing roughly `estUsd` proceed?
   * Returns { ok, reason } — reason is for logging, never shown to the user.
   */
  check(estUsd = 0) {
    if (!this.enabled) {
      return { ok: false, reason: 'research-disabled' };
    }
    // Two conditions, and the first is not redundant. `spent + est > cap` alone
    // lets a call through whenever the estimate is 0 — including at cap 0, which
    // must mean "no research at all". An estimate is a guess; once we are at or
    // past the ceiling, nothing more runs regardless of what it claims to cost.
    if (this.spentUsd >= this.sessionUsd || this.spentUsd + estUsd > this.sessionUsd) {
      return { ok: false, reason: 'session-budget-exhausted' };
    }
    if (this.daily.spent() >= this.dailyUsd || this.daily.spent() + estUsd > this.dailyUsd) {
      return { ok: false, reason: 'daily-budget-exhausted' };
    }
    return { ok: true, reason: 'ok' };
  }

  /**
   * Run `fn` only if the budget allows it, then record what it actually cost.
   *
   * The estimate gates, the actual is charged — an estimate that undershoots
   * still lands on the ledger, so a run of cheap-looking-but-expensive calls
   * converges on the ceiling instead of walking straight past it.
   *
   * Returns null when blocked. Callers treat null as "no research this time"
   * and carry on; it is never an error path.
   */
  async run(fn, { estInputTokens = 0, estOutputTokens = 0 } = {}) {
    const estUsd = estimateUsd(estInputTokens, estOutputTokens);
    const verdict = this.check(estUsd);

    if (!verdict.ok) {
      this.blocked += 1;
      console.log(`[BUDGET] research call blocked: ${verdict.reason} (session $${this.spentUsd.toFixed(4)}/$${this.sessionUsd}, day $${this.daily.spent().toFixed(4)}/$${this.dailyUsd})`);
      return null;
    }

    try {
      const result = await fn();
      const usage = (result && result.usage) || {};
      const actualUsd = estimateUsd(
        usage.inputTokens ?? estInputTokens,
        usage.outputTokens ?? estOutputTokens
      );
      this.record(actualUsd);
      return result;
    } catch (err) {
      // A failed call still consumed tokens upstream more often than not.
      // Charging the estimate stops a crash-looping agent from spending
      // forever behind a cap that only counts successes.
      this.record(estUsd);
      throw err;
    }
  }

  record(usd) {
    this.spentUsd += usd;
    this.daily.record(usd);
    this.calls += 1;
  }

  /** Spend summary for the session log — the number nobody has measured yet. */
  summary() {
    return {
      enabled: this.enabled,
      calls: this.calls,
      blocked: this.blocked,
      sessionUsd: Number(this.spentUsd.toFixed(4)),
      sessionCapUsd: this.sessionUsd,
      dailyUsd: Number(this.daily.spent().toFixed(4)),
      dailyCapUsd: this.dailyUsd,
    };
  }
}

module.exports = { ResearchBudget, DailyLedger, estimateUsd, sharedDaily };
