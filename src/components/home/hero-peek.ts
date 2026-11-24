// The peek card. Desktop: it follows the cursor over the A24 stack (owner decision, 24 Nov 2026), showing the clip
// thumbnail of the line under the pointer; moving to another line swaps the picture with a short crossfade. Keyboard
// focus places it beside the focused line. Touch (no hover): the first tap on a line shows the card, a second tap
// opens the find. The phone's Apple TV slides do the same with a frame above the title. Thumbnails come from YouTube
// and only for finds that are safe to show (Hero.astro leaves data-peek-thumb out for spoiler, mature and Shorts).
import { Spring, loop, reducedMotion, springToken } from '../../scripts/motion/spring';

export function initPeek(hero: HTMLElement) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let lastPointer = 'mouse';
  hero.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType), { capture: true });

  // ---------------------------------------------------------------- desktop: A24 stack
  // The card rides the cursor on critically damped springs (--spring-lead: about 60ms behind a moving pointer, never
  // past it), offset above and to the right so it never covers the word under the pointer, flipped and clamped so it
  // stays inside the hero and its gutters. It glides across every line without re-entering; only its picture changes.
  // Its tilt leans with the card's own horizontal speed (capped at 3 degrees), so it settles flat with no wobble.
  // It fades and grows in from the cursor's side on entering the list, and back out on leaving (after 120ms of grace,
  // so crossing a gap never blinks). The other lines dim while one is hot. Reduced motion: it appears beside the line
  // under the pointer and jumps between lines without following.
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
    const follow = springToken('lead', 0.2);
    const sx = new Spring(0, follow), sy = new Spring(0, follow);
    let tilt = 0;
    let stop: (() => void) | null = null;
    let closeTimer = 0;
    let box = root.getBoundingClientRect();
    const GAP = 20; // between the pointer and the card's nearest corner
    const write = () => { frame.style.transform = `translate3d(${sx.x.toFixed(2)}px, ${sy.x.toFixed(2)}px, 0) rotate(${tilt.toFixed(3)}deg)`; };

    // Where the card goes for a pointer at (px, py) in the root's box: above and to the right of the pointer,
    // flipped below or to the left when that would leave the hero, then held inside the gutters.
    const bounds = () => {
      const cs = getComputedStyle(root);
      const pad = parseFloat(cs.paddingLeft) || 40;
      const island = document.querySelector('.island')?.getBoundingClientRect();
      const top = Math.max(16, (island ? island.bottom - box.top : 0) + 16);
      return { left: pad, right: box.width - pad, top, bottom: box.height - 16 };
    };
    const targetFor = (px: number, py: number) => {
      const fw = frame.offsetWidth, fh = frame.offsetHeight, b = bounds();
      let x = px + GAP, y = py - fh - GAP;
      let originX = 0, originY = 100; // the corner nearest the pointer: the card grows from there
      if (x + fw > b.right) { x = px - GAP - fw; originX = 100; }
      if (y < b.top) { y = py + GAP; originY = 0; }
      x = Math.min(Math.max(x, b.left), b.right - fw);
      y = Math.min(Math.max(y, b.top), b.bottom - fh);
      return { x, y, origin: `${originX}% ${originY}%` };
    };
    const besideLine = (item: HTMLAnchorElement) => {
      const anchor = item.querySelector<HTMLElement>('[data-peek-anchor]') ?? item;
      const a = anchor.getBoundingClientRect();
      return targetFor(Math.min(a.right, box.right - 40) - box.left, a.top - box.top + a.height / 2);
    };

    const run = () => {
      if (stop) return;
      stop = loop((dt) => {
        sx.step(dt); sy.step(dt);
        // Lean with the card's own speed: smooth because the spring is, capped, and flat again when it stops.
        tilt = Math.max(-3, Math.min(3, sx.v * 0.0035));
        write();
        if (sx.done && sy.done && Math.abs(tilt) < 0.01) { sx.snap(); sy.snap(); tilt = 0; write(); stop = null; return false; }
        return true;
      });
    };
    const place = (t: { x: number; y: number; origin: string }, jump: boolean) => {
      frame.style.transformOrigin = t.origin;
      if (jump || reducedMotion()) {
        stop?.(); stop = null;
        sx.set(t.x); sy.set(t.y); tilt = 0;
        write();
        return;
      }
      sx.to(t.x); sy.to(t.y);
      run();
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

    const setHot = (item: HTMLAnchorElement) => {
      if (current === item) return;
      swap(item.dataset.peekThumb);
      current = item;
      items.forEach((a) => a.classList.toggle('is-hot', a === item));
      list.dataset.hot = 'true';
      if (subbar) subbar.href = `/finds/${item.dataset.slug}`;
      if (subImg && item.dataset.peekThumb) subImg.src = item.dataset.peekThumb.replace('/hqdefault', '/mqdefault');
    };
    const openAt = (t: { x: number; y: number; origin: string }, instant: boolean) => {
      clearTimeout(closeTimer);
      const opening = !frame.classList.contains('is-open');
      place(t, opening || instant); // a closed card appears where it belongs; it never flies in from elsewhere
      frame.classList.toggle('is-instant', instant);
      frame.classList.add('is-open');
    };
    const hide = () => {
      frame.classList.remove('is-open', 'is-instant');
      current = null;
      items.forEach((a) => a.classList.remove('is-hot'));
      delete list.dataset.hot;
    };
    // The line under the pointer: the one whose band holds its height (beyond a title's end counts too).
    const lineAt = (y: number) => {
      let best: HTMLAnchorElement | null = null, dist = Infinity;
      for (const a of items) {
        const r = a.getBoundingClientRect();
        const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
        if (d < dist) { dist = d; best = a; }
      }
      return dist <= 12 ? best : null;
    };

    list.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' && !fine.matches) return;
      box = root.getBoundingClientRect();
      const item = lineAt(e.clientY);
      if (!item) return;
      setHot(item);
      if (reducedMotion()) { openAt(besideLine(item), true); return; }
      openAt(targetFor(e.clientX - box.left, e.clientY - box.top), false);
    });
    list.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(closeTimer);
      closeTimer = window.setTimeout(hide, 120);
    });
    items.forEach((a) => {
      a.addEventListener('focus', () => {
        if (lastPointer !== 'mouse' && lastPointer !== 'pen') return;
        box = root.getBoundingClientRect();
        setHot(a);
        openAt(besideLine(a), true);
      });
      a.addEventListener('click', (e) => {
        if (lastPointer !== 'touch') return;
        // Touch: the first tap shows the card beside the line, the second opens the find.
        if (current !== a) {
          e.preventDefault();
          box = root.getBoundingClientRect();
          setHot(a);
          openAt(besideLine(a), false);
        }
      });
    });
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget as Node)) hide();
    });
    document.addEventListener('pointerdown', (e) => {
      if (current && !list.contains(e.target as Node)) hide();
    });
    window.addEventListener('resize', () => { if (current) { box = root.getBoundingClientRect(); place(besideLine(current), true); } }, { passive: true });
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
