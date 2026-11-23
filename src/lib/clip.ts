// Clip helpers with no content imports, so both the static pages (Clip.astro) and the map's React island use them.
// Clips are click to load: a thumbnail first, the creator's player (youtube-nocookie) only when tapped.
export const youtubeId = (url: string) => {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
};
export const isShort = (url: string) => /\/shorts\//.test(url);
export const ytThumb = (id: string, size: 'mq' | 'hq' | 'maxres' = 'hq') => `https://i.ytimg.com/vi/${id}/${size}default.jpg`;
export const ytEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
