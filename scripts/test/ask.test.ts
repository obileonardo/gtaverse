// Unit tests for the home page's example questions (content/search-terms.json, examples; src/lib/ask.ts, LR30).
// Each one is a link to /map?q=..., so each must list finds on the map with its default filters (spoilers and mature
// hidden). The build leaves out an example that lists nothing; this test fails on it so it gets fixed. Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchesSearch, searchRank, setSearchCorpus, moneyAmount } from '../../src/components/map/search.ts';
import type { MapFind } from '../../src/components/map/types.ts';

type Raw = { slug: string; title: string; status: string; category: string; spoiler: boolean; mature: boolean; summary: string; location_description: string | null; area: string | null; region_ids: string[]; first_finder: { handle: string } | null; clip: { creator: string | null } | null; sources: { creator: string | null }[] };
const raw: Raw[] = JSON.parse(readFileSync(new URL('../../content/finds.json', import.meta.url), 'utf8'));
const terms: { examples?: string[] } = JSON.parse(readFileSync(new URL('../../content/search-terms.json', import.meta.url), 'utf8'));
// Only the fields search reads; the map page fills the rest.
const finds = raw.filter((f) => f.status === 'published').map((f) => ({
  slug: f.slug, title: f.title, category: f.category, categoryLabel: f.category.replace(/-/g, ' '), regionLabel: '',
  summary: f.summary, where: f.location_description, area: f.area, regionIds: f.region_ids,
  finder: f.first_finder, clip: f.clip, sources: f.sources, spoiler: f.spoiler, mature: f.mature,
})) as unknown as MapFind[];
setSearchCorpus(finds);
// What the map lists for a /map?q= link with its default filters: no spoilers, no mature finds, best match first.
const listed = (q: string) => finds.filter((f) => !f.spoiler && !f.mature && matchesSearch(f, q)).sort((a, b) => searchRank(b, q) - searchRank(a, q));

test('there are example questions to show', () => {
  assert.ok((terms.examples ?? []).length >= 3, 'at least three examples');
});

for (const q of terms.examples ?? []) {
  test(`example "${q}" lists finds on the map`, () => {
    assert.ok(listed(q).length > 0, `"${q}" lists nothing: reword it or remove it`);
  });
}

test('"Where can I get 200k?" lists the finds that pay money first', () => {
  const out = listed('Where can I get 200k?');
  assert.ok(moneyAmount(out[0]) > 0, `${out[0]?.slug} names no dollar amount`);
});
