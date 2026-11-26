// Screenshots a page one viewport at a time, with Rockstar material and clip stills blocked (cdp.mjs),
// so the pictures are safe to review. Output (git-ignored): tools/shots/<label>/<theme>-<width>/NNN.png
//
// Run: node tools/page-check/shots.mjs --label=before [--url=http://localhost:4321/] [--widths=375,768,1280,1440,1920]
//      [--themes=dark,light] [--settle=900] [--reduced]

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage, parseArgs } from './cdp.mjs';

const args = parseArgs(process.argv.slice(2), { url: 'http://localhost:4321/', widths: '375,768,1280,1440,1920', themes: 'dark,light', settle: '900', label: 'shots' });
// The label names one folder inside tools/shots/, which is emptied before each run: a plain name only, never a path.
const label = String(args.label);
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(label) || label.includes('..')) {
  console.error(`--label must be a plain folder name (letters, digits, ".", "_", "-"), got: ${label}`);
  process.exit(2);
}
// Themes and widths also name folders under it (<theme>-<width>): only the two themes and whole numbers (#77 review N11).
const themes = String(args.themes).split(',');
const widths = String(args.widths).split(',');
if (themes.some((t) => t !== 'dark' && t !== 'light') || widths.some((w) => !/^[1-9][0-9]{1,4}$/.test(w))) {
  console.error(`--themes takes dark and light, --widths whole numbers; got: ${themes.join(',')} / ${widths.join(',')}`);
  process.exit(2);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots', label);
const browser = await launch();
try {
  for (const theme of themes) {
    for (const width of widths.map(Number)) {
      const height = width < 768 ? 812 : width < 1280 ? 1024 : 900;
      const page = await openPage(browser, { width, height, reducedMotion: Boolean(args.reduced) });
      const u = new URL(args.url);
      u.searchParams.set('theme', theme);
      await page.goto(u.href);
      const dir = join(root, `${theme}-${width}`);
      // Clear the last run, so fewer shots this time do not leave stale ones behind.
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const total = await page.evaluate('document.documentElement.scrollHeight');
      let i = 0;
      for (let y = 0; y < total; y += Math.round(height * 0.8)) {
        await page.evaluate(`scrollTo(0, ${y})`);
        await page.sleep(Number(args.settle));
        writeFileSync(join(dir, `${String(i++).padStart(3, '0')}.png`), await page.screenshot());
      }
      console.log(`${theme} ${width}px: ${i} shots in ${dir}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
