// The collectible layer: up to 892 coral blip pins drawn on one canvas (docs/MAP.md, "Performance"), not one DOM
// marker each. It works like Leaflet's own canvas renderer: the canvas covers the view plus a margin, is redrawn when
// a move or zoom ends, and follows a zoom while it animates with one CSS transform, so the pins stay on screen and
// travel with the map. Sprites come from one atlas of the same blip SVG the rest of the map uses (blip.tsx), drawn at
// the device pixel ratio. Clicks and hovers are hit-tested against a grid index built with each draw. The canvas is
// aria-hidden: the list and the detail panel are the accessible path; a picked collectible opens the same card.
import type * as Leaflet from 'leaflet';
import { blipSvg, glyphOf } from './blip';
import type { MapCollectible } from './types';

const PAD = 0.15; // canvas margin around the view, as a share of its size, so short pans never show an empty edge
const REST = 20; // pin sizes as in ICONS.md: 20 on the map, 28 selected
const SEL = 28;
const CELL = 32; // hit-test grid, in CSS px
const HIT = 15; // a 30 px target around the plate's centre (44 on touch)
// Pin geometry (20 unit grid): the pointer's tip is 0.96 of the size down, the plate's centre 0.4425.
const TIP = 0.96, MID = 0.4425;

type Item = MapCollectible & { ring: number; of: number };
export type BlipCanvasOptions = { maxZoom: number; numbersFrom: number; onPick: (id: string) => void };

export function createBlipCanvas(lib: typeof Leaflet, opts: BlipCanvasOptions) {
  const dpr = Math.min(3, Math.max(1, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1));
  const sprites = new Map<string, HTMLCanvasElement | null>(); // layer|state -> sprite at dpr, null while loading
  let items: Item[] = [];
  let selected: string | null = null;
  let map: Leaflet.Map | null = null;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let bounds: Leaflet.Bounds | null = null; // layer px the canvas covers
  let centre: Leaflet.LatLng | null = null;
  let zoom = 0;
  let grid = new Map<string, number[]>(); // "cx,cy" -> indexes into placed
  let placed: { id: string; x: number; y: number; r: number }[] = []; // plate centres in layer px
  let frame = 0;
  const widths = new Map<string, number>(); // number tag text widths (the font never changes)

  const sprite = (layer: string, sel: boolean) => {
    const key = `${layer}|${sel}`;
    if (sprites.has(key)) return sprites.get(key)!;
    sprites.set(key, null);
    const px = (sel ? SEL : REST) * dpr;
    const svg = blipSvg(glyphOf(layer), { form: 'pin', size: px, state: sel ? 'selected' : 'default', uid: `cv-${layer}-${sel ? 's' : 'r'}` })
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      c.getContext('2d')!.drawImage(img, 0, 0, px, px);
      sprites.set(key, c);
      schedule();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return null;
  };

  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; redraw(); }); };

  /** Layout and draw at the current view. Called when a move or zoom ends, and when the items change. */
  const redraw = () => {
    if (!map) return;
    const size = map.getSize();
    const min = map.containerPointToLayerPoint(size.multiplyBy(-PAD)).round();
    const max = min.add(size.multiplyBy(1 + 2 * PAD)).round();
    bounds = lib.bounds(min, max);
    centre = map.getCenter();
    zoom = map.getZoom();
    const w = max.x - min.x, h = max.y - min.y;
    lib.DomUtil.setPosition(canvas, min); // also clears the scale a zoom animation left
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, -min.x * dpr, -min.y * dpr);
    ctx.clearRect(min.x, min.y, w, h);
    const k = 2 ** (zoom - opts.maxZoom);
    const origin = map.getPixelOrigin();
    const numbers = zoom >= opts.numbersFrom;
    const css = getComputedStyle(document.documentElement);
    const tagFill = css.getPropertyValue('--inverse-fill').trim() || '#f2f2f2';
    const tagInk = css.getPropertyValue('--inverse-text').trim() || '#0d0c1a';
    const tagKey = css.getPropertyValue('--bg').trim() || '#0d0c1a';
    ctx.font = `600 12px ${css.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace'}`;
    ctx.textBaseline = 'middle';
    placed = [];
    grid = new Map();
    const order = [...items].sort((a, b) => Number(a.id === selected) - Number(b.id === selected)); // selected on top
    for (const c of order) {
      const sel = c.id === selected;
      const s = sel ? SEL : REST;
      let x = c.x * k - origin.x, y = c.y * k - origin.y; // the spot, in layer px
      if (c.of > 1) { // items sharing one spot sit on a small ring, as before
        const r = numbers ? 14 + c.of * 5 : 6 + c.of * 2.5, a = (2 * Math.PI * c.ring) / c.of;
        x += Math.cos(a) * r; y += Math.sin(a) * r;
      }
      if (x < min.x - 40 || x > max.x + 40 || y < min.y - 40 || y > max.y + 40) continue;
      const img = sprite(c.layer, sel);
      const left = x - s / 2, top = y - s * TIP;
      if (img) ctx.drawImage(img, left, top, s, s);
      const cy = top + s * MID;
      if (numbers) {
        const label = String(c.number ?? '?');
        let lw = widths.get(label);
        if (lw === undefined) { lw = ctx.measureText(label).width; widths.set(label, lw); }
        const tw = lw + 10, th = 18, tx = x + s * 0.3875 + 3, ty = cy - th / 2;
        ctx.fillStyle = tagKey; ctx.beginPath(); ctx.roundRect(tx - 1, ty - 1, tw + 2, th + 2, 5); ctx.fill();
        ctx.fillStyle = tagFill; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 4); ctx.fill();
        ctx.fillStyle = tagInk; ctx.fillText(label, tx + 5, cy + 0.5);
      }
      const i = placed.push({ id: c.id, x, y: cy, r: sel ? HIT + 4 : HIT }) - 1;
      const key = `${Math.floor(x / CELL)},${Math.floor(cy / CELL)}`;
      grid.set(key, [...(grid.get(key) ?? []), i]);
    }
  };

  /** While a zoom animates: one transform, as Leaflet's renderer does (the pins scale with the map, then redraw). */
  const follow = (c: Leaflet.LatLng, z: number) => {
    if (!map || !bounds || !centre) return;
    const scale = map.getZoomScale(z, zoom);
    const viewHalf = map.getSize().multiplyBy(0.5 + PAD);
    const current = map.project(centre, z);
    const m = map as unknown as { _getNewPixelOrigin: (c: Leaflet.LatLng, z: number) => Leaflet.Point };
    const offset = viewHalf.multiplyBy(-scale).add(current).subtract(m._getNewPixelOrigin(c, z));
    lib.DomUtil.setTransform(canvas, offset, scale);
  };

  /** The collectible under a layer point (the nearest plate centre within its target), or null. */
  const hit = (p: Leaflet.Point, touch: boolean) => {
    const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
    let best: { id: string; d: number } | null = null;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const n of grid.get(`${cx + i},${cy + j}`) ?? []) {
      const q = placed[n], d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= (touch ? 22 : q.r) && (!best || d < best.d || q.id === selected)) best = { id: q.id, d };
    }
    return best?.id ?? null;
  };

  const Layer = lib.Layer.extend({
    onAdd(m: Leaflet.Map) {
      map = m;
      canvas = lib.DomUtil.create('canvas', 'vf-ccanvas leaflet-zoom-animated', m.getPane('vf-cpane'));
      canvas.setAttribute('aria-hidden', 'true');
      ctx = canvas.getContext('2d')!;
      redraw();
    },
    onRemove() { cancelAnimationFrame(frame); frame = 0; canvas.remove(); map = null; },
    getEvents() {
      return {
        viewreset: redraw,
        moveend: redraw,
        zoom: () => map && follow(map.getCenter(), map.getZoom()),
        zoomanim: (e: Leaflet.ZoomAnimEvent) => follow(e.center, e.zoom),
        click: (e: Leaflet.LeafletMouseEvent) => {
          const id = hit(e.layerPoint, (e.originalEvent as PointerEvent).pointerType === 'touch');
          if (id) opts.onPick(id);
        },
        mousemove: (e: Leaflet.LeafletMouseEvent) => { map?.getContainer().classList.toggle('is-pointing', !!hit(e.layerPoint, false)); },
      };
    },
  });
  const layer = new Layer();

  return {
    layer,
    /** Replace the items (the layers that are on) and the selected one. */
    set(list: MapCollectible[], sel: string | null) {
      const spots = new Map<string, MapCollectible[]>();
      for (const c of list) { const k = `${c.x},${c.y}`; spots.set(k, [...(spots.get(k) ?? []), c]); }
      items = list.map((c) => { const same = spots.get(`${c.x},${c.y}`)!; return { ...c, ring: same.indexOf(c), of: same.length }; });
      selected = sel;
      schedule();
    },
    redraw: schedule,
    /** Where a collectible's plate is drawn, in container px (for the verification scripts). */
    pointOf(id: string) {
      const q = placed.find((p) => p.id === id);
      return q && map ? map.layerPointToContainerPoint(lib.point(q.x, q.y)) : null;
    },
  };
}
