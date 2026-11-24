// "Nearby" for a find. Pure and content-free so it can be tested on its own (scripts/test/nearby.test.ts).
// When the find and others carry pins, the closest pinned finds by straight-line pixel distance come first
// (pins share one pixel space, docs/MAP.md). Then finds that share the most specific region, then any shared
// region. The find itself is never listed; order within a tie keeps content order.

export type NearbyInput = { slug: string; region_ids: string[]; pin: { x: number; y: number } | null };
export type RegionDepth = (id: string) => number;
/** Whether a find lies in a region. Default: the region is one of its own; hubs.ts passes "or anywhere inside it". */
export type InRegion = (regionId: string, find: NearbyInput) => boolean;
const ownRegion: InRegion = (rid, x) => x.region_ids.includes(rid);

export type NearbyHit<T> = { find: T; reason: 'distance' | 'region'; distance: number | null; region: string | null };

export function nearby<T extends NearbyInput>(find: T, all: T[], depth: RegionDepth, n = 6, inRegion: InRegion = ownRegion): NearbyHit<T>[] {
  const others = all.filter((x) => x.slug !== find.slug);
  const hits: NearbyHit<T>[] = [];

  if (find.pin) {
    const p = find.pin;
    others
      .filter((x) => x.pin)
      .map((x, i) => ({ x, i, d: Math.hypot(x.pin!.x - p.x, x.pin!.y - p.y) }))
      .sort((a, b) => a.d - b.d || a.i - b.i)
      .forEach(({ x, d }) => hits.push({ find: x, reason: 'distance', distance: Math.round(d), region: null }));
  }

  // Region fallback: deepest shared region first (a district beats its county).
  const taken = new Set(hits.map((h) => h.find.slug));
  // The root region (depth 0, the whole state) is too broad to call anything near.
  const mine = find.region_ids.filter((r) => depth(r) > 0).sort((a, b) => depth(b) - depth(a));
  for (const rid of mine) {
    for (const x of others) {
      if (taken.has(x.slug) || !inRegion(rid, x)) continue;
      taken.add(x.slug);
      hits.push({ find: x, reason: 'region', distance: null, region: rid });
    }
  }
  return hits.slice(0, n);
}
