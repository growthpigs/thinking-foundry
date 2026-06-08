/**
 * Tests for EmailAuth
 *
 * Run: node --test poc/server/email-auth.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { EmailAuth } = require('./email-auth');

function makeAuth() {
  // No resend key, no supabase — pure in-memory mode
  const auth = new EmailAuth({ resendApiKey: '', baseUrl: 'http://test' });
  return auth;
}

test('rejects email not in whitelist', async () => {
  const auth = makeAuth();
  const result = await auth.sendMagicLink('unauthorized@example.com');
  assert.equal(result.sent, false);
  assert.match(result.message, /not registered/);
});

test('rejects empty email', async () => {
  const auth = makeAuth();
  const result = await auth.sendMagicLink('');
  assert.equal(result.sent, false);
});

test('rejects malformed email (no @)', async () => {
  const auth = makeAuth();
  const result = await auth.sendMagicLink('notanemail');
  assert.equal(result.sent, false);
});

test('accepts whitelisted email (dev mode returns link)', async () => {
  const auth = makeAuth();
  auth.allowedEmails.add('test@example.com');
  const result = await auth.sendMagicLink('test@example.com');
  assert.equal(result.sent, true);
  assert.ok(result.devLink, 'Dev mode should return a link');
});

test('rate limiter: allows first 3 requests, blocks 4th', async () => {
  const auth = makeAuth();
  auth.allowedEmails.add('test@example.com');
  const r1 = await auth.sendMagicLink('test@example.com');
  const r2 = await auth.sendMagicLink('test@example.com');
  const r3 = await auth.sendMagicLink('test@example.com');
  const r4 = await auth.sendMagicLink('test@example.com');
  assert.equal(r1.sent, true);
  assert.equal(r2.sent, true);
  assert.equal(r3.sent, true);
  assert.equal(r4.sent, false);
  assert.match(r4.message, /Too many requests/);
});

test('rate limiter: case-insensitive (all variants share bucket)', async () => {
  const auth = makeAuth();
  auth.allowedEmails.add('test@example.com');
  await auth.sendMagicLink('Test@Example.com');
  await auth.sendMagicLink('TEST@EXAMPLE.COM');
  await auth.sendMagicLink('test@example.com');
  const r4 = await auth.sendMagicLink('test@example.com');
  assert.equal(r4.sent, false);
});

test('rate limiter: different emails have independent buckets', async () => {
  const auth = makeAuth();
  auth.allowedEmails.add('a@example.com');
  auth.allowedEmails.add('b@example.com');
  await auth.sendMagicLink('a@example.com');
  await auth.sendMagicLink('a@example.com');
  await auth.sendMagicLink('a@example.com');
  const r4a = await auth.sendMagicLink('a@example.com');
  const r1b = await auth.sendMagicLink('b@example.com');
  assert.equal(r4a.sent, false, 'a should be rate limited');
  assert.equal(r1b.sent, true, 'b should not be affected');
});

test('rate limiter: stale timestamps pruned on next request', async () => {
  const auth = makeAuth();
  auth.allowedEmails.add('test@example.com');
  // Inject stale timestamps (15 min ago, outside 10-min window)
  const stale = Date.now() - (15 * 60 * 1000);
  auth.rateLimits.set('test@example.com', [stale, stale, stale]);
  const result = await auth.sendMagicLink('test@example.com');
  assert.equal(result.sent, true, 'Stale entries should not block new request');
  const stored = auth.rateLimits.get('test@example.com');
  assert.equal(stored.length, 1, 'Only the new timestamp should remain');
});

test('session nonce: creates and verifies single-use', () => {
  const auth = makeAuth();
  const nonce = auth.createSessionNonce('test@example.com');
  assert.ok(nonce, 'nonce should be created');
  const email1 = auth.verifySessionNonce(nonce);
  assert.equal(email1, 'test@example.com');
  const email2 = auth.verifySessionNonce(nonce);
  assert.equal(email2, null, 'Second verification should fail (one-time use)');
});

test('session nonce: rejects invalid nonce', () => {
  const auth = makeAuth();
  const result = auth.verifySessionNonce('fake-nonce');
  assert.equal(result, null);
});

test('PIN: rejects non-4-digit PIN', async () => {
  const auth = makeAuth();
  const r1 = await auth.setPin('test@example.com', '123');
  const r2 = await auth.setPin('test@example.com', '12345');
  const r3 = await auth.setPin('test@example.com', 'abcd');
  assert.equal(r1.success, false);
  assert.equal(r2.success, false);
  assert.equal(r3.success, false);
});

test('PIN: accepts 4-digit PIN and returns device token', async () => {
  const auth = makeAuth();
  const result = await auth.setPin('test@example.com', '1234');
  assert.equal(result.success, true);
  assert.ok(result.deviceToken);
  assert.ok(result.sessionNonce);
});

test('PIN: verify accepts correct PIN', async () => {
  const auth = makeAuth();
  const set = await auth.setPin('test@example.com', '1234');
  const verify = await auth.verifyPin(set.deviceToken, '1234');
  assert.equal(verify.valid, true);
  assert.equal(verify.email, 'test@example.com');
});

test('PIN: verify rejects wrong PIN', async () => {
  const auth = makeAuth();
  const set = await auth.setPin('test@example.com', '1234');
  const verify = await auth.verifyPin(set.deviceToken, '9999');
  assert.equal(verify.valid, false);
});

test('PIN: verify rejects unknown device token', async () => {
  const auth = makeAuth();
  const verify = await auth.verifyPin('fake-device-token', '1234');
  assert.equal(verify.valid, false);
});

test('whitelist: add and remove email', async () => {
  const auth = makeAuth();
  await auth.addAllowedEmail('test@example.com');
  assert.ok(auth.allowedEmails.has('test@example.com'));
  await auth.removeAllowedEmail('test@example.com');
  assert.ok(!auth.allowedEmails.has('test@example.com'));
});

test('whitelist: getAllowedEmails returns array', () => {
  const auth = makeAuth();
  auth.allowedEmails.add('a@example.com');
  auth.allowedEmails.add('b@example.com');
  const list = auth.getAllowedEmails();
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 2);
});

test('magic link: verify non-existent token returns invalid', async () => {
  const auth = makeAuth();
  const result = await auth.verifyMagicLink('fake-token');
  assert.equal(result.valid, false);
});
