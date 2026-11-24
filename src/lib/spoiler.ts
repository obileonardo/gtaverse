// The inline spoiler block, one markup for both places it appears: the <Spoiler> component (find text, Astro pages)
// and explainer markdown, where a paragraph that starts "Spoiler:" or "Spoiler (Chapter 3):" becomes one.
// Built on native <details>: the text is in the page but collapsed, works without JavaScript, and is announced as a
// disclosure. It opens by itself when the visitor's chapter setting has reached its chapter (src/lib/chapter.ts).

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Accepts 3, "3" or "Chapter 3"; returns "3", or null. */
export const chapterOf = (c: string | number | null | undefined) => {
  const m = /(\d+)/.exec(String(c ?? ''));
  return m ? m[1] : null;
};

export const spoilerOpen = (chapter: string | number | null | undefined) => {
  const n = chapterOf(chapter);
  const label = n ? `Spoiler, Chapter ${n}` : 'Spoiler';
  return `<details class="spoiler"${n ? ` data-chapter="${esc(n)}"` : ''}><summary class="spoiler__summary"><span class="badge badge--muted badge--caps spoiler__badge"><span class="badge__label">${esc(label)}</span></span><span class="spoiler__hint">Reveal</span></summary><div class="spoiler__body">`;
};
export const spoilerClose = '</div></details>';
export const spoilerHtml = (chapter: string | number | null | undefined, innerHtml: string) => `${spoilerOpen(chapter)}${innerHtml}${spoilerClose}`;

/** Marker at the start of a paragraph: "Spoiler:" or "Spoiler (Chapter 3):". */
export const SPOILER_MARK = /^Spoiler(?:\s*\((?:Chapter\s*)?(\d+)\))?:\s*/i;

/** Explainer HTML: paragraphs that start with the marker become spoiler blocks. */
export const spoilerParagraphs = (html: string) =>
  html.replace(/<p>Spoiler(?:\s*\((?:Chapter\s*)?(\d+)\))?:\s*([\s\S]*?)<\/p>/gi, (_, n: string | undefined, body: string) => spoilerHtml(n ?? null, `<p>${body}</p>`));

/** Plain find text: the part before a "Spoiler:" sentence, and the spoiler itself. */
export const splitSpoiler = (text: string) => {
  const i = text.search(/(?:^|\s)Spoiler(?:\s*\((?:Chapter\s*)?\d+\))?:\s/i);
  if (i < 0) return { before: text, spoiler: null };
  const rest = text.slice(i).trim();
  const m = SPOILER_MARK.exec(rest);
  return { before: text.slice(0, i).trim(), spoiler: { chapter: m?.[1] ?? null, text: rest.replace(SPOILER_MARK, '') } };
};
