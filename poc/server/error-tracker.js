/**
 * Structured Error Tracker
 *
 * Replaces the pattern `.catch(err => console.error(...))` which loses
 * context and makes silent failures invisible in production.
 *
 * Features:
 *   - Categorized counters (visible via /health)
 *   - Last-N errors per category (for debugging)
 *   - Pluggable sink (console by default; can wire to Sentry later)
 *   - Graceful degradation: never throws
 *
 * Usage:
 *   const { track } = require('./error-tracker');
 *   somePromise().catch(track('SUPABASE_WRITE', { sessionId, phase }));
 */

const MAX_RECENT_PER_CATEGORY = 10;

class ErrorTracker {
  constructor() {
    this.counters = new Map();   // category → count
    this.recent = new Map();     // category → [{ timestamp, message, context }, ...]
    this.sinks = [this._consoleSink];
  }

  /**
   * Returns a catch handler bound to a category.
   * Usage: promise.catch(errorTracker.track('CATEGORY', contextObj))
   */
  track(category, context = {}) {
    return (err) => this.record(category, err, context);
  }

  /**
   * Record an error directly (if you already have it in a try/catch).
   */
  record(category, err, context = {}) {
    const count = (this.counters.get(category) || 0) + 1;
    this.counters.set(category, count);

    const entry = {
      timestamp: new Date().toISOString(),
      category,
      message: err?.message || String(err),
      stack: err?.stack?.split('\n').slice(0, 3).join('\n') || null,
      context,
    };

    const recent = this.recent.get(category) || [];
    recent.push(entry);
    if (recent.length > MAX_RECENT_PER_CATEGORY) recent.shift();
    this.recent.set(category, recent);

    for (const sink of this.sinks) {
      try { sink(entry); } catch { /* sinks must never crash */ }
    }
  }

  /**
   * Get counter snapshot (for /health endpoint).
   */
  getCounters() {
    const out = {};
    for (const [category, count] of this.counters) out[category] = count;
    return out;
  }

  /**
   * Get recent errors per category (for debugging).
   */
  getRecent(category) {
    if (category) return this.recent.get(category) || [];
    const out = {};
    for (const [cat, entries] of this.recent) out[cat] = entries;
    return out;
  }

  /**
   * Reset counters and recent errors (useful in tests).
   */
  reset() {
    this.counters.clear();
    this.recent.clear();
  }

  /**
   * Add a sink (e.g., Sentry reporter). Called with the structured entry.
   */
  addSink(fn) {
    this.sinks.push(fn);
  }

  _consoleSink(entry) {
    const contextStr = Object.keys(entry.context).length
      ? ' ' + JSON.stringify(entry.context)
      : '';
    console.error(`[${entry.category}] ${entry.message}${contextStr}`);
  }
}

// Singleton instance — same tracker used everywhere
const errorTracker = new ErrorTracker();

module.exports = { errorTracker, ErrorTracker };
