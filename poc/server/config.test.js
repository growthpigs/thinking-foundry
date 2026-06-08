const test = require('node:test');
const assert = require('node:assert/strict');

// Reload the module fresh per test (to pick up NODE_ENV changes)
function loadConfig(nodeEnv) {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  delete require.cache[require.resolve('./config')];
  const cfg = require('./config');
  process.env.NODE_ENV = original;
  return cfg;
}

test('ALLOWED_ORIGINS excludes localhost when NODE_ENV=production', () => {
  const { ALLOWED_ORIGINS } = loadConfig('production');
  assert.ok(!ALLOWED_ORIGINS.some(o => o.includes('localhost')));
});

test('ALLOWED_ORIGINS excludes localhost when NODE_ENV=undefined', () => {
  const { ALLOWED_ORIGINS } = loadConfig(undefined);
  assert.ok(!ALLOWED_ORIGINS.some(o => o.includes('localhost')));
});

test('ALLOWED_ORIGINS excludes localhost when NODE_ENV=staging', () => {
  const { ALLOWED_ORIGINS } = loadConfig('staging');
  assert.ok(!ALLOWED_ORIGINS.some(o => o.includes('localhost')));
});

test('ALLOWED_ORIGINS includes localhost when NODE_ENV=development', () => {
  const { ALLOWED_ORIGINS } = loadConfig('development');
  const localhosts = ALLOWED_ORIGINS.filter(o => o.includes('localhost'));
  assert.equal(localhosts.length, 2);
});

test('ALLOWED_ORIGINS always includes production vercel + railway', () => {
  const { ALLOWED_ORIGINS } = loadConfig('production');
  assert.ok(ALLOWED_ORIGINS.includes('https://frontend-jet-psi-12.vercel.app'));
  assert.ok(ALLOWED_ORIGINS.includes('https://thinking-foundry-production.up.railway.app'));
});

test('CONDENSATION constants exist and are numbers', () => {
  const { CONDENSATION } = loadConfig('production');
  assert.equal(typeof CONDENSATION.MIN_AI_TEXT_LENGTH, 'number');
  assert.equal(typeof CONDENSATION.MAX_BULLET_LENGTH, 'number');
  assert.ok(CONDENSATION.MAX_BULLET_LENGTH > CONDENSATION.MIN_AI_TEXT_LENGTH);
});
