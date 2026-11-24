// The Vice Files logo: Case File, designed by Chime (direction 1; chosen by Elvis on 24 Nov 2026, decision LG5).
// A folder with VF cut in it, beside THE VICE FILES in Big Shoulders Black caps. Rules: docs/LOGO.md.
//
// The logo is code, never a file (decision IC3: the CI asset guard blocks .svg files). This module has no imports so
// Node can run it as is (scripts/brand/build-favicons.mjs, scripts/test/logo.test.ts) as well as Astro and satori.
//
// The paths below were taken once from Chime's Figma export and are not edited by hand: Chime's own outlines (no live
// text, so the logo never depends on a font loading), moved to the origin and rounded to 0.01 units. Nothing else in
// the geometry is changed. When Chime polishes the logo, replace these four constants from the new export.

/** The folder with VF cut in it, from the logo panel. For marks drawn larger than 32 px. */
export const MARK = {
  w: 107.25,
  h: 90.75,
  folder: 'M0 10.31C0 7.58 1.09 4.95 3.02 3.02C4.95 1.09 7.58 0 10.31 0H37.13L49.5 12.38H96.94C99.67 12.38 102.3 13.46 104.23 15.4C106.16 17.33 107.25 19.95 107.25 22.69V80.44C107.25 83.17 106.16 85.8 104.23 87.73C102.3 89.66 99.67 90.75 96.94 90.75H10.31C7.58 90.75 4.95 89.66 3.02 87.73C1.09 85.8 0 83.17 0 80.44V10.31Z',
  cut: 'M34.72 75.66L28.26 31.11H36.9L40.18 53.44L40.68 68.31H42.52L43.02 53.44L46.31 31.11H54.94L48.48 75.66H34.72ZM57.94 75.66V31.11H77.52V38.46H66.3V49.32H76.96V56.67H66.3V75.66H57.94Z',
} as const;

/** The same folder from Chime's mark sheet (32 and 16 px): the VF is a little wider so it holds at small sizes. */
export const MARK_SMALL = {
  w: 26,
  h: 22,
  folder: 'M0 2.5C0 1.84 0.26 1.2 0.73 0.73C1.2 0.26 1.84 0 2.5 0H9L12 3H23.5C24.16 3 24.8 3.26 25.27 3.73C25.74 4.2 26 4.84 26 5.5V19.5C26 20.16 25.74 20.8 25.27 21.27C24.8 21.74 24.16 22 23.5 22H2.5C1.84 22 1.2 21.74 0.73 21.27C0.26 20.8 0 20.16 0 19.5V2.5Z',
  cut: 'M8.26 18.25L6.7 7.45H8.79L9.58 12.86L9.71 16.47H10.34L10.46 12.86L11.26 7.45H13.35L11.79 18.25H8.26ZM14.22 18.25V7.45H19.15V9.23H16.25V11.86H19.01V13.65H16.25V18.25H14.22Z',
} as const;

/** THE VICE FILES on one line (Big Shoulders Black caps, outlined), from the board's signature lockup. Cap height 16. */
export const WORDMARK = {
  w: 110.35,
  h: 16.4,
  d: 'M2.74 16.2V2.84H0V0.2H8.48V2.84H5.74V16.2H2.74ZM9.54 16.2V0.2H12.54V6.74H14.97V0.2H17.97V16.2H14.97V9.38H12.54V16.2H9.54ZM19.91 16.2V0.2H27.16V2.84H22.91V6.74H26.96V9.38H22.91V13.56H27.16V16.2H19.91ZM34.32 16.2L32 0.2H35.1L36.28 8.22L36.46 13.56H37.36L37.54 8.22L38.72 0.2H41.82L39.5 16.2H34.32ZM43.06 16.2V0.2H46.06V16.2H43.06ZM52.24 16.4C50.7 16.4 49.59 16.09 48.91 15.47C48.24 14.85 47.88 13.82 47.85 12.38C47.84 11.67 47.83 10.96 47.82 10.27C47.81 9.58 47.81 8.89 47.81 8.2C47.81 7.51 47.81 6.81 47.82 6.11C47.83 5.41 47.84 4.7 47.85 3.98C47.87 2.63 48.23 1.63 48.93 0.98C49.64 0.33 50.74 0 52.24 0C53.71 0 54.78 0.32 55.47 0.97C56.16 1.62 56.53 2.63 56.57 4C56.58 4.22 56.58 4.46 56.58 4.72C56.58 4.97 56.58 5.23 56.57 5.49C56.56 5.74 56.56 5.98 56.55 6.2H53.55C53.56 5.95 53.56 5.69 53.57 5.41C53.58 5.13 53.58 4.85 53.58 4.57C53.58 4.29 53.58 4.03 53.57 3.78C53.56 3.31 53.45 2.97 53.24 2.76C53.03 2.55 52.69 2.44 52.24 2.44C51.77 2.44 51.43 2.55 51.2 2.76C50.98 2.97 50.86 3.31 50.85 3.78C50.83 4.51 50.81 5.24 50.8 5.98C50.79 6.72 50.79 7.46 50.79 8.2C50.79 8.94 50.79 9.68 50.8 10.41C50.81 11.14 50.83 11.87 50.85 12.6C50.86 13.08 50.98 13.43 51.2 13.64C51.43 13.85 51.77 13.96 52.24 13.96C52.72 13.96 53.07 13.85 53.29 13.64C53.51 13.43 53.63 13.08 53.65 12.6C53.66 12.33 53.67 12.06 53.67 11.81C53.68 11.55 53.68 11.29 53.67 11.03C53.67 10.77 53.66 10.49 53.65 10.2H56.65C56.66 10.52 56.67 10.88 56.67 11.29C56.67 11.7 56.66 12.06 56.65 12.38C56.61 13.82 56.25 14.85 55.57 15.47C54.89 16.09 53.78 16.4 52.24 16.4ZM58.23 16.2V0.2H65.48V2.84H61.23V6.74H65.28V9.38H61.23V13.56H65.48V16.2H58.23ZM71.4 16.2V0.2H78.65V2.84H74.4V6.74H78.45V9.38H74.4V16.2H71.4ZM80.01 16.2V0.2H83.01V16.2H80.01ZM84.95 16.2V0.2H87.95V13.56H91.89V16.2H84.95ZM93.12 16.2V0.2H100.37V2.84H96.12V6.74H100.17V9.38H96.12V13.56H100.37V16.2H93.12ZM105.96 16.4C104.46 16.4 103.37 16.09 102.71 15.47C102.05 14.85 101.69 13.82 101.63 12.38C101.62 12.17 101.62 11.93 101.62 11.68C101.62 11.42 101.62 11.16 101.64 10.91C101.65 10.65 101.67 10.41 101.71 10.2H104.53C104.5 10.69 104.48 11.17 104.48 11.64C104.47 12.11 104.49 12.55 104.53 12.94C104.56 13.27 104.7 13.52 104.94 13.7C105.18 13.87 105.52 13.96 105.96 13.96C106.36 13.96 106.68 13.87 106.91 13.7C107.14 13.52 107.28 13.27 107.32 12.94C107.34 12.71 107.36 12.49 107.37 12.27C107.38 12.04 107.38 11.82 107.37 11.6C107.36 11.37 107.34 11.15 107.32 10.92C107.29 10.64 107.18 10.38 106.98 10.15C106.78 9.92 106.52 9.77 106.2 9.7L104.39 9.28C103.69 9.12 103.13 8.87 102.73 8.53C102.32 8.19 102.03 7.77 101.85 7.26C101.67 6.75 101.57 6.17 101.55 5.5C101.54 5.21 101.54 4.95 101.54 4.72C101.54 4.49 101.54 4.25 101.55 4C101.59 3.05 101.76 2.28 102.07 1.69C102.37 1.1 102.84 0.68 103.48 0.41C104.11 0.14 104.94 0 105.96 0C107.44 0 108.51 0.31 109.17 0.93C109.83 1.54 110.2 2.57 110.26 4C110.27 4.29 110.27 4.64 110.26 5.05C110.25 5.46 110.24 5.85 110.22 6.2H107.34C107.36 5.74 107.37 5.28 107.38 4.82C107.38 4.36 107.38 3.9 107.36 3.44C107.35 3.12 107.22 2.87 106.98 2.7C106.74 2.53 106.4 2.44 105.96 2.44C105.54 2.44 105.21 2.53 104.97 2.7C104.73 2.87 104.59 3.12 104.55 3.44C104.51 3.78 104.49 4.12 104.49 4.47C104.49 4.82 104.51 5.16 104.55 5.5C104.58 5.77 104.67 6.01 104.83 6.24C104.98 6.46 105.23 6.61 105.57 6.68L107.16 7.02C107.9 7.18 108.51 7.44 108.97 7.79C109.43 8.14 109.76 8.57 109.98 9.1C110.19 9.63 110.31 10.23 110.34 10.92C110.34 11.07 110.35 11.23 110.35 11.4C110.35 11.57 110.34 11.73 110.34 11.9C110.33 12.07 110.32 12.23 110.32 12.38C110.26 13.82 109.89 14.85 109.22 15.47C108.55 16.09 107.46 16.4 105.96 16.4Z',
} as const;

/** THE VICE / FILES on two lines, from the logo panel. */
export const WORDMARK_STACKED = {
  w: 200.45,
  h: 107.48,
  d: 'M8.29 51.84V9.09H0V0.64H26.21V9.09H17.89V51.84H8.29ZM29.27 51.84V0.64H38.87V21.57H45.75V0.64H55.35V51.84H45.75V30.02H38.87V51.84H29.27ZM60.65 51.84V0.64H82.95V9.09H70.25V21.57H82.31V30.02H70.25V43.39H82.95V51.84H60.65ZM105.27 51.84L97.85 0.64H107.77L111.55 26.3L112.12 43.39H114.07L114.65 26.3L118.43 0.64H128.35L120.92 51.84H105.27ZM131.71 51.84V0.64H141.31V51.84H131.71ZM159.9 52.48C155.05 52.48 151.6 51.49 149.53 49.5C147.48 47.52 146.4 44.22 146.3 39.62C146.27 37.76 146.25 35.68 146.23 33.38C146.21 31.07 146.2 28.69 146.2 26.24C146.2 23.77 146.21 21.38 146.23 19.07C146.25 16.75 146.27 14.64 146.3 12.74C146.36 8.77 147.46 5.65 149.59 3.39C151.75 1.13 155.18 0 159.9 0C164.53 0 167.89 0.99 169.98 2.98C172.07 4.96 173.18 8.24 173.31 12.8C173.33 13.5 173.34 14.27 173.34 15.1C173.34 15.92 173.33 16.74 173.31 17.57C173.28 18.38 173.26 19.14 173.24 19.84H163.64C163.66 19.05 163.68 18.13 163.7 17.09C163.73 16.04 163.74 15 163.74 13.95C163.74 12.89 163.73 11.96 163.7 11.17C163.68 10.08 163.34 9.25 162.68 8.67C162.02 8.1 161.09 7.81 159.9 7.81C158.64 7.81 157.67 8.1 156.98 8.67C156.3 9.25 155.94 10.08 155.9 11.17C155.83 13.43 155.78 15.84 155.74 18.4C155.71 20.96 155.7 23.57 155.7 26.24C155.7 28.91 155.71 31.52 155.74 34.08C155.78 36.62 155.83 39.01 155.9 41.25C155.94 42.36 156.3 43.21 156.98 43.81C157.67 44.38 158.64 44.67 159.9 44.67C161.2 44.67 162.19 44.38 162.87 43.81C163.56 43.21 163.92 42.36 163.96 41.25C163.98 40.46 163.99 39.55 163.99 38.53C164.01 37.48 164.01 36.44 163.99 35.39C163.99 34.35 163.98 33.43 163.96 32.64H173.56C173.6 33.66 173.62 34.83 173.62 36.13C173.62 37.43 173.6 38.59 173.56 39.62C173.43 44.22 172.31 47.52 170.2 49.5C168.09 51.49 164.65 52.48 159.9 52.48ZM178.15 51.84V0.64H200.45V9.09H187.75V21.57H199.81V30.02H187.75V43.39H200.45V51.84H178.15ZM2.27 106.84V55.64H24.58V64.09H11.87V76.57H23.94V85.02H11.87V106.84H2.27ZM28.52 106.84V55.64H38.12V106.84H28.52ZM43.4 106.84V55.64H53V98.39H65.6V106.84H43.4ZM69.21 106.84V55.64H91.51V64.09H78.81V76.57H90.87V85.02H78.81V98.39H91.51V106.84H69.21ZM108.26 107.48C103.56 107.48 100.2 106.49 98.18 104.5C96.17 102.52 95.07 99.22 94.88 94.62C94.86 93.93 94.85 93.19 94.85 92.38C94.85 91.54 94.87 90.72 94.91 89.91C94.95 89.08 95.03 88.32 95.14 87.64H104.16C104.07 89.2 104.02 90.73 104 92.25C103.98 93.76 104.03 95.15 104.16 96.41C104.27 97.45 104.65 98.26 105.31 98.84C106 99.4 106.98 99.67 108.26 99.67C109.54 99.67 110.47 99.4 111.07 98.84C111.69 98.26 112.07 97.45 112.19 96.41C112.28 95.68 112.33 94.97 112.35 94.26C112.39 93.54 112.39 92.82 112.35 92.12C112.33 91.4 112.28 90.67 112.19 89.94C112.11 89.05 111.81 88.24 111.3 87.51C110.81 86.79 110.05 86.3 109.02 86.04L103.71 84.7C101.49 84.12 99.73 83.3 98.43 82.23C97.13 81.14 96.18 79.8 95.58 78.2C95.01 76.6 94.69 74.73 94.62 72.6C94.6 71.66 94.59 70.83 94.59 70.1C94.59 69.36 94.6 68.59 94.62 67.8C94.75 64.75 95.27 62.29 96.19 60.41C97.11 58.53 98.54 57.16 100.48 56.31C102.44 55.44 105.03 55 108.26 55C112.84 55 116.16 55.99 118.21 57.98C120.28 59.94 121.41 63.21 121.6 67.8C121.64 68.72 121.64 69.84 121.6 71.16C121.58 72.48 121.54 73.71 121.47 74.84H112.26C112.32 73.37 112.36 71.9 112.39 70.42C112.41 68.95 112.39 67.48 112.32 66.01C112.3 64.98 111.93 64.19 111.2 63.64C110.47 63.09 109.49 62.81 108.26 62.81C106.98 62.81 106.02 63.09 105.38 63.64C104.74 64.19 104.35 64.98 104.22 66.01C104.1 67.1 104.03 68.19 104.03 69.3C104.03 70.41 104.1 71.51 104.22 72.6C104.33 73.45 104.63 74.23 105.12 74.94C105.61 75.64 106.4 76.12 107.49 76.38L112.1 77.46C114.51 78.04 116.41 78.89 117.79 80.02C119.18 81.13 120.18 82.52 120.8 84.18C121.42 85.83 121.77 87.75 121.86 89.94C121.88 90.44 121.89 90.95 121.89 91.48C121.89 92.01 121.88 92.55 121.86 93.08C121.83 93.61 121.81 94.13 121.79 94.62C121.6 99.22 120.48 102.52 118.43 104.5C116.41 106.49 113.01 107.48 108.26 107.48Z',
} as const;

// ---------- Colour ----------
// Brand colours are the site tokens, nothing new (LG4: blush stays out). Inside the site the logo reads them as CSS
// variables; the favicon files and the Open Graph cards cannot read CSS, so they use these values, which a test checks
// against src/styles/tokens.css.
/** --accent (GTA pink) and --on-accent (GTA night navy), the same in both themes. */
export const BRAND = { pink: '#F976B0', navy: '#0D0C1A' } as const;

export interface LogoColours { folder: string; cut: string; word: string }
/**
 * site: Chime's mark sheet colourway, on any ground in either theme: a pink folder with the VF in navy, and the
 *   wordmark in the text colour (currentColor). A container can recolour it with --logo-folder and --logo-cut.
 * on-pink: Chime's logo panel colourway, for a pink ground: a navy folder with the VF in pink, navy wordmark.
 * fixed: the site colourway in plain hex, for files and cards that cannot read CSS.
 */
export const LOGO_TONES = {
  site: { folder: 'var(--logo-folder, var(--accent, #f976b0))', cut: 'var(--logo-cut, var(--on-accent, #0d0c1a))', word: 'currentColor' },
  'on-pink': { folder: 'var(--on-accent, #0d0c1a)', cut: 'var(--accent, #f976b0)', word: 'var(--on-accent, #0d0c1a)' },
  fixed: { folder: BRAND.pink, cut: BRAND.navy, word: BRAND.navy },
} as const satisfies Record<string, LogoColours>;
export type LogoTone = keyof typeof LOGO_TONES;

// ---------- Sizes ----------
/** At this many CSS pixels of folder height and under, the mark uses MARK_SMALL, as on Chime's mark sheet. */
export const SMALL_MARK_MAX = 32;
/** The smallest the mark may be drawn (its folder height): Chime's 16 px favicon has an 11 px folder. */
export const MIN_MARK_PX = 11;
/** The smallest the one-line lockup may be drawn (its height): the wordmark's caps are then 12 px. */
export const MIN_LOCKUP_PX = 13.5;
/** Clear space around the logo, in folder heights: half the folder's height on every side. */
export const CLEAR_SPACE = 0.5;

// The one-line lockup, in the proportions of Chime's signature lockup on the board: the folder is 1.12 times the cap
// height of the wordmark, the wordmark starts 0.78 cap heights after the folder, both centred on one line.
const LINE = { folderH: 17.88, wordX: 33.66, wordY: 0.74, w: 144.01 } as const;
// The stacked lockup, exactly as on Chime's logo panel: the two-line wordmark 34.76 after the folder, the folder centred.
const STACK = { markY: 9.47, wordX: MARK.w + 34.76, w: MARK.w + 34.76 + WORDMARK_STACKED.w, h: WORDMARK_STACKED.h } as const;

// ---------- Markup ----------
const n = (v: number) => String(Math.round(v * 100) / 100);
/** A fill: CSS variables go in a style attribute (presentation attributes do not resolve var()). */
const paint = (c: string) => (c.startsWith('var(') ? `style="fill:${c}"` : `fill="${c}"`);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export interface LogoSvgOptions {
  /** Height in CSS pixels (the width follows). CSS may resize it; keep width auto then. */
  height: number;
  tone?: LogoTone;
  /** Overrides the tone's colours one by one. */
  colours?: Partial<LogoColours>;
  /** An accessible name. Without one the SVG is decorative (aria-hidden), for use inside a labelled link. */
  label?: string;
  class?: string;
  /** Chime's small drawing of the mark (wider VF). Defaults to on at a folder height of 32 px and under. */
  small?: boolean;
}
function svg(w: number, h: number, o: LogoSvgOptions, inner: string) {
  const a11y = o.label ? `role="img" aria-label="${esc(o.label)}"` : 'aria-hidden="true"';
  const cls = o.class ? ` class="${esc(o.class)}"` : '';
  const title = o.label ? `<title>${esc(o.label)}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg"${cls} width="${n((o.height * w) / h)}" height="${n(o.height)}" viewBox="0 0 ${n(w)} ${n(h)}" ${a11y} focusable="false">${title}${inner}</svg>`;
}
const coloursOf = (o: Pick<LogoSvgOptions, 'tone' | 'colours'>): LogoColours => ({ ...LOGO_TONES[o.tone ?? 'site'], ...o.colours });
/** The folder and its VF, scaled to a folder height of `h` units and moved to x, y. */
function markPaths(small: boolean, h: number, c: LogoColours, x = 0, y = 0) {
  const m = small ? MARK_SMALL : MARK;
  const k = +(h / m.h).toFixed(5);
  const t = [x || y ? `translate(${n(x)} ${n(y)})` : '', k !== 1 ? `scale(${k})` : ''].filter(Boolean).join(' ');
  return `<g${t ? ` transform="${t}"` : ''}><path ${paint(c.folder)} d="${m.folder}"/><path ${paint(c.cut)} d="${m.cut}"/></g>`;
}

/** The mark alone: the folder with VF cut in it. `height` is the folder's height. */
export function markSvg(o: LogoSvgOptions): string {
  const small = o.small ?? o.height <= SMALL_MARK_MAX;
  const m = small ? MARK_SMALL : MARK;
  return svg(m.w, m.h, o, markPaths(small, m.h, coloursOf(o)));
}

/** The one-line lockup: the mark, then THE VICE FILES. `height` is the folder's height; the caps are 0.9 of it. */
export function lockupSvg(o: LogoSvgOptions): string {
  const c = coloursOf(o);
  const small = o.small ?? o.height <= SMALL_MARK_MAX;
  const inner = markPaths(small, LINE.folderH, c) + `<path ${paint(c.word)} transform="translate(${LINE.wordX} ${LINE.wordY})" d="${WORDMARK.d}"/>`;
  return svg(LINE.w, LINE.folderH, o, inner);
}

/** The stacked lockup of Chime's logo panel: the mark beside THE VICE / FILES. `height` is the wordmark's height. */
export function stackedSvg(o: LogoSvgOptions): string {
  const c = coloursOf(o);
  const small = o.small ?? (o.height * MARK.h) / STACK.h <= SMALL_MARK_MAX;
  const inner = markPaths(small, MARK.h, c, 0, STACK.markY) + `<path ${paint(c.word)} transform="translate(${n(STACK.wordX)} 0)" d="${WORDMARK_STACKED.d}"/>`;
  return svg(STACK.w, STACK.h, o, inner);
}

// ---------- Favicons (scripts/brand/build-favicons.mjs writes them to public/) ----------
/**
 * The favicon: Chime's 32 px mark (MARK_SMALL), a pink folder with a navy VF, centred on a transparent 32 square with
 * the margins of the mark sheet (3 at the sides, 5 above and below). Fixed colours: it is a file.
 */
export function faviconSvg(): string {
  const inner = markPaths(true, MARK_SMALL.h, LOGO_TONES.fixed, (32 - MARK_SMALL.w) / 2, (32 - MARK_SMALL.h) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${inner}</svg>\n`;
}

/**
 * The app icon (apple-touch-icon, web manifest), after Chime's app icon panel: the mark on a navy square at 56 % of its
 * width. Square corners: iOS and Android round the icon themselves. The mark stays inside the maskable safe circle.
 */
export function appIconSvg(size: number): string {
  const w = size * 0.56;
  const h = (w * MARK.h) / MARK.w;
  const inner = `<rect width="${size}" height="${size}" fill="${BRAND.navy}"/>` + markPaths(false, h, LOGO_TONES.fixed, (size - w) / 2, (size - h) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${inner}</svg>\n`;
}
