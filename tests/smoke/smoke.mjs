#!/usr/bin/env node
/**
 * Smoke test — verifies the deployed (or local) Thinking Foundry stack is alive.
 * Covers the automatable half of issue #175 (full voice round-trip still needs a human + mic).
 *
 * Checks:
 *   1. Backend /health responds 200 and reports status
 *   2. Backend accepts a WebSocket handshake
 *   3. Frontend loads in headless Chromium with zero console errors
 *
 * Usage:
 *   node tests/smoke/smoke.mjs                          # against production
 *   BACKEND_URL=http://localhost:3100 node tests/smoke/smoke.mjs
 *   SKIP_FRONTEND=1 node tests/smoke/smoke.mjs          # backend-only
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BACKEND_URL = process.env.BACKEND_URL || 'https://thinking-foundry-production.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://frontend-jet-psi-12.vercel.app';
const WS_URL = process.env.WS_URL || BACKEND_URL.replace(/^http/, 'ws');
const TIMEOUT_MS = 30_000;

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function checkHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return record('backend /health', false, `HTTP ${res.status}`);
    const body = await res.json();
    const failing = Object.entries(body.checks || {})
      .filter(([, v]) => (typeof v === 'object' ? !v.ok : !v))
      .map(([k]) => k);
    record('backend /health', true, `status=${body.status}${failing.length ? `, failing: ${failing.join(', ')}` : ''}`);
  } catch (err) {
    record('backend /health', false, err.message);
  }
}

async function checkWebSocket() {
  const WebSocket = require('ws');
  await new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    const timer = setTimeout(() => {
      record('backend WebSocket handshake', false, `no open event within ${TIMEOUT_MS / 1000}s`);
      ws.terminate();
      resolve();
    }, TIMEOUT_MS);
    ws.on('open', () => {
      clearTimeout(timer);
      record('backend WebSocket handshake', true, WS_URL);
      ws.close();
      resolve();
    });
    ws.on('error', (err) => {
      clearTimeout(timer);
      record('backend WebSocket handshake', false, err.message);
      resolve();
    });
  });
}

async function checkFrontend() {
  if (process.env.SKIP_FRONTEND) return;
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    return record('frontend page load', false, 'playwright-core not installed (npm install)');
  }
  // The plain-fetch fallback exists ONLY for environments where the browser
  // itself can't run or can't reach the network (missing binary, sandbox TLS
  // interception). Real page failures — timeouts, crashes, blank app — must
  // stay failures, or the smoke test green-lights a broken deploy.
  const envBlocked = (msg) =>
    /ERR_CONNECTION_RESET|ERR_PROXY|ERR_TUNNEL|ERR_CERT|executable doesn't exist|Failed to launch/i.test(msg);
  const fetchFallback = async (reason) => {
    try {
      const res = await fetch(FRONTEND_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const html = await res.text();
      const looksLikeApp = res.ok && html.includes('<div id="root">');
      record('frontend HTTP (no-browser fallback)', looksLikeApp,
        `HTTP ${res.status}; browser check unavailable here (${reason}) — run in CI or locally for console/render checks`);
    } catch (fetchErr) {
      record('frontend page load', false, `${reason}; fetch fallback also failed: ${fetchErr.message}`);
    }
  };

  let browser;
  try {
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
      ...(proxy ? { proxy: { server: proxy } } : {}),
    });
  } catch (err) {
    return fetchFallback(`browser launch failed: ${err.message.split('\n')[0]}`);
  }

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    const res = await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });
    record('frontend HTTP status', res.status() === 200, `HTTP ${res.status()}`);

    const rendered = await page.locator('#root > *').count();
    record('frontend renders app', rendered > 0, rendered > 0 ? '' : '#root is empty');

    record('frontend console clean', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors.slice(0, 3).join(' | ').slice(0, 300) : '');
  } catch (err) {
    const reason = err.message.split('\n')[0];
    if (envBlocked(reason)) {
      await fetchFallback(`browser blocked by environment: ${reason}`);
    } else {
      record('frontend page load', false, reason); // real failure — no fallback
    }
  } finally {
    await browser?.close();
  }
}

console.log(`Smoke test\n  backend:  ${BACKEND_URL}\n  frontend: ${FRONTEND_URL}\n`);
await checkHealth();
await checkWebSocket();
await checkFrontend();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
