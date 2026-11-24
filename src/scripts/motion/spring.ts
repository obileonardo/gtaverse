// Critically damped springs (damping ratio 1, never an overshoot), the one spring the site uses for anything that
// travels between targets the hand chooses: the menu's hover pill, the game switcher's selection pill and the home
// hero's peek frame. Response times come from the motion tokens in src/styles/tokens.css (--spring-*), so the feel
// is tuned in one place. docs/DESIGN-SYSTEM.md, "Motion".

/** A spring's response in seconds, read from its token (--spring-travel, --spring-lead, --spring-trail, --spring-sheet). */
export function springToken(name: 'travel' | 'lead' | 'trail' | 'sheet', fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--spring-${name}`));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One value on a critically damped spring. Retarget it at any moment: it keeps its velocity, so a move can be caught
 * and turned mid-flight. It is stepped with the exact solution, d(t) = (d0 + (v0 + w d0) t) e^(-w t), and a velocity
 * that would carry it past the target is capped first, so it reaches every target from one side only.
 */
export class Spring {
  x: number;
  v = 0;
  target: number;
  w: number;

  constructor(x: number, response: number) {
    this.x = this.target = x;
    this.w = (2 * Math.PI) / response;
  }

  /** Jump: no travel, no velocity (first appearance, keyboard moves, reduced motion). */
  set(x: number) {
    this.x = this.target = x;
    this.v = 0;
  }

  to(target: number) {
    this.target = target;
  }

  step(dt: number) {
    const w = this.w;
    let d = this.x - this.target;
    // Moving toward the target faster than critical damping can stop it: cap the speed so it lands without passing.
    if (d * this.v < 0 && Math.abs(this.v) > w * Math.abs(d)) this.v = -w * d;
    const e = Math.exp(-w * dt);
    const c = this.v + w * d;
    d = (d + c * dt) * e;
    this.v = (this.v - w * c * dt) * e;
    this.x = this.target + d;
  }

  /** Settled within a tenth of a pixel (or unit) and nearly still. */
  get done() {
    return Math.abs(this.x - this.target) < 0.1 && Math.abs(this.v) < 1;
  }

  snap() {
    this.x = this.target;
    this.v = 0;
  }
}

/** A requestAnimationFrame loop that runs while `frame` returns true. Returns a stop function. */
export function loop(frame: (dt: number) => boolean): () => void {
  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30); // a dropped frame never becomes a jump
    last = now;
    raf = frame(dt) ? requestAnimationFrame(tick) : 0;
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
