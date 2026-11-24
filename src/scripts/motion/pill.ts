// The travelling pill: one highlight behind a vertical list of rows that glides to the row under the pointer instead
// of a hover colour blinking on and off (motion study items 4 and 13). Its two edges ride two critically damped
// springs: the edge facing the move on --spring-lead, the other on --spring-trail, so the pill stretches toward where
// it is going and lands whole, never overshooting. The stretch is capped at 35% of a row. Written as one transform
// per frame (translateY + scaleY), so it stays on the compositor.
// First hover: the pill appears in place (opacity only). Leaving the list: it fades. Keyboard focus: it jumps.
// Fine pointers only; reduced motion: it jumps and fades. Used by the site menu rows and the Games rail.
import { Spring, loop, reducedMotion, springToken } from './spring';

const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * box: the positioned element the pill lives in (it scrolls with it). rows: selector for the rows inside it.
 * className: the pill's class (its look lives in CSS).
 */
export function travellingPill(box: HTMLElement, rows: string, className: string) {
  const pill = document.createElement('span');
  pill.className = `pill-hl ${className}`;
  pill.setAttribute('aria-hidden', 'true');
  box.prepend(pill);
  box.classList.add('has-pill');

  const lead = springToken('lead', 0.2);
  const trail = springToken('trail', 0.34);
  let top = new Spring(0, lead);
  let bottom = new Spring(0, lead);
  let base = 0; // the row height the pill is drawn at (scaleY 1)
  let shown = false;
  let stop: (() => void) | null = null;

  const write = () => {
    const h = Math.max(1, bottom.x - top.x);
    pill.style.transform = `translate3d(0, ${top.x}px, 0) scaleY(${h / base})`;
  };
  const measure = (row: HTMLElement) => {
    // Offsets inside the box, read from layout boxes (not transforms), so a moving row never feeds back.
    const b = box.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    return { y: r.top - b.top + box.scrollTop, h: r.height, x: r.left - b.left, w: r.width };
  };

  const goTo = (row: HTMLElement, instant: boolean) => {
    const m = measure(row);
    if (!base || Math.abs(base - m.h) > 0.5) { base = m.h; pill.style.height = `${m.h}px`; }
    pill.style.left = `${m.x}px`;
    pill.style.width = `${m.w}px`;
    const from = (top.target + bottom.target) / 2;
    if (!shown || instant || reducedMotion()) {
      stop?.(); stop = null;
      top.set(m.y); bottom.set(m.y + m.h);
      write();
      pill.classList.add('is-on');
      shown = true;
      return;
    }
    // The edge facing the move leads; swap which spring is which, keeping each edge's position and speed.
    const down = m.y > from;
    const lw = (2 * Math.PI) / lead, tw = (2 * Math.PI) / trail;
    top.w = down ? tw : lw;
    bottom.w = down ? lw : tw;
    top.to(m.y);
    bottom.to(m.y + m.h);
    if (stop) return;
    stop = loop((dt) => {
      // Step in small slices so the cap below holds through a long frame.
      for (let s = 0; s < 2; s++) {
        top.step(dt / 2);
        bottom.step(dt / 2);
        const max = base * 1.35, min = base * 0.65;
        // Cap the stretch: the trailing edge is pulled along at the lead's speed once the pill is 35% longer.
        if (bottom.x - top.x > max) {
          if (down) { top.x = bottom.x - max; top.v = Math.max(top.v, bottom.v); }
          else { bottom.x = top.x + max; bottom.v = Math.min(bottom.v, top.v); }
        }
        if (bottom.x - top.x < min) {
          if (down) { bottom.x = top.x + min; } else { top.x = bottom.x - min; }
        }
      }
      write();
      if (top.done && bottom.done) { top.snap(); bottom.snap(); write(); stop = null; return false; }
      return true;
    });
  };

  const hide = () => {
    pill.classList.remove('is-on');
    shown = false;
  };

  let pointerMoved = false;
  box.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' && !fine()) return;
    pointerMoved = true;
    const row = (e.target as HTMLElement).closest<HTMLElement>(rows);
    if (row && box.contains(row)) goTo(row, false);
  });
  box.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' || fine()) hide();
  });
  // Keyboard: the pill marks the focused row at once (keyboard moves never animate).
  box.addEventListener('focusin', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(rows);
    if (!row || !(e.target as HTMLElement).matches(':focus-visible')) return;
    pointerMoved = false;
    goTo(row, true);
  });
  box.addEventListener('focusout', (e) => {
    if (!pointerMoved && !box.contains(e.relatedTarget as Node)) hide();
  });

  return {
    /** Hides the pill at once (the list closed). */
    reset() { stop?.(); stop = null; hide(); pill.classList.add('is-instant'); requestAnimationFrame(() => pill.classList.remove('is-instant')); },
    /** For checks: the pill's current edges. */
    edges: () => ({ top: top.x, bottom: bottom.x }),
  };
}
