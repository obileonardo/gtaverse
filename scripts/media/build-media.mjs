// Builds the home hero media from the official Rockstar files cached by
// `pnpm media:fetch`, using the choices in content/hero-media.json.
// Run with: pnpm media:build
//
// Output (git-ignored, never committed: Rockstar's copyright), in public/media/hero/:
//   trailer-1920x1080.mp4 / .webm   the trailer loop (trailer.use: the Launch Trailer cut, or the character
//                                   reel as the fallback), H.264 and AV1, no audio track
//   trailer-720x1280.mp4 / .webm    the same loop cropped for phones
//   poster-{w}.avif / .webp         the loop's first frame (landscape), and poster-portrait-{w}.*
//   sound.m4a                       the music, AAC; only fetched when a visitor turns sound on
//   keyart-{n}-{w}.avif / .webp     key art (landscape), and keyart-{n}-portrait-{w}.*
//   manifest.json                   what the hero component reads at build time
//
// Video needs an ffmpeg with libx264 and libsvtav1 (or libvpx-vp9). The dev dependency
// ffmpeg-static provides one; its download runs here on first use, not on every install.
// FFMPEG_BIN overrides it.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const config = JSON.parse(readFileSync(join(root, 'content/hero-media.json'), 'utf8'));
const cacheDir = join(root, '.cache/media');
const outDir = join(root, 'public/media/hero');
const tmpDir = join(cacheDir, 'tmp');
const require = createRequire(import.meta.url);

const fail = (msg) => {
  console.error(`build-media: ${msg}`);
  process.exit(1);
};
const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)} KB`;
const mb = (p) => statSync(p).size / (1024 * 1024);

// ---------------------------------------------------------------- ffmpeg
function findFfmpeg() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  let bin = null;
  try {
    bin = require('ffmpeg-static');
  } catch {
    /* not installed */
  }
  if (bin && !existsSync(bin)) {
    console.log('ffmpeg  downloading the ffmpeg-static binary (once)');
    const r = spawnSync(process.execPath, [join(dirname(require.resolve('ffmpeg-static/package.json')), 'install.js')], { stdio: 'inherit' });
    if (r.status !== 0 || !existsSync(bin)) bin = null;
  }
  return bin ?? 'ffmpeg';
}
const ffmpeg = findFfmpeg();
const encoders = spawnSync(ffmpeg, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout ?? '';
if (!/\blibx264\b/.test(encoders)) fail(`${ffmpeg} has no libx264 encoder. Install deps (pnpm install) or set FFMPEG_BIN to an ffmpeg built with libx264.`);
const webmCodec = /\blibsvtav1\b/.test(encoders) ? 'libsvtav1' : /\blibvpx-vp9\b/.test(encoders) ? 'libvpx-vp9' : null;
if (!webmCodec) fail(`${ffmpeg} has neither libsvtav1 nor libvpx-vp9 for the WebM.`);
const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

// Width and height of a file's first video stream, read from ffmpeg's own report.
const dims = (file) => {
  const info = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr;
  const m = info.match(/Stream #\d+:\d+[^\n]*Video:[^\n]*?(\d{3,5})x(\d{3,5})/);
  if (!m) fail(`cannot read the size of ${file}`);
  return { w: Number(m[1]), h: Number(m[2]) };
};

// A crop of ratio rw:rh, centred on the focus point and kept inside the frame.
const crop = ({ w, h }, rw, rh, focus) => {
  if (w / h > rw / rh) {
    const cw = Math.round((h * rw) / rh / 2) * 2;
    const x = Math.min(Math.max(Math.round(focus.x * w - cw / 2), 0), w - cw);
    return `crop=${cw}:${h}:${x}:0`;
  }
  const ch = Math.round((w * rh) / rw / 2) * 2;
  const y = Math.min(Math.max(Math.round(focus.y * h - ch / 2), 0), h - ch);
  return `crop=${w}:${ch}:0:${y}`;
};

// Skip the slow encode when the selection, this script and every output are unchanged since the last build.
const inputs = createHash('sha256')
  .update(readFileSync(join(root, 'content/hero-media.json')))
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .digest('hex');
const previous = existsSync(join(outDir, 'manifest.json')) ? JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8')) : null;
if (previous?.inputs === inputs && !process.argv.includes('--force') && (previous.files ?? []).every((f) => existsSync(join(outDir, f)))) {
  console.log('build-media: unchanged since the last build, nothing to do (--force rebuilds)');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });
const manifest = { generated: new Date().toISOString().slice(0, 10), inputs, credit: config.credit };

// ---------------------------------------------------------------- trailer loop
// trailer.use picks the source: "launch" (shots cut from the Launch Trailer, the default) or "reel" (the eight
// character clips, kept as the fallback). Either way the loop is a list of clips joined with hard cuts. The launch
// shots are consecutive in the trailer and the loop restarts on a shot change, so every cut, the restart included,
// is one of the trailer's own edits.
const t = config.trailer;
const pick = t[t.use];
if (!pick || !['launch', 'reel'].includes(t.use)) fail(`trailer.use is "${t.use}"; use "launch" or "reel"`);
const clips = (t.use === 'launch' ? pick.shots.map((s) => ({ ...s, file: pick.file, active: pick.active })) : pick.clips).map((c) => ({
  ...c,
  path: join(cacheDir, pick.source, c.file),
}));
for (const c of clips) if (!existsSync(c.path)) fail(`${c.path} is missing. Run pnpm media:fetch first.`);
// The launch shots must run back to back from launch.in to launch.out (within one frame), so nothing outside the
// chosen, checked range (the sign before it, the title card after it) can enter the loop.
if (t.use === 'launch') {
  const near = (a, b) => Math.abs(a - b) < 1 / pick.fps;
  const ok = near(clips[0].in, pick.in) && near(clips.at(-1).out, pick.out) && clips.every((c, i) => c.out > c.in && (i === 0 || near(c.in, clips[i - 1].out)));
  if (!ok) fail('trailer.launch.shots must run back to back from launch.in to launch.out');
}
const loopSeconds = Number(clips.reduce((s, c) => s + (c.out - c.in), 0).toFixed(3));
if (loopSeconds < 8 || loopSeconds > 15) fail(`the trailer loop is ${loopSeconds} s; keep it between 8 and 15 s`);
const fps = pick.fps;

// Input arguments and the filter chain of one clip for one output size. Launch shots seek close to their in point
// before decoding (the trailer is 4K and 89 s long) and trim by frame number, so no frame of a neighbouring shot or
// title card slips in; "active" crops away the trailer's letterbox bars before the crop to the output ratio.
function clipChain(c, i, r) {
  const focusKey = r.w > r.h ? 'y' : 'x';
  const f = { x: 0.5, y: 0.5, ...(focusKey === 'y' ? { y: c.focus.y } : { x: c.focus.x }) };
  const matte = c.active ? `crop=${c.active.w}:${c.active.h}:${c.active.x}:${c.active.y},` : '';
  const fit = `${matte}${crop(c.active ?? dims(c.path), r.w, r.h, f)},scale=${r.w}:${r.h}:flags=lanczos,setsar=1,fps=${fps},format=yuv420p`;
  if (t.use === 'launch') {
    const seek = Math.max(0, Math.floor(c.in) - 1);
    const frame = (s) => Math.round((s - seek) * fps);
    return {
      input: ['-ss', String(seek), '-i', c.path],
      chain: `[${i}:v:0]trim=start_frame=${frame(c.in)}:end_frame=${frame(c.out)},setpts=PTS-STARTPTS,${fit}[v${i}]`,
    };
  }
  return { input: ['-i', c.path], chain: `[${i}:v:0]trim=start=${c.in}:end=${c.out},setpts=PTS-STARTPTS,${fit}[v${i}]` };
}

// Encode until the size lands in the target band (or the CRF limits are hit).
function encodeSized(args, out, crf, band, step = 2) {
  for (let i = 0; i < 5; i += 1) {
    run([...args(crf), out]);
    const size = mb(out);
    if (size > band[1] && crf < 40) crf += step;
    else if (size < band[0] && crf > 16) crf -= step;
    else break;
  }
  return crf;
}

const reels = [
  { key: 'landscape', w: t.width, h: t.height, band: [2, 4], crf: 23 },
  { key: 'portrait', w: t.portrait_width, h: t.portrait_height, band: [1, 1.5], crf: 24 },
];
manifest.trailer = { source: t.use, seconds: loopSeconds, fps, clips: clips.length, credit: t.credit };
for (const r of reels) {
  const parts = clips.map((c, i) => clipChain(c, i, r));
  const inputs = parts.flatMap((p) => p.input);
  const graph = `${parts.map((p) => p.chain).join(';')};${clips.map((_, i) => `[v${i}]`).join('')}concat=n=${clips.length}:v=1:a=0[out]`;
  const base = ['-filter_complex', graph, '-map', '[out]', '-an'];
  const name = `trailer-${r.w}x${r.h}`;
  // A lossless intermediate keeps both encodes on identical frames and runs the crop once.
  const master = join(tmpDir, `${name}.mkv`);
  run([...inputs, ...base, '-c:v', 'ffv1', master]);

  const mp4 = join(outDir, `${name}.mp4`);
  const crf = encodeSized(
    (q) => ['-i', master, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(q), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', String(Math.round(fps * 2)), '-movflags', '+faststart'],
    mp4,
    r.crf,
    r.band,
  );
  const webm = join(outDir, `${name}.webm`);
  const webmArgs =
    webmCodec === 'libsvtav1'
      ? ['-c:v', 'libsvtav1', '-preset', '5', '-crf', String(crf + 14), '-g', String(Math.round(fps * 2)), '-pix_fmt', 'yuv420p']
      : ['-c:v', 'libvpx-vp9', '-crf', String(crf + 10), '-b:v', '0', '-row-mt', '1', '-g', String(Math.round(fps * 2))];
  run(['-i', master, ...webmArgs, webm]);

  // Poster: the loop's first frame, decoded from the MP4 so poster and video match exactly.
  const png = join(tmpDir, `${name}-poster.png`);
  run(['-i', mp4, '-frames:v', '1', png]);
  const widths = r.key === 'landscape' ? [960, 1440, 1920] : [360, 540, 720];
  const prefix = r.key === 'landscape' ? 'poster' : 'poster-portrait';
  for (const w of widths) {
    await sharp(png).resize({ width: w }).avif({ quality: 52, effort: 6 }).toFile(join(outDir, `${prefix}-${w}.avif`));
    await sharp(png).resize({ width: w }).webp({ quality: 74 }).toFile(join(outDir, `${prefix}-${w}.webp`));
  }
  manifest.trailer[r.key] = {
    width: r.w,
    height: r.h,
    mp4: `${name}.mp4`,
    webm: `${name}.webm`,
    webm_type: webmCodec === 'libsvtav1' ? 'video/webm; codecs=av01.0.08M.08' : 'video/webm; codecs=vp9',
    poster: { prefix, widths },
    bytes: { mp4: statSync(mp4).size, webm: statSync(webm).size },
  };
  console.log(`trailer ${name}  ${loopSeconds} s  mp4 ${kb(mp4)} (crf ${crf})  webm ${kb(webm)}  poster ${kb(join(outDir, `${prefix}-${widths.at(-1)}.avif`))} avif`);
}

// ---------------------------------------------------------------- sound
if (t.sound) {
  const s = t.sound;
  const src = join(cacheDir, s.source, s.file);
  const len = s.out - s.in;
  const out = join(outDir, 'sound.m4a');
  run([
    '-ss', String(s.in), '-t', String(len), '-i', src, '-vn',
    '-af', `afade=t=in:d=${s.fade},afade=t=out:st=${len - s.fade}:d=${s.fade}`,
    '-c:a', 'aac', '-b:a', s.bitrate, '-ac', '2', '-movflags', '+faststart', out,
  ]);
  manifest.sound = { file: 'sound.m4a', seconds: len, bytes: statSync(out).size };
  console.log(`sound   sound.m4a  ${len} s  ${kb(out)}`);
}

// ---------------------------------------------------------------- key art
manifest.keyart = { seconds: config.keyart_seconds, items: [] };
const landWidths = [960, 1440, 1920, 2560];
const portWidths = [540, 810, 1080];
for (const [n, k] of config.keyart.entries()) {
  const item = { alt: k.alt, focus: k.focus, portrait_focus: k.portrait_focus, widths: [], portrait_widths: [] };
  for (const [file, widths, suffix, list] of [
    [k.landscape, landWidths, '', item.widths],
    [k.portrait, portWidths, '-portrait', item.portrait_widths],
  ]) {
    const src = join(cacheDir, k.source, file);
    if (!existsSync(src)) fail(`${src} is missing. Run pnpm media:fetch first.`);
    const { width } = await sharp(src).metadata();
    for (const w of widths.filter((w) => w <= width)) {
      const img = sharp(src).resize({ width: w });
      await img.clone().avif({ quality: 50, effort: 6 }).toFile(join(outDir, `keyart-${n}${suffix}-${w}.avif`));
      await img.clone().webp({ quality: 74 }).toFile(join(outDir, `keyart-${n}${suffix}-${w}.webp`));
      list.push(w);
    }
  }
  manifest.keyart.items.push(item);
  console.log(`keyart  ${n}  ${k.landscape}  ${kb(join(outDir, `keyart-${n}-1920.avif`))} at 1920 avif`);
}

manifest.files = readdirSync(outDir).filter((f) => f !== 'manifest.json' && f !== 'coast.json').sort();
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
rmSync(tmpDir, { recursive: true, force: true });
console.log(`done    ${outDir}`);
