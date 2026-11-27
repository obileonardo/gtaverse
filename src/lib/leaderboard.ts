// The per-area leaderboard on the home page (chapter 012, "Most credited"). Pure and content-free so the rule can be
// tested on its own (scripts/test/leaderboard.test.ts); Chapter012Finders.astro feeds it from lib/credits.ts.
// The rule (docs/DECISIONS.md LR74):
//   count   how many finds in the area credit the person (as first finder or by a post the find cites), once per find
//   order   count, then first finds, then clips, then name: the /finders order
//   rank    one plus the number of people with a higher count, so people with the same count share a rank
//   leader  the one person whose count is higher than everyone else's; none when the top count is shared

export type Credit = { key: string; name: string; finds: number; firstFinds: number; clips: number };
export type Ranked<T extends Credit> = T & { rank: number };
export type Board<T extends Credit> = { leader: Ranked<T> | null; rows: Ranked<T>[] };

export const byCredit = (a: Credit, b: Credit) =>
  b.finds - a.finds || b.firstFinds - a.firstFinds || b.clips - a.clips || a.name.localeCompare(b.name);

export function leaderboard<T extends Credit>(people: T[]): Board<T> {
  const sorted = people.filter((p) => p.finds > 0).sort(byCredit);
  const rows = sorted.map((p) => ({ ...p, rank: 1 + sorted.filter((q) => q.finds > p.finds).length }));
  const leader = rows.length > 0 && (rows.length === 1 || rows[1].finds < rows[0].finds) ? rows[0] : null;
  return { leader, rows };
}
