// Home 014: the two figures turn a few degrees toward the pointer (landing refresh phase 8, LR43 to LR45; Chime and
// the meeting: "Animate the whole section so the CG scene moves"). Each figure turns round its own vertical axis to
// face the pointer, on a soft critically damped spring (--spring-sheet, no overshoot), by at most TURN_MAX_DEG, and
// comes back exactly to rest when the pointer leaves the chapter. Both follow the same pointer together, each from its
// own place, so between them they turn toward each other.
//
// Only a mouse on a fine pointer that can hover, never with reduced motion, touch or the keyboard: the owner's second
// cursor exception beside the hero peek (L5). A figure waits until its own intro (the draw-on and the slow camera turn
// in leads-art.ts) has finished, so two movements never overlap on it. The turn is the figure's own 3D camera (the
// canvas is redrawn), not a CSS transform on the canvas: a flat canvas turned in CSS reads as a card swinging, not a
// figure turning. The loop runs only while a figure moves, and stops (the figures back at rest) off screen or in a
// hidden tab.
import { Spring, loop, springToken } from '../../scripts/motion/spring';
import type { createLeadArt } from './leads-art';

type Art = ReturnType<typeof createLeadArt>;

/** The furthest a figure turns, in degrees. */
export const TURN_MAX_DEG = 6;

export function initLeadsTurn(root: HTMLElement, figs: { el: HTMLElement; art: Art }[]) {
  if (!figs.length || typeof matchMedia !== 'function') return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const on = () => fine.matches && !still.matches;
  const response = springToken('sheet', 0.4);
  const springs = figs.map(() => new Spring(0, response)); // degrees
  const shown = figs.map(() => 0); // the angle each canvas last drew
  let px = 0, inside = false, visible = false;
  let stop: (() => void) | null = null;

  const draw = (i: number) => {
    const deg = springs[i].x;
    if (deg === shown[i]) return;
    shown[i] = deg;
    figs[i].art.setTurn((deg * Math.PI) / 180);
  };
  const rest = () => {
    stop?.(); stop = null; inside = false;
    springs.forEach((s, i) => { s.set(0); if (!figs[i].art.busy) draw(i); });
  };

  const run = () => {
    if (stop || !visible) return;
    stop = loop((dt) => {
      // Reads first (the figures' boxes), then the canvas draws, which never touch layout.
      const reach = Math.max(root.clientWidth / 2, 1);
      figs.forEach((f, i) => {
        if (!inside || f.art.busy) { springs[i].to(0); return; }
        const r = f.el.getBoundingClientRect();
        // A soft limit: the turn grows with the pointer's distance from the figure and eases off toward the maximum.
        springs[i].to(Math.tanh(((px - (r.left + r.width / 2)) / reach) * 1.4) * TURN_MAX_DEG);
      });
      let moving = false;
      springs.forEach((s, i) => {
        if (figs[i].art.busy) return;
        if (s.x === s.target && s.v === 0) return;
        s.step(dt);
        if (Math.abs(s.x - s.target) < 0.005 && Math.abs(s.v) < 0.05) s.snap();
        else moving = true;
        draw(i);
      });
      if (!moving) stop = null;
      return moving;
    });
  };

  root.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !on()) return;
    px = e.clientX; inside = true;
    run();
  });
  root.addEventListener('pointerleave', () => {
    if (!inside) return;
    inside = false;
    run();
  });
  const sync = () => { if (!on()) rest(); };
  fine.addEventListener('change', sync);
  still.addEventListener('change', sync);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) rest(); }).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) rest(); });
}
