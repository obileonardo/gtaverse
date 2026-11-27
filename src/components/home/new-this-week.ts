// Home chapter 003, New this week (NewThisWeek.astro): each card's Found toggle shares the map's found set
// (src/lib/found-store.ts), kept in step with the map and other tabs. Pressed = the inverse fill; no motion.
import { readFound, toggleFound, onFoundChange } from '../../lib/found-store';

export function initNewThisWeek(root: HTMLElement) {
  const toggles = [...root.querySelectorAll<HTMLButtonElement>('[data-found]')];
  if (!toggles.length) return;
  const paint = () => {
    const found = new Set(readFound());
    toggles.forEach((b) => b.setAttribute('aria-pressed', String(found.has(b.dataset.found!))));
  };
  toggles.forEach((b) => b.addEventListener('click', () => toggleFound(b.dataset.found!)));
  onFoundChange(paint);
  paint();
}
