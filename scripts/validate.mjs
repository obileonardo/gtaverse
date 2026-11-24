// Validates everything in content/ against schema/ and the editorial rules in
// docs/CONTENT-GUIDE.md. Run with: pnpm validate
// Exit code 0 when clean, 1 when any error is found. Warnings never fail the run.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const readText = (p) => readFileSync(join(root, p), 'utf8');
function readJson(p) {
  try {
    return JSON.parse(readText(p));
  } catch (e) {
    err(p, `invalid JSON (${e.message})`);
    return null;
  }
}

// ---------------------------------------------------------------- schemas
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat('date', {
  type: 'string',
  validate: (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().startsWith(s),
});
ajv.addFormat('uri', {
  type: 'string',
  validate: (s) => {
    try {
      const u = new URL(s);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  },
});

const compiled = new Map();
function check(schemaFile, data, where) {
  if (data === null) return;
  if (!compiled.has(schemaFile)) compiled.set(schemaFile, ajv.compile(JSON.parse(readText(`schema/${schemaFile}`))));
  const validate = compiled.get(schemaFile);
  if (!validate(data)) {
    for (const e of validate.errors) err(where, `schema ${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ' ' + JSON.stringify(e.params.allowedValues) : ''}`);
  }
}

const finds = readJson('content/finds.json');
const connDoc = readJson('content/connections.json');
const regions = readJson('content/regions.json');
const categories = readJson('content/categories.json');
const sources = readJson('content/sources.json');
const map = readJson('content/map.json');
const collectibles = readJson('content/collectibles.json');

check('finds.schema.json', finds, 'content/finds.json');
check('collectibles.schema.json', collectibles, 'content/collectibles.json');
check('map.schema.json', map, 'content/map.json');
check('connections.schema.json', connDoc, 'content/connections.json');
check('regions.schema.json', regions, 'content/regions.json');
check('categories.schema.json', categories, 'content/categories.json');
check('sources.schema.json', sources, 'content/sources.json');

// Map extras (docs/MAP.md, docs/MAP-3D.md): our search words and our hand-drawn relief.
const searchTerms = readJson('content/search-terms.json');
const relief = readJson('content/relief.json');
check('search-terms.schema.json', searchTerms, 'content/search-terms.json');
check('relief.schema.json', relief, 'content/relief.json');
if (searchTerms && categories && regions) {
  const catIds = new Set(categories.map((c) => c.id));
  const regIds = new Set(regions.map((r) => r.id));
  for (const id of Object.keys(searchTerms.categories ?? {})) if (!catIds.has(id)) err('content/search-terms.json', `unknown category "${id}"`);
  for (const id of Object.keys(searchTerms.regions ?? {})) if (!regIds.has(id)) err('content/search-terms.json', `unknown region "${id}"`);
}
if (relief?.features && map?.image) {
  const seen = new Set();
  for (const f of relief.features) {
    if (seen.has(f.id)) err('content/relief.json', `duplicate feature id "${f.id}"`);
    seen.add(f.id);
    for (const [x, y] of f.points) if (x >= map.image.width || y >= map.image.height) err('content/relief.json', `${f.id}: point ${x}, ${y} is outside the map image`);
  }
}

const connections = connDoc?.items ?? [];

// ---------------------------------------------------------------- explainers (frontmatter subset parser)
// Supported frontmatter: `key: value` scalars (strings, true, false, null) and
// one list of mappings (`sources:` then `  - url: ...` / `    title: ...`).
function parseScalar(v) {
  const t = v.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '') return null;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}
function parseFrontmatter(text, where) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) {
    err(where, 'missing frontmatter block (--- ... ---)');
    return { data: null, body: text, bodyStart: 1 };
  }
  const data = {};
  let listKey = null;
  let current = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    let mm;
    if ((mm = line.match(/^([a-z_]+):\s*(.*)$/))) {
      listKey = null;
      current = null;
      if (mm[2] === '') {
        listKey = mm[1];
        data[listKey] = [];
      } else data[mm[1]] = parseScalar(mm[2]);
    } else if (listKey && (mm = line.match(/^\s+-\s+([a-z_]+):\s*(.*)$/))) {
      current = { [mm[1]]: parseScalar(mm[2]) };
      data[listKey].push(current);
    } else if (listKey && current && (mm = line.match(/^\s{4,}([a-z_]+):\s*(.*)$/))) {
      current[mm[1]] = parseScalar(mm[2]);
    } else err(where, `unsupported frontmatter line: "${line}"`);
  }
  const bodyStart = m[1].split('\n').length + 3;
  return { data, body: m[2], bodyStart };
}

const explainerDir = 'content/explainers';
const explainers = [];
const crossRefs = [];
if (existsSync(join(root, explainerDir))) {
  for (const file of readdirSync(join(root, explainerDir)).filter((f) => f.endsWith('.md')).sort()) {
    const where = `${explainerDir}/${file}`;
    const { data, body, bodyStart } = parseFrontmatter(readText(where), where);
    if (!data) continue;
    check('explainer.schema.json', data, where);
    if (data.slug !== basename(file, '.md')) err(where, `slug "${data.slug}" does not match the file name`);
    const n = Array.isArray(data.sources) ? data.sources.length : 0;
    // Every claim line (paragraph, list item, table body row, blockquote) needs a [n] citation in range.
    // Exempt: headings, table header and separator rows, HTML comments (editor gaps),
    // and editorial lines starting with "Note:" (statements about our method, never game facts).
    let inTable = 0;
    const used = new Set();
    body.split('\n').forEach((line, i) => {
      const lineNo = bodyStart + i;
      const t = line.trim();
      if (t.startsWith('|')) inTable++;
      else inTable = 0;
      const isClaim = t && !t.startsWith('#') && !/^\|?\s*:?-{3,}/.test(t) && !(inTable === 1) && !t.startsWith('<!--') && !t.startsWith('Note:');
      const cites = [...t.matchAll(/\[(\d+)\]/g)].map((x) => Number(x[1]));
      for (const c of cites) {
        used.add(c);
        if (c < 1 || c > n) err(`${where}:${lineNo}`, `citation [${c}] has no matching source (sources: ${n})`);
      }
      if (isClaim && cites.length === 0) err(`${where}:${lineNo}`, `claim without a [n] citation: "${t.slice(0, 70)}"`);
      for (const [, kind, id] of t.matchAll(/\[\[(find|connection|region):([a-z0-9-]+)\]\]/g)) crossRefs.push({ where: `${where}:${lineNo}`, kind, id });
    });
    for (let k = 1; k <= n; k++) if (!used.has(k)) warn(where, `source [${k}] is listed but never cited`);
    explainers.push({ file: where, ...data });
  }
}

// ---------------------------------------------------------------- duplicates and slugs
function uniq(list, key, where) {
  const seen = new Set();
  for (const item of list ?? []) {
    const v = item?.[key];
    if (seen.has(v)) err(where, `duplicate ${key} "${v}"`);
    seen.add(v);
  }
  return seen;
}
const findIds = uniq(finds, 'id', 'content/finds.json');
uniq(finds, 'slug', 'content/finds.json');
const connIds = uniq(connections, 'id', 'content/connections.json');
uniq(connections, 'slug', 'content/connections.json');
const regionIds = uniq(regions, 'id', 'content/regions.json');
const catIds = uniq(categories, 'id', 'content/categories.json');
const sourceIds = uniq(sources, 'id', 'content/sources.json');
uniq(explainers, 'slug', 'content/explainers');
for (const e of explainers) if ((finds ?? []).some((f) => f.slug === e.slug)) err(e.file, `slug "${e.slug}" collides with a find slug`);

const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));
const catById = new Map((categories ?? []).map((c) => [c.id, c]));
const connById = new Map(connections.map((c) => [c.id, c]));
const regionById = new Map((regions ?? []).map((r) => [r.id, r]));
const blockedUrls = (sources ?? []).filter((s) => s.status === 'blocked' && s.url).map((s) => s.url);

// ---------------------------------------------------------------- map (content/map.json)
const frame = map?.grid?.frame;
const insideFrame = (p) => !frame || (p.x >= frame.x0 && p.x <= frame.x1 && p.y >= frame.y0 && p.y <= frame.y1);
if (map?.image && map?.grid) {
  const { width: mw, height: mh } = map.image;
  const g = map.grid;
  if (!(g.frame.x0 < g.frame.x1 && g.frame.x1 < mw && g.frame.y0 < g.frame.y1 && g.frame.y1 < mh)) err('content/map.json', 'grid frame must lie inside the image with x0 < x1 and y0 < y1');
  const chain = (bands, a, b, start, end, name) => {
    bands.forEach((band, i) => {
      if (band[a] >= band[b]) err('content/map.json', `grid ${name} ${band.id}: ${a} must be less than ${b}`);
      if (i > 0 && band[a] !== bands[i - 1][b]) err('content/map.json', `grid ${name} ${band.id} does not start where ${bands[i - 1].id} ends`);
    });
    if (bands[0]?.[a] !== start || bands.at(-1)?.[b] !== end) err('content/map.json', `grid ${name} must span the frame`);
  };
  chain(g.rows, 'y0', 'y1', g.frame.y0, g.frame.y1, 'row');
  chain(g.columns, 'x0', 'x1', g.frame.x0, g.frame.x1, 'column');
  uniq(g.rows, 'id', 'content/map.json grid rows');
  uniq(g.columns, 'id', 'content/map.json grid columns');
  uniq(map.labels, 'id', 'content/map.json labels');
  for (const l of map.labels ?? []) {
    const w = `map label ${l.id}`;
    if (l.x >= mw || l.y >= mh) err(w, `(${l.x}, ${l.y}) is outside the ${mw} x ${mh} map image`);
    if (l.region_id !== null && !regionIds.has(l.region_id)) err(w, `region_id "${l.region_id}" not in regions.json`);
  }
}

// ---------------------------------------------------------------- finds
for (const f of finds ?? []) {
  const w = `find ${f.id}`;
  if (f.slug !== f.id) warn(w, `slug "${f.slug}" differs from id`);
  const cat = catById.get(f.category);
  if (!cat) err(w, `category "${f.category}" not in categories.json`);
  else if (cat.kind !== 'find') err(w, `category "${f.category}" is a ${cat.kind}, not a find category`);
  if (!f.sources?.length) err(w, 'has no sources');
  for (const rid of f.region_ids ?? []) if (!regionIds.has(rid)) err(w, `region_id "${rid}" not in regions.json`);
  for (const cid of f.related_connections ?? []) {
    if (!connIds.has(cid)) err(w, `related_connection "${cid}" not in connections.json`);
    else if (!connById.get(cid).related_finds.includes(f.id)) err(w, `connection "${cid}" does not list this find in related_finds`);
  }
  for (const s of f.sources ?? []) {
    const reg = sourceById.get(s.source_id);
    if (!reg) err(w, `source_id "${s.source_id}" not in sources.json`);
    else if (reg.status === 'blocked') err(w, `cites blocked source "${s.source_id}"`);
    else if (reg.status === 'caution' && f.sources.length === 1) err(w, `only source is caution-listed "${s.source_id}"`);
    if (blockedUrls.some((u) => s.url.startsWith(u))) err(w, `source URL is on the blocked list: ${s.url}`);
  }
  const urls = (f.sources ?? []).map((s) => s.url);
  for (const u of urls.filter((u, i) => urls.indexOf(u) !== i)) err(w, `duplicate source URL ${u}`);
  if (f.clip) {
    const match = (f.sources ?? []).find((s) => s.url === f.clip.url);
    if (!match) err(w, 'clip URL is not one of the find sources');
    else if (!match.embeddable) err(w, 'clip source is not embeddable');
    if (!sourceIds.has(f.clip.source_id)) err(w, `clip source_id "${f.clip.source_id}" not in sources.json`);
  }
  if (f.added_at && f.updated_at && f.added_at > f.updated_at) err(w, `added_at ${f.added_at} is after updated_at ${f.updated_at}`);
  if (f.added_at && f.added_at > new Date().toISOString().slice(0, 10)) err(w, `added_at ${f.added_at} is in the future`);
  if (f.status === 'published' && (f.verification === 'rumor')) err(w, 'rumors must stay draft until a second independent source confirms them');
  if (f.spoiler && f.status === 'published' && f.clip) warn(w, 'spoiler find with a clip: the site must keep the embed behind the spoiler reveal');
  // pins: pixel space of content/map.json (docs/MAP.md)
  if (f.pin) {
    if (!f.pin_accuracy) err(w, 'pin is set but pin_accuracy is null');
    if (!f.pin_basis) err(w, 'pin is set but pin_basis is null');
    if (map?.image && (f.pin.x >= map.image.width || f.pin.y >= map.image.height)) err(w, `pin (${f.pin.x}, ${f.pin.y}) is outside the ${map.image.width} x ${map.image.height} map image`);
    else if (map?.grid && !insideFrame(f.pin)) warn(w, `pin (${f.pin.x}, ${f.pin.y}) is in the poster margin, outside the map frame`);
  } else if (f.pin_accuracy !== null || f.pin_basis !== null) err(w, 'pin_accuracy and pin_basis must be null while pin is null');
}

// ---------------------------------------------------------------- connections
for (const c of connections) {
  const w = `connection ${c.id}`;
  if (!c.sources?.length) err(w, 'has no sources');
  for (const fid of c.related_finds ?? []) {
    if (!findIds.has(fid)) err(w, `related_find "${fid}" not in finds.json`);
    else if (!finds.find((f) => f.id === fid).related_connections.includes(c.id)) err(w, `find "${fid}" does not list this connection`);
  }
  if (c.type === 'theory' && c.confidence === 'canon') err(w, 'a theory cannot be canon unless Rockstar confirmed it');
}

// ---------------------------------------------------------------- regions
const roots = (regions ?? []).filter((r) => r.parent === null);
if (regions && roots.length !== 1) err('content/regions.json', `expected exactly one root region (the state), found ${roots.length}`);
for (const r of regions ?? []) {
  const w = `region ${r.id}`;
  if (r.parent !== null && !regionIds.has(r.parent)) err(w, `parent "${r.parent}" not in regions.json`);
  if (r.parent === r.id) err(w, 'is its own parent');
  // cycle check
  const seen = new Set([r.id]);
  let p = r.parent;
  while (p) {
    if (seen.has(p)) {
      err(w, 'parent chain has a cycle');
      break;
    }
    seen.add(p);
    p = regionById.get(p)?.parent ?? null;
  }
  for (const fid of r.evidence_finds ?? []) if (!findIds.has(fid)) err(w, `evidence_find "${fid}" not in finds.json`);
  const expected = (finds ?? []).filter((f) => f.region_ids.includes(r.id)).map((f) => f.id).sort();
  const actual = [...(r.evidence_finds ?? [])].sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) err(w, `evidence_finds out of sync with finds.region_ids (expected ${JSON.stringify(expected)})`);
  if (!r.sources.length && !r.evidence_finds.length) err(w, 'needs at least one source URL or evidence find');
  if (r.vibe.length && !r.vibe_note) err(w, 'vibe tags need a vibe_note with the sourced wording');
}

// ---------------------------------------------------------------- explainer cross references [[kind:id]]
for (const r of crossRefs) {
  const ok = r.kind === 'find' ? findIds.has(r.id) : r.kind === 'connection' ? connIds.has(r.id) : regionIds.has(r.id);
  if (!ok) err(r.where, `[[${r.kind}:${r.id}]] does not resolve`);
}

// ---------------------------------------------------------------- categories
for (const c of categories ?? []) {
  if (c.reference_totals && !sourceIds.has(c.reference_totals.source_id)) err(`category ${c.id}`, `reference_totals.source_id "${c.reference_totals.source_id}" not in sources.json`);
  if (c.reference_totals && c.reference_totals.marked > c.reference_totals.total) err(`category ${c.id}`, 'marked is greater than total');
}

// ---------------------------------------------------------------- collectibles (content/collectibles.json, docs/MAP.md)
if (collectibles) {
  const where = 'content/collectibles.json';
  const layerIds = new Set();
  for (const l of collectibles.layers ?? []) {
    const cat = catById.get(l.layer);
    if (!cat) err(where, `layer "${l.layer}" not in categories.json`);
    else if (cat.kind !== 'map-layer') err(where, `layer "${l.layer}" is a ${cat.kind}, not a map-layer`);
    if (layerIds.has(l.layer)) err(where, `layer "${l.layer}" listed twice`);
    layerIds.add(l.layer);
    if (l.marked > l.total) err(where, `layer "${l.layer}": marked ${l.marked} is greater than total ${l.total}`);
    const its = (collectibles.items ?? []).filter((i) => i.layer === l.layer);
    if (its.length !== l.transcribed) err(where, `layer "${l.layer}": transcribed says ${l.transcribed}, items hold ${its.length}`);
    if (its.filter((i) => i.number === null).length !== l.numbers_unreadable) err(where, `layer "${l.layer}": numbers_unreadable does not match the items`);
    if (l.transcribed !== l.marked) warn(where, `layer "${l.layer}": ${l.transcribed} items for ${l.marked} marked on the source`);
    const ref = cat?.reference_totals;
    if (ref && (ref.marked !== l.marked || ref.total !== l.total)) err(where, `layer "${l.layer}": counts differ from categories.json reference_totals`);
  }
  const keys = new Set();
  for (const i of collectibles.items ?? []) {
    const w = `collectible ${i.id}`;
    if (!layerIds.has(i.layer)) err(w, `layer "${i.layer}" has no entry in layers`);
    if (i.number !== null) {
      const key = `${i.layer}#${i.number}`;
      if (keys.has(key)) err(w, `number ${i.number} is used twice in layer "${i.layer}"`);
      keys.add(key);
      const total = (collectibles.layers ?? []).find((l) => l.layer === i.layer)?.total;
      if (total && i.number > total) err(w, `number ${i.number} is above the layer total ${total}`);
    }
    if (map?.image && (i.pin.x >= map.image.width || i.pin.y >= map.image.height)) err(w, `pin (${i.pin.x}, ${i.pin.y}) is outside the ${map.image.width} x ${map.image.height} map image`);
    else if (map?.grid && !insideFrame(i.pin)) warn(w, `pin (${i.pin.x}, ${i.pin.y}) is in the poster margin, outside the map frame`);
    if (!i.source?.name?.trim() || !i.source?.url) err(w, 'needs a source credit (name and url)');
    if (blockedUrls.some((u) => i.source.url.startsWith(u))) err(w, `source URL is on the blocked list: ${i.source.url}`);
  }
  uniq(collectibles.items, 'id', where);
}

// ---------------------------------------------------------------- sources
for (const s of sources ?? []) {
  if (s.status === 'blocked' && s.url) err(`source ${s.id}`, 'blocked sources must have url null so nothing links to them');
}
const usedSourceIds = new Set((finds ?? []).flatMap((f) => f.sources.map((s) => s.source_id)));
const unusedCount = (sources ?? []).filter((s) => !usedSourceIds.has(s.id)).length;

// ---------------------------------------------------------------- em dash scan (U+2014) across authored text
const EM_DASH = String.fromCharCode(0x2014);
const SCAN_DIRS = ['content', 'docs', 'schema', 'scripts', '.github', 'research', 'tools'];
const SCAN_FILES = ['README.md', 'PROJECT.md', 'package.json', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'LICENSE', 'LICENSE-CONTENT'];
const TEXT_EXT = new Set(['.md', '.json', '.mjs', '.js', '.yml', '.yaml', '.txt', '.html']);
function walk(dir, out) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return;
  for (const name of readdirSync(abs)) {
    const p = join(abs, name);
    if (statSync(p).isDirectory()) walk(relative(root, p), out);
    else if (TEXT_EXT.has(extname(name))) out.push(relative(root, p));
  }
}
const scan = [];
for (const d of SCAN_DIRS) walk(d, scan);
for (const f of SCAN_FILES) if (existsSync(join(root, f))) scan.push(f);
for (const f of scan) {
  readText(f).split('\n').forEach((line, i) => {
    if (line.includes(EM_DASH)) err(`${f}:${i + 1}`, 'contains an em dash (U+2014); use a comma, colon or period');
  });
}

// ---------------------------------------------------------------- report
const count = (a) => (a ? a.length : 0);
const published = (finds ?? []).filter((f) => f.status === 'published').length;
console.log('The Vice Files content validation');
console.log(`  finds        ${count(finds)} (${published} published, ${count(finds) - published} draft; ${(finds ?? []).filter((f) => f.clip).length} with clip; ${(finds ?? []).filter((f) => f.spoiler).length} spoiler; ${(finds ?? []).filter((f) => f.mature).length} mature)`);
console.log(`  connections  ${count(connections)} (${connections.filter((c) => c.related_finds.length).length} linked to finds)`);
console.log(`  regions      ${count(regions)}`);
console.log(`  categories   ${count(categories)} (${(categories ?? []).filter((c) => c.kind === 'find').length} find, ${(categories ?? []).filter((c) => c.kind === 'map-layer').length} map-layer)`);
console.log(`  sources      ${count(sources)} (${unusedCount} not yet cited by a find)`);
console.log(`  explainers   ${explainers.length}`);
const pinned = (finds ?? []).filter((f) => f.pin);
console.log(`  map          ${map?.image ? `${map.image.width} x ${map.image.height} px` : 'missing'}; ${count(map?.labels)} labels; ${pinned.length} pinned finds (${pinned.filter((f) => f.pin_accuracy === 'exact').length} exact, ${pinned.filter((f) => f.pin_accuracy === 'landmark').length} landmark, ${pinned.filter((f) => f.pin_accuracy === 'area').length} area)`);
console.log(`  collectibles ${count(collectibles?.items)} in ${count(collectibles?.layers)} layers (${(collectibles?.items ?? []).filter((i) => i.number === null).length} with an unreadable number)`);
console.log(`  files scanned for em dashes: ${scan.length}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  warn  ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  error ${e}`);
  process.exit(1);
}
console.log('\nOK: all content valid.');
