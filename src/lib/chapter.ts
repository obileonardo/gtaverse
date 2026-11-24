// "I'm on Chapter N": the visitor's story progress, kept on this device, so spoilers they have already played past
// open by themselves. Shared by the clip gate (Clip.astro), the finds list, find pages, inline Spoiler blocks and the
// chapter control. The map can adopt it later: import { readChapter, isUnlocked, onChapterChange } from this file
// (src/components/map is not changed here; see docs/DECISIONS.md GS9).
//
// Rules: "none" (the default) keeps every spoiler gated. A chapter number un-gates spoilers whose chapter_gate is
// that chapter or earlier; spoilers with no chapter_gate stay gated. "all" un-gates every spoiler. Mature content is
// never un-gated by this setting. Storage blocked: the choice lasts for this page only.

export const CHAPTER_KEY = 'vf-chapter';
export const CHAPTER_EVENT = 'vf:chapter';
export type ChapterSetting = 'none' | 'all' | number;

/** "Chapter 3" -> 3. Null when the gate names no chapter. */
export const parseChapter = (gate: string | number | null | undefined): number | null => {
  if (typeof gate === 'number') return Number.isFinite(gate) ? gate : null;
  const m = /(\d+)/.exec(gate ?? '');
  return m ? Number(m[1]) : null;
};

export const isUnlocked = (gate: string | number | null | undefined, setting: ChapterSetting) => {
  if (setting === 'all') return true;
  if (setting === 'none') return false;
  const n = parseChapter(gate);
  return n !== null && n <= setting;
};

const parseSetting = (v: string | null | undefined): ChapterSetting => {
  if (v === 'all') return 'all';
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 'none';
};

let memory: ChapterSetting | null = null;
export const readChapter = (): ChapterSetting => {
  if (memory !== null) return memory;
  try { return parseSetting(localStorage.getItem(CHAPTER_KEY)); } catch { return 'none'; }
};
export const writeChapter = (s: ChapterSetting) => {
  memory = s;
  try {
    if (s === 'none') localStorage.removeItem(CHAPTER_KEY);
    else localStorage.setItem(CHAPTER_KEY, String(s));
  } catch { /* private mode or blocked storage: the choice lasts for this page */ }
  document.dispatchEvent(new CustomEvent(CHAPTER_EVENT, { detail: s }));
};
export const onChapterChange = (fn: (s: ChapterSetting) => void) =>
  document.addEventListener(CHAPTER_EVENT, (e) => fn((e as CustomEvent<ChapterSetting>).detail));

/** Opens a gated clip (Clip.astro): loads its thumbnail, removes the gate. Focus moves only when the visitor asked. */
export const revealClip = (fig: HTMLElement, focus = false) => {
  const body = fig.querySelector<HTMLElement>('.clip-body');
  if (!body || !body.hidden) return;
  body.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => { img.src = img.dataset.src!; });
  body.hidden = false;
  fig.querySelector('.clip__gate')?.remove();
  if (focus) fig.querySelector<HTMLElement>('.clip-play, .clip__out')?.focus();
};

/** Applies the setting to everything on the page that carries a chapter gate. Only ever un-gates. */
export const applyChapter = (s: ChapterSetting = readChapter()) => {
  document.querySelectorAll<HTMLElement>('.clip[data-chapter-gate]').forEach((fig) => {
    if (isUnlocked(fig.dataset.chapterGate ?? null, s)) revealClip(fig);
  });
  document.querySelectorAll<HTMLImageElement>('img[data-chapter-src]').forEach((img) => {
    if (!isUnlocked(img.dataset.chapterGate ?? null, s)) return;
    if (img.dataset.chapterSrcset) img.srcset = img.dataset.chapterSrcset;
    img.src = img.dataset.chapterSrc!;
    img.removeAttribute('data-chapter-src');
    img.hidden = false;
  });
  document.querySelectorAll<HTMLDetailsElement>('details.spoiler').forEach((d) => {
    if (isUnlocked(d.dataset.chapter ?? null, s)) d.open = true;
  });
};

let started = false;
/** Call from any script that renders gated things. Runs once per page. */
export const initChapter = () => {
  if (started) return;
  started = true;
  applyChapter();
  onChapterChange((s) => applyChapter(s));
};
