// Data the map island receives from src/pages/map.astro, and the pure helpers that filter it.
// Kept free of content imports so the island bundle carries only what the map needs.
import type { IconName } from '../ui/icons';

export type MapFind = {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string; // singular, for one find
  icon: IconName;
  regionIds: string[]; // the find's regions and every region above them, for the region filter
  regionLabel: string;
  verification: string;
  spoiler: boolean;
  mature: boolean;
  pin: { x: number; y: number } | null;
  pinAccuracy: string | null;
  summary: string;
  where: string | null;
  still: string | null; // YouTube thumbnail of the creator's own post (never a Short)
  clip: { platform: string; url: string; creator: string | null; yt: string | null } | null;
  sources: { type: string; url: string; creator: string | null }[];
  finder: { handle: string; platform: string; url: string | null } | null;
  updated: string | null;
};

export type MapCategory = { id: string; label: string; icon: IconName; count: number };
export type MapRegion = { id: string; name: string };
export type MapMeta = { width: number; height: number; maxZoom: number; tileUrl: string; attribution: string; frame: { x0: number; y0: number; x1: number; y1: number }; rows: { id: string; y0: number; y1: number }[]; columns: { id: string; x0: number; x1: number }[] };

export type Filters = {
  categories: string[];
  region: string; // 'all' or a region id
  verification: string; // 'all' or a verification level
  hasClip: boolean;
  spoilers: boolean;
  mature: boolean;
};

export const defaultFilters: Filters = { categories: [], region: 'all', verification: 'all', hasClip: false, spoilers: false, mature: false };

const STORE = 'vf-map-filters';
export const loadFilters = (): Filters => {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return defaultFilters;
    const v = JSON.parse(raw);
    return {
      categories: Array.isArray(v.categories) ? v.categories.filter((c: unknown) => typeof c === 'string') : [],
      region: typeof v.region === 'string' ? v.region : 'all',
      verification: typeof v.verification === 'string' ? v.verification : 'all',
      hasClip: v.hasClip === true,
      spoilers: v.spoilers === true,
      mature: v.mature === true,
    };
  } catch {
    return defaultFilters; // private mode or blocked storage: the defaults apply for this visit
  }
};
export const saveFilters = (f: Filters) => {
  try { localStorage.setItem(STORE, JSON.stringify(f)); } catch { /* storage blocked: the choice lasts for this page only */ }
};

type Skip = keyof Filters | 'search' | null;
/** Does a find pass the filters? `skip` leaves one group out, for counts beside that group's options. */
export const passes = (f: MapFind, flt: Filters, search: string, skip: Skip = null) => {
  if (skip !== 'categories' && flt.categories.length && !flt.categories.includes(f.category)) return false;
  if (skip !== 'region' && flt.region !== 'all' && !f.regionIds.includes(flt.region)) return false;
  if (skip !== 'verification' && flt.verification !== 'all' && f.verification !== flt.verification) return false;
  if (skip !== 'hasClip' && flt.hasClip && !f.clip) return false;
  if (skip !== 'spoilers' && !flt.spoilers && f.spoiler) return false;
  if (skip !== 'mature' && !flt.mature && f.mature) return false;
  if (skip !== 'search' && search) {
    const q = search.toLowerCase();
    if (!`${f.title} ${f.categoryLabel} ${f.regionLabel} ${f.summary}`.toLowerCase().includes(q)) return false;
  }
  return true;
};

export const activeFilterCount = (flt: Filters) =>
  flt.categories.length + (flt.region !== 'all' ? 1 : 0) + (flt.verification !== 'all' ? 1 : 0) + (flt.hasClip ? 1 : 0) + (flt.spoilers ? 1 : 0) + (flt.mature ? 1 : 0);

export const verificationLabels: Record<string, string> = {
  'multi-source': 'Multi-source',
  'single-source': 'Single source',
  rumor: 'Rumour',
  debunked: 'Debunked',
};

export const sourceIcon = (type: string): IconName =>
  type === 'youtube' || type === 'video' ? 'clip' : type === 'wiki' ? 'explainers' : type === 'article' || type === 'news' ? 'article' : 'chat';

export const platformLabel = (p: string) => ({ youtube: 'YouTube', x: 'X', reddit: 'Reddit', tiktok: 'TikTok', twitch: 'Twitch', discord: 'Discord', instagram: 'Instagram' }[p] ?? p.charAt(0).toUpperCase() + p.slice(1));

export const findUrl = (slug: string) => `/finds/${slug}`;

export const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

/** The printed grid cell (row letter, column number) a pin sits in, for example F5. */
export const cellOf = (pin: { x: number; y: number } | null, meta: MapMeta) => {
  if (!pin) return null;
  const r = meta.rows.find((row) => pin.y >= row.y0 && pin.y < row.y1);
  const c = meta.columns.find((col) => pin.x >= col.x0 && pin.x < col.x1);
  return r && c ? `${r.id}${c.id}` : null;
};

export const accuracyLabels: Record<string, string> = { exact: 'Exact spot', landmark: 'At a landmark', area: 'Area only' };
