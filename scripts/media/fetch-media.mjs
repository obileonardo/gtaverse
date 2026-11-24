// Downloads Rockstar's official GTA VI trailer and wallpaper zips (linked from
// https://www.rockstargames.com/VI/downloads) into the git-ignored cache
// .cache/media/, verifies them and extracts the files the hero uses.
// Idempotent: a cached, verified zip is reused. Run with: pnpm media:fetch
//
// Everything here is Rockstar's copyright. Nothing is committed (.cache/ and
// public/media/ are git-ignored) and nothing is fed into AI tools (docs/LEGAL.md).
// The archives are untrusted data: entries are read one by one with `unzip -p`
// into flat file names we choose, so no archive path ever reaches the disk, and
// only video and image entries are taken.

import { createHash } from 'node:crypto';
import { closeSync, createReadStream, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const config = JSON.parse(readFileSync(join(root, 'content/hero-media.json'), 'utf8'));
const cacheDir = join(root, '.cache/media');
mkdirSync(cacheDir, { recursive: true });

const fail = (msg) => {
  console.error(`fetch-media: ${msg}`);
  process.exit(1);
};
const sha256 = (p) =>
  new Promise((ok, ko) => {
    const h = createHash('sha256');
    createReadStream(p).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', ko);
  });

// Only these file types leave the archive.
const TAKE = new Set(['.mp4', '.mov', '.m4v', '.jpg', '.jpeg', '.png', '.webp']);
// A flat, safe name for an entry: its base name, with anything unusual replaced.
const flat = (entry) => basename(entry).replace(/[^\w.\- ]+/g, '_');

for (const src of config.sources) {
  const zipPath = join(cacheDir, src.zip_name);
  const outDir = join(cacheDir, src.id);

  // 1. Zip: reuse when present with the expected size, else download.
  if (existsSync(zipPath) && statSync(zipPath).size === src.zip_bytes) {
    console.log(`${src.id}  zip cached      ${zipPath}`);
  } else {
    console.log(`${src.id}  downloading     ${src.url}`);
    const res = await fetch(src.url);
    if (!res.ok) fail(`download failed: HTTP ${res.status}`);
    const type = res.headers.get('content-type');
    if (type !== 'application/zip') fail(`unexpected content-type "${type}"`);
    const tmp = `${zipPath}.part`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    const size = statSync(tmp).size;
    const declared = Number(res.headers.get('content-length'));
    if (declared && size !== declared) fail(`truncated download: ${size} of ${declared} bytes`);
    renameSync(tmp, zipPath);
    console.log(`${src.id}  saved           ${zipPath} (${size} bytes)`);
  }

  // 2. Verify: zip magic, size and hash pinned in content/hero-media.json.
  const magic = Buffer.alloc(4);
  const fd = openSync(zipPath, 'r');
  readSync(fd, magic, 0, 4, 0);
  closeSync(fd);
  if (magic.toString('hex') !== '504b0304') fail(`${src.zip_name} is not a zip archive`);
  const size = statSync(zipPath).size;
  const hash = await sha256(zipPath);
  if (size !== src.zip_bytes || hash !== src.zip_sha256) {
    fail(
      `${src.zip_name} differs from the one content/hero-media.json was measured on (size ${size}, sha256 ${hash}). ` +
        'Rockstar may have updated it: re-check the loop points and crops, then update the pinned size and hash.',
    );
  }

  // 3. Extract video and image entries, one by one, into flat names.
  const entries = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    .split('\n')
    .filter((e) => e && !e.endsWith('/') && !e.startsWith('__MACOSX/') && !basename(e).startsWith('._'));
  mkdirSync(outDir, { recursive: true });
  const seen = new Map();
  let taken = 0;
  for (const entry of entries) {
    if (!TAKE.has(extname(entry).toLowerCase())) continue;
    const name = flat(entry);
    if (seen.has(name)) fail(`two entries flatten to "${name}": ${seen.get(name)} and ${entry}`);
    seen.set(name, entry);
    const out = join(outDir, name);
    if (!existsSync(out)) {
      // -p writes the entry's bytes to stdout; the archive's own path is never used.
      const data = execFileSync('unzip', ['-p', zipPath, entry], { maxBuffer: 1024 * 1024 * 1024 });
      writeFileSync(out, data);
    }
    taken += 1;
  }
  writeFileSync(join(outDir, 'entries.json'), `${JSON.stringify(Object.fromEntries(seen), null, 2)}\n`);
  console.log(`${src.id}  ok              ${taken} files in ${outDir}`);
}

// 4. Every file the selection names must now exist.
const { trailer } = config;
const named = [
  ...trailer.clips.map((c) => join(cacheDir, trailer.source, c.file)),
  ...(trailer.sound ? [join(cacheDir, trailer.source, trailer.sound.file)] : []),
  ...config.keyart.flatMap((k) => [join(cacheDir, k.source, k.landscape), join(cacheDir, k.source, k.portrait)]),
];
const missing = named.filter((p) => !existsSync(p));
if (missing.length) fail(`files named in content/hero-media.json are missing:\n  ${missing.join('\n  ')}`);
console.log(`selection ok    ${named.length} files`);
