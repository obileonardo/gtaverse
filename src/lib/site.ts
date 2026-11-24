// Site-wide settings in one place. The launch switch lives here.
//
// indexable: false keeps search engines out. It drives three things at build time:
//   1. <meta name="robots" content="noindex, nofollow"> on every page (src/layouts/Base.astro)
//   2. the X-Robots-Tag header added to dist/_headers (the integration in astro.config.mjs)
//   3. robots.txt: "Disallow: /" and no sitemap line (src/pages/robots.txt.ts)
// Flip it to true only on the owner's go for launch, then rebuild and deploy. The PRD page (/prd) stays noindex
// whatever this says.
export const site = {
  indexable: false,
  name: 'The Vice Files',
  url: 'https://thevicefiles.com',
  description: 'A fan-made field guide to GTA VI and the Rockstar universe: every secret in Leonida, shown in the clip of the fan who found it, with its sources.',
  language: 'en',
  repo: 'https://github.com/obileonardo/thevicefiles',
  takedownEmail: 'takedown@thevicefiles.com',
  conductEmail: 'conduct@thevicefiles.com',
  /** Hours within which takedown and credit requests are answered (decision OS5). */
  responseHours: 48,
} as const;

/** Absolute URL on our domain for a site path ("/finds/x"). */
export const absolute = (path: string) => new URL(path, site.url).toString();
