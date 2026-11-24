// The map's two menus, one implementation each, dressed per platform in map.css.
//   Filters: Mindtrip's menu with counts on desktop (radio and checkbox rows, counts in grey pills, hairlines
//   between groups, Zillow's "Reset all filters"); Tide Guide's navy glass menu with a check column on phone.
//   Basemap: Felt's basemap popover (thumbnail rows, the selected one ringed pink), the grid row and the layers.
// Types are filtered by the Legend rows (desktop) and the category rail (phone), so the menu holds the other groups.
// A menu opens from whichever control asked for it (the panel's objective chip, the HUD row, a phone corner button):
// it is placed beside that control and grows out of it (origin-aware), below it or above it.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Icon } from './ui';
import type { IconName } from '../ui/icons';
import { verificationLabels, type Filters, type MapCategory, type MapFind, type MapLayer, type MapRegion, passes } from './types';
import { exportCode, parseCode } from './found';
import { Blip } from './blip';
import type { ChapterSetting } from '../../lib/chapter';

/** Where a menu opens: beside its opener, growing down from under it or up from above it. */
export type MenuAt = { x: number; y: number; up: boolean; right: boolean };
/** Place a menu from the control that opened it (viewport px). Lower half of the screen: the menu opens upward. */
export const menuAt = (el: HTMLElement): MenuAt => {
  const r = el.getBoundingClientRect();
  const up = r.top > innerHeight / 2;
  const right = r.left + r.width / 2 > innerWidth / 2;
  return { x: right ? innerWidth - r.right : r.left, y: up ? innerHeight - r.top + 8 : r.bottom + 8, up, right };
};

function Popover({ id, label, open, onClose, at, className, children }: { id: string; label: string; open: boolean; onClose: (restore: boolean) => void; at: MenuAt | null; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      // Its own triggers toggle it themselves (a press there must not close and reopen it).
      if (box.current?.contains(t) || t.closest?.(`[aria-controls="${id}"]`)) return;
      onClose(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(true); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true }));
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  }, [open]);
  return (
    <div ref={box} id={id} className={['popover', className].filter(Boolean).join(' ')} role="dialog" aria-label={label} data-open={open} hidden={!open}
      data-up={at?.up || undefined} data-right={at?.right || undefined}
      style={at ? ({ '--mx': `${at.x}px`, '--my': `${at.y}px` } as React.CSSProperties) : undefined}>
      <span className="popover__behind" aria-hidden="true" />
      {children}
    </div>
  );
}

function Row({ type, name, checked, onChange, icon, blip, label, count, disabled }: { type: 'radio' | 'checkbox'; name: string; checked: boolean; onChange: () => void; icon?: IconName; blip?: string; label: string; count?: number | string; disabled?: boolean }) {
  return (
    <label className={`mrow${disabled ? ' is-empty' : ''}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="mrow__input" />
      <span className={`mrow__mark mrow__mark--${type}`} aria-hidden="true"><Icon name="check" size={16} stroke={2} /></span>
      {icon && <Icon name={icon} size={20} className="mrow__icon" />}
      {blip && <Blip category={blip} size={20} className="mrow__icon" />}
      <span className="mrow__label">{label}</span>
      {count !== undefined && <span className="mrow__count tabular">{count}</span>}
    </label>
  );
}

export function FilterMenu({ open, onClose, at, finds, filters, setFilters, regions, search, onReset, categories, found, onImport, chapter }: { open: boolean; onClose: (restore: boolean) => void; at: MenuAt | null; finds: MapFind[]; filters: Filters; setFilters: (f: Filters) => void; regions: MapRegion[]; search: string; onReset: () => void; categories: MapCategory[]; found: Set<string>; onImport: (slugs: string[]) => void; chapter: ChapterSetting }) {
  const count = (skip: keyof Filters, test: (f: MapFind) => boolean) => finds.filter((f) => passes(f, filters, search, skip, found, chapter) && test(f)).length;
  const levels = [...new Set(finds.map((f) => f.verification))];
  const regionRows = regions
    .map((r) => ({ ...r, n: count('region', (f) => f.regionIds.includes(r.id)) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  return (
    <Popover id="map-filters" label="Filters" open={open} onClose={onClose} at={at} className="popover--filters">
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
        <FoundGroup finds={finds} categories={categories} found={found} hide={filters.hideFound} setHide={(v) => set({ hideFound: v })} onImport={onImport} />
      </div>
    </Popover>
  );
}

/** Collectible layer switches: one row per layer, off by default. Used in the basemap menu and the desktop Legend. */
export function LayerRows({ layers, on, setOn }: { layers: MapLayer[]; on: string[]; setOn: (ids: string[]) => void }) {
  return (
    <>
      {layers.map((l) => (
        <Row key={l.id} type="checkbox" name={`layer-${l.id}`} checked={on.includes(l.id)} onChange={() => setOn(on.includes(l.id) ? on.filter((x) => x !== l.id) : [...on, l.id])} blip={l.id} label={l.label} count={l.count} />
      ))}
    </>
  );
}

export function BasemapMenu({ open, onClose, at, basemap, setBasemap, grid, setGrid, layers, layersOn, setLayersOn }: { open: boolean; onClose: (restore: boolean) => void; at: MenuAt | null; basemap: 'official' | 'muted'; setBasemap: (b: 'official' | 'muted') => void; grid: boolean; setGrid: (g: boolean) => void; layers: MapLayer[]; layersOn: string[]; setLayersOn: (ids: string[]) => void }) {
  const options: { id: 'official' | 'muted'; label: string }[] = [
    { id: 'official', label: 'Official' },
    { id: 'muted', label: 'Muted' },
  ];
  return (
    <Popover id="map-basemap" label="Basemap and layers" open={open} onClose={onClose} at={at} className="popover--basemap">
      <div className="popover__head"><Icon name="layers" size={20} /><span className="popover__title">Basemap and layers</span></div>
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
          <p className="popover__note">Collectible locations: <a href={layers[0].url} target="_blank" rel="noopener noreferrer">Game Checklists</a>, with their numbers.</p>
        </div>
      )}
    </Popover>
  );
}

// Found tracker (found.ts): hide what you found, found counts per type, and a code to move your list to another browser.
function FoundGroup({ finds, categories, found, hide, setHide, onImport }: { finds: MapFind[]; categories: MapCategory[]; found: Set<string>; hide: boolean; setHide: (v: boolean) => void; onImport: (slugs: string[]) => void }) {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const total = finds.filter((f) => found.has(f.slug)).length;
  const known = new Set(finds.map((f) => f.slug));
  const doExport = async () => {
    const c = exportCode([...found].filter((s) => known.has(s)));
    setCode(c);
    try { await navigator.clipboard.writeText(c); setNote('Code copied. Paste it into this box on your other browser.'); }
    catch { setNote('Copy the code above. Paste it into this box on your other browser.'); }
  };
  const doImport = () => {
    const slugs = parseCode(code, known);
    if (!slugs) { setNote('That is not a Vice Files code. Codes start with VF1.'); return; }
    const added = slugs.filter((s) => !found.has(s)).length;
    onImport(slugs);
    setNote(added ? `Added ${added} ${added === 1 ? 'find' : 'finds'} to your found list.` : 'Nothing new in that code.');
  };
  return (
    <fieldset className="mgroup mgroup--found" id="map-found">
      <legend className="mgroup__title">Found <span className="mgroup__sub tabular">{total} of {finds.length}</span></legend>
      <Row type="checkbox" name="hideFound" checked={hide} onChange={() => setHide(!hide)} label="Hide found" count={total} />
      <ul className="found-counts" role="list" aria-label="Found by type">
        {categories.map((c) => {
          const all = finds.filter((f) => f.category === c.id);
          const n = all.filter((f) => found.has(f.slug)).length;
          return <li key={c.id} className={n ? 'has-found' : undefined}><Blip category={c.id} size={20} /><span className="found-counts__label">{c.label}</span><span className="found-counts__n tabular">{n}/{all.length}</span></li>;
        })}
      </ul>
      <div className="found-code">
        <label className="found-code__field">
          <span className="sr-only">Found list code</span>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a code to import" autoComplete="off" spellCheck={false} />
        </label>
        <div className="found-code__actions">
          <Button variant="secondary" size="s" onClick={doExport}>Export code</Button>
          <Button variant="quiet" size="s" onClick={doImport} disabled={!code.trim()}>Import</Button>
        </div>
        <p className="found-code__note caption" aria-live="polite">{note || 'Saved on this device only. No account.'}</p>
      </div>
    </fieldset>
  );
}
