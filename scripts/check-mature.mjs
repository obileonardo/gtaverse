// Checks the built site (dist/) for mature finds' own words and sources outside their own page (owner decisions,
// 27 Nov 2026; LR83, LR84). Run after pnpm build (the build runs it): node scripts/check-mature.mjs
// - a mature find's title appears only on its own page, and there only in the <title>, the og:title, twitter:title
//   and og:image:alt tags (the share title), the <h1> (the heading), the "name" fields of its JSON-LD and the clip's
//   own label ("Play clip: <title>", "View the photo on <platform>: <title>")
// - a mature find's summary appears only in the body of its own page: never in its <head> (meta description, Open
//   Graph and Twitter descriptions, JSON-LD) and never in any other built file (pages, feeds, data, scripts)
// - a mature find's source URLs appear only on its own page (its clip and first finder links are not sources here)
// Every text file is read with entities, JSON, JavaScript and percent escapes decoded, soft hyphens and zero-width
// characters removed and inline tags (em, span, a...) dropped, then compared word by word, case and punctuation
// aside, so "sex-robot" matches "sex robot", "&#39;" matches "'" and "Killer <em>sex</em>" matches "Killer sex".
// The title is matched whole, always. A summary leaks when a run of five of its words shows that the site's content
// (content/, this find's own title, summary and sources left out) holds nowhere else, so a phrase it shares with
// another find or a connection is no alarm; a summary with no such run fails, since it cannot be guarded. A source
// URL is guarded the same way: one that other content also cites (a wiki page many finds share) is not checked.
// Slugs (URLs, data-found) are out of scope: a slug never holds the title's first word here, so it never matches.
// Exit code 1 on any leak. The test (scripts/test/mature.test.ts) runs findLeaks on made-up pages and on dist.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.pdf', '.br', '.gz']);
const RUN = 5;

const entities = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '\u00ad', zwsp: '', zwnj: '', zwj: '', lsquo: "'", rsquo: "'",
  ldquo: '"', rdquo: '"', ndash: '-', mdash: '-', hellip: '...', hyphen: '-', dash: '-', sbquo: "'", bdquo: '"',
};
/** Inline elements: a tag of one of these inside a text run joins the words either side, as the page shows them. */
const INLINE = /<\/?(?:a|abbr|b|bdi|bdo|cite|code|data|del|dfn|em|font|i|ins|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var|wbr)(?:\s[^<>]*)?\/?>/gi;
/** Soft hyphen, zero-width and other invisible characters a word can hide behind. */
const INVISIBLE = /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b-\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\ufeff]/g;
const code = (n) => { try { return String.fromCodePoint(n); } catch { return ''; } };
const decode = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => code(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => code(Number(d)))
  .replace(/&([a-zA-Z]+);/g, (m, n) => entities[n.toLowerCase()] ?? m)
  .replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

/**
 * Lower case words only. Escapes decoded (\uXXXX, \u{X}, \xXX, \/, HTML entities and percent escapes, twice, so a
 * double-encoded copy reads too), invisible characters removed, inline tags dropped from the text (their attributes
 * read apart), every run of other characters one space. Any other tag edge ("<" or ">") becomes a word no text holds, so words either side of a block tag never
 * read as one run ("kill you</li><li>Next").
 */
export const words = (s) => {
  let t = s
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => code(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\\//g, '/');
  t = decode(decode(t)).replace(INVISIBLE, '');
  // An inline tag leaves the text; its attributes (href, aria-label...) are still read, each set on its own at the end.
  const attrs = [];
  t = t.replace(INLINE, (m) => {
    const a = m.replace(/^<\/?[a-z]+/i, '').replace(/\/?>$/, '');
    if (a.trim()) attrs.push(` < ${a} > `);
    return '';
  });
  return ` ${(t + attrs.join(''))
    .replace(/[<>]/g, ' qqtagqq ')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;
};

/** Every run of RUN words of a summary (the whole summary when it is shorter). */
const runs = (summary) => {
  const w = words(summary).trim().split(' ');
  if (w.length <= RUN) return [` ${w.join(' ')} `];
  return Array.from({ length: w.length - RUN + 1 }, (_, i) => ` ${w.slice(i, i + RUN).join(' ')} `);
};

/** A URL as words, scheme and "www." left out, so an escaped or encoded copy still matches. */
const urlWords = (url) => words(url.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, ''));

/**
 * A find's own page, with the places its title may stand cut out: the share and tab tags, the heading, the JSON-LD
 * names and the clip's own label. The JSON-LD names are cut only inside JSON-LD, and a label only when it holds
 * exactly the title.
 */
const withoutAllowedTitle = (html, title) => {
  const t = words(title);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta (?:property|name)="(?:og:title|twitter:title|og:image:alt)" content="[^"]*">/g, '')
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, '')
    .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, a, json, b) =>
      a + json.replace(/"name":"((?:[^"\\]|\\.)*)"/g, (m, v) => (words(v) === t ? '' : m)) + b)
    .replace(/aria-label="(?:Play clip|View the photo on [^":]+): ([^"]*)"/g, (m, v) => (words(v) === t ? '' : m));
};

/**
 * The leaks in a set of built files. `files` is [{ path, text }] with paths relative to dist; `finds` the mature
 * finds as { slug, title, summary, sources?, clip?, first_finder? }. `common(find)` returns, as words(), the text the
 * site's content holds besides that find's own title, summary and sources (commonText); a summary run or source URL
 * found there is not checked. Without it every run and URL is checked. Returns [{ path, slug, what }].
 */
export function findLeaks(files, finds, { common = () => ' ' } = {}) {
  const out = [];
  const read = files.map(({ path, text }) => ({ path, text, w: words(text) }));
  for (const f of finds) {
    const title = words(f.title);
    const shared = common(f);
    const all = runs(f.summary);
    const summary = all.filter((r) => !shared.includes(r));
    if (!summary.length) out.push({ path: 'content/finds.json', slug: f.slug, what: 'summary has no five-word run of its own, so it cannot be guarded' });
    const skip = new Set([f.clip?.url, f.first_finder?.url].filter(Boolean));
    const urls = (f.sources ?? []).filter((s) => s.url && !skip.has(s.url)).map((s) => urlWords(s.url)).filter((u) => u.trim() && !shared.includes(u));
    const own = new Set([`finds/${f.slug}.html`, `finds/${f.slug}/index.html`]);
    for (const { path, text, w } of read) {
      if (own.has(path)) {
        const head = text.split(/<\/head>/i)[0];
        // The summary may hold the title ("The rideshare app logo is ..."): the body's summary is allowed, so it is cut too.
        const rest = words(withoutAllowedTitle(text, f.title)).split(words(f.summary).trimEnd()).join(' ');
        if (rest.includes(title)) out.push({ path, slug: f.slug, what: 'title outside the heading, tab, share title and clip label' });
        const h = words(head);
        if (summary.some((r) => h.includes(r))) out.push({ path, slug: f.slug, what: 'summary in the page head (meta, social or JSON-LD)' });
        continue;
      }
      if (w.includes(title)) out.push({ path, slug: f.slug, what: 'title' });
      if (summary.some((r) => w.includes(r))) out.push({ path, slug: f.slug, what: 'summary' });
      if (urls.some((u) => w.includes(u))) out.push({ path, slug: f.slug, what: 'source URL' });
    }
  }
  return out;
}

/**
 * The site's content as words, for findLeaks' `common`: every text file in content/, with the given find's own title,
 * summary and source URLs left out of content/finds.json. Only content counts, not src/: a template that copies a
 * mature find's words is a leak, never a reason to stop guarding them.
 */
export const commonText = (dir = join(root, 'content')) => {
  const others = [];
  let records = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (relative(dir, p) === 'finds.json') records = JSON.parse(readFileSync(p, 'utf8'));
      else if (!BINARY.has(extname(n).toLowerCase())) others.push(readFileSync(p, 'utf8'));
    }
  };
  walk(dir);
  const base = words(others.join('\n'));
  const cache = new Map();
  return (f) => {
    if (!cache.has(f.slug)) {
      const rest = records.map((r) => (r.slug !== f.slug ? r : { ...r, title: '', summary: '', sources: (r.sources ?? []).map((s) => ({ ...s, url: '' })) }));
      cache.set(f.slug, base + words(JSON.stringify(rest)));
    }
    return cache.get(f.slug);
  };
};

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
  const leaks = findLeaks(files, finds, { common: commonText() });
  console.log(`Mature check: ${finds.length} mature finds, ${files.length} text files in dist`);
  if (leaks.length) {
    console.log(`\n${leaks.length} leak(s):`);
    for (const l of leaks.slice(0, 50)) console.log(`  fail ${l.path}: ${l.slug} ${l.what}`);
    process.exit(1);
  }
  console.log('OK: no mature title, summary or source outside its own page.');
}
