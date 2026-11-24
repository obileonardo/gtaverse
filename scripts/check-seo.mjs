// Checks the built site (dist/) for the launch SEO rules. Run after pnpm build: pnpm seo:check
// - every page: one canonical (except the 404), one og:title, og:image pointing at a card that exists, a Twitter card,
//   and the favicon, touch icon and manifest links, each pointing at a file that was built
// - the robots meta, the X-Robots-Tag header and robots.txt all match the switch (site.indexable in src/lib/site.ts)
// - JSON-LD parses, uses schema.org, and each type carries the properties we rely on
// - sitemap.xml lists exactly the pages that were built (less the 404, the PRD and the /design review pages)
// Exit code 1 on any failure.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const fails = [];
const fail = (where, msg) => fails.push(`${where}: ${msg}`);

const siteSrc = readFileSync(join(root, 'src/lib/site.ts'), 'utf8');
const indexable = /indexable:\s*true/.test(siteSrc);
const origin = siteSrc.match(/url:\s*'([^']+)'/)[1];

const walk = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.html')) out.push(p);
  }
  return out;
};
// The PRD and the design system (/design and its review pages /design/...) are never for search: noindex, no card,
// not in the sitemap.
const isDesign = (p) => relative(dist, p) === 'design.html' || relative(dist, p).startsWith('design/');
const pages = walk(dist).filter((p) => !p.endsWith('/prd.html') && !isDesign(p));
const pathOf = (file) => '/' + relative(dist, file).replace(/\.html$/, '').replace(/(^|\/)index$/, '');
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

// Properties each JSON-LD type must carry (what search engines need and what we promise).
const REQUIRED = {
  WebSite: ['name', 'url', 'potentialAction'],
  Organization: ['name', 'url', 'logo', 'publishingPrinciples', 'correctionsPolicy'],
  BreadcrumbList: ['itemListElement'],
  ItemPage: ['name', 'url', 'description', 'isPartOf', 'citation'],
  Article: ['headline', 'url', 'author', 'publisher', 'dateModified', 'image'],
  CollectionPage: ['name', 'url', 'mainEntity'],
  WebPage: ['name', 'url'],
  AboutPage: ['name', 'url'],
  ContactPage: ['name', 'url'],
};
const typeCount = {};
const builtPaths = new Set();

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const path = pathOf(file);
  const where = path;
  const is404 = path === '/404';
  if (!is404) builtPaths.add(path);

  const robots = all(html, /<meta name="robots" content="([^"]*)"/g);
  if (robots.length !== 1) fail(where, `expected one robots meta, found ${robots.length}`);
  else if (!indexable && !robots[0].includes('noindex')) fail(where, 'robots meta lacks noindex while site.indexable is false');
  else if (indexable && !is404 && robots[0].includes('noindex')) fail(where, 'robots meta has noindex while site.indexable is true');

  const canon = all(html, /<link rel="canonical" href="([^"]*)"/g);
  if (is404) { if (canon.length) fail(where, '404 must not have a canonical'); }
  else if (canon.length !== 1) fail(where, `expected one canonical, found ${canon.length}`);
  else if (canon[0] !== origin + (path === '/' ? '/' : path)) fail(where, `canonical ${canon[0]} does not match the page path`);

  const ogTitle = all(html, /<meta property="og:title" content="([^"]*)"/g);
  if (ogTitle.length !== 1) fail(where, `expected one og:title, found ${ogTitle.length}`);
  const ogImage = all(html, /<meta property="og:image" content="([^"]*)"/g);
  if (ogImage.length !== 1) fail(where, `expected one og:image, found ${ogImage.length}`);
  else {
    const local = join(dist, new URL(ogImage[0]).pathname);
    if (!existsSync(local)) fail(where, `og:image ${ogImage[0]} was not built`);
    else if (!is404 && !ogImage[0].endsWith(path === '/' ? '/og/index.png' : `/og${path}.png`)) fail(where, `og:image ${ogImage[0]} is not this page's own card`);
  }
  if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) fail(where, 'missing twitter:card');

  // Favicons (LG6): each page links the SVG favicon, the PNG fallback, the touch icon and the manifest, and each exists.
  for (const rel of ['icon', 'apple-touch-icon', 'manifest']) {
    const hrefs = all(html, new RegExp(`<link rel="${rel}" href="([^"]*)"`, 'g'));
    if (!hrefs.length) fail(where, `missing <link rel="${rel}">`);
    for (const h of hrefs) if (!existsSync(join(dist, h))) fail(where, `${rel} ${h} is not in dist`);
  }
  if (/i\.ytimg\.com|rockstargames\.com/.test(ogImage[0] ?? '')) fail(where, 'og:image must be our own card');

  for (const raw of all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o;
    try { o = JSON.parse(raw); } catch (e) { fail(where, `JSON-LD does not parse: ${e.message}`); continue; }
    if (o['@context'] !== 'https://schema.org') fail(where, `JSON-LD @context is ${o['@context']}`);
    const t = o['@type'];
    typeCount[t] = (typeCount[t] ?? 0) + 1;
    if (!REQUIRED[t]) { fail(where, `unexpected JSON-LD type ${t}`); continue; }
    for (const k of REQUIRED[t]) if (o[k] === undefined || o[k] === null || o[k] === '') fail(where, `${t} is missing ${k}`);
    if (t === 'BreadcrumbList') {
      o.itemListElement.forEach((li, i) => {
        if (li['@type'] !== 'ListItem' || li.position !== i + 1 || !li.name || !String(li.item).startsWith(origin)) fail(where, `BreadcrumbList item ${i + 1} is malformed`);
      });
      if (o.itemListElement.at(-1)?.item !== canon[0]) fail(where, 'the last breadcrumb is not this page');
    }
    if (t === 'WebSite' && !String(o.potentialAction?.target?.urlTemplate).includes('{search_term_string}')) fail(where, 'SearchAction target lacks {search_term_string}');
    if (t === 'CollectionPage' && o.mainEntity?.numberOfItems !== o.mainEntity?.itemListElement?.length) fail(where, 'ItemList count does not match its items');
  }
}

// Page types that must carry their structured data.
const need = (prefix, type) => {
  for (const file of pages.filter((p) => pathOf(p).startsWith(prefix) && pathOf(p) !== prefix.replace(/\/$/, ''))) {
    if (!readFileSync(file, 'utf8').includes(`"@type":"${type}"`)) fail(pathOf(file), `expected ${type} JSON-LD`);
  }
};
need('/finds/', 'ItemPage');
need('/explainers/', 'Article');
need('/regions/', 'CollectionPage');
need('/categories/', 'CollectionPage');
const home = readFileSync(join(dist, 'index.html'), 'utf8');
for (const t of ['WebSite', 'Organization']) if (!home.includes(`"@type":"${t}"`)) fail('/', `home lacks ${t} JSON-LD`);

// Sitemap equals the built pages.
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const locs = new Set(all(sitemap, /<loc>([^<]*)<\/loc>/g).map((u) => new URL(u).pathname.replace(/\/$/, '') || '/'));
for (const p of builtPaths) if (!locs.has(p)) fail('sitemap.xml', `missing ${p}`);
for (const p of locs) if (!builtPaths.has(p)) fail('sitemap.xml', `lists ${p}, which was not built`);

// The switch reaches robots.txt and the headers.
const robotsTxt = readFileSync(join(dist, 'robots.txt'), 'utf8');
const headers = readFileSync(join(dist, '_headers'), 'utf8');
const pageBlock = headers.split(/\n(?=\S)/).find((b) => /^\/\*\s*\n/.test(b)) ?? '';
if (!indexable) {
  if (!/^Disallow: \/$/m.test(robotsTxt)) fail('robots.txt', 'must disallow everything while site.indexable is false');
  if (/^Sitemap:/m.test(robotsTxt)) fail('robots.txt', 'must not advertise the sitemap while site.indexable is false');
  if (!/X-Robots-Tag: noindex/.test(pageBlock)) fail('_headers', 'the /* block lacks X-Robots-Tag noindex while site.indexable is false');
} else {
  if (/^Disallow: \/$/m.test(robotsTxt)) fail('robots.txt', 'disallows everything while site.indexable is true');
  if (!/^Sitemap: /m.test(robotsTxt)) fail('robots.txt', 'no Sitemap line while site.indexable is true');
  if (/X-Robots-Tag/.test(pageBlock)) fail('_headers', 'the /* block still has X-Robots-Tag while site.indexable is true');
}
if (!/^\/prd\n\s+X-Robots-Tag: noindex/m.test(headers)) fail('_headers', '/prd must always be noindex');
if (!/^\/design\n\s+X-Robots-Tag: noindex/m.test(headers)) fail('_headers', '/design must always be noindex');
if (!/^\/design\/\*\n\s+X-Robots-Tag: noindex/m.test(headers)) fail('_headers', '/design/* must always be noindex');

console.log(`SEO check: ${pages.length} pages, site.indexable = ${indexable}`);
console.log(`  JSON-LD types: ${Object.entries(typeCount).map(([t, n]) => `${t} ${n}`).join(', ')}`);
console.log(`  sitemap: ${locs.size} URLs; built pages (less 404 and PRD): ${builtPaths.size}`);
if (fails.length) {
  console.log(`\n${fails.length} failure(s):`);
  for (const f of fails.slice(0, 50)) console.log(`  fail ${f}`);
  process.exit(1);
}
console.log('OK: every page has its canonical, Open Graph, Twitter and JSON-LD data, and the index switch is consistent.');
