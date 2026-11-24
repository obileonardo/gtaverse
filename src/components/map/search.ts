// Map search (docs/MAP.md, "Search"). Every word of the query must match somewhere in a find: its title, type, region,
// summary, location text, area, the finder's handle, the clip creator, the source creators, or one of our own words
// for its type or region (content/search-terms.json). Filler words ("where", "the", "gta") are dropped first, so
// "where is the ufo" searches for "ufo". A leading @ is ignored, so "@handle" lists that person's finds.
import terms from '../../../content/search-terms.json';
import type { MapFind } from './types';

const STOP = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'is', 'are', 'where', 'what', 'how', 'find', 'finds', 'found', 'by', 'with', 'gta', 'gta6', 'vi', '6', 'grand', 'theft', 'auto', 'location', 'locations']);

/** Lower case, accents dropped, punctuation to spaces. */
export const normalise = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9@' ]+/g, ' ');

export const queryWords = (q: string) => normalise(q).split(/\s+/).map((w) => w.replace(/^@+/, '').replace(/'/g, '')).filter((w) => w && !STOP.has(w));

const cache = new WeakMap<MapFind, string>();
const catTerms = terms.categories as Record<string, string[]>;
const regTerms = terms.regions as Record<string, string[]>;

function haystack(f: MapFind) {
  let h = cache.get(f);
  if (h) return h;
  const parts = [
    f.title, f.categoryLabel, f.category.replace(/-/g, ' '), f.regionLabel, f.summary, f.where ?? '', f.area ?? '',
    f.finder?.handle ?? '', f.clip?.creator ?? '', ...f.sources.map((s) => s.creator ?? ''),
    ...(catTerms[f.category] ?? []), ...f.regionIds.flatMap((id) => [id.replace(/-/g, ' '), ...(regTerms[id] ?? [])]),
  ];
  h = ` ${normalise(parts.join(' ')).replace(/'/g, '').replace(/@/g, '')} `;
  cache.set(f, h);
  return h;
}

/**
 * How well a matching find fits, for ordering: 3 every word is in the title, 2 every word is in the find's own text
 * (title, place, finder, creators), 1 the match needed one of our synonyms. So "bigfoot" lists the Skunk Ape first,
 * then the other paranormal finds.
 */
export function searchRank(f: MapFind, query: string) {
  const words = queryWords(query);
  if (!words.length) return 0;
  const title = ` ${normalise(f.title).replace(/'/g, '')} `;
  if (words.every((w) => title.includes(w))) return 3;
  const own = ` ${normalise([f.title, f.summary, f.where ?? '', f.area ?? '', f.regionLabel, f.categoryLabel, f.finder?.handle ?? '', f.clip?.creator ?? '', ...f.sources.map((s) => s.creator ?? '')].join(' ')).replace(/['@]/g, '')} `;
  return words.every((w) => own.includes(w)) ? 2 : 1;
}

/** Does a find match the search? An empty query (or one made only of filler words) matches everything. */
export function matchesSearch(f: MapFind, query: string) {
  const words = queryWords(query);
  if (!words.length) return true;
  const h = haystack(f);
  return words.every((w) => h.includes(w));
}
