// Every public page, in one list. The sitemap, llms.txt and the Open Graph cards are built from it, so a page
// added here gets all three. Base.astro uses it to point each page at its own card.
import { finds, explainers, categoryById } from './content';
import { moments } from './lore';
import { regionHubs, categoryHubs, findsInRegion, findsInCategory, regionTypeLabel } from './hubs';
import { categoryLabel, regionLabel, pageDescription } from './media';
import { verificationLabel } from './finds';
import { games, connectionsForGame, findsForGame } from './games';

export type RouteKind = 'home' | 'section' | 'page' | 'find' | 'explainer' | 'connection' | 'region' | 'category' | 'game';
export type Route = {
  path: string;
  title: string;
  description: string;
  /** Small caps line above the title on the Open Graph card. */
  kicker: string;
  /** One line under the title on the card. */
  meta?: string;
  kind: RouteKind;
  lastmod?: string;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const newest = (dates: (string | undefined)[]) => dates.filter(Boolean).sort().at(-1);

/** Fixed pages. Titles match the pages' own <title>. */
export const staticRoutes: Route[] = [
  { path: '/', kind: 'home', kicker: 'Fan field guide', title: 'The Vice Files', meta: `${plural(finds.length, 'find')} in Leonida, each with its sources`, description: 'Every secret in Leonida, shown in the clip of the fan who found it, with its sources and how sure we are.' },
  { path: '/map', kind: 'section', kicker: 'Map', title: 'Map of Leonida', description: 'Every find in Leonida on the official map, with the clip, the credit and how sure we are.' },
  { path: '/finds', kind: 'section', kicker: 'Finds', title: 'All finds', meta: plural(finds.length, 'find'), description: `${finds.length} secrets found in GTA VI, each shown in the clip of the fan who found it.` },
  { path: '/explainers', kind: 'section', kicker: 'Explainers', title: 'Explainers', meta: plural(explainers.length, 'guide'), description: "How GTA VI's systems work, from wanted levels to relationships, written from sources and labelled when unreviewed." },
  { path: '/gtaverse', kind: 'section', kicker: 'GTAverse', title: 'The GTAverse', meta: plural(moments.length, 'connection'), description: 'The shared universe across GTA I to VI, Red Dead, Bully and L.A. Noire: every link to GTA VI, placed on one timeline.' },
  { path: '/gtaverse/games', kind: 'section', kicker: 'GTAverse', title: 'Games of the GTAverse', meta: plural(games.length, 'game'), description: `The ${games.length} Rockstar games the GTAverse links to GTA VI, each with its connections and finds.` },
  { path: '/data', kind: 'page', kicker: 'Open data', title: 'Open data', description: 'Download The Vice Files finds, GTAverse connections and collectible locations as JSON, under CC BY-NC 4.0.' },
  { path: '/finders', kind: 'page', kicker: 'Credits', title: 'The finders', description: 'Every fan, creator and outlet whose find, clip or write up is in The Vice Files, with what they found and where to see it.' },
  { path: '/about', kind: 'page', kicker: 'About', title: 'About The Vice Files', description: 'What The Vice Files is, who it is for, how it is made and what it will never do.' },
  { path: '/editorial-policy', kind: 'page', kicker: 'Editorial policy', title: 'Editorial policy', description: 'How we verify a find, what each verification level means, what counts as a source, and the lines we never cross.' },
  { path: '/corrections', kind: 'page', kicker: 'Corrections', title: 'Corrections', description: 'How to tell us something is wrong or uncredited, how fast we fix it, and where every correction is logged.' },
  { path: '/takedown', kind: 'page', kicker: 'Takedowns', title: 'Takedowns and credit requests', description: 'How creators and rights holders ask us to remove or change something. Answered within 48 hours.' },
];

export const findRoutes: Route[] = finds.map((f) => ({
  path: `/finds/${f.slug}`,
  kind: 'find',
  kicker: categoryLabel(f),
  title: f.title,
  meta: `${regionLabel(f)} · ${verificationLabel[f.verification] ?? f.verification}${f.spoiler ? ' · Spoiler' : ''}`,
  description: pageDescription(f),
  lastmod: f.updated_at,
}));

export const explainerRoutes: Route[] = explainers.map((e) => ({
  path: `/explainers/${e.frontmatter.slug}`,
  kind: 'explainer',
  kicker: 'Explainer',
  title: e.frontmatter.title,
  meta: plural(e.frontmatter.sources.length, 'source'),
  description: e.frontmatter.title,
  lastmod: String(e.frontmatter.updated_at).slice(0, 10),
}));

export const connectionRoutes: Route[] = moments.map((m) => ({
  path: `/gtaverse/${m.slug}`,
  kind: 'connection',
  kicker: `GTAverse · ${m.firstGame}`,
  title: m.title,
  meta: `Since ${m.year}`,
  description: m.summary,
}));

export const regionRoutes: Route[] = regionHubs.map((r) => {
  const list = findsInRegion(r.id);
  return {
    path: `/regions/${r.id}`,
    kind: 'region',
    kicker: regionTypeLabel[r.type] ?? 'Region',
    title: r.name,
    meta: plural(list.length, 'find'),
    description: `${plural(list.length, 'find')} in ${r.name}, Leonida, each with its sources and how sure we are.`,
    lastmod: newest(list.map((f) => f.updated_at)),
  };
});

export const categoryRoutes: Route[] = categoryHubs.map((c) => {
  const list = findsInCategory(c.id);
  return {
    path: `/categories/${c.id}`,
    kind: 'category',
    kicker: 'Category',
    title: categoryById(c.id)?.label ?? c.id,
    meta: plural(list.length, 'find'),
    description: c.description,
    lastmod: newest(list.map((f) => f.updated_at)),
  };
});

// Game hubs (decision GS8). Their cards carry text only: game logos never appear on social cards (GS1).
export const gameRoutes: Route[] = games.map((g) => {
  const n = connectionsForGame(g.id).length;
  const f = findsForGame(g.id).length;
  return {
    path: `/gtaverse/games/${g.id}`,
    kind: 'game',
    kicker: `GTAverse · ${g.year}`,
    title: g.name,
    meta: `${plural(n, 'connection')} · ${plural(f, 'find')}`,
    description: `${g.name} in the GTAverse: ${plural(n, 'connection')} to GTA VI and ${plural(f, 'find')} that touch it.`,
  };
});

export const routes: Route[] = [...staticRoutes, ...findRoutes, ...explainerRoutes, ...connectionRoutes, ...gameRoutes, ...regionRoutes, ...categoryRoutes];

/** Normalizes a request path the way the site serves it: no .html, no trailing slash, "/" for the home page. */
export const normalizePath = (p: string) => p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';

export const routeFor = (path: string) => routes.find((r) => r.path === normalizePath(path));

/** Where a page's Open Graph card is served (built by src/pages/og/[...path].png.ts). */
export const ogPath = (path: string) => `/og/${normalizePath(path) === '/' ? 'index' : normalizePath(path).slice(1)}.png`;
