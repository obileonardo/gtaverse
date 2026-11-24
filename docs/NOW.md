# Now

Status as of 2026-11-24 (evening). Update this file whenever something moves between states.

## Waiting on owner
- **Release `staging` to `main`.** Approved by the owner once Stage C passes. Stage C (issue #61) is the final release check: its pull request records the verdict and evidence. `main` is still the two-file first commit and `staging` is 29 commits ahead with nothing to merge back, so the release is a fast-forward through a pull request into `main` (only the owner can merge it, ruleset "main moves only on the owner's go").
- **Launch.** Flipping `site.indexable` to `true` in `src/lib/site.ts` (search engines in, sitemap and robots open) waits for the `main` release and for Chime's first pins. Today every page is `noindex`.
- **Mailboxes.** Send a test message to takedown@thevicefiles.com and conduct@thevicefiles.com and record that both arrive. Not done yet; `docs/LEGAL.md`, `SECURITY.md` and the Code of Conduct send people there.
- **Old branches.** 11 merged or closed branches are still on GitHub from before "delete branch on merge" was turned on (`bookmarks-deep-read`, `content-foundations`, `design-foundation`, `home-r2-b`, `map-base`, `map-ui`, `pages-ui`, `prd-page`, `release-audit-stage-a`, `release-stage-b`, `site-scaffold`). Delete them or keep them: owner's call.
- **`prd/public/_headers`.** It belonged to the deleted `vicefiles-prd` Worker and is now unused (the main site's `public/_headers` keeps `/prd` noindex). Remove it or keep it (decision RC1).
- Confirm or change the open slice decisions in [DECISIONS.md](DECISIONS.md), including RC1 and RC2 from Stage C.
- Answer the open questions below.

## Chime's first queue (research conflicts)
Chime owns content and pins. Each item needs a first-hand check in game or a better source, then a fix to `notes`, `area`, `verification` or the linked connection. Details are in the notes of each record and in PR #4.

**Locations**
1. `alien-rescue-south-point-airfield`: south of Hamlet, or Pelican Valley near the Mariana County border?
2. `golden-ak-palmer-fishing`: Bobcat Key or Watson Bay?
3. `pegassi-infernus-96`: Crosstown police car park or an Ambrosia garage?
4. `merman`: Gambit Bay or Cottonmouth Lake? Also replace or back up the gta6tuto source.
5. `mount-kalaga-meteorite`: summit or Hillside Campsite?
6. `conspiracist-trailer-bunker`: which directions and contents are right, and is Chapter 1 mission "Building a Life" required?
7. Region `hamlet`: Vice-Dale County or Mariana County?
8. Region `ambrosia`: GTABase says "Ambrosia County", the map shows five counties without it.
9. Region `leonida-bay`: same water as the Gulf of Leonida map label?

**Facts**
10. `brainwashing-chair`: pistol "Brainwasher 1992" or "1922"?
11. `mount-kalaga-tower-shed`: code 691865 or 69185?
12. `alien-rescue-south-point-airfield`: keypad 2314, or a code from the dream?
13. `crashed-glider-turnt-nipper`: sniper or Turnt Nipper .38?
14. `arthur-morgan-hat` (find and connection): $5 or $35?
15. `michaels-boat-los-santos-gps` and connection `marquis-boat`: Marquis or "Sonata"?
16. `mount-chiliad-bar-chatter` (multi-source) vs connection `chiliad-gta6-callback` (speculative): align the levels.
17. `fabien-larouche-body-copy` vs connection `liberty-city-memoir`: Michael's or Amanda's yoga instructor?
18. `tenebrae-lux-puzzle-game` vs connection `tenebrae-lux`: Clair Obscur parody, or a send-up of games like The Witness?
19. `dexter-trinity-apartments` vs connection `dexter-apartment`: GameSpot reportedly found nothing Dexter-related.
20. `skunk-ape-bigfoot`: is there a real Red Dead Redemption 2 Bigfoot link? No connection supports it yet.
21. `macca-and-friends-cartoon` (rumor) vs connection `weazel` (states it as fact).
22. Meteorites layer: 11 or 16?

**Sourcing**
23. Rumors held as draft: `kyle-busch-18-car`, `macca-and-friends-cartoon`, `little-sam-houser-cameo`, `mount-kalaga-tower-shed`, `roadside-ghost-woman`, `skeeters-bar-south-park`. Each needs a second independent source to publish.
24. Multi-source finds that rest only on GTA6Info plus gta6wiki.eu (for example `michael-wind-chimes-ringtone`, `fabien-larouche-body-copy`, `eddie-low-podcast`, `dumpster-lawyer`): find an independent clip.
25. Vice City districts La Perle, Tequesta, Tisha-Wocka and Peacock Bay: find a source URL before adding them to regions.

## Asked, not built
- **Map pins and labels (Chime).** The owner chose that Chime places pins by hand, from clips and in game, with the harness picker ([MAP.md](MAP.md)); Chime records the place labels the same way. No agent views the official map (LEGAL.md, decision OS7); the only exception is the Game Checklists collectible maps (decision C1). Today 0 of 85 finds are pinned and `content/map.json` has no labels, so every find opens from the list.
- "Missables before Tourist Trap" spoiler-gated checklist guide.
- Daily update pipeline from research/gta6-sources.md section 9.
- Follow-up on leads from public community posts (X, GTAForums, YouTube).

## Built, not pushed
- Nothing.

## Pushed, not live
- The Stage C pull request (issue #61): docs, the dead `prd/wrangler.jsonc` removed, and `pnpm test` added to CI. No change to the built site.
- `main` does not have the site yet (see "Release `staging` to `main`").

## Live
- thevicefiles.com serves `staging` through the `thevicefiles` Worker (Cloudflare static assets): home, map, finds, explainers, the GTAverse, hubs, `/design` and the PRD at `/prd`. Every page is `noindex` until launch.
- The Case File logo by Chime (#60) is in the header, the Open Graph cards and the favicons.
- Map tiles, the hero trailer loop and key art, game logos and cover art are built at deploy from Rockstar's official files and never committed.
- 892 collectible locations in 12 layers, transcribed from the Game Checklists maps and credited to them (decisions C1 to C7).

## Resolved
- Stage B (#20): licences, contributor files, CI and Dependabot are merged; the repository settings in [release/STAGE-B-SETTINGS.md](release/STAGE-B-SETTINGS.md) are applied and read back as matching on 24 Nov 2026.
- Dependabot's first update (#21, `@types/leaflet`) is merged, through CI.
- The old `vicefiles-prd` Worker was deleted on 24 Nov 2026; the PRD is served by the main site at https://thevicefiles.com/prd.
- 26 old agent worktrees were deleted on 24 Nov 2026.
- Map labels and pins: Chime places them by hand (owner's choice; see "Asked, not built").
- Pick a logo: done. Case File by Chime, implemented from Chime's SVGs (decisions LG5, LG6; [LOGO.md](LOGO.md)). Chime may polish it later.
- Icon style: GTA-native-style near-identical original lookalikes for this project, overriding the Capsa default (decision 18).
- Branching: `staging` is ground truth; branch from it and target it (decision 16).
- Takedown contact: takedown@thevicefiles.com (decision 20).
- Domain: thevicefiles.com (decision 15).
- Licences: MIT for code, CC BY-NC 4.0 for original content, holder "The Vice Files contributors" (decision OS1).
- Personal data: removed from the current files; history is left as it is (decision OS3).
- Takedown and credit requests: answered within 48 hours (decision OS5).

## Open questions
1. **Display font.** Which licensed display face replaces GTAArtDeco?
2. **Rumors on the site.** Rumors are draft-only today (slice decision S2). Should the site show them in a clearly labelled "unconfirmed" section instead?
3. **Game Checklists.** Contact them about a data partnership or credit arrangement? Their original post or site was not found, so the credit links to a repost (decision C7).
4. **Paul Walker Eclipse credit.** HotCars names two early finders (BattleFieldBosh and Jokemen FC). Credit both, or leave first_finder empty until the earliest post is traced?
