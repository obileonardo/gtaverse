// The fields of a find that map search (src/components/map/search.ts) and the map's filter (types.ts, passes) read,
// built in one place for the map page (src/pages/map.astro), the home page's example questions (src/lib/ask.ts) and
// their test (scripts/test/ask.test.ts), so a check of what /map lists sees exactly what the map sees.
// Node's test runner loads this file, so it reads content JSON with import attributes and imports nothing that only
// Astro understands (import.meta.glob, plain JSON imports).
import regionsRaw from '../../content/regions.json' with { type: 'json' };
import categoriesRaw from '../../content/categories.json' with { type: 'json' };
import type { Find, Region, Category } from './content';

const regions = regionsRaw as Region[];
const categories = categoriesRaw as Category[];
const regionById = (id: string) => regions.find((r) => r.id === id);

// Category labels in content are plural ("Easter eggs"); one find reads better in the singular.
const singular: Record<string, string> = {
  'easter-egg': 'Easter egg', npc: 'Character', 'secret-location': 'Secret location', 'real-world-reference': 'Real-world reference',
  vehicle: 'Rare vehicle', memorial: 'Memorial', weapon: 'Unique weapon', 'rockstar-crossover': 'Rockstar crossover',
  collectible: 'Collectible', activity: 'Hidden activity', glitch: 'Glitch', paranormal: 'Paranormal',
};
export const categorySingular = (id: string) => singular[id] ?? categories.find((c) => c.id === id)?.label ?? id;

export const regionLabel = (f: Pick<Find, 'region_ids'>) => (f.region_ids[0] ? regionById(f.region_ids[0])?.name ?? f.region_ids[0] : 'Leonida');

/** A region and every region it sits in, innermost first. */
export const regionAncestors = (id: string): string[] => {
  const out: string[] = [];
  for (let r = regionById(id); r; r = r.parent ? regionById(r.parent) : undefined) out.push(r.id);
  return out;
};

/**
 * What search and the filter read. map.astro spreads this and adds the rest (icon, still, pin, related finds), and
 * replaces `clip` with the player's data (mapClip), whose `creator` is the same value.
 */
export const searchFields = (f: Find) => ({
  slug: f.slug,
  title: f.title,
  category: f.category,
  categoryLabel: categorySingular(f.category),
  regionIds: [...new Set(f.region_ids.flatMap(regionAncestors))].filter((id) => id !== 'leonida'),
  regionLabel: regionLabel(f),
  verification: f.verification,
  spoiler: f.spoiler,
  mature: f.mature,
  summary: f.summary,
  where: f.location_description ?? null,
  area: f.area ?? null,
  clip: f.clip ? { creator: f.clip.creator ?? null } : null,
  sources: f.sources.map((s) => ({ type: s.type, url: s.url, creator: s.creator ?? null })),
  finder: f.first_finder ? { handle: f.first_finder.handle, platform: f.first_finder.platform, url: f.first_finder.url ?? null } : null,
  chapterGate: f.chapter_gate ?? null,
});
