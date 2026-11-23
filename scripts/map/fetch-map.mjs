// Downloads Rockstar's official "Leonida Map & Cover Art Poster" zip and extracts
// the map image into the git-ignored cache .cache/map/. Idempotent: a cached,
// verified file is reused. Run with: pnpm map:fetch
//
// The zip and the image are Rockstar's copyright. They are never committed
// (see .gitignore) and never fed into AI tools (docs/LEGAL.md).
// The archive is treated as untrusted data: we only read one named JPEG entry
// out of it and never write archive paths to disk.

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'content/map.json'), 'utf8'));
const src = map.source;

const cacheDir = join(root, '.cache/map');
const zipPath = join(cacheDir, src.zip_name);
const imagePath = join(cacheDir, src.image_name);
mkdirSync(cacheDir, { recursive: true });

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const fail = (msg) => {
  console.error(`fetch-map: ${msg}`);
  process.exit(1);
};

// 1. Zip: reuse when present with the expected size, else download.
if (existsSync(zipPath) && statSync(zipPath).size === src.zip_bytes) {
  console.log(`zip    cached     ${zipPath}`);
} else {
  console.log(`zip    downloading ${src.url}`);
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
  console.log(`zip    saved      ${zipPath} (${size} bytes)`);
}

const zipSize = statSync(zipPath).size;
if (readFileSync(zipPath).subarray(0, 4).toString('hex') !== '504b0304') fail('file is not a zip archive');
const zipSha = sha256(zipPath);
if (zipSize !== src.zip_bytes || zipSha !== src.zip_sha256) {
  fail(
    `the zip differs from the one content/map.json was measured on (size ${zipSize}, sha256 ${zipSha}). ` +
      'Rockstar may have updated the map. Every pin depends on the pixel space, so re-measure before changing content/map.json.',
  );
}

// 2. Image: list entries, require exactly the expected one, stream it out.
if (existsSync(imagePath) && sha256(imagePath) === src.image_sha256) {
  console.log(`image  cached     ${imagePath}`);
} else {
  const entries = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).split('\n').filter(Boolean);
  if (entries.length !== 1 || entries[0] !== src.image_name) fail(`unexpected archive entries: ${JSON.stringify(entries)}`);
  const data = execFileSync('unzip', ['-p', zipPath, src.image_name], { maxBuffer: 200 * 1024 * 1024 });
  writeFileSync(imagePath, data);
  console.log(`image  extracted  ${imagePath} (${data.length} bytes)`);
}

// 3. Verify the image is the JPEG the coordinate system was measured on.
const meta = await sharp(imagePath).metadata();
if (meta.format !== 'jpeg') fail(`image format is ${meta.format}, expected jpeg`);
if (meta.width !== map.image.width || meta.height !== map.image.height) {
  fail(`image is ${meta.width} x ${meta.height}, content/map.json says ${map.image.width} x ${map.image.height}. Stop and re-measure.`);
}
if (sha256(imagePath) !== src.image_sha256) fail('image sha256 differs from content/map.json');
console.log(`image  ok         ${meta.width} x ${meta.height} px, ${meta.density} dpi, ${meta.space}, ${meta.format}`);
