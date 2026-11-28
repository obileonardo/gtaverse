// Structured data (JSON-LD, schema.org) for each page type. Only our own words and facts already on the page;
// no ratings, no reviews, no images of Rockstar's. Base.astro prints whatever a page passes as `jsonLd`, plus a
// BreadcrumbList from its `breadcrumbs`.
import { site, absolute } from './site';
import { ogPath } from './routes';
import { pageDescription } from './map-fields';

type Json = Record<string, unknown>;
export type Crumb = { name: string; href: string };

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;

/** The Vice Files as an organization, with its policy pages. */
export const organization = (): Json => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  url: absolute('/'),
  logo: absolute('/icon-512.png'),
  description: site.description,
  email: site.takedownEmail,
  sameAs: [site.repo],
  publishingPrinciples: absolute('/editorial-policy'),
  correctionsPolicy: absolute('/corrections'),
  ethicsPolicy: absolute('/editorial-policy'),
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'takedowns and credit corrections',
    email: site.takedownEmail,
    url: absolute('/takedown'),
  },
});

/** The site, with a search box that opens the map filtered by the words typed. */
export const website = (): Json => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: site.name,
  url: absolute('/'),
  description: site.description,
  inLanguage: site.language,
  publisher: { '@id': ORG_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/map?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbList = (crumbs: Crumb[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.href) })),
});

const page = (type: string, path: string, name: string, description: string, extra: Json = {}): Json => ({
  '@context': 'https://schema.org',
  '@type': type,
  '@id': `${absolute(path)}#page`,
  url: absolute(path),
  name,
  description,
  inLanguage: site.language,
  isPartOf: { '@id': SITE_ID },
  publisher: { '@id': ORG_ID },
  primaryImageOfPage: { '@type': 'ImageObject', url: absolute(ogPath(path)), width: 1200, height: 630 },
  ...extra,
});

/** A find: the page about one thing in the game, with the posts it is sourced from. */
export const findPage = (f: { slug: string; title: string; summary: string; mature: boolean; category: string; region_ids: string[]; added_at?: string; updated_at?: string; sources: { url: string }[] }, credit: { name: string; url: string | null } | null): Json =>
  page('ItemPage', `/finds/${f.slug}`, f.title, pageDescription(f), {
    datePublished: f.added_at,
    dateModified: f.updated_at,
    about: { '@type': 'Thing', name: f.title, description: pageDescription(f) },
    citation: f.sources.map((s) => s.url),
    ...(credit ? { contributor: { '@type': 'Person', name: credit.name, ...(credit.url ? { url: credit.url } : {}) } } : {}),
  });

/** An explainer: an article written from cited sources. */
export const explainerArticle = (e: { slug: string; title: string; description: string; updated: string; sources: { url: string }[] }): Json => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${absolute(`/explainers/${e.slug}`)}#article`,
  headline: e.title.slice(0, 110),
  description: e.description,
  url: absolute(`/explainers/${e.slug}`),
  mainEntityOfPage: absolute(`/explainers/${e.slug}`),
  image: absolute(ogPath(`/explainers/${e.slug}`)),
  dateModified: e.updated,
  inLanguage: site.language,
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  isPartOf: { '@id': SITE_ID },
  citation: e.sources.map((s) => s.url),
});

/** A hub or list page: a collection with its items in order. */
export const collectionPage = (path: string, name: string, description: string, items: { name: string; href: string }[]): Json =>
  page('CollectionPage', path, name, description, {
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: absolute(it.href) })),
    },
  });

/** Any other page (about, policies). `type` is a WebPage subtype such as AboutPage. */
export const webPage = (path: string, name: string, description: string, type = 'WebPage'): Json => page(type, path, name, description);
