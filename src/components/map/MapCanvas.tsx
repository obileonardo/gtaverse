// The Leaflet map: CRS.Simple on the official Leonida tiles (docs/MAP.md), pins, clusters and the printed grid.
// Leaflet loads on the client only. Pins are HTML markers styled in map.css: the round-2 GTA blips (docs/ICONS.md),
// label tags (Shuyun C01), the selected glow ring (Jeff christy C06), connection lines (C08), stacked clusters with a
// count (Hypelist, Mindtrip). Direction: the round-2 board's analysis/direction-map-r2.md.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { blipSvg, glyphOf } from './blip';
import { createBlipCanvas } from './blipCanvas';
import type { MapCollectible, MapFind, MapMeta } from './types';

type Padding = { top: number; right: number; bottom: number; left: number };

export type MapApi = {
  flyTo: (f: MapFind, opts?: { offsetX?: number; offsetY?: number; instant?: boolean }) => void;
  zoomBy: (d: number) => void;
  pointOf: (f: MapFind) => { x: number; y: number } | null;
  pointAt: (x: number, y: number) => { x: number; y: number } | null;
  pinElement: (slug: string) => HTMLElement | null;
  // The view as image pixels at the centre and a Leaflet zoom, so the 3D view (three/Map3D.tsx) opens and closes
  // on the same spot at the same scale.
  getView: () => { x: number; y: number; zoom: number } | null;
  setView: (v: { x: number; y: number; zoom: number }) => void;
  /** Fit every pin in view, or the whole of Leonida when nothing is pinned (the HUD's Fit button). */
  fit: (pad: Padding) => void;
  /** The current zoom, for the HUD's zoom level readout. */
  zoom: () => number | null;
};

type Props = {
  meta: MapMeta;
  finds: MapFind[]; // the filtered finds that have a pin
  selected: string | null;
  hovered: string | null;
  found: Set<string>;
  basemap: 'official' | 'muted';
  grid: boolean;
  fitPadding: Padding;
  /** Room the floating panels take (right: the detail panel when open), so tags flip before they slide under it. */
  covered: { left: number; right: number };
  onPin: (slug: string, el: HTMLElement) => void;
  onPinHover: (slug: string | null) => void;
  collectibles: MapCollectible[]; // items of the layers that are turned on
  selectedCollectible: string | null;
  onCollectible: (id: string, el: HTMLElement) => void;
  onMove: () => void;
  onReady: () => void;
};

/**
 * Tile settings for this screen (docs/MAP.md, "Sharpness"). The tile pyramid has 512 px tiles numbered so zoom
 * `meta.maxZoom` is full resolution. On a 1x screen a tile shows at 512 CSS px; at 1.5x and above it shows at 256 CSS px
 * from one level deeper, so a CSS pixel gets two map pixels. Zoom is capped half a level past native detail.
 */
export function sharpTiles(meta: MapMeta, dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) {
  const size = meta.tileSize ?? 256;
  const retina = dpr >= 1.5;
  // Device pixels per map pixel reach 1 at zoom maxZoom - log2(dpr); never cap below one level under native.
  const nativeZoom = meta.maxZoom - Math.min(1, Math.log2(Math.max(1, dpr)));
  return {
    tileSize: retina ? size / 2 : size,
    zoomOffset: retina ? 1 : 0,
    maxNativeZoom: retina ? meta.maxZoom - 1 : meta.maxZoom,
    maxZoom: Math.round((nativeZoom + 0.5) * 4) / 4,
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAG_ROOM = 220; // a tag is at most 180 wide plus the plate: closer than this to a covered edge, it flips left
const TAG_ZOOM = 4; // from this zoom, up to TAG_MAX pins in view show their tags
const TAG_MAX = 12;

// A find pin: the blip on its pointer, 32 px (40 selected), its tip on the spot. The button is the 44 px hit target
// centred on the plate (map.css places it from --s). The name is a tag beside the plate that wraps to two lines and
// is never inside an overflow box, so no glyph is ever cut.
function pinHtml(f: MapFind, st: { selected: boolean; hovered: boolean; found: boolean; flip: boolean }) {
  const size = st.selected ? 40 : 32;
  const blip = blipSvg(glyphOf(f.category), { form: 'pin', size, state: st.selected ? 'selected' : st.found ? 'found' : 'default' });
  const cls = ['pin', st.selected && 'is-selected', st.hovered && 'is-hovered', st.flip && 'pin--flip'].filter(Boolean).join(' ');
  const halo = st.selected ? '<span class="pin__glow" aria-hidden="true"></span><span class="pin__ring" aria-hidden="true"></span>' : '';
  return `<button type="button" class="${cls}" style="--s:${size}" aria-label="${esc(f.title)}${st.found ? ', found' : ''}" data-slug="${esc(f.slug)}">${halo}<span class="pin__plate">${blip}</span><span class="pin__tag">${esc(f.title)}</span></button>`;
}

// A cluster: up to three member plates stacked 6 px apart (the most common type on top) and an accent count badge,
// one 44 px target. Hovering or focusing it lists the members (at most 6, then "and N more").
function groupHtml(members: MapFind[]) {
  const byCat = new Map<string, number>();
  for (const f of members) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 3);
  const stack = cats.map((c, i) => `<span class="cpl" style="--i:${i}">${blipSvg(glyphOf(c), { size: 28 })}</span>`).reverse().join('');
  const list = members.slice(0, 6).map((f) => `<li>${blipSvg(glyphOf(f.category), { size: 20 })}<span>${esc(f.title)}</span></li>`).join('')
    + (members.length > 6 ? `<li class="cluster__more">and ${members.length - 6} more</li>` : '');
  return `<button type="button" class="cluster" style="--n:${cats.length}" aria-label="${members.length} finds close together. Zoom in"><span class="cluster__stack">${stack}</span><span class="cluster__count tabular" aria-hidden="true">${members.length}</span><span class="cluster__pop" aria-hidden="true"><ul>${list}</ul></span></button>`;
}

export const MapCanvas = forwardRef<MapApi, Props>(function MapCanvas(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const pins = useRef<Leaflet.LayerGroup | null>(null);
  const grid = useRef<Leaflet.LayerGroup | null>(null);
  const links = useRef<Leaflet.LayerGroup | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>()); // single find pins by slug, rebuilt with every draw
  const inCluster = useRef(new Map<string, Leaflet.LatLng>()); // slug -> its cluster's point, from the last draw
  const ccanvas = useRef<ReturnType<typeof createBlipCanvas> | null>(null); // the collectible canvas layer
  const lastSig = useRef(''); // the grouping on screen (draw)
  const clusters = useRef(new Map<string, { members: { f: MapFind; p: Leaflet.Point }[] }[]>()); // per zoom, cached
  const live = useRef(props);
  live.current = props;

  const pingAfter = useRef<() => void>(() => {});
  const toLatLng = (x: number, y: number) => map.current!.unproject([x, y] as Leaflet.PointExpression, props.meta.maxZoom);

  useImperativeHandle(ref, () => ({
    flyTo: (f, opts = {}) => {
      const m = map.current;
      if (!m || !f.pin) return;
      const still = reduced() || opts.instant;
      const zoom = Math.min(Math.max(m.getZoom(), props.meta.maxZoom - 1.5), m.getMaxZoom());
      // Centre the pin in the free part of the map (between the panels, or above the phone card or sheet).
      const target = m.project(toLatLng(f.pin.x, f.pin.y), zoom).add([opts.offsetX ?? 0, opts.offsetY ?? 0]);
      const centre = m.unproject(target, zoom);
      // "Here it is": one ring from the pin once the map has landed, never during the fly.
      const ping = () => {
        const el = markers.current.get(f.slug)?.getElement()?.querySelector('.pin');
        if (!el) return;
        el.querySelector('.pin-ping')?.remove();
        const ring = document.createElement('span');
        ring.className = 'pin-ping';
        ring.setAttribute('aria-hidden', 'true');
        ring.addEventListener('animationend', () => ring.remove());
        el.append(ring);
      };
      m.off('moveend', pingAfter.current);
      if (still) { m.setView(centre, zoom, { animate: false }); if (!opts.instant) requestAnimationFrame(ping); }
      else { pingAfter.current = ping; m.once('moveend', ping); m.flyTo(centre, zoom, { duration: 0.6 }); }
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
    getView: () => {
      const m = map.current;
      if (!m) return null;
      const c = m.project(m.getCenter(), props.meta.maxZoom);
      return { x: c.x, y: c.y, zoom: m.getZoom() };
    },
    setView: (v) => {
      const m = map.current;
      if (!m) return;
      m.invalidateSize({ animate: false });
      m.setView(toLatLng(v.x, v.y), Math.min(Math.max(v.zoom, m.getMinZoom()), m.getMaxZoom()), { animate: false });
    },
    fit: (pad) => {
      const lib = L.current, m = map.current;
      if (!lib || !m) return;
      const { finds, meta } = live.current;
      const f = meta.frame;
      const pts = finds.filter((x) => x.pin).map((x) => toLatLng(x.pin!.x, x.pin!.y));
      const b = pts.length ? lib.latLngBounds(pts) : lib.latLngBounds(toLatLng(f.x0, f.y1), toLatLng(f.x1, f.y0));
      m.flyToBounds(b, { paddingTopLeft: [pad.left, pad.top], paddingBottomRight: [pad.right, pad.bottom], maxZoom: meta.maxZoom - 1, duration: reduced() ? 0 : 0.6, animate: !reduced() });
    },
    zoom: () => map.current?.getZoom() ?? null,
  }));

  // Build the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lib = (await import('leaflet')).default;
      if (cancelled || !box.current) return;
      L.current = lib;
      const { meta } = live.current;
      // Sharpness (docs/MAP.md): one map pixel per device pixel. 512 px tiles show at 512 CSS px on a 1x screen;
      // on a 2x screen they show at 256 CSS px one level deeper (zoomOffset 1), as Leaflet's detectRetina does,
      // but with maxNativeZoom lowered by one so the deepest level is never asked for past full resolution.
      const sharp = sharpTiles(meta);
      const m = lib.map(box.current, {
        crs: lib.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        minZoom: 0,
        maxZoom: sharp.maxZoom,
        maxBoundsViscosity: 0.8,
        keyboard: true,
        keyboardPanDelta: 120,
        bounceAtZoomLimits: false,
      });
      map.current = m;
      (box.current as HTMLDivElement & { __vfmap?: Leaflet.Map }).__vfmap = m; // read by the verification scripts
      const image = lib.latLngBounds(m.unproject([0, meta.height], meta.maxZoom), m.unproject([meta.width, 0], meta.maxZoom));
      // The blurred base: one small picture of the whole map in a pane under the tiles, which fade in over it.
      if (meta.base) {
        const pane = m.createPane('vf-base');
        pane.style.zIndex = '150'; // Leaflet's tile pane is 200
        lib.imageOverlay(meta.base, image, { pane: 'vf-base', className: 'map-base', interactive: false }).addTo(m);
      }
      lib.tileLayer(meta.tileUrl, { tileSize: sharp.tileSize, zoomOffset: sharp.zoomOffset, noWrap: true, bounds: image, minNativeZoom: 0, maxNativeZoom: sharp.maxNativeZoom, maxZoom: sharp.maxZoom, keepBuffer: 3, className: 'map-tiles' }).addTo(m);
      const frame = lib.latLngBounds(m.unproject([meta.frame.x0, meta.frame.y1], meta.maxZoom), m.unproject([meta.frame.x1, meta.frame.y0], meta.maxZoom));
      const p = live.current.fitPadding;
      m.fitBounds(frame, { paddingTopLeft: [p.left, p.top], paddingBottomRight: [p.right, p.bottom], animate: false });
      m.setMinZoom(Math.max(0, m.getZoom() - 0.5));
      m.setMaxBounds(image.pad(0.15));
      m.getContainer().setAttribute('aria-label', 'Map of Leonida. Use the arrow keys to move and plus or minus to zoom.');
      grid.current = lib.layerGroup().addTo(m); // under everything else
      links.current = lib.layerGroup().addTo(m);
      // Collectibles: one canvas in their own pane under the find pins (600); see blipCanvas.ts.
      const cpane = m.createPane('vf-cpane');
      cpane.style.zIndex = '590';
      cpane.style.pointerEvents = 'none';
      ccanvas.current = createBlipCanvas(lib, { maxZoom: meta.maxZoom, numbersFrom: meta.maxZoom - 1.5, onPick: (id) => { if (box.current) live.current.onCollectible(id, box.current); } });
      ccanvas.current.layer.addTo(m);
      (box.current as HTMLDivElement & { __vfc?: unknown }).__vfc = ccanvas.current; // read by the verification scripts
      pins.current = lib.layerGroup().addTo(m);
      // Zoom end: the collectible canvas redraws in this frame (its own moveend); the find pins follow in the next one,
      // and only if the grouping changed, so no single frame carries all of it.
      let next = 0;
      m.on('zoomend', () => { gridLabels(); cancelAnimationFrame(next); next = requestAnimationFrame(() => draw(true)); });
      m.on('moveend', () => { placeTags(); });
      m.on('move zoom', () => live.current.onMove());
      drawGrid();
      draw(false);
      drawCollectibles();
      gridLabels();
      live.current.onReady();
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);

  /** Tags flip to the left of the plate near a covered right edge; at zoom 4 and deeper up to 12 pins show theirs. */
  const placeTags = () => {
    const m = map.current, el = box.current;
    if (!m || !el) return;
    const w = el.clientWidth;
    const limit = w - live.current.covered.right - TAG_ROOM;
    let inView = 0;
    for (const mk of markers.current.values()) {
      const pin = mk.getElement()?.querySelector<HTMLElement>('.pin');
      if (!pin) continue;
      const pt = m.latLngToContainerPoint(mk.getLatLng());
      pin.classList.toggle('pin--flip', pt.x > limit);
      if (pt.x > 0 && pt.x < w && pt.y > 0 && pt.y < el.clientHeight) inView++;
    }
    const on = m.getZoom() >= TAG_ZOOM && inView > 0 && inView <= TAG_MAX;
    el.dataset.tags = String(on);
    // Tags never sit on each other: the selected and hovered pins keep theirs, then the rest top to bottom; a tag
    // that would overlap one already shown stays hidden until its pin is hovered or focused.
    const pinsNow = [...el.querySelectorAll<HTMLElement>('.pin')];
    pinsNow.forEach((p) => p.classList.remove('pin--hidetag'));
    if (!on) return;
    const kept: DOMRect[] = [];
    const order = pinsNow.map((p) => ({ p, r: p.querySelector('.pin__tag')!.getBoundingClientRect(), first: p.matches('.is-selected, .is-hovered') }))
      .sort((a, b) => Number(b.first) - Number(a.first) || a.r.top - b.r.top);
    for (const { p, r } of order) {
      const hit = kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 4 && r.bottom > k.top - 4);
      if (hit) p.classList.add('pin--hidetag'); else kept.push(r);
    }
  };

  // Pins and clusters: greedy screen-space grouping at a 64 px radius; clusters split from half a level under the cap.
  // When a cluster splits, its members travel from the cluster's point to their own (a layout animation, 300 ms on
  // --ease-in-out); a cluster that forms fades in (220 ms). Reduced motion: no travel.
  const draw = (animate: boolean) => {
    const lib = L.current, m = map.current, layer = pins.current;
    if (!lib || !m || !layer) return;
    const { finds, selected, hovered, found, meta } = live.current;
    const before = inCluster.current;
    const now = new Map<string, Leaflet.LatLng>();
    const zoom = m.getZoom();
    const radius = zoom >= m.getMaxZoom() - 0.5 ? 0 : 64;
    // Grouped once per zoom level and cached until the pins or the selection change (useEffect below clears it).
    const cacheKey = `${zoom}|${selected ?? ''}`;
    let groups = clusters.current.get(cacheKey);
    if (!groups) {
      const pts = finds.filter((f) => f.pin).map((f) => ({ f, p: m.project(toLatLng(f.pin!.x, f.pin!.y), zoom) }));
      const used = new Set<number>();
      groups = [];
      pts.forEach((a, i) => {
        if (used.has(i)) return;
        used.add(i);
        const members = [a];
        if (a.f.slug !== selected) pts.forEach((b, j) => { if (!used.has(j) && b.f.slug !== selected && a.p.distanceTo(b.p) <= radius) { used.add(j); members.push(b); } });
        groups!.push({ members });
      });
      clusters.current.set(cacheKey, groups);
    }
    // Same groups as on screen (a zoom that split or merged nothing, same selection and found set): keep the markers;
    // Leaflet has already moved them. Only the tags need placing.
    const sig = `${selected ?? ''}|${hovered ?? ''}|${found.size}|${groups.map((g) => g.members.map((x) => x.f.slug).join(',')).join(';')}`;
    if (animate && sig === lastSig.current) { placeTags(); return; }
    lastSig.current = sig;
    layer.clearLayers();
    markers.current.clear();
    // Finds on the very same spot fan out on a small ring at the deepest zoom, so each can be picked.
    const spots = new Map<string, number>();
    const move = !reduced() && animate;
    for (const g of groups) {
      if (g.members.length === 1) {
        const f = g.members[0].f;
        const key = `${f.pin!.x},${f.pin!.y}`;
        const twin = spots.get(key) ?? 0;
        spots.set(key, twin + 1);
        const at = twin ? m.unproject(g.members[0].p.add([Math.cos(twin * 2.1) * 26, Math.sin(twin * 2.1) * 26]), zoom) : toLatLng(f.pin!.x, f.pin!.y);
        const isSel = f.slug === selected;
        const icon = lib.divIcon({ className: 'map-marker', html: pinHtml(f, { selected: isSel, hovered: f.slug === hovered, found: found.has(f.slug), flip: false }), iconSize: [0, 0] });
        const mk = lib.marker(at, { icon, keyboard: false, zIndexOffset: isSel ? 1000 : f.slug === hovered ? 500 : 0 });
        mk.on('click', () => { const el = mk.getElement()?.querySelector<HTMLElement>('.pin'); if (el) live.current.onPin(f.slug, el); });
        mk.on('mouseover', () => live.current.onPinHover(f.slug));
        mk.on('mouseout', () => live.current.onPinHover(null));
        layer.addLayer(mk);
        markers.current.set(f.slug, mk);
        const from = before.get(f.slug);
        if (move && from) {
          const a = m.latLngToContainerPoint(from), b = m.latLngToContainerPoint(at);
          mk.getElement()?.querySelector<HTMLElement>('.pin')?.animate([{ translate: `${a.x - b.x}px ${a.y - b.y}px`, opacity: 0.4 }, { translate: '0 0', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
        }
      } else {
        const ms = g.members.map((x) => x.f);
        const sum = g.members.reduce((s, x) => s.add(x.p), lib.point(0, 0)).divideBy(g.members.length);
        const at = m.unproject(sum, zoom);
        const icon = lib.divIcon({ className: 'map-marker', html: groupHtml(ms), iconSize: [0, 0] });
        const mk = lib.marker(at, { icon, keyboard: false, zIndexOffset: 200 });
        mk.on('click', () => {
          const b = lib.latLngBounds(ms.map((f) => toLatLng(f.pin!.x, f.pin!.y)));
          const pad = live.current.fitPadding;
          m.flyToBounds(b, { paddingTopLeft: [pad.left + 48, pad.top + 48], paddingBottomRight: [pad.right + 48, pad.bottom + 48], maxZoom: meta.maxZoom, duration: reduced() ? 0 : 0.6, animate: !reduced() });
        });
        layer.addLayer(mk);
        for (const f of ms) now.set(f.slug, at);
        // Merging is the reverse of a split, faster: the stack fades in where its members were.
        if (move && ms.some((f) => !before.has(f.slug))) mk.getElement()?.querySelector<HTMLElement>('.cluster')?.animate([{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
    }
    inCluster.current = now;
    drawLinks();
    placeTags();
  };

  // The selected find's connection lines (Jeff christy C08): 1 px accent lines at 40% to the pinned finds it shares a
  // GTAverse connection with, each ending in a 10 px ring. They draw in after the glow ring lands.
  const drawLinks = () => {
    const lib = L.current, m = map.current, layer = links.current;
    if (!lib || !m || !layer) return;
    layer.clearLayers();
    const { finds, selected } = live.current;
    const f = selected ? finds.find((x) => x.slug === selected) : null;
    if (!f?.pin) return;
    const from = toLatLng(f.pin.x, f.pin.y);
    for (const slug of f.related) {
      const r = finds.find((x) => x.slug === slug);
      if (!r?.pin) continue;
      const to = toLatLng(r.pin.x, r.pin.y);
      const line = lib.polyline([from, to], { className: 'map-link', interactive: false, weight: 1 }).addTo(layer);
      lib.circleMarker(to, { className: 'map-link-end', radius: 5, weight: 1, interactive: false, fill: false }).addTo(layer);
      const path = line.getElement() as SVGPathElement | undefined;
      if (path && !reduced()) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 400, delay: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      }
    }
  };

  // Collectible pins: the coral collectible blip at 20 on its pointer, one per item, never grouped, drawn on one
  // canvas (blipCanvas.ts). Zoomed in, the checklist number shows in a tag beside each.
  const drawCollectibles = () => { ccanvas.current?.set(live.current.collectibles, live.current.selectedCollectible); };
  const gridLabels = () => {
    const m = map.current;
    if (m && box.current) box.current.dataset.cells = String(m.getZoom() >= 3);
  };

  // The printed grid (rows A to M, columns 1 to 9, content/map.json), drawn as Jeff christy C12 draws his: solid
  // 1 px lines at 6% with 4 px square ticks at the crossings. Cell labels show from zoom 3 (data-cells).
  const drawGrid = () => {
    const lib = L.current, m = map.current, layer = grid.current;
    if (!lib || !m || !layer) return;
    const { meta } = live.current;
    const f = meta.frame;
    const line = (pts: [number, number][]) => lib.polyline(pts.map(([x, y]) => toLatLng(x, y)), { className: 'map-grid-line', interactive: false, weight: 1 });
    for (const r of meta.rows.slice(1)) layer.addLayer(line([[f.x0, r.y0], [f.x1, r.y0]]));
    for (const c of meta.columns.slice(1)) layer.addLayer(line([[c.x0, f.y0], [c.x0, f.y1]]));
    layer.addLayer(lib.rectangle(lib.latLngBounds(toLatLng(f.x0, f.y1), toLatLng(f.x1, f.y0)), { className: 'map-grid-line', interactive: false, weight: 1, fill: false }));
    const tick = lib.divIcon({ className: 'map-marker', html: '<span class="map-grid-tick"></span>', iconSize: [0, 0] });
    for (const r of meta.rows.slice(1)) for (const c of meta.columns.slice(1)) layer.addLayer(lib.marker(toLatLng(c.x0, r.y0), { icon: tick, interactive: false, keyboard: false, zIndexOffset: -2000 }));
    const label = (text: string, x: number, y: number) => lib.marker(toLatLng(x, y), { interactive: false, keyboard: false, zIndexOffset: -2000, icon: lib.divIcon({ className: 'map-marker', html: `<span class="map-grid-label">${text}</span>`, iconSize: [0, 0] }) });
    for (const r of meta.rows) layer.addLayer(label(r.id, f.x0 + 60, (r.y0 + r.y1) / 2));
    for (const c of meta.columns) layer.addLayer(label(c.id, (c.x0 + c.x1) / 2, f.y0 + 60));
  };

  useEffect(() => { clusters.current.clear(); }, [props.finds]);
  useEffect(() => { draw(false); }, [props.finds, props.selected, props.found]);
  useEffect(() => { placeTags(); }, [props.covered.right]);
  // Hovering a list row raises its pin and shows its tag. The pin is updated in place, not redrawn, so it can animate.
  const raised = useRef<string | null>(null);
  useEffect(() => {
    const setRaised = (slug: string | null, on: boolean) => {
      if (!slug || slug === live.current.selected) return;
      const mk = markers.current.get(slug);
      mk?.getElement()?.querySelector('.pin')?.classList.toggle('is-hovered', on);
      mk?.setZIndexOffset(on ? 500 : 0);
    };
    setRaised(raised.current, false);
    setRaised(props.hovered, true);
    raised.current = props.hovered;
  }, [props.hovered]);
  useEffect(() => { drawCollectibles(); }, [props.collectibles, props.selectedCollectible]);
  useEffect(() => {
    const m = map.current, g = grid.current;
    if (!m || !g) return;
    if (props.grid) g.addTo(m); else g.remove();
  }, [props.grid, map.current]);

  return <div ref={box} className="map-canvas" data-basemap={props.basemap} />;
});
