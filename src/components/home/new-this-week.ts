// Home chapter 003, New this week (NewThisWeek.astro): A24's chevrons page the track by what fits (four on desktop,
// three on a tablet), gliding on --ease-in-out over 500ms (on-screen movement); the phone's Found toggles share the
// map's found set (src/lib/found-store.ts).
import { glideScroll } from '../../scripts/motion/ease';
import { readFound, toggleFound, onFoundChange } from '../../lib/found-store';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function initNewThisWeek(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-nw-track]');
  const prev = root.querySelector<HTMLButtonElement>('[data-nw-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-nw-next]');
  if (!track || !prev || !next) return;
  let stop: (() => void) | null = null;

  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    const scrolls = getComputedStyle(track).overflowX !== 'visible' && max > 2;
    prev.hidden = !scrolls || track.scrollLeft < 2;
    next.hidden = !scrolls || track.scrollLeft > max - 2;
  };
  const glide = (dir: 1 | -1, instant: boolean) => {
    stop?.();
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const to = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + dir * (track.clientWidth + gap)));
    if (instant || reduce()) { track.scrollLeft = to; return; }
    stop = glideScroll(track, to, 500, () => { stop = null; });
  };
  prev.addEventListener('click', (e) => glide(-1, e.detail === 0));
  next.addEventListener('click', (e) => glide(1, e.detail === 0));
  track.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();

  // Found toggles (phone feed): pressed = the inverse fill, kept in step with the map and other tabs.
  const toggles = [...root.querySelectorAll<HTMLButtonElement>('[data-found]')];
  const paint = () => {
    const found = new Set(readFound());
    toggles.forEach((b) => b.setAttribute('aria-pressed', String(found.has(b.dataset.found!))));
  };
  toggles.forEach((b) => b.addEventListener('click', () => toggleFound(b.dataset.found!)));
  onFoundChange(paint);
  paint();
}
