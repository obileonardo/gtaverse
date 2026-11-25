// A small headless Chromium driver over the DevTools protocol, with no dependencies (Node 22 WebSocket).
// Used by clip-audit.mjs and shots.mjs. Chromium: CHROMIUM_PATH, else the newest Playwright Chromium.
//
// blockMedia: Rockstar material never reaches the page (CLAUDE.md rule 2). Same-origin /media/ and /map/,
// and every cross-origin request except fonts, are blocked. Blocked images become a flat grey pixel,
// so layouts keep their boxes and screenshots are safe to look at.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const GREY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPIyMgAAAQ6AeWbcTrTAAAAAElFTkSuQmCC';

export function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = process.platform === 'darwin' ? join(homedir(), 'Library/Caches/ms-playwright') : join(homedir(), '.cache/ms-playwright');
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : [];
  const mac = 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const bins = [`chrome-mac-arm64/${mac}`, `chrome-mac-x64/${mac}`, `chrome-mac/${mac}`, 'chrome-linux64/chrome', 'chrome-linux/chrome'];
  for (const d of dirs) {
    for (const b of bins) {
      const p = join(cache, d, b);
      if (existsSync(p)) return p;
    }
  }
  throw new Error('No Chromium found. Set CHROMIUM_PATH.');
}

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'page-check-'));
  const proc = spawn(findChromium(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  // A stopped run (Ctrl-C, or a memory guard's SIGTERM) takes its browser with it, so no Chromium is left running.
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { proc.kill(); process.exit(130); });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('Chromium did not start')), 30000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
    proc.on('exit', (c) => reject(new Error(`Chromium exited (${c})`)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else for (const l of listeners) l(msg);
  };
  // If Chromium dies, fail every open call instead of hanging.
  ws.onclose = () => {
    for (const { reject } of pending.values()) reject(new Error('DevTools connection closed'));
    pending.clear();
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) return reject(new Error('DevTools connection closed'));
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  const close = async () => {
    try { ws.close(); } catch {}
    const exited = new Promise((r) => (proc.exitCode !== null || proc.signalCode !== null ? r() : proc.once('exit', r)));
    proc.kill();
    await exited;
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  return { send, listeners, close };
}

// Opens one tab. Returns helpers bound to it.
export async function openPage(browser, { width, height, blockMedia = true, reducedMotion = false }) {
  const { send, listeners } = browser;
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const waiters = new Set();
  const listener = (msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Fetch.requestPaused') onPaused(msg.params);
    for (const w of waiters) w(msg);
  };
  listeners.add(listener);
  const origin = { value: '' };
  async function onPaused({ requestId, request, resourceType }) {
    // Anything we cannot parse is blocked, never let through.
    let blocked = true;
    try {
      const u = new URL(request.url);
      const same = u.origin === origin.value;
      blocked = same ? /^\/(media|map)\//.test(u.pathname) : resourceType !== 'Font' && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
    } catch {}
    try {
      if (!blocked) await s('Fetch.continueRequest', { requestId });
      else if (resourceType === 'Image') await s('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/png' }], body: GREY_PNG });
      else await s('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch {}
  }
  await s('Page.enable');
  await s('Runtime.enable');
  if (blockMedia) await s('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] });
  if (width < 768) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const waitFor = (method, timeout = 30000) => new Promise((resolve, reject) => {
    const t = setTimeout(() => { waiters.delete(w); reject(new Error(`timeout waiting for ${method}`)); }, timeout);
    const w = (msg) => { if (msg.method === method) { clearTimeout(t); waiters.delete(w); resolve(msg.params); } };
    waiters.add(w);
  });
  const evaluate = async (expression) => {
    const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    send: s,
    evaluate,
    async goto(url) {
      origin.value = new URL(url).origin;
      const loaded = waitFor('Page.loadEventFired', 60000);
      const { errorText } = await s('Page.navigate', { url });
      // A failed navigation (dev server down) shows Chrome's error page, which would audit as clean.
      if (errorText) { loaded.catch(() => {}); throw new Error(`Could not load ${url}: ${errorText}`); }
      await loaded;
      await evaluate('document.fonts.ready.then(() => true)');
    },
    async screenshot() {
      const { data } = await s('Page.captureScreenshot', { format: 'png' });
      return Buffer.from(data, 'base64');
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    async close() {
      listeners.delete(listener);
      waiters.clear();
      await send('Target.closeTarget', { targetId });
    },
  };
}

export function parseArgs(argv, defaults) {
  const out = { ...defaults };
  for (const a of argv) {
    const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] ?? true;
  }
  return out;
}
