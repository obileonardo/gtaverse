// The home page's search band (components/home/AskBar.astro, LR28 to LR32): the example questions under the box.
// They come from content/search-terms.json (examples), and each one is kept only if it lists at least one find on the
// map as the map opens a /map?q= link: the map's own search (search.ts) through its own filter (types.ts, passes)
// with the default filters, so spoilers and mature finds are hidden. A question that lists nothing is left out here,
// at build time, and scripts/test/ask.test.ts fails on it so it gets fixed or removed.
import terms from '../../content/search-terms.json';
import { finds, regionById } from './content';
import { categorySingular, regionLabel, mapClip } from './media';
import { setSearchCorpus } from '../components/map/search';
import { defaultFilters, passes, type MapFind } from '../components/map/types';

// The fields search and the filter read, built the way src/pages/map.astro builds them for the map.
const ancestors = (id: string): string[] => {
  const out: string[] = [];
  for (let r = regionById(id); r; r = r.parent ? regionById(r.parent) : undefined) out.push(r.id);
  return out;
};
const searchable = finds.map((f) => ({
  slug: f.slug,
  title: f.title,
  category: f.category,
  categoryLabel: categorySingular(f.category),
  regionIds: [...new Set(f.region_ids.flatMap(ancestors))].filter((id) => id !== 'leonida'),
  regionLabel: regionLabel(f),
  verification: f.verification,
  spoiler: f.spoiler,
  mature: f.mature,
  summary: f.summary,
  where: f.location_description ?? null,
  area: f.area ?? null,
  clip: mapClip(f),
  sources: f.sources.map((s) => ({ type: s.type, url: s.url, creator: s.creator ?? null })),
  finder: f.first_finder ? { handle: f.first_finder.handle, platform: f.first_finder.platform, url: f.first_finder.url ?? null } : null,
  chapterGate: f.chapter_gate ?? null,
})) as unknown as MapFind[];

export type AskExample = { q: string; href: string; count: number };

/** The example questions that list finds on the map, each with its /map link and how many finds it lists. */
export function askExamples(): AskExample[] {
  setSearchCorpus(searchable);
  return ((terms as { examples?: string[] }).examples ?? [])
    .map((q) => ({ q, href: `/map?${new URLSearchParams({ q })}`, count: searchable.filter((f) => passes(f, defaultFilters, q)).length }))
    .filter((e) => e.count > 0);
}
