// Static site: every page is built ahead of time, no server code.
// Fonts are downloaded from Google Fonts at build time and served from our own domain (no third party request).
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';

const google = fontProviders.google();

export default defineConfig({
  site: 'https://thevicefiles.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react()],
  fonts: [
    // Big Shoulders Display now ships inside the "Big Shoulders" family as its optical size axis; opsz 72 is the
    // Display cut, fixed here so every size uses the Display drawing.
    { provider: google, name: 'Big Shoulders', cssVariable: '--font-display-src', weights: ['800 900'], styles: ['normal'], subsets: ['latin'], fallbacks: ['Arial Narrow', 'sans-serif'], options: { experimental: { variableAxis: { opsz: ['72'] } } } },
    { provider: google, name: 'Inter', cssVariable: '--font-body-src', weights: ['400 700'], styles: ['normal'], subsets: ['latin'], fallbacks: ['sans-serif'] },
    { provider: google, name: 'Geist Mono', cssVariable: '--font-mono-src', weights: ['400 600'], styles: ['normal'], subsets: ['latin'], fallbacks: ['monospace'] },
    { provider: google, name: 'Newsreader', cssVariable: '--font-serif-src', weights: ['400 700'], styles: ['normal', 'italic'], subsets: ['latin'], fallbacks: ['serif'] },
  ],
});
