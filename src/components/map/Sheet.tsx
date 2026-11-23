// Phone bottom sheet (Apple Maps): drag with the finger 1:1, release into a spring seeded with the finger's speed,
// land on the snap point nearest to where the flick was heading, and catch it again mid-flight at any time.
// The spring is critically damped (no bounce, a product rule). Transforms are written straight to the element, so a
// drag never re-renders React. Below the top snap the whole sheet drags; at the top snap only the handle area does,
// and the content scrolls.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';

export type SnapPoint = { id: string; top: (h: number) => number };
export type SheetHandle = { snapTo: (id: string, instant?: boolean) => void; element: HTMLElement | null };

// Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest.
const project = (v: number, rate = 0.998) => ((v / 1000) * rate) / (1 - rate);
// Progressive resistance past the top snap.
const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Props = {
  snaps: SnapPoint[];
  snap: string;
  onSnap: (id: string) => void;
  closedId?: string; // a snap that means "closed"; reaching it calls onSnap(closedId)
  className?: string;
  label: string;
  role?: 'dialog' | 'region';
  children: ReactNode;
  onTransform?: (y: number, h: number) => void;
  inert?: boolean; // closed: out of the tab order and hidden from readers
  enabled?: boolean; // false on desktop: the same element is laid out by CSS (a column or a card) and never drags
};

export const Sheet = forwardRef<SheetHandle, Props>(function Sheet({ snaps, snap, onSnap, closedId, className, label, role = 'region', children, onTransform, enabled = true, inert = false }, ref) {
  const el = useRef<HTMLDivElement>(null);
  const y = useRef(10000);
  const anim = useRef(0);
  const current = useRef(snap); // the snap the sheet sits at, or is heading to
  const latest = useRef({ snap, onSnap });
  latest.current = { snap, onSnap };
  const drag = useRef<{ id: number; startY: number; startSheet: number; samples: { t: number; y: number }[]; active: boolean; allowed: boolean } | null>(null);
  const suppressClick = useRef(false);

  const height = () => el.current?.parentElement?.clientHeight ?? (typeof innerHeight === 'number' ? innerHeight : 800);
  const topOf = useCallback((id: string) => (snaps.find((s) => s.id === id) ?? snaps[0]).top(height()), [snaps]);
  const minTop = () => Math.min(...snaps.map((s) => s.top(height())));

  const write = (v: number) => {
    y.current = v;
    if (el.current) el.current.style.transform = `translate3d(0, ${v}px, 0)`;
    onTransform?.(v, height());
  };

  const settle = (id: string) => {
    if (el.current) el.current.dataset.snap = id;
    if (id !== latest.current.snap) latest.current.onSnap(id); // read the latest props: the spring outlives renders
  };

  // Critically damped spring (damping ratio 1, response 0.4s): no overshoot, carries the release velocity.
  const springTo = (id: string, velocity = 0, instant = false) => {
    cancelAnimationFrame(anim.current);
    current.current = id;
    const target = topOf(id);
    if (el.current) el.current.dataset.snap = id;
    if (instant || reduced()) { write(target); settle(id); return; }
    const omega = (2 * Math.PI) / 0.4;
    let x = y.current, v = velocity, last = performance.now();
    const step = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 30));
      last = now;
      const a = -omega * omega * (x - target) - 2 * omega * v;
      v += a * dt;
      x += v * dt;
      if (Math.abs(x - target) < 0.5 && Math.abs(v) < 8) { write(target); settle(id); return; }
      write(x);
      anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };

  useImperativeHandle(ref, () => ({ snapTo: (id, instant) => springTo(id, 0, instant), element: el.current }), [snaps]);

  // Follow the controlled snap. The first placement happens before paint, without motion.
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(anim.current);
      placed.current = false;
      current.current = snap;
      if (el.current) { el.current.style.transform = ''; el.current.dataset.snap = snap; }
      return;
    }
    if (!placed.current) {
      placed.current = true;
      write(topOf(closedId ?? snap));
      current.current = closedId ?? snap;
      if (snap !== closedId) springTo(snap); // painted at the closed position first, then springs in
      else settle(snap);
      return;
    }
    if (snap !== current.current && !drag.current?.active) springTo(snap);
  }, [snap, enabled]);

  useEffect(() => {
    const onResize = () => { if (enabled && !drag.current?.active) { cancelAnimationFrame(anim.current); write(topOf(current.current)); } };
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [snaps, enabled]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []); // stop the spring only on unmount

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return; // ignore a second finger
    const atTop = Math.abs(y.current - minTop()) < 2;
    const fromHandle = !!(e.target as HTMLElement).closest('[data-sheet-handle]');
    if (atTop && !fromHandle) return; // content scrolls at the top snap
    cancelAnimationFrame(anim.current); // catch it mid-flight, from where it is on screen
    drag.current = { id: e.pointerId, startY: e.clientY, startSheet: y.current, samples: [{ t: e.timeStamp, y: y.current }], active: false, allowed: true };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(dy) < 6) return; // hysteresis before committing, so taps stay taps
      d.active = true;
      el.current?.setPointerCapture(e.pointerId);
      el.current?.classList.add('is-dragging');
    }
    let next = d.startSheet + dy;
    const top = minTop();
    if (next < top) next = top - rubberband(top - next, height());
    write(next);
    d.samples.push({ t: e.timeStamp, y: next });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 100) d.samples.shift();
  };
  const end = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    el.current?.classList.remove('is-dragging');
    if (!d.active) { springTo(current.current); return; }
    suppressClick.current = true; // the drag was not a tap on whatever sat under the finger
    const a = d.samples[0], b = d.samples[d.samples.length - 1];
    const v = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0;
    const projected = y.current + project(v);
    const H = height();
    let best = snaps[0];
    for (const s of snaps) if (Math.abs(s.top(H) - projected) < Math.abs(best.top(H) - projected)) best = s;
    springTo(best.id, v);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; }
  };

  return (
    <div
      ref={el}
      className={['sheet', className].filter(Boolean).join(' ')}
      role={role}
      aria-label={label}
      aria-modal={role === 'dialog' ? false : undefined}
      inert={inert || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
});
