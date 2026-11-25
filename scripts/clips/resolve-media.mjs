// Resolves the still of every X and Reddit clip in content/finds.json into content/generated/clip-media.json, so the
// site can show the creator's own poster or photo the way it shows a YouTube thumbnail. Run before a deploy build:
// pnpm clips:resolve (part of pnpm run deploy).
//
// Rules (docs/DECISIONS.md decision 8 and CM1):
//   - Nothing is downloaded or re-hosted. The cache holds the platform's own image URL (pbs.twimg.com,
//     preview.redd.it), which the site hotlinks like it hotlinks i.ytimg.com. A thumbnail URL is checked with a
//     one-byte ranged request (status and content type only); the picture itself is never saved or looked at.
//   - Only public, unauthenticated endpoints, with an honest user agent:
//       X       https://api.fxtwitter.com/status/<id> (JSON: media type, photo URLs, video poster URLs)
//       Reddit  https://www.reddit.com/comments/<id>.json first (often 403 for scripts), then the official embed
//               page https://embed.reddit.com/r/<sub>/comments/<id>/ (the same page Reddit's widgets.js frames),
//               read for its video poster or first picture.
//   - A failed lookup never fails the run: the clip keeps its previous entry, or has none and the site shows the
//     link to the post (Clip.astro's link box). Clips no longer in finds.json are dropped from the cache.
//
// Cache format: { "$comment", "clips": { "<platform>:<post id>": { kind, thumb, width, height, resolved } } }
//   kind      video (a poster and a player), photo (the first picture, linked to the post) or text (nothing to show)
//   thumb     the platform's image URL, or null for text
//   width     the media's own width and height when the platform states them, else null
//   resolved  the date the entry was last fetched
//
// Usage: node scripts/clips/resolve-media.mjs [--all] [--max-age=<days>]
//   default    resolves clips with no entry and entries older than --max-age days (14)
//   --all      resolves every X and Reddit clip again

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// The site's own parsers (Node strips the types), so the cache keys always match what the pages look up.
import { xStatusId, redditPost } from '../../src/lib/clip.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FINDS = join(root, 'content/finds.json');
const OUT = join(root, 'content/generated/clip-media.json');
const UA = 'thevicefiles-clip-resolver/1.0 (+https://thevicefiles.com)';
const args = process.argv.slice(2);
const all = args.includes('--all');
const maxAge = Number(args.find((a) => a.startsWith('--max-age='))?.split('=')[1] ?? 14);
const today = new Date().toISOString().slice(0, 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (url, init = {}) => fetch(url, { ...init, redirect: 'follow', headers: { 'User-Agent': UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(15000) });
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const num = (n) => (Number.isFinite(n) && n > 0 ? Math.round(n) : null);

/** True when the URL answers 200 or 206 with an image content type. Asks for one byte only. */
async function isImage(url) {
  try {
    const res = await get(url, { headers: { Range: 'bytes=0-0' } });
    await res.body?.cancel();
    return (res.status === 200 || res.status === 206) && /^image\//.test(res.headers.get('content-type') ?? '');
  } catch { return false; }
}

// ---------------------------------------------------------------- X
async function resolveX(id) {
  const res = await get(`https://api.fxtwitter.com/status/${id}`);
  if (!res.ok) throw new Error(`fxtwitter ${res.status}`);
  const json = await res.json();
  const tweet = json?.tweet;
  if (!tweet) throw new Error(`fxtwitter: no post (${json?.code ?? '?'} ${json?.message ?? ''})`);
  const media = tweet.media?.all?.length ? tweet.media.all : tweet.quote?.media?.all ?? [];
  const video = media.find((m) => m.type === 'video' || m.type === 'gif');
  if (video?.thumbnail_url) return { kind: 'video', thumb: video.thumbnail_url, width: num(video.width), height: num(video.height) };
  const photo = media.find((m) => m.type === 'photo');
  if (photo?.url) return { kind: 'photo', thumb: photo.url.replace(/\?.*$/, ''), width: num(photo.width), height: num(photo.height) };
  return { kind: 'text', thumb: null, width: null, height: null };
}

// ---------------------------------------------------------------- Reddit
// Reddit's preview URLs are signed per size, so the URL is kept exactly as Reddit gives it (the 640 wide one).
const pick640 = (resolutions = []) => resolutions.find((r) => r.width >= 640) ?? resolutions.at(-1);

async function redditJson(post) {
  const res = await get(`https://www.reddit.com/comments/${post.id}.json?raw_json=1`);
  if (!res.ok || !/json/.test(res.headers.get('content-type') ?? '')) { await res.body?.cancel(); return null; }
  const d = (await res.json())?.[0]?.data?.children?.[0]?.data;
  if (!d) return null;
  const image = d.preview?.images?.[0];
  const still = image ? pick640(image.resolutions) ?? image.source : null;
  if (d.is_video || d.secure_media?.reddit_video) {
    const v = d.secure_media?.reddit_video;
    return { kind: 'video', thumb: still?.url ?? null, width: num(v?.width ?? image?.source?.width), height: num(v?.height ?? image?.source?.height) };
  }
  if (d.is_gallery && d.media_metadata) {
    const first = d.media_metadata[d.gallery_data?.items?.[0]?.media_id] ?? Object.values(d.media_metadata)[0];
    const p = pick640(first?.p);
    if (p?.u) return { kind: 'photo', thumb: p.u, width: num(first.s?.x), height: num(first.s?.y) };
  }
  if (still?.url) return { kind: d.post_hint === 'image' ? 'photo' : 'video', thumb: still.url, width: num(image.source?.width), height: num(image.source?.height) };
  return { kind: 'text', thumb: null, width: null, height: null };
}

async function redditEmbedPage(post) {
  const res = await get(`https://embed.reddit.com/r/${post.sub}/comments/${post.id}/`);
  if (!res.ok) throw new Error(`embed.reddit.com ${res.status}`);
  const html = await res.text();
  if (!html.includes(`t3_${post.id}`)) throw new Error('embed.reddit.com: the post is not in the page');
  // A video post: the player's poster, and the size of its largest rendition.
  const player = html.match(/<shreddit-player(?:-2)?\s[^>]*>/)?.[0];
  if (player) {
    const poster = player.match(/\sposter="([^"]+)"/)?.[1];
    let width = null, height = null;
    const packed = player.match(/packaged-media-json="([^"]+)"/)?.[1];
    if (packed) {
      try {
        const perms = JSON.parse(decode(packed))?.playbackMp4s?.permutations ?? [];
        const dims = perms.map((p) => p.source?.dimensions).filter(Boolean).sort((a, b) => b.width - a.width)[0];
        if (dims) { width = num(dims.width); height = num(dims.height); }
      } catch { /* sizes stay unknown */ }
    }
    if (poster) return { kind: 'video', thumb: decode(poster), width, height };
  }
  // A picture or gallery post: the first post image (never the subreddit icon or a tracking pixel).
  for (const tag of html.match(/<img\s[^>]*>/g) ?? []) {
    const src = tag.match(/\ssrc="(https:\/\/(?:[\w-]+\.)?(?:preview|external-preview|i)\.redd\.it\/[^"]+)"/)?.[1];
    if (!src) continue;
    const srcset = tag.match(/\ssrcset="([^"]+)"/)?.[1];
    const w640 = srcset?.split(',').map((s) => s.trim().split(/\s+/)).find(([, w]) => w === '640w')?.[0];
    return { kind: 'photo', thumb: decode(w640 ?? src), width: null, height: null };
  }
  return { kind: 'text', thumb: null, width: null, height: null };
}

async function resolveReddit(post) {
  try {
    const viaJson = await redditJson(post);
    if (viaJson) return viaJson;
  } catch { /* fall through to the embed page */ }
  return redditEmbedPage(post);
}

// ---------------------------------------------------------------- run
const finds = JSON.parse(readFileSync(FINDS, 'utf8'));
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).clips ?? {} : {};
const clips = new Map();
for (const f of finds) {
  const c = f.clip;
  if (!c) continue;
  if (c.platform === 'x') { const id = xStatusId(c.url); if (id) clips.set(`x:${id}`, { platform: 'x', id, slug: f.slug }); else console.warn(`  ${f.slug}: cannot read an X post id from ${c.url}`); }
  if (c.platform === 'reddit') { const p = redditPost(c.url); if (p) clips.set(`reddit:${p.id}`, { platform: 'reddit', post: p, slug: f.slug }); else console.warn(`  ${f.slug}: cannot read a Reddit post from ${c.url}`); }
}

const fresh = (e) => e?.resolved && (Date.parse(today) - Date.parse(e.resolved)) / 86_400_000 < maxAge;
const next = {};
let fetched = 0, kept = 0, failed = 0;
for (const [key, c] of [...clips].sort(([a], [b]) => a.localeCompare(b))) {
  const before = previous[key];
  if (!all && fresh(before)) { next[key] = before; kept++; continue; }
  try {
    const got = c.platform === 'x' ? await resolveX(c.id) : await resolveReddit(c.post);
    if (got.thumb && !(await isImage(got.thumb))) throw new Error(`thumbnail did not answer as an image: ${got.thumb}`);
    // Keep the old date when nothing changed, so a re-run does not rewrite the file.
    const same = before && before.kind === got.kind && before.thumb === got.thumb && before.width === got.width && before.height === got.height;
    next[key] = { ...got, resolved: same && fresh(before) ? before.resolved : today };
    fetched++;
    console.log(`  ${key.padEnd(28)} ${got.kind.padEnd(5)} ${got.thumb ? 'thumb' : 'no thumb'}  (${c.slug})`);
  } catch (e) {
    failed++;
    if (before) next[key] = before;
    console.warn(`  ${key.padEnd(28)} failed, ${before ? 'kept the previous entry' : 'no entry (the site shows the link)'}: ${e.message}  (${c.slug})`);
  }
  await sleep(c.platform === 'reddit' ? 1500 : 300);
}

const doc = {
  $comment: 'Generated by pnpm clips:resolve (scripts/clips/resolve-media.mjs). Do not edit by hand. Image URLs are the platforms\' own, hotlinked; nothing is re-hosted.',
  clips: next,
};
const text = `${JSON.stringify(doc, null, 2)}\n`;
const old = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
if (text !== old) { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, text); }
const dropped = Object.keys(previous).filter((k) => !(k in next)).length;
console.log(`clips:resolve: ${clips.size} X and Reddit clips; ${fetched} fetched, ${kept} still fresh, ${failed} failed, ${dropped} dropped. ${text !== old ? 'Wrote' : 'Unchanged'} content/generated/clip-media.json.`);
