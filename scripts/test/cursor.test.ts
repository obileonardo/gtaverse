// Checks the optional game cursor (decision LR48): the setting is off by default, remembered, and survives storage
// that throws; the cursor drawings come from the icon family and are valid native cursors. Run: pnpm test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cursors, cursorTone } from '../../src/icons/cursors.ts';
import { glyphs } from '../../src/icons/family.ts';

// A minimal page for setting.ts: a document that takes events, and a storage we can swap.
const events: string[] = [];
(globalThis as any).document = { dispatchEvent: (e: Event) => { events.push(e.type); return true; } };
(globalThis as any).CustomEvent ??= class extends Event { detail: unknown; constructor(t: string, o?: { detail?: unknown }) { super(t); this.detail = o?.detail; } };
const store = new Map<string, string>();
const working = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: working });

const setting = await import('../../src/scripts/cursor/setting.ts');

test('off by default, and only known values are read', () => {
  store.clear();
  assert.equal(setting.readCursor(), 'off');
  store.set(setting.CURSOR_KEY, 'laser');
  assert.equal(setting.readCursor(), 'off');
  assert.equal(setting.parseCursor('pistol'), 'pistol');
  assert.equal(setting.parseCursor(null), 'off');
});

test('the choice is remembered, and Normal clears it', () => {
  store.clear();
  setting.writeCursor('arrow');
  assert.equal(store.get(setting.CURSOR_KEY), 'arrow');
  assert.equal(setting.readCursor(), 'arrow');
  setting.writeCursor('off');
  assert.equal(store.has(setting.CURSOR_KEY), false);
  assert.equal(setting.readCursor(), 'off');
  assert.ok(events.includes(setting.CURSOR_EVENT));
});

test('storage that throws: reading gives off, writing lasts for the page, nothing throws', () => {
  (globalThis as any).localStorage = throwing;
  assert.equal(setting.readCursor(), 'off');
  assert.doesNotThrow(() => setting.writeCursor('pistol'));
  assert.equal(setting.readCursor(), 'pistol');
  (globalThis as any).localStorage = working;
});

test('cursor drawings: our own glyphs, 32 px, hotspot inside, colours left to the tokens', () => {
  for (const [name, c] of Object.entries(cursors)) {
    assert.ok(c.glyph in glyphs, `${name}: ${c.glyph} is not in the icon family`);
    assert.equal(c.size, 32, `${name}: 32 px is the largest cursor every browser shows`);
    const [x, y] = c.hotspot;
    assert.ok(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < c.size && y < c.size, `${name}: hotspot ${x},${y} outside`);
    assert.match(c.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="32" height="32" viewBox="0 0 20 20">/);
    assert.ok(c.svg.includes('%INK%') && c.svg.includes('%KEY%'), `${name}: ink and keyline placeholders`);
    assert.ok(!/var\(|#[0-9a-f]{3,8}\b|currentColor/i.test(c.svg), `${name}: a data URL cursor cannot read CSS, so no var(), hex or currentColor`);
    assert.ok(!/mask|url\(/.test(c.svg), `${name}: no masks or references`);
  }
  const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
  for (const [name] of Object.values(cursorTone)) assert.ok(tokens.includes(`${name}:`), `${name} is a design token`);
});

test('the trail lasts no longer than 300ms', () => {
  const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
  const m = /--dur-trail:\s*(\d+)ms/.exec(tokens);
  assert.ok(m && Number(m[1]) <= 300, '--dur-trail must be 300ms or less');
});
