// Rolling numbers (motion study: "only the digits that change roll"). A number's characters sit in clipped cells;
// when the value changes, only the cells whose character changed roll, up when the number rises and down when it
// falls, over --dur-roll on --ease-out. Digits are tabular, so the width never wobbles. Readers get the plain value:
// the cells are aria-hidden and a visually hidden copy carries the text.
// A centred number that changes length (align 'centre', the home stats) rolls as a whole instead: the old number
// leaves and the new one arrives on one centre line.
// Used by the map's result count (React, through a ref), the GTAverse year on the phone ruler and the home stats.
// Styles: .roll in src/styles/components.css.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const cell = (ch: string) => {
  const c = document.createElement('span');
  c.className = 'roll__cell';
  const g = document.createElement('span');
  g.className = 'roll__glyph';
  g.textContent = ch;
  c.append(g);
  return c;
};

/** Slides a glyph one line: in from `dir` (to its place) or out towards `-dir` (and holds there). */
const slide = (g: HTMLElement, dir: 1 | -1, way: 'in' | 'out', dur: number, ease: string) =>
  g.animate(
    way === 'in'
      ? [{ transform: `translateY(${100 * dir}%)` }, { transform: 'translateY(0)' }]
      : [{ transform: 'translateY(0)' }, { transform: `translateY(${-100 * dir}%)` }],
    { duration: dur, easing: ease, fill: way === 'out' ? 'forwards' : 'auto' },
  );

/** Builds the roll markup inside `el` for `value` (no motion). Safe to call on server-rendered text. */
export function rollInit(el: HTMLElement, value: string) {
  el.classList.add('roll');
  el.dataset.value = value;
  const text = document.createElement('span');
  text.className = 'sr-only';
  text.textContent = value;
  const cells = document.createElement('span');
  cells.className = 'roll__cells';
  cells.setAttribute('aria-hidden', 'true');
  for (const ch of value) cells.append(cell(ch));
  el.replaceChildren(text, cells);
}

/**
 * Rolls `el` to `value`. dir: 1 rolls up (the number rose), -1 rolls down; by default it is read from the numbers.
 * instant: swap with no motion (keyboard moves). Reduced motion: the changed characters crossfade.
 * align 'centre': a centred number that changes length rolls as a whole, old and new on one centre line.
 */
export function roll(el: HTMLElement, value: string, opts: { dir?: 1 | -1; instant?: boolean; align?: 'end' | 'centre' } = {}) {
  const prev = el.dataset.value;
  if (prev === undefined || !el.querySelector('.roll__cells')) { rollInit(el, value); return; }
  if (prev === value) return;
  // A whole-number roll still in flight (below) is finished where it is: only its newest number stays.
  const groups = el.querySelectorAll<HTMLElement>('.roll__cells');
  groups.forEach((g, k) => { if (k < groups.length - 1) g.remove(); });
  const dir = opts.dir ?? (parseFloat(value) < parseFloat(prev) ? -1 : 1);
  el.dataset.value = value;
  el.querySelector('.sr-only')!.textContent = value;
  const cells = el.querySelector<HTMLElement>('.roll__cells')!;
  const dur = parseFloat(cssVar('--dur-roll', '280ms')) || 280;
  const ease = cssVar('--ease-out', 'cubic-bezier(0.23, 1, 0.32, 1)');
  const still = opts.instant || reduce();
  // Centred numbers (the home stats) that change length roll as a whole: the old number leaves and the new one
  // arrives on the same centre line, so 85 never sits in the right two places of 892 mid-roll (Chime, 25 Nov 2026).
  if (opts.align === 'centre' && cells.children.length !== [...value].length) {
    el.dataset.rollAlign = 'centre';
    // A digit roll in flight is finished where it is: each cell keeps only its newest glyph.
    for (const c of cells.children) {
      const glyphs = c.querySelectorAll<HTMLElement>('.roll__glyph');
      glyphs.forEach((g, k) => { if (k < glyphs.length - 1) g.remove(); else g.getAnimations().forEach((a) => a.finish()); });
    }
    const next = document.createElement('span');
    next.className = 'roll__cells';
    next.setAttribute('aria-hidden', 'true');
    for (const ch of value) next.append(cell(ch));
    if (still) {
      cells.replaceWith(next);
      if (!opts.instant) next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' });
      return;
    }
    el.append(next);
    cells.querySelectorAll<HTMLElement>('.roll__glyph').forEach((g) => slide(g, dir, 'out', dur, ease));
    const ins = [...next.querySelectorAll<HTMLElement>('.roll__glyph')].map((g) => slide(g, dir, 'in', dur, ease));
    Promise.all(ins.map((a) => a.finished)).then(() => cells.remove(), () => {});
    return;
  }
  // Different lengths: line the characters up from the right (units under units) and add or drop cells on the left.
  const have = [...cells.children] as HTMLElement[];
  while (have.length < value.length) { const c = cell(''); cells.prepend(c); have.unshift(c); }
  while (have.length > value.length) have.shift()!.remove();
  [...value].forEach((ch, i) => {
    const c = have[i];
    const glyphs = c.querySelectorAll<HTMLElement>('.roll__glyph');
    const current = glyphs[glyphs.length - 1];
    if (current.textContent === ch) return;
    // A roll in flight is finished where it is: only the newest value moves.
    glyphs.forEach((g, k) => { if (k < glyphs.length - 1) g.remove(); else g.getAnimations().forEach((a) => a.finish()); });
    const next = document.createElement('span');
    next.className = 'roll__glyph';
    next.textContent = ch;
    if (still) {
      current.remove();
      c.append(next);
      if (!opts.instant) next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' });
      return;
    }
    next.classList.add('roll__glyph--in');
    c.append(next);
    const out = slide(current, dir, 'out', dur, ease);
    slide(next, dir, 'in', dur, ease);
    out.finished.then(() => { current.remove(); next.classList.remove('roll__glyph--in'); }, () => {});
  });
}
