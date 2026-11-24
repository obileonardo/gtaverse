// Downloads the official game files listed in content/games.json and builds the header menu's art.
// Run before a deploy build, like the map tiles: pnpm logos:fetch && pnpm build (after pnpm media:build).
//
//   logos  public/media/logos/<file>        each game's official logo, saved byte for byte (switcher, hubs, chips)
//   art    .cache/media/menu/<file>          each game's official cover art, saved byte for byte
//          public/media/menu/<id>-<w>.avif   the same art sized (and, where `crop` is recorded, cropped) for the
//          public/media/menu/<id>-<w>.webp   menu's art panel
//   map    public/media/menu/map.svg         our own line drawing of Leonida's coast for the Map link, drawn from
//                                            public/media/hero/coast.json (pnpm media:build); skipped without it
//          public/media/menu/manifest.json   what the header reads at build time
//
// Rules (docs/DECISIONS.md GS1 to GS4 and M1 to M4, docs/LEGAL.md):
//   - Files come only from the official URL recorded per game; the schema limits hosts to Rockstar and Take-Two.
//   - Logos are never resized, recoloured, traced or converted. Art is only scaled and cropped to fit the panel,
//     never retouched or recoloured. Nothing is fed to AI.
//   - Files are never committed (.gitignore, CI asset guard). A game without a file shows a text plate (logos) or
//     the sunrise glow (art).
//   - Each file must match the sha256 recorded in content/games.json. A changed file stops with an error and is
//     not used; a person checks the new file on the official page, then runs with --record to accept it.
//
// Usage: node scripts/media/fetch-logos.mjs [--record]
//   --record   write sha256, bytes, width and height of each downloaded file back into content/games.json
//              (for a new file or one the publisher changed). Only those four fields are touched.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gamesPath = join(root, 'content/games.json');
const logoDir = join(root, 'public/media/logos');
const artCache = join(root, '.cache/media/menu');
const menuDir = join(root, 'public/media/menu');
const coastPath = join(root, 'public/media/hero/coast.json');
const record = process.argv.includes('--record');
const TYPES = { svg: /image\/svg\+xml/, png: /image\/png/, webp: /image\/webp/, jpg: /image\/jpeg/ };
const LIMIT = { logo: 2 * 1024 * 1024, art: 4 * 1024 * 1024 };
// Panel widths. The panel is at most about 640 css px wide (1280 on a 2x screen); a source narrower than a width
// is kept at its own width instead of being enlarged.
const ART_WIDTHS = [480, 960, 1280];

const games = JSON.parse(readFileSync(gamesPath, 'utf8'));
for (const d of [logoDir, artCache, menuDir]) mkdirSync(d, { recursive: true });
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// Intrinsic size: width and height attributes or the viewBox of an SVG, or the raster header.
async function sizeOf(buf, ext) {
  if (ext === 'svg') {
    const head = buf.toString('utf8').match(/<svg\b[^>]*>/i)?.[0] ?? '';
    const attr = (n) => head.match(new RegExp(`\\s${n}="([\\d.]+)(px)?"`))?.[1];
    const vb = head.match(/viewBox="([^"]+)"/)?.[1]?.trim().split(/[\s,]+/).map(Number);
    const w = Number(attr('width') ?? vb?.[2]);
    const h = Number(attr('height') ?? vb?.[3]);
    return w > 0 && h > 0 ? { width: w, height: h } : { width: null, height: null };
  }
  const m = await sharp(buf).metadata();
  return { width: m.width ?? null, height: m.height ?? null };
}

let text = readFileSync(gamesPath, 'utf8');
// Replaces one numeric or null field inside the block holding the given file name (keeps the file's formatting).
// Logo and art file names never repeat (validated), so the file name finds exactly one block.
const setField = (file, key, value) => {
  const start = text.indexOf(`"file": "${file}"`);
  const end = text.indexOf('\n      }', start); // the block's own closing brace (focus and crop are nested objects)
  const block = text.slice(start, end);
  // Only the block's own field (a line of its own), never the same name inside the one-line crop object.
  const next = block.replace(new RegExp(`(\\n\\s*)"${key}": [^,\\n]+`), `$1"${key}": ${JSON.stringify(value)}`);
  text = text.slice(0, start) + next + text.slice(end);
};

// One implementation for every official file: download from the recorded URL, check type, size and checksum,
// write atomically, record on --record. Returns the bytes, or throws (the caller removes anything stale).
async function official(kind, id, block, dest) {
  const ext = block.file.split('.').pop();
  if (!record && block.sha256 && existsSync(dest)) {
    const cached = readFileSync(dest);
    if (sha256(cached) === block.sha256) return { buf: cached, fetched: false };
  }
  const res = await fetch(block.file_url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; thevicefiles-build)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!TYPES[ext]?.test(type)) throw new Error(`expected ${ext}, got content-type "${type}"`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > LIMIT[kind]) throw new Error(`file is ${buf.length} bytes, over the ${LIMIT[kind]} limit`);
  const hash = sha256(buf);
  if (!record && block.sha256 && hash !== block.sha256) {
    throw new Error(`checksum changed (expected ${block.sha256.slice(0, 12)}, got ${hash.slice(0, 12)}). Check the file on ${block.page_url}, then rerun with --record`);
  }
  const tmp = `${dest}.part`;
  writeFileSync(tmp, buf);
  renameSync(tmp, dest);
  if (record || !block.sha256) {
    const { width, height } = await sizeOf(buf, ext);
    setField(block.file, 'sha256', hash);
    setField(block.file, 'bytes', buf.length);
    setField(block.file, 'width', width);
    setField(block.file, 'height', height);
  }
  return { buf, fetched: true };
}

let failed = 0;
const report = (kind, id, msg) => console.log(`${msg.padEnd(8)}${kind} ${id}`);

// ---------------------------------------------------------------- logos (byte for byte)
let logos = 0, plates = 0;
for (const g of games.items) {
  if (!g.logo) { plates++; report('logo', g.id, 'plate'); continue; }
  const dest = join(logoDir, g.logo.file);
  try {
    const { fetched } = await official('logo', g.id, g.logo, dest);
    logos++; report('logo', g.id, fetched ? 'fetched' : 'cached');
  } catch (e) {
    failed++;
    rmSync(dest, { force: true }); // never serve a file that failed its check: the switcher falls back to text
    console.error(`failed  logo ${g.id}: ${e.message}`);
  }
}

// ---------------------------------------------------------------- menu art (official covers, sized for the panel)
const manifest = { generated: new Date().toISOString().slice(0, 10), credit: 'Art: Rockstar Games', games: {}, map: null };
const removeArt = (id) => { for (const f of readdirSync(menuDir)) if (f.startsWith(`${id}-`)) rmSync(join(menuDir, f), { force: true }); };
let arts = 0, glows = 0;
for (const g of games.items) {
  if (!g.art) { glows++; continue; }
  const a = g.art;
  try {
    const { buf } = await official('art', g.id, a, join(artCache, a.file));
    // Derived files are rebuilt only when the source or the crop changes.
    const stamp = sha256(Buffer.from(JSON.stringify([sha256(buf), a.crop ?? null, ART_WIDTHS, 2])));
    const stampFile = join(menuDir, `${g.id}-stamp.txt`);
    let img = sharp(buf);
    const meta = await img.metadata();
    const box = a.crop ?? { left: 0, top: 0, width: meta.width, height: meta.height };
    const widths = [...new Set(ART_WIDTHS.map((w) => Math.min(w, box.width)))];
    if (!(existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp)) {
      removeArt(g.id);
      for (const w of widths) {
        const sized = sharp(buf).extract(box).resize({ width: w });
        await sized.clone().avif({ quality: 52, effort: 4 }).toFile(join(menuDir, `${g.id}-${w}.avif`));
        await sized.clone().webp({ quality: 78 }).toFile(join(menuDir, `${g.id}-${w}.webp`));
      }
      writeFileSync(stampFile, stamp);
      report('art', g.id, 'built');
    } else report('art', g.id, 'cached');
    manifest.games[g.id] = { widths, width: box.width, height: box.height, ratio: +(box.width / box.height).toFixed(4), focus: a.focus };
    arts++;
  } catch (e) {
    failed++;
    removeArt(g.id);
    rmSync(join(artCache, a.file), { force: true });
    console.error(`failed  art ${g.id}: ${e.message}`);
  }
}

// ---------------------------------------------------------------- map line art (ours, from the traced coast)
// White hairlines on the night navy, the poster's printed grid dimmed under them, and one pink pin on the main
// coast's east shore (the line art's own shot, docs/HERO.md). The coast is a derived shape of Rockstar's map, so
// the drawing stays git-ignored like coast.json.
if (existsSync(coastPath)) {
  const coast = JSON.parse(readFileSync(coastPath, 'utf8'));
  const W = 1000, H = Math.round(coast.aspect * W);
  const pt = (q) => `${(q[0] * W).toFixed(1)},${(q[1] * W).toFixed(1)}`;
  const cell = (600 / 5395) * W;
  const grid = [];
  for (let x = 0; x <= W + 0.1; x += cell) grid.push(`M${x.toFixed(1)} 0V${H}`);
  for (let y = 0; y <= H + 0.1; y += cell) grid.push(`M0 ${y.toFixed(1)}H${W}`);
  const paths = coast.paths.map((p) => `<polygon points="${p.map(pt).join(' ')}"/>`).join('');
  const main = coast.paths[0] ?? [];
  const ys = main.map((q) => q[1]);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const band = main.filter((q) => q[1] > y0 + (y1 - y0) * 0.55 && q[1] < y0 + (y1 - y0) * 0.7);
  const east = band.reduce((m, q) => (q[0] > m[0] ? q : m), band[0] ?? main[0] ?? [0.5, 0.5]);
  const [px, py] = [east[0] * W, east[1] * W];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    + `<rect width="${W}" height="${H}" fill="#0d0c1a"/>`
    + `<path d="${grid.join('')}" stroke="#fff" stroke-opacity=".07" stroke-width="1" fill="none"/>`
    + `<g fill="none" stroke="#fff" stroke-opacity=".78" stroke-width="1.6" stroke-linejoin="round">${paths}</g>`
    + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="18" fill="none" stroke="#f976b0" stroke-width="2"/>`
    + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="#f976b0"/>`
    + `</svg>`;
  writeFileSync(join(menuDir, 'map.svg'), svg);
  manifest.map = { file: 'map.svg', width: W, height: H, credit: 'Line art: The Vice Files' };
  report('art', 'map', 'drawn');
} else {
  rmSync(join(menuDir, 'map.svg'), { force: true });
  console.log('skipped art map (public/media/hero/coast.json is missing: run pnpm media:build first)');
}
writeFileSync(join(menuDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

if (text !== readFileSync(gamesPath, 'utf8')) { writeFileSync(gamesPath, text); console.log('recorded checksums and sizes in content/games.json'); }
console.log(`\n${logos} logos ready, ${plates} text plates; ${arts} covers ready, ${glows} games without art; ${failed} failed.`);
console.log('Files: public/media/logos/ and public/media/menu/ (git-ignored).');
if (failed) process.exit(1);
