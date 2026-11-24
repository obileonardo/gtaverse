// The found tracker's storage, with no framework: the map's React hook (src/components/map/found.ts) and the home
// page's Found toggles (plain scripts) both read and write through it, so they stay in step.
// Kept on the device only (no accounts, nothing sent anywhere). Storage can be blocked (private mode, strict
// settings): then the set lives in memory for this visit and nothing breaks.

export const FOUND_STORE = 'vf-found';
let memory: string[] | null = null; // the fallback when storage throws
const listeners = new Set<() => void>();

export function readFound(): string[] {
  try {
    const raw = localStorage.getItem(FOUND_STORE);
    if (!raw) return memory ?? [];
    const v = JSON.parse(raw);
    return Array.isArray(v?.slugs) ? v.slugs.filter((s: unknown): s is string => typeof s === 'string') : [];
  } catch {
    return memory ?? [];
  }
}

export function writeFound(slugs: string[]) {
  const unique = [...new Set(slugs)].sort();
  memory = unique;
  try { localStorage.setItem(FOUND_STORE, JSON.stringify({ v: 1, slugs: unique })); } catch { /* blocked: kept in memory for this visit */ }
  listeners.forEach((l) => l());
}

export const toggleFound = (slug: string) => {
  const cur = readFound();
  writeFound(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
};

/** Calls `fn` when the set changes, in this tab or another. Returns the unsubscribe function. */
export function onFoundChange(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === FOUND_STORE) fn(); };
  addEventListener('storage', onStorage);
  return () => { listeners.delete(fn); removeEventListener('storage', onStorage); };
}
