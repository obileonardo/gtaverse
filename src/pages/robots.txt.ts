// robots.txt follows the launch switch (site.indexable in src/lib/site.ts).
// Off: every crawler is asked to stay out, and there is no sitemap line. On: everything is open except the PRD.
import type { APIRoute } from 'astro';
import { site, absolute } from '../lib/site';

export const GET: APIRoute = () => {
  const body = site.indexable
    ? ['User-agent: *', 'Allow: /', 'Disallow: /prd', '', `Sitemap: ${absolute('/sitemap.xml')}`, '']
    : ['# Not open to search engines yet (site.indexable is false in src/lib/site.ts).', 'User-agent: *', 'Disallow: /', ''];
  return new Response(body.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
