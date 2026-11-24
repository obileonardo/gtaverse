// One find, in two shapes.
//   Desktop: the Felt inspector card at the right of the map. Clip on top (16:9, Frame.io player surface), display
//   caps title (corner) and close, the summary, the verification badge row (corner), Felt's icon actions, then
//   underline tabs: Details (PamPam labelled wells and Apple TV credit cards) and Sources (Zesty source chips).
//   Phone: the Apple Maps place sheet with the clip at the top (MasterClass, owner answer 4B): grabber, share and
//   close circles, centred title and subtitle, badge, three equal actions, the stat row, credits, about, sources.
import { useState, type ReactNode } from 'react';
import { ClipPlayer } from './ClipPlayer';
import { Button, Icon, Tabs, Verification } from './ui';
import { accuracyLabels, cellOf, findUrl, formatDate, platformLabel, sourceIcon, type MapFind, type MapMeta } from './types';

type Common = {
  find: MapFind;
  meta: MapMeta;
  onClose: () => void;
  onShowOnMap: () => void;
  onCopy: () => void;
  onShare: () => void;
  titleId: string;
  found: boolean; // found tracker (found.ts)
  onToggleFound: () => void;
};

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };

function Credits({ find }: { find: MapFind }) {
  const cards: { name: string; role: string; url: string | null; icon: 'person' | 'clip' }[] = [];
  if (find.finder) cards.push({ name: find.finder.handle, role: `First found it, on ${platformLabel(find.finder.platform)}`, url: find.finder.url, icon: 'person' });
  if (find.clip?.creator) cards.push({ name: find.clip.creator, role: `Clip, on ${platformLabel(find.clip.platform)}`, url: find.clip.url, icon: 'clip' });
  if (!cards.length) cards.push({ name: 'Not credited yet', role: 'The first finder is not known', url: null, icon: 'person' });
  return (
    <ul className="credits" role="list">
      {cards.map((c) => {
        const body = (
          <>
            <span className="credits__avatar" aria-hidden="true">{c.name === 'Not credited yet' ? <Icon name={c.icon} size={22} /> : c.name.replace(/^u\//, '').slice(0, 1).toUpperCase()}</span>
            <span className="credits__text"><span className="credits__name">{c.name}</span><span className="credits__role">{c.role}</span></span>
            {c.url && <Icon name="arrow-up-right" size={20} className="credits__go" />}
          </>
        );
        return <li key={c.name + c.role}>{c.url ? <a className="credits__card" href={c.url} target="_blank" rel="noopener">{body}</a> : <div className="credits__card">{body}</div>}</li>;
      })}
    </ul>
  );
}

function Sources({ find, scroll }: { find: MapFind; scroll?: boolean }) {
  return (
    <ul className={`sources${scroll ? ' sources--scroll' : ''}`} role="list">
      {find.sources.map((s) => (
        <li key={s.url}>
          <a className="source" href={s.url} target="_blank" rel="noopener">
            <span className="source__icon"><Icon name={sourceIcon(s.type)} size={16} /></span>
            <span className="source__label">{s.creator ?? hostOf(s.url)}</span>
            <Icon name="arrow-up-right" size={16} className="source__go" />
          </a>
        </li>
      ))}
    </ul>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="field">
    <dt className="field__label">{label}</dt>
    <dd className="field__well">{children}</dd>
  </div>
);

function pinText(find: MapFind, meta: MapMeta) {
  if (!find.pin) return 'Not placed yet';
  const cell = cellOf(find.pin, meta);
  return [find.pinAccuracy ? accuracyLabels[find.pinAccuracy] ?? find.pinAccuracy : null, cell ? `cell ${cell}` : null].filter(Boolean).join(', ');
}

export function DrawerContent({ find, meta, onClose, onShowOnMap, onCopy, titleId, found, onToggleFound }: Common) {
  const [tab, setTab] = useState<'details' | 'sources'>('details');
  return (
    <>
      <ClipPlayer find={find} variant="drawer" />
      <div className="drawer__body">
        <div className="drawer__head">
          <h2 className="drawer__title" id={titleId}>{find.title}</h2>
          <Button variant="ghost" size="s" icon="close" iconOnly label="Close" onClick={onClose} className="drawer__close" />
        </div>
        <p className="drawer__summary">{find.summary}</p>
        <p className="drawer__tags"><Verification level={find.verification} /><span className="drawer__tagline">{find.categoryLabel} · {find.regionLabel}</span></p>
        <div className="drawer__actions">
          <Button variant="ghost" size="m" icon="link" iconOnly label="Copy link to this find" onClick={onCopy} />
          <Button variant="ghost" size="m" icon="pin" iconOnly label={find.pin ? 'Show on the map' : 'No pin yet'} onClick={onShowOnMap} disabled={!find.pin} />
          <Button variant="ghost" size="m" icon="check" iconOnly label={found ? 'Found. Mark as not found' : 'Mark as found'} aria-pressed={found} onClick={onToggleFound} className="found-toggle" />
          <Button variant="ghost" size="m" icon="arrow-right" iconOnly label="Open the find page" href={findUrl(find.slug)} className="drawer__open" />
        </div>
        <div className="drawer__tabs">
          <Tabs id="drawer" label="Find" selected={tab} onSelect={(t) => setTab(t as 'details' | 'sources')} tabs={[{ id: 'details', label: 'Details' }, { id: 'sources', label: `Sources (${find.sources.length})` }]}>
            {(t) => t === 'details' ? (
              <>
                <dl className="fields">
                  {find.where && <Field label="Where">{find.where}</Field>}
                  <Field label="Region">{find.regionLabel}</Field>
                  <Field label="Pin">{pinText(find, meta)}</Field>
                  {formatDate(find.updated) && <Field label="Updated">{formatDate(find.updated)}</Field>}
                </dl>
                <h3 className="drawer__label">Credits</h3>
                <Credits find={find} />
              </>
            ) : <Sources find={find} />}
          </Tabs>
        </div>
      </div>
    </>
  );
}

export function SheetContent({ find, meta, onClose, onShowOnMap, onShare, titleId, found, onToggleFound }: Common) {
  const pinValue = find.pin ? (find.pinAccuracy ? (accuracyLabels[find.pinAccuracy] ?? find.pinAccuracy).split(' ')[0] : 'Placed') : 'None';
  const stats = [
    { label: 'Sources', value: String(find.sources.length) },
    { label: 'Clip', value: find.clip ? platformLabel(find.clip.platform) : 'None' },
    { label: 'Pin', value: pinValue },
    { label: 'Updated', value: formatDate(find.updated) ?? 'n/a' },
  ];
  return (
    <>
      <div className="fsheet__top" data-sheet-handle>
        <ClipPlayer find={find} variant="sheet" />
        <span className="grabber" aria-hidden="true" />
        <Button variant="glass" size="l" icon="share" iconOnly label="Share this find" onClick={onShare} className="fsheet__corner fsheet__corner--left" />
        <Button variant="glass" size="l" icon="close" iconOnly label="Close" onClick={onClose} className="fsheet__corner fsheet__corner--right" />
      </div>
      <div className="fsheet__body">
        <header className="fsheet__head" data-sheet-handle>
          <h2 className="fsheet__title" id={titleId}>{find.title}</h2>
          <p className="fsheet__sub">{find.categoryLabel} · {find.regionLabel}</p>
          <p className="fsheet__badge"><Verification level={find.verification} /></p>
        </header>
        <div className="fsheet__actions">
          <Button variant="primary" stack icon="arrow-right" href={findUrl(find.slug)}>Find page</Button>
          <Button variant="secondary" stack icon="pin" onClick={onShowOnMap} disabled={!find.pin}>{find.pin ? 'Map' : 'No pin yet'}</Button>
          <Button variant="secondary" stack icon="check" onClick={onToggleFound} aria-pressed={found} className="found-toggle">Found</Button>
          <Button variant="secondary" stack icon="share" onClick={onShare}>Share</Button>
        </div>
        <dl className="stats">
          {stats.map((s) => (
            <div key={s.label} className="stats__item"><dt>{s.label}</dt><dd className="tabular">{s.value}</dd></div>
          ))}
        </dl>
        <section className="fsheet__section" aria-labelledby={`${titleId}-credits`}>
          <h3 className="fsheet__label" id={`${titleId}-credits`}>Credits</h3>
          <Credits find={find} />
        </section>
        <section className="fsheet__section" aria-labelledby={`${titleId}-about`}>
          <h3 className="fsheet__h" id={`${titleId}-about`}>About</h3>
          <p className="fsheet__text">{find.summary}</p>
          {find.where && <p className="fsheet__text fsheet__where"><Icon name="pin" size={20} /><span>{find.where}</span></p>}
        </section>
        <section className="fsheet__section" aria-labelledby={`${titleId}-sources`}>
          <h3 className="fsheet__h" id={`${titleId}-sources`}>Sources</h3>
          <Sources find={find} scroll />
        </section>
      </div>
    </>
  );
}
