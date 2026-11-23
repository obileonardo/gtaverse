// The site's main navigation, shared by the header menu and the footer. Counts are the superscripts in the menu
// (basement.studio style) and come from the published content.
import { finds, connections, explainers } from './content';
import type { IconName } from '../components/ui/icons';

export type NavItem = { href: string; label: string; icon: IconName; count?: number };

export const nav: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/map', label: 'Map', icon: 'map' },
  { href: '/finds', label: 'Finds', icon: 'finds', count: finds.length },
  { href: '/explainers', label: 'Explainers', icon: 'explainers', count: explainers.length },
  { href: '/gtaverse', label: 'GTAverse', icon: 'lore', count: connections.length },
];

export const isCurrent = (path: string, href: string) => {
  const p = path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
  return href === '/' ? p === '/' : p === href || p.startsWith(`${href}/`);
};
