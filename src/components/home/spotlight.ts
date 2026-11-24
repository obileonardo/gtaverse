// Home chapter 001, Spotlight: the carousel's behaviour (Spotlight.astro).
// The track is native horizontal scroll with snap, so a swipe or a trackpad follows the finger 1:1 and settles with
// the platform's own physics. The dots, the arrow keys and a click on a peeking neighbour move it:
//   - a pointer move glides the track on --ease-in-out over 500ms (one surface moving on screen) and the text swaps
//     direction-aware (CSS: the old text fades by 160ms, the new one arrives from 120ms over 280ms);
//   - a keyboard move is instant (keyboard actions never animate);
//   - reduced motion: the track jumps and the text only crossfades.
// "Play clip" loads the creator's player in place (click to load); moving to another find closes it.

import { glideScroll } from '../../scripts/motion/ease';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function initSpotlight(viewport: HTMLElement) {
  const section = viewport.closest('section')!;
  const slides = [...viewport.querySelectorAll<HTMLElement>('[data-spot-slide]')];
  const dots = [...section.querySelectorAll<HTMLButtonElement>('[data-spot-dot]')];
  if (!slides.length) return;
  let active = 0;
  let stop: (() => void) | null = null;
  let driving = false;

  const targetLeft = (i: number) => {
    const s = slides[i];
    // Desktop centres the slide (its neighbours peek equally); the phone starts it at the gutter.
    const centred = getComputedStyle(s).scrollSnapAlign.includes('center');
    const pad = parseFloat(getComputedStyle(viewport.firstElementChild as HTMLElement).paddingLeft) || 0;
    return centred ? s.offsetLeft - (viewport.clientWidth - s.offsetWidth) / 2 : s.offsetLeft - pad;
  };

  const closeClip = (slide: HTMLElement) => {
    const panel = slide.querySelector<HTMLElement>('.spot__panel')!;
    if (!panel.hasAttribute('data-playing')) return;
    panel.removeAttribute('data-playing');
    slide.querySelector('[data-spot-player]')!.replaceChildren();
  };

  const setActive = (i: number) => {
    if (i === active) return;
    const dir = i > active ? 1 : -1;
    closeClip(slides[active]);
    const next = slides[i];
    next.style.setProperty('--dir', String(dir));
    void getComputedStyle(next).translate; // the arriving text starts from the side of the move
    slides[active].removeAttribute('data-active');
    next.setAttribute('data-active', '');
    dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    active = i;
  };

  const go = (i: number, how: 'pointer' | 'key') => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    setActive(i);
    stop?.();
    const to = targetLeft(i);
    if (how === 'key' || reduce()) {
      viewport.scrollLeft = to;
      return;
    }
    driving = true;
    stop = glideScroll(viewport, to, 500, () => { driving = false; stop = null; });
  };

  // A swipe or trackpad scroll: the slide nearest the snap point becomes active when the scroll settles.
  const settle = () => {
    if (driving) return;
    let best = active, dist = Infinity;
    slides.forEach((_, k) => { const d = Math.abs(targetLeft(k) - viewport.scrollLeft); if (d < dist) { dist = d; best = k; } });
    setActive(best);
  };
  let t = 0;
  if ('onscrollend' in window) viewport.addEventListener('scrollend', settle);
  else viewport.addEventListener('scroll', () => { clearTimeout(t); t = window.setTimeout(settle, 120); }, { passive: true });
  // A user grab during a glide takes over at once (the glide never fights the finger).
  const grab = () => { if (driving) stop?.(); };
  viewport.addEventListener('pointerdown', grab);
  viewport.addEventListener('wheel', grab, { passive: true });

  dots.forEach((d, k) => d.addEventListener('click', (e) => go(k, (e as MouseEvent).detail === 0 ? 'key' : 'pointer')));
  slides.forEach((s, k) => s.addEventListener('click', (e) => {
    if (k === active) return;
    // A tap on a peeking neighbour brings it in; it never follows a link hidden in it.
    e.preventDefault();
    go(k, 'pointer');
  }, true));
  viewport.addEventListener('keydown', (e) => {
    if (e.target !== viewport) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1, 'key'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1, 'key'); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, 'key'); }
    else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1, 'key'); }
  });

  // Click to load: the creator's player replaces the still inside the panel; the text steps out until it is closed.
  slides.forEach((s) => {
    const panel = s.querySelector<HTMLElement>('.spot__panel')!;
    s.querySelector<HTMLElement>('[data-spot-play]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      const f = document.createElement('iframe');
      f.src = btn.dataset.embed!;
      f.title = btn.getAttribute('aria-label') ?? 'Clip';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      s.querySelector('[data-spot-player]')!.replaceChildren(f);
      panel.setAttribute('data-playing', '');
      s.querySelector<HTMLElement>('[data-spot-close]')?.focus({ preventScroll: true });
    });
    s.querySelector<HTMLElement>('[data-spot-close]')?.addEventListener('click', () => {
      closeClip(s);
      s.querySelector<HTMLElement>('[data-spot-play]')?.focus({ preventScroll: true });
    });
  });

  // Keep the active slide in place when the window resizes.
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { viewport.scrollLeft = targetLeft(active); }, 100); });
  viewport.scrollLeft = targetLeft(0);
}
