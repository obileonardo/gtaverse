// Traces the Leonida coastline from the official map for the hero's line art.
// Run with: pnpm media:coast (after pnpm map:fetch). Part of pnpm media:build.
//
// The map is read as numbers only, by code (docs/MAP.md, decisions OS7 and M3D4): no person or AI tool
// looks at the map here. The outline is a derived shape of Rockstar's map, so it is written to the
// git-ignored public/media/hero/coast.json, never committed.
//
// 1. Classify every pixel inside the printed frame as sea (the map's saturated cyan), land (the greens and
//    greys of the ground) or unsure (print: labels, roads, grid lines, light shallows), by colour.
// 2. Give each unsure pixel the class of the nearest sure pixel, so print on land is land and print on the
//    sea is sea.
// 3. Clean with a morphological close then open (removes rivers, canals and lettering on land, and specks
//    in the sea), keep only water that reaches the frame as sea (lakes are filled), drop small islands.
// 4. Trace each island's outer edge as one closed loop, smooth it with a Gaussian, simplify it
//    (Douglas-Peucker) to a point budget, and resample nothing else: the result is a few continuous outlines.
//
// MAP_IMAGE overrides the source path (default .cache/map/<image_name> from content/map.json).
// --preview prints a coarse text picture of the final land mask (our mask, not the map).

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

const SCALE = 4; // work at 1/4 of the poster: 1444 x 1975
const { data, info } = await sharp(src)
  .toColourspace('srgb')
  .resize({ width: Math.round(map.image.width / SCALE) })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const N = W * H;
const s = W / map.image.width;
const fr = map.grid.frame;
const fx0 = Math.ceil(fr.x0 * s) + 3, fx1 = Math.floor(fr.x1 * s) - 3;
const fy0 = Math.ceil(fr.y0 * s) + 3, fy1 = Math.floor(fr.y1 * s) - 3;
const inFrame = (x, y) => x >= fx0 && x < fx1 && y >= fy0 && y < fy1;

// 1. Classify. 0 = sea, 1 = land, 2 = unsure. Outside the frame is sea.
// Sea is a saturated cyan: almost no red, strong green and blue. Ground is green or grey: red well above
// zero and blue not far above red. Everything else (white print, light or dark teal edges) is unsure.
const SEA = 0, LAND = 1, UNSURE = 2;
const cls = new Uint8Array(N);
let counts = [0, 0, 0];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!inFrame(x, y)) {
      cls[p] = SEA;
      continue;
    }
    const i = p * C;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let c = UNSURE;
    if (r < 70 && b > 150 && g > 140) c = SEA;
    else if (r > 50 && r < 200 && b - r < 50 && !(r > 200 && g > 200 && b > 200)) c = LAND;
    cls[p] = c;
    counts[c]++;
  }
}

// 2. Unsure pixels take the class of the nearest sure pixel (breadth first from every sure pixel at once).
{
  let frontier = [];
  for (let p = 0; p < N; p++) if (cls[p] !== UNSURE) frontier.push(p);
  while (frontier.length) {
    const next = [];
    for (const p of frontier) {
      const x = p % W, y = (p - x) / W;
      for (const n of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (n >= 0 && cls[n] === UNSURE) {
          cls[n] = cls[p];
          next.push(n);
        }
      }
    }
    frontier = next;
  }
}
let land = new Uint8Array(N);
for (let p = 0; p < N; p++) land[p] = cls[p] === LAND ? 1 : 0;

// 3. Clean. Square erosion and dilation through running sums (separable, so cheap at any radius).
const morph = (m, r, grow) => {
  // grow: a pixel is set when any pixel in the (2r+1) square is set; otherwise only when all are.
  const tmp = new Uint8Array(N), out = new Uint8Array(N);
  const need = grow ? 1 : 2 * r + 1;
  for (let y = 0; y < H; y++) {
    let sum = 0;
    const row = y * W;
    for (let x = -r; x < W + r; x++) {
      if (x + r < W && x + r >= 0) sum += m[row + x + r];
      else if (x + r >= W && !grow) sum += 0;
      if (x - r - 1 >= 0) sum -= m[row + x - r - 1];
      if (x >= 0 && x < W) tmp[row + x] = sum >= need ? 1 : 0;
    }
  }
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = -r; y < H + r; y++) {
      if (y + r < H && y + r >= 0) sum += tmp[(y + r) * W + x];
      if (y - r - 1 >= 0) sum -= tmp[(y - r - 1) * W + x];
      if (y >= 0 && y < H) out[y * W + x] = sum >= need ? 1 : 0;
    }
  }
  return out;
};
const CLOSE = 4; // px at 1/4: channels narrower than about 9 px (36 px on the poster) close up
const OPEN = 5; // land thinner than about 11 px (bridges, causeways, piers) goes
land = morph(morph(land, CLOSE, true), CLOSE, false);
land = morph(morph(land, OPEN, false), OPEN, true);

// Components, 4-connected.
const label = (m, value) => {
  const lab = new Int32Array(N).fill(-1);
  const areas = [];
  const stack = [];
  for (let p = 0; p < N; p++) {
    if (m[p] !== value || lab[p] !== -1) continue;
    const id = areas.length;
    let area = 0;
    lab[p] = id;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop();
      area += 1;
      const x = q % W, y = (q - x) / W;
      if (x > 0 && m[q - 1] === value && lab[q - 1] === -1) (lab[q - 1] = id), stack.push(q - 1);
      if (x < W - 1 && m[q + 1] === value && lab[q + 1] === -1) (lab[q + 1] = id), stack.push(q + 1);
      if (y > 0 && m[q - W] === value && lab[q - W] === -1) (lab[q - W] = id), stack.push(q - W);
      if (y < H - 1 && m[q + W] === value && lab[q + W] === -1) (lab[q + W] = id), stack.push(q + W);
    }
    areas.push(area);
  }
  return { lab, areas };
};

// Only water connected to the edge of the image is sea; every enclosed lake or river is filled.
{
  const water = label(land, 0);
  const sea = water.lab[0];
  for (let p = 0; p < N; p++) if (!land[p] && water.lab[p] !== sea) land[p] = 1;
}

// Keep the main island and the major islands: at least MIN_SHARE of the main island's area, at most MAX_ISLANDS.
const MIN_SHARE = 0.004;
const MAX_ISLANDS = 12;
const comps = label(land, 1);
const ranked = comps.areas.map((a, id) => ({ id, a })).sort((p, q) => q.a - p.a);
const mainArea = ranked[0]?.a ?? 0;
const keep = new Set(ranked.filter((c) => c.a >= mainArea * MIN_SHARE).slice(0, MAX_ISLANDS + 1).map((c) => c.id));

// 4. Trace the outer edge of each kept island (Moore neighbour tracing on its pixels).
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const traceOuter = (id) => {
  // Start at the island's top-most, then left-most pixel: its west and north neighbours are outside.
  let start = -1;
  for (let p = 0; p < N && start < 0; p++) if (comps.lab[p] === id) start = p;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && comps.lab[y * W + x] === id;
  const sx = start % W, sy = (start - sx) / W;
  const pts = [[sx, sy]];
  let x = sx, y = sy, back = 4; // we arrived from the west
  for (let guard = 0; guard < N; guard++) {
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const d = (back + k) % 8;
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (inside(nx, ny)) {
        x = nx;
        y = ny;
        back = (d + 4) % 8;
        found = true;
        break;
      }
    }
    if (!found || (x === sx && y === sy)) break;
    pts.push([x, y]);
  }
  return pts;
};

const smooth = (pts, sigma) => {
  const n = pts.length, k = Math.ceil(sigma * 3);
  const wts = Array.from({ length: 2 * k + 1 }, (_, i) => Math.exp(-((i - k) ** 2) / (2 * sigma * sigma)));
  const tot = wts.reduce((a, b) => a + b, 0);
  return pts.map((_, i) => {
    let sx = 0, sy = 0;
    for (let j = -k; j <= k; j++) {
      const q = pts[(((i + j) % n) + n) % n];
      sx += q[0] * wts[j + k];
      sy += q[1] * wts[j + k];
    }
    return [sx / tot, sy / tot];
  });
};
const simplify = (pts, eps) => {
  if (pts.length < 3) return pts;
  const keepPt = new Uint8Array(pts.length);
  keepPt[0] = keepPt[pts.length - 1] = 1;
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
      keepPt[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keepPt[i]);
};
// A closed loop simplified from two opposite anchors, so both halves keep their shape.
const simplifyLoop = (pts, eps) => {
  const mid = Math.floor(pts.length / 2);
  const a = simplify(pts.slice(0, mid + 1), eps), b = simplify([...pts.slice(mid), pts[0]], eps);
  return [...a, ...b.slice(1, -1)];
};
const loopArea = (pts) => Math.abs(pts.reduce((acc, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length];
  return acc + x * ny - nx * y;
}, 0) / 2);

const SIGMA = 6.5; // px at 1/4: the Gaussian that turns the pixel edge into a drawn line
const BUDGET = 640;
const raw = ranked.filter((c) => keep.has(c.id)).map((c) => smooth(traceOuter(c.id), SIGMA));
let eps = 0.9;
let paths = [];
for (let tries = 0; tries < 16; tries++) {
  paths = raw.map((l) => simplifyLoop(l, eps)).filter((p) => p.length >= 6);
  if (paths.reduce((n, p) => n + p.length, 0) <= BUDGET) break;
  eps *= 1.15;
}
paths.sort((a, b) => loopArea(b) - loopArea(a));
const points = paths.reduce((n, p) => n + p.length, 0);
const rawPoints = raw.reduce((n, p) => n + p.length, 0);

// Normalise to the printed frame: 0..1 across its width, y in the same unit.
const fw = (fr.x1 - fr.x0) * s;
const ox = fr.x0 * s, oy = fr.y0 * s;
const q = (v) => Math.round(v * 1000) / 1000;
const out = {
  note: 'Leonida outline traced by code from the official map (Rockstar Games). Not committed. Units: the width of the printed frame is 1.',
  aspect: q(((fr.y1 - fr.y0) * s) / fw),
  points,
  paths: paths.map((p) => p.map(([x, y]) => [q((x - ox) / fw), q((y - oy) / fw)])),
};
mkdirSync(outDir, { recursive: true });
const json = JSON.stringify(out);
writeFileSync(join(outDir, 'coast.json'), json);
const frameN = (fx1 - fx0) * (fy1 - fy0);
console.log(`coast   classes: sea ${(counts[0] / frameN * 100).toFixed(1)}%, land ${(counts[1] / frameN * 100).toFixed(1)}%, unsure ${(counts[2] / frameN * 100).toFixed(1)}%`);
console.log(`coast   ${comps.areas.length} land masses after cleaning, kept ${keep.size}; traced ${rawPoints} edge points`);
console.log(`coast   ${paths.length} outlines, ${points} points (epsilon ${eps.toFixed(2)} px at 1/${SCALE}), ${json.length} bytes; per outline ${paths.map((p) => p.length).join(', ')}`);

// A coarse text picture of the final land mask (our cleaned mask, not the map).
if (process.argv.includes('--preview')) {
  const cw = 12, ch = 24;
  for (let y = 0; y < H; y += ch) {
    let line = '';
    for (let x = 0; x < W; x += cw) {
      let sum = 0;
      for (let dy = 0; dy < ch && y + dy < H; dy++) for (let dx = 0; dx < cw && x + dx < W; dx++) sum += keep.has(comps.lab[(y + dy) * W + x + dx]) ? 1 : 0;
      line += sum > (cw * ch) / 2 ? '#' : sum > 0 ? '+' : '.';
    }
    console.log(line);
  }
}
