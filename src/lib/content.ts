// Reads the validated content in /content. Only published items reach the site.
import findsRaw from '../../content/finds.json';
import connectionsRaw from '../../content/connections.json';
import regionsRaw from '../../content/regions.json';
import categoriesRaw from '../../content/categories.json';

export type Source = { source_id?: string; type: string; url: string; creator?: string; published?: string | null; embeddable?: boolean };
export type Clip = { platform: string; url: string; creator?: string; source_id?: string } | null;
export type Find = {
  id: string; slug: string; title: string; status: string; category: string; verification: string;
  spoiler: boolean; mature: boolean; chapter_gate: string | null; area?: string; region_ids: string[];
  location_description?: string; pin: { x: number; y: number } | null; summary: string;
  crossover_games?: string[]; related_connections?: string[];
  first_finder: { handle: string; platform: string; url: string } | null; clip: Clip; sources: Source[]; added_at?: string; updated_at?: string;
};
export type Connection = { id: string; slug: string; title: string; type: string; confidence: string; games: string[]; summary: string; related_finds?: string[]; sources: { url: string; title?: string }[] };
export type Region = { id: string; name: string; type: string; parent: string | null; real_world_analogue?: string | null; vibe_note?: string | null; sources?: { url: string; title?: string }[]; updated_at?: string };
export type Category = { id: string; label: string; kind: string; description: string };

export const finds = (findsRaw as Find[]).filter((f) => f.status === 'published');
export const connections = (connectionsRaw as { items: Connection[] }).items;
export const regions = regionsRaw as Region[];
export const categories = categoriesRaw as Category[];

export const findBySlug = (slug: string) => finds.find((f) => f.slug === slug);
export const connectionById = (id: string) => connections.find((c) => c.id === id);
export const regionById = (id: string) => regions.find((r) => r.id === id);
export const categoryById = (id: string) => categories.find((c) => c.id === id);

type ExplainerModule = { frontmatter: { title: string; slug: string; status: string; spoiler: boolean; updated_at: string; sources: { url: string; title?: string }[] }; Content: unknown };
const explainerModules = import.meta.glob<ExplainerModule>('../../content/explainers/*.md', { eager: true });
// Explainers are drafts until reviewed; the scaffold lists them all and labels drafts on the page.
export const explainers = Object.values(explainerModules);

export { youtubeId } from './clip';
