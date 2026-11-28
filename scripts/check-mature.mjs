// Checks the built site (dist/) for mature finds' own words outside their own page (owner decision, 27 Nov 2026;
// LR83). Run after pnpm build (the build runs it): node scripts/check-mature.mjs
// - a mature find's title appears only on its own page, and there only in the <title>, the og:title, twitter:title
//   and og:image:alt tags (the share title), the <h1> (the heading) and the "name" fields of its JSON-LD
// - a mature find's summary appears only in the body of its own page: never in its <head> (meta description, Open
//   Graph and Twitter descriptions, JSON-LD) and never in any other built file (pages, feeds, data, scripts)
// Every text file is read, entities and JSON escapes decoded, and compared word by word, case and punctuation aside,
// so "sex-robot" matches "sex robot" and "&#39;" matches "'". A summary leaks when any run of five of its words shows.
// Slugs (URLs, data-found) are out of scope: a slug never holds the title's first word here, so it never matches.
// Exit code 1 on any leak. The test (scripts/test/mature.test.ts) runs findLeaks on made-up pages and on dist.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.pdf', '.br', '.gz']);
const RUN = 5;

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
/**
 * Lower case words only: entities and \uXXXX escapes decoded, every run of other characters one space. Each tag edge
 * ("<" or ">") becomes a word no text holds, so words either side of a tag never read as one run ("kill you</a>").
 */
export const words = (s) => ` ${s
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/g, (m, n) => entities[n] ?? m)
  .replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/[<>]/g, ' qqtagqq ')
  .replace(/[\u2018\u2019]/g, "'")
  .toLowerCase()
  .replace(/'/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()} `;

/** Every run of RUN words of a summary (the whole summary when it is shorter). */
const runs = (summary) => {
  const w = words(summary).trim().split(' ');
  if (w.length <= RUN) return [` ${w.join(' ')} `];
  return Array.from({ length: w.length - RUN + 1 }, (_, i) => ` ${w.slice(i, i + RUN).join(' ')} `);
};

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A find's own page, with the places its title may stand cut out: the share and tab tags, the heading, JSON-LD names. */
const withoutAllowedTitle = (html, title) => {
  const tj = escRe(JSON.stringify(title).slice(1, -1));
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta (?:property|name)="(?:og:title|twitter:title|og:image:alt)" content="[^"]*">/g, '')
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, '')
    .replace(new RegExp(`"name":"${tj}"`, 'g'), '');
};

/**
 * The leaks in a set of built files. `files` is [{ path, text }] with paths relative to dist; `finds` the mature
 * finds as { slug, title, summary }. Returns [{ path, slug, what }].
 */
export function findLeaks(files, finds) {
  const out = [];
  for (const f of finds) {
    const title = words(f.title);
    const summary = runs(f.summary);
    const own = new Set([`finds/${f.slug}.html`, `finds/${f.slug}/index.html`]);
    for (const { path, text } of files) {
      if (own.has(path)) {
        const head = text.split(/<\/head>/i)[0];
        // The summary may hold the title ("The rideshare app logo is ..."): the body's summary is allowed, so it is cut too.
        const rest = words(withoutAllowedTitle(text, f.title)).split(words(f.summary).trimEnd()).join(' ');
        if (rest.includes(title)) out.push({ path, slug: f.slug, what: 'title outside the heading, tab and share title' });
        const h = words(head);
        if (summary.some((r) => h.includes(r))) out.push({ path, slug: f.slug, what: 'summary in the page head (meta, social or JSON-LD)' });
        continue;
      }
      const w = words(text);
      if (w.includes(title)) out.push({ path, slug: f.slug, what: 'title' });
      if (summary.some((r) => w.includes(r))) out.push({ path, slug: f.slug, what: 'summary' });
    }
  }
  return out;
}

/** Every text file under dist as { path, text }. */
export const readDist = (dist = join(root, 'dist')) => {
  const out = [];
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (!BINARY.has(extname(n).toLowerCase())) out.push({ path: relative(dist, p).split('\\').join('/'), text: readFileSync(p, 'utf8') });
    }
  };
  walk(dist);
  return out;
};

/** The published mature finds in content/finds.json. */
export const matureFinds = () =>
  JSON.parse(readFileSync(join(root, 'content/finds.json'), 'utf8')).filter((f) => f.status === 'published' && f.mature);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) { console.log('Mature check: no build in dist/; run pnpm build first.'); process.exit(1); }
  const files = readDist(dist);
  const finds = matureFinds();
  const leaks = findLeaks(files, finds);
  console.log(`Mature check: ${finds.length} mature finds, ${files.length} text files in dist`);
  if (leaks.length) {
    console.log(`\n${leaks.length} leak(s):`);
    for (const l of leaks.slice(0, 50)) console.log(`  fail ${l.path}: ${l.slug} ${l.what}`);
    process.exit(1);
  }
  console.log('OK: no mature title or summary outside its own page.');
}
