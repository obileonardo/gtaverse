// Reading motion tokens (src/styles/tokens.css) from script.
// The production build minifies CSS, and the minifier rewrites a duration to its shortest form: `280ms` ships as
// `.28s`, `500ms` as `.5s`, while `50ms` stays `50ms`. parseFloat alone reads `.28s` as 0.28, a 0.28ms animation,
// which is why every scripted fade and roll on the live site was instant until 26 Nov 2026 (issue #79). Always read a
// duration with its unit, through these helpers.

/** A CSS time ("280ms", ".28s", "0.5s") in milliseconds; a bare number is taken as milliseconds. NaN if unreadable. */
export function parseMs(raw: string): number {
  const m = /^\s*(-?(?:\d+\.?\d*|\.\d+))\s*(ms|s)?\s*$/i.exec(raw);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  return m[2]?.toLowerCase() === 's' ? v * 1000 : v;
}

/** A custom property's value on `el` (the root by default), trimmed. */
export function token(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A duration token in milliseconds, or `fallback` when it is missing or unreadable. */
export function tokenMs(name: string, fallback: number, el?: Element): number {
  const v = parseMs(token(name, el));
  return Number.isFinite(v) ? v : fallback;
}
