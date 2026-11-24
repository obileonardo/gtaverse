// Draws the favicon and app icons from the logo code (src/brand/logo.ts) into public/.
// Run with: pnpm brand:icons. Commit what it writes: favicons must ship, and these five files are the only images the
// CI asset guard allows, by exact path (decision LG6, .github/workflows/ci.yml).
//
//   public/favicon.svg           the favicon for browsers that take SVG (Chime's 32 px mark)
//   public/favicon-32.png        the PNG fallback, 32 x 32
//   public/apple-touch-icon.png  180 x 180, the mark on navy (iOS home screen)
//   public/icon-512.png          512 x 512, the mark on navy (web manifest, Android)
//   public/site.webmanifest      names the site and the 512 icon
//
// The PNGs are rendered by sharp from the same SVG markup, so they never drift from the logo. Run with --check to
// compare instead of write (exit 1 when a file is missing or differs). The SVG and the manifest must match byte for
// byte; a PNG must have the right size and nearly the same pixels (anti-aliasing may differ by a level or two between
// sharp builds). scripts/test/logo.test.ts runs the same check.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { faviconSvg, appIconSvg, BRAND } from '../../src/brand/logo.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pub = (p) => join(root, 'public', p);

// density: sharp rasterises an SVG at 72 dpi per its width and height; the SVGs are drawn at their output size.
const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 }).resize(size, size).png({ compressionLevel: 9, palette: false }).toBuffer();

export async function favicons() {
  const manifest = {
    name: 'The Vice Files',
    short_name: 'Vice Files',
    icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
    theme_color: BRAND.navy,
    background_color: BRAND.navy,
    display: 'browser',
  };
  return {
    'favicon.svg': Buffer.from(faviconSvg()),
    // The 32 px fallback is the favicon SVG at its own size.
    'favicon-32.png': await png(faviconSvg(), 32),
    'apple-touch-icon.png': await png(appIconSvg(180), 180),
    'icon-512.png': await png(appIconSvg(512), 512),
    'site.webmanifest': Buffer.from(JSON.stringify(manifest, null, 2) + '\n'),
  };
}

/** Whether a committed file matches what the logo code draws now. */
export async function matches(name, want) {
  let have;
  try { have = readFileSync(pub(name)); } catch { return false; }
  if (!name.endsWith('.png')) return have.equals(want);
  const [a, b] = await Promise.all([have, want].map((x) => sharp(x).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return false;
  let worst = 0;
  for (let i = 0; i < a.data.length; i++) worst = Math.max(worst, Math.abs(a.data[i] - b.data[i]));
  return worst <= 8;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  const files = await favicons();
  let bad = 0;
  for (const [name, buf] of Object.entries(files)) {
    if (check) {
      if (!(await matches(name, buf))) { bad++; console.log(`brand:icons: public/${name} is missing or out of date; run pnpm brand:icons`); }
    } else {
      writeFileSync(pub(name), buf);
      console.log(`wrote public/${name} (${buf.length} bytes)`);
    }
  }
  if (bad) process.exit(1);
}
