// The Leaflet map: CRS.Simple on the official Leonida tiles (docs/MAP.md), pins, groups and the printed grid.
// Leaflet loads on the client only. Pins are plain HTML markers styled in map.css: GetYourGuide photo pins and value
// pins on desktop, Rodeo round pins with a label on phone, Lyft pink count pills for groups of nearby finds.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { icons } from '../ui/icons';
import type { MapCollectible, MapFind, MapMeta } from './types';

export type MapApi = {
  flyTo: (f: MapFind, opts?: { offsetX?: number; offsetY?: number; instant?: boolean }) => void;
  zoomBy: (d: number) => void;
  pointOf: (f: MapFind) => { x: number; y: number } | null;
  pointAt: (x: number, y: number) => { x: number; y: number } | null;
  pinElement: (slug: string) => HTMLElement | null;
};

type Props = {
  meta: MapMeta;
  finds: MapFind[]; // the filtered finds that have a pin
  selected: string | null;
  hovered: string | null;
  phone: boolean;
  basemap: 'official' | 'muted';
  grid: boolean;
  fitPadding: { top: number; right: number; bottom: number; left: number };
  onPin: (slug: string, el: HTMLElement) => void;
  collectibles: MapCollectible[]; // items of the layers that are turned on
  selectedCollectible: string | null;
  onCollectible: (id: string, el: HTMLElement) => void;
  onMove: () => void;
  onReady: () => void;
};

const svg = (name: keyof typeof icons, size: number) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${(icons[name] as { line: string }).line}</svg>`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const showArt = (f: MapFind) => !!f.still && !f.spoiler && !f.mature;

function pinHtml(f: MapFind, phone: boolean, state: string) {
  const label = esc(f.title);
  const cls = `pin ${state}`;
  if (phone) {
    const disc = showArt(f) ? `<img src="${f.still}" alt="" loading="lazy">` : svg(f.icon, 16);
    return `<button type="button" class="${cls} pin--round" aria-label="${label}" data-slug="${f.slug}"><span class="pin__disc">${disc}</span><span class="pin__name">${label}</span></button>`;
  }
  if (showArt(f)) return `<button type="button" class="${cls} pin--photo" aria-label="${label}" data-slug="${f.slug}"><img src="${f.still}" alt="" loading="lazy"><span class="pin__label">${label}</span></button>`;
  return `<button type="button" class="${cls} pin--value" aria-label="${label}" data-slug="${f.slug}">${svg(f.icon, 16)}<span class="pin__label">${label}</span></button>`;
}

function groupHtml(members: MapFind[]) {
  const byCat = new Map<string, { icon: MapFind['icon']; n: number; label: string }>();
  for (const f of members) {
    const c = byCat.get(f.category) ?? { icon: f.icon, n: 0, label: f.categoryLabel };
    c.n++;
    byCat.set(f.category, c);
  }
  const cats = [...byCat.values()].sort((a, b) => b.n - a.n);
  const shown = cats.length > 3 ? cats.slice(0, 2) : cats;
  const rest = cats.length > 3 ? cats.slice(2).reduce((s, c) => s + c.n, 0) : 0;
  const segs = shown.map((c) => `<span class="pin__seg"><span class="pin__segicon">${svg(c.icon, 16)}</span><b class="tabular">${c.n}</b></span>`).join('')
    + (rest ? `<span class="pin__seg"><span class="pin__segicon">${svg('plus', 16)}</span><b class="tabular">${rest}</b></span>` : '');
  const label = `${members.length} finds here: ${cats.map((c) => `${c.n} ${c.label.toLowerCase()}`).join(', ')}. Zoom in`;
  return `<button type="button" class="pin pin--group" aria-label="${esc(label)}">${segs}</button>`;
}

export const MapCanvas = forwardRef<MapApi, Props>(function MapCanvas(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const pins = useRef<Leaflet.LayerGroup | null>(null);
  const grid = useRef<Leaflet.LayerGroup | null>(null);
  const cpins = useRef<Leaflet.LayerGroup | null>(null);
  const live = useRef(props);
  live.current = props;

  const toLatLng = (x: number, y: number) => map.current!.unproject([x, y] as Leaflet.PointExpression, props.meta.maxZoom);

  useImperativeHandle(ref, () => ({
    flyTo: (f, opts = {}) => {
      const m = map.current;
      if (!m || !f.pin) return;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || opts.instant;
      const zoom = Math.max(m.getZoom(), props.meta.maxZoom - 1.5);
      // Centre the pin in the visible part of the map (above a sheet or beside the drawer).
      const target = m.project(toLatLng(f.pin.x, f.pin.y), zoom).add([opts.offsetX ?? 0, opts.offsetY ?? 0]);
      const centre = m.unproject(target, zoom);
      if (reduce) m.setView(centre, zoom, { animate: false });
      else m.flyTo(centre, zoom, { duration: 0.6 });
    },
    zoomBy: (d) => map.current?.setZoom(map.current.getZoom() + d),
    pointOf: (f) => {
      const m = map.current;
      if (!m || !f.pin) return null;
      const p = m.latLngToContainerPoint(toLatLng(f.pin.x, f.pin.y));
      return { x: p.x, y: p.y };
    },
    pointAt: (x, y) => {
      const m = map.current;
      if (!m) return null;
      const p = m.latLngToContainerPoint(toLatLng(x, y));
      return { x: p.x, y: p.y };
    },
    pinElement: (slug) => box.current?.querySelector<HTMLElement>(`.pin[data-slug="${CSS.escape(slug)}"]`) ?? null,
  }));

  // Build the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lib = (await import('leaflet')).default;
      if (cancelled || !box.current) return;
      L.current = lib;
      const { meta } = live.current;
      const m = lib.map(box.current, {
        crs: lib.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        minZoom: 0,
        maxZoom: meta.maxZoom + 1,
        maxBoundsViscosity: 0.8,
        keyboard: true,
        keyboardPanDelta: 120,
        bounceAtZoomLimits: false,
      });
      map.current = m;
      const image = lib.latLngBounds(m.unproject([0, meta.height], meta.maxZoom), m.unproject([meta.width, 0], meta.maxZoom));
      lib.tileLayer(meta.tileUrl, { tileSize: 256, noWrap: true, bounds: image, minNativeZoom: 0, maxNativeZoom: meta.maxZoom, maxZoom: meta.maxZoom + 1, keepBuffer: 3, className: 'map-tiles' }).addTo(m);
      const frame = lib.latLngBounds(m.unproject([meta.frame.x0, meta.frame.y1], meta.maxZoom), m.unproject([meta.frame.x1, meta.frame.y0], meta.maxZoom));
      const p = live.current.fitPadding;
      m.fitBounds(frame, { paddingTopLeft: [p.left, p.top], paddingBottomRight: [p.right, p.bottom], animate: false });
      m.setMinZoom(Math.max(0, m.getZoom() - 0.5));
      m.setMaxBounds(image.pad(0.15));
      m.getContainer().setAttribute('aria-label', 'Map of Leonida. Use the arrow keys to move and plus or minus to zoom.');
      cpins.current = lib.layerGroup().addTo(m); // added first, so find pins sit above
      pins.current = lib.layerGroup().addTo(m);
      grid.current = lib.layerGroup();
      m.on('zoomend', () => { draw(); numbers(); });
      m.on('move zoom', () => live.current.onMove());
      draw();
      drawCollectibles();
      numbers();
      drawGrid();
      live.current.onReady();
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);

  // Pins and groups: greedy screen-space grouping at the current zoom; groups split as you zoom in.
  const draw = () => {
    const lib = L.current, m = map.current, layer = pins.current;
    if (!lib || !m || !layer) return;
    const { finds, phone, selected, hovered, meta } = live.current;
    layer.clearLayers();
    const zoom = m.getZoom();
    const radius = zoom >= meta.maxZoom ? 0 : phone ? 40 : 56;
    const pts = finds.filter((f) => f.pin).map((f) => ({ f, p: m.project(toLatLng(f.pin!.x, f.pin!.y), zoom) }));
    const used = new Set<number>();
    const groups: { members: typeof pts }[] = [];
    pts.forEach((a, i) => {
      if (used.has(i)) return;
      used.add(i);
      const members = [a];
      if (a.f.slug !== selected) pts.forEach((b, j) => { if (!used.has(j) && b.f.slug !== selected && a.p.distanceTo(b.p) <= radius) { used.add(j); members.push(b); } });
      groups.push({ members });
    });
    for (const g of groups) {
      if (g.members.length === 1) {
        const f = g.members[0].f;
        const state = f.slug === selected ? 'is-selected' : f.slug === hovered ? 'is-hovered' : '';
        const icon = lib.divIcon({ className: 'map-marker', html: pinHtml(f, phone, state), iconSize: [0, 0] });
        const mk = lib.marker(toLatLng(f.pin!.x, f.pin!.y), { icon, keyboard: false, riseOnHover: true, zIndexOffset: state === 'is-selected' ? 1000 : state ? 500 : 0 });
        mk.on('click', () => { const el = mk.getElement()?.querySelector<HTMLElement>('.pin'); if (el) live.current.onPin(f.slug, el); });
        layer.addLayer(mk);
      } else {
        const ms = g.members.map((x) => x.f);
        const sum = g.members.reduce((s, x) => s.add(x.p), lib.point(0, 0)).divideBy(g.members.length);
        const icon = lib.divIcon({ className: 'map-marker', html: groupHtml(ms), iconSize: [0, 0] });
        const mk = lib.marker(m.unproject(sum, zoom), { icon, keyboard: false, zIndexOffset: 200 });
        mk.on('click', () => {
          const b = lib.latLngBounds(ms.map((f) => toLatLng(f.pin!.x, f.pin!.y)));
          const pad = live.current.fitPadding;
          m.flyToBounds(b, { paddingTopLeft: [pad.left + 48, pad.top + 48], paddingBottomRight: [pad.right + 48, pad.bottom + 48], maxZoom: meta.maxZoom, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6 });
        });
        layer.addLayer(mk);
      }
    }
  };

  // Collectible pins: small quiet discs, one per item, never grouped; numbers show once zoomed in (numbers()).
  const drawCollectibles = () => {
    const lib = L.current, m = map.current, layer = cpins.current;
    if (!lib || !m || !layer) return;
    const { collectibles, selectedCollectible } = live.current;
    layer.clearLayers();
    // Items that share one spot (the source fanned them out) are drawn on a small ring around it, so each can be tapped.
    const spots = new Map<string, MapCollectible[]>();
    for (const c of collectibles) { const k = `${c.x},${c.y}`; spots.set(k, [...(spots.get(k) ?? []), c]); }
    for (const c of collectibles) {
      const sel = c.id === selectedCollectible;
      const same = spots.get(`${c.x},${c.y}`)!;
      const ring = same.length > 1 ? ` style="--a:${((360 * same.indexOf(c)) / same.length).toFixed(1)}deg;--ring:${same.length}"` : '';
      const html = `<button type="button" class="cpin${sel ? ' is-selected' : ''}${ring ? ' cpin--ring' : ''}"${ring} aria-label="${esc(c.label)}" data-cid="${esc(c.id)}"><span class="cpin__n tabular" aria-hidden="true">${c.number ?? '?'}</span></button>`;
      const mk = lib.marker(toLatLng(c.x, c.y), { icon: lib.divIcon({ className: 'map-marker', html, iconSize: [0, 0] }), keyboard: false, zIndexOffset: sel ? 900 : -100 });
      mk.on('click', () => { const el = mk.getElement()?.querySelector<HTMLElement>('.cpin'); if (el) live.current.onCollectible(c.id, el); });
      layer.addLayer(mk);
    }
  };
  const numbers = () => {
    const m = map.current;
    if (m && box.current) box.current.dataset.cnum = String(m.getZoom() >= live.current.meta.maxZoom - 1.5);
  };

  // The printed grid (rows A to M, columns 1 to 9), from content/map.json.
  const drawGrid = () => {
    const lib = L.current, m = map.current, layer = grid.current;
    if (!lib || !m || !layer) return;
    const { meta } = live.current;
    const f = meta.frame;
    const line = (pts: [number, number][]) => lib.polyline(pts.map(([x, y]) => toLatLng(x, y)), { className: 'map-grid-line', interactive: false, weight: 1 });
    for (const r of meta.rows.slice(1)) layer.addLayer(line([[f.x0, r.y0], [f.x1, r.y0]]));
    for (const c of meta.columns.slice(1)) layer.addLayer(line([[c.x0, f.y0], [c.x0, f.y1]]));
    layer.addLayer(lib.rectangle(lib.latLngBounds(toLatLng(f.x0, f.y1), toLatLng(f.x1, f.y0)), { className: 'map-grid-line', interactive: false, weight: 1, fill: false }));
    const label = (text: string, x: number, y: number) => lib.marker(toLatLng(x, y), { interactive: false, keyboard: false, icon: lib.divIcon({ className: 'map-marker', html: `<span class="map-grid-label mono-caps">${text}</span>`, iconSize: [0, 0] }) });
    for (const r of meta.rows) layer.addLayer(label(r.id, f.x0 + 60, (r.y0 + r.y1) / 2));
    for (const c of meta.columns) layer.addLayer(label(c.id, (c.x0 + c.x1) / 2, f.y0 + 60));
  };

  useEffect(() => { draw(); }, [props.finds, props.selected, props.hovered, props.phone]);
  useEffect(() => { drawCollectibles(); }, [props.collectibles, props.selectedCollectible]);
  useEffect(() => {
    const m = map.current, g = grid.current;
    if (!m || !g) return;
    if (props.grid) g.addTo(m); else g.remove();
  }, [props.grid, map.current]);

  return <div ref={box} className="map-canvas" data-basemap={props.basemap} />;
});
