// Mature finds keep their own words on their own page (owner decision, 27 Nov 2026; LR83). Run: pnpm test.
// The helpers every surface reads (src/lib/map-fields.ts), the leak check the build runs (scripts/check-mature.mjs)
// on made-up pages, and the same check on the real content and the last build in dist/ when there is one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { publicTitle, publicSummary, pageDescription, searchFields, MATURE_GATE } from '../../src/lib/map-fields.ts';
import { findLeaks, readDist, matureFinds, words } from '../check-mature.mjs';
import type { Find } from '../../src/lib/content.ts';

const real = matureFinds() as Find[];
const fake = { slug: 'neon-lounge', title: 'The neon velvet lounge', summary: "A back room behind the bar shows things we would rather not describe on a card, as Marcy's sign warns.", mature: true, category: 'secret-location', region_ids: [] as string[] };
const page = (head: string, body: string) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const ownHead = (f: typeof fake, desc: string) =>
  `<title>${f.title} | The Vice Files</title><meta name="description" content="${desc}"><meta property="og:title" content="${f.title}"><meta property="og:image:alt" content="${f.title}, on a The Vice Files card"><meta name="twitter:title" content="${f.title}"><script type="application/ld+json">${JSON.stringify({ '@type': 'ItemPage', name: f.title, description: desc })}</script>`;
const ownBody = (f: typeof fake) => `<h1 class="find__title">${f.title}</h1><p class="find__synopsis">${f.summary.replace(/'/g, '&#39;')}</p>`;

test('the content still has mature finds to guard', () => {
  assert.ok(real.length >= 2, 'two mature finds today (sex-robot-warehouse, rideshare-app-logo)');
});

test('outside its own page a mature find reads "Mature find: <type>" and the gate line', () => {
  assert.equal(publicTitle(fake as Find), 'Mature find: Secret location');
  assert.equal(publicSummary(fake as Find), MATURE_GATE);
  assert.equal(MATURE_GATE, 'Mature content: open the find to read it.');
  assert.equal(pageDescription(fake as Find), `Secret location in Leonida. ${MATURE_GATE}`);
  const safe = { ...fake, mature: false } as Find;
  assert.equal(publicTitle(safe), safe.title);
  assert.equal(publicSummary(safe), safe.summary);
  assert.equal(pageDescription(safe), safe.summary);
  const labels = Object.fromEntries(real.map((f) => [f.slug, publicTitle(f)]));
  assert.equal(labels['sex-robot-warehouse'], 'Mature find: Secret location');
  assert.equal(labels['rideshare-app-logo'], 'Mature find: Easter egg');
});

test('the map and search data of every real mature find hold neither its title nor its summary', () => {
  const files = real.map((f) => ({ path: 'map.html', text: JSON.stringify(searchFields(f)) }));
  assert.deepEqual(findLeaks(files, real), []);
});

test('leak check: the find\'s own page may hold its title in the heading, tab and share title, and its summary in the body', () => {
  const ok = page(ownHead(fake, pageDescription(fake as Find)), ownBody(fake));
  assert.deepEqual(findLeaks([{ path: `finds/${fake.slug}.html`, text: ok }], [fake]), []);
});

test('leak check: the summary in the own page\'s meta or JSON-LD is caught', () => {
  const bad = page(ownHead(fake, fake.summary), ownBody(fake));
  assert.deepEqual(findLeaks([{ path: `finds/${fake.slug}.html`, text: bad }], [fake]).map((l) => l.what), ['summary in the page head (meta, social or JSON-LD)']);
});

test('leak check: the title in the own page\'s body outside the heading is caught', () => {
  const bad = page(ownHead(fake, MATURE_GATE), `${ownBody(fake)}<button aria-label="Found it: ${fake.title}"></button>`);
  assert.deepEqual(findLeaks([{ path: `finds/${fake.slug}.html`, text: bad }], [fake]).map((l) => l.what), ['title outside the heading, tab and share title']);
});

test('leak check: a title or summary anywhere else is caught, however it is written', () => {
  const cases = [
    ['finds/other.html', `<a class="card" href="/finds/${fake.slug}"><span class="card__title">${fake.title}</span></a>`, 'title'],
    ['rss.xml', `<title>${fake.title.replace(/ /g, '&#32;')}</title>`, 'title'],
    ['data/finds.json', JSON.stringify({ title: fake.title.replace('neon', '\\u006eeon') }), 'title'],
    ['llms.txt', `- [x](/finds/x): ${fake.summary.slice(30, 80)}`, 'summary'],
    ['_astro/map.js', `{"summary":"Marcy\\u2019s sign warns."} ${fake.summary.toUpperCase()}`, 'summary'],
  ] as const;
  for (const [path, text, what] of cases) assert.deepEqual(findLeaks([{ path, text }], [fake]).map((l) => l.what), [what], path);
});

test('leak check: the masked label, the gate line and the slug are not leaks', () => {
  const text = `<a href="/finds/${fake.slug}" data-found="${fake.slug}"><span>${publicTitle(fake as Find)}</span><p>${MATURE_GATE}</p></a>`;
  assert.deepEqual(findLeaks([{ path: 'finds.html', text }], [fake]), []);
  // Words either side of a tag never join into one run of the summary.
  assert.ok(!words('<a>behind the bar</a><b>shows things</b>').includes(' bar shows '));
});

test('the built site (dist/) has no mature title or summary outside its own page', (t) => {
  if (!existsSync(new URL('../../dist/index.html', import.meta.url))) { t.skip('no build in dist/: run pnpm build'); return; }
  const files = readDist();
  assert.ok(files.length > 200, 'dist holds the whole site');
  assert.deepEqual(findLeaks(files, real), []);
});
