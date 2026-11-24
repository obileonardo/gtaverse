// The peek frame. Desktop: hovering (or focusing) a line of the A24 stack shows that find's clip thumbnail in a small
// tilted frame beside the line, overlapping the list; moving to another line moves the frame and swaps the picture.
// Touch (no hover): the first tap on a line shows the frame, a second tap opens the find. The phone's Apple TV slides
// do the same with a frame above the title. Thumbnails come from YouTube and only for finds that are safe to show
// (Hero.astro leaves data-peek-thumb out for spoiler, mature and Shorts).

export function initPeek(hero: HTMLElement) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let lastPointer = 'mouse';
  hero.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType), { capture: true });

  // ---------------------------------------------------------------- desktop: A24 stack
  const root = hero.querySelector<HTMLElement>('[data-peek-root]');
  const list = hero.querySelector<HTMLElement>('[data-a24-list]');
  const frame = hero.querySelector<HTMLElement>('[data-peek]');
  const imgs = [...hero.querySelectorAll<HTMLImageElement>('[data-peek-img]')];
  const items = [...hero.querySelectorAll<HTMLAnchorElement>('.a24__item')];
  const subbar = document.querySelector<HTMLAnchorElement>('[data-subbar]');
  const subImg = document.querySelector<HTMLImageElement>('[data-subbar-img]');
  let current: HTMLAnchorElement | null = null;
  let layer = 0;

  if (root && list && frame) {
    const place = (item: HTMLAnchorElement) => {
      const anchor = item.querySelector<HTMLElement>('[data-peek-anchor]') ?? item;
      const box = root.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const fw = frame.offsetWidth, fh = frame.offsetHeight;
      const pad = parseFloat(getComputedStyle(root).paddingRight) || 40;
      // Just past the end of the line's title, over the lines above and below; never over the scroll arrow.
      const x = Math.min(a.right - box.left + 16, box.width - pad - fw - 56);
      // Centred on the line, so the frame spans about two lines of the stack.
      const y = a.top - box.top + a.height / 2 - fh / 2;
      frame.style.setProperty('--x', `${Math.round(Math.max(x, 0))}px`);
      frame.style.setProperty('--y', `${Math.round(y)}px`);
      frame.style.setProperty('--tilt', `${Number(item.dataset.index) % 2 ? 2.5 : -3}deg`);
    };

    const show = (item: HTMLAnchorElement, instant: boolean) => {
      const opening = !frame.classList.contains('is-open');
      // Keyboard moves and the first appearance place the frame without travel.
      if (opening || instant) {
        frame.classList.add('is-instant');
        place(item);
        void frame.offsetWidth;
      } else place(item);
      if (!instant) frame.classList.remove('is-instant');
      frame.classList.add('is-open');
      if (current !== item) {
        const src = item.dataset.peekThumb;
        layer = 1 - layer;
        const img = imgs[layer];
        if (src) img.src = src;
        imgs.forEach((im, k) => im.classList.toggle('is-on', k === layer && Boolean(src)));
      }
      current = item;
      items.forEach((a) => a.classList.toggle('is-hot', a === item));
      list.dataset.hot = 'true';
      if (subbar) subbar.href = `/finds/${item.dataset.slug}`;
      if (subImg && item.dataset.peekThumb) subImg.src = item.dataset.peekThumb.replace('/hqdefault', '/mqdefault');
    };
    const hide = () => {
      frame.classList.remove('is-open', 'is-instant');
      current = null;
      items.forEach((a) => a.classList.remove('is-hot'));
      delete list.dataset.hot;
    };

    items.forEach((a) => {
      a.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse' || fine.matches) show(a, false);
      });
      a.addEventListener('focus', () => {
        if (lastPointer === 'mouse' || lastPointer === 'pen') show(a, true);
      });
      a.addEventListener('click', (e) => {
        if (lastPointer !== 'touch') return;
        // Touch: the first tap shows the frame, the second opens the find.
        if (current !== a) {
          e.preventDefault();
          show(a, false);
        }
      });
    });
    list.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') hide();
    });
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget as Node)) hide();
    });
    document.addEventListener('pointerdown', (e) => {
      if (current && !list.contains(e.target as Node)) hide();
    });
    window.addEventListener('resize', () => current && place(current), { passive: true });
  }

  // ---------------------------------------------------------------- phone: Apple TV slides
  hero.querySelectorAll<HTMLAnchorElement>('[data-atv-link]').forEach((link) => {
    const slide = link.closest<HTMLElement>('.atv__slide');
    if (!slide) return;
    link.addEventListener('click', (e) => {
      if (fine.matches || slide.classList.contains('is-peek')) return;
      e.preventDefault();
      const img = slide.querySelector<HTMLImageElement>('.atv__peek img[data-src]');
      if (img && !img.src) img.src = img.dataset.src!;
      hero.querySelectorAll('.atv__slide.is-peek').forEach((s) => s.classList.remove('is-peek'));
      slide.classList.add('is-peek');
    });
  });
  document.addEventListener('pointerdown', (e) => {
    const open = hero.querySelector('.atv__slide.is-peek');
    if (open && !(e.target as Element).closest?.('[data-atv-link]')) open.classList.remove('is-peek');
  });
}
