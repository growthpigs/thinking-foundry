import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { EmailAuth } = require('../../poc/server/email-auth.js');

// Constructor registers a cleanup setInterval — fake timers keep tests hermetic.
describe('EmailAuth', () => {
  let auth;

  beforeEach(() => {
    vi.useFakeTimers();
    auth = new EmailAuth({ resendApiKey: null, baseUrl: 'http://localhost' });
  });
  afterEach(() => vi.useRealTimers());

  describe('session nonces (#176 regression)', () => {
    it('nonce is valid within 5 minutes (survives Railway cold start)', () => {
      const nonce = auth.createSessionNonce('roderic@example.com');
      vi.advanceTimersByTime(4 * 60 * 1000); // 4 min — longer than any cold start
      expect(auth.verifySessionNonce(nonce)).toBe('roderic@example.com');
    });

    it('nonce expires after 5 minutes', () => {
      const nonce = auth.createSessionNonce('roderic@example.com');
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      expect(auth.verifySessionNonce(nonce)).toBeNull();
    });

    it('nonce is one-time use', () => {
      const nonce = auth.createSessionNonce('roderic@example.com');
      expect(auth.verifySessionNonce(nonce)).toBe('roderic@example.com');
      expect(auth.verifySessionNonce(nonce)).toBeNull();
    });

    it('unknown nonce is rejected', () => {
      expect(auth.verifySessionNonce('not-a-real-nonce')).toBeNull();
    });

    it('email is normalized to lowercase', () => {
      const nonce = auth.createSessionNonce('RODERIC@Example.COM');
      expect(auth.verifySessionNonce(nonce)).toBe('roderic@example.com');
    });
  });

  describe('whitelist', () => {
    it('add/remove normalizes and deduplicates', async () => {
      await auth.addAllowedEmail('  Founder@Startup.io ');
      await auth.addAllowedEmail('founder@startup.io');
      expect(auth.getAllowedEmails()).toEqual(['founder@startup.io']);
      await auth.removeAllowedEmail('FOUNDER@startup.io');
      expect(auth.getAllowedEmails()).toEqual([]);
    });

    it('loads ALLOWED_EMAILS from env', () => {
      vi.stubEnv('ALLOWED_EMAILS', 'a@x.com, B@Y.com');
      const envAuth = new EmailAuth({ resendApiKey: null });
      expect(envAuth.getAllowedEmails().sort()).toEqual(['a@x.com', 'b@y.com']);
      vi.unstubAllEnvs();
    });
  });

  describe('PIN flow', () => {
    it('rejects malformed PINs', async () => {
      for (const bad of ['123', '12345', 'abcd', '', undefined]) {
        const res = await auth.setPin('u@x.com', bad);
        expect(res.success).toBe(false);
      }
    });

    it('setPin issues device token + nonce; verifyPin accepts the right PIN', async () => {
      const set = await auth.setPin('u@x.com', '4242');
      expect(set.success).toBe(true);
      expect(set.deviceToken).toBeTruthy();
      expect(auth.verifySessionNonce(set.sessionNonce)).toBe('u@x.com');

      const ok = await auth.verifyPin(set.deviceToken, '4242');
      expect(ok.valid).toBe(true);
      expect(ok.email).toBe('u@x.com');
      expect(auth.verifySessionNonce(ok.sessionNonce)).toBe('u@x.com');
    });

    it('verifyPin rejects wrong PIN and unknown device', async () => {
      const set = await auth.setPin('u@x.com', '4242');
      expect((await auth.verifyPin(set.deviceToken, '0000')).valid).toBe(false);
      expect((await auth.verifyPin('bogus-device', '4242')).valid).toBe(false);
    });
  });

  describe('magic link cleanup', () => {
    it('removes expired links from memory', () => {
      auth.magicLinks.set('t1', { email: 'a@x.com', expiresAt: Date.now() - 1 });
      auth.magicLinks.set('t2', { email: 'b@x.com', expiresAt: Date.now() + 60_000 });
      auth._cleanupExpiredLinks();
      expect(auth.magicLinks.has('t1')).toBe(false);
      expect(auth.magicLinks.has('t2')).toBe(true);
    });
  });
});
