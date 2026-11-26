// Unit tests for the home page's example questions (content/search-terms.json, examples; src/lib/ask.ts, LR30).
// Each one is a link to /map?q=..., so each must list finds on the map as the map opens that link. This runs the same
// check the build runs (checkExamples): the map's own fields (src/lib/map-fields.ts, which src/pages/map.astro uses),
// its search and its filter with the default filters. The build leaves out an example that lists nothing; this test
// fails on it so it gets fixed. Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkExamples, exampleQuestions } from '../../src/lib/ask.ts';
import { searchFields } from '../../src/lib/map-fields.ts';
import { searchRank, moneyAmount, setSearchCorpus } from '../../src/components/map/search.ts';
import { defaultFilters, passes, type MapFind } from '../../src/components/map/types.ts';
import type { Find } from '../../src/lib/content.ts';

// The published finds, as src/lib/content.ts gives them to the site.
const finds = (JSON.parse(readFileSync(new URL('../../content/finds.json', import.meta.url), 'utf8')) as Find[]).filter((f) => f.status === 'published');
const schema = JSON.parse(readFileSync(new URL('../../schema/search-terms.schema.json', import.meta.url), 'utf8'));
const count = (q: string) => checkExamples(finds, [q])[0].count;

test('there are as many example questions as the schema asks for, and no repeats', () => {
  const qs = exampleQuestions();
  assert.ok(qs.length >= schema.properties.examples.minItems, `at least ${schema.properties.examples.minItems} examples`);
  assert.equal(new Set(qs).size, qs.length);
});

for (const q of exampleQuestions()) {
  test(`example "${q}" lists finds on the map`, () => {
    assert.ok(count(q) > 0, `"${q}" lists nothing on /map: reword it or remove it`);
  });
}

test('an example of filler words only counts as listing nothing (it would list the whole map)', () => {
  assert.equal(count('Where can I get it?'), 0);
  assert.equal(count('xyzzy plugh'), 0);
});

test('the check counts what the map lists: place words read through the map\'s parent regions and type labels', () => {
  // The map's fields give a find its parent regions and its type label, so these match what /map shows.
  assert.ok(count('Downtown') >= 7, `Downtown: ${count('Downtown')}`);
  assert.ok(count('Rare cars') >= 1, `Rare cars: ${count('Rare cars')}`);
});

test('"Where can I get 200k?" lists a find that pays money first', () => {
  const q = 'Where can I get 200k?';
  const mapFinds = finds.map(searchFields) as unknown as MapFind[];
  setSearchCorpus(mapFinds);
  const out = mapFinds.filter((f) => passes(f, defaultFilters, q)).sort((a, b) => searchRank(b, q) - searchRank(a, q));
  assert.ok(moneyAmount(out[0]) > 0, `${out[0]?.slug} names no dollar amount`);
});
