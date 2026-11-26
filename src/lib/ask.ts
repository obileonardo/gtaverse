// The home page's search band (components/home/AskBar.astro, LR28 to LR32): the example questions under the box.
// They come from content/search-terms.json (examples). Each is a link to /map?q=..., so each is kept only if the map
// lists at least one find for it as it opens that link: the map's own fields (map-fields.ts), its own search
// (search.ts) and its own filter (types.ts, passes) with the default filters, so spoilers and mature finds are hidden.
// An example with no search word left once filler is dropped ("Where can I get it?") would list the whole map, so it
// counts as listing nothing. Node's test runner loads this file too (scripts/test/ask.test.ts): it takes the finds as
// an argument and imports nothing that only Astro understands.
import terms from '../../content/search-terms.json' with { type: 'json' };
import type { Find } from './content';
import { searchFields } from './map-fields.ts';
import { queryWords, setSearchCorpus } from '../components/map/search.ts';
import { defaultFilters, passes, type MapFind } from '../components/map/types.ts';

export type AskExample = { q: string; href: string; count: number };

/** The example questions as written, in order. */
export const exampleQuestions = (): string[] => (terms as { examples?: string[] }).examples ?? [];

/** Every example with its /map link and how many finds the map lists for it (0 for one that lists nothing). */
export function checkExamples(finds: Find[], questions = exampleQuestions()): AskExample[] {
  const mapFinds = finds.map(searchFields) as unknown as MapFind[];
  setSearchCorpus(mapFinds);
  return questions.map((q) => ({
    q,
    href: `/map?${new URLSearchParams({ q })}`,
    count: queryWords(q).length ? mapFinds.filter((f) => passes(f, defaultFilters, q)).length : 0,
  }));
}

/** The examples the band shows: those that list finds on the map. `finds` is the published finds (lib/content). */
export const askExamples = (finds: Find[]) => checkExamples(finds).filter((e) => e.count > 0);
