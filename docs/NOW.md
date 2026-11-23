# Now

Status as of 2026-11-23. Update this file whenever something moves between states.

## Waiting on owner
- Review the content-foundations pull request (#4 into `staging`, closes issue #1): content base, schemas, validator, docs, GitHub templates.
- Review the map-base pull request (into `staging`, closes issue #6): tile pipeline, coordinate system, pin fields, harness. See [MAP.md](MAP.md).
- **Map labels and first-pass pins are blocked on a rule conflict.** The map agent was asked to read place labels by opening the map image, but LEGAL.md and CONTENT-GUIDE rule 5 forbid feeding the map into AI tools. It did not view the image, so `content/map.json` `labels` is empty and no find has a pin. Choose: a person (Chime) records labels with the harness picker, or the owner explicitly allows the agent to read the map.
- Confirm or change the slice decisions S1 to S13 in [DECISIONS.md](DECISIONS.md).
- Finish forwarding for takedown@thevicefiles.com.
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
- Visual design and site build (dark theme first, light available).
- Map labels in `content/map.json` (blocked, see "Waiting on owner").
- Map pins on the official Leonida map in pixel coordinates, from clips, cross-checked against Game Checklists (Chime). The fields, validator rules and workflow exist ([MAP.md](MAP.md)); 0 of 85 finds are pinned.
- Collectible layer data for the 12 map layers: only categories and reference totals exist so far.
- "Missables before Tourist Trap" spoiler-gated checklist guide.
- Daily update pipeline from research/gta6-sources.md section 9.
- Follow-up on the leads in research/x-bookmarks-gta-vi-build.md.
- Deploy to thevicefiles.com (and rockstarworld.elvisobi.com).

## Built, not pushed
- Nothing.

## Pushed, not live
- Branch `content-foundations`, PR #4 into `staging`. Nothing is deployed; there is no site yet.
- Branch `map-base` into `staging`: official map tiles build locally (970 WebP tiles, zoom 0 to 5, 5.66 MiB, inside Cloudflare limits). Tiles are git-ignored and built from Rockstar's download, never committed.

## Resolved
- Icon style: GTA-native-style near-identical original lookalikes for this project, overriding the Capsa default (decision 18).
- Branching: `staging` is ground truth; branch from it and target it (decision 16).
- Takedown contact: takedown@thevicefiles.com (decision 20).
- Domain: thevicefiles.com (decision 15).

## Open questions
1. **Display font.** Which licensed display face replaces GTAArtDeco?
2. **Rumors on the site.** Rumors are draft-only today (slice decision S2). Should the site show them in a clearly labelled "unconfirmed" section instead?
3. **Game Checklists.** Contact them about a data partnership or credit arrangement? Their original URL was not recorded, only a repost.
4. **Map labels.** Who records the place labels printed on the map: Chime by hand with the harness, or an agent with the owner's explicit permission to view the map? (The official map file is confirmed: 5,775 x 7,900 px, 300 dpi, CMYK; grid letters A to M are rows, numbers 1 to 9 are columns.)
5. **Paul Walker Eclipse credit.** HotCars names two early finders (BattleFieldBosh and Jokemen FC). Credit both, or leave first_finder empty until the earliest post is traced?
