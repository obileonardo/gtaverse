// Static site: every page is built ahead of time, no server code.
// Fonts are downloaded from Google Fonts at build time and served from our own domain (no third party request).
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import { readFile, writeFile } from 'node:fs/promises';
import { site } from './src/lib/site.ts';

// The launch switch reaches the response headers: while site.indexable is false, every path gets
// "X-Robots-Tag: noindex, nofollow" in dist/_headers (copied from public/_headers). See src/lib/site.ts.
const robotsHeader = {
  name: 'vf-robots-header',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const file = new URL('_headers', dir);
      const text = await readFile(file, 'utf8');
      if (!/^\/\*[ \t]*$/m.test(text)) throw new Error('public/_headers needs a "/*" block for the X-Robots-Tag switch');
      if (site.indexable) {
        logger.info('site.indexable is true: no X-Robots-Tag on pages');
        return;
      }
      await writeFile(file, text.replace(/^\/\*[ \t]*$/m, '/*\n  X-Robots-Tag: noindex, nofollow'));
      logger.info('site.indexable is false: X-Robots-Tag noindex added for every path');
    },
  },
};

const google = fontProviders.google();

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), robotsHeader],
  fonts: [
    // Big Shoulders Display now ships inside the "Big Shoulders" family as its optical size axis; opsz 72 is the
    // Display cut, fixed here so every size uses the Display drawing.
    { provider: google, name: 'Big Shoulders', cssVariable: '--font-display-src', weights: ['800 900'], styles: ['normal'], subsets: ['latin'], fallbacks: ['Arial Narrow', 'sans-serif'], options: { experimental: { variableAxis: { opsz: ['72'] } } } },
    { provider: google, name: 'Inter', cssVariable: '--font-body-src', weights: ['400 700'], styles: ['normal'], subsets: ['latin'], fallbacks: ['sans-serif'] },
    { provider: google, name: 'Geist Mono', cssVariable: '--font-mono-src', weights: ['300 600'], styles: ['normal'], subsets: ['latin'], fallbacks: ['monospace'] },
    { provider: google, name: 'Newsreader', cssVariable: '--font-serif-src', weights: ['400 700'], styles: ['normal', 'italic'], subsets: ['latin'], fallbacks: ['serif'] },
  ],
});
