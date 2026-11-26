// Home chapter 007, The map (TheMap.astro).
// The coast drawing is fetched when the chapter nears the screen (it is built at deploy and git-ignored, like the
// hero's), drawn into every [data-mp-coast] group, and swept in from the south once on first view (clip-path, 1.6s,
// --ease-in-out; never on a back navigation; reduced motion: a short fade). Hovering or focusing a region row makes
// it the active row (its second line crossfades in) and lights that region's pinned finds on the drawing; while the
// pointer or focus is in the list, the drawing shows the active region's tag (LR23). CSS runs the fades (LR13 order:
// old out, then new in); a row reached from the keyboard swaps at once (data-key).

type Coast = { aspect: number; paths: number[][][] };

export function initTheMap(root: HTMLElement) {
  const art = root.querySelector<HTMLElement>('[data-mp-art]');
  const list = root.querySelector<HTMLElement>('[data-mp-list]');
  const rows = [...root.querySelectorAll<HTMLElement>('[data-mp-row]')];
  // Everything that follows the active region: its row, its pin group and its tag.
  const marks = [...root.querySelectorAll<Element>('[data-mp-row], [data-mp-pins], [data-mp-tag]')];
  const regionOf = (el: Element) => el.getAttribute('data-mp-row') || el.getAttribute('data-mp-pins') || el.getAttribute('data-mp-tag');
  const setActive = (id: string) => marks.forEach((m) => (regionOf(m) === id ? m.setAttribute('data-active', '') : m.removeAttribute('data-active')));
  let hovered = false;
  const engage = () => { if (hovered || list?.contains(document.activeElement)) root.dataset.engaged = ''; else delete root.dataset.engaged; };
  rows.forEach((r) => {
    r.addEventListener('pointerenter', () => { delete root.dataset.key; setActive(r.dataset.mpRow!); });
    r.addEventListener('focus', () => {
      if (r.matches(':focus-visible')) root.dataset.key = '';
      setActive(r.dataset.mpRow!);
    });
  });
  list?.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { hovered = true; engage(); } });
  list?.addEventListener('pointerleave', () => { hovered = false; engage(); });
  list?.addEventListener('focusin', engage);
  list?.addEventListener('focusout', () => requestAnimationFrame(engage));

  const draw = (coast: Coast) => {
    const d = coast.paths.map((p) => `M${p.map(([x, y]) => `${(x * 1000).toFixed(1)} ${(y * 1000).toFixed(1)}`).join('L')}Z`).join('');
    root.querySelectorAll<SVGGElement>('[data-mp-coast]').forEach((g) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      g.replaceChildren(path);
    });
  };
  const load = async () => {
    const url = art?.dataset.coast;
    if (!url) return;
    try {
      const res = await fetch(url);
      if (res.ok) draw(await res.json());
    } catch { /* no drawing: the collectible dots still outline Leonida */ }
  };

  if (!art) return;
  const back = document.documentElement.classList.contains('nav-back');
  if (!('IntersectionObserver' in window)) { art.dataset.in = 'skip'; load(); return; }
  // Load a screen early; draw once the drawing is a fifth in view.
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); load(); } }, { rootMargin: '100% 0px' });
  near.observe(root);
  if (back) { art.dataset.in = 'skip'; return; }
  const seen = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    art.dataset.in = 'in';
    seen.disconnect();
  }, { threshold: 0.2 });
  seen.observe(art);
}
