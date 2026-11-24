// Renders a glyph of the icon family (src/icons/family.ts) as SVG markup. Works anywhere a string of SVG works:
// Astro (set:html), React (dangerouslySetInnerHTML), Leaflet marker HTML and canvas images.
// Drawings with knock-outs carry a mask; its id must be unique in the document, so every call gets a fresh id unless
// one is passed (React: pass a sanitised useId()). Rules: docs/ICONS.md.
import { aliases, config, glyphs, type GlyphName, type IconSet } from './family';

export type IconRef = GlyphName | keyof typeof aliases;

/** A glyph name, or an old name from src/components/ui/icons.ts, to the glyph that draws it. */
export const resolveGlyph = (name: IconRef): GlyphName =>
  (name in glyphs ? name : aliases[name as keyof typeof aliases]) as GlyphName;

let seq = 0;
/** A mask id that is unique within one page render. */
export const nextIconId = () => `vfi-${(++seq).toString(36)}`;

/** The inner markup of one drawing (for a 0 0 20 20 viewBox, fill currentColor on the svg). */
export function glyphMarkup(name: IconRef, set: IconSet = 'solid', uid: string = nextIconId()): string {
  const id = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  return glyphs[resolveGlyph(name)][set].replaceAll('%ID%', id);
}

export type IconSvgOptions = { set?: IconSet; size?: number; label?: string; className?: string; uid?: string };

/** A whole <svg> element. Decorative (aria-hidden) unless a label is given. */
export function iconSvg(name: IconRef, { set = 'solid', size = 20, label, className, uid }: IconSvgOptions = {}): string {
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const cls = ['icon', className].filter(Boolean).join(' ');
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 ${config.grid} ${config.grid}" fill="currentColor" ${a11y} focusable="false">${glyphMarkup(name, set, uid)}</svg>`;
}
