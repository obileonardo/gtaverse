// Official GTA VI wallpapers outside the hero (owner answer Q1, 24 Nov 2026): used as-is in the home Explainers
// chapter and the footer, credited under each. The files are the hero's own deploy-time build (public/media/hero/,
// docs/HERO.md, git-ignored): nothing new is fetched or processed here, the pictures are only placed and cropped.
// Without the built files (CI, a fresh clone) this returns null and the place shows the sunrise glow instead.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Focus = { x: number; y: number };
type HeroManifest = { keyart?: { items: { alt: string; focus: Focus; widths: number[] }[] } };

const pub = join(process.cwd(), 'public');
const file = join(pub, 'media/hero/manifest.json');
const hero: HeroManifest | null = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;

export type Wallpaper = {
  alt: string;
  credit: string;
  /** object-position from the recorded focus, "55% 40%". */
  position: string;
  sources: { type: string; srcset: string }[];
  src: string;
};

/** The landscape wallpaper at `index` in content/hero-media.json's key art, or null when it is not built. */
export const wallpaper = (index: number): Wallpaper | null => {
  const item = hero?.keyart?.items[index];
  if (!item || !existsSync(join(pub, `media/hero/keyart-${index}-${item.widths[0]}.webp`))) return null;
  const p = `/media/hero/keyart-${index}`;
  const set = (ext: string) => item.widths.map((w) => `${p}-${w}.${ext} ${w}w`).join(', ');
  return {
    alt: item.alt,
    credit: 'Art: Rockstar Games',
    position: `${Math.round(item.focus.x * 100)}% ${Math.round(item.focus.y * 100)}%`,
    sources: [{ type: 'image/avif', srcset: set('avif') }, { type: 'image/webp', srcset: set('webp') }],
    src: `${p}-${item.widths[0]}.webp`,
  };
};
