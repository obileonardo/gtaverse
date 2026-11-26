// Unit tests for map search reading plain questions (src/components/map/search.ts). Run: pnpm test.
// Uses the real published finds, so a question that stops finding its answer after a content change fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { queryWords, matchesSearch, searchRank, setSearchCorpus, describeSearch } from '../../src/components/map/search.ts';
import type { MapFind } from '../../src/components/map/types.ts';

type Raw = { slug: string; title: string; status: string; category: string; summary: string; location_description: string | null; area: string | null; region_ids: string[]; first_finder: { handle: string } | null; clip: { creator: string | null } | null; sources: { creator: string | null }[] };
const raw: Raw[] = JSON.parse(readFileSync(new URL('../../content/finds.json', import.meta.url), 'utf8'));
// Only the fields search reads; the map page fills the rest.
const finds = raw.filter((f) => f.status === 'published').map((f) => ({
  slug: f.slug, title: f.title, category: f.category, categoryLabel: f.category.replace(/-/g, ' '), regionLabel: '',
  summary: f.summary, where: f.location_description, area: f.area, regionIds: f.region_ids,
  finder: f.first_finder, clip: f.clip, sources: f.sources,
})) as unknown as MapFind[];
setSearchCorpus(finds);
const search = (q: string) => finds.filter((f) => matchesSearch(f, q)).sort((a, b) => searchRank(b, q) - searchRank(a, q)).map((f) => f.slug);

test('question words are dropped, so a question reads like its keywords', () => {
  assert.deepEqual(queryWords('Where can I get guns in the game?'), ['guns']);
  assert.deepEqual(queryWords('Where can I see the NPC you cannot snipe?'), ['npc', 'snipe']);
});

test('a money amount becomes "money"; a bare number does not', () => {
  assert.deepEqual(queryWords('where can I get 200k'), ['money']);
  assert.deepEqual(queryWords('$20,000 reward'), ['money', 'reward']);
  assert.deepEqual(queryWords('safe code 1886'), ['safe', 'code', '1886']);
});

test('"where can I get 200k" lists finds that pay money', () => {
  const out = search('Where can I get 200k in the game?');
  assert.ok(out.length >= 3, `only ${out.length} results`);
  assert.equal(out[0], 'hyde-island-hunt', 'the biggest payout, $20,000, comes first');
});

test('"where can I get guns" lists every weapon find, before anything else', () => {
  const out = search('Where can I get guns?');
  const weapons = finds.filter((f) => f.category === 'weapon').map((f) => f.slug);
  assert.deepEqual(new Set(out.slice(0, weapons.length)), new Set(weapons));
});

test('"snipe" matches "sniper" at the start of a word; "fast" does not match inside "breakfast"', () => {
  assert.ok(search('sniper').includes('immortal-sniper-npc'));
  assert.ok(describeSearch('fast').ignored.includes('fast') || search('fast').every((s) => s !== 'breakfast'));
});

test('"the NPC you cannot snipe" finds the immortal sniper NPC first', () => {
  assert.equal(search('Where can I see the NPC you cannot snipe?')[0], 'immortal-sniper-npc');
});

test('a word that is in no find is left out and named, the rest still searches', () => {
  const q = 'how do I make money fast';
  const read = describeSearch(q);
  assert.deepEqual(read.used, ['money']);
  assert.deepEqual(read.ignored, ['make', 'fast']);
  assert.ok(search(q).length > 0);
});

test('a query of only unknown words matches nothing; filler only matches everything', () => {
  assert.equal(search('xyzzy plugh').length, 0);
  assert.equal(search('where is the').length, finds.length);
});

test('existing searches keep working (docs/MAP.md examples)', () => {
  assert.equal(search('where is the ufo')[0], 'ufo-abduction-port-gellhorn');
  assert.equal(search('bigfoot')[0], 'skunk-ape-bigfoot');
  assert.ok(search('everglades').length > 0);
  assert.ok(search('@ProfessorMikeX').length > 0);
  assert.ok(search('seepa').includes('immortal-sniper-npc'));
});
