// Rolling numbers (motion study: "only the digits that change roll"). A number's characters sit in clipped cells;
// when the value changes, only the cells whose character changed roll, up when the number rises and down when it
// falls, over --dur-roll on --ease-out. Digits are tabular, so the width never wobbles. Readers get the plain value:
// the cells are aria-hidden and a visually hidden copy carries the text.
// Used by the map's result count (React, through a ref) and the GTAverse year on the phone ruler.
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
 */
export function roll(el: HTMLElement, value: string, opts: { dir?: 1 | -1; instant?: boolean } = {}) {
  const prev = el.dataset.value;
  if (prev === undefined || !el.querySelector('.roll__cells')) { rollInit(el, value); return; }
  if (prev === value) return;
  const dir = opts.dir ?? (parseFloat(value) < parseFloat(prev) ? -1 : 1);
  el.dataset.value = value;
  el.querySelector('.sr-only')!.textContent = value;
  const cells = el.querySelector<HTMLElement>('.roll__cells')!;
  // Different lengths: line the characters up from the right (units under units) and add or drop cells on the left.
  const have = [...cells.children] as HTMLElement[];
  while (have.length < value.length) { const c = cell(''); cells.prepend(c); have.unshift(c); }
  while (have.length > value.length) have.shift()!.remove();
  const dur = parseFloat(cssVar('--dur-roll', '280ms')) || 280;
  const ease = cssVar('--ease-out', 'cubic-bezier(0.23, 1, 0.32, 1)');
  const still = opts.instant || reduce();
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
    const out = current.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-100 * dir}%)` }], { duration: dur, easing: ease, fill: 'forwards' });
    next.animate([{ transform: `translateY(${100 * dir}%)` }, { transform: 'translateY(0)' }], { duration: dur, easing: ease });
    out.finished.then(() => { current.remove(); next.classList.remove('roll__glyph--in'); }, () => {});
  });
}
