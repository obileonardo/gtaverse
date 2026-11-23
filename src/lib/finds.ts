// Helpers for the find page and the finds index. Everything here reads published content; nothing is guessed.
import { finds, youtubeId, connectionById, regionById, type Find, type Source } from './content';
import { showcaseable, findStill } from './media';

export const platformName = (p: string) => ({ youtube: 'YouTube', x: 'X', reddit: 'Reddit', tiktok: 'TikTok', discord: 'Discord', wiki: 'Wiki', article: 'Article' } as Record<string, string>)[p] ?? p;

export const verificationLabel: Record<string, string> = {
  'multi-source': 'Multi-source',
  'single-source': 'Single source',
  rumor: 'Rumour',
  debunked: 'Debunked',
};
export const verificationNote: Record<string, string> = {
  'multi-source': 'Shown by more than one independent creator or outlet.',
  'single-source': 'Shown by one creator so far. Treat it as likely, not settled.',
  rumor: 'Reported but not shown in a clip yet.',
  debunked: 'Shown to be false.',
};

/** Credit line: the first finder when content names one, otherwise the creator of the clip. Never both invented. */
export const credit = (f: Find) =>
  f.first_finder
    ? { kind: 'finder' as const, name: f.first_finder.handle, platform: platformName(f.first_finder.platform), url: f.first_finder.url }
    : f.clip?.creator
      ? { kind: 'clip' as const, name: f.clip.creator, platform: platformName(f.clip.platform), url: f.clip.url }
      : null;

export const creditLine = (f: Find) => {
  const c = credit(f);
  if (!c) return null;
  return c.kind === 'finder' ? `Found by ${c.name}` : `Clip by ${c.name}`;
};

/** YouTube videos among the sources other than the main clip (the Xbox clip grid). */
export const moreClips = (f: Find) =>
  f.sources
    .filter((s: Source) => s.type === 'youtube' && s.url !== f.clip?.url)
    .map((s) => ({ url: s.url, creator: s.creator ?? 'Unknown creator', id: youtubeId(s.url) }))
    .filter((s) => s.id);

/** Related finds: same category first, then same region; up to `n`. */
export const relatedFinds = (f: Find, n = 10) => {
  const others = finds.filter((x) => x.slug !== f.slug);
  const sameCat = others.filter((x) => x.category === f.category);
  const sameRegion = others.filter((x) => x.category !== f.category && x.region_ids.some((r) => f.region_ids.includes(r)));
  return [...sameCat, ...sameRegion].slice(0, n);
};

export const relatedLore = (f: Find) => (f.related_connections ?? []).map(connectionById).filter((c) => c !== undefined);

export const regionNames = (f: Find) => f.region_ids.map((id) => regionById(id)?.name ?? id);

/** Splits a location description into short tips (Mindtrip "My tips"), one per sentence. */
export const tips = (text?: string) =>
  (text ?? '')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((t) => t.trim())
    .filter(Boolean);

/** Card art: the creator's still, only for finds that are safe to show (no spoiler, no mature flag). */
export const cardImage = (f: Find) => (showcaseable(f) ? findStill(f) : null);

export const formatDate = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(`${d}T12:00:00Z`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
