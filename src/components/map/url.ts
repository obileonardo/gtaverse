// Map URL state (docs/MAP.md, "Links"). These round-trip, so a view can be shared and survives a reload:
//   ?q=ufo                 the search box
//   ?category=a,b          the type chips (ids from content/categories.json)
//   ?region=grassrivers    the region filter
//   ?view=3d               the 3D view (2d is the default and is left out)
//   ?find=<slug>           the open find
// Defaults are left out of the URL. Unknown values are ignored.
export type MapView = '2d' | '3d';
export type UrlState = { q: string; categories: string[]; region: string; view: MapView; find: string | null };

export function readUrl(known: { categories: Set<string>; regions: Set<string>; finds: Set<string> }): UrlState & { hasFilters: boolean } {
  const p = new URLSearchParams(location.search);
  const categories = (p.get('category') ?? '').split(',').map((s) => s.trim()).filter((c) => known.categories.has(c));
  const region = p.get('region') ?? '';
  const find = p.get('find');
  return {
    q: (p.get('q') ?? '').slice(0, 120),
    categories: [...new Set(categories)],
    region: known.regions.has(region) ? region : 'all',
    view: p.get('view') === '3d' ? '3d' : '2d',
    find: find && known.finds.has(find) ? find : null,
    hasFilters: p.has('q') || p.has('category') || p.has('region'),
  };
}

export function writeUrl(s: UrlState) {
  const url = new URL(location.href);
  const set = (k: string, v: string | null) => { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); };
  set('q', s.q.trim() || null);
  set('category', s.categories.length ? s.categories.join(',') : null);
  set('region', s.region !== 'all' ? s.region : null);
  set('view', s.view === '3d' ? '3d' : null);
  set('find', s.find);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}
