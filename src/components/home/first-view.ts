// Shared helpers for the round 2 home chapters and the footer: run something once, the first time an element comes
// into view, never on a back navigation (html.nav-back, set before first paint in Base.astro).

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isBack = () => document.documentElement.classList.contains('nav-back');

/**
 * Calls `run(el)` once when `el` first enters view (15% up from the bottom edge, as site-motion.ts reveals cards).
 * On a back navigation, or without IntersectionObserver, `skip(el)` runs at once instead (the finished state).
 */
export function onFirstView(els: Iterable<Element>, run: (el: HTMLElement) => void, skip: (el: HTMLElement) => void = run, margin = '0px 0px -15% 0px') {
  const list = [...els] as HTMLElement[];
  if (!list.length) return;
  if (isBack() || !('IntersectionObserver' in window)) { list.forEach(skip); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      run(e.target as HTMLElement);
    }
  }, { rootMargin: margin });
  list.forEach((el) => io.observe(el));
}

/** Marks `[data-fv]` elements data-fv="in" on first view (CSS holds the hidden start state under html.js). */
export function initFirstView(root: ParentNode = document) {
  onFirstView(root.querySelectorAll('[data-fv]:not([data-fv="in"])'), (el) => { el.dataset.fv = 'in'; }, (el) => { el.dataset.fv = 'skip'; });
}
