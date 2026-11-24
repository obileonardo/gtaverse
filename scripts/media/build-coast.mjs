// Traces the Leonida coastline from the official map for the hero's line art.
// Run with: pnpm media:coast (after pnpm map:fetch). Part of pnpm media:build.
//
// The map is read as numbers only, by code: every pixel inside the printed frame is
// classed as water or land by its colour (water is the map's cyan: low red, blue at
// least as strong as green), the mask is cleaned, the land outlines are traced and
// simplified to a few hundred points. No person or AI tool looks at the map here
// (docs/MAP.md, decision OS7). The outline is a derived shape of Rockstar's map, so
// it is written to the git-ignored public/media/hero/coast.json, never committed.
//
// MAP_IMAGE overrides the source path (default .cache/map/<image_name> from content/map.json).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'content/map.json'), 'utf8'));
const src = process.env.MAP_IMAGE || join(root, '.cache/map', map.source.image_name);
const outDir = join(root, 'public/media/hero');
if (!existsSync(src)) {
  console.log(`build-coast: ${src} is missing; run pnpm map:fetch first. The line art falls back to its other scenes.`);
  process.exit(0);
}

const SCALE = 8; // work at 1/8 of the poster: 722 x 988
const { data, info } = await sharp(src)
  .toColourspace('srgb')
  .resize({ width: Math.round(map.image.width / SCALE) })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const s = W / map.image.width;
const fr = map.grid.frame;
const fx0 = Math.ceil(fr.x0 * s) + 2, fx1 = Math.floor(fr.x1 * s) - 2;
const fy0 = Math.ceil(fr.y0 * s) + 2, fy1 = Math.floor(fr.y1 * s) - 2;

// 1. Classify: 1 = land, 0 = water. Outside the frame counts as water.
let land = new Uint8Array(W * H);
for (let y = fy0; y < fy1; y++) {
  for (let x = fx0; x < fx1; x++) {
    const i = (y * W + x) * C;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const water = r < 120 && b > 140 && b >= g - 6;
    // Near white is print, not ground: legend boxes, labels, the compass.
    const paper = r > 200 && g > 200 && b > 200;
    land[y * W + x] = water || paper ? 0 : 1;
  }
}

// 2. Clean: a 5 x 5 majority filter, twice, removes grid lines and lettering.
const majority = (m) => {
  const out = new Uint8Array(W * H);
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sum += m[(y + dy) * W + x + dx];
      out[y * W + x] = sum >= 13 ? 1 : 0;
    }
  }
  return out;
};
land = majority(majority(land));

// 3. Components (4-connected). Keep land masses and lakes above a minimum area.
const label = (m, value) => {
  const lab = new Int32Array(W * H).fill(-1);
  const areas = [];
  const stack = [];
  for (let p = 0; p < W * H; p++) {
    if (m[p] !== value || lab[p] !== -1) continue;
    const id = areas.length;
    let area = 0;
    lab[p] = id;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop();
      area += 1;
      const x = q % W, y = (q - x) / W;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (m[n] === value && lab[n] === -1) {
          lab[n] = id;
          stack.push(n);
        }
      }
    }
    areas.push(area);
  }
  return { lab, areas };
};
const MIN_LAND = 60; // px at 1/8 scale: the larger keys survive, specks do not
const MIN_LAKE = 400;
{
  const { lab, areas } = label(land, 1);
  for (let p = 0; p < W * H; p++) if (land[p] && areas[lab[p]] < MIN_LAND) land[p] = 0;
  const water = label(land, 0);
  // Water touching the image edge is the sea; enclosed water below MIN_LAKE is filled in.
  const sea = new Set();
  for (let x = 0; x < W; x++) sea.add(water.lab[x]).add(water.lab[(H - 1) * W + x]);
  for (let y = 0; y < H; y++) sea.add(water.lab[y * W]).add(water.lab[y * W + W - 1]);
  for (let p = 0; p < W * H; p++) {
    const id = water.lab[p];
    if (!land[p] && !sea.has(id) && water.areas[id] < MIN_LAKE) land[p] = 1;
  }
}

// 4. Trace every boundary between land and water with marching squares, as closed loops.
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : land[y * W + x]);
const edges = new Map(); // "x,y" -> next "x,y" corners on the boundary (two where loops touch at a corner)
const addEdge = (a, b) => (edges.has(a) ? edges.get(a).push(b) : edges.set(a, [b]));
for (let y = -1; y < H; y++) {
  for (let x = -1; x < W; x++) {
    // Each land pixel contributes its edges that face water, oriented with land on the left.
    if (!at(x, y)) continue;
    if (!at(x, y - 1)) addEdge(`${x + 1},${y}`, `${x},${y}`);
    if (!at(x, y + 1)) addEdge(`${x},${y + 1}`, `${x + 1},${y + 1}`);
    if (!at(x - 1, y)) addEdge(`${x},${y}`, `${x},${y + 1}`);
    if (!at(x + 1, y)) addEdge(`${x + 1},${y + 1}`, `${x + 1},${y}`);
  }
}
const loops = [];
while (edges.size) {
  const [start] = edges.keys();
  const loop = [];
  let k = start;
  while (edges.has(k)) {
    const list = edges.get(k);
    const next = list.pop();
    if (!list.length) edges.delete(k);
    loop.push(k.split(',').map(Number));
    k = next;
  }
  if (loop.length > 8) loops.push(loop);
}

// 5. Simplify (Douglas-Peucker) and drop loops that become tiny.
const simplify = (pts, eps) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let far = -1, dmax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > dmax) (dmax = d), (far = i);
    }
    if (dmax > eps && far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const loopArea = (pts) => Math.abs(pts.reduce((s2, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length];
  return s2 + x * ny - nx * y;
}, 0) / 2);

// Printed boxes (legend, scale bar) trace as long filled rectangles: drop them.
const boxy = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  return loopArea(pts) / (w * h || 1) > 0.8 && Math.max(w / (h || 1), h / (w || 1)) > 3;
};

const BUDGET = 480;
let eps = 1.8;
let paths = [];
for (let tries = 0; tries < 12; tries++) {
  paths = loops
    .filter((l) => loopArea(l) >= MIN_LAND && !boxy(l))
    .map((l) => {
      // Smooth the pixel staircase with a circular moving average, then simplify.
      const n = l.length, k = Math.min(7, Math.floor(n / 4));
      l = l.map((_, i) => {
        let sx = 0, sy = 0;
        for (let j = -k; j <= k; j++) {
          const q = l[(i + j + n) % n];
          sx += q[0];
          sy += q[1];
        }
        return [sx / (2 * k + 1), sy / (2 * k + 1)];
      });
      // Split the loop in two so DP keeps both halves.
      const mid = Math.floor(l.length / 2);
      const a = simplify(l.slice(0, mid + 1), eps), b = simplify(l.slice(mid), eps);
      return [...a, ...b.slice(1, -1)];
    })
    .filter((p) => p.length >= 4);
  const total = paths.reduce((n, p) => n + p.length, 0);
  if (total <= BUDGET) break;
  eps *= 1.25;
}
paths.sort((a, b) => loopArea(b) - loopArea(a));
const points = paths.reduce((n, p) => n + p.length, 0);

// Normalise to the printed frame: 0..1 across its width, y in the same unit.
const fw = (fr.x1 - fr.x0) * s;
const ox = fr.x0 * s, oy = fr.y0 * s;
const norm = (v) => Math.round(v * 1000) / 1000;
const out = {
  note: 'Leonida outline traced by code from the official map (Rockstar Games). Not committed. Units: the width of the printed frame is 1.',
  aspect: norm(((fr.y1 - fr.y0) * s) / fw),
  points,
  paths: paths.map((p) => p.map(([x, y]) => [norm((x - ox) / fw), norm((y - oy) / fw)])),
};
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'coast.json'), JSON.stringify(out));
console.log(`coast   ${paths.length} outlines, ${points} points (epsilon ${eps.toFixed(2)} px at 1/${SCALE}), ${JSON.stringify(out).length} bytes`);

// A coarse text preview of the land mask for checking the trace without opening the map.
if (process.argv.includes('--preview')) {
  const fine = process.argv.includes('--fine');
  const cw = fine ? 4 : 8, ch = fine ? 8 : 16;
  for (let y = 0; y < H; y += ch) {
    let line = '';
    for (let x = 0; x < W; x += cw) {
      let sum = 0;
      for (let dy = 0; dy < ch; dy++) for (let dx = 0; dx < cw; dx++) sum += at(x + dx, y + dy);
      line += sum > (cw * ch) / 2 ? '#' : sum > 0 ? '+' : '.';
    }
    console.log(line);
  }
}
