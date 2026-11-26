// A subtle tilt toward the pointer on the home page's character and asset cards (landing refresh phase 8, LR43 and
// LR46): the featured explainer card in chapter 013 (Jason and Lucia on the car) and the three collectible layer cards
// in chapter 008. The side under the pointer leans away a little, as if the card faced the pointer, on a critically
// damped spring (--spring-travel), and the card settles exactly flat when the pointer leaves. No loops.
//
// Only a mouse on a fine pointer that can hover, never with reduced motion, never from the keyboard or touch: the
// owner's second cursor exception beside the hero peek (L5). While a card is tilting it carries data-tilt, which turns
// off its own hover motion (the explainer art's zoom, the layer blip's lift), so a card never tilts and scales or lifts
// at once. A press holds the tilt still, so the card's press scale runs alone.
//
// The transform is written on the card itself (never a custom property on a parent); the pointer is read from
// pointer events and the card's box once per frame, before the write. The loop runs only while a card moves.
import { Spring, loop, springToken } from '../../scripts/motion/spring';

/** The steepest tilt, in degrees, on a card small enough to reach it (as the hero peek's 3 degree lean). */
export const TILT_MAX_DEG = 3;
/** The perspective the tilt is seen through, in px. */
export const TILT_PERSPECTIVE = 1000;
/** How far the near edge may swell, as a share of the card: big cards tilt less, so every card looks equally subtle. */
const SWELL = 0.015;
/** Settled: a hundredth of a degree from the target and nearly still, then snapped exactly onto it. */
const near = (s: Spring) => Math.abs(s.x - s.target) < 0.01 && Math.abs(s.v) < 0.05;

type Card = { el: HTMLElement; rx: Spring; ry: Spring; inside: boolean; held: boolean; px: number; py: number; max: number };

export function initCardTilt(els: Iterable<HTMLElement>) {
  const list = [...els];
  if (!list.length || typeof matchMedia !== 'function') return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const on = () => fine.matches && !still.matches;
  const response = springToken('travel', 0.3);
  const cards: Card[] = list.map((el) => ({ el, rx: new Spring(0, response), ry: new Spring(0, response), inside: false, held: false, px: 0, py: 0, max: TILT_MAX_DEG }));
  let stop: (() => void) | null = null;

  const write = (c: Card) => {
    const flat = c.rx.x === 0 && c.ry.x === 0;
    c.el.style.transform = flat ? '' : `perspective(${TILT_PERSPECTIVE}px) rotateX(${c.rx.x.toFixed(3)}deg) rotateY(${c.ry.x.toFixed(3)}deg)`;
  };
  const rest = (c: Card) => { c.inside = false; c.held = false; c.rx.set(0); c.ry.set(0); write(c); };
  const restAll = () => { stop?.(); stop = null; cards.forEach(rest); };
  // The card's own box without its tilt: layout offsets from an untilted ancestor (a tilt keeps the centre in place,
  // but its swollen near edge would skew a bounding box).
  const box = (el: HTMLElement) => {
    const parent = el.offsetParent as HTMLElement | null;
    const p = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
    const left = p.left + el.offsetLeft - (parent?.scrollLeft ?? 0), top = p.top + el.offsetTop - (parent?.scrollTop ?? 0);
    return { left, top, width: el.offsetWidth, height: el.offsetHeight };
  };
  // A card still rising into view (its first-view reveal, a CSS animation on the card) waits: never two movements at
  // once. Transitions (the hover's border colour) do not count.
  const ready = (el: HTMLElement) =>
    !el.getAnimations().some((a) => a.playState === 'running' && !(a instanceof CSSTransition)) && !el.matches('html.js:not(.rv-off) [data-reveal] > li:not([data-rv])');

  const run = () => {
    if (stop) return;
    stop = loop((dt) => {
      let moving = false, waiting = false;
      // Reads first (every box), then the writes, so a frame never forces a layout.
      for (const c of cards) {
        if (!c.inside || c.held) continue;
        if (!ready(c.el)) { c.rx.to(0); c.ry.to(0); waiting = true; continue; }
        const b = box(c.el);
        const half = Math.max(b.width, b.height) / 2;
        c.max = Math.min(TILT_MAX_DEG, (Math.asin(Math.min(1, (SWELL * TILT_PERSPECTIVE) / Math.max(half, 1))) * 180) / Math.PI);
        const kx = Math.max(-1, Math.min(1, ((c.px - b.left) / Math.max(b.width, 1)) * 2 - 1));
        const ky = Math.max(-1, Math.min(1, ((c.py - b.top) / Math.max(b.height, 1)) * 2 - 1));
        // Pointer right: the right side leans away (rotateY +). Pointer low: the bottom leans away (rotateX -).
        c.ry.to(kx * c.max);
        c.rx.to(-ky * c.max);
      }
      for (const c of cards) {
        if (c.held) continue;
        if (c.rx.x === c.rx.target && c.ry.x === c.ry.target && c.rx.v === 0 && c.ry.v === 0) continue;
        c.rx.step(dt); c.ry.step(dt);
        if (near(c.rx) && near(c.ry)) { c.rx.snap(); c.ry.snap(); } else moving = true;
        write(c);
      }
      // A hovered card still rising keeps the loop alive, so it starts to tilt the frame its reveal ends.
      if (!moving && !waiting) stop = null;
      return moving || waiting;
    });
  };

  const sync = () => {
    if (on()) cards.forEach((c) => (c.el.dataset.tilt = ''));
    else { restAll(); cards.forEach((c) => delete c.el.dataset.tilt); }
  };
  sync();
  fine.addEventListener('change', sync);
  still.addEventListener('change', sync);

  for (const c of cards) {
    c.el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !on()) return;
      c.px = e.clientX; c.py = e.clientY; c.inside = true;
      run();
    });
    c.el.addEventListener('pointerleave', () => {
      if (!c.inside) return;
      c.inside = false; c.held = false;
      c.rx.to(0); c.ry.to(0);
      run();
    });
    // A press holds the tilt where it is: the card's press scale moves alone.
    c.el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || !c.inside) return;
      c.held = true;
      c.rx.set(c.rx.x); c.ry.set(c.ry.x);
    });
    c.el.addEventListener('pointerup', () => { if (c.held) { c.held = false; run(); } });
  }

  // Off screen or in a hidden tab, a card is put back flat at once (nobody can see it settle).
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (!e.isIntersecting) { const c = cards.find((k) => k.el === e.target); if (c) rest(c); }
  });
  cards.forEach((c) => io.observe(c.el));
  document.addEventListener('visibilitychange', () => { if (document.hidden) restAll(); });
}
