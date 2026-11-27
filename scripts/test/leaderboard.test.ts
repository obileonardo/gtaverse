// Unit tests for the home page's per-area leaderboard rule (src/lib/leaderboard.ts, docs/DECISIONS.md LR74).
// Run: pnpm test (Node's own test runner, which strips the TypeScript types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaderboard, type Credit } from '../../src/lib/leaderboard.ts';

const p = (name: string, finds: number, firstFinds = 0, clips = 0): Credit => ({ key: name, name, finds, firstFinds, clips });

test('a clear leader: one person with more finds than anyone else', () => {
  const b = leaderboard([p('b', 1), p('a', 3), p('c', 2)]);
  assert.equal(b.leader?.name, 'a');
  assert.deepEqual(b.rows.map((r) => [r.name, r.rank]), [['a', 1], ['c', 2], ['b', 3]]);
});

test('a shared top count has no leader', () => {
  const b = leaderboard([p('a', 2), p('b', 2), p('c', 1)]);
  assert.equal(b.leader, null);
  assert.deepEqual(b.rows.map((r) => r.rank), [1, 1, 3]);
});

test('ties share a rank; first finds, clips, then name order them', () => {
  const b = leaderboard([p('lead', 4), p('zed', 1), p('amy', 1), p('clip', 1, 0, 1), p('first', 1, 1)]);
  assert.deepEqual(b.rows.map((r) => r.name), ['lead', 'first', 'clip', 'amy', 'zed']);
  assert.deepEqual(b.rows.map((r) => r.rank), [1, 2, 2, 2, 2]);
});

test('first finds never make a leader out of a tied count', () => {
  const b = leaderboard([p('a', 2, 2), p('b', 2, 0)]);
  assert.equal(b.leader, null);
});

test('one person alone leads; people with no finds in the area are left out', () => {
  assert.equal(leaderboard([p('solo', 1), p('none', 0)]).leader?.name, 'solo');
  assert.deepEqual(leaderboard([p('none', 0)]), { leader: null, rows: [] });
});
