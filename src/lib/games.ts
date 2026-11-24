// The games of the GTAverse (content/games.json): the switcher, the game hubs, the "Also in" chips and the ?game=
// lens all read from here. Game names in connections and finds are mapped through each game's aliases; content text
// is never rewritten (the validator checks every name resolves).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import gamesRaw from '../../content/games.json';
import { connections, finds, type Connection, type Find } from './content';

export type Logo = { page_url: string; file_url: string; file: string; width: number | null; height: number | null };
export type Game = {
  id: string; name: string; short_name: string; year: number; universe: string; group: string;
  aliases: string[]; logo: Logo | null; logo_note?: string;
};
export type GameGroup = { id: string; label: string };

const data = gamesRaw as unknown as { groups: GameGroup[]; items: Game[] };
export const games = data.items;
export const gameGroups = data.groups;
export const TRADEMARK_LINE = 'Game logos are trademarks of Rockstar Games and Take-Two Interactive.';

const byAlias = new Map(games.flatMap((g) => g.aliases.map((a) => [a, g] as const)));
export const gameById = (id: string | null | undefined) => (id ? games.find((g) => g.id === id) : undefined);
export const gameOf = (name: string) => byAlias.get(name);

/** The distinct games a list of names refers to, oldest first (release order). */
export const gamesOf = (names: string[] = []) =>
  [...new Map(names.map(gameOf).filter((g): g is Game => !!g).map((g) => [g.id, g])).values()].sort((a, b) => a.year - b.year);

export const gamesOfConnection = (c: Pick<Connection, 'games'>) => gamesOf(c.games);
export const gamesOfFind = (f: Find) => gamesOf(f.crossover_games ?? []);

export const connectionsForGame = (id: string) => connections.filter((c) => gamesOfConnection(c).some((g) => g.id === id));
export const connectionCount = (id: string) => connectionsForGame(id).length;

/** Finds that touch a game: they name it as a crossover, or they belong to a connection that lists it. */
export const findsForGame = (id: string) => {
  const conns = new Set(connectionsForGame(id).map((c) => c.id));
  return finds.filter((f) => gamesOfFind(f).some((g) => g.id === id) || (f.related_connections ?? []).some((c) => conns.has(c)));
};

/** Game ids a find belongs to, for the ?game= lens on /finds. */
export const gameIdsOfFind = (f: Find) => games.filter((g) => findsForGame(g.id).includes(f)).map((g) => g.id);

/** The logo file, only when the build fetched it (pnpm logos:fetch). Without it the game shows a text plate. */
export const logoOf = (g: Game) => {
  if (!g.logo || !existsSync(join(process.cwd(), 'public/media/logos', g.logo.file))) return null;
  return { src: `/media/logos/${g.logo.file}`, width: g.logo.width ?? 72, height: g.logo.height ?? 28 };
};

/** The switcher's groups, in content order; 'more' games live on /gtaverse/games only. */
export const switcherGroups = gameGroups
  .filter((gr) => gr.id !== 'more')
  .map((gr) => ({ ...gr, games: games.filter((g) => g.group === gr.id) }))
  .filter((gr) => gr.games.length > 0);
