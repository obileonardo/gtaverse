// One-off backfill, run once on 2026-11-24, to give every find an `added_at` date.
// Kept for audit: it shows exactly how each date was decided. New finds set `added_at` by hand (CONTENT-GUIDE).
//
// Method, per find:
//   1. Research date: when the find's id is in research/gta6-finds.json, the date of that research run. The run's
//      own headers state it ("Research date: 2026-11-23" in research/gta6-world.md and research/gta6-sources.md,
//      written by the same research pass that produced research/gta6-finds.json).
//   2. Otherwise, the date the find's id first appeared in content/finds.json, read from git history
//      (git log -S on the id, oldest commit first, author date).
//   Both are computed for every find; when both exist and disagree, the earlier date wins and the script says so.
//   A find with neither stops the run: no date is ever guessed.
// Usage: node scripts/one-off/backfill-added-at.mjs --force

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

if (!process.argv.includes('--force')) {
  console.error('Refusing to run without --force. This rewrites content/finds.json.');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const header = read('research/gta6-world.md').match(/Research date: (\d{4}-\d{2}-\d{2})/);
if (!header) throw new Error('research/gta6-world.md has no "Research date:" line');
const RESEARCH_DATE = header[1];
const researched = new Set(JSON.parse(read('research/gta6-finds.json')).map((f) => f.id));

const firstCommitDate = (id) => {
  const out = execFileSync('git', ['log', `-S"id": "${id}"`, '--reverse', '--format=%as', '--', 'content/finds.json'], { cwd: root, encoding: 'utf8' });
  return out.split('\n').find(Boolean) ?? null;
};

const finds = JSON.parse(read('content/finds.json'));
const tally = {};
const out = finds.map((f) => {
  const fromResearch = researched.has(f.id) ? RESEARCH_DATE : null;
  const fromGit = firstCommitDate(f.id);
  const dates = [fromResearch, fromGit].filter(Boolean).sort();
  if (!dates.length) throw new Error(`find ${f.id}: no research date and no git history; set added_at by hand`);
  if (fromResearch && fromGit && fromResearch !== fromGit) console.log(`  ${f.id}: research ${fromResearch}, git ${fromGit}; using ${dates[0]}`);
  const how = fromResearch ? 'research date' : 'git history';
  tally[`${dates[0]} (${how})`] = (tally[`${dates[0]} (${how})`] ?? 0) + 1;
  // Keep key order: added_at sits just before updated_at.
  const { updated_at, added_at: _old, ...rest } = f;
  return { ...rest, added_at: dates[0], updated_at };
});

writeFileSync(join(root, 'content/finds.json'), JSON.stringify(out, null, 2) + '\n');
console.log('added_at backfilled:');
for (const [k, n] of Object.entries(tally)) console.log(`  ${n} finds: ${k}`);
