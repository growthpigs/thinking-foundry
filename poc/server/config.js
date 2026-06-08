/**
 * Centralized configuration constants.
 *
 * Environment-dependent values live here so they can be tested and
 * audited in one place instead of scattered across the codebase.
 */

// CORS — localhost is only allowed when NODE_ENV is EXPLICITLY 'development'.
// Undefined/production/staging/test all exclude localhost (fail-safe).
const ALLOWED_ORIGINS = [
  'https://frontend-jet-psi-12.vercel.app',
  'https://thinking-foundry-production.up.railway.app',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:3000',
  ] : []),
];

// Condensation thresholds for the outline bullet generation
const CONDENSATION = {
  MIN_AI_TEXT_LENGTH: 30,
  MIN_BULLET_COMBINE_LENGTH: 40,
  MAX_BULLET_LENGTH: 80,
  MIN_USER_TEXT_LENGTH: 10,
  MIN_USER_BULLET_COMBINE: 30,
  SUBSTANTIAL_BUFFER_THRESHOLD: 50,
  MAX_CONTEXT_INJECTION_LENGTH: 10000,
};

// Flush interval for GitHub persistence (ms)
const FLUSH_INTERVAL_MS = 2 * 60 * 1000;

module.exports = {
  ALLOWED_ORIGINS,
  CONDENSATION,
  FLUSH_INTERVAL_MS,
};
