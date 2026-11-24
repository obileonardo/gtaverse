// The hero's line art mode: original wireframe drawings, white hairlines on the night navy, pink used once
// per shot. A few hundred 3D segments are projected by a small perspective camera onto a 2D canvas: no
// Three.js, no images (Three.js would add about 150 KB for the same look). Each shot draws itself on
// (stroke by stroke, along each outline) while the camera drifts slowly.
// Shots: Leonida's coastline (traced by code from the official map at build time, public/media/hero/coast.json),
// a muscle coupe of our own design on a palm street, and a person walking a dog past an art deco front.

type V3 = [number, number, number];
type Cam = { pos: V3; target: V3; fov: number };
type Shot = { name: string; credit: string; pos: Float32Array; order: Float32Array; kind: Uint8Array; camera: (t: number) => Cam };

const NORMAL = 0, DIM = 1, ACCENT = 2;

class Draft {
  pos: number[] = [];
  order: number[] = [];
  kind: number[] = [];
  seg(a: V3, b: V3, t: number, kind = NORMAL) {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    this.order.push(Math.min(Math.max(t, 0), 1));
    this.kind.push(kind);
  }
  // A polyline whose segments draw on in order between t0 and t1.
  poly(pts: V3[], t0: number, t1: number, kind = NORMAL, closed = false) {
    const list = closed ? [...pts, pts[0]] : pts;
    const n = list.length - 1;
    for (let i = 0; i < n; i++) this.seg(list[i], list[i + 1], t0 + ((t1 - t0) * i) / Math.max(n, 1), kind);
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
  // A square prism from a to b: low-poly limbs and bodies.
  limb(a: V3, b: V3, r: number, t: number, kind = NORMAL) {
    const d = sub(b, a);
    const up: V3 = Math.abs(d[1]) > Math.abs(d[0]) + Math.abs(d[2]) ? [1, 0, 0] : [0, 1, 0];
    const u = scale(norm(cross(d, up)), r), v = scale(norm(cross(d, u)), r);
    const ca: V3[] = [add(add(a, u), v), add(sub(a, u), v), sub(sub(a, u), v), sub(add(a, u), v)];
    const cb = ca.map((p) => add(p, d));
    for (let i = 0; i < 4; i++) {
      this.seg(ca[i], ca[(i + 1) % 4], t, kind);
      this.seg(cb[i], cb[(i + 1) % 4], t + 0.03, kind);
      this.seg(ca[i], cb[i], t + 0.015, kind);
    }
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
    const n = rings.length;
    rings.forEach((ring, i) => {
      const t = t0 + ((t1 - t0) * i) / Math.max(n - 1, 1);
      this.poly(ring, t, t + 0.02, kind, true);
      if (i < n - 1) ring.forEach((q, k) => this.seg(q, rings[i + 1][k], t + 0.01, kind));
    });
  }
  done(name: string, credit: string, camera: (t: number) => Cam): Shot {
    return { name, credit, pos: new Float32Array(this.pos), order: new Float32Array(this.order), kind: new Uint8Array(this.kind), camera };
  }
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => 1 - Math.pow(1 - k, 3);

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

  const H = 0.22;
  paths.forEach((p, i) => {
    const t0 = i === 0 ? 0.05 : 0.45 + (i / paths.length) * 0.4;
    const t1 = i === 0 ? 0.75 : t0 + 0.12;
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
  return d.done('Leonida', 'Line art: The Vice Files. Coastline from the official map, Rockstar Games', (t) => {
    const a = 0.42 + t * 0.016;
    return { pos: [Math.sin(a) * 9, 13.5 - t * 0.05, Math.cos(a) * 9 + 1.2], target: [0.2, 0, -0.2], fov: 40 };
  });
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

  return d.done('Coupe', 'Line art: The Vice Files', (t) => {
    const a = -0.9 + t * 0.012;
    return { pos: [Math.cos(a) * 12 + 0.2, 1.6 + t * 0.02, Math.sin(a) * 12], target: [0, 1.0, 1.0], fov: 40 };
  });
}

// ---------------------------------------------------------------- shot 3: a walk with the dog
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

  // The walker, facing +x mid stride: tubes for the body and limbs, a lofted head.
  const hand: V3 = [0.38, 1.02, 0.24];
  d.tube([[0, 0.93, 0], [0.01, 1.1, 0], [0.03, 1.3, 0], [0.04, 1.44, 0], [0.05, 1.52, 0]], [[0.11, 0.17], [0.1, 0.15], [0.12, 0.19], [0.1, 0.2], [0.05, 0.05]], 8, 0.42, 0.5);
  d.tube([[0.07, 1.55, 0], [0.08, 1.6, 0], [0.085, 1.67, 0], [0.08, 1.74, 0], [0.075, 1.79, 0]], [0.04, 0.09, 0.105, 0.085, 0.02], 8, 0.48, 0.54);
  d.tube([[0.04, 1.42, 0.2], [0.2, 1.2, 0.22], hand], [0.045, 0.04, 0.03], 6, 0.52, 0.56);
  d.tube([[0.04, 1.42, -0.2], [-0.12, 1.2, -0.22], [-0.2, 0.99, -0.22]], [0.045, 0.04, 0.03], 6, 0.52, 0.56);
  d.tube([[0.02, 0.93, 0.09], [0.18, 0.52, 0.1], [0.26, 0.1, 0.1]], [0.075, 0.055, 0.04], 6, 0.55, 0.6);
  d.tube([[0.24, 0.06, 0.1], [0.43, 0.03, 0.1]], [0.04, 0.035], 6, 0.6, 0.62);
  d.tube([[-0.02, 0.93, -0.09], [-0.08, 0.5, -0.1], [-0.26, 0.12, -0.1]], [0.075, 0.055, 0.04], 6, 0.55, 0.6);
  d.tube([[-0.3, 0.07, -0.1], [-0.12, 0.01, -0.1]], [0.04, 0.035], 6, 0.6, 0.62);

  // The dog, a step ahead.
  const dz = 0.6;
  d.tube([[1.28, 0.5, dz], [1.5, 0.52, dz], [1.75, 0.53, dz], [1.97, 0.55, dz]], [[0.13, 0.1], [0.15, 0.11], [0.14, 0.11], [0.13, 0.1]], 8, 0.62, 0.68);
  d.tube([[1.97, 0.58, dz], [2.08, 0.72, dz], [2.18, 0.79, dz], [2.3, 0.77, dz], [2.42, 0.72, dz]], [[0.08, 0.07], [0.07, 0.06], [0.08, 0.07], [0.05, 0.045], [0.03, 0.03]], 8, 0.66, 0.72);
  for (const s of [1, -1]) d.poly([[2.12, 0.84, dz + 0.05 * s], [2.1, 0.95, dz + 0.07 * s], [2.2, 0.86, dz + 0.05 * s]], 0.72, 0.74);
  const legs: V3[][] = [
    [[1.92, 0.45, dz + 0.08], [1.98, 0.25, dz + 0.08], [2.05, 0.02, dz + 0.08]],
    [[1.92, 0.45, dz - 0.08], [1.86, 0.24, dz - 0.08], [1.8, 0.02, dz - 0.08]],
    [[1.36, 0.45, dz + 0.08], [1.3, 0.25, dz + 0.08], [1.22, 0.02, dz + 0.08]],
    [[1.36, 0.45, dz - 0.08], [1.44, 0.24, dz - 0.08], [1.52, 0.02, dz - 0.08]],
  ];
  legs.forEach((l, i) => d.tube(l, [0.04, 0.035, 0.03], 6, 0.72 + i * 0.015, 0.76 + i * 0.015));
  d.tube([[1.28, 0.55, dz], [1.16, 0.66, dz], [1.06, 0.73, dz]], [0.03, 0.025, 0.01], 5, 0.78, 0.8);

  // The leash: the shot's one pink line, sagging between hand and collar.
  const collar: V3 = [2.04, 0.66, dz];
  const leash: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const k = i / 14;
    leash.push([lerp(hand[0], collar[0], k), lerp(hand[1], collar[1], k) - Math.sin(k * Math.PI) * 0.16, lerp(hand[2], collar[2], k)]);
  }
  d.poly(leash, 0.84, 0.96, ACCENT);

  return d.done('Walk', 'Line art: The Vice Files', (t) => {
    const a = 1.38 - t * 0.01;
    return { pos: [Math.cos(a) * 10 + 1.1, 1.35 + t * 0.01, Math.sin(a) * 10], target: [1.1, 1.05, 0.2], fov: 40 };
  });
}

// ---------------------------------------------------------------- renderer
const DRAW_START = 0.25; // s before the first stroke
const DRAW_SPAN = 2.8; // s across which strokes start, in their order
const STROKE = 0.7; // s each stroke takes to draw

export type LineArt = {
  shots: { name: string; credit: string }[];
  show: (index: number, still?: boolean) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
};

export function createLineArt(canvas: HTMLCanvasElement, coast?: { aspect: number; paths: number[][][] } | null): LineArt {
  const shots: Shot[] = [];
  if (coast && coast.paths?.length) shots.push(coastShot(coast.paths, coast.aspect));
  shots.push(carShot(), walkShot());
  const ctx = canvas.getContext('2d')!;
  let shot = shots[0];
  let startedAt = 0;
  let elapsedAtPause = 0;
  let running = false;
  let still = false;
  let raf = 0;
  let w = 0, h = 0, dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    if (!running) draw(still ? 99 : elapsedAtPause);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function draw(time: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!w || !h) return;
    const cam = shot.camera(still ? 0 : time);
    const f = norm(sub(cam.target, cam.pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const wide = w >= 768;
    // Horizontal field of view holds at 16:9, so a phone sees the subject whole.
    const focal = (0.5 * Math.min(w, (h * 16) / 9)) / Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const cx = w * (wide ? 0.64 : 0.5), cy = h * (wide ? 0.42 : 0.36);
    const near = 0.2;
    // Depth bands relative to the subject: nearer lines are brighter.
    const subject = Math.hypot(cam.target[0] - cam.pos[0], cam.target[1] - cam.pos[1], cam.target[2] - cam.pos[2]);
    const nearBand = subject * 1.12, farBand = subject * 1.7;
    // Three depth bands per style; nearer lines are brighter.
    const paths = Array.from({ length: 9 }, () => new Path2D());
    const { pos, order, kind } = shot;
    for (let i = 0, n = order.length; i < n; i++) {
      let k = still ? 1 : (time - DRAW_START - order[i] * DRAW_SPAN) / STROKE;
      if (k <= 0) continue;
      k = k >= 1 ? 1 : ease(k);
      const o = i * 6;
      const a: V3 = [pos[o] - cam.pos[0], pos[o + 1] - cam.pos[1], pos[o + 2] - cam.pos[2]];
      const b0: V3 = [pos[o + 3] - cam.pos[0], pos[o + 4] - cam.pos[1], pos[o + 5] - cam.pos[2]];
      const b: V3 = [a[0] + (b0[0] - a[0]) * k, a[1] + (b0[1] - a[1]) * k, a[2] + (b0[2] - a[2]) * k];
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    const styles = [
      ['rgb(255 255 255 / 0.86)', 'rgb(255 255 255 / 0.62)', 'rgb(255 255 255 / 0.4)'],
      ['rgb(255 255 255 / 0.3)', 'rgb(255 255 255 / 0.2)', 'rgb(255 255 255 / 0.13)'],
      ['#F976B0', '#F976B0', 'rgb(249 118 176 / 0.7)'],
    ];
    for (let s = 0; s < 9; s++) {
      ctx.strokeStyle = styles[Math.floor(s / 3)][s % 3];
      ctx.lineWidth = s >= 6 ? 1.5 : 1;
      ctx.stroke(paths[s]);
    }
  }

  // Once every stroke is down only the slow camera drift moves (well under a pixel a frame), so the loop
  // redraws at about 30 fps from then on: half the main thread work for no visible difference.
  const drawn = DRAW_START + DRAW_SPAN + STROKE;
  let lastDraw = 0;
  const frame = (now: number) => {
    if (!running) return;
    const t = (now - startedAt) / 1000;
    if (t < drawn || now - lastDraw >= 32) {
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
      if (still || !running) draw(still ? 99 : 0);
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
