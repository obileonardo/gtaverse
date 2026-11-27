// Home chapter 002, Selected finds (SelectedFinds.astro): the full index of safe finds, its view boxes (Grid, List,
// By date), its type boxes, "Show filters", "Clear filters" and the phone's "Show all".
//
// What shows: every find whose type is checked (none checked shows every type); By date also shows each day's
// heading while that day has a find showing. On the phone (below 768) the first twelve show until "Show all".
//
// Motion, with a pointer:
//   - A filter change (or "Show all") moves the index as one layout: tiles that leave come out of the flow at once and
//     fade out over --dur-morph-out on --ease-standard, the tiles that stay glide to their new places on --ease-in-out
//     (--dur-morph), and the tiles that arrive fade in from 120ms over --dur-morph. Only the staying tiles travel, so
//     two movements never overlap. A tile that is still fading out carries on from where it is; one brought back
//     fades back up from there and glides with the others (LR34).
//   - A view change is a swap in one place: the index fades out (--dur-swap-out), changes view, then fades in
//     (--dur-swap-in) once the old view is gone (LR13).
//   - "Show filters" fades the type boxes out or in (--dur-swap-out); the band keeps its height, so nothing moves.
// From the keyboard every change is instant (keyboard actions never animate). Reduced motion: a short fade only.

import { tokenMs } from '../../scripts/motion/tokens';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 767px)').matches;
const ms = (name: string, fallback: number) => tokenMs(name, fallback);
const v = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

type View = 'grid' | 'list' | 'date';

export function initSelectedFinds(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('[data-sf-index]');
  if (!list) return;
  const views = [...root.querySelectorAll<HTMLInputElement>('[data-sf-view]')];
  const types = [...root.querySelectorAll<HTMLInputElement>('[data-sf-type]')];
  const showBox = root.querySelector<HTMLInputElement>('[data-sf-show]');
  const band = root.querySelector<HTMLElement>('[data-sf-band]');
  const clear = root.querySelector<HTMLButtonElement>('[data-sf-clear]');
  const all = root.querySelector<HTMLButtonElement>('[data-sf-all]');
  const count = root.querySelector<HTMLElement>('[data-sf-count]');
  const live = root.querySelector<HTMLElement>('[data-sf-live]');
  const tiles = [...list.querySelectorAll<HTMLElement>('[data-sf-item]')];
  const days = [...list.querySelectorAll<HTMLElement>('[data-sf-day]')];
  const items = [...days, ...tiles];
  const cap = Number(root.dataset.cap) || 12;
  const total = tiles.length;

  let view: View = 'grid';
  let expanded = false;
  let leaving: HTMLElement[] = [];
  let swap: { out?: Animation; in?: Animation } = {};
  let pending: View = view; // the view a running swap will arrive at

  // A change counts as the pointer's only when a pointer pressed it just before; Space, Enter and arrows are the
  // keyboard's, and those never animate.
  let pressedAt = -Infinity;
  root.addEventListener('pointerdown', () => (pressedAt = performance.now()), true);
  root.addEventListener('keydown', () => (pressedAt = -Infinity), true);
  const byPointer = () => performance.now() - pressedAt < 1000;

  const chosen = () => new Set(types.filter((t) => t.checked).map((t) => t.value));
  const orderOf = (el: HTMLElement) => Number(el.style.getPropertyValue(view === 'date' ? '--o-date' : '--o-grid')) || 0;

  /** What the current state shows, and the tile count before the phone's cap. */
  function target() {
    const on = chosen();
    const match = tiles.filter((el) => !on.size || on.has(el.dataset.type!));
    let shown = match;
    if (phone() && !expanded && match.length > cap) shown = [...match].sort((a, b) => orderOf(a) - orderOf(b)).slice(0, cap);
    const set = new Set<HTMLElement>(shown);
    if (view === 'date') {
      days.forEach((d) => {
        // The heading counts every match of its day; it shows while one of them is on screen (the phone's cap).
        const c = d.querySelector('[data-sf-daycount]');
        if (c) c.textContent = String(match.filter((t) => t.dataset.day === d.dataset.sfDay).length);
        if (shown.some((t) => t.dataset.day === d.dataset.sfDay)) set.add(d);
      });
    }
    return { set, matched: match.length };
  }

  /** Count line, "Clear filters", "Show all", screen reader message. */
  function report(matched: number) {
    const on = chosen();
    if (count) count.textContent = on.size ? `${matched} of ${total} finds` : `${total} finds`;
    if (clear) clear.hidden = !on.size;
    if (all) {
      all.hidden = !(phone() && !expanded && matched > cap);
      const label = all.querySelector('.btn__label') ?? all;
      if (!all.hidden) label.textContent = `Show all ${matched} finds`;
    }
    if (live) {
      const names = types.filter((t) => t.checked).map((t) => t.closest('label')?.querySelector('.check__text')?.textContent?.toLowerCase() ?? '');
      live.textContent = `Showing ${matched} ${names.length === 1 ? names[0] : 'finds'}`;
    }
  }

  const settle = (el: HTMLElement) => {
    el.getAnimations().forEach((a) => a.cancel());
    el.style.removeProperty('position');
    el.style.removeProperty('left');
    el.style.removeProperty('top');
    el.style.removeProperty('width');
    el.style.removeProperty('pointer-events');
  };

  /** Puts the list's nodes in the current view's order, so focus and reading order follow what is drawn (By date
   * interleaves each day's heading with its finds). Only ever run while the index is out of sight or at once. */
  function reorder() {
    const sorted = [...items].sort((a, b) => orderOf(a) - orderOf(b));
    if (sorted.every((el, i) => list!.children[i] === el)) return;
    sorted.forEach((el) => list!.appendChild(el));
  }

  /** Shows the current state at once (keyboard, reduced motion, or inside a view swap). Every item it shows is marked
   * as already entered, so the page's first-view rise never plays on it later (a keyboard change never animates).
   * At load (entered = false) only items the cap had hidden are marked, so the first view still rises. */
  function applyInstant(entered = true) {
    leaving.forEach((el) => settle(el));
    leaving = [];
    items.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    const { set, matched } = target();
    items.forEach((el) => {
      // A tile shown again after display: none would restart a finished first-view rise ('in'), so it is marked too.
      if (set.has(el) && el.dataset.rv !== 'skip' && (entered || el.hidden)) el.dataset.rv = 'skip';
      el.hidden = !set.has(el);
    });
    report(matched);
  }

  /** Filter change with a pointer: one layout moving together (FLIP), LR34 for tiles caught mid-fade. */
  function applyFlip() {
    const { set, matched } = target();
    const back = new Map<HTMLElement, number>();
    const fading = new Set(leaving);
    leaving.forEach((el) => { if (set.has(el)) back.set(el, parseFloat(getComputedStyle(el).opacity)); });
    leaving = leaving.filter((el) => !back.has(el));
    // Moves in flight finish where they are going (the measure below reads final places); a tile still fading in
    // keeps its opacity and carries on from it.
    const midFade = new Map<HTMLElement, number>(back);
    items.forEach((el) => {
      if (fading.has(el)) return;
      const anims = el.getAnimations();
      if (!anims.length) return;
      const o = parseFloat(getComputedStyle(el).opacity);
      if (o < 0.999) midFade.set(el, o);
      anims.forEach((a) => a.finish());
    });

    const before = new Map<HTMLElement, DOMRect>();
    const box = list!.getBoundingClientRect();
    items.forEach((el) => { if (!el.hidden) before.set(el, el.getBoundingClientRect()); });
    back.forEach((_, el) => settle(el));

    const stays: HTMLElement[] = [], enters: HTMLElement[] = [], exits: HTMLElement[] = [];
    items.forEach((el) => {
      if (leaving.includes(el)) return; // still fading out, out of the flow
      const was = !el.hidden;
      if (set.has(el)) {
        // A tile coming into view here skips the page's first-view rise: this change is its entrance.
        if (!was || !el.dataset.rv) el.dataset.rv = 'skip';
        (was ? stays : enters).push(el);
        el.hidden = false;
      } else if (was) exits.push(el);
    });
    report(matched);

    if (reduce()) {
      exits.forEach((el) => (el.hidden = true));
      enters.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-fade-reduced', 150), easing: 'linear' }));
      return;
    }
    const out = ms('--dur-morph-out', 180);
    // Leaving tiles stop taking space now, so the others close the gap while they fade.
    exits.forEach((el) => {
      const r = before.get(el)!;
      el.style.position = 'absolute';
      el.style.left = `${r.left - box.left}px`;
      el.style.top = `${r.top - box.top}px`;
      el.style.width = `${r.width}px`;
      el.style.pointerEvents = 'none';
      leaving.push(el);
      const from = midFade.get(el) ?? 1;
      const a = el.animate([{ opacity: from }, { opacity: 0 }], { duration: Math.max(1, out * from), easing: v('--ease-standard', 'ease'), fill: 'forwards' });
      a.finished.then(() => {
        el.hidden = true;
        settle(el);
        leaving = leaving.filter((x) => x !== el);
      }, () => {});
    });
    const dur = ms('--dur-morph', 280);
    stays.forEach((el) => {
      const o = midFade.get(el);
      if (o !== undefined) el.animate([{ opacity: o }, { opacity: 1 }], { duration: dur, easing: v('--ease-out', 'ease-out') });
      const a = before.get(el)!, b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: dur, easing: v('--ease-in-out', 'ease-in-out') });
    });
    enters.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: 120, easing: v('--ease-out', 'ease-out'), fill: 'backwards' }));
  }

  /** A filter or "Show all" change. Inside a view swap the index is fading anyway: apply at once. */
  function change(animate: boolean) {
    if (animate && !swap.out && !swap.in) applyFlip();
    else applyInstant();
  }

  function setView(next: View, animate: boolean) {
    if (next === view && !swap.out) return;
    pending = next;
    const cancelSwap = () => { swap.out?.cancel(); swap.in?.cancel(); swap = {}; };
    const commit = () => {
      view = pending;
      root.dataset.view = pending;
      // Marked before the move: a node put back into the list would otherwise replay its first-view rise.
      items.forEach((el) => (el.dataset.rv = 'skip'));
      reorder();
      applyInstant();
    };
    if (!animate) { cancelSwap(); commit(); return; }
    if (reduce()) {
      cancelSwap();
      commit();
      swap.in = list!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-fade-reduced', 150), easing: 'linear' });
      swap.in.finished.then(() => (swap = {}), () => {});
      return;
    }
    // Already fading out: the latest choice (pending) is what arrives.
    if (swap.out) return;
    const from = parseFloat(getComputedStyle(list!).opacity);
    swap.in?.cancel();
    swap = {};
    const out = list!.animate([{ opacity: from }, { opacity: 0 }], { duration: Math.max(1, ms('--dur-swap-out', 180) * from), easing: v('--ease-standard', 'ease'), fill: 'forwards' });
    swap.out = out;
    out.finished.then(() => {
      commit();
      const inn = list!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-swap-in', 280), easing: v('--ease-out', 'ease-out') });
      out.cancel();
      swap = { in: inn };
      inn.finished.then(() => { if (swap.in === inn) swap = {}; }, () => {});
    }, () => {});
  }
  views.forEach((r) => r.addEventListener('change', () => { if (r.checked) setView(r.value as View, byPointer()); }));
  types.forEach((t) => t.addEventListener('change', () => change(byPointer())));
  clear?.addEventListener('click', (e) => {
    types.forEach((t) => (t.checked = false));
    change((e as MouseEvent).detail !== 0);
    // The button hides once nothing is checked: focus goes to the first type box (or "Show filters" when the boxes
    // are hidden) rather than falling to the page.
    if (document.activeElement === clear || document.activeElement === document.body) (showBox && !showBox.checked && !phone() ? showBox : types[0])?.focus();
  });
  all?.addEventListener('click', (e) => {
    const shown = new Set(tiles.filter((el) => !el.hidden));
    expanded = true;
    change((e as MouseEvent).detail !== 0);
    // From the keyboard, focus moves to the first find the button showed, so Tab carries on through the new ones.
    const first = tiles.filter((el) => !el.hidden && !shown.has(el)).sort((a, b) => orderOf(a) - orderOf(b))[0];
    if ((e as MouseEvent).detail === 0) first?.querySelector<HTMLElement>('a')?.focus();
  });
  showBox?.addEventListener('change', () => {
    if (!band) return;
    band.classList.toggle('is-instant', !byPointer() || reduce());
    band.classList.toggle('is-off', !showBox.checked); // hidden boxes leave the tab order (visibility)
  });
  // The phone's cap follows the width: crossing 768 shows or caps the tiles at once.
  matchMedia('(max-width: 767px)').addEventListener('change', () => applyInstant());

  // A reload can restore the boxes' state: start from what they say.
  const restored = views.find((r) => r.checked)?.value as View | undefined;
  if (restored && restored !== 'grid') { view = restored; root.dataset.view = restored; reorder(); }
  if (showBox && !showBox.checked) { band?.classList.add('is-instant', 'is-off'); }
  applyInstant(false);
  root.dataset.ready = '';
}
