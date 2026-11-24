// The 3D map view (docs/MAP-3D.md). MapApp lazy-loads this file only when the visitor opens 3D, so Three.js is a
// separate chunk the 2D map never downloads. It exposes the same MapApi as the 2D MapCanvas, so the list, filters,
// popup, drawer and sheet work the same in both views, and pins sit at the same image pixels.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MapScene, type Theme3D, type View2D } from './scene';
import { reliefLabel } from './relief';
import type { MapApi } from '../MapCanvas';
import type { MapFind, MapMeta } from '../types';

export type Map3DApi = MapApi & { close: (done: () => void) => void };

type Props = {
  meta: MapMeta;
  finds: MapFind[]; // the filtered finds that have a pin
  selected: string | null;
  hovered: string | null;
  basemap: 'official' | 'muted';
  start: View2D | null;
  instant: boolean; // opened from the keyboard: skip the tilt-in
  onPin: (slug: string, el: HTMLElement) => void;
  onMove: () => void;
  onReady: () => void;
};

const css = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const readTheme = (basemap: 'official' | 'muted'): Theme3D => ({
  background: css('--bg', '#0d0c1a'),
  ground: css('--map-land', '#1f1f38'),
  accent: css('--accent', '#f976b0'),
  onAccent: css('--on-accent', '#0d0c1a'),
  inverseFill: css('--inverse-fill', '#f2f2f2'),
  inverseText: css('--inverse-text', '#0d0c1a'),
  muted: basemap === 'muted',
});

const webgl = () => {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
};

const Map3D = forwardRef<Map3DApi, Props>(function Map3D(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<MapScene | null>(null);
  const compass = useRef<HTMLSpanElement>(null);
  const live = useRef(props);
  live.current = props;
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (f, opts = {}) => { if (f.pin) scene.current?.flyTo(f.pin.x, f.pin.y, opts); },
    zoomBy: (d) => scene.current?.zoomBy(d),
    pointOf: (f) => (f.pin && scene.current ? scene.current.project(f.pin.x, f.pin.y) : null),
    pinElement: () => canvas.current,
    getView: () => scene.current?.view() ?? null,
    setView: () => { /* 3D opens from the 2D view; it does not take one later */ },
    close: (done) => { if (scene.current) scene.current.close(done); else done(); },
  }));

  // Build the scene once.
  useEffect(() => {
    if (!canvas.current) return;
    if (!webgl()) { setFailed(true); return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let s: MapScene;
    try {
      s = new MapScene({
        canvas: canvas.current,
        meta: live.current.meta,
        theme: readTheme(live.current.basemap),
        reduced,
        start: live.current.start,
        onPick: (slug) => { if (slug && canvas.current) live.current.onPin(slug, canvas.current); },
        onChange: () => {
          const el = compass.current;
          if (el && scene.current) el.style.rotate = `${scene.current.heading()}deg`; // follows the camera, no easing
          live.current.onMove();
        },
      });
    } catch {
      setFailed(true);
      return;
    }
    scene.current = s;
    (canvas.current as HTMLCanvasElement & { __vf3d?: MapScene }).__vf3d = s; // read by the verification scripts
    s.open(live.current.instant);
    live.current.onReady();
    // Theme changes (header toggle) repaint the scene with the new tokens.
    const mo = new MutationObserver(() => s.setTheme(readTheme(live.current.basemap)));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mo.disconnect(); s.dispose(); scene.current = null; };
  }, []);

  useEffect(() => {
    scene.current?.setPins(props.finds.filter((f) => f.pin).map((f) => ({ slug: f.slug, x: f.pin!.x, y: f.pin!.y, icon: f.icon, title: f.title })));
  }, [props.finds]);
  useEffect(() => { scene.current?.setSelected(props.selected); }, [props.selected]);
  useEffect(() => { scene.current?.setListHover(props.hovered); }, [props.hovered]);
  useEffect(() => { scene.current?.setTheme(readTheme(props.basemap)); }, [props.basemap]);

  if (failed) {
    return (
      <div className="map3d map3d--failed" role="status">
        <p className="map3d__fail">3D needs WebGL 2, which this browser has turned off. The 2D map and the list still work.</p>
      </div>
    );
  }

  return (
    <div className="map3d">
      <canvas
        ref={canvas}
        className="map3d__canvas"
        tabIndex={0}
        role="application"
        aria-roledescription="3D map"
        aria-label="3D map of Leonida. Drag to move, right-drag or Shift-drag to tilt and turn, two fingers to turn and zoom, scroll to zoom. Arrow keys move, Shift with arrow keys tilt and turn, plus and minus zoom, 0 resets north. Every find is also in the list."
      />
      <button type="button" className="map3d__compass" aria-label="Reset to north" title="Reset to north" onClick={() => scene.current?.resetNorth()}>
        <span ref={compass} className="map3d__needle" aria-hidden="true"><span className="map3d__n">N</span></span>
      </button>
      <p className="map3d__note caption">{reliefLabel}</p>
    </div>
  );
});

export default Map3D;
