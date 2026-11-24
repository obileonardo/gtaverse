// Page-level motion that every page shares (motion study, docs/DESIGN-SYSTEM.md "Motion"):
//   - card walls and list rows reveal once, the first time they come into view (item 8)
//   - a move between game hubs tells the next page which side to arrive from (item 13)
// The inline script in Base.astro handles what must run before first paint (html.js, image fades, pagereveal).

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Gap before item i of a group: 50ms, each gap 10% shorter than the last, capped at the sixth item. */
export function staggerDelay(i: number, step = 50, cap = 6) {
  let t = 0;
  for (let k = 0; k < Math.min(i, cap - 1); k++) t += step * 0.9 ** k;
  return Math.round(t);
}

function cssNumber(name: string, fallback: number) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/** Item 8: card walls and list rows rise once on first view, never on a back navigation. */
function initReveal() {
  const sel = ':is(main .card, [data-reveal] > li):not([data-rv], .moment *, [role="tabpanel"] *)';
  const items = [...document.querySelectorAll<HTMLElement>(sel)];
  if (!items.length) return;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === 'back_forward' || !('IntersectionObserver' in window)) {
    items.forEach((el) => (el.dataset.rv = 'skip'));
    return;
  }
  const step = cssNumber('--stagger-group', 50);
  const cap = cssNumber('--stagger-cap', 6);
  let firstBatch = true;
  const io = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
    // Reading order: top to bottom, then left to right.
    entering.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return Math.abs(ra.top - rb.top) > 4 ? ra.top - rb.top : ra.left - rb.left;
    });
    // What is on screen when the page opens starts together at 120ms, after the page has arrived.
    const base = firstBatch ? 120 : 0;
    firstBatch = false;
    // Each row staggers on its own (reading order within the row); rows that enter together start together.
    let rowTop = NaN, i = 0;
    entering.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (!(Math.abs(top - rowTop) <= 4)) { rowTop = top; i = 0; } else i++;
      el.style.setProperty('--rv-delay', `${reduce() ? 0 : base + staggerDelay(i, step, cap)}ms`);
      el.dataset.rv = 'in';
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  items.forEach((el) => io.observe(el));
  // A page restored from the back-forward cache keeps its state: nothing replays.
}

/** Item 13: leaving one game hub for another, record which way the move goes (pagereveal in Base.astro reads it). */
function initGameDirection() {
  const order: string[] = JSON.parse(document.querySelector<HTMLElement>('[data-game-order]')?.dataset.gameOrder ?? '[]');
  if (!order.length) return;
  const hubOf = (path: string) => /^\/gtaverse\/games\/([\w-]+)\/?$/.exec(path)?.[1] ?? null;
  const record = (to: URL) => {
    const a = hubOf(location.pathname), b = hubOf(to.pathname);
    if (!a || !b || a === b || to.origin !== location.origin) return;
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia < 0 || ib < 0) return;
    try { sessionStorage.setItem('vf-vt', JSON.stringify({ to: to.pathname, type: ib > ia ? 'game-next' : 'game-prev', t: Date.now() })); } catch { /* storage blocked: the default page transition plays */ }
  };
  addEventListener('pageswap', (e) => {
    const url = (e as Event & { activation?: { entry?: { url?: string } } }).activation?.entry?.url;
    if (url) record(new URL(url));
  });
  // Browsers that fire no pageswap: the click on a link is the move.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.<HTMLAnchorElement>('a[href]');
    if (a && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) record(new URL(a.href));
  });
}

/**
 * Item 1: the island is its own layer in a page transition. It is named only for the transition (see Header.astro):
 * here as the old page is captured, and cleared again if the page comes back from the back-forward cache.
 */
function initIslandLayer() {
  const island = document.querySelector<HTMLElement>('.island');
  if (!island) return;
  addEventListener('pageswap', (e) => { if ((e as Event & { viewTransition?: unknown }).viewTransition) island.style.viewTransitionName = 'island'; });
  addEventListener('pageshow', () => { island.style.viewTransitionName = ''; });
}

export function initSiteMotion() {
  document.documentElement.classList.add('motion');
  initIslandLayer();
  initReveal();
  initGameDirection();
}
