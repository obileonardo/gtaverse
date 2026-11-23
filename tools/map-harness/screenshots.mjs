// Screenshots the map harness in headless Chromium and prints the harness self-check.
// Run with: pnpm map:shots (after pnpm map:tiles). Starts and always stops its own server.
// Output (git-ignored): tools/map-harness/screenshots/*.png
// Chromium: CHROMIUM_PATH, else the newest Playwright Chromium in ~/Library/Caches/ms-playwright.

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

// Async on purpose: the harness server runs in this process and must keep answering.
const execFile = promisify(execFileCb);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const outDir = join(here, 'screenshots');
mkdirSync(outDir, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : [];
  for (const d of dirs) {
    const p = join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    if (existsSync(p)) return p;
  }
  throw new Error('No Chromium found. Set CHROMIUM_PATH.');
}

const grid = JSON.parse(readFileSync(join(root, 'content/map.json'), 'utf8')).grid;
const centre = (id) => {
  const r = grid.rows.find((r) => r.id === id[0]);
  const c = grid.columns.find((c) => c.id === id.slice(1));
  return [Math.round((c.x0 + c.x1) / 2), Math.round((r.y0 + r.y1) / 2)];
};
// Views by grid cell. Labels are not recorded yet, so no view is named after a place.
const views = [
  { name: 'overview', hash: '' },
  ...['C3', 'C7', 'G5', 'K3', 'K7'].map((cell) => ({ name: `z3-${cell}`, hash: `#3/${centre(cell).join('/')}` })),
  { name: 'z5-frame-corner-A1', hash: `#5/${grid.frame.x0}/${grid.frame.y0}` },
];

const chromium = findChromium();
const port = 4318;
const server = await startServer(port);
const profile = mkdtempSync(join(tmpdir(), 'map-harness-'));
const base = `http://127.0.0.1:${port}/tools/map-harness/index.html`;
const flags = ['--headless=new', `--user-data-dir=${profile}`, '--window-size=1400,1100', '--hide-scrollbars', '--virtual-time-budget=15000', '--no-first-run', '--disable-gpu'];
let failed = false;
try {
  for (const v of views) {
    const url = base + v.hash;
    const png = join(outDir, `${v.name}.png`);
    await execFile(chromium, [...flags, `--screenshot=${png}`, url], { timeout: 60000 });
    const { stdout: dom } = await execFile(chromium, [...flags, '--dump-dom', url], { encoding: 'utf8', timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
    const m = dom.match(/<pre id="status">([\s\S]*?)<\/pre>/);
    const s = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
    const ok = s && s.ready && !s.errors.length && s.tileErrors === 0 && s.tilesLoaded > 0 && s.tileOffsetMaxPx <= 1;
    if (!ok) failed = true;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${v.name.padEnd(20)} zoom ${s?.zoom} tiles ${s?.tilesLoaded} errors ${s?.tileErrors} offset ${s?.tileOffsetMaxPx}px labels ${s?.labels} pins ${s?.pins} ${s?.errors?.length ? JSON.stringify(s.errors) : ''}  ${png} (${(statSync(png).size / 1024).toFixed(0)} KiB)`);
  }
} finally {
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
if (failed) process.exit(1);
