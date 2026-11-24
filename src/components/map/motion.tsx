// Motion for the map's React island (motion study items 7 and 9). Values come from the tokens in tokens.css.
//   usePresence  keeps a closing drawer, toast, popup or card mounted while it leaves the way it came in
//   RollNumber   the result count, rolled by the shared roll (scripts/motion/roll.ts)
//   listFlip     rows keep their place when the filters change: rows that stay glide, rows that go fade, new ones rise
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { roll } from '../../scripts/motion/roll';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * Presence: while `value` is set it is shown; when it clears, the last value stays mounted with closing = true for
 * `exitMs` (its CSS exit plays), then unmounts. Set again before that and it reverses from where it is (CSS
 * transitions retarget), so a quick reopen never jumps.
 */
export function usePresence<T>(value: T | null | undefined, exitMs: number): { item: T | null; closing: boolean } {
  // The last value lives in a ref, not state: storing it in an effect re-rendered the whole map screen a second
  // time in the same task as opening a find. Only the end of an exit re-renders.
  const kept = useRef<T | null>(value ?? null);
  const [, setGone] = useState(0);
  if (value != null) kept.current = value;
  useEffect(() => {
    if (value != null || kept.current == null) return;
    const t = window.setTimeout(() => { kept.current = null; setGone((n) => n + 1); }, reduce() ? 150 : exitMs);
    return () => clearTimeout(t);
  }, [value, exitMs]);
  if (value != null) return { item: value, closing: false };
  return { item: kept.current, closing: kept.current != null };
}

/** A count that rolls to its new value; only the digits that change move. */
export function RollNumber({ value, instant }: { value: number; instant?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [initial] = useState(() => String(value));
  const born = useRef(0);
  useEffect(() => { born.current = performance.now(); }, []);
  useLayoutEffect(() => {
    // The first changes after load (saved filters, a shared link) are state arriving, not an action: no roll.
    if (ref.current) roll(ref.current, String(value), { instant: instant || performance.now() - born.current < 600 });
  }, [value]);
  return <span ref={ref} className="tabular" dangerouslySetInnerHTML={{ __html: initial }} />;
}

type Snap = Map<string, { top: number; node: HTMLElement }>;

/**
 * FLIP for the find list. capture() before the filters change (the old layout), play() after React has drawn the
 * new list. Only rows near the screen animate (at most 20); everything else just takes its place.
 */
export function listFlip() {
  let snap: Snap | null = null;
  const key = (li: Element) => (li as HTMLElement).dataset.key ?? '';
  const near = (r: DOMRect) => r.bottom > -120 && r.top < innerHeight + 120;
  return {
    capture(list: HTMLElement | null) {
      if (!list) { snap = null; return; }
      snap = new Map();
      for (const li of list.querySelectorAll<HTMLElement>(':scope > [data-key]')) {
        const r = li.getBoundingClientRect(); // where it is seen now, mid-flight included
        if (near(r) && snap.size < 20) snap.set(key(li), { top: r.top, node: li });
      }
    },
    play(list: HTMLElement | null, instant = false) {
      const before = snap;
      snap = null;
      if (!list || !before || instant) return;
      const rows = [...list.querySelectorAll<HTMLElement>(':scope > [data-key]')];
      // Anything still moving stops where it is: only the newest change plays.
      rows.forEach((li) => li.getAnimations().forEach((a) => a.cancel()));
      list.querySelectorAll('.frow-ghost').forEach((g) => g.remove());
      const glide = token('--ease-in-out', 'ease-in-out');
      const arrive = token('--ease-out', 'ease-out');
      const leave = token('--ease-standard', 'ease');
      const lr = list.getBoundingClientRect();
      const still = reduce();
      let moved = 0;
      for (const li of rows) {
        const was = before.get(key(li));
        const r = li.getBoundingClientRect();
        if (!near(r) || moved >= 20) continue;
        moved++;
        if (was) {
          const dy = was.top - r.top;
          // Long moves take a little longer (240 to 380ms), so a row crossing the list glides instead of lurching.
          const duration = Math.round(Math.min(380, 240 + Math.abs(dy) * 0.2));
          if (Math.abs(dy) > 0.5 && !still) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration, easing: glide });
          before.delete(key(li));
        } else {
          li.animate(still ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: still ? 150 : 200, easing: arrive, fill: 'backwards' });
        }
      }
      // Rows that left are out of the layout already (the rest close the gap now); a copy fades where they were.
      for (const { top, node } of before.values()) {
        const ghost = document.createElement('div');
        ghost.className = 'frow-ghost';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.inert = true;
        ghost.append(...[...node.childNodes].map((n) => n.cloneNode(true)));
        ghost.style.top = `${top - lr.top}px`;
        list.append(ghost);
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: leave, fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove());
      }
    },
  };
}
