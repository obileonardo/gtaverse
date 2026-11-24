// llms.txt (llmstxt.org): a plain map of the site for language models, built from src/lib/routes.ts.
// Spoiler and mature finds are listed by title only, as on the rest of the site.
import type { APIRoute } from 'astro';
import { site, absolute } from '../lib/site';
import { staticRoutes, explainerRoutes, regionRoutes, categoryRoutes } from '../lib/routes';
import { byNewest, safeSummary } from '../lib/feed';

const line = (title: string, path: string, note?: string) => `- [${title}](${absolute(path)})${note ? `: ${note}` : ''}`;

export const GET: APIRoute = () => {
  const pages = staticRoutes.filter((r) => r.kind !== 'home');
  const body = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    'An unofficial, non-commercial fan project, not affiliated with Rockstar Games or Take-Two Interactive. Every find cites its sources and carries a verification level (multi-source, single source, rumour, debunked). Clips play from their creators\' own posts. Original text and data are CC BY-NC 4.0 (credit "The Vice Files contributors"); game names, images and the Leonida map belong to their owners.',
    '',
    '## Sections and policies',
    '',
    ...pages.map((r) => line(r.title, r.path, r.description)),
    '',
    '## Explainers',
    '',
    ...explainerRoutes.map((r) => line(r.title, r.path)),
    '',
    '## Finds, newest first',
    '',
    ...byNewest.map((f) => line(f.title, `/finds/${f.slug}`, safeSummary(f))),
    '',
    '## Optional',
    '',
    ...categoryRoutes.map((r) => line(`${r.title} (category)`, r.path, r.meta)),
    ...regionRoutes.map((r) => line(`${r.title} (${r.kicker.toLowerCase()})`, r.path, r.meta)),
    line('New finds feed (RSS)', '/rss.xml'),
    line('Sitemap', '/sitemap.xml'),
    line('Source code and content', site.repo),
    '',
  ];
  return new Response(body.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
