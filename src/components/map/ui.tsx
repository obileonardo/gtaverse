// The design system's components for the map's React island. Same classes as the Astro components in
// src/components/ui (styles live once, in src/styles/components.css) and the same icon set, so a button, chip,
// badge or tab on the map is the site's button, chip, badge or tab. Change the look in components.css, not here.
import { useEffect, useLayoutEffect, useRef, type ReactNode, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { icons, type IconName } from '../ui/icons';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Icon({ name, size = 20, solid = false, label, className, stroke }: { name: IconName; size?: number; solid?: boolean; label?: string; className?: string; stroke?: number }) {
  const def = icons[name] as { line: string; solid?: string };
  const markup = solid && def.solid ? def.solid : def.line;
  return (
    <svg
      className={['icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

// The same variants and layouts as ui/Button.astro (variant, size, icon, iconEnd, iconOnly, stack).
type Variant = 'primary' | 'inverse' | 'glass' | 'secondary' | 'quiet' | 'ghost' | 'outline';
type BtnProps = {
  variant?: Variant;
  size?: 's' | 'm' | 'l' | 'xl';
  icon?: IconName;
  iconEnd?: IconName;
  iconOnly?: boolean;
  stack?: boolean;
  label?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>;

export function Button({ variant = 'primary', size = 'm', icon, iconEnd, iconOnly, stack, label, href, children, className, ...rest }: BtnProps) {
  const iconSize = size === 's' ? 16 : size === 'm' ? 20 : 24;
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, iconOnly && 'btn--icon', stack && 'btn--stack', className].filter(Boolean).join(' ');
  const inner = (
    <>
      {icon && <Icon name={icon} size={stack ? 20 : iconSize} />}
      {!iconOnly && <span className="btn__label">{children}</span>}
      {iconEnd && <Icon name={iconEnd} size={stack ? 20 : iconSize} />}
    </>
  );
  if (href) {
    const { target, rel, onClick } = rest;
    return <a className={cls} href={href} target={target} rel={rel} onClick={onClick as never} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>{inner}</a>;
  }
  const { target: _t, rel: _r, ...btn } = rest;
  return <button type="button" className={cls} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined} {...btn}>{inner}</button>;
}

export function Chip({ icon, selected = false, glass, touch, count, children, className, ...rest }: { icon?: IconName; selected?: boolean; glass?: boolean; touch?: boolean; count?: number; children: ReactNode; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const cls = ['chip', glass && 'chip--glass', touch && 'chip--touch', selected && 'is-selected', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-pressed={selected} {...rest}>
      {icon && <Icon name={icon} size={touch ? 20 : 16} />}
      <span>{children}</span>
      {count !== undefined && <span className="chip__count tabular">{count}</span>}
      <span className="chip__check" aria-hidden="true"><span><Icon name="check" size={touch ? 18 : 16} stroke={2} /></span></span>
    </button>
  );
}

export function Badge({ variant = 'meta', icon, caps = true, children, title, className }: { variant?: 'meta' | 'verified' | 'outline' | 'muted' | 'debunked' | 'new'; icon?: IconName; caps?: boolean; children: ReactNode; title?: string; className?: string }) {
  return (
    <span className={['badge', `badge--${variant}`, caps && 'badge--caps', className].filter(Boolean).join(' ')} title={title}>
      {icon && <Icon name={icon} size={14} stroke={2} />}
      <span className="badge__label">{children}</span>
    </span>
  );
}

const levels: Record<string, { label: string; variant: 'verified' | 'outline' | 'muted' | 'debunked'; icon: IconName }> = {
  'multi-source': { label: 'Multi-source', variant: 'verified', icon: 'check' },
  'single-source': { label: 'Single source', variant: 'outline', icon: 'dot' },
  rumor: { label: 'Rumour', variant: 'muted', icon: 'question' },
  debunked: { label: 'Debunked', variant: 'debunked', icon: 'cross' },
};
/** Same mapping as src/components/Verification.astro. */
export function Verification({ level }: { level: string }) {
  const v = levels[level] ?? { label: level, variant: 'outline' as const, icon: 'dot' as IconName };
  return <Badge variant={v.variant} icon={v.icon} className="verification" title={`Verification: ${v.label}`}>{v.label}</Badge>;
}

/** Underline tabs (ui/Tabs.astro): same markup, keyboard and moving underline. */
export function Tabs({ id, tabs, selected, onSelect, label = 'Sections', children }: { id: string; tabs: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void; label?: string; children: (id: string) => ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const instant = useRef(true);
  useIsoLayoutEffect(() => {
    const list = listRef.current, bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>(`[aria-selected="true"]`);
      if (tab) bar.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`;
    };
    if (instant.current) bar.classList.add('is-instant');
    place();
    const raf = requestAnimationFrame(() => { bar.classList.remove('is-instant'); instant.current = false; });
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [selected]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    instant.current = true; // keyboard moves do not animate the underline
    onSelect(tabs[next].id);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`#${id}-tab-${tabs[next].id}`)?.focus());
  };
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} ref={listRef}>
        {tabs.map((t, i) => (
          <button key={t.id} type="button" role="tab" className="tabs__tab" id={`${id}-tab-${t.id}`} aria-controls={`${id}-panel-${t.id}`} aria-selected={t.id === selected} tabIndex={t.id === selected ? 0 : -1} onClick={() => onSelect(t.id)} onKeyDown={(e) => onKey(e, i)}>
            {t.label}
          </button>
        ))}
        <span className="tabs__indicator" aria-hidden="true" ref={barRef} />
      </div>
      {tabs.map((t) => (
        <div key={t.id} className="tabs__panel" role="tabpanel" id={`${id}-panel-${t.id}`} aria-labelledby={`${id}-tab-${t.id}`} hidden={t.id !== selected} tabIndex={0}>
          {t.id === selected ? children(t.id) : null}
        </div>
      ))}
    </div>
  );
}
