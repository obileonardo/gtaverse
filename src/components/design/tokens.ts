// Reads src/styles/tokens.css at build time so the design system page lists every token as the code defines it.
// Nothing here is a second copy of a value: add, change or remove a token in tokens.css and /design follows on the
// next build. Contrast ratios are computed from the same values (WCAG 2 relative luminance, alpha composited over the
// ground the colour sits on).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { docNote } from './source';

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

export type Decl = { name: string; value: string; note: string };
export type Block = { selector: string; media: string | null; decls: Decl[] };

/** Every block of custom properties in tokens.css, in source order, with the comment that follows each one. */
function parse(text: string): Block[] {
  const out: Block[] = [];
  const walk = (src: string, media: string | null) => {
    let i = 0;
    while (i < src.length) {
      const open = src.indexOf('{', i);
      if (open < 0) break;
      const prelude = src.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      let depth = 1;
      let j = open + 1;
      for (; j < src.length && depth > 0; j++) {
        if (src.startsWith('/*', j)) { j = src.indexOf('*/', j + 2) + 1; continue; }
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
      }
      const body = src.slice(open + 1, j - 1);
      if (prelude.startsWith('@media')) walk(body, prelude.replace(/^@media\s*/, ''));
      else {
        const decls: Decl[] = [];
        const re = /(--[\w-]+)\s*:\s*([^;]+);([ \t]*\/\*([\s\S]*?)\*\/)?/g;
        for (let m = re.exec(body); m; m = re.exec(body)) {
          decls.push({ name: m[1], value: m[2].replace(/\s+/g, ' ').trim(), note: (m[4] ?? '').replace(/\s+/g, ' ').trim() });
        }
        if (decls.length) out.push({ selector: prelude.replace(/\s+/g, ' '), media: media, decls });
      }
      i = j;
    }
  };
  walk(text, null);
  return out;
}

export const blocks = parse(css);
// A token without a comment in the CSS takes its "Use" from the tables in docs/DESIGN-SYSTEM.md.
for (const b of blocks) for (const d of b.decls) if (!d.note) d.note = docNote(d.name);

const isDark = (b: Block) => !b.media && b.selector.includes("[data-scheme='dark']");
const isLight = (b: Block) => !b.media && b.selector.includes("[data-theme='light']");
const isBase = (b: Block) => !b.media && b.selector === ':root';

export const darkDecls = blocks.filter(isDark).flatMap((b) => b.decls);
export const lightDecls = blocks.filter(isLight).flatMap((b) => b.decls);
export const baseDecls = blocks.filter(isBase).flatMap((b) => b.decls);
/** Overrides inside media queries: token name to [{ media, value }]. */
export const overrides = new Map<string, { media: string; value: string }[]>();
for (const b of blocks.filter((b) => b.media)) {
  for (const d of b.decls) overrides.set(d.name, [...(overrides.get(d.name) ?? []), { media: b.media!, value: d.value }]);
}

/** A media query in words: "(max-width: 1439px)" to "below 1440". */
export const mediaLabel = (m: string) => {
  const max = m.match(/max-width:\s*(\d+)px/);
  if (max) return `below ${Number(max[1]) + 1}`;
  const min = m.match(/min-width:\s*(\d+)px/);
  return min ? `${min[1]} and up` : m;
};

// ---------- Colour ----------
export type Colour = { name: string; dark: string; light: string; lightSame: boolean; kind: 'colour' | 'gradient' | 'filter' | 'other'; note: string };
const kindOf = (v: string): Colour['kind'] =>
  /^(#|rgb|hsl|oklch|color\()/i.test(v) ? 'colour' : /gradient\(/.test(v) ? 'gradient' : /blur\(/.test(v) ? 'filter' : 'other';

const lightMap = new Map(lightDecls.map((d) => [d.name, d]));
const colourNames = [...new Set([...darkDecls.map((d) => d.name), ...lightDecls.map((d) => d.name)])];
export const colours: Colour[] = colourNames.map((name) => {
  const d = darkDecls.find((x) => x.name === name);
  const l = lightMap.get(name);
  const dark = d?.value ?? '';
  return { name, dark, light: l?.value ?? dark, lightSame: !l || l.value === dark, kind: kindOf(dark || l!.value), note: d?.note || l?.note || '' };
});

const groupOrder: [string, string, RegExp][] = [
  ['ground', 'Ground and surfaces', /^--(bg|surface-|border-|frame|icon-cut)/],
  ['text', 'Text', /^--text-/],
  ['accent', 'Accent', /^--(accent|on-accent)/],
  ['inverse', 'Inverse', /^--inverse-/],
  ['badge', 'Badges', /^--badge-/],
  ['glass', 'Glass', /^--glass-/],
  ['scrim', 'Scrims, art and glow', /^--(scrim|overlay-|art-|glow-)/],
  ['logo', 'Game logo plate', /^--logo-/],
  ['level', 'Levels', /^--level-/],
  ['blip', 'Map blips', /^--blip-/],
  ['map', 'Map', /^--map-/],
];
export const colourGroups = (() => {
  const used = new Set<string>();
  const groups = groupOrder.map(([id, title, re]) => {
    const items = colours.filter((c) => re.test(c.name) && !used.has(c.name));
    items.forEach((c) => used.add(c.name));
    return { id, title, items };
  });
  // Anything new that fits no group still shows, so the page never hides a token.
  const rest = colours.filter((c) => !used.has(c.name));
  if (rest.length) groups.push({ id: 'other', title: 'Other', items: rest });
  return groups.filter((g) => g.items.length);
})();

type RGBA = [number, number, number, number];
const resolve = (value: string, theme: 'dark' | 'light', seen = 0): string => {
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (!m || seen > 4) return value;
  const c = colours.find((x) => x.name === m[1]);
  return c ? resolve(theme === 'dark' ? c.dark : c.light, theme, seen + 1) : value;
};
export function rgba(value: string): RGBA | null {
  const v = value.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    const n = (k: number) => parseInt(h.slice(k, k + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  return null;
}
const over = (fg: RGBA, bg: RGBA): RGBA => {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
};
const lum = ([r, g, b]: RGBA) => {
  const ch = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
/** The colour of a token in a theme, alpha composited over the theme's ground (or over `on`, itself composited). */
export function solid(name: string, theme: 'dark' | 'light', on = '--bg'): RGBA | null {
  const c = colours.find((x) => x.name === name);
  const ground = rgba(resolve(theme === 'dark' ? colours.find((x) => x.name === '--bg')!.dark : colours.find((x) => x.name === '--bg')!.light, theme));
  if (!c || !ground) return null;
  const v = rgba(resolve(theme === 'dark' ? c.dark : c.light, theme));
  if (!v) return null;
  const base = on === '--bg' || on === name ? ground : solid(on, theme) ?? ground;
  return over(v, base);
}
export function contrast(fg: string, bg: string, theme: 'dark' | 'light'): number | null {
  const b = solid(bg, theme);
  const fgc = colours.find((x) => x.name === fg);
  if (!b || !fgc) return null;
  const v = rgba(resolve(theme === 'dark' ? fgc.dark : fgc.light, theme));
  if (!v) return null;
  const f = over(v, b);
  const [l1, l2] = [lum(f), lum(b)].sort((x, y) => y - x);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}
export const grade = (ratio: number | null, need: number) =>
  ratio === null ? 'n/a' : ratio >= need ? (need >= 4.5 && ratio >= 7 ? 'AAA' : 'Pass') : 'Fail';

/** The pairs the interface actually draws, with the WCAG threshold each one must meet (4.5 text, 3 large text and
 * graphics). */
export const contrastPairs: { fg: string; bg: string; need: number; use: string }[] = [
  ...['--bg', '--surface-1', '--surface-2', '--surface-3'].flatMap((bg) => [
    { fg: '--text-1', bg, need: 4.5, use: 'Primary text' },
    { fg: '--text-2', bg, need: 4.5, use: 'Secondary text' },
    { fg: '--text-3', bg, need: 4.5, use: 'Labels, footnotes' },
    { fg: '--accent-text', bg, need: 4.5, use: 'Pink text and links' },
  ]),
  { fg: '--on-accent', bg: '--accent', need: 4.5, use: 'Label on a primary button' },
  { fg: '--accent', bg: '--bg', need: 3, use: 'Pink fills, focus ring, underline (graphic)' },
  { fg: '--inverse-text', bg: '--inverse-fill', need: 4.5, use: 'Selected chip, white pill' },
  { fg: '--badge-verify-text', bg: '--badge-verify-fill', need: 4.5, use: 'Multi-source badge' },
  { fg: '--badge-meta-text', bg: '--badge-meta-fill', need: 4.5, use: 'Meta badge' },
  { fg: '--text-1', bg: '--glass-fill', need: 4.5, use: 'Text on glass (over the ground)' },
  { fg: '--blip-collectible-ink', bg: '--blip-collectible', need: 3, use: 'Collectible blip glyph (graphic)' },
  { fg: '--map-label', bg: '--map-land', need: 4.5, use: 'Map labels' },
  { fg: '--border-1', bg: '--bg', need: 0, use: 'Hairline (decorative, no threshold)' },
].filter((p) => colours.some((c) => c.name === p.fg) && colours.some((c) => c.name === p.bg));

/** Inline custom properties that make a wrapper wear the light theme, read from the light block. */
export const lightStyle = lightDecls.map((d) => `${d.name}: ${d.value}`).join('; ');

// ---------- Everything else in :root ----------
export const baseToken = (name: string) => baseDecls.find((d) => d.name === name);
export const tokensWhere = (re: RegExp) => baseDecls.filter((d) => re.test(d.name));
