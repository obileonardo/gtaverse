// Checks the logo code (src/brand/logo.ts) and the favicon files it draws (scripts/brand/build-favicons.mjs).
// Run: pnpm test. If the favicon check fails after a logo change, run `pnpm brand:icons` and commit public/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRAND, MARK, MARK_SMALL, WORDMARK, WORDMARK_STACKED, LOGO_TONES, lockupSvg, markSvg, stackedSvg, faviconSvg } from '../../src/brand/logo.ts';
import { favicons, matches } from '../brand/build-favicons.mjs';

const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('brand colours are the site tokens, in both themes (no blush, LG4)', () => {
  const values = (name: string) => [...tokens.matchAll(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map((m) => m[1].toLowerCase());
  const accent = values('--accent');
  const onAccent = values('--on-accent');
  assert.ok(accent.length >= 2 && accent.every((v) => v === BRAND.pink.toLowerCase()), `--accent is ${accent}`);
  assert.ok(onAccent.length >= 2 && onAccent.every((v) => v === BRAND.navy.toLowerCase()), `--on-accent is ${onAccent}`);
  const all = JSON.stringify(LOGO_TONES) + faviconSvg();
  assert.ok(!/fbd3e6/i.test(all), 'blush #FBD3E6 is not approved');
});

test('paths are plain absolute outlines, nothing but M L H V C Z', () => {
  for (const d of [MARK.folder, MARK.cut, MARK_SMALL.folder, MARK_SMALL.cut, WORDMARK.d, WORDMARK_STACKED.d]) {
    assert.match(d, /^M[-\d. MLHVCZ]+$/);
  }
  // Both marks keep Chime's folder proportion.
  assert.ok(Math.abs(MARK.w / MARK.h - MARK_SMALL.w / MARK_SMALL.h) < 0.005);
});

test('markup: decorative by default, named with a label, the width follows the height', () => {
  const plain = lockupSvg({ height: 18 });
  assert.match(plain, /aria-hidden="true"/);
  assert.doesNotMatch(plain, /role="img"/);
  const named = markSvg({ height: 40, label: 'The Vice Files & co' });
  assert.match(named, /role="img" aria-label="The Vice Files &amp; co"/);
  assert.match(named, /<title>The Vice Files &amp; co<\/title>/);
  const w = Number(plain.match(/width="([\d.]+)"/)![1]);
  assert.ok(Math.abs(w - 18 * (144.01 / 17.88)) < 0.02, `lockup width ${w}`);
  // Small drawing at 32 px and under, the panel drawing above, unless asked.
  assert.ok(markSvg({ height: 32 }).includes(MARK_SMALL.cut));
  assert.ok(markSvg({ height: 33 }).includes(MARK.cut));
  assert.ok(lockupSvg({ height: 36, small: true }).includes(MARK_SMALL.cut));
  assert.ok(stackedSvg({ height: 120 }).includes(WORDMARK_STACKED.d));
  // Site tone reads the tokens; the wordmark follows the text colour.
  assert.match(plain, /style="fill:var\(--logo-folder, var\(--accent/);
  assert.match(plain, /fill="currentColor"/);
});

test('the committed favicon files match the logo code', async () => {
  const files = await favicons();
  for (const [name, buf] of Object.entries(files)) assert.ok(await matches(name, buf), `public/${name} is out of date: run pnpm brand:icons`);
});

test('the CI asset guard allows exactly the favicon images, by exact path', () => {
  const block = ci.match(/ALLOWLIST='([^']*)'/)![1];
  const allowed = block.split('\n').map((l) => l.trim()).filter(Boolean).sort();
  assert.deepEqual(allowed, ['public/apple-touch-icon.png', 'public/favicon-32.png', 'public/favicon.svg', 'public/icon-512.png']);
  for (const p of allowed) assert.doesNotMatch(p, /[*?[\]]/, `${p} must not be a pattern`);
});
