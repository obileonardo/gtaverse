// Home chapter 004, Watch the clips (WatchClips.astro).
// Choosing a row loads its clip into the player: the new still fades in over the old one once decoded
// (--dur-crossfade on --ease-colour), the credit on the clip swaps (the old leaves from where it is in
// --dur-morph-out, the new rises 8px in --dur-morph) and the words in the bar swap on the same pair as a fade only.
// "Watching" and "Up next" move to the chosen row and the one after it at once; rows never reorder. "Play" loads the
// creator's player in the frame (click to load). "All N clips" shows the rest of the list in place. Keyboard choices
// swap at once; reduced motion fades, nothing moves.
import { reducedMotion } from '../../scripts/motion/spring';
import { tokenMs } from '../../scripts/motion/tokens';

type Clip = { slug: string; title: string; summary: string; creator: string; url: string; embed: string; src: string; srcset: string; thumb: string };
const ms = (name: string, fallback: number) => tokenMs(name, fallback);
const v = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// Words that swap in one place. A pick while they are still fading leaves from where they are: their opacity and
// their place right now (LR35, #80 review N8); their rise in stops where it is, so nothing moves while they leave.
function swap(el: HTMLElement, fill: () => void, rise: boolean, instant: boolean) {
  const now = getComputedStyle(el);
  const from = Math.min(1, Math.max(0, parseFloat(now.opacity) || 0));
  const at = now.transform === 'none' ? 'none' : now.transform;
  el.getAnimations().forEach((a) => a.cancel());
  if (instant || reducedMotion()) {
    fill();
    if (!instant) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-fade-reduced', 150) });
    return;
  }
  const out = el.animate([{ opacity: from, transform: at }, { opacity: 0, transform: at }], { duration: Math.max(1, ms('--dur-morph-out', 180) * from), easing: v('--ease-standard', 'ease'), fill: 'forwards' });
  out.finished.then(() => {
    fill();
    out.cancel();
    el.animate([{ opacity: 0, transform: rise ? 'translateY(8px)' : 'none' }, { opacity: 1, transform: 'none' }], { duration: ms('--dur-morph', 280), easing: v('--ease-out', 'ease-out') });
  }, () => {});
}

export function initWatchClips(root: HTMLElement) {
  const clips: Clip[] = JSON.parse(root.querySelector('[data-wc-data]')?.textContent ?? '[]');
  const frame = root.querySelector<HTMLElement>('[data-wc-frame]');
  const credit = root.querySelector<HTMLElement>('[data-wc-credit]');
  const about = root.querySelector<HTMLElement>('[data-wc-about]');
  const open = root.querySelector<HTMLAnchorElement>('[data-wc-link]');
  const media = frame?.querySelector<HTMLElement>('.wc__media');
  if (!clips.length || !frame || !credit || !about || !media) return;
  const rows = [...root.querySelectorAll<HTMLButtonElement>('[data-wc-pick]')];
  let current = 0;

  const stopPlayer = () => {
    frame.querySelector('iframe')?.remove();
    frame.removeAttribute('data-playing');
    const play = frame.querySelector<HTMLElement>('[data-wc-play]');
    if (play) play.hidden = false;
  };

  // A still fades in over the one on top now, only once it has decoded, so the player never flashes empty. A still
  // that decodes after another clip was chosen is dropped, so a still never sits beside another clip's credit.
  const crossfade = (c: Clip, instant: boolean) => {
    const sizes = media.querySelector<HTMLImageElement>('[data-wc-img]')?.sizes ?? '';
    const next = new Image();
    next.alt = '';
    next.decoding = 'async';
    // The site's own load fade (Base.astro) stays off: this still has its own crossfade, and none from the keyboard.
    next.setAttribute('data-nofade', '');
    next.setAttribute('data-instant', '');
    next.setAttribute('data-wc-img', '');
    next.srcset = c.srcset;
    next.sizes = sizes;
    next.src = c.src;
    const show = () => {
      if (clips[current] !== c) return;
      const below = [...media.querySelectorAll<HTMLImageElement>('[data-wc-img]')];
      media.append(next);
      if (instant || reducedMotion()) { below.forEach((b) => b.remove()); return; }
      const a = next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-crossfade', 500), easing: v('--ease-colour', 'ease') });
      a.finished.then(() => below.forEach((b) => b.remove()), () => {});
    };
    next.decode().then(show, show);
  };

  // Hulu's labels: "Watching" on the chosen row, "Up next" on the row after it when that row is on show, none on the
  // rest.
  const shown = (r: HTMLElement) => root.hasAttribute('data-wc-all') || !r.closest('[data-wc-extra]');
  const label = (i: number) => rows.forEach((r) => {
    const k = Number(r.dataset.wcPick);
    const next = k === i + 1 && shown(r);
    const kicker = r.querySelector<HTMLElement>('[data-wc-kicker]');
    if (kicker) {
      kicker.textContent = k === i ? 'Watching' : next ? 'Up next' : '';
      if (k === i) kicker.dataset.k = 'now';
      else if (next) kicker.dataset.k = 'next';
      else delete kicker.dataset.k;
    }
    r.setAttribute('aria-pressed', String(k === i));
  });

  const choose = (i: number, instant: boolean) => {
    if (i === current || !clips[i]) return;
    const c = clips[i];
    current = i;
    stopPlayer();
    crossfade(c, instant);
    frame.querySelector('[data-wc-play]')?.setAttribute('aria-label', `Play clip: ${c.title}`);
    if (open) {
      open.href = `/finds/${c.slug}`;
      open.setAttribute('aria-label', `Open the find: ${c.title}`);
    }
    label(i);
    swap(credit, () => {
      credit.querySelector('[data-wc-title]')!.textContent = c.title;
      credit.querySelector('[data-wc-creator]')!.textContent = c.creator;
    }, true, instant);
    swap(about, () => {
      about.querySelector('[data-wc-summary]')!.textContent = c.summary;
      about.querySelector<HTMLAnchorElement>('[data-wc-post]')!.href = c.url;
    }, false, instant);
  };

  rows.forEach((r) => r.addEventListener('click', (e) => choose(Number(r.dataset.wcPick), (e as MouseEvent).detail === 0)));

  // "All N clips": the rest of the list appears in place (a fade from the pointer, at once from the keyboard), and
  // focus moves to the first new row so a keyboard user carries on where the list now continues.
  root.querySelector<HTMLButtonElement>('[data-wc-more]')?.addEventListener('click', (e) => {
    const instant = (e as MouseEvent).detail === 0;
    const hidden = [...root.querySelectorAll<HTMLElement>('[data-wc-extra]')];
    root.setAttribute('data-wc-all', '');
    label(current);
    hidden.forEach((li) => {
      if (!instant) li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(reducedMotion() ? '--dur-fade-reduced' : '--dur-image-in', 240), easing: v('--ease-out', 'ease-out') });
    });
    (e.currentTarget as HTMLElement).remove();
    hidden[0]?.querySelector<HTMLElement>('[data-wc-pick]')?.focus({ preventScroll: true });
  });

  frame.querySelector<HTMLElement>('[data-wc-play]')?.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLElement;
    if (frame.querySelector('iframe')) return; // one player at a time
    const f = document.createElement('iframe');
    f.src = clips[current].embed;
    f.title = `YouTube player: ${clips[current].title}`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    btn.hidden = true;
    frame.append(f);
    frame.setAttribute('data-playing', '');
    f.focus(); // the Play button is gone: focus moves into the player, never to the page
  });
}
