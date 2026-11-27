// A subtle tilt toward the pointer on the home page's character and asset cards (landing refresh phase 8, LR43 and
// LR46): the featured explainer card in chapter 013 (Jason and Lucia on the car) and the three collectible layer cards
// in chapter 008. The side under the pointer leans away a little, as if the card faced the pointer, on a critically
// damped spring (--spring-travel), and the card settles exactly flat when the pointer leaves. No loops.
//
// Only a mouse on a fine pointer that can hover, never with reduced motion, never from the keyboard, pen or touch: the
// owner's second cursor exception beside the hero peek (L5). A card tilts only where it has room: if an ancestor that
// clips (a sideways scroller, overflow hidden) would cut the card at its steepest tilt, that card does not tilt on that
// hover and keeps its own hover motion instead. While a card tilts or settles it carries data-tilt, which holds its own
// hover motion (the explainer art's zoom, the layer blip's lift) off, so a card never tilts and scales or lifts at once;
// at rest the attribute is gone. A press holds the tilt still, so the card's press scale runs alone.
//
// The transform is written on the card itself (never a custom property on a parent); the pointer comes from pointer
// events, and the card's box is read once per frame before the writes. The loop runs only while a card moves.
import { Spring, loop, springToken } from '../../scripts/motion/spring';

/** The steepest tilt, in degrees, on a card small enough to reach it (as the hero peek's 3 degree lean). */
export const TILT_MAX_DEG = 3;
/** The perspective the tilt is seen through, in px. */
export const TILT_PERSPECTIVE = 1000;
/** How far an edge may swell under a one-axis tilt, as a share of the card: big cards tilt less. */
const SWELL = 0.015;
/** Settled: a hundredth of a degree from the target and nearly still, then snapped exactly onto it. */
const near = (s: Spring) => Math.abs(s.x - s.target) < 0.01 && Math.abs(s.v) < 0.05;
const tiltOf = (rx: number, ry: number) => `perspective(${TILT_PERSPECTIVE}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;

type Box = { left: number; top: number; width: number; height: number };
type Card = {
  el: HTMLElement; rx: Spring; ry: Spring; max: number;
  inside: boolean; held: boolean; fit: boolean; px: number; py: number;
  clips: HTMLElement[]; reach: { l: number; r: number; t: number; b: number };
};

/** The box a transform projects a w x h box (origin at its centre) onto, relative to that centre. */
function projected(transform: string, w: number, h: number) {
  const m = new DOMMatrixReadOnly(transform);
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
  for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]) {
    const q = m.transformPoint(new DOMPoint(x, y, 0, 1));
    const px = q.x / q.w, py = q.y / q.w;
    l = Math.min(l, px); r = Math.max(r, px); t = Math.min(t, py); b = Math.max(b, py);
  }
  return { l, r, t, b };
}

export function initCardTilt(els: Iterable<HTMLElement>) {
  const list = [...els];
  if (!list.length || typeof matchMedia !== 'function') return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const on = () => fine.matches && !still.matches;
  const response = springToken('travel', 0.3);
  const cards: Card[] = list.map((el) => ({
    el, rx: new Spring(0, response), ry: new Spring(0, response), max: TILT_MAX_DEG,
    inside: false, held: false, fit: false, px: 0, py: 0, clips: [], reach: { l: 0, r: 0, t: 0, b: 0 },
  }));
  let stop: (() => void) | null = null;

  const flat = (c: Card) => c.rx.x === 0 && c.ry.x === 0;
  const mark = (c: Card) => {
    const tilting = (c.inside && c.fit) || !flat(c);
    if (tilting !== c.el.hasAttribute('data-tilt')) c.el.toggleAttribute('data-tilt', tilting);
  };
  const write = (c: Card) => {
    c.el.style.transform = flat(c) ? '' : tiltOf(c.rx.x, c.ry.x);
    mark(c);
  };
  const rest = (c: Card) => { c.inside = false; c.held = false; c.fit = false; c.rx.set(0); c.ry.set(0); write(c); };
  const restAll = () => { stop?.(); stop = null; cards.forEach(rest); };

  // The card's own layout box in the viewport, without its tilt: its bounding box (which every scrolling ancestor has
  // already moved) less what the current tilt adds round its centre. Exact, whatever scrolls.
  const box = (c: Card): Box => {
    const r = c.el.getBoundingClientRect();
    const w = c.el.offsetWidth, h = c.el.offsetHeight;
    if (flat(c)) return { left: r.left, top: r.top, width: w, height: h };
    const p = projected(tiltOf(c.rx.x, c.ry.x), w, h);
    return { left: r.left - p.l - w / 2, top: r.top - p.t - h / 2, width: w, height: h };
  };
  // Room: at the steepest tilt (both axes, every sign), the card's projected box stays inside every ancestor that clips.
  const clippers = (el: HTMLElement) => {
    const out: HTMLElement[] = [];
    for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || /paint|strict|content/.test(cs.contain)) out.push(a);
    }
    return out;
  };
  const reachAt = (max: number, w: number, h: number) => {
    const e = { l: 0, r: 0, t: 0, b: 0 };
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const p = projected(tiltOf(sx * max, sy * max), w, h);
      e.l = Math.max(e.l, -p.l - w / 2); e.r = Math.max(e.r, p.r - w / 2); e.t = Math.max(e.t, -p.t - h / 2); e.b = Math.max(e.b, p.b - h / 2);
    }
    return e;
  };
  const hasRoom = (c: Card, b: Box) => c.clips.every((a) => {
    const r = a.getBoundingClientRect();
    const left = r.left + a.clientLeft, top = r.top + a.clientTop;
    return b.left - c.reach.l >= left - 0.5 && b.left + b.width + c.reach.r <= left + a.clientWidth + 0.5
      && b.top - c.reach.t >= top - 0.5 && b.top + b.height + c.reach.b <= top + a.clientHeight + 0.5;
  });
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
        if (!c.inside || c.held || !c.fit) continue;
        if (!ready(c.el)) { c.rx.to(0); c.ry.to(0); waiting = true; continue; }
        const b = box(c);
        // A scroller moved under a resting pointer and the card would be cut: it goes flat for the rest of this hover.
        if (!hasRoom(c, b)) { c.fit = false; c.rx.to(0); c.ry.to(0); continue; }
        const kx = Math.max(-1, Math.min(1, ((c.px - b.left) / Math.max(b.width, 1)) * 2 - 1));
        const ky = Math.max(-1, Math.min(1, ((c.py - b.top) / Math.max(b.height, 1)) * 2 - 1));
        // Pointer right: the right side leans away (rotateY +). Pointer low: the bottom leans away (rotateX -).
        c.ry.to(kx * c.max);
        c.rx.to(-ky * c.max);
      }
      for (const c of cards) {
        if (c.held) continue;
        if (c.rx.x === c.rx.target && c.ry.x === c.ry.target && c.rx.v === 0 && c.ry.v === 0) { mark(c); continue; }
        c.rx.step(dt); c.ry.step(dt);
        if (near(c.rx) && near(c.ry)) { c.rx.snap(); c.ry.snap(); } else moving = true;
        write(c);
      }
      // A hovered card still rising keeps the loop alive, so it starts to tilt the frame its reveal ends.
      if (!moving && !waiting) stop = null;
      return moving || waiting;
    });
  };

  const sync = () => { if (!on()) restAll(); };
  fine.addEventListener('change', sync);
  still.addEventListener('change', sync);

  for (const c of cards) {
    c.el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !on()) return;
      c.px = e.clientX; c.py = e.clientY;
      if (!c.inside) {
        // Entering: decide once for this hover whether the card has room to tilt. Read while it is at rest or settling.
        c.inside = true;
        const w = c.el.offsetWidth, h = c.el.offsetHeight;
        c.max = Math.min(TILT_MAX_DEG, (Math.asin(Math.min(1, (SWELL * TILT_PERSPECTIVE) / Math.max(Math.max(w, h) / 2, 1))) * 180) / Math.PI);
        c.reach = reachAt(c.max, w, h);
        c.clips = clippers(c.el);
        c.fit = hasRoom(c, box(c));
        mark(c); // set before this frame's style, so the card's own hover motion never starts under a tilt
      }
      if (c.fit) run();
    });
    c.el.addEventListener('pointerleave', () => {
      if (!c.inside) return;
      c.inside = false; c.held = false; c.fit = false;
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
