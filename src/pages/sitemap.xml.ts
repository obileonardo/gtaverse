// sitemap.xml: every public page from src/lib/routes.ts, with the content's own update date where it has one.
// Built whatever the launch switch says; robots.txt only points crawlers at it once the site is indexable.
import type { APIRoute } from 'astro';
import { routes } from '../lib/routes';
import { absolute } from '../lib/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const urls = routes.map((r) => `  <url><loc>${esc(absolute(r.path))}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ''}</url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
