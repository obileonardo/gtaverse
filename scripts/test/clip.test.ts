// Unit tests for the clip helpers (src/lib/clip.ts): X and Reddit URL parsing, the cache key, the still every
// surface reads (clipStill), the player URL (clipEmbed) and the post embeds' resize messages. Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { xStatusId, redditPost, clipKey, clipStill, clipEmbed, clipVerb, clipLabels, embedForTheme, postHeight, type ClipMedia } from '../../src/lib/clip.ts';

test('xStatusId reads x.com and twitter.com status URLs', () => {
  assert.equal(xStatusId('https://x.com/GTAWikiOfficial/status/2123073257867968617'), '2123073257867968617');
  assert.equal(xStatusId('https://twitter.com/someone/status/2123032338422714528?s=20'), '2123032338422714528');
  assert.equal(xStatusId('https://x.com/cclipgod/status/2123354914068021638/video/1'), '2123354914068021638');
  assert.equal(xStatusId('https://mobile.twitter.com/a_b/statuses/1234567890'), '1234567890');
  assert.equal(xStatusId('https://x.com/i/web/status/2123354914068021638'), '2123354914068021638');
});

test('xStatusId rejects other URLs', () => {
  assert.equal(xStatusId('https://x.com/GTAWikiOfficial'), null);
  assert.equal(xStatusId('https://notx.com/a/status/2123073257867968617'), null);
  assert.equal(xStatusId('https://x.com/a/status/12abc'), null);
  assert.equal(xStatusId('https://www.youtube.com/watch?v=Mj_beVHUJE4'), null);
});

test('redditPost reads the subreddit, id and slug', () => {
  assert.deepEqual(redditPost('https://www.reddit.com/r/GTA6/comments/1y02b4y/crazy_npc_easter_egg_dialog_in_gta_6/'), { sub: 'GTA6', id: '1y02b4y', slug: 'crazy_npc_easter_egg_dialog_in_gta_6' });
  assert.deepEqual(redditPost('https://old.reddit.com/r/GTA6unmoderated/comments/1Y0P8SZ'), { sub: 'GTA6unmoderated', id: '1y0p8sz', slug: null });
  assert.deepEqual(redditPost('https://reddit.com/r/GTA6/comments/1y02wt7/?share=1'), { sub: 'GTA6', id: '1y02wt7', slug: null });
  assert.equal(redditPost('https://www.reddit.com/r/GTA6/'), null);
  assert.equal(redditPost('https://www.reddit.com/user/someone/comments/abc123/x/'), null);
  assert.equal(redditPost('https://evilreddit.com/r/GTA6/comments/1y02b4y/'), null);
});

test('clipKey names the post per platform', () => {
  assert.equal(clipKey({ platform: 'x', url: 'https://x.com/a/status/2123073257867968617' }), 'x:2123073257867968617');
  assert.equal(clipKey({ platform: 'reddit', url: 'https://www.reddit.com/r/GTA6/comments/1y02b4y/t/' }), 'reddit:1y02b4y');
  assert.equal(clipKey({ platform: 'youtube', url: 'https://youtu.be/Mj_beVHUJE4' }), 'youtube:Mj_beVHUJE4');
  assert.equal(clipKey({ platform: 'tiktok', url: 'https://www.tiktok.com/@a/video/1' }), null);
  assert.equal(clipKey({ platform: 'x', url: 'https://x.com/a' }), null);
});

const xVideo: ClipMedia = { kind: 'video', thumb: 'https://pbs.twimg.com/amplify_video_thumb/1/img/abc.jpg', width: 1920, height: 1080 };
const xPhoto: ClipMedia = { kind: 'photo', thumb: 'https://pbs.twimg.com/media/HXarq4wXQAE3THr.jpg', width: 3840, height: 2160 };
const rVideo: ClipMedia = { kind: 'video', thumb: 'https://external-preview.redd.it/a.png?width=640&s=1', width: 1280, height: 714 };
const text: ClipMedia = { kind: 'text', thumb: null, width: null, height: null };
const xClip = { platform: 'x', url: 'https://x.com/a/status/2123354914068021638' };
const rClip = { platform: 'reddit', url: 'https://www.reddit.com/r/GTA6unmoderated/comments/1y0p8sz/creepy/' };

test('clipStill: YouTube from the URL, Shorts skipped', () => {
  const s = clipStill({ platform: 'youtube', url: 'https://www.youtube.com/watch?v=Mj_beVHUJE4' });
  assert.equal(s?.thumb, 'https://i.ytimg.com/vi/Mj_beVHUJE4/mqdefault.jpg');
  assert.equal(s?.src, 'https://i.ytimg.com/vi/Mj_beVHUJE4/maxresdefault.jpg');
  assert.equal(s?.peek, 'https://i.ytimg.com/vi/Mj_beVHUJE4/hqdefault.jpg');
  assert.equal(clipStill({ platform: 'youtube', url: 'https://www.youtube.com/shorts/Mj_beVHUJE4' }), null);
});

test('clipStill: X posters and photos in pbs.twimg.com named sizes', () => {
  const v = clipStill(xClip, xVideo);
  assert.equal(v?.thumb, 'https://pbs.twimg.com/amplify_video_thumb/1/img/abc?format=jpg&name=small');
  assert.equal(v?.src, 'https://pbs.twimg.com/amplify_video_thumb/1/img/abc?format=jpg&name=medium');
  assert.match(v!.srcset, /name=small 680w, .*name=medium 1200w$/);
  assert.equal(clipStill(xClip, xPhoto)?.thumb, 'https://pbs.twimg.com/media/HXarq4wXQAE3THr?format=jpg&name=small');
});

test('clipStill: Reddit keeps the signed URL as given', () => {
  const s = clipStill(rClip, rVideo);
  assert.equal(s?.src, rVideo.thumb);
  assert.equal(s?.thumb, rVideo.thumb);
});

test('clipStill: nothing for a missing entry, a text post, an unreadable URL or no clip', () => {
  assert.equal(clipStill(xClip, null), null);
  assert.equal(clipStill(xClip, undefined), null);
  assert.equal(clipStill(rClip, text), null);
  assert.equal(clipStill({ platform: 'x', url: 'https://x.com/a' }, xVideo), null);
  assert.equal(clipStill({ platform: 'tiktok', url: 'https://www.tiktok.com/@a/video/1' }, xVideo), null);
  assert.equal(clipStill(null), null);
});

test('clipEmbed: YouTube always, X and Reddit only for a cached video post', () => {
  assert.equal(clipEmbed({ platform: 'youtube', url: 'https://youtu.be/Mj_beVHUJE4' }), 'https://www.youtube-nocookie.com/embed/Mj_beVHUJE4?autoplay=1');
  assert.equal(clipEmbed(xClip, xVideo), 'https://platform.twitter.com/embed/Tweet.html?id=2123354914068021638&theme=dark&dnt=true');
  assert.equal(clipEmbed(xClip, xVideo, 'light'), 'https://platform.twitter.com/embed/Tweet.html?id=2123354914068021638&theme=light&dnt=true');
  assert.equal(clipEmbed(rClip, rVideo), 'https://embed.reddit.com/r/GTA6unmoderated/comments/1y0p8sz/creepy/?embed=true&ref_source=embed&ref=share&theme=dark');
  assert.equal(clipEmbed(rClip, rVideo, 'light'), 'https://embed.reddit.com/r/GTA6unmoderated/comments/1y0p8sz/creepy/?embed=true&ref_source=embed&ref=share');
  assert.equal(clipEmbed(xClip, xPhoto), null);
  assert.equal(clipEmbed(rClip, text), null);
  assert.equal(clipEmbed(xClip, null), null);
});

test('clipVerb and clipLabels: play a video, view a photo, read a text post', () => {
  assert.equal(clipVerb({ platform: 'youtube', url: 'https://youtu.be/Mj_beVHUJE4' }), 'play');
  assert.equal(clipVerb(xClip, xVideo), 'play');
  assert.equal(clipVerb(xClip, xPhoto), 'view');
  assert.equal(clipVerb(rClip, text), 'read');
  assert.equal(clipVerb(xClip, null), 'play'); // not resolved yet: the link box, labelled as a clip
  assert.equal(clipVerb(xClip, { ...xPhoto, thumb: null }), 'play');
  assert.equal(clipVerb({ platform: 'youtube', url: 'https://youtu.be/Mj_beVHUJE4' }, text), 'play');
  const play = clipLabels('play'), view = clipLabels('view'), read = clipLabels('read');
  assert.deepEqual([play.action, play.bar, play.reveal, play.revealBar, play.spoiler, play.on, play.icon], ['Play clip', 'Watch the clip', 'Reveal clip', 'Reveal the clip', 'Spoiler clip', 'Watch on', 'play']);
  assert.deepEqual([view.action, view.bar, view.reveal, view.revealBar, view.spoiler, view.on, view.icon], ['View photo', 'View the photo', 'Reveal photo', 'Reveal the photo', 'Spoiler photo', 'View on', 'image']);
  assert.deepEqual([read.action, read.bar, read.reveal, read.revealBar, read.spoiler, read.on, read.icon], ['Read the post', 'Read the post', 'Reveal post', 'Reveal the post', 'Spoiler post', 'Read on', 'article']);
  for (const l of [play, view, read]) for (const s of Object.values(l)) assert.doesNotMatch(s, /[\u2013\u2014]/);
});

test('embedForTheme switches X and Reddit embeds and leaves YouTube alone', () => {
  const x = clipEmbed(xClip, xVideo)!;
  assert.match(embedForTheme(x, 'light'), /theme=light/);
  const r = clipEmbed(rClip, rVideo)!;
  assert.doesNotMatch(embedForTheme(r, 'light'), /theme=/);
  assert.match(embedForTheme(embedForTheme(r, 'light'), 'dark'), /theme=dark/);
  const yt = 'https://www.youtube-nocookie.com/embed/Mj_beVHUJE4?autoplay=1';
  assert.equal(embedForTheme(yt, 'light'), yt);
});

test('postHeight reads X and Reddit resize messages, as objects or JSON strings', () => {
  assert.equal(postHeight({ 'twttr.embed': { method: 'twttr.private.resize', params: [{ height: 612, width: 550 }] } }), 612);
  assert.equal(postHeight(JSON.stringify({ 'twttr.embed': { method: 'twttr.private.resize', params: [{ height: '480' }] } })), 480);
  assert.equal(postHeight({ type: 'resize.embed', data: 520 }), 520);
  assert.equal(postHeight(JSON.stringify({ type: 'resize.embed', data: 300 })), 300);
  assert.equal(postHeight({ 'twttr.embed': { method: 'twttr.private.rendered' } }), null);
  assert.equal(postHeight({ type: 'resize.embed', data: -4 }), null);
  assert.equal(postHeight('not json'), null);
  assert.equal(postHeight(null), null);
});

// The committed cache: every entry is keyed the way clipKey keys a clip, holds a known kind, and points only at the
// platforms' own image hosts (nothing re-hosted, nothing local).
test('content/generated/clip-media.json is well formed', () => {
  const file = new URL('../../content/generated/clip-media.json', import.meta.url);
  if (!existsSync(file)) return;
  const { clips } = JSON.parse(readFileSync(file, 'utf8')) as { clips: Record<string, ClipMedia & { resolved: string }> };
  for (const [key, e] of Object.entries(clips)) {
    assert.match(key, /^(x:\d{5,25}|reddit:[a-z0-9]{4,12})$/, key);
    assert.ok(['video', 'photo', 'text'].includes(e.kind), `${key} kind`);
    assert.match(e.resolved, /^\d{4}-\d{2}-\d{2}$/, `${key} resolved`);
    if (e.kind === 'text') assert.equal(e.thumb, null, `${key} text has no thumb`);
    if (e.thumb) {
      const host = new URL(e.thumb).hostname;
      assert.ok(host === 'pbs.twimg.com' || /(^|\.)redd\.it$/.test(host), `${key} host ${host}`);
      assert.equal(new URL(e.thumb).protocol, 'https:');
    }
  }
});
