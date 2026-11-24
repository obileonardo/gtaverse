// What the home page's chapters show (docs/DESIGN-SYSTEM.md, "Home chapters"). Every number and list here is
// computed from published content at build time; nothing is typed in. The hero's own pick (the first five safe
// finds) stays in src/pages/index.astro, which passes it in so no find is shown twice where that matters.
import collectiblesRaw from '../../content/collectibles.json';
import { finds, categories, regionById, type Find, type Source } from './content';
import { findStill, showcaseable, categorySingular, categoryChipLabel, regionLabel } from './media';
import { platformName } from './finds';
import { addedThisWeek } from './feed';

/** Finds without a spoiler or mature flag: their summary and (if they have one) their still may show. */
export const isSafe = (f: Find) => !f.spoiler && !f.mature;

// ---------- 001 Spotlight ----------

export type SpotSource = { type: 'video' | 'article' | 'wiki'; name: string };
const sourceKind = (s: Source): SpotSource['type'] | null =>
  s.type === 'youtube' || s.type === 'x' || s.type === 'tiktok' || s.type === 'reddit' ? 'video' : s.type === 'article' ? 'article' : s.type === 'wiki' ? 'wiki' : null;
/** "Jake Fillery (GameRant)" reads as the outlet, "GameRant"; a channel or wiki keeps its name. */
const outletName = (s: Source) => s.creator?.match(/\(([^)]+)\)\s*$/)?.[1]?.trim() ?? s.creator ?? '';

/**
 * Up to three of a find's real sources for the Spotlight's right column: one article, one video other than the clip
 * and one wiki first (so the column shows the spread), then the rest in content order.
 */
export function spotSources(f: Find, n = 3): SpotSource[] {
  const usable = f.sources.filter((s) => sourceKind(s) && s.url !== f.clip?.url);
  const firstOf = (k: SpotSource['type']) => usable.find((s) => sourceKind(s) === k);
  const picked = [firstOf('article'), firstOf('video'), firstOf('wiki')].filter((s): s is Source => Boolean(s));
  for (const s of usable) if (picked.length < n && !picked.includes(s)) picked.push(s);
  return picked.slice(0, n).map((s) => ({ type: sourceKind(s)!, name: outletName(s) }));
}

/** The Spotlight: six safe finds with a still that the hero does not already show, in content order. */
export const spotlightFinds = (hero: Find[], n = 6) => finds.filter((f) => showcaseable(f) && !hero.includes(f)).slice(0, n);

// ---------- 002 Selected finds ----------

export type Filter = { id: string; label: string; count: number; finds: Find[] };

/**
 * The filter row and what each filter shows: "All" then each category with a safe find. Each filter lists up to six
 * safe finds, those with a still first. "All" leads with the finds the hero and the Spotlight have not shown yet.
 */
export function selectedFilters(shown: Find[], n = 6): Filter[] {
  const safe = finds.filter(isSafe);
  const order = (list: Find[]) => [...list.filter((f) => findStill(f)), ...list.filter((f) => !findStill(f))];
  const all = order([...safe.filter((f) => !shown.includes(f)), ...safe.filter((f) => shown.includes(f))]).slice(0, n);
  const out: Filter[] = [{ id: 'all', label: 'All', count: safe.length, finds: all }];
  for (const c of categories.filter((c) => c.kind === 'find')) {
    const inCat = safe.filter((f) => f.category === c.id);
    if (inCat.length) out.push({ id: c.id, label: categoryChipLabel(c.id), count: inCat.length, finds: order(inCat).slice(0, n) });
  }
  return out;
}

// ---------- 003 New this week ----------

/** The newest finds (as of this build) not already shown above. */
export const newThisWeek = (shown: Find[], n = 12) => addedThisWeek().filter((f) => !shown.includes(f)).slice(0, n);

/** "1 day ago" from a find's added_at, counted at build time (the site is static). */
export function ageLabel(d: string | undefined, today = new Date()) {
  if (!d) return '';
  const days = Math.max(0, Math.floor((Date.parse(today.toISOString().slice(0, 10)) - Date.parse(d)) / 86_400_000));
  return days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

// ---------- 004 Watch the clips ----------

/** Every safe find with a YouTube still, in content order: the clips the chapter can play. */
export const clipFinds = () => finds.filter(showcaseable);

// ---------- 006 By type ----------

export type TypeEntry = { id: string; name: string; label: string; description: string; count: number; multi: number; topRegion: string | null; leads: Find[] };

/** One entry per find category: its counts, the region with most of its finds and up to five safe stills. */
export function typeEntries(): TypeEntry[] {
  return categories
    .filter((c) => c.kind === 'find')
    .map((c) => {
      const all = finds.filter((f) => f.category === c.id);
      const tally = new Map<string, number>();
      for (const f of all) if (f.region_ids[0]) tally.set(f.region_ids[0], (tally.get(f.region_ids[0]) ?? 0) + 1);
      const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        id: c.id,
        name: categoryChipLabel(c.id),
        label: c.label,
        description: c.description,
        count: all.length,
        multi: all.filter((f) => f.verification === 'multi-source').length,
        topRegion: top && top[1] > 1 ? regionById(top[0])?.name ?? null : null,
        leads: all.filter(showcaseable).slice(0, 5),
      };
    })
    .filter((t) => t.count > 0);
}

// ---------- 007 The map ----------

export type RegionRow = { id: string; name: string; parent: string; count: number; pinned: number };

/** The regions with the most finds (counting every region a find lists), with the parent region's name. */
export function topRegions(n = 4): RegionRow[] {
  const tally = new Map<string, number>();
  for (const f of finds) for (const r of f.region_ids) tally.set(r, (tally.get(r) ?? 0) + 1);
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([id, count]) => {
      const r = regionById(id);
      const parent = r?.parent ? regionById(r.parent)?.name ?? '' : '';
      return { id, name: r?.name ?? id, parent, count, pinned: finds.filter((f) => f.pin && f.region_ids.includes(id)).length };
    });
}

// ---------- 007 and 008: collectible layers ----------

type CollectibleItem = { id: string; layer: string; number: number; pin: { x: number; y: number }; source: { name: string; url: string; via?: string } };
type CollectibleLayer = { layer: string; marked: number; total: number; transcribed: number; source_image: string };
const collectibles = collectiblesRaw as unknown as { layers: CollectibleLayer[]; items: CollectibleItem[] };

/** Collectible positions in map image pixels (content/collectibles.json, Game Checklists' work, credited). */
export const collectiblePins = collectibles.items.map((i) => ({ layer: i.layer, x: i.pin.x, y: i.pin.y }));

export type LayerCard = { id: string; label: string; marked: number; total: number; source: string; via: string };

/** Collectible layers, most locations on the map first. */
export function layerCards(): LayerCard[] {
  return collectibles.layers
    .map((l) => {
      const first = collectibles.items.find((i) => i.layer === l.layer);
      return {
        id: l.layer,
        label: categories.find((c) => c.id === l.layer)?.label ?? l.layer,
        marked: l.marked,
        total: l.total,
        source: first?.source.name ?? 'Game Checklists',
        via: first?.source.via ?? l.source_image,
      };
    })
    .sort((a, b) => b.marked - a.marked);
}
export const collectibleTotal = collectibles.items.length;

// Helpers the chapters share.
export { categorySingular, regionLabel, platformName };
export const pad3 = (n: number) => String(n).padStart(3, '0');
