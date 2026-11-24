// Unit tests for the Nearby helper. Run: pnpm test (Node's own test runner, which strips the TypeScript types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearby, type NearbyInput } from '../../src/lib/nearby.ts';

const depth = (id: string) => ({ state: 0, county: 1, district: 2 } as Record<string, number>)[id.split(':')[0]] ?? 0;
const f = (slug: string, region_ids: string[], pin: { x: number; y: number } | null = null): NearbyInput => ({ slug, region_ids, pin });

test('pinned find: other pinned finds come first, closest first', () => {
  const me = f('me', ['county:a'], { x: 0, y: 0 });
  const all = [me, f('far', [], { x: 300, y: 400 }), f('near', [], { x: 3, y: 4 }), f('mid', [], { x: 60, y: 80 })];
  const out = nearby(me, all, depth);
  assert.deepEqual(out.map((h) => h.find.slug), ['near', 'mid', 'far']);
  assert.deepEqual(out.map((h) => h.distance), [5, 100, 500]);
  assert.ok(out.every((h) => h.reason === 'distance'));
});

test('pinned find: unpinned finds in the same region follow the pinned ones', () => {
  const me = f('me', ['county:a'], { x: 0, y: 0 });
  const all = [f('same-region', ['county:a']), me, f('pinned', ['county:b'], { x: 10, y: 0 })];
  assert.deepEqual(nearby(me, all, depth).map((h) => h.find.slug), ['pinned', 'same-region']);
});

test('unpinned find: falls back to shared regions, deepest region first', () => {
  const me = f('me', ['county:a', 'district:x']);
  const all = [f('county-only', ['county:a']), f('district', ['district:x']), me, f('elsewhere', ['county:b'])];
  const out = nearby(me, all, depth);
  assert.deepEqual(out.map((h) => h.find.slug), ['district', 'county-only']);
  assert.deepEqual(out.map((h) => h.region), ['district:x', 'county:a']);
});

test('never lists the find itself, never twice, and respects n', () => {
  const me = f('me', ['county:a', 'district:x'], { x: 0, y: 0 });
  const all = [me, ...Array.from({ length: 10 }, (_, i) => f(`n${i}`, ['county:a', 'district:x'], i % 2 ? { x: i, y: 0 } : null))];
  const out = nearby(me, all, depth, 6);
  const slugs = out.map((h) => h.find.slug);
  assert.equal(out.length, 6);
  assert.ok(!slugs.includes('me'));
  assert.equal(new Set(slugs).size, slugs.length);
});

test('a find with no pin and no region has no nearby finds', () => {
  const me = f('me', []);
  assert.deepEqual(nearby(me, [me, f('a', ['county:a']), f('b', [], { x: 1, y: 1 })], depth), []);
});

test('sharing only the root region (the whole state) does not count as nearby', () => {
  const me = f('me', ['state:leonida']);
  assert.deepEqual(nearby(me, [me, f('a', ['state:leonida'])], depth), []);
});
