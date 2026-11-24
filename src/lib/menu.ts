// The header menu's art panel (decisions M1 to M4): one picture per main link and per game in the switcher.
// Games show Rockstar's official cover art, sized by `pnpm logos:fetch` into the git-ignored public/media/menu/
// (scripts/media/fetch-logos.mjs, recorded in content/games.json). Main links reuse the home hero's official
// GTA VI wallpapers (public/media/hero/, docs/HERO.md), and Map shows our own line drawing of the coast.
// Without the built files (CI, a fresh clone) an item has no art and the panel shows the sunrise glow.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Game } from './games';

type Source = { type: string; srcset: string; media?: string };
export type MenuArt = {
  key: string;          // the data-art-key of the links that show it
  caption: string;      // the panel's caption: what the picture is
  credit: string;       // who made it
  position: string;     // object-position in the tall desktop panel, from the recorded focus
  phonePosition: string; // object-position in the short phone banner
  sources: Source[];
  src: string;          // the fallback <img> source
};

const pub = join(process.cwd(), 'public');
type Focus = { x: number; y: number };
const readJson = <T>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : null);
type MenuManifest = { games: Record<string, { widths: number[]; focus: Focus }>; map: { file: string; credit: string } | null };
type HeroManifest = { keyart?: { items: { alt: string; focus: Focus; portrait_focus?: Focus; widths: number[]; portrait_widths: number[] }[] } };
const menu = readJson<MenuManifest>(join(pub, 'media/menu/manifest.json'));
const hero = readJson<HeroManifest>(join(pub, 'media/hero/manifest.json'));
const pct = (f: Focus) => `${Math.round(f.x * 100)}% ${Math.round(f.y * 100)}%`;
const set = (prefix: string, widths: number[], ext: string) => widths.map((w) => `${prefix}-${w}.${ext} ${w}w`).join(', ');

/** A game's cover, or null when the build has not fetched it. */
export const gameArt = (g: Game): MenuArt | null => {
  const m = menu?.games[g.id];
  if (!m || !existsSync(join(pub, `media/menu/${g.id}-${m.widths[0]}.webp`))) return null;
  const prefix = `/media/menu/${g.id}`;
  return {
    key: g.id,
    caption: g.name,
    credit: 'Art: Rockstar Games',
    position: pct(m.focus),
    phonePosition: pct(m.focus),
    sources: [{ type: 'image/avif', srcset: set(prefix, m.widths, 'avif') }, { type: 'image/webp', srcset: set(prefix, m.widths, 'webp') }],
    src: `${prefix}-${m.widths[0]}.webp`,
  };
};

// Which hero wallpaper each main link shows (indexes into content/hero-media.json keyart). Map has its own drawing.
const LINK_KEYART: Record<string, number> = { '/': 0, '/finds': 1, '/explainers': 2, '/gtaverse': 3 };

/** A main link's picture: a portrait wallpaper in the tall desktop panel, the landscape one in the phone banner. */
export const linkArt = (href: string): MenuArt | null => {
  if (href === '/map') {
    if (!menu?.map || !existsSync(join(pub, 'media/menu', menu.map.file))) return null;
    const src = `/media/menu/${menu.map.file}`;
    return { key: href, caption: 'Leonida, traced from the official map', credit: menu.map.credit, position: '50% 45%', phonePosition: '50% 62%', sources: [], src };
  }
  const i = LINK_KEYART[href];
  const item = i === undefined ? undefined : hero?.keyart?.items[i];
  if (!item || !existsSync(join(pub, `media/hero/keyart-${i}-${item.widths[0]}.webp`))) return null;
  const p = `/media/hero/keyart-${i}`;
  const portrait = `${p}-portrait`;
  const phone = '(max-width: 1023px)';
  return {
    key: href,
    caption: item.alt,
    credit: 'Art: Rockstar Games',
    position: pct(item.portrait_focus ?? item.focus),
    phonePosition: pct(item.focus),
    sources: [
      { type: 'image/avif', srcset: set(p, item.widths, 'avif'), media: phone },
      { type: 'image/webp', srcset: set(p, item.widths, 'webp'), media: phone },
      { type: 'image/avif', srcset: set(portrait, item.portrait_widths, 'avif') },
      { type: 'image/webp', srcset: set(portrait, item.portrait_widths, 'webp') },
    ],
    src: `${portrait}-${item.portrait_widths[0]}.webp`,
  };
};
