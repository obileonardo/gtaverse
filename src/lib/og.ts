// Open Graph cards: one 1200 x 630 PNG per page, text only, drawn at build time in our type and colours.
// No Rockstar art and no YouTube thumbnails, ever: the card is the night navy ground, the sunrise glow, the
// page's kicker, title and one meta line, and the wordmark.
// Type: Big Shoulders (Display cut, opsz 72, weight 900) and Inter, the site's own faces (SIL Open Font License).
// They are fetched once from Google Fonts as static TrueType instances (satori cannot read WOFF2) and cached in
// node_modules/.cache, the same way Astro fetches the site's fonts at build time. Nothing is committed.
import satori from 'satori';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { site } from './site';

const FONTS = [
  { name: 'Big Shoulders', weight: 900 as const, css: 'https://fonts.googleapis.com/css2?family=Big+Shoulders:opsz,wght@72,900' },
  { name: 'Inter', weight: 500 as const, css: 'https://fonts.googleapis.com/css2?family=Inter:wght@500' },
  { name: 'Inter', weight: 600 as const, css: 'https://fonts.googleapis.com/css2?family=Inter:wght@600' },
];
const CACHE = join(process.cwd(), 'node_modules', '.cache', 'thevicefiles-og');

async function loadFont(f: (typeof FONTS)[number]) {
  const file = join(CACHE, `${f.name.replace(/\s+/g, '-')}-${f.weight}.ttf`);
  try { return await readFile(file); } catch { /* not cached yet */ }
  // No browser user agent: Google Fonts then answers with TrueType URLs.
  const css = await (await fetch(f.css)).text();
  const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`OG cards: no TrueType file for ${f.name} ${f.weight} in Google Fonts CSS`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OG cards: font download failed (${res.status}) for ${f.name} ${f.weight}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, buf);
  return buf;
}

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 600 | 900; style: 'normal' }[]> | null = null;
const fonts = () => (fontsPromise ??= Promise.all(FONTS.map(async (f) => ({ name: f.name, data: await loadFont(f), weight: f.weight, style: 'normal' as const }))));

// Colours: the dark tokens in src/styles/tokens.css.
const C = { bg: '#0D0C1A', text1: 'rgba(255,255,255,0.92)', text2: 'rgba(255,255,255,0.64)', text3: 'rgba(255,255,255,0.5)', accent: '#F976B0', border: '#38365D' };

type Node = { type: string; props: { style?: Record<string, unknown>; children?: Node | string | (Node | string)[] } };
const el = (type: string, style: Record<string, unknown>, children?: Node['props']['children']): Node => ({ type, props: { style, children } });

/** Display size that keeps a title to about three lines in the 1056px column. */
const titleSize = (t: string) => (t.length <= 24 ? 128 : t.length <= 44 ? 104 : t.length <= 70 ? 84 : 68);

export async function ogCard({ kicker, title, meta }: { kicker: string; title: string; meta?: string }) {
  const tree = el(
    'div',
    {
      // satori sizes boxes without their padding, so the content box is 1200 x 630 less the padding.
      width: 1200 - 144, height: 630 - 64 - 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      paddingTop: 64, paddingRight: 72, paddingBottom: 56, paddingLeft: 72, backgroundColor: C.bg,
      // --glow-hero, the sunrise radial used for items without art.
      backgroundImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,223,128,0.35) 0%, rgba(244,113,124,0.35) 50%, rgba(233,99,199,0.35) 100%)',
      fontFamily: 'Inter',
    },
    [
      el('div', { display: 'flex', flexDirection: 'column', gap: 20 }, [
        el('div', { display: 'flex', fontSize: 26, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.accent }, kicker),
        el('div', {
          display: 'flex', fontFamily: 'Big Shoulders', fontWeight: 900, fontSize: titleSize(title), lineHeight: 0.92,
          letterSpacing: -1, textTransform: 'uppercase', color: '#FFFFFF', maxWidth: 1056, lineClamp: 4,
        }, title),
        ...(meta ? [el('div', { display: 'flex', fontSize: 30, fontWeight: 500, color: C.text2 }, meta)] : []),
      ]),
      el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${C.border}` }, [
        el('div', { display: 'flex', fontFamily: 'Big Shoulders', fontWeight: 900, fontSize: 40, letterSpacing: 1, textTransform: 'uppercase', color: C.text1 }, site.name),
        el('div', { display: 'flex', fontSize: 24, fontWeight: 500, color: C.text3 }, new URL(site.url).host),
      ]),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: await fonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
