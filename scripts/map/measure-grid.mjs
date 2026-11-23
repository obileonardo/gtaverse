// Measures the printed grid of the official Leonida map by pixel analysis, so
// content/map.json can be checked or re-measured if Rockstar updates the file.
// Run with: pnpm map:grid (after pnpm map:fetch). Read-only: prints, writes nothing.
//
// Method (no image viewing, no OCR, no AI):
// 1. Grid lines: for every column (row) of pixels, the share of rows (columns)
//    where the pixel differs from its neighbours 3 px away by more than 20
//    grey levels. Thin lines that cross the whole map score near 1.
// 2. Grid labels: runs of dark ink in the white margins. Their count per side
//    tells which axis has 13 labels (A to M) and which has 9 (1 to 9); glyph
//    width and ink totals confirm the order ("I" is the narrowest letter,
//    "1" the lightest digit).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'content/map.json'), 'utf8'));
const { data, info } = await sharp(join(root, '.cache/map', map.source.image_name))
  .toColourspace('srgb')
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const g = (x, y) => data[(y * W + x) * info.channels];

const K = 3;
const T = 20;
const DARK = 140;

function profile(len, span, at) {
  const out = new Float32Array(len);
  for (let i = K; i < len - K; i++) {
    let n = 0;
    let c = 0;
    for (let j = 0; j < span; j += 3, n++) if (Math.abs(at(i, j, 0) - (at(i, j, -K) + at(i, j, K)) / 2) > T) c++;
    out[i] = c / n;
  }
  return out;
}
function peaks(p, thr = 0.3, gap = 20) {
  const m = [];
  for (let i = 1; i < p.length - 1; i++) {
    if (p[i] < thr || p[i] < p[i - 1] || p[i] < p[i + 1]) continue;
    if (m.length && i - m.at(-1) < gap) {
      if (p[i] > p[m.at(-1)]) m[m.length - 1] = i;
    } else m.push(i);
  }
  return m;
}
function inkRuns(len, inkAt) {
  const runs = [];
  let s = -1;
  for (let i = 0; i <= len; i++) {
    const ink = i < len && inkAt(i);
    if (ink && s < 0) s = i;
    if (!ink && s >= 0) {
      if (runs.length && s - runs.at(-1)[1] < 15) runs.at(-1)[1] = i - 1;
      else runs.push([s, i - 1]);
      s = -1;
    }
  }
  return runs.map(([a, b]) => Math.round((a + b) / 2));
}

const vx = peaks(profile(W, H, (x, y, d) => g(x + d, y)));
const hy = peaks(profile(H, W, (y, x, d) => g(x, y + d)));
console.log(`vertical lines x   (${vx.length}): ${vx.join(', ')}`);
console.log(`horizontal lines y (${hy.length}): ${hy.join(', ')}`);

const frame = map.grid.frame;
const inkInRows = (x0, x1) => (y) => {
  for (let x = x0; x < x1; x++) if (g(x, y) < DARK) return true;
  return false;
};
const inkInCols = (y0, y1) => (x) => {
  for (let y = y0; y < y1; y++) if (g(x, y) < DARK) return true;
  return false;
};
const left = inkRuns(H, inkInRows(10, frame.x0 - 12));
const right = inkRuns(H, inkInRows(frame.x1 + 13, W - 10));
const top = inkRuns(W, inkInCols(10, frame.y0 - 11));
const bottom = inkRuns(W, inkInCols(frame.y1 + 14, H - 10));
console.log(`left margin labels   (${left.length}) at y: ${left.join(', ')}`);
console.log(`right margin labels  (${right.length}) at y: ${right.join(', ')}`);
console.log(`top margin labels    (${top.length}) at x: ${top.join(', ')}`);
console.log(`bottom margin labels (${bottom.length}) at x: ${bottom.join(', ')}`);

// Width and ink of the glyph inside a box: [x0, x1] by [y0, y1].
const glyph = (x0, x1, y0, y1) => {
  let a = Infinity;
  let b = -1;
  let ink = 0;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (g(x, y) < DARK) {
        a = Math.min(a, x);
        b = Math.max(b, x);
        ink++;
      }
  return `${b - a + 1}/${ink}`;
};
console.log('left glyphs (width px / ink px): ' + left.map((y) => glyph(10, frame.x0 - 12, y - 25, y + 25)).join(' '));
console.log('top glyphs  (width px / ink px): ' + top.map((x) => glyph(x - 25, x + 25, 10, frame.y0 - 11)).join(' '));

const expectX = [frame.x0, ...map.grid.columns.slice(1).map((c) => c.x0), frame.x1];
const expectY = [frame.y0, ...map.grid.rows.slice(1).map((r) => r.y0), frame.y1];
const near = (found, want) => want.every((v) => found.some((f) => Math.abs(f - v) <= 2));
console.log(`\ncontent/map.json grid ${near(vx, expectX) && near(hy, expectY) ? 'MATCHES' : 'DOES NOT MATCH'} the measured lines (tolerance 2 px)`);
