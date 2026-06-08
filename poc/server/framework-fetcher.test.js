/**
 * Tests for FrameworkFetcher (pure logic — no live Supabase/Gemini).
 *
 * Run: node --test poc/server/framework-fetcher.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { FrameworkFetcher, FRAMEWORK_IDS } = require('./framework-fetcher');

// Set env vars so constructor doesn't throw
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-key';

test('FRAMEWORK_IDS is a non-empty array', () => {
  assert.ok(Array.isArray(FRAMEWORK_IDS));
  assert.ok(FRAMEWORK_IDS.length > 0);
});

test('getGeminiFunctionDeclarations returns 2 tools', () => {
  const tools = FrameworkFetcher.getGeminiFunctionDeclarations();
  assert.equal(tools.length, 2);
  const names = tools.map(t => t.name);
  assert.ok(names.includes('fetch_framework'));
  assert.ok(names.includes('search_knowledge'));
});

test('fetch_framework tool has required properties', () => {
  const tools = FrameworkFetcher.getGeminiFunctionDeclarations();
  const fetchFw = tools.find(t => t.name === 'fetch_framework');
  assert.ok(fetchFw.description);
  assert.equal(fetchFw.parameters.type, 'OBJECT');
  assert.ok(fetchFw.parameters.properties.framework_id);
  assert.deepEqual(fetchFw.parameters.required, ['framework_id']);
});

test('fetch_framework enum contains all FRAMEWORK_IDS', () => {
  const tools = FrameworkFetcher.getGeminiFunctionDeclarations();
  const fetchFw = tools.find(t => t.name === 'fetch_framework');
  const enumValues = fetchFw.parameters.properties.framework_id.enum;
  assert.deepEqual(enumValues.sort(), [...FRAMEWORK_IDS].sort());
});

test('search_knowledge tool has query parameter', () => {
  const tools = FrameworkFetcher.getGeminiFunctionDeclarations();
  const search = tools.find(t => t.name === 'search_knowledge');
  assert.ok(search.parameters.properties.query);
  assert.deepEqual(search.parameters.required, ['query']);
});

test('constructor throws without supabase config', () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;
  try {
    assert.throws(() => new FrameworkFetcher(), /SUPABASE_URL and SUPABASE_KEY required/);
  } finally {
    process.env.SUPABASE_URL = origUrl;
    process.env.SUPABASE_KEY = origKey;
  }
});

test('fetchFramework rejects unknown framework', async () => {
  const fetcher = new FrameworkFetcher();
  const result = await fetcher.fetchFramework('nonexistent-framework');
  assert.match(result, /Unknown framework/);
});

test('getFrameworksUsed returns empty array initially', () => {
  const fetcher = new FrameworkFetcher();
  assert.deepEqual(fetcher.getFrameworksUsed(), []);
});

test('handleFunctionCall routes to correct method', async () => {
  const fetcher = new FrameworkFetcher();
  // Stub the underlying methods
  fetcher.fetchFramework = async (id) => `content for ${id}`;
  fetcher.searchByContext = async (q) => `results for ${q}`;

  const r1 = await fetcher.handleFunctionCall({ name: 'fetch_framework', args: { framework_id: 'hormozi' } });
  assert.equal(r1.name, 'fetch_framework');
  assert.match(r1.response.content, /hormozi/);

  const r2 = await fetcher.handleFunctionCall({ name: 'search_knowledge', args: { query: 'pricing' } });
  assert.equal(r2.name, 'search_knowledge');
  assert.match(r2.response.content, /pricing/);

  const r3 = await fetcher.handleFunctionCall({ name: 'unknown_fn', args: {} });
  assert.ok(r3.response.error);
});
