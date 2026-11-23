// Stills for finds. The only art we show is the thumbnail of the creator's own YouTube post, served by YouTube
// (decision 8: embed, never re-host). Shorts are skipped: their thumbnails are portrait and crop badly.
// A find without a still falls back to the sunrise glow (--glow-hero) in the components.
import { youtubeId, regionById, categoryById, type Find } from './content';
import type { IconName } from '../components/ui/icons';

export type Still = { src: string; srcset: string; thumb: string };

export const findStill = (f: Find): Still | null => {
  if (!f.clip || f.clip.platform !== 'youtube' || /\/shorts\//.test(f.clip.url)) return null;
  const id = youtubeId(f.clip.url);
  if (!id) return null;
  const base = `https://i.ytimg.com/vi/${id}`;
  return { src: `${base}/maxresdefault.jpg`, srcset: `${base}/mqdefault.jpg 320w, ${base}/maxresdefault.jpg 1280w`, thumb: `${base}/mqdefault.jpg` };
};

/** Finds that are safe to show as art on open pages: no spoiler, no mature flag, a still to show. */
export const showcaseable = (f: Find) => !f.spoiler && !f.mature && findStill(f) !== null;

// Category labels in content are plural ("Easter eggs"); one find reads better in the singular.
const singular: Record<string, string> = {
  'easter-egg': 'Easter egg', npc: 'Character', 'secret-location': 'Secret location', 'real-world-reference': 'Real-world reference',
  vehicle: 'Rare vehicle', memorial: 'Memorial', weapon: 'Unique weapon', 'rockstar-crossover': 'Rockstar crossover',
  collectible: 'Collectible', activity: 'Hidden activity', glitch: 'Glitch', paranormal: 'Paranormal',
};
export const categoryLabel = (f: Find) => singular[f.category] ?? categoryById(f.category)?.label ?? f.category;

export const regionLabel = (f: Find) => (f.region_ids[0] ? regionById(f.region_ids[0])?.name ?? f.region_ids[0] : 'Leonida');

// Category glyphs (src/components/ui/icons.ts) and short plural chip labels for the map's chip row.
export const categoryIcons: Record<string, IconName> = {
  'easter-egg': 'egg', npc: 'person', 'secret-location': 'keyhole', 'real-world-reference': 'globe', vehicle: 'car',
  memorial: 'candle', weapon: 'crosshair', 'rockstar-crossover': 'star', collectible: 'gem', activity: 'flag',
  glitch: 'bolt', paranormal: 'ghost',
};
export const categoryIcon = (id: string): IconName => categoryIcons[id] ?? 'pin';
const chips: Record<string, string> = {
  'easter-egg': 'Easter eggs', npc: 'Characters', 'secret-location': 'Secret spots', 'real-world-reference': 'Real world',
  vehicle: 'Vehicles', memorial: 'Memorials', weapon: 'Weapons', 'rockstar-crossover': 'Crossovers', collectible: 'Collectibles',
  activity: 'Activities', glitch: 'Glitches', paranormal: 'Paranormal',
};
export const categoryChipLabel = (id: string) => chips[id] ?? categoryById(id)?.label ?? id;
export const categorySingular = (id: string) => singular[id] ?? categoryById(id)?.label ?? id;
