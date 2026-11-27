# Landing refresh: handoff to Obi (25 Nov 2026)

From the design review on 25 Nov 2026 (Obi and Chime) and Chime's walkthrough. Chime built phases 0 to 2; Obi takes phases 3 to 9 while Chime moves on to the design system. Decisions LR1 to LR12 are in `docs/DECISIONS.md` (open to owner review). The full plan with every item is the PDF sent with this handoff (`landing-refresh-handoff.pdf`).

## Status

| Phase | What | State |
|---|---|---|
| 0 | Setup and checks: `tools/page-check/` | Done (this PR) |
| 1 | No cut text, map headline on two lines, By type arrows, wider island, card spacing, centred stats roll | Done (this PR), LR1 to LR10 |
| 2 | Hero fades into the page, radial readout mask on Spotlight, footer fades | Done (this PR), LR11, LR12 |
| 3 | Motion polish: pink highlight that follows the scroll on the manifesto, smoother transitions | Built (#79, #80), LR13 to LR17 |
| 4 | GTAverse dashed path that lights up each card | Built (#85, #88), LR18 to LR22 |
| 5 | Map and regions behaviour | Built (#86, #87), LR23 to LR27; "Open the map" signed off by Obi on 26 Nov 2026 |
| 6 | Smart search bar on the home page (after #76) | Built (#84), LR28 to LR32 |
| 7 | Five redesigns from Mobbin references (Chime picks from a reference board) | Done: 7a Selected finds (#103), 7b New this week (#107), 7c Watch the clips (#104), 7d Regions (#105), 7e How it is made and Most credited (#106); deployed 27 Nov 2026 (Worker version c12ddfc7) and released to main in #108. LR53 to LR77, every design call accepted as built by Obi on 27 Nov 2026 (LR82) |
| 8 | Jason and Lucia react to the cursor (needs a decision like L5) | Built (#92, #94), LR43 to LR47; the cursor exception is the owner's (LR43) |
| 9 | Custom cursors with trails (only if Obi signs off) | Built, signed off by Obi on 26 Nov 2026 (LR48); LR49 to LR52 |

## The checks (`tools/page-check/`)

No new dependencies: headless Chromium (Playwright's cached build, or `CHROMIUM_PATH`) over the DevTools protocol. Rockstar media, map tiles and clip stills are blocked in every tool, so no Rockstar material reaches a page or a screenshot (PROJECT.md, Limits: no AI processing of Rockstar content). Run them against `pnpm dev`.

- `node tools/page-check/clip-audit.mjs`: every line of text whose glyph ink is cut by a box that clips it, at 375, 768, 1280, 1440 and 1920, both themes. It measures the ink (canvas metrics, tabular figures included), not the layout box. Exit 1 on a settled cut. Phase 1 took the home page from 6 cuts to 0.
- `node tools/page-check/contrast.mjs`: turns every picture pure white (the worst case) and measures each line against the background right behind its letters. AA is 4.5:1, or 3:1 for large text. Limits: it can still flag a line that has a drawn marker or underline within 2px of its letters, and it skips text too faint to change the screenshot. Trust it for text over pictures (Spotlight passes at 1280, 1440 and 1920); read its other hits by hand.
- `node tools/page-check/shots.mjs --label=before`: viewport screenshots with media blocked, into `tools/shots/` (git-ignored), for before and after comparisons.
- Needs ffmpeg on the PATH (contrast decodes screenshots with it).

## What Chime asked for, in Chime's words (so the next phases match)

- **"Readout mask" means one radial mask over the whole picture**, clear where the picture matters and darker toward our text. Not a scrim behind each text block (that was built first and rejected).
- **"Fade" means the edge of a section only**, never the area behind text, and the text never moves. The hero's art runs 160px past the hero and fades there.
- Every clipped glyph is a bug, sideways too (tight tracking pushes ink past the box).
- When a number changes between two and three digits, it stays centred while it rolls.

## Open items found on the way (not fixed, owner's call)

1. **Spotlight at 1024 to about 1100px:** the Play clip and Open the find buttons overlap the table and the sources column (was so before).
2. **Hero at 768px:** the trailer's sound toggle (shown while the trailer plays) overlaps the island by about 30px (was so before).
3. **Hero titles, intro and credit over a very bright frame:** below AA when the frame is pure white. The hero's scrims are unchanged on purpose (no overlay behind the text). If a bright frame reads badly, a radial at the hero's bottom left is the fix.
4. **Island width:** 470 from 1280, 400 from 1024, 336 below 1024, because 470 covered a hero mode button at 768. At 1024 the hero intro beside it is 224px wide.
5. **Phone map teaser:** the coast still bleeds off the right edge (its documented phone design); unclipped on tablet and desktop only. Since phase 5 (LR26) the drawing has its own band above the headline, so the bleed no longer sits behind any text.
6. **`--text-3` on `--surface-1`** measures about 4.46:1 for some labels (the regions tile caption, the footer cell labels), just under AA.

## Notes for working on this

- The work started on Chime's workspace branch (staging plus #74 to #76); #77 is the same commits cherry-picked onto `staging`.
- `pnpm` runs through `corepack pnpm` if it is not on the PATH.
- The home page is heavy to audit: run one page-check tool at a time and stop `pnpm dev` before `pnpm build` on a machine near its memory limit.
- Phase 3's manifesto highlight: the words are already spans with a line index (`Manifesto.astro`); reveal a pink band behind each word with `clip-path` driven by a rAF-throttled scroll position (native scroll, no scroll-jacking); reduced motion shows it fully highlighted.
