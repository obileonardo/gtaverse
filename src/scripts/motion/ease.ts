// The site's cubic-bezier curves for motion driven from JavaScript (a glide of scrollLeft, which CSS cannot ease).
// Each matches its token in src/styles/tokens.css, solved for x so the timing is the token's own.

/** A cubic-bezier(x1, y1, x2, y2) timing function: progress 0..1 in, eased 0..1 out. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const dbx = (s: number) => 3 * x1 * (1 - s) ** 2 + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s;
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const d = dbx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= (bx(s) - t) / d;
    }
    return by(Math.min(1, Math.max(0, s)));
  };
}

/** --ease-in-out: on-screen movement (a track gliding to its next page). */
export const easeInOut = cubicBezier(0.77, 0, 0.175, 1);

/** Glides an element's scrollLeft to `to` over `ms` on --ease-in-out. Returns a stop function (a grab takes over). */
export function glideScroll(el: HTMLElement, to: number, ms = 500, done?: () => void): () => void {
  const from = el.scrollLeft;
  const start = performance.now();
  let raf = 0;
  const snap = el.style.scrollSnapType;
  el.style.scrollSnapType = 'none'; // snapping would fight every frame of the glide
  const end = () => { el.style.scrollSnapType = snap; done?.(); };
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    el.scrollLeft = from + (to - from) * easeInOut(p);
    if (p < 1) raf = requestAnimationFrame(tick);
    else end();
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); end(); };
}
