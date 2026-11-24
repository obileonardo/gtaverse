// Checks the hero's line art drawings (src/components/home/line-art.ts) without a browser: every stroke is
// finite and finishes drawing in time, outlines draw as one continuous stroke, the moving figures keep a stable
// stroke list from frame to frame, and feet on the ground do not slide. Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShots, footPath, reach, DRAW_START, DRAW_SPAN, STROKE, WALK, STRIDE, DOG_STRIDE, PERSON_DUTY, DOG_DUTY } from '../../src/components/home/line-art.ts';
import type { Strokes } from '../../src/components/home/line-art.ts';

// A small square island stands in for the traced coastline (the real one is built from the map at deploy).
const coast = { aspect: 1.4, paths: [[[0.3, 0.3], [0.7, 0.3], [0.7, 0.9], [0.3, 0.9]], [[0.1, 1.1], [0.2, 1.1], [0.2, 1.2]]] };
const shots = buildShots(coast);
const DONE = DRAW_START + DRAW_SPAN + STROKE;

function check(name: string, s: Strokes) {
  const n = s.kind.length;
  assert.ok(n > 0, `${name}: no strokes`);
  assert.equal(s.pos.length, n * 6);
  for (let i = 0; i < s.pos.length; i++) assert.ok(Number.isFinite(s.pos[i]), `${name}: point ${i} is not finite`);
  for (let i = 0; i < n; i++) {
    assert.ok(s.c0[i] >= 0 && s.c0[i] <= s.c1[i] && s.c1[i] <= 1 + 1e-6, `${name}: segment ${i} has a bad span`);
    assert.ok(s.start[i] + s.dur[i] <= DONE + 1e-4, `${name}: segment ${i} finishes after ${DONE} s`);
  }
}

test('four drawings, in order, each with its credit', () => {
  assert.deepEqual(shots.map((s) => s.name), ['Leonida', 'Coupe', 'Sidearms', 'Walk']);
  assert.match(shots[0].credit, /Coastline from the official map, Rockstar Games/);
  assert.equal(buildShots(null).length, 3);
});

test('every stroke is finite and down within the draw time', () => {
  for (const s of shots) {
    check(s.name, s.fixed);
    if (s.pose) for (const t of [0, 1.3, 4.2, 9.9]) check(`${s.name} at ${t}`, s.pose(t));
  }
});

test('each drawing has its pink touch', () => {
  for (const s of shots) {
    const strokes = [s.fixed, ...(s.pose ? [s.pose(2)] : [])];
    const pink = strokes.reduce((n, st) => n + st.kind.filter((k) => k === 2).length, 0);
    assert.ok(pink > 0, `${s.name} has no pink`);
  }
});

test('an outline draws as one continuous stroke: each segment starts where the last one ended', () => {
  const st = shots[0].fixed;
  // The main island is the first stroke after the grid: segments that share a start time and run 0..1.
  const first = Array.from(st.c0).findIndex((c, i) => c === 0 && st.c1[i] < 1);
  assert.ok(first >= 0);
  let i = first;
  while (i + 1 < st.kind.length && st.start[i + 1] === st.start[first] && st.c0[i + 1] > 0) {
    assert.ok(Math.abs(st.c0[i + 1] - st.c1[i]) < 1e-6, `gap in the outline at segment ${i}`);
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(st.pos[(i + 1) * 6 + k] - st.pos[i * 6 + 3 + k]) < 1e-5, `outline breaks at segment ${i}`);
    i++;
  }
  assert.ok(Math.abs(st.c1[i] - 1) < 1e-6, 'the outline does not reach its end');
  assert.equal(i - first + 1, 4, 'the square island is four segments');
});

test('the walk keeps the same stroke list every frame, so it draws on steadily', () => {
  const walk = shots[3];
  assert.ok(walk.pose);
  const n = walk.pose!(0).kind.length;
  for (const t of [0.4, 2.2, 5.5, 9.8]) assert.equal(walk.pose!(t).kind.length, n);
});

test('feet on the ground do not slide: the stance moves back exactly as fast as the body walks', () => {
  for (const [period, duty] of [[STRIDE, PERSON_DUTY], [DOG_STRIDE, DOG_DUTY]]) {
    const reachLen = WALK * period * duty;
    const dt = 0.01;
    for (let t = 0; t < period * duty - dt; t += dt) {
      const a = WALK * t + footPath(t / period, duty, reachLen, 0.1).x;
      const b = WALK * (t + dt) + footPath((t + dt) / period, duty, reachLen, 0.1).x;
      assert.ok(Math.abs(b - a) < 1e-9, `foot slides at t=${t.toFixed(2)}`);
      assert.equal(footPath(t / period, duty, reachLen, 0.1).y, 0);
    }
  }
  // The dog's cycle is locked to the person's: three dog strides to two of the person's.
  assert.ok(Math.abs(DOG_STRIDE * 3 - STRIDE * 2) < 1e-12);
});

test('two bone reach keeps its bone lengths and bends the chosen way', () => {
  const { joint, end } = reach([0, 1], [0.1, 0.1], 0.46, 0.45, 1);
  assert.ok(Math.abs(Math.hypot(joint[0], joint[1] - 1) - 0.46) < 1e-9);
  assert.ok(Math.abs(Math.hypot(end[0] - joint[0], end[1] - joint[1]) - 0.45) < 1e-9);
  assert.ok(joint[0] > 0.05, 'a knee bends forward');
  const back = reach([0, 1], [0.1, 0.1], 0.46, 0.45, -1);
  assert.ok(back.joint[0] < 0.05, 'an elbow bends back');
});
