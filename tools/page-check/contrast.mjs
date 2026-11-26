// Checks text contrast in the worst case: every picture on the page (Rockstar media, map tiles, clip stills) is
// replaced by pure white, so white type over a picture reads only if its scrim is strong enough. For each line of
// text it screenshots with and without the text, finds the letters, and the lowest-contrast pixel right behind them; then it computes the WCAG
// contrast with the text's real colour (its alpha and its ancestors' opacity included). AA: 4.5:1, or 3:1 for large
// text (24px and up, or 18.66px bold).
// Text that is decoration (aria-hidden and under 30% effective opacity, like the faint giant words) is skipped.
//
// Run: node tools/page-check/contrast.mjs [--url=http://localhost:4321/] [--widths=375,1440] [--themes=dark,light]
//      [--settle=900] [--within=.selector] [--json]
// Needs ffmpeg on the PATH (decodes the screenshots). Exit code 1 when any line fails.

import { spawnSync } from 'node:child_process';
import { launch, openPage, parseArgs } from './cdp.mjs';

const args = parseArgs(process.argv.slice(2), { url: 'http://localhost:4321/', widths: '375,1440', themes: 'dark,light', settle: '900', within: '' });

// Runs in the page: every visible text line in the viewport, with its colour and the opacity above it.
const LINES = (within) => `(() => {
  const vh = innerHeight, vw = innerWidth, out = [];
  const root = ${JSON.stringify(within)} ? document.querySelector(${JSON.stringify(within)}) : document.body;
  if (!root) return { out, covers: [] };
  const path = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) { let s = e.tagName.toLowerCase(); const c = [...e.classList].filter((x) => !x.startsWith('astro-')).slice(0, 2); if (c.length) s += '.' + c.join('.'); p.unshift(s); } return p.join(' > '); };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,svg,canvas,.sr-only')) continue;
    let alpha = 1, hidden = false, ariaHidden = !!el.closest('[aria-hidden="true"]');
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none') { hidden = true; break; }
      alpha *= Number(cs.opacity);
    }
    if (hidden || alpha < 0.01) continue;
    const cs = getComputedStyle(el);
    const m = cs.color.match(/[\\d.]+/g).map(Number);
    const a = (m.length > 3 ? m[3] : 1) * alpha;
    if (ariaHidden && a < 0.3) continue;
    const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
    const range = document.createRange();
    range.selectNodeContents(n);
    // The part of a line that can show: clipped by every ancestor that clips (an ellipsis hides the rest).
    let cl = 0, ct = 0, cr = vw, cb = vh;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const c = getComputedStyle(e), q = e.getBoundingClientRect();
      if (/hidden|clip/.test(c.overflowX)) { cl = Math.max(cl, q.left); cr = Math.min(cr, q.right); }
      if (/hidden|clip/.test(c.overflowY)) { ct = Math.max(ct, q.top); cb = Math.min(cb, q.bottom); }
    }
    for (const r of range.getClientRects()) {
      const l = Math.max(cl, Math.ceil(r.left) + 1), t = Math.max(ct, Math.ceil(r.top) + 1), rr = Math.min(cr, Math.floor(r.right) - 1), b = Math.min(cb, Math.floor(r.bottom) - 1);
      if (rr - l < 2 || b - t < 2) continue;
      // A line covered at its centre by something that paints (the fixed header, a dock) is hidden, not low
      // contrast. Transparent layers above it (a controls row, a link box) do not count.
      const stack = document.elementsFromPoint((l + rr) / 2, (t + b) / 2);
      const at = stack.findIndex((h) => h === el || el.contains(h) || h.contains(el));
      const paints = (h) => { const c = getComputedStyle(h); return /^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(h.tagName) || c.backgroundImage !== 'none' || c.backdropFilter !== 'none' || (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent'); };
      if (at > 0 && stack.slice(0, at).some(paints)) continue;
      out.push({ box: [l, t, rr, b], fg: m.slice(0, 3), a, large: size >= 24 || (size >= 18.66 && weight >= 700), where: path(el), text: n.data.trim().slice(0, 50), size });
    }
  }
  // Boxes of fixed or sticky layers that paint (the header island, its sub bar): pixels under them are skipped.
  const covers = [];
  for (const e of document.querySelectorAll('body *')) {
    const c = getComputedStyle(e);
    if (c.position !== 'fixed' || c.display === 'none' || c.visibility === 'hidden') continue;
    for (const d of [e, ...e.querySelectorAll('*')]) {
      const dc = getComputedStyle(d);
      if (!/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(d.tagName) && dc.backgroundImage === 'none' && dc.backdropFilter === 'none' && (dc.backgroundColor === 'rgba(0, 0, 0, 0)' || dc.backgroundColor === 'transparent')) continue;
      const r = d.getBoundingClientRect();
      if (r.width && r.height) covers.push([Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)]);
    }
  }
  return { out, covers };
})()`;

const HIDE = `(() => { const s = document.createElement('style'); s.id = 'pc-hide-text'; s.textContent = '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; -webkit-text-stroke-color: transparent !important; text-decoration-color: transparent !important; transition: none !important; }'; document.head.append(s); return true; })()`;
const SHOW = `(() => { document.getElementById('pc-hide-text')?.remove(); return true; })()`;

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);

function decode(png, width, height) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: png, maxBuffer: 1 << 28 });
  if (r.status !== 0 || r.stdout.length !== width * height * 3) throw new Error('ffmpeg could not decode the screenshot (is ffmpeg on the PATH?)');
  return r.stdout;
}

// The lowest contrast of a line over the background right behind its letters. The letters are the pixels that change
// when the text is hidden (shown vs hidden screenshots); the background is the hidden shot within 2px of them. So a
// marker, an underline or a dock beside or over the line is never mistaken for its background. null: no letter
// pixel shows (the line is covered).
function worst(shown, hidden, width, line, covers = []) {
  const [l, t, r, b] = line.box;
  const [fr, fg, fb] = line.fg;
  const w = r - l, h = b - t, glyph = new Uint8Array(w * h);
  let any = false;
  for (let y = t; y < b; y++) for (let x = l; x < r; x++) {
    const i = (y * width + x) * 3;
    if (Math.max(Math.abs(shown[i] - hidden[i]), Math.abs(shown[i + 1] - hidden[i + 1]), Math.abs(shown[i + 2] - hidden[i + 2])) > 24) { glyph[(y - t) * w + (x - l)] = 1; any = true; }
  }
  if (!any) return null;
  const near = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && glyph[yy * w + xx]) return true; } return false; };
  let min = Infinity;
  for (let y = t; y < b; y++) {
    for (let x = l; x < r; x++) {
      if (!near(x - l, y - t)) continue;
      if (covers.some(([cl, ct, cr, cb]) => x >= cl && x < cr && y >= ct && y < cb)) continue;
      const i = (y * width + x) * 3, br = hidden[i], bg = hidden[i + 1], bb = hidden[i + 2];
      const c = ratio(lum(br + (fr - br) * line.a, bg + (fg - bg) * line.a, bb + (fb - bb) * line.a), lum(br, bg, bb));
      if (c < min) min = c;
    }
  }
  return min === Infinity ? null : min;
}

const browser = await launch();
const fails = new Map();
let checked = 0;
try {
  for (const theme of String(args.themes).split(',')) {
    for (const width of String(args.widths).split(',').map(Number)) {
      const height = width < 768 ? 812 : width < 1280 ? 1024 : 900;
      const page = await openPage(browser, { width, height, fill: 'white' });
      const u = new URL(args.url);
      u.searchParams.set('theme', theme);
      await page.goto(u.href);
      const total = await page.evaluate('document.documentElement.scrollHeight');
      for (let y = 0; y < total; y += Math.round(height * 0.8)) {
        await page.evaluate(`scrollTo(0, ${y})`);
        await page.sleep(Number(args.settle));
        // Every element takes the pointer while lines are read, so the occlusion test sees what is painted on top.
        await page.evaluate(`(() => { const s = document.createElement('style'); s.id = 'pc-hit'; s.textContent = '*, *::before, *::after { pointer-events: auto !important; }'; document.head.append(s); return true; })()`);
        const { out: lines, covers } = await page.evaluate(LINES(args.within));
        await page.evaluate(`document.getElementById('pc-hit').remove(), true`);
        if (!lines.length) continue;
        const shown = decode(await page.screenshot(), width, height);
        await page.evaluate(HIDE);
        // Two painted frames, not a fixed wait: under load a screenshot can come before the text is hidden.
        await page.evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
        const hidden = decode(await page.screenshot(), width, height);
        await page.evaluate(SHOW);
        for (const line of lines) {
          const c = worst(shown, hidden, width, line, covers), need = line.large ? 3 : 4.5;
          if (c === null) continue;
          checked++;
          if (c < need) {
            const k = `${line.where} | ${line.text}`;
            const prev = fails.get(k);
            if (!prev || c < prev.contrast) fails.set(k, { ...line, contrast: Math.round(c * 100) / 100, need, at: `${theme} ${width}px y=${y}` });
          }
        }
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const list = [...fails.values()].sort((a, b) => a.contrast - b.contrast);
if (args.json) console.log(JSON.stringify(list, null, 2));
else {
  console.log(`\nLines checked: ${checked}. Below AA with every picture white: ${list.length}`);
  for (const f of list) console.log(`  ${f.contrast}:1 (needs ${f.need})  "${f.text}"  ${f.where}  [${f.at}]`);
}
process.exit(list.length ? 1 : 0);
