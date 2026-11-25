// Home chapter 006, By type (ByType.astro).
// Choosing a type (a tile, the arrows, or on the phone a swipe of the info cards) crossfades the still and the ruled
// cells in place (old out --dur-swap-out, new in --dur-swap-in, the cells only after the old ones are gone; in CSS) and the accent brackets travel to the tile on
// the travel spring (one element moving between targets). The pager on the still cycles that type's stills. Arrow
// keys move along the strip at once, with no motion (keyboard actions never animate).
import { Spring, loop, springToken, reducedMotion } from '../../scripts/motion/spring';

export function initByType(root: HTMLElement) {
  const tiles = [...root.querySelectorAll<HTMLButtonElement>('[data-bt-tile]')];
  const leads = [...root.querySelectorAll<HTMLElement>('[data-bt-lead]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-bt-panel]')];
  const dots = [...root.querySelectorAll<HTMLElement>('[data-bt-dot]')];
  const track = root.querySelector<HTMLElement>('[data-bt-panels]')!;
  const strip = root.querySelector<HTMLElement>('[data-bt-strip]')!;
  const brackets = root.querySelector<HTMLElement>('[data-bt-brackets]');
  const all = root.querySelector<HTMLAnchorElement>('[data-bt-all]');
  if (!tiles.length) return;
  let active = 0;

  const x = new Spring(0, springToken('travel', 0.3));
  let stop: (() => void) | null = null;
  const tileBox = (i: number) => {
    const t = tiles[i], wrap = brackets!.parentElement!;
    const a = t.getBoundingClientRect(), b = wrap.getBoundingClientRect();
    return { left: a.left - b.left, width: a.width };
  };
  const place = (i: number, instant: boolean) => {
    if (!brackets) return;
    const { left, width } = tileBox(i);
    // In a scrolling strip the chosen tile can be scrolled partly out of view: the brackets fade out there instead
    // of sliding over the arrows, and fade back in once the whole tile is in view.
    const s = strip.getBoundingClientRect(), r = tiles[i].getBoundingClientRect();
    brackets.toggleAttribute('data-out', r.left < s.left - 1 || r.right > s.right + 1);
    brackets.style.width = `${width + 6}px`;
    const target = left - 3;
    if (instant || reducedMotion()) { x.set(target); brackets.style.transform = `translateX(${target}px)`; return; }
    x.to(target);
    if (!stop) stop = loop((dt) => {
      x.step(dt);
      brackets.style.transform = `translateX(${x.x}px)`;
      if (x.done) { x.snap(); brackets.style.transform = `translateX(${x.x}px)`; stop = null; return false; }
      return true;
    });
  };

  const mark = (els: HTMLElement[], i: number) => els.forEach((el, k) => (k === i ? el.setAttribute('data-active', '') : el.removeAttribute('data-active')));
  const phone = () => matchMedia('(max-width: 767px)').matches;

  const select = (i: number, how: 'pointer' | 'key' | 'swipe') => {
    i = (i + tiles.length) % tiles.length;
    if (i === active && how !== 'swipe') return;
    active = i;
    mark(leads, i);
    mark(panels, i);
    mark(dots, i);
    panels.forEach((p, k) => {
      if (!phone()) p.setAttribute('aria-hidden', String(k !== i)); else p.removeAttribute('aria-hidden');
      p.querySelector('a')?.setAttribute('tabindex', k === i ? '0' : '-1');
    });
    tiles.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
    if (all) { all.href = tiles[i].dataset.href!; all.querySelector('.btn__label')!.textContent = `All ${tiles[i].dataset.count}`; }
    place(i, how === 'key');
    // Keep the chosen tile in view in a scrolling strip.
    const t = tiles[i];
    if (strip.scrollWidth > strip.clientWidth) {
      const left = t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2;
      strip.scrollTo({ left, behavior: how === 'key' || reducedMotion() ? 'instant' : 'smooth' });
    }
    // On the phone the info cards are a row: bring the chosen card in unless the swipe already did.
    if (phone() && how !== 'swipe') {
      const p = panels[i];
      track.scrollTo({ left: p.offsetLeft - (track.clientWidth - p.offsetWidth) / 2, behavior: how === 'key' || reducedMotion() ? 'instant' : 'smooth' });
    }
  };

  tiles.forEach((t, k) => t.addEventListener('click', (e) => select(k, (e as MouseEvent).detail === 0 ? 'key' : 'pointer')));
  strip.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    select(active + step, 'key');
    tiles[active].focus();
  });
  root.querySelector('[data-bt-prev]')?.addEventListener('click', (e) => select(active - 1, (e as MouseEvent).detail === 0 ? 'key' : 'pointer'));
  root.querySelector('[data-bt-next]')?.addEventListener('click', (e) => select(active + 1, (e as MouseEvent).detail === 0 ? 'key' : 'pointer'));

  // The pager on the still: show the type's next still.
  leads.forEach((lead) => lead.querySelector('[data-bt-cycle]')?.addEventListener('click', () => {
    const stills = [...lead.querySelectorAll<HTMLElement>('[data-bt-still]')];
    const bars = [...lead.querySelectorAll<HTMLElement>('[data-bt-bar]')];
    const cur = stills.findIndex((s) => s.hasAttribute('data-active'));
    const next = (cur + 1) % stills.length;
    mark(stills, next);
    mark(bars, next);
  }));

  // Phone: a swipe of the info cards chooses the type when the row settles.
  const settle = () => {
    if (!phone()) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = active, dist = Infinity;
    panels.forEach((p, k) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = k; } });
    if (best !== active) select(best, 'swipe');
  };
  let t = 0;
  if ('onscrollend' in window) track.addEventListener('scrollend', settle);
  else track.addEventListener('scroll', () => { clearTimeout(t); t = window.setTimeout(settle, 120); }, { passive: true });

  requestAnimationFrame(() => place(0, true));
  addEventListener('resize', () => place(active, true));
  // Which sides of a scrolling strip have more tiles (the CSS fades those edges).
  const edges = () => {
    const start = strip.scrollLeft > 1, end = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
    if (start || end) strip.dataset.more = start && end ? 'both' : start ? 'start' : 'end';
    else delete strip.dataset.more;
  };
  requestAnimationFrame(edges);
  addEventListener('resize', edges);
  strip.addEventListener('scroll', () => { place(active, true); edges(); }, { passive: true });
}
