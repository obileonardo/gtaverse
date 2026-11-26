// Home 014: two original line-art figures in the hero's line-art language (owner answer Q6, 24 Nov 2026):
// silhouettes, not likenesses. Each figure is built from 3D tubes (rings and long lines) and projected by a small
// perspective camera onto a 2D canvas, then draws itself on like a pen (an outline as one continuous stroke along its
// length, a single edge growing from its first end) while the camera turns slowly round it. No images, no library.
// Colours come from the page: hairlines in --text-1 at three depth bands, and one pink line (--accent-ink).
// The hero's own renderer (line-art.ts) is left untouched; this is a smaller sibling with the same timing rules.

type V3 = [number, number, number];
const NORMAL = 0, DIM = 1, ACCENT = 2;

export const DRAW_START = 0.15;
export const DRAW_SPAN = 2.2;
export const STROKE = 0.6;

// --ease-out for a single edge, --ease-standard for a pen stroke (as in line-art.ts).
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const N = 96;
  const lut = new Float32Array(N + 1);
  const at = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let lo = 0, hi = 1;
    for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (at(mid, x1, x2) < x) lo = mid; else hi = mid; }
    lut[i] = at((lo + hi) / 2, y1, y2);
  }
  return (k: number) => { const f = k * N, i = Math.floor(f); return i >= N ? 1 : lut[i] + (lut[i + 1] - lut[i]) * (f - i); };
}
const CURVES = [bezier(0.23, 1, 0.32, 1), bezier(0.4, 0, 0.2, 1)];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

type Seg = { a: V3; b: V3; start: number; dur: number; c0: number; c1: number; curve: number; kind: number };

class Draft {
  segs: Seg[] = [];
  seg(a: V3, b: V3, t: number, kind = NORMAL) {
    this.segs.push({ a, b, start: DRAW_START + clamp01(t) * DRAW_SPAN, dur: STROKE, c0: 0, c1: 1, curve: 0, kind });
  }
  poly(pts: V3[], t0: number, t1: number, kind = NORMAL, closed = false) {
    const list = closed ? [...pts, pts[0]] : pts;
    const n = list.length - 1;
    if (n < 1) return;
    const cum = [0];
    for (let i = 0; i < n; i++) cum.push(cum[i] + Math.hypot(...sub(list[i + 1], list[i])));
    const total = cum[n] || 1;
    const a = clamp01(t0), b = Math.max(clamp01(t1), a);
    const start = DRAW_START + a * DRAW_SPAN, dur = (b - a) * DRAW_SPAN + STROKE;
    for (let i = 0; i < n; i++) this.segs.push({ a: list[i], b: list[i + 1], start, dur, c0: cum[i] / total, c1: cum[i + 1] / total, curve: 1, kind });
  }
  ring(c: V3, rx: number, rz: number, n: number, t0: number, t1: number, kind = NORMAL) {
    const pts: V3[] = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([c[0] + Math.cos(a) * rx, c[1], c[2] + Math.sin(a) * rz]); }
    this.poly(pts, t0, t1, kind, true);
  }
  // A tube along a path: an oval ring at each point ([side, depth] radii) and long lines joining the rings.
  tube(path: V3[], radii: [number, number][], sides: number, t0: number, t1: number, kind = NORMAL, ringKind = kind) {
    const rings = path.map((p, i) => {
      const prev = path[Math.max(i - 1, 0)], nxt = path[Math.min(i + 1, path.length - 1)];
      const tan = norm(sub(nxt, prev));
      const ref: V3 = Math.abs(tan[2]) > 0.8 ? [1, 0, 0] : [0, 0, 1];
      const side = norm(cross(ref, tan)), deep = norm(cross(tan, side));
      const [rs, rd] = radii[i];
      return Array.from({ length: sides }, (_, k) => {
        const a = (k / sides) * Math.PI * 2;
        return add(p, add(scale(side, Math.cos(a) * rs), scale(deep, Math.sin(a) * rd)));
      });
    });
    const n = rings.length;
    rings.forEach((r, i) => { const t = t0 + ((t1 - t0) * i) / Math.max(n - 1, 1); this.poly(r, t, t + 0.03, ringKind, true); });
    for (let k = 0; k < sides; k++) this.poly(rings.map((r) => r[k]), t0 + 0.01, t1, kind);
  }
}

// ---------------------------------------------------------------- the figures
// Units: metres, y up, the figure faces +z, feet on y = 0. Two figures share one body plan with different proportions
// and poses; nothing is traced from any picture.
type Pose = {
  hip: number; shoulder: number; height: number; // half widths and the top of the head
  stance: number;            // feet apart
  weight: 1 | -1;            // the leg that carries the weight (contrapposto)
  arms: 'pockets' | 'hip';   // left arm in a pocket and right hanging, or a hand on the hip
  hair: 'short' | 'tied';
};

function figure(d: Draft, p: Pose, t0: number) {
  const H = p.height;
  const k = H / 1.8; // proportions scale with height
  const hipY = 0.95 * k, waistY = 1.08 * k, chestY = 1.32 * k, shY = 1.45 * k, neckY = 1.53 * k;
  const tilt = 0.035 * p.weight; // hips drop to the free leg; shoulders answer the other way
  const hipC: V3 = [0.03 * p.weight, hipY, 0];

  // Legs: the weight leg straight under the body, the free leg bent a little and turned out.
  for (const s of [1, -1] as const) {
    const carries = s === p.weight;
    const hx = hipC[0] + s * p.hip * 0.55;
    const hy = hipY + s * tilt * p.hip;
    const fx = s * p.stance * (carries ? 0.35 : 0.65);
    const knee: V3 = [(hx + fx) / 2 + (carries ? 0 : s * 0.03), 0.5 * k, carries ? 0 : 0.06];
    const ankle: V3 = [fx, 0.08 * k, carries ? 0 : 0.03];
    const kind = s > 0 ? NORMAL : DIM;
    d.tube([[hx, hy, 0], knee, ankle], [[0.085 * k, 0.09 * k], [0.055 * k, 0.06 * k], [0.04 * k, 0.045 * k]], 7, t0 + 0.12, t0 + 0.2, kind, DIM);
    // A foot: heel, ankle, toe, as one closed pen stroke.
    const toe = add(ankle, [s * 0.03, -0.07 * k, 0.2 * k]);
    d.poly([add(ankle, [0, -0.06 * k, -0.05 * k]), ankle, toe, add(toe, [0, -0.01, -0.04 * k])], t0 + 0.2, t0 + 0.23, kind, true);
  }

  // Torso: pelvis, waist, ribs, chest, shoulders, neck. Side radius by the body plan, depth thinner.
  // Pelvis, waist, lower ribs, chest, the shoulder line (rounded off), then the neck.
  const torso: V3[] = [[hipC[0], hipY - 0.05 * k, 0], hipC, [hipC[0] * 0.6, waistY, 0], [0, chestY - 0.1 * k, 0.005], [-0.01 * p.weight, chestY, 0.012], [-0.012 * p.weight, shY - 0.04 * k, 0.005], [-0.015 * p.weight, shY, 0], [0, shY + 0.035 * k, 0], [0, neckY, 0]];
  const torsoR: [number, number][] = [[p.hip * 0.86, 0.1 * k], [p.hip, 0.12 * k], [p.hip * 0.76, 0.1 * k], [p.shoulder * 0.78, 0.115 * k], [p.shoulder * 0.88, 0.125 * k], [p.shoulder * 0.95, 0.11 * k], [p.shoulder * 0.82, 0.085 * k], [p.shoulder * 0.4, 0.06 * k], [0.05 * k, 0.05 * k]];
  d.tube(torso, torsoR, 12, t0, t0 + 0.12, NORMAL, DIM);

  // Head: a rounded skull on a slight turn, as stacked rings.
  const hy = neckY + 0.05 * k;
  const head: V3[] = [[0, hy, 0.01], [0, hy + 0.06 * k, 0.015], [0, hy + 0.13 * k, 0.02], [0, hy + 0.2 * k, 0.01], [0, hy + 0.25 * k, 0]];
  d.tube(head, [[0.045 * k, 0.05 * k], [0.075 * k, 0.085 * k], [0.085 * k, 0.1 * k], [0.075 * k, 0.085 * k], [0.02 * k, 0.02 * k]], 12, t0 + 0.08, t0 + 0.14);
  if (p.hair === 'tied') {
    // A tied-back ponytail: a soft curve from the crown down the back of the neck.
    const crown: V3 = [0, hy + 0.21 * k, -0.06 * k];
    d.tube([crown, [0.01, hy + 0.17 * k, -0.13 * k], [0.02, hy + 0.06 * k, -0.15 * k], [0.03, hy - 0.06 * k, -0.12 * k]], [[0.03 * k, 0.03 * k], [0.035 * k, 0.03 * k], [0.03 * k, 0.025 * k], [0.008, 0.008]], 6, t0 + 0.15, t0 + 0.2);
  } else {
    // Short hair: a cap line over the top of the head.
    d.ring([0, hy + 0.18 * k, 0.005], 0.08 * k, 0.095 * k, 18, t0 + 0.15, t0 + 0.18, DIM);
  }

  // Arms.
  for (const s of [1, -1] as const) {
    const sh: V3 = [s * p.shoulder * 0.95 - 0.015 * p.weight, shY - 0.03 * k - s * tilt * p.shoulder, 0];
    const kind = s > 0 ? NORMAL : DIM;
    let elbow: V3, wrist: V3;
    if (p.arms === 'hip' && s === p.weight) {
      // The hand rests on the hip, the elbow out to the side.
      elbow = [s * (p.shoulder + 0.13 * k), 1.17 * k, -0.03];
      wrist = [s * (p.hip + 0.01), hipY + 0.06 * k, 0.04];
    } else if (p.arms === 'pockets' && s !== p.weight) {
      // The hand in a front pocket.
      elbow = [s * (p.shoulder + 0.04 * k), 1.17 * k, -0.02];
      wrist = [s * (p.hip * 0.85), hipY - 0.02 * k, 0.07];
    } else {
      elbow = [s * (p.shoulder + 0.02 * k), 1.16 * k, -0.02];
      wrist = [s * (p.shoulder + 0.03 * k), 0.9 * k, 0.04];
    }
    d.tube([sh, elbow, wrist], [[0.05 * k, 0.055 * k], [0.04 * k, 0.042 * k], [0.03 * k, 0.032 * k]], 6, t0 + 0.24, t0 + 0.3, kind, DIM);
    if (!(p.arms === 'pockets' && s !== p.weight)) {
      const hand = add(wrist, [s * 0.004, -0.09 * k, 0.005]);
      d.poly([add(wrist, [-0.025 * k, 0, 0]), add(hand, [-0.02 * k, 0, 0]), add(hand, [0.02 * k, 0, 0]), add(wrist, [0.025 * k, 0, 0])], t0 + 0.3, t0 + 0.32, kind, true);
    }
  }
}

export type Lead = 'jason' | 'lucia';

function build(lead: Lead) {
  const d = new Draft();
  // The ground: one dim ellipse under the figure, drawn first, like the hero's street lines.
  d.ring([0, 0, 0], 0.55, 0.32, 40, 0, 0.08, DIM);
  if (lead === 'jason') {
    figure(d, { hip: 0.17, shoulder: 0.23, height: 1.82, stance: 0.34, weight: 1, arms: 'pockets', hair: 'short' }, 0.08);
  } else {
    figure(d, { hip: 0.18, shoulder: 0.19, height: 1.68, stance: 0.26, weight: -1, arms: 'hip', hair: 'tied' }, 0.08);
    // The chapter's one pink line: a ring on the ground under the second figure, drawn last.
    d.ring([0, 0.005, 0], 0.42, 0.24, 48, 0.86, 1, ACCENT);
  }
  return d.segs;
}

// ---------------------------------------------------------------- renderer
export function createLeadArt(canvas: HTMLCanvasElement, lead: Lead) {
  const segs = build(lead);
  const ctx = canvas.getContext('2d')!;
  const side = lead === 'jason' ? 1 : -1;
  let w = 0, h = 0, dpr = 1;
  let startedAt = 0, pausedAt = 0, running = false, still = false, raf = 0;
  // The pointer's turn (landing refresh phase 8, LR44): radians added to the camera's angle round the figure, set by
  // the chapter's spring (Chapter014Leads.astro). 0 is the figure at rest.
  let turn = 0;
  let colours = { ink: '255 255 255', accent: '#f976b0' };

  const readColours = () => {
    const css = getComputedStyle(canvas);
    const m = css.color.match(/[\d.]+/g) ?? ['255', '255', '255'];
    colours = { ink: `${m[0]} ${m[1]} ${m[2]}`, accent: css.getPropertyValue('--accent-ink').trim() || '#f976b0' };
  };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    readColours();
    if (!running) draw(still ? Infinity : time());
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  // Theme changes recolour the lines.
  const mo = new MutationObserver(() => { readColours(); if (!running) draw(still ? Infinity : time()); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const time = () => (startedAt ? (performance.now() - startedAt) / 1000 : 0);
  // The camera turns slowly round the figure, from a three-quarter view towards the front, then holds (no loop).
  const TURN = 9;
  const camera = (t: number) => {
    const k = Math.min(t / TURN, 1);
    const e = 1 - (1 - k) * (1 - k);
    const a = side * (0.62 - 0.3 * e) + turn;
    return { pos: [Math.sin(a) * 4, 1.1, Math.cos(a) * 4] as V3, target: [0, 0.88, 0] as V3, fov: 30 };
  };

  function draw(t: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!w || !h) return;
    const cam = camera(still ? TURN : t);
    const f = norm(sub(cam.target, cam.pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const focal = (0.5 * h) / Math.tan((cam.fov * Math.PI) / 360);
    const cx = w / 2, cy = h * 0.5;
    const dist = Math.hypot(...sub(cam.target, cam.pos));
    const paths = Array.from({ length: 9 }, () => new Path2D());
    for (const s of segs) {
      let k = 1;
      if (!still) {
        const g = (t - s.start) / s.dur;
        if (g <= 0) continue;
        if (g < 1) {
          const e = CURVES[s.curve](g);
          if (e <= s.c0) continue;
          k = e >= s.c1 ? 1 : (e - s.c0) / (s.c1 - s.c0 || 1);
        }
      }
      const a = sub(s.a, cam.pos);
      const b = add(a, scale(sub(s.b, s.a), k));
      const az = dot(a, f), bz = dot(b, f);
      if (az < 0.2 || bz < 0.2) continue;
      const depth = (az + bz) / 2;
      const band = depth < dist - 0.05 ? 0 : depth < dist + 0.12 ? 1 : 2;
      const p = paths[s.kind * 3 + band];
      p.moveTo(cx + (dot(a, r) / az) * focal, cy - (dot(a, u) / az) * focal);
      p.lineTo(cx + (dot(b, r) / bz) * focal, cy - (dot(b, u) / bz) * focal);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const alpha = [[0.86, 0.6, 0.38], [0.3, 0.2, 0.13]];
    for (let i = 0; i < 9; i++) {
      const kind = Math.floor(i / 3), band = i % 3;
      ctx.strokeStyle = kind === ACCENT ? colours.accent : `rgb(${colours.ink} / ${alpha[kind][band]})`;
      ctx.globalAlpha = kind === ACCENT && band === 2 ? 0.7 : 1;
      ctx.lineWidth = kind === ACCENT ? 1.5 : 1;
      ctx.stroke(paths[i]);
    }
    ctx.globalAlpha = 1;
  }

  const END = TURN + 0.1;
  const frame = () => {
    if (!running) return;
    const t = time();
    draw(t);
    if (t >= END) { running = false; return; }
    raf = requestAnimationFrame(frame);
  };

  return {
    /** Start drawing; `delay` in seconds holds the first stroke (the second figure starts when the first is half drawn). */
    play(delay = 0) {
      if (still) return;
      startedAt = performance.now() + delay * 1000;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    pause() { if (!running) return; running = false; cancelAnimationFrame(raf); pausedAt = performance.now(); },
    resume() {
      if (running || still || !startedAt || time() >= END) return;
      if (pausedAt) { startedAt += performance.now() - pausedAt; pausedAt = 0; }
      running = true;
      raf = requestAnimationFrame(frame);
    },
    /** True while the draw-on and the camera turn run: the pointer's turn waits for it (never two movements). */
    get busy() { return running || pausedAt > 0 || (!still && (!startedAt || time() < END)); },
    /**
     * Turns the figure by `rad` round its vertical axis (the camera orbits the other way) and redraws now. A positive
     * value turns the figure's front toward the right of the screen. Ignored while the intro runs.
     */
    setTurn(rad: number) {
      if (running) return;
      turn = -rad;
      draw(still ? Infinity : time());
    },
    /** The finished drawing at once (reduced motion, back navigation, no JS timing). */
    finish() { still = true; running = false; cancelAnimationFrame(raf); draw(Infinity); },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); },
  };
}
