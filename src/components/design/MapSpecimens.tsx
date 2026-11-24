// The map's pieces on the design system page, built from the map island's own parts: DrawerContent (the drawer's real
// content), the React twins in ui.tsx, usePresence for exits, and map.css for the look. The drawer frame, the list row
// and the toast are markup that MapApp.tsx keeps inside itself, so they are drawn here with the same classes and the
// same exit timings (drawer out --dur-morph-out, toast out 260ms). Data: one real find, and a worst case.
import { useEffect, useRef, useState } from 'react';
import { DrawerContent } from '../map/FindDetail';
import { Icon, Verification, Button } from '../map/ui';
import { usePresence } from '../map/motion';
import { findUrl, type MapFind, type MapMeta } from '../map/types';
import '../map/map.css';

function Row({ find }: { find: MapFind }) {
  const art = find.still && !find.spoiler && !find.mature;
  return (
    <li className="frow-item">
      <a className="frow" href={findUrl(find.slug)}>
        <span className="media media--row" aria-hidden="true">
          {art ? <img src={find.still!} alt="" loading="lazy" decoding="async" /> : <span className="media__glow"><span className="media__kind">{find.categoryLabel}</span></span>}
        </span>
        <span className="frow__text">
          <span className="frow__kicker">{find.regionLabel}</span>
          <h4 className="frow__title">{find.title}</h4>
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

export default function MapSpecimens({ demo, worst, meta }: { demo: MapFind; worst: MapFind; meta: MapMeta }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [found, setFound] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const drawer = usePresence(drawerOpen ? demo : null, 180);
  const toastP = usePresence(toast, 260);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const showToast = (text: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="ds-map">
      <div className="ds-map__col">
        <p className="ds-cap">List row (desktop 120 px still, phone 88)</p>
        <ul className="frows ds-map__rows" role="list" data-case="demo"><Row find={demo} /></ul>
        <ul className="frows ds-map__rows" role="list" data-case="worst"><Row find={worst} /></ul>
      </div>

      <div className="ds-map__col">
        <p className="ds-cap">Drawer (desktop only): arrives from the right, leaves faster the way it came. Toast: rises from the bottom edge</p>
        <div className="ds-map__controls">
          <span className="ds-map__desk"><Button variant="quiet" size="m" onClick={() => setDrawerOpen((o) => !o)} aria-pressed={drawerOpen}>{drawerOpen ? 'Close the drawer' : 'Open the drawer'}</Button></span>
          <Button variant="quiet" size="m" icon="info" onClick={() => showToast(toast ? 'Another note replaces the first one where it stands.' : 'Tap a pin or a row to open a find. Filters live in the menu.')}>Show a toast</Button>
        </div>
        <div className="ds-map__stage" style={{ ['--map-inset' as string]: '16px' }}>
          {drawer.item && <div className="ds-map__desk">{(
            <article className="drawer" role="dialog" aria-modal="false" aria-labelledby="ds-drawer-title" data-state={drawer.closing ? 'closing' : undefined} inert={drawer.closing}>
              <div className="drawer__content">
                <DrawerContent
                  find={drawer.item}
                  meta={meta}
                  titleId="ds-drawer-title"
                  onClose={() => setDrawerOpen(false)}
                  onShowOnMap={() => { (window.top ?? window).location.href = `/map?find=${drawer.item!.slug}`; }}
                  onCopy={async () => { try { await navigator.clipboard.writeText(new URL(findUrl(demo.slug), location.href).href); return true; } catch { return false; } }}
                  onShare={() => {}}
                  found={found}
                  onToggleFound={() => setFound((f) => !f)}
                />
              </div>
            </article>
          )}</div>}
          {toastP.item && (
            <div className="toast" role="status" key={toastP.item.id} data-state={toastP.closing ? 'closing' : undefined}>
              <Icon name="info" size={22} />
              <span className="toast__text">{toastP.item.text}</span>
              <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => setToast(null)} tabIndex={toastP.closing ? -1 : undefined}><Icon name="close" size={18} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
