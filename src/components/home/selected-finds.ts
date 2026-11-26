// Home chapter 002, Selected finds: the filter pills and the grid's layout animation (SelectedFinds.astro).
// Choosing a pill shows that filter's finds (data-o-<filter> gives each card its place). With a pointer the grid
// moves as one layout: cards that leave come out of the flow at once and fade in --dur-morph-out on
// --ease-standard while the cards that stay glide to their new slots on --ease-in-out (280ms) and the new cards
// fade and rise 8px from 120ms over 280ms. Chosen from the keyboard the grid swaps at once (keyboard actions never
// animate). Reduced motion: a short crossfade, nothing travels.

import { tokenMs } from '../../scripts/motion/tokens';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (name: string, fallback: number) => tokenMs(name, fallback);
const v = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export function initSelectedFinds(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>('[data-sf-grid]');
  const pills = [...root.querySelectorAll<HTMLButtonElement>('[data-sf-filter]')];
  const live = root.querySelector<HTMLElement>('[data-sf-live]');
  if (!grid || !pills.length) return;
  const items = [...grid.querySelectorAll<HTMLElement>('[data-sf-item]')];
  let current = 'all';
  let leaving: HTMLElement[] = [];

  const place = (el: HTMLElement, id: string) => {
    const o = el.getAttribute(`data-o-${id}`);
    return o === null ? -1 : Number(o);
  };

  function show(id: string, animate: boolean) {
    if (id === current) return;
    const still = !animate || reduce();
    const settle = (el: HTMLElement) => { el.getAnimations().forEach((a) => a.cancel()); el.style.cssText = el.style.order ? `order:${el.style.order}` : ''; };
    // Cards still fading out from the last swap never jump (#80 review N7): one the new filter leaves out carries on
    // fading from where it is; one it brings back stays on screen and fades back up from there, gliding from where
    // it stands to its new slot like any card that stays. Chosen from the keyboard (or with reduced motion) they go
    // at once, as every keyboard swap does.
    const back = new Map<HTMLElement, number>();
    const fading = new Set(leaving);
    leaving.forEach((el) => {
      if (still) { settle(el); el.hidden = true; }
      else if (place(el, id) >= 0) back.set(el, parseFloat(getComputedStyle(el).opacity));
    });
    leaving = still ? [] : leaving.filter((el) => !back.has(el));
    // Moves in flight finish where they are going (the FLIP below measures final places), but a card still fading in
    // keeps its opacity and carries on from it: finishing it would jump it to full (#80 review N1).
    const midFade = new Map<HTMLElement, number>(back);
    items.forEach((el) => {
      if (!still && fading.has(el)) return;
      const anims = el.getAnimations();
      if (!anims.length) return;
      const o = parseFloat(getComputedStyle(el).opacity);
      if (o < 0.999) midFade.set(el, o);
      anims.forEach((a) => a.finish());
    });

    const before = new Map<HTMLElement, DOMRect>();
    const gridBox = grid!.getBoundingClientRect();
    if (animate) items.forEach((el) => { if (!el.hidden) before.set(el, el.getBoundingClientRect()); });
    // A card coming back rejoins the flow (measured above where it stood, out of the flow).
    back.forEach((_, el) => settle(el));

    const stays: HTMLElement[] = [], enters: HTMLElement[] = [], exits: HTMLElement[] = [];
    items.forEach((el) => {
      if (leaving.includes(el)) return; // still fading out, out of the flow
      const o = place(el, id);
      const was = !el.hidden;
      if (o >= 0) {
        el.style.order = String(o);
        // A card coming into view here skips the page's first-view reveal: this swap is its entrance.
        const card = el.querySelector<HTMLElement>('.card');
        if (card && !card.dataset.rv) card.dataset.rv = 'skip';
        (was ? stays : enters).push(el);
        el.hidden = false;
      } else if (was) exits.push(el);
    });
    current = id;
    pills.forEach((p) => {
      const on = p.dataset.sfFilter === id;
      p.classList.toggle('is-selected', on);
      p.setAttribute('aria-pressed', String(on));
    });
    const label = pills.find((p) => p.dataset.sfFilter === id)?.dataset.sfLabel ?? '';
    grid!.setAttribute('aria-label', `${label} finds`);
    if (live) live.textContent = `Showing ${stays.length + enters.length} ${label === 'All' ? '' : `${label.toLowerCase()} `}finds`.replace(/\s+/g, ' ');

    if (!animate) { exits.forEach((el) => (el.hidden = true)); return; }

    const out = ms('--dur-morph-out', 180);
    if (reduce()) {
      exits.forEach((el) => (el.hidden = true));
      enters.concat(stays).forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-fade-reduced', 150), easing: 'linear' }));
      return;
    }
    // Leaving cards stop taking space now, so the others close the gap while they fade.
    exits.forEach((el) => {
      const r = before.get(el)!;
      el.style.position = 'absolute';
      el.style.left = `${r.left - gridBox.left}px`;
      el.style.top = `${r.top - gridBox.top}px`;
      el.style.width = `${r.width}px`;
      el.style.pointerEvents = 'none';
      leaving.push(el);
      // A card leaving while it was still fading in leaves from where it was, never from full.
      const from = midFade.get(el) ?? 1;
      const a = el.animate([{ opacity: from }, { opacity: 0 }], { duration: Math.max(1, out * from), easing: v('--ease-standard', 'ease'), fill: 'forwards' });
      a.finished.then(() => {
        el.hidden = true;
        el.style.position = el.style.left = el.style.top = el.style.width = el.style.pointerEvents = '';
        leaving = leaving.filter((x) => x !== el);
        a.cancel();
      }, () => {});
    });
    // Staying cards glide from where they were (FLIP: measure, invert, play); one that was still fading in goes on
    // fading from where it was.
    stays.forEach((el) => {
      const o = midFade.get(el);
      if (o !== undefined) el.animate([{ opacity: o }, { opacity: 1 }], { duration: ms('--dur-morph', 280), easing: v('--ease-out', 'ease-out') });
    });
    stays.forEach((el) => {
      const a = before.get(el)!, b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: ms('--dur-morph', 280), easing: v('--ease-in-out', 'ease-in-out') });
    });
    enters.forEach((el) => {
      el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: ms('--dur-morph', 280), delay: 120, easing: v('--ease-out', 'ease-out'), fill: 'backwards' });
    });
  }

  pills.forEach((p) => p.addEventListener('click', (e) => show(p.dataset.sfFilter!, (e as MouseEvent).detail !== 0)));
}
