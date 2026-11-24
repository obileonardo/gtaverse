// The peek frame. Desktop: hovering (or focusing) a line of the A24 stack shows that find's clip thumbnail in a small
// tilted frame beside the line, overlapping the list; moving to another line moves the frame and swaps the picture.
// Touch (no hover): the first tap on a line shows the frame, a second tap opens the find. The phone's Apple TV slides
// do the same with a frame above the title. Thumbnails come from YouTube and only for finds that are safe to show
// (Hero.astro leaves data-peek-thumb out for spoiler, mature and Shorts).
import { Spring, loop, reducedMotion, springToken } from '../../scripts/motion/spring';

export function initPeek(hero: HTMLElement) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let lastPointer = 'mouse';
  hero.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType), { capture: true });

  // ---------------------------------------------------------------- desktop: A24 stack
  // The frame travels between lines instead of re-appearing (motion study item 6): one frame on critically damped
  // springs (--spring-travel) for x, y and tilt, so it glides from line to line, can be turned mid-flight and never
  // overshoots. It opens after 80ms of hover and closes after 120ms of grace, so crossing the gap between two lines
  // never makes it blink. The other lines dim while one is hot.
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
    const travel = springToken('travel', 0.3);
    const sx = new Spring(0, travel), sy = new Spring(0, travel), st = new Spring(-3, travel);
    let stop: (() => void) | null = null;
    let openTimer = 0, closeTimer = 0;
    const write = () => { frame.style.transform = `translate3d(${sx.x.toFixed(2)}px, ${sy.x.toFixed(2)}px, 0) rotate(${st.x.toFixed(3)}deg)`; };

    const target = (item: HTMLAnchorElement) => {
      const anchor = item.querySelector<HTMLElement>('[data-peek-anchor]') ?? item;
      const box = root.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const fw = frame.offsetWidth, fh = frame.offsetHeight;
      const pad = parseFloat(getComputedStyle(root).paddingRight) || 40;
      // Just past the end of the line's title, over the lines above and below; never over the scroll arrow.
      const x = Math.max(Math.min(a.right - box.left + 16, box.width - pad - fw - 56), 0);
      // Centred on the line, so the frame spans about two lines of the stack.
      const y = a.top - box.top + a.height / 2 - fh / 2;
      return { x: Math.round(x), y: Math.round(y), tilt: Number(item.dataset.index) % 2 ? 2 : -3 };
    };

    const place = (item: HTMLAnchorElement, jump: boolean) => {
      const t = target(item);
      if (jump || reducedMotion()) {
        stop?.(); stop = null;
        sx.set(t.x); sy.set(t.y); st.set(t.tilt);
        write();
        return;
      }
      sx.to(t.x); sy.to(t.y); st.to(t.tilt);
      if (stop) return;
      stop = loop((dt) => {
        sx.step(dt); sy.step(dt); st.step(dt);
        write();
        if (sx.done && sy.done && st.done) { sx.snap(); sy.snap(); st.snap(); write(); stop = null; return false; }
        return true;
      });
    };

    // The picture: the new still fades in over the old one through a 2px blur once it has decoded; never a blank.
    const swap = (src: string | undefined) => {
      const old = imgs[layer];
      layer = 1 - layer;
      const img = imgs[layer];
      img.getAnimations().forEach((a) => a.cancel());
      if (!src) { imgs.forEach((im) => im.classList.remove('is-on', 'is-top')); return; }
      const reveal = () => {
        if (imgs[layer] !== img) return; // a newer line took over while this one decoded
        old.classList.remove('is-top');
        img.classList.add('is-on', 'is-top');
        const fade = reducedMotion()
          ? img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'linear' })
          : img.animate([{ opacity: 0, filter: 'blur(2px)' }, { opacity: 1, filter: 'blur(0px)' }], { duration: 160, easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)' });
        fade.finished.then(() => { if (imgs[layer] === img) old.classList.remove('is-on'); }, () => {});
      };
      if (img.getAttribute('src') !== src) img.src = src;
      if (img.complete && img.naturalWidth) reveal();
      else img.decode().then(reveal, reveal);
    };

    const show = (item: HTMLAnchorElement, instant: boolean) => {
      clearTimeout(closeTimer);
      const opening = !frame.classList.contains('is-open');
      // Keyboard moves and the first appearance place the frame without travel.
      place(item, opening || instant);
      frame.classList.toggle('is-instant', instant);
      frame.classList.add('is-open');
      if (current !== item) swap(item.dataset.peekThumb);
      current = item;
      items.forEach((a) => a.classList.toggle('is-hot', a === item));
      list.dataset.hot = 'true';
      if (subbar) subbar.href = `/finds/${item.dataset.slug}`;
      if (subImg && item.dataset.peekThumb) subImg.src = item.dataset.peekThumb.replace('/hqdefault', '/mqdefault');
    };
    const hide = () => {
      clearTimeout(openTimer);
      frame.classList.remove('is-open', 'is-instant');
      current = null;
      items.forEach((a) => a.classList.remove('is-hot'));
      delete list.dataset.hot;
    };

    items.forEach((a) => {
      a.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' && !fine.matches) return;
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        // Already open: travel now. Closed: open after 80ms of hover, so a pointer passing through opens nothing.
        if (frame.classList.contains('is-open')) show(a, false);
        else openTimer = window.setTimeout(() => show(a, false), 80);
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
      if (e.pointerType !== 'mouse') return;
      clearTimeout(openTimer);
      closeTimer = window.setTimeout(hide, 120);
    });
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget as Node)) hide();
    });
    document.addEventListener('pointerdown', (e) => {
      if (current && !list.contains(e.target as Node)) hide();
    });
    window.addEventListener('resize', () => current && place(current, true), { passive: true });
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
