// Static site: every page is built ahead of time, no server code.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://thevicefiles.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react()],
});
