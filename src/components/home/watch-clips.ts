// Home chapter 004, Watch the clips (WatchClips.astro).
// Choosing a clip (a thumb on the rail or a still in the strip) loads it into the big card: the new still fades in
// over the old one once decoded (--dur-crossfade on --ease-colour, the background blur with it), the words swap (old
// out by --dur-morph-out, new in), and the pink marker travels along the rail to the chosen thumb on the travel
// spring (or back to the top of the rail for a clip that is not on it). The stack never reorders. "Play" loads the
// creator's player in the card (click to load). Keyboard choices swap at once; reduced motion fades, nothing travels.
import { Spring, loop, springToken, reducedMotion } from '../../scripts/motion/spring';

type Clip = { slug: string; title: string; summary: string; creator: string; url: string; embed: string; src: string; srcset: string; thumb: string };
const ms = (name: string, fallback: number) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
const v = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export function initWatchClips(root: HTMLElement) {
  const clips: Clip[] = JSON.parse(root.querySelector('[data-wc-data]')?.textContent ?? '[]');
  const frame = root.querySelector<HTMLElement>('[data-wc-frame]');
  const info = root.querySelector<HTMLElement>('[data-wc-info]');
  const marker = root.querySelector<HTMLElement>('[data-wc-marker]');
  const bg = root.querySelector<HTMLElement>('.wc__bg');
  if (!clips.length || !frame || !info) return;
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-wc-pick]')];
  const rail = marker?.parentElement ?? null;
  let current = 0;

  // The marker: a critically damped spring on its y, so a second choice mid-travel turns it without a jump.
  const spring = new Spring(0, springToken('travel', 0.3));
  let stopLoop: (() => void) | null = null;
  const markerY = (i: number) => {
    const dot = root.querySelector<HTMLElement>(`.wc__thumb[data-wc-pick="${i}"] [data-wc-dot]`);
    if (!dot || !rail) return 0; // not on the rail: the top of the line, where the playing clip is marked
    return dot.getBoundingClientRect().top + dot.offsetHeight / 2 - rail.getBoundingClientRect().top;
  };
  const moveMarker = (i: number, instant: boolean) => {
    if (!marker) return;
    const y = markerY(i);
    if (instant || reducedMotion()) { spring.set(y); marker.style.transform = `translateY(${y}px)`; return; }
    spring.to(y);
    if (!stopLoop) stopLoop = loop((dt) => {
      spring.step(dt);
      marker.style.transform = `translateY(${spring.x}px)`;
      if (spring.done) { spring.snap(); marker.style.transform = `translateY(${spring.x}px)`; stopLoop = null; return false; }
      return true;
    });
  };

  const stopPlayer = () => {
    frame.querySelector('iframe')?.remove();
    frame.removeAttribute('data-playing');
    const play = frame.querySelector<HTMLElement>('[data-wc-play]');
    if (play) play.hidden = false;
  };

  // A still fades in over the old one only once it has decoded, so the card never flashes empty.
  const crossfade = (current: HTMLImageElement, src: string, srcset: string | null, instant: boolean) => {
    const next = new Image();
    next.className = current.className;
    next.alt = '';
    next.decoding = 'async';
    next.setAttribute('data-nofade', '');
    for (const a of ['data-wc-img', 'data-wc-bg']) if (current.hasAttribute(a)) next.setAttribute(a, '');
    if (srcset) { next.srcset = srcset; next.sizes = current.sizes; }
    next.src = src;
    const swap = () => {
      if (instant || reducedMotion()) { current.replaceWith(next); return; }
      current.after(next);
      const a = next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-crossfade', 500), easing: v('--ease-colour', 'ease') });
      a.finished.then(() => current.remove(), () => {});
    };
    next.decode().then(swap, swap);
  };

  const choose = (i: number, instant: boolean) => {
    if (i === current) return;
    const c = clips[i];
    current = i;
    stopPlayer();
    const imgs = frame.querySelectorAll<HTMLImageElement>('[data-wc-img]');
    const img = imgs[imgs.length - 1];
    crossfade(img, c.src, c.srcset, instant);
    const bgImgs = bg?.querySelectorAll<HTMLImageElement>('[data-wc-bg]');
    const bgImg = bgImgs?.[bgImgs.length - 1];
    if (bg && bgImg) crossfade(bgImg, c.thumb, null, instant);
    frame.querySelector('[data-wc-play]')?.setAttribute('aria-label', `Play clip: ${c.title}`);

    const fill = () => {
      const link = info.querySelector<HTMLAnchorElement>('[data-wc-link]')!;
      link.textContent = c.title;
      link.href = `/finds/${c.slug}`;
      info.querySelector('[data-wc-summary]')!.textContent = c.summary;
      info.querySelector('[data-wc-creator]')!.textContent = c.creator;
      info.querySelector<HTMLAnchorElement>('[data-wc-post]')!.href = c.url;
    };
    info.getAnimations().forEach((a) => a.cancel());
    if (instant || reducedMotion()) { fill(); if (!instant) info.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-fade-reduced', 150) }); }
    else {
      const out = info.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms('--dur-morph-out', 180), easing: v('--ease-standard', 'ease'), fill: 'forwards' });
      out.finished.then(() => {
        fill();
        out.cancel();
        info.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: ms('--dur-morph', 280), easing: v('--ease-out', 'ease-out') });
      }, () => {});
    }
    picks.forEach((p) => p.setAttribute('aria-pressed', String(Number(p.dataset.wcPick) === i)));
    moveMarker(i, instant);
  };

  picks.forEach((p) => p.addEventListener('click', (e) => choose(Number(p.dataset.wcPick), (e as MouseEvent).detail === 0)));
  frame.querySelector<HTMLElement>('[data-wc-play]')?.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLElement;
    const f = document.createElement('iframe');
    f.src = clips[current].embed;
    f.title = btn.getAttribute('aria-label') ?? 'Clip';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    btn.hidden = true;
    frame.append(f);
    frame.setAttribute('data-playing', '');
  });

  // The marker starts at the top of the rail (the first clip is in the big card, not on the rail).
  requestAnimationFrame(() => moveMarker(current, true));
  addEventListener('resize', () => moveMarker(current, true));
}
