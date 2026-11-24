// Found tracker: which finds this visitor has found, kept on the device only (no accounts, nothing sent anywhere).
// Storage (and its in-memory fallback) lives in src/lib/found-store.ts, shared with the home page's Found toggles.
// An export code moves the set to another browser: "VF1." + base64url of the slugs, space separated. Unknown slugs
// in an imported code are ignored, so a code keeps working as finds are added or renamed.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { readFound as read, writeFound as write, onFoundChange } from '../../lib/found-store';

const PREFIX = 'VF1.';

const toBase64Url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export const exportCode = (slugs: string[]) => PREFIX + toBase64Url([...slugs].sort().join(' '));

/** Reads a code. Returns the slugs it holds that exist in `known`, or null when the code is not one of ours. */
export function parseCode(code: string, known: Set<string>): string[] | null {
  const c = code.trim();
  if (!c.startsWith(PREFIX)) return null;
  try {
    const body = fromBase64Url(c.slice(PREFIX.length));
    return body.split(' ').filter((s) => known.has(s));
  } catch {
    return null;
  }
}

/** The found set and its actions. Every component that uses it stays in step, in this tab and across tabs. */
export function useFound() {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(read());
    sync();
    return onFoundChange(sync);
  }, []);
  const toggle = useCallback((slug: string) => {
    const cur = read();
    write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  }, []);
  const merge = useCallback((more: string[]) => write([...read(), ...more]), []);
  const found = useMemo(() => new Set(slugs), [slugs]);
  return { found, list: slugs, toggle, merge };
}
