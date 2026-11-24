// Height of the 3D map at any image pixel, from our hand-drawn relief (content/relief.json, docs/MAP-3D.md).
// Relief is approximate, drawn by The Vice Files: each feature is a point or a line with a height and a radius,
// shaped by a smooth falloff and a little fixed noise. Nothing here comes from a leak, a fan height map or a video.
// Units: world x and z are image pixels; world y (height) is in image pixels too, height_m * exaggeration / metres_per_pixel.
import relief from '../../../../content/relief.json';

type Feature = { pts: [number, number][]; h: number; r: number; rough: number; kind: string };

const k = relief.vertical_exaggeration / relief.metres_per_pixel;
const features: Feature[] = relief.features.map((f) => ({ pts: f.points as [number, number][], h: f.height_m * k, r: f.radius_px, rough: f.roughness, kind: f.kind }));
export const reliefLabel = relief.label;
export const maxHeight = Math.max(0, ...features.map((f) => f.h * 1.25));

// Fixed value noise (same result on every device, so the hills never change shape between visits).
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const fbm = (x: number, y: number) => noise(x / 420, y / 420) * 0.65 + noise(x / 170 + 7.3, y / 170 - 2.1) * 0.35;

function distToLine(x: number, y: number, pts: [number, number][]) {
  if (pts.length === 1) return Math.hypot(x - pts[0][0], y - pts[0][1]);
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

// Smooth maximum, so a ridge running into a peak blends without a crease. The blend width shrinks to zero as either
// height does, so the result stays continuous where a feature's radius ends.
function smax(a: number, b: number) {
  const w = Math.min(24, a, b);
  if (w <= 0) return Math.max(a, b);
  const g = Math.max(w - Math.abs(a - b), 0) / w;
  return Math.max(a, b) + (g * g * w) / 4;
}

/** Height in world units at image pixel (x, y). Zero away from every feature. */
export function heightAt(x: number, y: number) {
  let h = 0;
  for (const f of features) {
    const t = distToLine(x, y, f.pts) / f.r;
    if (t >= 1) continue;
    const s = 1 - t * t;
    const fall = f.kind === 'peak' ? s * s * s : s * s;
    const v = f.h * fall * (1 + f.rough * 0.4 * fbm(x, y));
    h = smax(h, v);
  }
  return Math.max(0, h);
}
