// The map's two menus, one implementation each, dressed per platform in map.css.
//   Filters: Mindtrip's menu with counts on desktop (radio and checkbox rows, counts in grey pills, hairlines
//   between groups, Zillow's "Reset all filters"); Tide Guide's navy glass menu with a check column on phone.
//   Basemap: Felt's basemap popover (thumbnail rows, the selected one ringed pink) with a grid checkbox row.
// Category filtering lives in the chip row, so the menu holds the other groups (one control per action).
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './ui';
import type { IconName } from '../ui/icons';
import { verificationLabels, type Filters, type MapFind, type MapLayer, type MapRegion, passes } from './types';

function Popover({ id, label, open, onClose, anchor, className, children }: { id: string; label: string; open: boolean; onClose: (restore: boolean) => void; anchor: React.RefObject<HTMLElement | null>; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (box.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(true); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true }));
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  }, [open]);
  return (
    <div ref={box} id={id} className={['popover', className].filter(Boolean).join(' ')} role="dialog" aria-label={label} data-open={open} hidden={!open}>
      {children}
    </div>
  );
}

function Row({ type, name, checked, onChange, icon, label, count, disabled }: { type: 'radio' | 'checkbox'; name: string; checked: boolean; onChange: () => void; icon?: IconName; label: string; count?: number; disabled?: boolean }) {
  return (
    <label className={`mrow${disabled ? ' is-empty' : ''}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="mrow__input" />
      <span className={`mrow__mark mrow__mark--${type}`} aria-hidden="true"><Icon name="check" size={16} stroke={2} /></span>
      {icon && <Icon name={icon} size={20} className="mrow__icon" />}
      <span className="mrow__label">{label}</span>
      {count !== undefined && <span className="mrow__count tabular">{count}</span>}
    </label>
  );
}

export function FilterMenu({ open, onClose, anchor, finds, filters, setFilters, regions, search, onReset }: { open: boolean; onClose: (restore: boolean) => void; anchor: React.RefObject<HTMLElement | null>; finds: MapFind[]; filters: Filters; setFilters: (f: Filters) => void; regions: MapRegion[]; search: string; onReset: () => void }) {
  const count = (skip: keyof Filters, test: (f: MapFind) => boolean) => finds.filter((f) => passes(f, filters, search, skip) && test(f)).length;
  const levels = [...new Set(finds.map((f) => f.verification))];
  const regionRows = regions
    .map((r) => ({ ...r, n: count('region', (f) => f.regionIds.includes(r.id)) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  return (
    <Popover id="map-filters" label="Filters" open={open} onClose={onClose} anchor={anchor} className="popover--filters">
      <div className="popover__head">
        <Icon name="filter" size={20} />
        <span className="popover__title">Filter finds</span>
        <button type="button" className="popover__reset" onClick={onReset}>Reset all</button>
      </div>
      <div className="popover__scroll">
        <fieldset className="mgroup">
          <legend className="mgroup__title">Verification</legend>
          <Row type="radio" name="verification" checked={filters.verification === 'all'} onChange={() => set({ verification: 'all' })} label="All" count={count('verification', () => true)} />
          {levels.map((l) => {
            const n = count('verification', (f) => f.verification === l);
            return <Row key={l} type="radio" name="verification" checked={filters.verification === l} onChange={() => set({ verification: l })} label={verificationLabels[l] ?? l} count={n} disabled={n === 0} />;
          })}
        </fieldset>
        <fieldset className="mgroup">
          <legend className="mgroup__title">Show</legend>
          <Row type="checkbox" name="hasClip" checked={filters.hasClip} onChange={() => set({ hasClip: !filters.hasClip })} label="With a clip" count={count('hasClip', (f) => !!f.clip)} />
          <Row type="checkbox" name="spoilers" checked={filters.spoilers} onChange={() => set({ spoilers: !filters.spoilers })} label="Spoilers" count={count('spoilers', (f) => f.spoiler)} />
          <Row type="checkbox" name="mature" checked={filters.mature} onChange={() => set({ mature: !filters.mature })} label="Mature" count={count('mature', (f) => f.mature)} />
        </fieldset>
        <fieldset className="mgroup">
          <legend className="mgroup__title">Region</legend>
          <Row type="radio" name="region" checked={filters.region === 'all'} onChange={() => set({ region: 'all' })} label="All of Leonida" count={count('region', () => true)} />
          {regionRows.map((r) => (
            <Row key={r.id} type="radio" name="region" checked={filters.region === r.id} onChange={() => set({ region: r.id })} label={r.name} count={r.n} disabled={r.n === 0} />
          ))}
        </fieldset>
      </div>
    </Popover>
  );
}

/** Collectible layer switches: one row per layer, off by default. Used in the basemap menu and the desktop Legend. */
export function LayerRows({ layers, on, setOn }: { layers: MapLayer[]; on: string[]; setOn: (ids: string[]) => void }) {
  return (
    <>
      {layers.map((l) => (
        <Row key={l.id} type="checkbox" name={`layer-${l.id}`} checked={on.includes(l.id)} onChange={() => setOn(on.includes(l.id) ? on.filter((x) => x !== l.id) : [...on, l.id])} label={l.label} count={l.count} />
      ))}
    </>
  );
}

export function BasemapMenu({ open, onClose, anchor, basemap, setBasemap, grid, setGrid, layers, layersOn, setLayersOn }: { open: boolean; onClose: (restore: boolean) => void; anchor: React.RefObject<HTMLElement | null>; basemap: 'official' | 'muted'; setBasemap: (b: 'official' | 'muted') => void; grid: boolean; setGrid: (g: boolean) => void; layers: MapLayer[]; layersOn: string[]; setLayersOn: (ids: string[]) => void }) {
  const options: { id: 'official' | 'muted'; label: string }[] = [
    { id: 'official', label: 'Official' },
    { id: 'muted', label: 'Muted' },
  ];
  return (
    <Popover id="map-basemap" label="Basemap" open={open} onClose={onClose} anchor={anchor} className="popover--basemap">
      <div className="popover__head"><Icon name="layers" size={20} /><span className="popover__title">Basemap</span></div>
      <div className="basemaps" role="radiogroup" aria-label="Basemap">
        {options.map((o) => (
          <label key={o.id} className={`basemap${basemap === o.id ? ' is-selected' : ''}`}>
            <input type="radio" name="basemap" className="mrow__input" checked={basemap === o.id} onChange={() => setBasemap(o.id)} />
            <span className={`basemap__thumb basemap__thumb--${o.id}`} aria-hidden="true" />
            <span className="basemap__label">{o.label}</span>
          </label>
        ))}
      </div>
      <div className="popover__foot">
        <Row type="checkbox" name="grid" checked={grid} onChange={() => setGrid(!grid)} icon="grid" label="Show the grid" />
      </div>
      {layers.length > 0 && (
        <div className="popover__scroll popover__scroll--layers">
          <fieldset className="mgroup">
            <legend className="mgroup__title">Collectible layers</legend>
            <LayerRows layers={layers} on={layersOn} setOn={setLayersOn} />
          </fieldset>
          <p className="popover__note">Locations from Game Checklists, with their numbers.</p>
        </div>
      )}
    </Popover>
  );
}
