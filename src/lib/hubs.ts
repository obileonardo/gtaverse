// Region and category hubs (/regions/[id], /categories/[id]) and the Nearby list on find pages.
// A region hub lists the published finds in that region or any place inside it; the state itself (Leonida) gets
// no hub, since it would repeat /finds. A category hub lists that category's finds. Both list the GTAverse
// connections those finds link to. Everything is read from content; nothing is inferred.
import { finds, regions, categories, connectionById, regionById, type Find, type Region, type Category, type Connection } from './content';
import { nearby } from './nearby';

const childrenOf = (id: string) => regions.filter((r) => r.parent === id);

/** The region and every region inside it. */
export const subtree = (id: string): string[] => [id, ...childrenOf(id).flatMap((c) => subtree(c.id))];

/** Depth in the region tree: the state is 0, counties 1, and so on. */
export const regionDepth = (id: string): number => {
  let d = 0;
  let p = regionById(id)?.parent ?? null;
  while (p) { d++; p = regionById(p)?.parent ?? null; }
  return d;
};

/** Parents from the state down to the region's own parent. */
export const regionTrail = (id: string): Region[] => {
  const out: Region[] = [];
  let p = regionById(id)?.parent ?? null;
  while (p) { const r = regionById(p); if (!r) break; out.unshift(r); p = r.parent; }
  return out;
};

export const findsInRegion = (id: string): Find[] => {
  const ids = new Set(subtree(id));
  return finds.filter((f) => f.region_ids.some((r) => ids.has(r)));
};

export const findsInCategory = (id: string): Find[] => finds.filter((f) => f.category === id);

/** GTAverse connections linked from a set of finds, most linked first, then content order. */
export const connectionsFor = (list: Find[]): { connection: Connection; count: number }[] => {
  const counts = new Map<string, number>();
  for (const f of list) for (const c of f.related_connections ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ connection: connectionById(id), count }))
    .filter((x): x is { connection: Connection; count: number } => x.connection !== undefined)
    .sort((a, b) => b.count - a.count);
};

/** Regions that get a hub page: any region below the state with at least one published find inside it. */
export const regionHubs: Region[] = regions.filter((r) => r.parent !== null && findsInRegion(r.id).length > 0);
export const hasRegionHub = (id: string) => regionHubs.some((r) => r.id === id);

/** Categories that get a hub page: find categories with at least one published find. */
export const categoryHubs: Category[] = categories.filter((c) => c.kind === 'find' && findsInCategory(c.id).length > 0);
export const hasCategoryHub = (id: string) => categoryHubs.some((c) => c.id === id);

/** Child regions of a hub that have hubs of their own, with their find counts. */
export const childHubs = (id: string) => childrenOf(id).filter((r) => hasRegionHub(r.id)).map((r) => ({ region: r, count: findsInRegion(r.id).length }));

export const regionTypeLabel: Record<string, string> = {
  state: 'State', county: 'County', region: 'Region', district: 'District', place: 'Place', island: 'Island', water: 'Water', town: 'Town',
};

/** Nearby finds for a find page: by pin distance when pinned, else by shared region (src/lib/nearby.ts). */
export const nearbyFinds = (f: Find, n = 6) => nearby(f, finds, regionDepth, n);
