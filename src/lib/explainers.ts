// Turns an explainer's rendered markdown into the parts the explainer page lays out: a standfirst, body HTML with
// citations and callouts, level tables, the contents list and short source names. Content is never rewritten:
// only its presentation changes ([n] citations become links, "Note:" paragraphs become callouts).
import { explainers, findBySlug, connectionById, regionById } from './content';
import { icons, type IconName } from '../components/ui/icons';
import type { LevelRow } from '../components/ui/LevelTable.astro';

export type Explainer = (typeof explainers)[number];
type Mod = Explainer & { compiledContent: () => Promise<string> | string; getHeadings: () => { depth: number; slug: string; text: string }[] };
export type Segment = { type: 'html'; html: string } | { type: 'table'; head: string[]; rows: LevelRow[]; footnote?: string; caption?: string };

const svg = (name: IconName, size = 20) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(icons[name] as { line: string }).line}</svg>`;

const cite = (n: string) => `<sup class="cite"><a href="#source-${n}" aria-label="Source ${n}">${n}</a></sup>`;

// [[find:id]], [[connection:id]], [[region:id]] cross references (validated at build).
const crossRefs = (html: string) =>
  html.replace(/\[\[(find|connection|region):([\w-]+)\]\]/g, (_, kind: string, id: string) => {
    if (kind === 'find') { const f = findBySlug(id); return f ? `<a href="/finds/${f.slug}">${f.title}</a>` : id; }
    if (kind === 'connection') { const c = connectionById(id); return c ? `<a href="/gtaverse/${c.slug}">${c.title}</a>` : id; }
    return regionById(id)?.name ?? id;
  });

const citations = (html: string) => html.replace(/\s?\[(\d+)\]/g, (_, n: string) => cite(n));

const callouts = (html: string) =>
  html.replace(/<p>Note:\s*([\s\S]*?)<\/p>/g, (_, body: string) => `<aside class="callout" role="note">${svg('alert')}<p><strong>Note:</strong> ${body}</p></aside>`);

// Badges for the wanted states (the explainer's state table). Matched on the state's own words.
const stateBadge = (label: string): LevelRow['badge'] => {
  const l = label.toLowerCase();
  if (l.includes('heat') && l.includes('unknown')) return { icon: 'flame', tone: 5 };
  if (l.includes('heat')) return { icon: 'flame', solid: true, tone: 5 };
  if (l.includes('respond')) return { icon: 'radio', tone: 1 };
  if (l.includes('unknown')) return { icon: 'star', tone: 2 };
  if (l.includes('pursuit')) return { icon: 'star', solid: true, tone: 3 };
  if (l.includes('lost')) return { icon: 'star-flash', tone: 4 };
  return undefined;
};

const cellsOf = (row: string, tag: 'td' | 'th') => [...row.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1].trim());

const parseTable = (table: string, sources: { url: string; title?: string }[]): Segment => {
  const head = cellsOf(table.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '', 'th');
  const body = table.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
  const refs = new Set<string>();
  const strip = (c: string) => c.replace(/\s?\[(\d+)\]/g, (_, n: string) => { refs.add(n); return ''; }).trim();
  const isStates = /^state$/i.test(head[0] ?? '');
  const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => {
    const cells = cellsOf(m[1], 'td').map(strip);
    return { label: cells[0], badge: isStates ? stateBadge(cells[0]) : undefined, cells: cells.slice(1) };
  });
  const footnote = refs.size ? `Source: ${[...refs].map((n) => `${sources[Number(n) - 1] ? sourceName(sources[Number(n) - 1]) : 'source'} ${cite(n)}`).join(', ')}` : undefined;
  return { type: 'table', head, rows, footnote, caption: isStates ? 'Wanted states' : undefined };
};

export async function explainerParts(e: Explainer) {
  const mod = e as Mod;
  let html = await mod.compiledContent();
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');
  html = crossRefs(html);
  // Standfirst: the first plain paragraph (not a note).
  let standfirst = '';
  html = html.replace(/<p>(?!Note:)([\s\S]*?)<\/p>/, (_, p: string) => { standfirst = p; return ''; });
  const segments: Segment[] = [];
  let last = 0;
  for (const m of html.matchAll(/<table>[\s\S]*?<\/table>/g)) {
    segments.push({ type: 'html', html: citations(callouts(html.slice(last, m.index))) });
    segments.push(parseTable(m[0], e.frontmatter.sources));
    last = (m.index ?? 0) + m[0].length;
  }
  segments.push({ type: 'html', html: citations(callouts(html.slice(last))) });
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    standfirst: citations(standfirst),
    segments,
    headings: mod.getHeadings().filter((h) => h.depth === 2),
    minutes: Math.max(1, Math.round(words / 220)),
  };
}

/** A short name for a source chip (Lightyear): the publisher in the title's brackets, else the site. */
export const sourceName = (s: { url: string; title?: string }) => {
  const inBrackets = s.title?.match(/\(([^),]+)/)?.[1]?.trim();
  if (inBrackets) return inBrackets;
  try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return s.url; }
};
