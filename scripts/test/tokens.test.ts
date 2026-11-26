// Checks how script reads duration tokens (src/scripts/motion/tokens.ts). The production CSS minifier writes 280ms
// as .28s; reading that with parseFloat gave 0.28ms animations on the live site (issue #79). Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMs } from '../../src/scripts/motion/tokens.ts';

test('milliseconds read as written', () => {
  assert.equal(parseMs('280ms'), 280);
  assert.equal(parseMs(' 50ms '), 50);
  assert.equal(parseMs('0ms'), 0);
});

test('seconds, as the minifier writes them, become milliseconds', () => {
  assert.equal(parseMs('.28s'), 280);
  assert.equal(parseMs('.5s'), 500);
  assert.equal(parseMs('0.18s'), 180);
  assert.equal(parseMs('1s'), 1000);
  assert.equal(parseMs('.48S'), 480);
});

test('a bare number is milliseconds; anything else is unreadable', () => {
  assert.equal(parseMs('6'), 6);
  assert.ok(Number.isNaN(parseMs('')));
  assert.ok(Number.isNaN(parseMs('auto')));
  assert.ok(Number.isNaN(parseMs('cubic-bezier(.4, 0, .2, 1)')));
  assert.ok(Number.isNaN(parseMs('280px')));
});

test('every duration token in tokens.css reads back to the value it declares, minified or not', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
  const decls = [...css.matchAll(/(--dur-[a-z0-9-]+):\s*([\d.]+)ms/g)];
  assert.ok(decls.length > 10, 'found the duration tokens');
  for (const [, name, ms] of decls) {
    const n = Number(ms);
    assert.equal(parseMs(`${ms}ms`), n, name);
    assert.ok(Math.abs(parseMs(`${String(n / 1000).replace(/^0\./, '.')}s`) - n) < 1e-9, `${name} as seconds`);
  }
});
