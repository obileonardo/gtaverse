// Renders a glyph of the icon family (src/icons/family.ts) as SVG markup. Works anywhere a string of SVG works:
// Astro (set:html), React (dangerouslySetInnerHTML), Leaflet marker HTML and canvas images.
// Drawings with knock-outs carry a mask; its id must be unique in the document, so every call gets a fresh id unless
// one is passed (React: pass a sanitised useId()). Rules: docs/ICONS.md.
import { aliases, blipBadges, config, glyphs, type GlyphName, type IconSet } from './family';

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

export type BlipForm = 'plate' | 'pin';
export type BlipState = 'default' | 'selected' | 'found' | 'new' | 'dim';
export type BlipSvgOptions = { form?: BlipForm; state?: BlipState; size?: number; label?: string; className?: string; uid?: string };

const blipState: Record<BlipState, { style: string; badge: string }> = {
  default: { style: '', badge: '' },
  selected: { style: '--blip-key:var(--accent, #f976b0)', badge: '' },
  found: { style: 'opacity:.55', badge: blipBadges.found },
  new: { style: '', badge: blipBadges.new },
  dim: { style: 'opacity:.4', badge: '' },
};

/** A map blip: the glyph on its plate (`plate`, for lists, legends and the HUD) or on its pointer (`pin`, for the map;
 * its anchor is the bottom centre). Colours are CSS variables over design tokens (--blip-plate, --blip-ink, --blip-key),
 * so a container can recolour every blip inside it. A glyph without a blip drawing falls back to iconSvg(). */
export function blipSvg(name: IconRef, { form = 'plate', state = 'default', size = 24, label, className, uid }: BlipSvgOptions = {}): string {
  const g = glyphs[resolveGlyph(name)] as { blip?: string; pin?: string };
  const body = form === 'pin' ? (g.pin ?? g.blip) : g.blip;
  if (!body) return iconSvg(name, { size, label, className, uid });
  const id = (uid ?? nextIconId()).replace(/[^a-zA-Z0-9_-]/g, '');
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const cls = ['icon', 'blip', `blip--${form}`, className].filter(Boolean).join(' ');
  const s = blipState[state];
  const style = s.style ? ` style="${s.style}"` : '';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 ${config.grid} ${config.grid}" fill="currentColor"${style} ${a11y} focusable="false">${body.replaceAll('%ID%', id)}${s.badge}</svg>`;
}
