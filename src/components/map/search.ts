// Map search (docs/MAP.md, "Search"). It reads plain questions as well as keywords: "where can I get guns",
// "where can I get 200k", "the NPC you cannot snipe". Every word of the query must match somewhere in a find: its
// title, type, region, summary, location text, area, the finder's handle, the clip creator, the source creators, or
// one of our own words for its type, region or topic (content/search-terms.json). How a query is read:
// 1. Filler and question words ("where", "can", "i", "get", "the", "gta") are dropped, so "where is the ufo" searches
//    for "ufo". A leading @ is ignored, so "@handle" lists that person's finds.
// 2. A money amount ("200k", "$20,000") becomes the word "money"; a find whose text names a dollar amount matches it.
// 3. Each word also matches its singular ("guns" finds "gun") and every word in its topic group ("cash" finds "loot").
// 4. Words match at the start of a word, so "snipe" finds "sniper" but "fast" does not find "breakfast".
// 5. Once the map has given its finds (setSearchCorpus): a word that matches no find is left out, and if no find
//    matches every remaining word, the loosest words (not one of our type, place or topic words) are left out one at
//    a time until something matches. Left-out words are named under the list (describeSearch), so "how do I make
//    money fast" still lists the money finds.
// 6. Order: title matches, then a match on the find's type ("guns" puts weapons first), then the find's own text,
//    then synonym-only matches. A money question lists the biggest dollar amounts first.
import terms from '../../../content/search-terms.json' with { type: 'json' };
import type { MapFind } from './types';

const STOP = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'is', 'are', 'where', 'what', 'how', 'find', 'finds', 'found', 'by', 'with', 'gta', 'gta6', 'vi', '6', 'grand', 'theft', 'auto', 'location', 'locations',
  // Question words, so a question reads like its keywords.
  'can', 'i', 'im', 'get', 'got', 'getting', 'me', 'my', 'we', 'you', 'your', 'u', 'there', 'any', 'do', 'does', 'did', 'see', 'show', 'tell', 'which', 'who', 'whats', 'wheres', 'game', 'ingame', 'please', 'some', 'someone', 'something', 'cannot', 'cant', 'would', 'could', 'should', 'will', 'want', 'need', 'be', 'it', 'its', 'this', 'that', 'from', 'into', 'about', 'have', 'has', 'give', 'look', 'looking', 'list', 'all', 'every', 'when', 'why', 'way', 'ways', 'go',
]);

/** Lower case, accents dropped, punctuation to spaces. */
export const normalise = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9@' ]+/g, ' ');

// "$20,000", "$5", "200k", "1.5m": a money amount, read as the word "money". A bare number ("1886") stays a number.
const AMOUNT = /\$\s?\d[\d,.]*\s?[km]?\b|\b\d+(?:\.\d+)?\s?[km]\b/gi;
const HAS_AMOUNT = /\$\s?\d/;

export const queryWords = (q: string) => normalise(q.replace(AMOUNT, ' money ')).split(/\s+/).map((w) => w.replace(/^@+/, '').replace(/'/g, '')).filter((w) => w && !STOP.has(w));

const cache = new WeakMap<MapFind, string>();
const catTerms = terms.categories as Record<string, string[]>;
const regTerms = terms.regions as Record<string, string[]>;
// Topic groups: a query word in a group matches any word of that group (search-terms.json, topics).
const topicOf = new Map<string, string[]>();
for (const group of Object.values((terms as { topics?: Record<string, string[]> }).topics ?? {})) {
  const words = group.map((w) => normalise(w).trim());
  for (const w of words) topicOf.set(w, words);
}

/** The singular of a word, roughly: "guns" to "gun", "stories" to "story". Short words are left alone. */
const singular = (w: string) => (w.length > 4 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

/** Every spelling a query word may match: itself, its singular, and its topic group. */
function alternatives(w: string) {
  const out = new Set([w, singular(w)]);
  for (const x of [...out]) for (const t of topicOf.get(x) ?? []) out.add(t);
  return [...out];
}

function haystack(f: MapFind) {
  let h = cache.get(f);
  if (h) return h;
  const parts = [
    f.title, f.categoryLabel, f.category.replace(/-/g, ' '), f.regionLabel, f.summary, f.where ?? '', f.area ?? '',
    f.finder?.handle ?? '', f.clip?.creator ?? '', ...f.sources.map((s) => s.creator ?? ''),
    ...(catTerms[f.category] ?? []), ...f.regionIds.flatMap((id) => [id.replace(/-/g, ' '), ...(regTerms[id] ?? [])]),
    HAS_AMOUNT.test(`${f.summary} ${f.where ?? ''}`) ? 'money' : '',
  ];
  h = ` ${normalise(parts.join(' ')).replace(/'/g, '').replace(/@/g, '')} `;
  cache.set(f, h);
  return h;
}

// Texts are padded with spaces, so " word" matches at the start of a word.
const hits = (text: string, alts: string[]) => alts.some((a) => text.includes(` ${a}`));

// Our own words (type, place, topic): a query word that is one of these is never left out by step 5.
const known = new Set<string>([...topicOf.keys(), ...Object.values(catTerms).flat(), ...Object.values(regTerms).flat()].map((w) => normalise(w).trim()));

/** The largest dollar amount a find's text names, for ordering money questions. 0 when there is none. */
export function moneyAmount(f: MapFind) {
  let best = 0;
  for (const m of `${f.summary} ${f.where ?? ''}`.matchAll(/\$\s?(\d[\d,]*)(?:\.\d+)?\s?([km])?\b/gi)) {
    const n = Number(m[1].replace(/,/g, '')) * (m[2]?.toLowerCase() === 'k' ? 1e3 : m[2]?.toLowerCase() === 'm' ? 1e6 : 1);
    if (n > best) best = n;
  }
  return best;
}

// The finds a query is checked against, so words that match nothing can be left out (step 4 above).
let corpus: MapFind[] = [];
const compiled = new Map<string, { words: string[][]; used: string[]; ignored: string[]; money: boolean }>();
export function setSearchCorpus(finds: MapFind[]) {
  if (finds === corpus) return;
  corpus = finds;
  compiled.clear();
}

function compile(query: string) {
  let c = compiled.get(query);
  if (c) return c;
  const used: string[] = [];
  const ignored: string[] = [];
  const words: string[][] = [];
  for (const w of [...new Set(queryWords(query))]) {
    const alts = alternatives(w);
    if (corpus.length && !corpus.some((f) => hits(haystack(f), alts))) ignored.push(w);
    else { used.push(w); words.push(alts); }
  }
  // Step 5: no find matches every word. If some words are ours (type, place, topic), first try them alone; otherwise
  // leave out the loosest word whose removal matches the most finds, one at a time.
  const count = (ws: string[][]) => corpus.filter((f) => { const h = haystack(f); return ws.every((alts) => hits(h, alts)); }).length;
  const isLoose = (w: string) => !known.has(w) && !known.has(singular(w));
  if (corpus.length && words.length > 1 && count(words) === 0) {
    const strong = used.map((w, i) => i).filter((i) => !isLoose(used[i]));
    if (strong.length && strong.length < used.length && count(strong.map((i) => words[i])) > 0) {
      for (let i = used.length - 1; i >= 0; i--) if (isLoose(used[i])) { ignored.push(used[i]); used.splice(i, 1); words.splice(i, 1); }
      ignored.reverse();
    }
  }
  while (corpus.length && words.length > 1 && count(words) === 0) {
    const loose = used.map((w, i) => i).filter((i) => isLoose(used[i]));
    const pool = loose.length ? loose : used.map((w, i) => i);
    let drop = pool[0];
    let most = -1;
    for (const i of pool) {
      const n = count(words.filter((_, j) => j !== i));
      if (n > most) { most = n; drop = i; }
    }
    ignored.push(used[drop]);
    used.splice(drop, 1);
    words.splice(drop, 1);
  }
  c = { words, used, ignored, money: words.some((alts) => alts.includes('money')) };
  if (compiled.size > 50) compiled.clear();
  compiled.set(query, c);
  return c;
}

/** How a query was read, for the line under the list: the words searched for, the words left out, and whether it asks about money. */
export function describeSearch(query: string) {
  const { used, ignored, money } = compile(query);
  return { used, ignored, money };
}

/**
 * How well a matching find fits, for ordering: 3 every word is in the title, 2.5 every word names the find's type
 * ("guns" and a weapon), 2 every word is in the find's own text (title, place, finder, creators), 1 the match needed
 * one of our synonyms. So "bigfoot" lists the Skunk Ape first, then the other paranormal finds. Money questions add
 * ten times the log of the find's biggest dollar amount, so the biggest payout comes first.
 */
export function searchRank(f: MapFind, query: string) {
  const { words, money } = compile(query);
  if (!words.length) return 0;
  // Money questions: the biggest dollar amount first, whatever the tier; finds that only say "cash" or "loot" follow.
  const bonus = money ? 10 * Math.log10(1 + moneyAmount(f)) : 0;
  const title = ` ${normalise(f.title).replace(/'/g, '')} `;
  if (words.every((alts) => hits(title, alts))) return 3 + bonus;
  const own = ` ${normalise([f.title, f.summary, f.where ?? '', f.area ?? '', f.regionLabel, f.categoryLabel, f.finder?.handle ?? '', f.clip?.creator ?? '', ...f.sources.map((s) => s.creator ?? '')].join(' ')).replace(/['@]/g, '')} `;
  const type = ` ${normalise([f.categoryLabel, f.category.replace(/-/g, ' '), ...(catTerms[f.category] ?? [])].join(' '))} `;
  if (words.every((alts) => hits(type, alts))) return 2.5 + bonus;
  return (words.every((alts) => hits(own, alts)) ? 2 : 1) + bonus;
}

/**
 * Does a find match the search? An empty query (or one made only of filler words) matches everything; a query whose
 * every word was left out (none of them is in any find) matches nothing.
 */
export function matchesSearch(f: MapFind, query: string) {
  if (!queryWords(query).length) return true;
  const { words } = compile(query);
  if (!words.length) return false;
  const h = haystack(f);
  return words.every((alts) => hits(h, alts));
}
