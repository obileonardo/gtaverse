// Builds 512 px deep-zoom tiles of the official Leonida map for Leaflet CRS.Simple.
// Run with: pnpm map:tiles (after pnpm map:fetch).
//
// Output (git-ignored, never committed: the map is Rockstar's copyright):
//   public/map/tiles/{z}/{x}/{y}.webp  zoom 0 to maxZoom, maxZoom is full resolution
//   public/map/meta.json               what the front end needs to load the tiles
//   public/map/preview.jpg             1600 px wide preview for quick checks
//
// Coordinate rule: at zoom z the image is scaled by 2^(z - maxZoom). Tile (x, y)
// at zoom z covers scaled pixels [x*T, (x+1)*T) by [y*T, (y+1)*T) with T = 512, so
// image pixel (px, py) is Leaflet point (px, py) at maxZoom:
//   map.unproject([px, py], maxZoom)
// Edge tiles are padded to T px with transparent pixels.
//
// Why 512 px tiles (docs/MAP.md, "Sharpness"): the front end shows a 512 px tile at 512 CSS px on a 1x
// screen and at 256 CSS px (one level deeper, zoomOffset 1) on a 2x screen, so every device pixel gets
// one map pixel. One pyramid serves both, with a quarter of the requests 256 px tiles would need.
// The zoom numbering stays on the old 256 px reference (full resolution is zoom 5), so the pixel space,
// every pin and Leaflet's CRS are unchanged.

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'content/map.json'), 'utf8'));
const { width: W, height: H } = map.image;
const TILE = map.tiles.tile_size;
const FORMAT = map.tiles.format;
// Measured on 14 sample tiles (docs/MAP.md, "Sharpness"): quality 90 with smart chroma subsampling keeps
// thin coloured lines and small type crisp; quality 82 with plain 4:2:0 softened them.
const WEBP = { quality: 90, effort: 6, smartSubsample: true };

// Cloudflare static asset limits (Workers static assets, checked 2026-11-23).
const CF_MAX_FILE_BYTES = 25 * 1024 * 1024;
const CF_MAX_FILES = 20000;

const imagePath = join(root, '.cache/map', map.source.image_name);
const outDir = join(root, 'public/map');
const tileDir = join(outDir, 'tiles');
if (!existsSync(imagePath)) {
  console.error(`build-tiles: ${imagePath} is missing. Run pnpm map:fetch first.`);
  process.exit(1);
}

const meta = await sharp(imagePath).metadata();
if (meta.width !== W || meta.height !== H) {
  console.error(`build-tiles: image is ${meta.width} x ${meta.height}, content/map.json says ${W} x ${H}. Stop and re-measure.`);
  process.exit(1);
}

// Native max zoom on the 256 px reference: zoom 5 is full resolution for this image, whatever TILE is.
const REF_TILE = 256;
let maxZoom = Math.ceil(Math.log2(Math.max(W, H) / REF_TILE));
const tilesAt = (z) => {
  const s = 2 ** (z - maxZoom);
  return Math.ceil((W * s) / TILE) * Math.ceil((H * s) / TILE);
};
const totalTiles = (mz) => {
  let n = 0;
  for (let z = 0; z <= mz; z++) n += tilesAt(z);
  return n;
};
while (totalTiles(maxZoom) > CF_MAX_FILES - 100) {
  console.warn(`build-tiles: ${totalTiles(maxZoom)} tiles exceeds the Cloudflare file limit, capping max zoom at ${maxZoom - 1}`);
  maxZoom--;
}

// Decode once, CMYK (GRACoL2013 profile) to sRGB, keep as raw RGB in memory.
console.log(`decode ${W} x ${H} ${meta.space} -> srgb`);
const full = await sharp(imagePath, { limitInputPixels: false }).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
const fullRaw = { width: full.info.width, height: full.info.height, channels: full.info.channels };

rmSync(tileDir, { recursive: true, force: true });
mkdirSync(tileDir, { recursive: true });

let count = 0;
let bytes = 0;
let largest = 0;
const perZoom = [];
for (let z = 0; z <= maxZoom; z++) {
  const s = 2 ** (z - maxZoom);
  const zw = Math.max(1, Math.round(W * s));
  const zh = Math.max(1, Math.round(H * s));
  const level = z === maxZoom ? full.data : await sharp(full.data, { raw: fullRaw }).resize(zw, zh, { kernel: 'lanczos3' }).raw().toBuffer();
  const cols = Math.ceil(zw / TILE);
  const rows = Math.ceil(zh / TILE);
  let zCount = 0;
  let zBytes = 0;
  for (let tx = 0; tx < cols; tx++) {
    mkdirSync(join(tileDir, String(z), String(tx)), { recursive: true });
    for (let ty = 0; ty < rows; ty++) {
      const left = tx * TILE;
      const top = ty * TILE;
      const w = Math.min(TILE, zw - left);
      const h = Math.min(TILE, zh - top);
      let img = sharp(level, { raw: { width: zw, height: zh, channels: 3 } }).extract({ left, top, width: w, height: h });
      if (w < TILE || h < TILE) img = img.extend({ right: TILE - w, bottom: TILE - h, background: { r: 0, g: 0, b: 0, alpha: 0 } });
      const out = join(tileDir, String(z), String(tx), `${ty}.${FORMAT}`);
      await img.webp(WEBP).toFile(out);
      const size = statSync(out).size;
      zCount++;
      zBytes += size;
      largest = Math.max(largest, size);
    }
  }
  count += zCount;
  bytes += zBytes;
  perZoom.push({ z, width: zw, height: zh, cols, rows, tiles: zCount, bytes: zBytes });
  console.log(`z${z}  ${String(zw).padStart(5)} x ${String(zh).padEnd(5)} ${String(cols).padStart(2)} x ${String(rows).padEnd(2)} = ${String(zCount).padStart(4)} tiles  ${(zBytes / 1024 / 1024).toFixed(2)} MiB`);
}

// Preview: 1600 px wide JPEG for quick checks.
const previewWidth = 1600;
await sharp(full.data, { raw: fullRaw }).resize(previewWidth).jpeg({ quality: 80, mozjpeg: true }).toFile(join(outDir, 'preview.jpg'));

const metaOut = {
  width: W,
  height: H,
  tileSize: TILE,
  minZoom: 0,
  maxZoom,
  format: FORMAT,
  tileUrl: `tiles/{z}/{x}/{y}.${FORMAT}`,
  preview: { file: 'preview.jpg', width: previewWidth, height: Math.round((H * previewWidth) / W) },
  tileCount: count,
  totalBytes: bytes,
  perZoom,
  source: { title: map.source.title, url: map.source.url, page: map.source.page, image_sha256: map.source.image_sha256 },
  attribution: map.source.attribution,
};
writeFileSync(join(outDir, 'meta.json'), JSON.stringify(metaOut, null, 2) + '\n');

console.log(`\ntiles   ${count} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB, largest ${(largest / 1024).toFixed(1)} KiB, zoom 0 to ${maxZoom}`);
console.log(`limits  Cloudflare: ${count} of ${CF_MAX_FILES} files, largest file ${(largest / 1024).toFixed(1)} KiB of ${CF_MAX_FILE_BYTES / 1024 / 1024} MiB`);
if (count > CF_MAX_FILES || largest > CF_MAX_FILE_BYTES) {
  console.error('build-tiles: output breaks a Cloudflare static asset limit');
  process.exit(1);
}
console.log(`wrote   ${join(outDir, 'meta.json')} and preview.jpg`);
