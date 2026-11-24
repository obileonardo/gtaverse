// Map blips for the React island: the same output as blipSvg() in src/icons/render.ts, drawn from the generated
// subset src/icons/blips-map.ts so the island never bundles the whole icon family (docs/ICONS.md, step 6).
// scripts/test/icons.test.ts checks that both renderers give the same markup for every category and state.
import { useId } from 'react';
import { blipBadges, categoryGlyphs, mapBlips, type MapBlipName } from '../../icons/blips-map';

export type BlipForm = 'plate' | 'pin';
export type BlipState = 'default' | 'selected' | 'found' | 'new' | 'dim';
export type BlipOptions = { form?: BlipForm; state?: BlipState; size?: number; label?: string; className?: string; uid?: string };

const blipState: Record<BlipState, { style: string; badge: string }> = {
  default: { style: '', badge: '' },
  selected: { style: '--blip-key:var(--accent, #f976b0)', badge: '' },
  found: { style: 'opacity:.55', badge: blipBadges.found },
  new: { style: '', badge: blipBadges.new },
  dim: { style: 'opacity:.4', badge: '' },
};

let seq = 0;
const nextId = () => `vfm-${(++seq).toString(36)}`;

/** The glyph a category or collectible layer id draws with (content/categories.json ids). */
export const glyphOf = (category: string): MapBlipName => (categoryGlyphs as Record<string, MapBlipName>)[category] ?? 'easter-egg';

/** A blip (`plate`) or map pin (`pin`, anchored at its bottom centre) as SVG markup. */
export function blipSvg(name: MapBlipName, { form = 'plate', state = 'default', size = 24, label, className, uid }: BlipOptions = {}): string {
  const g = mapBlips[name];
  const body = form === 'pin' ? g.pin : g.blip;
  const id = (uid ?? nextId()).replace(/[^a-zA-Z0-9_-]/g, '');
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const cls = ['icon', 'blip', `blip--${form}`, className].filter(Boolean).join(' ');
  const s = blipState[state];
  const style = s.style ? ` style="${s.style}"` : '';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 20 20" fill="currentColor"${style} ${a11y} focusable="false">${body.replaceAll('%ID%', id)}${s.badge}</svg>`;
}

/** React wrapper: a decorative blip in a span (lists, legend rows, the category rail). */
export function Blip({ category, size = 24, state = 'default', form = 'plate', className }: { category: string; size?: number; state?: BlipState; form?: BlipForm; className?: string }) {
  const uid = useId(); // the same on the server and in the browser, so hydration matches
  return <span className={['blip-box', className].filter(Boolean).join(' ')} aria-hidden="true" dangerouslySetInnerHTML={{ __html: blipSvg(glyphOf(category), { size, state, form, uid }) }} />;
}
