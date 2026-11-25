// Clip helpers with no content imports, so both the static pages (Clip.astro) and the map's React island use them.
// Clips are click to load: a thumbnail first, the creator's player only when tapped (decision 8: official embeds,
// never re-hosted). YouTube stills come straight from the URL; X and Reddit stills come from the cache that
// `pnpm clips:resolve` writes (content/generated/clip-media.json), and are hotlinked from the platform's own CDN.
export const youtubeId = (url: string) => {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
};
export const isShort = (url: string) => /\/shorts\//.test(url);
export const ytThumb = (id: string, size: 'mq' | 'hq' | 'maxres' = 'hq') => `https://i.ytimg.com/vi/${id}/${size}default.jpg`;
export const ytEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;

/** The post id of an X (or twitter.com) status URL, with or without a /video/1 or /photo/1 tail. */
export const xStatusId = (url: string) => {
  const m = url.match(/^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/(?:[\w]{1,15}|i\/web)\/status(?:es)?\/(\d{5,25})(?:[/?#]|$)/i);
  return m ? m[1] : null;
};

export type RedditPost = { sub: string; id: string; slug: string | null };
/** The subreddit, post id and title slug of a Reddit post URL (www, old, new or no subdomain). */
export const redditPost = (url: string): RedditPost | null => {
  const m = url.match(/^https?:\/\/(?:(?:www|old|new|np)\.)?reddit\.com\/r\/(\w{2,21})\/comments\/([a-z0-9]{4,12})(?:\/([^/?#]+))?/i);
  return m ? { sub: m[1], id: m[2].toLowerCase(), slug: m[3] ?? null } : null;
};

export type ClipRef = { platform: string; url: string };
/** The cache key of a clip: "youtube:<id>", "x:<id>" or "reddit:<id>". Null for a URL we cannot read. */
export const clipKey = (clip: ClipRef) => {
  if (clip.platform === 'youtube') { const id = youtubeId(clip.url); return id ? `youtube:${id}` : null; }
  if (clip.platform === 'x') { const id = xStatusId(clip.url); return id ? `x:${id}` : null; }
  if (clip.platform === 'reddit') { const p = redditPost(clip.url); return p ? `reddit:${p.id}` : null; }
  return null;
};

/**
 * One cached X or Reddit post (content/generated/clip-media.json). kind: video (a poster to show and a player to
 * load), photo (the first picture, linked to the post) or text (nothing to show; the link box stays).
 */
export type ClipMedia = { kind: 'video' | 'photo' | 'text'; thumb: string | null; width: number | null; height: number | null };

export type Theme = 'dark' | 'light';
export const xEmbed = (id: string, theme: Theme = 'dark') => `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=${theme}&dnt=true`;
// The iframe Reddit's own widgets.js builds from an embed blockquote: the post path on embed.reddit.com with
// embed=true. Its only theme value is dark; light is the default.
export const redditEmbed = (p: RedditPost, theme: Theme = 'dark') =>
  `https://embed.reddit.com/r/${p.sub}/comments/${p.id}/${p.slug ? `${p.slug}/` : ''}?embed=true&ref_source=embed&ref=share${theme === 'dark' ? '&theme=dark' : ''}`;

/** The same embed URL for another theme (the theme is chosen at tap time). YouTube URLs come back unchanged. */
export const embedForTheme = (url: string, theme: Theme) => {
  try {
    const u = new URL(url);
    if (u.hostname === 'platform.twitter.com') u.searchParams.set('theme', theme);
    else if (u.hostname === 'embed.reddit.com') { if (theme === 'dark') u.searchParams.set('theme', 'dark'); else u.searchParams.delete('theme'); }
    else return url;
    return u.toString();
  } catch { return url; }
};

/**
 * The player to load on tap, or null when the clip has none: an X or Reddit post that the cache does not know, or
 * that holds a photo or only text (those keep the link to the post). YouTube needs no cache.
 */
export const clipEmbed = (clip: ClipRef, media?: ClipMedia | null, theme: Theme = 'dark') => {
  if (clip.platform === 'youtube') { const id = youtubeId(clip.url); return id ? ytEmbed(id) : null; }
  if (media?.kind !== 'video') return null;
  if (clip.platform === 'x') { const id = xStatusId(clip.url); return id ? xEmbed(id, theme) : null; }
  if (clip.platform === 'reddit') { const p = redditPost(clip.url); return p ? redditEmbed(p, theme) : null; }
  return null;
};

/** Origins whose iframes may ask the clip frame to grow to their post's height (X and Reddit post cards). */
export const postEmbedOrigins = ['https://platform.twitter.com', 'https://embed.reddit.com'];

/**
 * The height a post embed asks for in a message, or null when the message is not a resize: X's Tweet.html sends
 * { "twttr.embed": { method: "twttr.private.resize", params: [{ height }] } }, Reddit's embed sends
 * { type: "resize.embed", data: <height> }. Either may arrive as a JSON string.
 */
export const postHeight = (data: unknown): number | null => {
  let d = data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return null; } }
  if (!d || typeof d !== 'object') return null;
  const o = d as { 'twttr.embed'?: { method?: string; params?: { height?: unknown }[] }; type?: string; data?: unknown };
  const h = o['twttr.embed']?.method === 'twttr.private.resize' ? Number(o['twttr.embed'].params?.[0]?.height) : o.type === 'resize.embed' ? Number(o.data) : NaN;
  return Number.isFinite(h) && h > 0 && h < 10000 ? h : null;
};

/** A still in three sizes: src (large), srcset, thumb (card size) and peek (the hero's hover card). */
export type Still = { src: string; srcset: string; thumb: string; peek: string };

// pbs.twimg.com serves named sizes of every picture: small 680, medium 1200, large 2048 (longest side).
const pbsSized = (url: string, name: 'small' | 'medium') => {
  try {
    const u = new URL(url);
    if (u.hostname !== 'pbs.twimg.com') return url;
    const ext = u.pathname.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase();
    if (ext) u.pathname = u.pathname.slice(0, -(ext.length + 1));
    u.search = '';
    u.searchParams.set('format', ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg');
    u.searchParams.set('name', name);
    return u.toString();
  } catch { return url; }
};

/**
 * The still of a clip, from YouTube's URL or the cached X or Reddit post, or null when there is none. YouTube
 * Shorts are skipped: their thumbnails are portrait and crop badly. Spoiler and mature gating is the caller's job.
 */
export const clipStill = (clip: ClipRef | null | undefined, media?: ClipMedia | null): Still | null => {
  if (!clip) return null;
  if (clip.platform === 'youtube') {
    if (isShort(clip.url)) return null;
    const id = youtubeId(clip.url);
    if (!id) return null;
    const base = `https://i.ytimg.com/vi/${id}`;
    return { src: `${base}/maxresdefault.jpg`, srcset: `${base}/mqdefault.jpg 320w, ${base}/maxresdefault.jpg 1280w`, thumb: `${base}/mqdefault.jpg`, peek: ytThumb(id, 'hq') };
  }
  if ((clip.platform !== 'x' && clip.platform !== 'reddit') || !media?.thumb || !clipKey(clip)) return null;
  if (clip.platform === 'x' && media.thumb.includes('pbs.twimg.com')) {
    const small = pbsSized(media.thumb, 'small'), medium = pbsSized(media.thumb, 'medium');
    return { src: medium, srcset: `${small} 680w, ${medium} 1200w`, thumb: small, peek: small };
  }
  return { src: media.thumb, srcset: `${media.thumb} 640w`, thumb: media.thumb, peek: media.thumb };
};
