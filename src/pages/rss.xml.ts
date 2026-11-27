// The new finds feed (RSS 2.0): every published find, newest first by added_at. Spoiler and mature finds carry a
// gate line instead of their summary, as on the rest of the site; a mature find is titled "Mature find: <type>" (LR83).
import type { APIRoute } from 'astro';
import { byNewest, safeSummary } from '../lib/feed';
import { categoryLabel, regionLabel, publicTitle } from '../lib/media';
import { creditLine } from '../lib/finds';
import { site, absolute } from '../lib/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Midday UTC on the day added, in the RFC 822 form RSS asks for.
const rfc822 = (d?: string) => new Date(`${d ?? '1970-01-01'}T12:00:00Z`).toUTCString();

export const GET: APIRoute = () => {
  const items = byNewest.map((f) => {
    const url = absolute(`/finds/${f.slug}`);
    const credit = creditLine(f);
    const desc = [safeSummary(f), [regionLabel(f), credit].filter(Boolean).join('. ')].filter(Boolean).join(' ');
    return [
      '    <item>',
      `      <title>${esc(publicTitle(f))}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc822(f.added_at)}</pubDate>`,
      `      <category>${esc(categoryLabel(f))}</category>`,
      `      <description>${esc(desc)}</description>`,
      '    </item>',
    ].join('\n');
  });
  const last = byNewest[0]?.added_at;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>New finds | ${esc(site.name)}</title>
    <link>${absolute('/finds')}</link>
    <atom:link href="${absolute('/rss.xml')}" rel="self" type="application/rss+xml" />
    <description>New secrets found in GTA VI, each with its sources and the fan who found it.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(last)}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
