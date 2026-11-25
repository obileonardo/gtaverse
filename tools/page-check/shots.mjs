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
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots', String(args.label));
const browser = await launch();
try {
  for (const theme of String(args.themes).split(',')) {
    for (const width of String(args.widths).split(',').map(Number)) {
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
