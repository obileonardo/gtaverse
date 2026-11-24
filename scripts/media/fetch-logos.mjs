// Downloads the official game logos listed in content/games.json into the git-ignored public/media/logos/.
// Run before a deploy build, like the map tiles: pnpm logos:fetch && pnpm build
//
// Rules (docs/DECISIONS.md GS1 to GS4, docs/LEGAL.md):
//   - Files come only from the official URL recorded per game; the schema limits hosts to Rockstar and Take-Two.
//   - Files are saved byte for byte. Nothing is resized, recoloured, traced or converted, and nothing is fed to AI.
//   - Files are never committed (.gitignore, CI asset guard). A game without a file shows a text plate.
//   - Each file must match the sha256 recorded in content/games.json. A changed file stops with an error and is
//     not used; a person checks the new file on the official page, then runs with --record to accept it.
//
// Usage: node scripts/media/fetch-logos.mjs [--record]
//   --record   write sha256, bytes, width and height of each downloaded file back into content/games.json
//              (for a new logo or one the publisher changed). Only those four fields are touched.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gamesPath = join(root, 'content/games.json');
const outDir = join(root, 'public/media/logos');
const record = process.argv.includes('--record');
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = { svg: /image\/svg\+xml/, png: /image\/png/, webp: /image\/webp/ };

const games = JSON.parse(readFileSync(gamesPath, 'utf8'));
mkdirSync(outDir, { recursive: true });
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// Intrinsic size, for layout only: width and height attributes or the viewBox of an SVG, or the PNG/WebP header.
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
// Replaces one numeric or null field inside the logo block of the given file name (keeps the file's formatting).
const setField = (file, key, value) => {
  const start = text.indexOf(`"file": "${file}"`);
  const end = text.indexOf('}', start);
  const block = text.slice(start, end);
  const next = block.replace(new RegExp(`"${key}": [^,\\n]+`), `"${key}": ${JSON.stringify(value)}`);
  text = text.slice(0, start) + next + text.slice(end);
};

let ok = 0, failed = 0, plates = 0;
for (const g of games.items) {
  if (!g.logo) { plates++; console.log(`plate   ${g.id} (no official file recorded)`); continue; }
  const { file, file_url: url } = g.logo;
  const ext = file.split('.').pop();
  const dest = join(outDir, file);
  if (!record && g.logo.sha256 && existsSync(dest) && sha256(readFileSync(dest)) === g.logo.sha256) {
    ok++; console.log(`cached  ${g.id}`); continue;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; thevicefiles-build)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!TYPES[ext]?.test(type)) throw new Error(`expected ${ext}, got content-type "${type}"`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`file is ${buf.length} bytes, over the ${MAX_BYTES} limit`);
    const hash = sha256(buf);
    if (!record && g.logo.sha256 && hash !== g.logo.sha256) {
      throw new Error(`checksum changed (expected ${g.logo.sha256.slice(0, 12)}, got ${hash.slice(0, 12)}). Check the file on ${g.logo.page_url}, then rerun with --record`);
    }
    const tmp = `${dest}.part`;
    writeFileSync(tmp, buf);
    renameSync(tmp, dest);
    if (record || !g.logo.sha256) {
      const { width, height } = await sizeOf(buf, ext);
      setField(file, 'sha256', hash);
      setField(file, 'bytes', buf.length);
      setField(file, 'width', width);
      setField(file, 'height', height);
    }
    ok++; console.log(`fetched ${g.id} (${buf.length} bytes)`);
  } catch (e) {
    failed++;
    rmSync(dest, { force: true }); // never serve a file that failed its check: the switcher falls back to text
    console.error(`failed  ${g.id}: ${e.message}`);
  }
}
if (text !== readFileSync(gamesPath, 'utf8')) { writeFileSync(gamesPath, text); console.log('recorded checksums and sizes in content/games.json'); }
console.log(`\n${ok} logos ready, ${plates} text plates, ${failed} failed. Files: public/media/logos/ (git-ignored).`);
if (failed) process.exit(1);
