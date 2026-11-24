// The map screen. Desktop is GetYourGuide's list beside the map; phone is Rodeo's full map with chips above a
// bottom search pill. Every find opens from the list, so the screen works before any pin is placed.
// Spec: the taste board's analysis/direction-map.md. Styles: ./map.css.
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapCanvas, type MapApi } from './MapCanvas';
import type { Map3DApi } from './three/Map3D';
import { useFound } from './found';
import { readUrl, writeUrl, type MapView } from './url';
import { searchRank } from './search';
import { Sheet, type SnapPoint } from './Sheet';
import { DrawerContent, SheetContent } from './FindDetail';
import { BasemapMenu, FilterMenu } from './Menus';
import { Button, Chip, Icon, Tabs, Verification } from './ui';
import { activeFilterCount, defaultFilters, findUrl, loadFilters, passes, saveFilters, type Filters, type MapCategory, type MapFind, type MapMeta, type MapRegion } from './types';
import './map.css';

// The 3D view (docs/MAP-3D.md) and Three.js load only when the visitor opens 3D: a separate chunk.
const Map3D = lazy(() => import('./three/Map3D'));

type Props = { finds: MapFind[]; categories: MapCategory[]; regions: MapRegion[]; meta: MapMeta };
type Toast = { id: number; icon: 'hand' | 'link' | 'check'; text: string; persist?: boolean } | null;

const PHONE = '(max-width: 767px)';
const VIEW_STORE = 'vf-map-view';
const HINT_STORE = 'vf-map-hint';
const readJson = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; } };
const writeJson = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked: lasts for this page only */ } };

const headerBottom = () => (typeof document !== 'undefined' ? document.querySelector('.island')?.getBoundingClientRect().bottom ?? 56 : 56);

function Media({ find, size }: { find: MapFind; size: 'row' | 'card' | 'popup' }) {
  const art = find.still && !find.spoiler && !find.mature;
  return (
    <span className={`media media--${size}`} aria-hidden="true">
      {art ? <img src={find.still!} alt="" loading="lazy" decoding="async" /> : <span className="media__glow"><span className="media__kind">{find.categoryLabel}</span></span>}
    </span>
  );
}

function Row({ find, selected, onOpen, onHover }: { find: MapFind; selected: boolean; onOpen: (f: MapFind, el: HTMLElement) => void; onHover: (slug: string | null) => void }) {
  return (
    <li className="frow-item">
      <a
        className="frow"
        href={findUrl(find.slug)}
        aria-current={selected ? 'true' : undefined}
        data-slug={find.slug}
        onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); onOpen(find, e.currentTarget); }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(find.slug)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
      >
        <Media find={find} size="row" />
        <span className="frow__text">
          <span className="frow__kicker">{find.regionLabel}</span>
          <h2 className="frow__title">{find.title}</h2>
          <span className="frow__meta">
            <Icon name={find.icon} size={16} />
            {find.categoryLabel}
            {find.clip && <><span aria-hidden="true">·</span><Icon name="clip" size={16} />Clip</>}
          </span>
          <span className="frow__foot">
            <Verification level={find.verification} />
            {find.pin && <span className="frow__pinned"><Icon name="pin" size={16} />On the map</span>}
          </span>
        </span>
      </a>
    </li>
  );
}

export default function MapApp({ finds, categories, regions, meta }: Props) {
  const [phone, setPhone] = useState(false);
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tab, setTab] = useState('list');
  const [menu, setMenu] = useState<'filters' | 'basemap' | null>(null);
  const [view, setView] = useState<{ basemap: 'official' | 'muted'; grid: boolean }>({ basemap: 'official', grid: false });
  const [listSnap, setListSnap] = useState('closed');
  const [findSnap, setFindSnap] = useState('closed');
  const [toast, setToast] = useState<Toast>(null);
  const [instant, setInstant] = useState(false);
  const [, setTick] = useState(0);
  const [mode, setMode] = useState<MapView>('2d'); // 2D or 3D (?view=3d)
  const [start3d, setStart3d] = useState<{ x: number; y: number; zoom: number } | null>(null);
  const [open3dInstant, setOpen3dInstant] = useState(false); // opened from the keyboard: no tilt-in animation
  const { found, toggle: toggleFound, merge: mergeFound } = useFound();

  const api = useRef<MapApi>(null);
  const api3 = useRef<Map3DApi>(null);
  const mapApi = (): MapApi | null => (mode === '3d' ? api3.current : api.current);
  const opener = useRef<HTMLElement | null>(null);
  const keyboard = useRef(false);
  const controls = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef(0);

  // Platform, saved filters and view, the deep link. All after hydration so the static HTML matches.
  useEffect(() => {
    const mq = matchMedia(PHONE);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    // A link with ?q, ?category or ?region shows exactly that view (from the defaults, so spoilers stay hidden);
    // otherwise the filters saved on this device apply (url.ts).
    const url = readUrl({ categories: new Set(categories.map((c) => c.id)), regions: new Set(regions.map((r) => r.id)), finds: new Set(finds.map((f) => f.slug)) });
    if (url.hasFilters) { setFiltersState({ ...defaultFilters, categories: url.categories, region: url.region }); setSearch(url.q); }
    else setFiltersState(loadFilters());
    setView(readJson(VIEW_STORE, { basemap: 'official' as const, grid: false }));
    if (url.find) { setSelected(url.find); setFindSnap('full'); }
    if (url.view === '3d') setMode('3d');
    const kd = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') keyboard.current = true; };
    const pd = () => { keyboard.current = false; };
    addEventListener('keydown', kd, true);
    addEventListener('pointerdown', pd, true);
    return () => { mq.removeEventListener('change', on); removeEventListener('keydown', kd, true); removeEventListener('pointerdown', pd, true); };
  }, []);

  const setFilters = (f: Filters) => { setFiltersState(f); saveFilters(f); };
  const setViewSaved = (v: typeof view) => { setView(v); writeJson(VIEW_STORE, v); };
  const resetFilters = () => { setFilters(defaultFilters); setSearch(''); };

  const visible = useMemo(() => {
    const list = finds.filter((f) => passes(f, filters, search, null, found));
    if (!search.trim()) return list;
    const rank = new Map(list.map((f) => [f.slug, searchRank(f, search)]));
    return [...list].sort((x, y) => rank.get(y.slug)! - rank.get(x.slug)!); // best matches first (search.ts), stable
  }, [finds, filters, search, found]);
  const pinned = useMemo(() => visible.filter((f) => f.pin), [visible]);
  const pinnedTotal = useMemo(() => finds.filter((f) => f.pin).length, [finds]);
  const current = selected ? finds.find((f) => f.slug === selected) ?? null : null;
  const lastFind = useRef<MapFind | null>(null);
  if (current) lastFind.current = current;
  const previewFind = preview ? finds.find((f) => f.slug === preview) ?? null : null;

  const showToast = useCallback((t: NonNullable<Toast>, ms = 2600) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    if (!t.persist) toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  // First visit hint (Tide Guide toast). With no pins yet it says so and points at the list.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(HINT_STORE) === '1'; } catch { /* no storage: show it this visit */ }
    if (seen) return;
    const t = window.setTimeout(() => showToast({ id: 1, icon: 'hand', text: pinnedTotal ? 'Tap a pin to open a find, or pick one from the list.' : 'Pins are going on by hand. Every find is in the list.', persist: true }), 900);
    return () => clearTimeout(t);
  }, []);
  const dismissToast = () => {
    if (toast?.id === 1) { try { localStorage.setItem(HINT_STORE, '1'); } catch { /* ignore */ } }
    setToast(null);
  };

  // Keep the URL in step with the view, so it can be shared and survives a reload (url.ts): q, category, region,
  // view and find. Skipped until the first read so the static page never wipes an incoming link.
  const urlReady = useRef(false);
  useEffect(() => {
    if (!urlReady.current) { urlReady.current = true; return; }
    writeUrl({ q: search, categories: filters.categories, region: filters.region, view: mode, find: selected });
  }, [search, filters.categories, filters.region, mode, selected]);

  // 2D and 3D: 3D opens on the spot and scale the 2D map shows, and hands its spot back when it closes.
  const switchMode = (next: MapView) => {
    if (next === mode) return;
    setPreview(null);
    if (next === '3d') { setStart3d(api.current?.getView() ?? null); setOpen3dInstant(keyboard.current); setMode('3d'); return; }
    const back = api3.current;
    const finish = () => {
      const v = back?.getView();
      setMode('2d');
      if (v) requestAnimationFrame(() => api.current?.setView(v));
    };
    if (back && !keyboard.current) back.close(finish); else finish();
  };

  const fly = (f: MapFind, sheetOpen: boolean) => {
    if (!f.pin) return;
    const stage = document.querySelector('.map-stage');
    const h = stage?.clientHeight ?? 800;
    if (phone) mapApi()?.flyTo(f, { offsetY: sheetOpen ? h * 0.22 : 0 });
    else mapApi()?.flyTo(f, { offsetX: 188 });
  };

  const openFind = (f: MapFind, from?: HTMLElement | null) => {
    opener.current = from ?? (document.activeElement as HTMLElement | null);
    setInstant(keyboard.current);
    setPreview(null);
    setSelected(f.slug);
    setFindSnap('full');
    fly(f, true);
    if (!phone) requestAnimationFrame(() => drawerRef.current?.focus({ preventScroll: true }));
  };
  const closeFind = () => {
    setInstant(keyboard.current);
    setSelected(null);
    setFindSnap('closed');
    const back = opener.current;
    if (back && back.isConnected) requestAnimationFrame(() => back.focus({ preventScroll: true }));
  };

  // Escape: the open menu first (handled by the menu), then the find, then the preview.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || menu) return;
      if (document.querySelector('[data-menu="open"]')) return; // the site menu has it
      if (selected) { e.preventDefault(); closeFind(); }
      else if (preview) { e.preventDefault(); const back = opener.current; setPreview(null); back?.focus({ preventScroll: true }); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const onPin = (slug: string, el: HTMLElement) => {
    const f = finds.find((x) => x.slug === slug);
    if (!f) return;
    opener.current = el;
    if (selected === slug) return;
    setSelected(null);
    setFindSnap('closed');
    setPreview(slug);
  };

  const copyLink = async (f: MapFind) => {
    const url = `${location.origin}/map?find=${f.slug}`;
    try { await navigator.clipboard.writeText(url); showToast({ id: Date.now(), icon: 'link', text: 'Link copied' }); }
    catch { showToast({ id: Date.now(), icon: 'link', text: url }, 5000); }
  };
  const share = async (f: MapFind) => {
    const url = `${location.origin}/map?find=${f.slug}`;
    if (navigator.share) { try { await navigator.share({ title: f.title, url }); return; } catch { return; } }
    copyLink(f);
  };
  const showOnMap = (f: MapFind) => {
    if (!f.pin) return;
    if (phone) { setFindSnap('medium'); fly(f, true); }
    else fly(f, true);
  };

  const toggleCategory = (id: string) => {
    const has = filters.categories.includes(id);
    setFilters({ ...filters, categories: has ? filters.categories.filter((c) => c !== id) : [...filters.categories, id] });
  };

  // Sheets (phone). Snap tops are measured from the map's top edge; the top snap sits just under the header.
  const listSnaps = useMemo<SnapPoint[]>(() => [
    { id: 'full', top: () => headerBottom() + 8 },
    { id: 'half', top: (h) => Math.round(h * 0.48) },
    { id: 'closed', top: (h) => h },
  ], []);
  const findSnaps = useMemo<SnapPoint[]>(() => [
    { id: 'full', top: () => headerBottom() + 8 },
    { id: 'medium', top: (h) => Math.round(h * 0.46) },
    { id: 'closed', top: (h) => h },
  ], []);
  const onFindSnap = (id: string) => { setFindSnap(id); if (id === 'closed') closeFind(); };

  // Desktop popup position at the pin (Airbnb), recomputed as the map moves.
  const popupAt = !phone && previewFind ? mapApi()?.pointOf(previewFind) ?? null : null;
  useLayoutEffect(() => { placePopup(popupAt); });
  // Keep the popup on its pin while the map moves: written straight to the element, no re-render per frame.
  const popupRef = useRef<HTMLDivElement>(null);
  const placePopup = (pt: { x: number; y: number } | null) => {
    const el = popupRef.current;
    if (!el || !pt) return;
    const w = document.querySelector('.map-stage')?.clientWidth ?? 0;
    const x = Math.min(Math.max(pt.x, 176), Math.max(176, w - 176));
    el.style.translate = `${x}px ${pt.y}px`;
    el.dataset.below = String(pt.y < 320);
  };
  const onMove = () => { if (previewFind && !phone) placePopup(mapApi()?.pointOf(previewFind) ?? null); };

  const filterCount = activeFilterCount({ ...filters, categories: [] });
  const fitPadding = phone ? { top: 130, right: 16, bottom: 150, left: 16 } : { top: 72, right: 16, bottom: 16, left: 16 };
  const shown = lastFind.current;
  const countText = `${visible.length} ${visible.length === 1 ? 'find' : 'finds'}`;
  const pinText = pinned.length ? `${pinned.length} on the map` : 'none pinned yet';

  const chipRow = (touch: boolean) => (
    <div className={`chips${touch ? ' chips--touch' : ''}`} ref={touch ? undefined : chipsRef} role="group" aria-label="Find types">
      {categories.map((c) => (
        <Chip key={c.id} icon={c.icon} glass={touch} touch={touch} selected={filters.categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>{c.label}</Chip>
      ))}
    </div>
  );

  const empty = (
    <div className="map-empty">
      <span className="map-empty__icon"><Icon name="filter" size={24} /></span>
      <p className="map-empty__title">No finds match</p>
      <p className="map-empty__text">Try fewer filters{search ? ' or another search' : ''}.</p>
      <Button variant="secondary" size="m" onClick={resetFilters}>Reset filters</Button>
    </div>
  );

  const list = (
    <ul className="frows" role="list">
      {visible.map((f) => <Row key={f.slug} find={f} selected={f.slug === selected} onOpen={openFind} onHover={setHovered} />)}
    </ul>
  );

  const legend = (
    <div className="legend">
      <p className="legend__about">The official map of Leonida with every find we have checked. Pins go on by hand from each find's clip, so {pinnedTotal ? `${pinnedTotal} of ${finds.length}` : `none of the ${finds.length}`} finds {pinnedTotal === 1 ? 'is' : 'are'} pinned so far. Every find is in the list.</p>
      <h3 className="legend__h">Pins</h3>
      <ul className="legend__rows" role="list">
        <li><span className="legend__key"><span className="pin pin--photo pin--key"><span className="pin__thumb" /></span></span>A find with a clip</li>
        <li><span className="legend__key"><span className="pin pin--value pin--key"><Icon name="egg" size={14} /></span></span>A find</li>
        <li><span className="legend__key"><span className="pin pin--group pin--key"><span className="pin__seg"><span className="pin__segicon"><Icon name="egg" size={12} /></span><b>3</b></span></span></span>Finds close together, by type</li>
      </ul>
      <h3 className="legend__h">Types</h3>
      <ul className="legend__rows" role="list">
        {categories.map((c) => <li key={c.id}><span className="legend__key"><Icon name={c.icon} size={20} /></span>{c.label}<span className="legend__count tabular">{c.count}</span></li>)}
      </ul>
    </div>
  );

  return (
    <section className={`map-app${phone ? ' is-phone' : ''}`} data-list={listSnap} data-find={selected ? findSnap : 'closed'} data-view={mode} aria-label="Map of Leonida">
      <h1 className="sr-only map-h1">Map of Leonida</h1>

      {/* The list: GetYourGuide's column on desktop, a sheet on phone. */}
      <Sheet snaps={listSnaps} snap={listSnap} onSnap={setListSnap} closedId="closed" enabled={phone} inert={phone && listSnap === 'closed'} className="map-list" label="Finds">
        {phone ? (
          <>
            <div className="map-list__handle" data-sheet-handle>
              <span className="grabber" aria-hidden="true" />
              <p className="map-list__count" aria-live="polite"><span className="tabular">{countText}</span></p>
            </div>
            <div className="map-list__scroll">{visible.length ? list : empty}</div>
          </>
        ) : (
          <Tabs id="maplist" label="Map panel" selected={tab} onSelect={setTab} tabs={[{ id: 'list', label: 'List' }, { id: 'legend', label: 'Legend' }]}>
            {(t) => t === 'list' ? (
              <>
                <div className="chips-wrap">
                  {chipRow(false)}
                  <Button variant="quiet" size="s" icon="chevron-right" iconOnly label="More types" className="chips-more" onClick={() => { const c = chipsRef.current; if (!c) return; const end = c.scrollLeft + c.clientWidth >= c.scrollWidth - 4; c.scrollTo({ left: end ? 0 : c.scrollLeft + 240, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }} />
                </div>
                <p className="map-list__summary caption" aria-live="polite"><span className="tabular">{countText}</span>, {pinText}</p>
                {visible.length ? list : empty}
              </>
            ) : legend}
          </Tabs>
        )}
      </Sheet>

      {/* The map */}
      <div className="map-stage">
        <MapCanvas ref={api} meta={meta} finds={pinned} selected={selected ?? preview} hovered={hovered} phone={phone} basemap={view.basemap} grid={view.grid} fitPadding={fitPadding} onPin={onPin} onMove={onMove} onReady={() => setTick((t) => t + 1)} />
        {mode === '3d' && (
          <Suspense fallback={<div className="map3d map3d--loading" role="status"><p className="map3d__fail">Loading the 3D map</p></div>}>
            <Map3D ref={api3} meta={meta} finds={pinned} selected={selected ?? preview} hovered={hovered} basemap={view.basemap} start={start3d} instant={open3dInstant} onPin={onPin} onMove={onMove} onReady={() => setTick((t) => t + 1)} />
          </Suspense>
        )}

        <div className="map-controls" ref={controls}>
          <span className="map-ctrl-wrap">
            <Button variant="glass" size="m" icon="filter" iconOnly label={filterCount ? `Filters, ${filterCount} on` : 'Filters'} aria-expanded={menu === 'filters'} aria-controls="map-filters" className="map-ctrl" onClick={() => setMenu(menu === 'filters' ? null : 'filters')} data-ref="filters" />
            {filterCount > 0 && <span className="map-ctrl__badge tabular" aria-hidden="true">{filterCount}</span>}
          </span>
          <Button variant="glass" size="m" className="map-ctrl map-ctrl--3d" aria-pressed={mode === '3d'} aria-label="3D view" title="3D view" onClick={() => switchMode(mode === '3d' ? '2d' : '3d')}>3D</Button>
          <Button variant="glass" size="m" icon="layers" iconOnly label="Basemap" aria-expanded={menu === 'basemap'} aria-controls="map-basemap" className="map-ctrl" onClick={() => setMenu(menu === 'basemap' ? null : 'basemap')} data-ref="basemap" />
          <FilterMenu open={menu === 'filters'} onClose={(restore) => { setMenu(null); if (restore) document.querySelector<HTMLElement>('[data-ref="filters"]')?.focus(); }} anchor={controls} finds={finds} filters={filters} setFilters={setFilters} regions={regions} search={search} onReset={resetFilters} categories={categories} found={found} onImport={mergeFound} />
          <BasemapMenu open={menu === 'basemap'} onClose={(restore) => { setMenu(null); if (restore) document.querySelector<HTMLElement>('[data-ref="basemap"]')?.focus(); }} anchor={controls} basemap={view.basemap} setBasemap={(b) => setViewSaved({ ...view, basemap: b })} grid={view.grid} setGrid={(g) => setViewSaved({ ...view, grid: g })} />
        </div>

        <div className="map-zoom" role="group" aria-label="Zoom">
          <button type="button" className="map-zoom__btn" aria-label="Zoom in" onClick={() => mapApi()?.zoomBy(0.5)}><Icon name="plus" size={18} /></button>
          <button type="button" className="map-zoom__btn" aria-label="Zoom out" onClick={() => mapApi()?.zoomBy(-0.5)}><Icon name="minus" size={18} /></button>
        </div>

        <p className="map-credit">{meta.attribution}</p>

        {/* Desktop: Airbnb popup anchored to the pin */}
        {previewFind && popupAt && (
          <div className="popup" ref={popupRef}>
            <button type="button" className="popup__card" onClick={() => openFind(previewFind, opener.current)} aria-label={`Open ${previewFind.title}`}>
              <Media find={previewFind} size="popup" />
              <span className="popup__text">
                <span className="popup__title">{previewFind.title}</span>
                <span className="popup__line">{previewFind.categoryLabel} · {previewFind.regionLabel}</span>
                <span className="popup__line"><b>{previewFind.verification === 'multi-source' ? 'Multi-source' : previewFind.verification === 'single-source' ? 'Single source' : previewFind.verification}</b> · {previewFind.sources.length} sources</span>
              </span>
            </button>
            <Button variant="glass" size="s" icon="close" iconOnly label="Close" className="popup__close" onClick={() => { setPreview(null); opener.current?.focus({ preventScroll: true }); }} />
          </div>
        )}

        {/* Desktop: Felt inspector */}
        {!phone && current && (
          <article ref={drawerRef} className="drawer" role="dialog" aria-modal="false" aria-labelledby="drawer-title" tabIndex={-1} data-instant={instant || undefined}>
            <div className="drawer__content" key={current.slug}>
              <DrawerContent find={current} meta={meta} titleId="drawer-title" onClose={closeFind} onShowOnMap={() => showOnMap(current)} onCopy={() => copyLink(current)} onShare={() => share(current)} found={found.has(current.slug)} onToggleFound={() => toggleFound(current.slug)} />
            </div>
          </article>
        )}

        {toast && (
          <div className="toast" role="status" key={toast.id}>
            <Icon name={toast.icon} size={22} />
            <span className="toast__text">{toast.text}</span>
            <button type="button" className="toast__close" aria-label="Dismiss" onClick={dismissToast}><Icon name="close" size={18} /></button>
          </div>
        )}
      </div>

      {/* Phone: Strava selected card, Rodeo chips, toggle and search */}
      {phone && previewFind && !selected && (
        <div className="pcard">
          <button type="button" className="pcard__open" onClick={() => openFind(previewFind, opener.current)} aria-label={`Open ${previewFind.title}`}>
            <Media find={previewFind} size="card" />
            <span className="pcard__text">
              <span className="pcard__title">{previewFind.title}</span>
              <span className="pcard__meta"><Icon name={previewFind.icon} size={20} /><Verification level={previewFind.verification} /></span>
              <span className="pcard__place"><Icon name="pin" size={20} />{previewFind.regionLabel}</span>
            </span>
          </button>
          <Button variant="quiet" size="s" icon="close" iconOnly label="Close" className="pcard__close" onClick={() => setPreview(null)} />
        </div>
      )}

      <div className="map-bottom">
        {chipRow(true)}
        <div className="map-bar">
          <div className="map-toggle" role="group" aria-label="View">
            <button type="button" className="map-toggle__btn" aria-pressed={listSnap !== 'closed'} aria-label="List" onClick={() => setListSnap('full')}><Icon name="grid" size={22} solid={listSnap !== 'closed'} /></button>
            <button type="button" className="map-toggle__btn" aria-pressed={listSnap === 'closed'} aria-label="Map" onClick={() => { setListSnap('closed'); searchRef.current?.blur(); }}><Icon name="map" size={22} solid={listSnap === 'closed'} /></button>
          </div>
          <label className="map-search">
            <Icon name="search" size={22} />
            <span className="sr-only">Search finds</span>
            <input ref={searchRef} type="search" placeholder="Search" value={search} enterKeyHint="search" autoComplete="off" onFocus={() => setListSnap('full')} onChange={(e) => setSearch(e.target.value)} />
            {search && <button type="button" className="map-search__clear" aria-label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus(); }}><Icon name="close" size={18} /></button>}
          </label>
        </div>
      </div>

      {/* Phone: Apple Maps sheet, clip at the top */}
      <Sheet snaps={findSnaps} snap={phone ? findSnap : 'closed'} onSnap={onFindSnap} closedId="closed" enabled={phone} inert={!phone || !selected} className="fsheet" label={shown ? shown.title : 'Find'} role="dialog">
        {phone && shown && <SheetContent key={shown.slug} find={shown} meta={meta} titleId="sheet-title" onClose={closeFind} onShowOnMap={() => showOnMap(shown)} onCopy={() => copyLink(shown)} onShare={() => share(shown)} found={found.has(shown.slug)} onToggleFound={() => toggleFound(shown.slug)} />}
      </Sheet>
    </section>
  );
}
