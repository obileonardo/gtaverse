// The optional game cursor and its trail (owner decision LR48, 26 Nov 2026; LR49 to LR52). Loaded only when the
// visitor switches it on in the menu (CursorControl.astro), on a desktop mouse, without reduced motion.
//
// The cursor is a real CSS cursor (a glyph of our icon family, src/icons/cursors.ts), so the system draws it with no
// lag and no script per frame. It only replaces the default arrow: links and buttons keep the hand, reading text the
// text cursor, form controls the browser's own cursor, and editable text and summaries the native cursor (the rules
// sit in a cascade layer, so every cursor the site sets itself still wins).
//
// The trail: a few marks dropped along the pointer's path (bullet tracers behind the player arrow, smoke puffs from
// the pistol's muzzle), each animated once on the compositor (transform and opacity, WAAPI) and gone within
// --dur-trail. Capped: a fixed pool, the oldest mark is reused. No mark where the native cursor shows (text, links,
// fields), while a button is held (selecting text, dragging the map), or while the tab is hidden. A still pointer
// fires no events, so nothing runs.
import { cursors, cursorTone, type CursorName } from '../../icons/cursors';

type Trail = { kind: 'bullet' | 'smoke'; gap: number; cap: number };
// gap: pixels of travel between two marks; cap: marks alive at once.
const TRAILS: Record<CursorName, Trail> = {
  arrow: { kind: 'bullet', gap: 22, cap: 8 },
  pistol: { kind: 'smoke', gap: 18, cap: 6 },
};

const STYLE = `
@layer vf-cursor {
  :root[data-cursor] { cursor: var(--vf-cursor, auto); }
  :root[data-cursor] :where(p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, figcaption, caption, td, th, pre, address):not(:where(a, button, label, summary, [role='button'], [role='link'], [role='tab'], [role='option'], [role='menuitem']) *) { cursor: auto; }
  /* Form controls keep exactly the browser's own cursor (text in fields, default on checkboxes and ranges); editable
     text and a disclosure's summary (the spoiler "Reveal") keep auto, as without the setting. */
  :root[data-cursor] :where(input, textarea, select) { cursor: revert; }
  :root[data-cursor] :where([contenteditable]:not([contenteditable='false']), summary) { cursor: auto; }
}
.vf-trail { position: fixed; inset: 0; z-index: calc(var(--z-overlay) + 2); pointer-events: none; overflow: hidden; contain: strict; }
.vf-trail > i { position: absolute; left: 0; top: 0; opacity: 0; }
.vf-trail--bullet > i { width: 8px; height: 3px; margin: -1.5px 0 0 -4px; border-radius: var(--radius-full); background: var(--accent-ink); }
.vf-trail--smoke > i { width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: var(--text-3); }
`;

const TEXT_ENTRY = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

let current: CursorName | null = null;
let style: HTMLStyleElement | null = null;
let layer: HTMLDivElement | null = null;
let marks: { el: HTMLElement; anim: Animation | null }[] = [];
let next = 0;
let theme: MutationObserver | null = null;
let duration = 280;
let easing = 'ease-out';
/** Motion tokens, read by the caller with tokenMs (so this module has no shared imports and loads as one file). */
export type TrailTiming = { duration: number; easing: string };
// Pointer state, read once per frame.
let px = 0, py = 0, lastX = NaN, lastY = NaN, held = 0, frame = 0;
let target: Element | null = null;
let shownFor: Element | null = null;
let shown = false;

const root = () => document.documentElement;
const token = (name: string) => getComputedStyle(root()).getPropertyValue(name).trim();

/** The cursor image for the current theme: the generated SVG with the tokens' colours, as a data URL. */
function paint() {
  if (!current) return;
  const c = cursors[current];
  const ink = token(cursorTone.ink[0]) || cursorTone.ink[1];
  const key = token(cursorTone.key[0]) || cursorTone.key[1];
  const svg = c.svg.replaceAll('%INK%', ink).replaceAll('%KEY%', key);
  root().style.setProperty('--vf-cursor', `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c.hotspot[0]} ${c.hotspot[1]}, auto`);
}

/** True where our cursor shows: the trail belongs to it, so it never follows the native text cursor, hand or a field. */
function showsGameCursor(el: Element | null): boolean {
  if (!el) return false;
  if (el === shownFor) return shown;
  shownFor = el;
  shown = !el.closest(TEXT_ENTRY) && getComputedStyle(el).cursor.startsWith('url(');
  return shown;
}

function clear() {
  marks.forEach((m) => { m.anim?.cancel(); m.anim = null; });
  lastX = lastY = NaN;
}

function drop(x: number, y: number, dx: number, dy: number) {
  if (!current || !marks.length) return;
  const m = marks[next];
  next = (next + 1) % marks.length;
  m.anim?.cancel();
  const at = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  const frames: Keyframe[] = TRAILS[current].kind === 'bullet'
    ? [
        { transform: `${at} rotate(${Math.atan2(dy, dx).toFixed(3)}rad) scaleX(1)`, opacity: 0.9 },
        { transform: `${at} rotate(${Math.atan2(dy, dx).toFixed(3)}rad) scaleX(0.4)`, opacity: 0 },
      ]
    : [
        { transform: `${at} scale(0.5)`, opacity: 0.5 },
        { transform: `${at} scale(1.4)`, opacity: 0 },
      ];
  m.anim = m.el.animate(frames, { duration, easing });
  m.anim.onfinish = () => { m.anim = null; };
}

function tick() {
  frame = 0;
  if (!current || document.hidden) return;
  // Selecting text or dragging: no trail. Where the native cursor shows: no trail, and the path starts again.
  if (held || !showsGameCursor(target)) { lastX = lastY = NaN; return; }
  if (Number.isNaN(lastX)) { lastX = px; lastY = py; return; }
  const dx = px - lastX, dy = py - lastY;
  if (Math.hypot(dx, dy) < TRAILS[current].gap) return;
  drop(px, py, dx, dy);
  lastX = px; lastY = py;
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;
  px = e.clientX; py = e.clientY; held = e.buttons;
  target = e.target instanceof Element ? e.target : null;
  if (!frame) frame = requestAnimationFrame(tick);
}

const onHidden = () => { if (document.hidden) clear(); };
const onLeave = (e: PointerEvent) => { if (!e.relatedTarget) clear(); };

function buildLayer(name: CursorName) {
  layer?.remove();
  const t = TRAILS[name];
  layer = document.createElement('div');
  layer.className = `vf-trail vf-trail--${t.kind}`;
  layer.setAttribute('aria-hidden', 'true');
  marks = Array.from({ length: t.cap }, () => ({ el: layer!.appendChild(document.createElement('i')), anim: null }));
  next = 0;
  document.body.appendChild(layer);
}

/** Shows the named cursor (or switches to it). Safe to call again. */
export function startCursor(name: CursorName, timing: TrailTiming) {
  if (current === name) return;
  const first = current === null;
  current = name;
  if (first) {
    style = document.createElement('style');
    style.dataset.vfCursor = '';
    style.textContent = STYLE;
    document.head.appendChild(style);
    duration = Math.min(Number.isFinite(timing.duration) ? timing.duration : 280, 300);
    easing = timing.easing || 'ease-out';
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onHidden);
    theme = new MutationObserver(paint);
    theme.observe(root(), { attributes: true, attributeFilter: ['data-theme'] });
  }
  clear();
  buildLayer(name);
  paint();
  root().dataset.cursor = name;
  shownFor = null;
}

/** Back to the system cursor: removes the cursor, the trail, every listener and the stylesheet. */
export function stopCursor() {
  if (current === null) return;
  current = null;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  clear();
  window.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerout', onLeave);
  document.removeEventListener('visibilitychange', onHidden);
  theme?.disconnect();
  theme = null;
  layer?.remove();
  layer = null;
  marks = [];
  style?.remove();
  style = null;
  delete root().dataset.cursor;
  root().style.removeProperty('--vf-cursor');
  target = shownFor = null;
}
