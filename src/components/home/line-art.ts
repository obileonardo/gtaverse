// The hero's line art mode: original wireframe drawings, white hairlines on the night navy, pink used once
// per shot. A few thousand 3D segments are projected by a small perspective camera onto a 2D canvas: no
// Three.js, no images (Three.js would add about 150 KB for the same look). Each shot draws itself on while the
// camera drifts slowly: an outline draws as one continuous pen stroke along its length, a single edge grows
// from its first end.
// Shots: Leonida's coastline (traced by code from the official map at build time, public/media/hero/coast.json),
// a muscle coupe of our own design on a palm street, a pistol and a pump shotgun of our own design, and a person
// walking a dog past an art deco front (both walk, in step).

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
export type Strokes = {
  pos: Float32Array; // 6 per segment: a then b
  start: Float32Array; // s: when the segment's stroke starts
  dur: Float32Array; // s: how long that whole stroke takes
  c0: Float32Array; // where the segment starts and ends along its stroke, 0..1
  c1: Float32Array;
  curve: Uint8Array;
  kind: Uint8Array;
};
export type Shot = {
  name: string;
  credit: string;
  fixed: Strokes;
  // Moving figures: their segments are built again every frame, in the same order, so they draw on the same way.
  pose?: (t: number) => Strokes;
  camera: (t: number) => Cam;
  // Keep the drawing's bright lines inside the page's free band (below the island, intro and caption): the shot
  // moves down, then scales down, when its default framing would reach above or below it.
  fit?: boolean;
};

const NORMAL = 0, DIM = 1, ACCENT = 2;

// Timing. Strokes start across DRAW_SPAN in their order; a single edge takes STROKE to draw, an outline takes
// its share of the span plus STROKE. Everything is down by DRAW_START + DRAW_SPAN + STROKE (3.75 s).
export const DRAW_START = 0.25;
export const DRAW_SPAN = 2.8;
export const STROKE = 0.7;

// The motion tokens (src/styles/tokens.css): --ease-out for a single edge, --ease-standard for a pen stroke
// along an outline (it leaves and arrives gently instead of racing the first half).
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const N = 96;
  const lut = new Float32Array(N + 1);
  const at = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let lo = 0, hi = 1;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (at(mid, x1, x2) < x) lo = mid;
      else hi = mid;
    }
    lut[i] = at((lo + hi) / 2, y1, y2);
  }
  return (k: number) => {
    const f = k * N, i = Math.floor(f);
    return i >= N ? 1 : lut[i] + (lut[i + 1] - lut[i]) * (f - i);
  };
}
const OUT = 0, STANDARD = 1;
const CURVES = [bezier(0.23, 1, 0.32, 1), bezier(0.4, 0, 0.2, 1)];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

class Draft {
  pos: number[] = [];
  start: number[] = [];
  dur: number[] = [];
  c0: number[] = [];
  c1: number[] = [];
  curve: number[] = [];
  kind: number[] = [];
  // Optional placement applied to every point (used to pose an object built in its own coordinates).
  xf: ((p: V3) => V3) | null = null;
  private push(a: V3, b: V3, start: number, dur: number, c0: number, c1: number, curve: number, kind: number) {
    if (this.xf) (a = this.xf(a)), (b = this.xf(b));
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    this.start.push(start);
    this.dur.push(dur);
    this.c0.push(c0);
    this.c1.push(c1);
    this.curve.push(curve);
    this.kind.push(kind);
  }
  // One edge that grows from a to b, starting at t (0..1 of the draw span).
  seg(a: V3, b: V3, t: number, kind = NORMAL) {
    this.push(a, b, DRAW_START + clamp01(t) * DRAW_SPAN, STROKE, 0, 1, OUT, kind);
  }
  // A polyline drawn as one pen stroke from its first point to its last, between t0 and t1.
  poly(pts: V3[], t0: number, t1: number, kind = NORMAL, closed = false) {
    const list = closed ? [...pts, pts[0]] : pts;
    const n = list.length - 1;
    if (n < 1) return;
    const cum = [0];
    for (let i = 0; i < n; i++) cum.push(cum[i] + Math.hypot(list[i + 1][0] - list[i][0], list[i + 1][1] - list[i][1], list[i + 1][2] - list[i][2]));
    const total = cum[n] || 1;
    const a = clamp01(t0), b = Math.max(clamp01(t1), a);
    const start = DRAW_START + a * DRAW_SPAN, dur = (b - a) * DRAW_SPAN + STROKE;
    for (let i = 0; i < n; i++) this.push(list[i], list[i + 1], start, dur, cum[i] / total, cum[i + 1] / total, STANDARD, kind);
  }
  ring(c: V3, r: number, axis: 'x' | 'y' | 'z', n: number, t0: number, t1: number, kind = NORMAL, from = 0, to = Math.PI * 2) {
    const pts: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      const u = Math.cos(a) * r, v = Math.sin(a) * r;
      pts.push(axis === 'x' ? [c[0], c[1] + v, c[2] + u] : axis === 'y' ? [c[0] + u, c[1], c[2] + v] : [c[0] + u, c[1] + v, c[2]]);
    }
    this.poly(pts, t0, t1, kind);
  }
  // Axis aligned box outline.
  box(c: V3, s: V3, t: number, kind = NORMAL) {
    const [x, y, z] = c, [w, h, d] = [s[0] / 2, s[1] / 2, s[2] / 2];
    const p = (i: number): V3 => [x + (i & 1 ? w : -w), y + (i & 2 ? h : -h), z + (i & 4 ? d : -d)];
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) this.seg(p(a), p(b), t, kind);
  }
  // A flat side profile (x, y) given thickness along z: both faces drawn as pen strokes, joined at every corner.
  extrude(profile: [number, number][], halfZ: number, t0: number, t1: number, kind = NORMAL, closed = true) {
    const face = (z: number) => profile.map(([x, y]): V3 => [x, y, z]);
    this.poly(face(halfZ), t0, t1, kind, closed);
    this.poly(face(-halfZ), t0 + 0.03, t1 + 0.03, kind, closed);
    profile.forEach(([x, y], i) => this.seg([x, y, halfZ], [x, y, -halfZ], t0 + ((t1 - t0) * i) / profile.length + 0.02, DIM));
  }
  // A tube along a path: a ring at each point (radius r, or [up, side] for an oval) and lines joining the rings.
  tube(path: V3[], radii: (number | [number, number])[], sides: number, t0: number, t1: number, kind = NORMAL) {
    const rings = path.map((p, i) => {
      const prev = path[Math.max(i - 1, 0)], nxt = path[Math.min(i + 1, path.length - 1)];
      const tan = norm(sub(nxt, prev));
      const ref: V3 = Math.abs(tan[1]) > 0.8 ? [1, 0, 0] : [0, 1, 0];
      const side = norm(cross(tan, ref)), up = cross(side, tan);
      const r = radii[i];
      const [ru, rs] = typeof r === 'number' ? [r, r] : r;
      return Array.from({ length: sides }, (_, k) => {
        const a = (k / sides) * Math.PI * 2;
        return add(p, add(scale(up, Math.cos(a) * ru), scale(side, Math.sin(a) * rs)));
      });
    });
    // Each ring draws as the pen reaches it; each line along the tube is one stroke from end to end.
    const n = rings.length;
    rings.forEach((ring, i) => {
      const t = t0 + ((t1 - t0) * i) / Math.max(n - 1, 1);
      this.poly(ring, t, t + 0.02, kind, true);
    });
    if (n > 1) for (let k = 0; k < sides; k++) this.poly(rings.map((ring) => ring[k]), t0 + 0.01, t1, kind);
  }
  strokes(): Strokes {
    return {
      pos: new Float32Array(this.pos),
      start: new Float32Array(this.start),
      dur: new Float32Array(this.dur),
      c0: new Float32Array(this.c0),
      c1: new Float32Array(this.c1),
      curve: new Uint8Array(this.curve),
      kind: new Uint8Array(this.kind),
    };
  }
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Places an object built in its own coordinates: scale, then turn (yaw about y, pitch about z, roll about x), then move.
function placement(at: V3, yaw: number, pitch = 0, roll = 0, s = 1) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  return (p: V3): V3 => {
    let [x, y, z] = [p[0] * s, p[1] * s, p[2] * s];
    [y, z] = [y * cr - z * sr, y * sr + z * cr];
    [x, y] = [x * cp - y * sp, x * sp + y * cp];
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    return [x + at[0], y + at[1], z + at[2]];
  };
}

// Two bone reach in the side plane: the middle joint for a limb from root towards target, bending forward
// (bend 1, a knee) or backward (bend -1, an elbow). Returns the joint and the reached end.
export function reach(root: [number, number], target: [number, number], l1: number, l2: number, bend: number) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-4), (l1 + l2) * 0.999);
  const a = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.min(Math.max((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1), 1));
  const joint: [number, number] = [root[0] + Math.cos(a + bend * alpha) * l1, root[1] + Math.sin(a + bend * alpha) * l1];
  const end: [number, number] = [root[0] + Math.cos(a) * d, root[1] + Math.sin(a) * d];
  return { joint, end };
}

// A foot's place relative to its hip over one gait cycle (phase 0..1): on the ground for `duty` of the cycle,
// sliding back exactly as fast as the body moves forward, then swung forward with a lift.
export function footPath(phase: number, duty: number, reachLen: number, lift: number) {
  const p = ((phase % 1) + 1) % 1;
  if (p < duty) return { x: lerp(reachLen / 2, -reachLen / 2, p / duty), y: 0, swing: 0 };
  const s = (p - duty) / (1 - duty);
  const k = (1 - Math.cos(Math.PI * s)) / 2;
  return { x: lerp(-reachLen / 2, reachLen / 2, k), y: Math.sin(Math.PI * s) * lift, swing: Math.sin(Math.PI * s) };
}

// ---------------------------------------------------------------- shared scenery
function palm(d: Draft, x: number, z: number, h: number, lean: number, t: number, kind = NORMAL) {
  const trunk: V3[] = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    trunk.push([x + lean * k * k, h * k, z]);
  }
  d.poly(trunk, t, t + 0.12, kind);
  for (let i = 1; i < 8; i += 2) d.ring(trunk[i], 0.16 - i * 0.01, 'y', 6, t + 0.02 * i, t + 0.02 * i + 0.04, DIM);
  const top = trunk[8];
  for (let f = 0; f < 8; f++) {
    const a = (f / 8) * Math.PI * 2 + 0.3;
    const len = 2.2 + (f % 3) * 0.35;
    const pts: V3[] = [];
    for (let i = 0; i <= 6; i++) {
      const s = i / 6;
      pts.push([top[0] + Math.cos(a) * len * s, top[1] + 0.7 * s - 1.9 * s * s, top[2] + Math.sin(a) * len * s]);
    }
    d.poly(pts, t + 0.12 + f * 0.012, t + 0.2 + f * 0.012, kind);
  }
}

function lamp(d: Draft, x: number, z: number, side: number, t: number) {
  d.poly([[x, 0, z], [x, 5.2, z], [x, 5.6, z + 0.35 * side], [x, 5.5, z + 1.3 * side]], t, t + 0.08, DIM);
  d.box([x, 5.4, z + 1.3 * side], [0.5, 0.12, 0.3], t + 0.08, DIM);
}

// ---------------------------------------------------------------- shot 1: Leonida
function coastShot(paths: number[][][], aspect: number): Shot {
  const d = new Draft();
  const S = 7;
  const at = (p: number[], y: number): V3 => [(p[0] - 0.5) * S, y, (p[1] - aspect / 2) * S];
  // The printed grid of the poster: 600 px cells across a 5,395 px wide frame.
  const cell = (600 / 5395) * S;
  for (let gx = -S / 2; gx <= S / 2 + 0.01; gx += cell) d.seg([gx, 0, (-aspect * S) / 2], [gx, 0, (aspect * S) / 2], 0, DIM);
  for (let gz = (-aspect * S) / 2; gz <= (aspect * S) / 2 + 0.01; gz += cell) d.seg([-S / 2, 0, gz], [S / 2, 0, gz], 0.02, DIM);

  // The main island as one continuous stroke, then the islands in turn, largest first.
  const H = 0.22;
  paths.forEach((p, i) => {
    const t0 = i === 0 ? 0.05 : 0.5 + ((i - 1) / Math.max(paths.length - 1, 1)) * 0.3;
    const t1 = i === 0 ? 0.6 : t0 + 0.08;
    d.poly(p.map((q) => at(q, H)), t0, t1, NORMAL, true);
  });

  // One pink pin on the main coast's east shore, a third of the way up from its southern end.
  const main = paths[0];
  if (main) {
    const ys = main.map((q) => q[1]);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const band = main.filter((q) => q[1] > lerp(y0, y1, 0.55) && q[1] < lerp(y0, y1, 0.7));
    const east = band.reduce((m, q) => (q[0] > m[0] ? q : m), band[0] ?? main[0]);
    const base = at(east, H);
    const tip = add(base, [0, 0.9, 0]);
    d.seg(base, tip, 0.85, ACCENT);
    d.poly([add(tip, [0.12, 0.14, 0]), add(tip, [0, 0.28, 0]), add(tip, [-0.12, 0.14, 0]), tip], 0.88, 0.95, ACCENT, true);
    d.ring(base, 0.2, 'y', 16, 0.9, 1, ACCENT);
  }
  return {
    name: 'Leonida',
    // Two lines in the caption (Hero.astro keeps the break).
    credit: 'Line art: The Vice Files.\nCoastline from the official map, Rockstar Games',
    fit: true,
    fixed: d.strokes(),
    camera: (t) => {
      const a = 0.42 + t * 0.016;
      return { pos: [Math.sin(a) * 9.6, 14.6 - t * 0.05, Math.cos(a) * 9.6 + 1.2], target: [0.2, 0, 0.1], fov: 40 };
    },
  };
}

// ---------------------------------------------------------------- shot 2: a coupe on a palm street
function carShot(): Shot {
  const d = new Draft();
  // Road and sidewalks (z grows away from the camera).
  for (const [z, kind] of [[-1.8, NORMAL], [-3.6, DIM], [6.4, DIM], [8.2, DIM]] as const) d.seg([-40, 0, z], [40, 0, z], 0, kind);
  for (let x = -40; x < 40; x += 4) d.seg([x, 0, 2.3], [x + 2, 0, 2.3], 0.02 + (x + 40) / 2000, DIM);
  for (let x = -40; x < 40; x += 1.6) d.seg([x, 0, -1.8], [x, 0, -3.6], 0.04, DIM);

  // Body: cross sections from the front (x = 2.4) to the rear (x = -2.42). Each is [x, sill half width,
  // shoulder height, shoulder half width, top height, top half width]. Long hood, short deck, fastback.
  const st: number[][] = [
    [2.42, 0.82, 0.62, 0.84, 0.68, 0.7],
    [2.25, 0.92, 0.8, 0.93, 0.84, 0.78],
    [1.3, 0.95, 0.84, 0.95, 0.9, 0.8],
    [0.72, 0.95, 0.86, 0.95, 0.92, 0.8],
    [0.05, 0.95, 0.88, 0.94, 1.3, 0.7],
    [-0.9, 0.95, 0.9, 0.95, 1.27, 0.68],
    [-1.8, 0.95, 0.92, 0.95, 0.98, 0.8],
    [-2.3, 0.94, 0.9, 0.94, 0.95, 0.8],
    [-2.42, 0.86, 0.7, 0.86, 0.75, 0.72],
  ];
  const section = (s: number[]): V3[] => {
    const [x, w, yb, wb, yt, wt] = s;
    return [[x, 0.3, w], [x, yb, wb], [x, yt, wt], [x, yt, -wt], [x, yb, -wb], [x, 0.3, -w]];
  };
  const secs = st.map(section);
  secs.forEach((sec, i) => d.poly(sec, 0.15 + i * 0.03, 0.2 + i * 0.03, NORMAL));
  for (let k = 0; k < 6; k++) d.poly(secs.map((sec) => sec[k]), 0.1 + k * 0.02, 0.45 + k * 0.02, NORMAL);
  d.poly([secs[0][0], secs[0][5]], 0.2, 0.22, NORMAL);
  d.poly([secs[8][0], secs[8][5]], 0.4, 0.42, NORMAL);
  // Side windows and the B pillar.
  for (const z of [1, -1]) {
    d.poly([[0.6, 0.93, 0.92 * z], [0.0, 1.24, 0.72 * z], [-0.95, 1.22, 0.7 * z], [-1.65, 0.97, 0.9 * z]], 0.5, 0.58, DIM);
    d.seg([-0.4, 0.92, 0.94 * z], [-0.45, 1.25, 0.7 * z], 0.58, DIM);
    d.seg([1.0, 0.6, 0.955 * z], [-0.4, 0.6, 0.955 * z], 0.6, DIM);
  }
  // Wheels, arches, hubs.
  for (const x of [1.45, -1.5]) {
    for (const z of [0.9, -0.9]) {
      d.ring([x, 0.34, z], 0.34, 'z', 20, 0.55, 0.65);
      d.ring([x, 0.34, z], 0.2, 'z', 14, 0.62, 0.68, DIM);
      for (let s = 0; s < 5; s++) {
        const a = (s / 5) * Math.PI * 2;
        d.seg([x + Math.cos(a) * 0.05, 0.34 + Math.sin(a) * 0.05, z], [x + Math.cos(a) * 0.2, 0.34 + Math.sin(a) * 0.2, z], 0.68, DIM);
      }
      d.ring([x, 0.34, z * 1.04], 0.44, 'z', 14, 0.5, 0.56, NORMAL, 0, Math.PI);
    }
  }
  // Quad headlights and a split grille.
  for (const z of [0.58, 0.36, -0.36, -0.58]) d.ring([2.43, 0.56, z], 0.07, 'x', 10, 0.7, 0.74);
  d.box([2.43, 0.5, 0], [0.01, 0.16, 0.36], 0.72, DIM);
  // Tail lights: the shot's one pink touch.
  for (const z of [0.5, -0.5]) d.box([-2.43, 0.66, z], [0.01, 0.07, 0.38], 0.8, ACCENT);

  // Street: palms across the road, lamps on the near side, low buildings behind.
  [-15, -7.5, 0, 7.5, 15].forEach((x, i) => palm(d, x + 2, 7.4, 6.5 + (i % 2) * 1.2, 0.8 - (i % 3) * 0.6, 0.25 + i * 0.07));
  [-10, 6].forEach((x, i) => lamp(d, x, -2.6, 1, 0.3 + i * 0.1));
  [[-14, 8], [-4, 6], [6, 9], [16, 7]].forEach(([x, h], i) => {
    d.box([x, h / 2, 13], [9, h, 4], 0.35 + i * 0.05, DIM);
    for (let y = 1.5; y < h; y += 1.5) d.seg([x - 4.5, y, 11], [x + 4.5, y, 11], 0.4 + i * 0.05, DIM);
  });

  return {
    name: 'Coupe',
    credit: 'Line art: The Vice Files',
    fixed: d.strokes(),
    camera: (t) => {
      const a = -0.9 + t * 0.012;
      return { pos: [Math.cos(a) * 12 + 0.2, 1.6 + t * 0.02, Math.sin(a) * 12], target: [0, 1.0, 1.0], fov: 40 };
    },
  };
}

// ---------------------------------------------------------------- shot 3: sidearms
// Our own generic designs, not any real or in-game model: a compact semi-automatic pistol and a pump shotgun,
// floating over a floor grid like a product study. Units: 1 = 10 cm, so the pistol is about 20 cm long.
function pistol(d: Draft) {
  // Slide, with chamfered ends.
  d.extrude([[0, 1.0], [0, 1.3], [0.06, 1.36], [1.98, 1.36], [2.04, 1.3], [2.04, 1.06], [1.98, 1.0]], 0.13, 0.12, 0.3);
  // Frame and grip in one outline: dust cover, the frame behind the trigger guard, the raked grip, the
  // magazine base, the backstrap and the beavertail.
  d.extrude([
    [0.06, 1.0], [1.96, 1.0], [1.96, 0.86], [1.3, 0.86], [1.24, 0.8], [0.8, 0.8], [0.7, 0.74], [0.62, 0.6],
    [0.46, 0.0], [0.48, -0.05], [0.46, -0.11], [-0.11, -0.11], [-0.12, -0.04], [-0.09, -0.01],
    [0.05, 0.62], [-0.04, 0.8], [-0.17, 0.86], [-0.12, 0.95],
  ], 0.14, 0.2, 0.42);
  // Trigger guard and trigger.
  const guard: [number, number][] = [[1.24, 0.8], [1.24, 0.62], [1.18, 0.52], [1.02, 0.48], [0.84, 0.5], [0.74, 0.58], [0.7, 0.74]];
  d.extrude(guard, 0.06, 0.4, 0.48, NORMAL, false);
  d.poly([[0.99, 0.8, 0], [0.97, 0.7, 0], [0.92, 0.6, 0], [0.95, 0.55, 0]], 0.5, 0.54);
  // Muzzle, sights.
  d.ring([2.045, 1.18, 0], 0.075, 'x', 16, 0.46, 0.52);
  d.ring([2.05, 1.18, 0], 0.045, 'x', 12, 0.5, 0.54, DIM);
  d.box([1.9, 1.4, 0], [0.08, 0.08, 0.05], 0.54);
  d.box([0.14, 1.4, 0], [0.1, 0.08, 0.22], 0.54);
  // Rear serrations, the ejection port and the grip panels.
  for (const z of [0.131, -0.131]) {
    for (let x = 0.16; x < 0.56; x += 0.065) d.seg([x, 1.05, z], [x + 0.03, 1.31, z], 0.56 + x * 0.05, DIM);
    d.poly([[0.12, 0.56, z * 1.09], [0.52, 0.56, z * 1.09], [0.39, 0.06, z * 1.09], [0.0, 0.06, z * 1.09]], 0.58, 0.64, DIM, true);
  }
  d.poly([[0.95, 1.18, 0.131], [1.45, 1.18, 0.131], [1.45, 1.36, 0.131], [0.95, 1.36, 0.131]], 0.6, 0.64, DIM, true);
}

function shotgun(d: Draft) {
  // Receiver, ejection port, trigger guard and trigger.
  d.extrude([[0, 0], [0, 0.6], [0.14, 0.7], [2.1, 0.7], [2.2, 0.6], [2.2, 0]], 0.17, 0.1, 0.24);
  d.poly([[0.7, 0.34, 0.171], [1.6, 0.34, 0.171], [1.6, 0.58, 0.171], [0.7, 0.58, 0.171]], 0.3, 0.34, DIM, true);
  d.extrude([[0.55, 0], [0.55, -0.3], [0.72, -0.42], [1.12, -0.42], [1.3, -0.22], [1.3, 0]], 0.05, 0.3, 0.36, NORMAL, false);
  d.poly([[0.95, 0, 0], [0.92, -0.14, 0], [0.86, -0.24, 0], [0.9, -0.3, 0]], 0.36, 0.38);
  // Barrel and the magazine tube under it, joined by a clamp near the muzzle; a bead on the muzzle.
  d.tube([[2.2, 0.5, 0], [4.5, 0.5, 0], [7.6, 0.5, 0]], [0.11, 0.11, 0.11], 8, 0.2, 0.42);
  d.ring([7.6, 0.5, 0], 0.06, 'x', 12, 0.44, 0.48, DIM);
  d.tube([[2.2, 0.22, 0], [7.0, 0.22, 0]], [0.1, 0.1], 8, 0.24, 0.4, DIM);
  d.box([6.85, 0.36, 0], [0.16, 0.42, 0.26], 0.46);
  d.ring([7.56, 0.64, 0], 0.025, 'x', 8, 0.5, 0.52);
  // The pump: a ribbed forend around the magazine tube.
  d.tube([[3.6, 0.24, 0], [3.75, 0.24, 0], [5.25, 0.24, 0], [5.4, 0.24, 0]], [[0.16, 0.15], [0.2, 0.19], [0.2, 0.19], [0.16, 0.15]], 10, 0.3, 0.44);
  for (let x = 3.95; x < 5.1; x += 0.17) d.ring([x, 0.24, 0], 0.205, 'x', 18, 0.44 + (x - 3.9) * 0.04, 0.48 + (x - 3.9) * 0.04, DIM);
  // Stock: comb, butt with its recoil pad, the underline and the wrist.
  d.extrude([
    [0, 0.66], [-0.4, 0.6], [-3.3, 0.5], [-3.42, 0.48], [-3.5, 0.3], [-3.58, -0.55], [-3.52, -0.62],
    [-1.6, -0.3], [-0.7, -0.08], [-0.35, 0.06], [0, 0.08],
  ], 0.16, 0.14, 0.34);
  for (const z of [0.161, -0.161]) d.poly([[-3.32, 0.47], [-3.4, 0.28], [-3.46, -0.5]].map(([x, y]): V3 => [x, y, z]), 0.36, 0.4, DIM);
}

function shell(d: Draft, at: V3, t: number, kind: number) {
  const [x, , z] = at;
  d.ring([x, 0, z], 0.12, 'y', 14, t, t + 0.03, kind);
  d.ring([x, 0.14, z], 0.12, 'y', 14, t + 0.02, t + 0.05, kind);
  d.ring([x, 0.72, z], 0.11, 'y', 14, t + 0.04, t + 0.07, kind);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    d.seg([x + Math.cos(a) * 0.12, 0, z + Math.sin(a) * 0.12], [x + Math.cos(a) * 0.11, 0.72, z + Math.sin(a) * 0.11], t + 0.03, kind);
    d.seg([x + Math.cos(a) * 0.11, 0.72, z + Math.sin(a) * 0.11], [x, 0.68, z], t + 0.07, kind);
  }
}

function armsShot(): Shot {
  const d = new Draft();
  // A studio floor: a square grid fading back.
  for (let x = -12; x <= 12; x += 1.5) d.seg([x, 0, -13.5], [x, 0, 6], 0, DIM);
  for (let z = -13.5; z <= 6; z += 1.5) d.seg([-12, 0, z], [12, 0, z], 0.02, DIM);
  // The shotgun hangs behind, nearly level; the pistol floats in front, turned towards the camera.
  d.xf = placement([-3.0, 2.75, -1.4], 0.1, 0.05, 0.05, 0.86);
  shotgun(d);
  d.xf = placement([1.3, 0.75, 2.0], -0.62, 0.05, 0, 1.4);
  pistol(d);
  d.xf = null;
  // Shells stood on the floor: the shot's one pink touch is the last one.
  shell(d, [3.55, 0, 0.2], 0.7, NORMAL);
  shell(d, [4.25, 0, 0.55], 0.74, NORMAL);
  shell(d, [3.8, 0, 1.15], 0.82, ACCENT);
  return {
    name: 'Sidearms',
    fit: true,
    credit: 'Line art: The Vice Files',
    fixed: d.strokes(),
    camera: (t) => {
      const a = 0.22 + t * 0.012;
      return { pos: [Math.sin(a) * 17 + 0.6, 4.8 - t * 0.02, Math.cos(a) * 17], target: [0.6, 1.45, 0], fov: 40 };
    },
  };
}

// ---------------------------------------------------------------- shot 4: a walk with the dog
// Both walk at WALK m/s towards +x. The person takes a stride every STRIDE s; the dog's four beat walk takes
// three strides for the person's two, so their feet stay in step and nothing slides on the ground.
export const WALK = 0.62;
export const STRIDE = 1.15;
export const DOG_STRIDE = (STRIDE * 2) / 3;
// The share of each cycle a foot spends on the ground.
export const PERSON_DUTY = 0.62;
export const DOG_DUTY = 0.65;

function walker(d: Draft, t: number, x0: number) {
  const ph = t / STRIDE;
  const bob = 0.014 * Math.cos(ph * Math.PI * 4);
  const hipY = 0.93 + bob;
  const reachLen = WALK * STRIDE * PERSON_DUTY;
  // Legs: hips either side, a two bone reach to the ankle, a foot that rolls off the toe in the swing.
  // The far leg and arm are drawn dim, so the near ones read in front.
  const legs = [{ z: 0.09, off: 0.5, kind: NORMAL }, { z: -0.09, off: 0, kind: DIM }];
  legs.forEach(({ z, off, kind }, i) => {
    const f = footPath(ph + off, PERSON_DUTY, reachLen, 0.1);
    const ankle: [number, number] = [x0 + f.x + 0.02, 0.08 + f.y];
    const { joint: knee, end } = reach([x0, hipY], ankle, 0.46, 0.45, 1);
    const pitch = -0.45 * f.swing;
    const toe: V3 = [end[0] + Math.cos(pitch) * 0.2, end[1] - 0.06 + Math.sin(pitch) * 0.2, z];
    const heel: V3 = [end[0] - 0.05, end[1] - 0.07, z];
    d.tube([[x0, hipY, z], [knee[0], knee[1], z], [end[0], end[1], z]], [0.075, 0.055, 0.04], 6, 0.55 + i * 0.02, 0.6 + i * 0.02, kind);
    d.poly([heel, [end[0], end[1], z], toe, [toe[0] - 0.04, toe[1] - 0.03, z], heel], 0.6 + i * 0.02, 0.62 + i * 0.02, kind);
  });
  // Torso and head, leaning a touch into the walk.
  const lean = 0.03;
  d.tube([[x0, hipY, 0], [x0 + 0.01, hipY + 0.17, 0], [x0 + 0.03, hipY + 0.37, 0], [x0 + lean + 0.01, hipY + 0.51, 0], [x0 + lean + 0.02, hipY + 0.59, 0]],
    [[0.11, 0.17], [0.1, 0.15], [0.12, 0.19], [0.1, 0.2], [0.05, 0.05]], 8, 0.42, 0.5);
  const hy = hipY + 0.62;
  d.tube([[x0 + 0.05, hy, 0], [x0 + 0.06, hy + 0.05, 0], [x0 + 0.065, hy + 0.12, 0], [x0 + 0.06, hy + 0.19, 0], [x0 + 0.055, hy + 0.24, 0]], [0.04, 0.09, 0.105, 0.085, 0.02], 8, 0.48, 0.54);
  // Arms: the far one swings against the near leg; the near one holds the leash low and forward.
  const sh = hipY + 0.49;
  const swing = 0.32 * Math.sin(ph * Math.PI * 2);
  const farElbow: [number, number] = [x0 + 0.04 + Math.sin(swing) * 0.3, sh - Math.cos(swing) * 0.3];
  const fa = swing + 0.2 + 0.18 * Math.max(0, Math.sin(ph * Math.PI * 2));
  const farHand: [number, number] = [farElbow[0] + Math.sin(fa) * 0.28, farElbow[1] - Math.cos(fa) * 0.28];
  d.tube([[x0 + 0.04, sh, -0.2], [farElbow[0], farElbow[1], -0.22], [farHand[0], farHand[1], -0.22]], [0.045, 0.04, 0.03], 6, 0.52, 0.56, DIM);
  const ua = 0.24 + 0.05 * Math.sin(ph * Math.PI * 2 + Math.PI);
  const nearElbow: [number, number] = [x0 + 0.04 + Math.sin(ua) * 0.3, sh - Math.cos(ua) * 0.3];
  const hand: V3 = [nearElbow[0] + Math.sin(0.92) * 0.28, nearElbow[1] - Math.cos(0.92) * 0.28, 0.24];
  d.tube([[x0 + 0.04, sh, 0.2], [nearElbow[0], nearElbow[1], 0.22], hand], [0.045, 0.04, 0.03], 6, 0.52, 0.56);
  return hand;
}

function dog(d: Draft, t: number, x0: number, z: number) {
  const ph = t / DOG_STRIDE;
  const bob = 0.008 * Math.cos(ph * Math.PI * 4);
  const p = (x: number, y: number, dz = 0): V3 => [x0 + x, y + bob, z + dz];
  // Body: croup, a tucked loin, a deep chest, the withers, then the neck rising to the head.
  d.tube([p(0.0, 0.5), p(0.1, 0.52), p(0.22, 0.5), p(0.36, 0.46), p(0.5, 0.45), p(0.6, 0.49), p(0.67, 0.57), p(0.72, 0.66)],
    [[0.1, 0.085], [0.1, 0.085], [0.085, 0.075], [0.14, 0.105], [0.15, 0.11], [0.13, 0.1], [0.095, 0.08], [0.075, 0.065]], 8, 0.62, 0.68);
  // Head: a rounded skull, a stop, a tapering muzzle; soft ears hanging at the sides; the nose.
  d.tube([p(0.69, 0.7), p(0.74, 0.735), p(0.81, 0.735), p(0.86, 0.71), p(0.91, 0.69), p(0.96, 0.675)],
    [[0.06, 0.06], [0.075, 0.07], [0.07, 0.065], [0.05, 0.045], [0.042, 0.038], [0.032, 0.03]], 8, 0.66, 0.72);
  for (const s of [1, -1]) d.poly([p(0.75, 0.77, 0.055 * s), p(0.8, 0.73, 0.08 * s), p(0.79, 0.63, 0.085 * s), p(0.74, 0.645, 0.075 * s), p(0.72, 0.74, 0.06 * s)], 0.72, 0.75, s > 0 ? NORMAL : DIM);
  d.ring(p(0.97, 0.675), 0.02, 'x', 8, 0.74, 0.76);
  // Tail: up and out in a soft curve, wagging a little.
  const wag = 0.05 * Math.sin(ph * Math.PI * 2);
  d.tube([p(-0.02, 0.52), p(-0.12, 0.555, wag * 0.3), p(-0.21, 0.6, wag * 0.7), p(-0.28, 0.67, wag)], [0.032, 0.026, 0.018, 0.008], 5, 0.78, 0.8);
  // Legs, in the order of a walk: left hind, left fore, right hind, right fore.
  const reachLen = WALK * DOG_STRIDE * DOG_DUTY;
  const legs = [
    { hind: true, s: -1, off: 0 },
    { hind: false, s: -1, off: 0.25 },
    { hind: true, s: 1, off: 0.5 },
    { hind: false, s: 1, off: 0.75 },
  ];
  legs.forEach(({ hind, s, off }, i) => {
    const f = footPath(ph + off, DOG_DUTY, reachLen, 0.06);
    const lz = 0.075 * s;
    const t0 = 0.72 + i * 0.015;
    const kind = s > 0 ? NORMAL : DIM;
    if (hind) {
      // Hip, stifle forward, hock behind the paw, a near upright hind foot.
      const hip: [number, number] = [0.06, 0.44 + bob];
      const paw: [number, number] = [hip[0] + f.x - 0.02, 0.02 + f.y];
      const hock: [number, number] = [paw[0] - 0.04 - 0.04 * f.swing, paw[1] + 0.125 - 0.01 * f.swing];
      const { joint: stifle, end } = reach(hip, hock, 0.2, 0.2, 1);
      d.tube([p(hip[0], hip[1] - bob, lz), p(stifle[0], stifle[1] - bob, lz), p(end[0], end[1] - bob, lz), p(paw[0], paw[1] - bob, lz)], [0.075, 0.045, 0.028, 0.025], 5, t0, t0 + 0.04, kind);
    } else {
      // Shoulder, elbow back, the carpus; the paw folds back under it in the swing.
      const shoulder: [number, number] = [0.56, 0.4 + bob];
      const paw: [number, number] = [shoulder[0] + f.x + 0.02, 0.02 + f.y];
      const wrist: [number, number] = [paw[0] - 0.012 + 0.06 * f.swing, paw[1] + 0.075 - 0.01 * f.swing];
      const { joint: elbow, end } = reach(shoulder, wrist, 0.17, 0.18, -1);
      d.tube([p(shoulder[0], shoulder[1] - bob, lz), p(elbow[0], elbow[1] - bob, lz), p(end[0], end[1] - bob, lz), p(paw[0], paw[1] - bob, lz)], [0.065, 0.04, 0.028, 0.025], 5, t0, t0 + 0.04, kind);
    }
  });
  return p(0.68, 0.6);
}

function walkShot(): Shot {
  const d = new Draft();
  // Sidewalk, curb and the road edge.
  for (const [z, kind] of [[-1.6, NORMAL], [2.4, NORMAL], [2.6, DIM], [6, DIM]] as const) d.seg([-30, 0, z], [30, 0, z], 0, kind);
  for (let x = -30; x < 30; x += 1.5) d.seg([x, 0, -1.6], [x, 0, 2.4], 0.03, DIM);

  // An art deco front: stepped centre tower, eyebrow bands, portholes, a door.
  const z = -1.6;
  d.poly([[-9, 0, z], [-9, 4.6, z], [-2.2, 4.6, z], [-2.2, 6.4, z], [-1.2, 6.4, z], [-1.2, 7.4, z], [1.2, 7.4, z], [1.2, 6.4, z], [2.2, 6.4, z], [2.2, 4.6, z], [9, 4.6, z], [9, 0, z]], 0.05, 0.3, DIM);
  for (const y of [1.9, 3.3]) {
    d.seg([-9, y, z + 0.25], [9, y, z + 0.25], 0.2, DIM);
    d.seg([-9, y + 0.12, z + 0.25], [9, y + 0.12, z + 0.25], 0.21, DIM);
  }
  for (const x of [-6.5, -4.2, 4.2, 6.5]) d.ring([x, 2.6, z], 0.45, 'z', 18, 0.22, 0.3, DIM);
  for (const x of [-1.6, -0.55, 0.55, 1.6]) d.seg([x, 4.6, z], [x, 7.0, z], 0.25, DIM);
  d.poly([[-0.8, 0, z], [-0.8, 2.2, z], [0.8, 2.2, z], [0.8, 0, z]], 0.24, 0.3, DIM);
  palm(d, -6, 1.8, 6.2, 0.7, 0.3, DIM);
  palm(d, 7.2, 1.9, 5.6, -0.6, 0.36, DIM);
  lamp(d, 3.6, 2.1, -1, 0.34);

  // The pair walk from left of the door to its right over the shot; the camera keeps pace a little behind.
  const START = -2.6;
  const along = (t: number) => START + WALK * t;
  return {
    name: 'Walk',
    credit: 'Line art: The Vice Files',
    fixed: d.strokes(),
    pose: (t) => {
      const f = new Draft();
      const x = along(t);
      const hand = walker(f, t, x);
      const collar = dog(f, t, x + 0.78, 0.6);
      // The leash: the shot's one pink line, sagging between hand and collar.
      const leash: V3[] = [];
      for (let i = 0; i <= 14; i++) {
        const k = i / 14;
        leash.push([lerp(hand[0], collar[0], k), lerp(hand[1], collar[1], k) - Math.sin(k * Math.PI) * 0.14, lerp(hand[2], collar[2], k)]);
      }
      f.poly(leash, 0.84, 0.96, ACCENT);
      return f.strokes();
    },
    camera: (t) => {
      const a = 1.38 - t * 0.008;
      const x = along(t) * 0.85 + 0.9;
      return { pos: [Math.cos(a) * 10 + x, 1.35 + t * 0.01, Math.sin(a) * 10], target: [x, 1.0, 0.2], fov: 40 };
    },
  };
}

// ---------------------------------------------------------------- renderer
export type LineArt = {
  shots: { name: string; credit: string }[];
  show: (index: number, still?: boolean) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
};

// Every shot in its order. The coastline comes first when the built media has it.
export function buildShots(coast?: { aspect: number; paths: number[][][] } | null): Shot[] {
  const shots: Shot[] = [];
  if (coast && coast.paths?.length) shots.push(coastShot(coast.paths, coast.aspect));
  shots.push(carShot(), armsShot(), walkShot());
  return shots;
}

export function createLineArt(canvas: HTMLCanvasElement, coast?: { aspect: number; paths: number[][][] } | null): LineArt {
  const shots = buildShots(coast);
  const ctx = canvas.getContext('2d')!;
  let shot = shots[0];
  let startedAt = 0;
  let elapsedAtPause = 0;
  let running = false;
  let still = false;
  let raf = 0;
  let w = 0, h = 0, dpr = 1;
  let bandTop = 0, bandBottom = 0;
  let fitCache: { shot: Shot; focal: number; cy: number } | null = null;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    // The free band, set by the hero's layout (Hero.astro): px kept clear at the top and at the bottom.
    const css = getComputedStyle(canvas);
    bandTop = parseFloat(css.getPropertyValue('--line-top')) || 0;
    bandBottom = parseFloat(css.getPropertyValue('--line-bottom')) || 0;
    fitCache = null;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    if (!running) draw(elapsedAtPause);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Three depth bands per style; nearer lines are brighter.
  const paths: Path2D[] = [];
  const styles = [
    ['rgb(255 255 255 / 0.86)', 'rgb(255 255 255 / 0.62)', 'rgb(255 255 255 / 0.4)'],
    ['rgb(255 255 255 / 0.3)', 'rgb(255 255 255 / 0.2)', 'rgb(255 255 255 / 0.13)'],
    ['#F976B0', '#F976B0', 'rgb(249 118 176 / 0.7)'],
  ];

  function fitBand(s: Shot, focal: number, cy: number) {
    const cam = s.camera(0);
    const f = norm(sub(cam.target, cam.pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    let hi = -Infinity, lo = Infinity;
    const { pos, kind } = s.fixed;
    for (let i = 0; i < pos.length; i += 3) {
      if (kind[Math.floor(i / 6)] === DIM) continue;
      const p: V3 = [pos[i] - cam.pos[0], pos[i + 1] - cam.pos[1], pos[i + 2] - cam.pos[2]];
      const z = dot(p, f);
      if (z < 0.2) continue;
      const v = dot(p, u) / z;
      if (v > hi) hi = v;
      if (v < lo) lo = v;
    }
    if (!Number.isFinite(hi)) return { focal, cy };
    // A little room for the drift and the line width.
    const pad = 12;
    const top = bandTop + pad, bottom = h - bandBottom - pad;
    if (cy - hi * focal < top) cy = top + hi * focal;
    if (cy - lo * focal > bottom) {
      focal = Math.min(focal, (bottom - top) / (hi - lo));
      cy = top + hi * focal;
    }
    return { focal, cy };
  }

  function draw(time: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!w || !h) return;
    // A still drawing (reduced motion) is the finished shot at its first moment.
    const at = still ? 0 : time;
    const cam = shot.camera(at);
    const f = norm(sub(cam.target, cam.pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const wide = w >= 768;
    // Framed on the hero, not the whole canvas: the canvas runs --line-bottom past the hero into its fade (LR11),
    // and that extra height must not move or scale the drawing behind the finds list.
    const frameH = Math.max(1, h - bandBottom);
    // Horizontal field of view holds at 16:9, so a phone sees the subject whole.
    let focal = (0.5 * Math.min(w, (frameH * 16) / 9)) / Math.tan(((cam.fov * Math.PI) / 180) / 2);
    let cy = frameH * (wide ? 0.42 : 0.36);
    const cx = w * (wide ? 0.64 : 0.5);
    if (shot.fit) {
      // Measured once per shot and size, from the finished drawing at its first moment, so the framing holds still.
      if (!fitCache || fitCache.shot !== shot) fitCache = { shot, ...fitBand(shot, focal, cy) };
      focal = fitCache.focal;
      cy = fitCache.cy;
    }
    const near = 0.2;
    const subject = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);
    const nearBand = subject * 1.12, farBand = subject * 1.7;
    for (let s = 0; s < 9; s++) paths[s] = new Path2D();

    const project = (st: Strokes) => {
      const { pos, start, dur, c0, c1, curve, kind } = st;
      for (let i = 0, n = kind.length; i < n; i++) {
        let k = 1;
        if (!still) {
          const g = (time - start[i]) / dur[i];
          if (g <= 0) continue;
          if (g < 1) {
            // Where the pen is along the whole stroke, then how much of this segment it has covered.
            const e = CURVES[curve[i]](g);
            if (e <= c0[i]) continue;
            k = e >= c1[i] ? 1 : (e - c0[i]) / (c1[i] - c0[i] || 1);
          }
        }
        const o = i * 6;
        const ax0 = pos[o] - cam.pos[0], ay0 = pos[o + 1] - cam.pos[1], az0 = pos[o + 2] - cam.pos[2];
        const a: V3 = [ax0, ay0, az0];
        const b: V3 = [ax0 + (pos[o + 3] - pos[o]) * k, ay0 + (pos[o + 4] - pos[o + 1]) * k, az0 + (pos[o + 5] - pos[o + 2]) * k];
        let az = dot(a, f), bz = dot(b, f);
        if (az < near && bz < near) continue;
        let ax = dot(a, r), ay = dot(a, u), bx = dot(b, r), by = dot(b, u);
        if (az < near) {
          const s = (near - az) / (bz - az);
          ax += (bx - ax) * s; ay += (by - ay) * s; az = near;
        } else if (bz < near) {
          const s = (near - bz) / (az - bz);
          bx += (ax - bx) * s; by += (ay - by) * s; bz = near;
        }
        const depth = (az + bz) / 2;
        const band = depth < nearBand ? 0 : depth < farBand ? 1 : 2;
        const p = paths[kind[i] * 3 + band];
        p.moveTo(cx + (ax / az) * focal, cy - (ay / az) * focal);
        p.lineTo(cx + (bx / bz) * focal, cy - (by / bz) * focal);
      }
    };
    project(shot.fixed);
    if (shot.pose) project(shot.pose(at));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let s = 0; s < 9; s++) {
      ctx.strokeStyle = styles[Math.floor(s / 3)][s % 3];
      ctx.lineWidth = s >= 6 ? 1.5 : 1;
      ctx.stroke(paths[s]);
    }
  }

  // Once every stroke is down only the slow camera drift moves (well under a pixel a frame), so a still shot
  // redraws at about 30 fps from then on: half the main thread work for no visible difference. A shot with
  // moving figures keeps every frame.
  const drawn = DRAW_START + DRAW_SPAN + STROKE;
  let lastDraw = 0;
  const frame = (now: number) => {
    if (!running) return;
    const t = (now - startedAt) / 1000;
    if (t < drawn || shot.pose || now - lastDraw >= 32) {
      draw(t);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  };

  return {
    shots: shots.map((s) => ({ name: s.name, credit: s.credit })),
    show(index, isStill = false) {
      shot = shots[((index % shots.length) + shots.length) % shots.length];
      still = isStill;
      elapsedAtPause = 0;
      startedAt = performance.now();
      if (still || !running) draw(0);
    },
    play() {
      if (running || still) return;
      running = true;
      startedAt = performance.now() - elapsedAtPause * 1000;
      raf = requestAnimationFrame(frame);
    },
    pause() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      elapsedAtPause = (performance.now() - startedAt) / 1000;
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
