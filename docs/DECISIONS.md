# Decisions

Dated log. Newest at the bottom. "Owner" decisions are settled and not reopened without the owner. "Slice" decisions were made while building and are open to owner review in the pull request that introduced them.

## 2026-11-23: owner decisions (recorded on this date)

| # | Decision | Why |
|---|---|---|
| 1 | The site is called **The Vice Files**. | A brand without "GTA" in it is easier to defend and does not read as an official product (research/legal-fan-site.md 3i). |
| 2 | Temporary domain on a personal subdomain, DNS on Cloudflare. Superseded by decisions 15 and OS6. | A personal subdomain is not a UDRP target; it can move later. |
| 3 | The repository keeps the name **gtaverse** for now. Superseded: renamed to **thevicefiles** on 2026-11-23. | Renaming is cheap later; nothing depends on it yet. |
| 4 | **Non-commercial**: no ads, no paid tiers. | Keeps the site inside Rockstar's written fan-site tolerance ("non-commercial uses", research/legal-fan-site.md 2.1). |
| 5 | **Official Rockstar media allowed inside content with a credit line**: the official Leonida map download, key art, screenshots. | Matches what every tolerated fan map does, and Rockstar offers these as downloads. |
| 6 | **Not allowed as our branding**: the GTA VI logo, the Rockstar logo, the GTAArtDeco font. | Trademark and font-copyright risk; suggests endorsement. |
| 7 | **Icons and display type are original lookalikes**, near-identical in spirit, never copied files. Confirmed by decision 18. | Copied blip sets read as copied UI and trade dress. |
| 8 | **Clips only through official platform embeds** (YouTube, X, TikTok, Reddit). Never re-hosted. | Platform embed licences are the legal footing; re-hosting is not covered. |
| 9 | **Never link piracy or leaked-build content.** | Take-Two actively polices GTA VI leaks (research/legal-fan-site.md 4.1). |
| 10 | **Every GTA VI fact needs a source URL.** | Trust is the product. |
| 11 | **Verification levels**: multi-source, single-source, rumor, debunked. | Readers see how solid each claim is. |
| 12 | **Spoiler flag** on story-gated finds; **mature flag** for adult content. | Rockstar's policy names spoilers as a takedown trigger; adult content needs gating. |
| 13 | **Game Checklists pin data is their work**: cross-reference only, never copy pins wholesale. | Their pins are original work; we credit or partner. |
| 14 | **Data and documentation first, design later.** | The owner chose to settle the content base before any visual work. |

## 2026-11-23: owner decisions (second batch)

| # | Decision | Why |
|---|---|---|
| 15 | **Domain: thevicefiles.com**, bought by the owner on Namecheap, DNS on Cloudflare (Free plan). The only domain named in the repo (decision OS6). | A dedicated domain matches the brand and keeps the site in its own Cloudflare zone, apart from the owner's other sites. |
| 16 | **Branching: `staging` is ground truth.** Branch from `staging`; pull requests target `staging`. `main` moves only on the owner's go. Never branch from or merge `origin/main`. | One integration branch the owner controls; `main` stays the released state. |
| 17 | **Theme: dark first, light available.** | Owner choice. |
| 18 | **Icons: GTA-native-style, near-identical original lookalikes** for this project. This overrides the owner's Capsa icon default for this project only. Never copy Rockstar files. | The owner wants the game's visual language; original drawings keep it legal (research/legal-fan-site.md 3e). |
| 19 | **Chime (ChimeXXD) owns content and pins.** | Clear ownership of the content base and the map. |
| 20 | **Takedown and credit-correction contact: takedown@thevicefiles.com** (forwarding being set up). | The footer disclaimer and takedown process need a real address. |

## 2026-11-23: slice decisions (content foundations, open to owner review)

| # | Decision | Why |
|---|---|---|
| S1 | Finds live in one file, `content/finds.json`, not one file per find. | 85 records is small; one file keeps cross-reference checks simple. Can split later without schema changes. |
| S2 | Finds with verification `rumor` are `draft` and the validator blocks publishing them. | research notes say "do not publish without verification" for the weakest items. A rumor becomes publishable when a second independent source arrives. |
| S3 | `mature: true` only for sexual content beyond the game's baseline (2 finds: sex-robot-warehouse, rideshare-app-logo). | The research flagged the sex-robot warehouse for age gating; violence is the game's baseline. |
| S4 | `chapter_gate` holds the earliest chapter a source states, else null. One value (gauntlet-hellfire-hamlet) is derived from a sourced mechanic and says so in its notes. | Never guess a chapter. |
| S5 | `first_finder` is set only where research names an originator (5 finds). The Belville finder "Jared" has no public handle and the Mapping Discord is not linked (it vanished amid leak reports). | Credit only what is sourced; never link leak spaces. |
| S6 | `clip` is the first embeddable platform source in research order (27 finds). Spoiler finds keep their clip but the site must hold it behind the spoiler reveal (validator warns). | Research lists the earliest or primary clip first. |
| S7 | Article and wiki sources are keyed by outlet in `content/sources.json`; the author stays on each find's source entry. | One registry entry per outlet keeps credit and fetchability notes in one place. |
| S8 | Finds carry `region_ids` and regions carry `evidence_finds`, kept in sync by the validator. Places named only in finds are sourced through those finds. | Lets the map filter by region and keeps every region traceable to a URL. |
| S9 | Region `vibe` tags only where research wording supports them, with that wording in `vibe_note`. No official danger or wealth rating exists. | Never invent a rating. |
| S10 | Districts with no fetchable source (La Perle, Tequesta, Tisha-Wocka, Peacock Bay) are left out of `regions.json` until sourced. | The official Vice City page names no districts; GTA6Info's page names only some. |
| S11 | Validation uses one dev dependency, `ajv`, and a small frontmatter parser in `scripts/validate.mjs`. | The brief allowed at most one small dependency. |
| S12 | The one-off migration from `research/` is kept at `scripts/one-off/migrate-research.mjs` for audit, guarded by `--force`. | Shows exactly how every derived field was decided. Content is hand-edited from now on. |
| S13 | Explainers ship as `status: draft` and cite with `[n]`; the validator rejects any claim line without a citation. Editorial lines start with `Note:`; known gaps sit in HTML comments. | "Every claim cited" is enforced, not hoped for. |

## 2026-11-23: slice decisions (map base, open to owner review)

| # | Decision | Why |
|---|---|---|
| M1 | Positions are pixels of the original 5,775 x 7,900 image, origin top-left. Leaflet CRS.Simple with zoom 5 as full resolution. | One integer space that matches the file Rockstar ships; no projection maths to get wrong. |
| M2 | Tiles are 256 px WebP, built by `sharp` (one dev dependency), git-ignored, never committed. | Small (5.66 MiB for all 970 tiles), fits Cloudflare limits, keeps Rockstar's file out of the public repo. |
| M3 | Grid cells are written row letter then column number (`F5`). Letters are rows, numbers are columns, as measured. | Matches how the poster prints them. |
| M4 | `pin_accuracy` has a third level, `exact`, beside `landmark` and `area`. | Chime places pins from clips and in game, which is more precise than a labelled place. Remove it if the owner wants two levels only. |
| M5 | The map agent did not view the map image, so labels and first-pass pins wait for a person. | LEGAL.md and CONTENT-GUIDE rule 5 forbid feeding the map into AI tools; the brief asked otherwise, so the conflict goes to the owner. |

## 2026-11-23: slice decisions (design foundation, open to owner review)

| # | Decision | Why |
|---|---|---|
| D1 | The desktop header is the NEON compact island (336 wide, centred) as picked. The design audit's "shared edges" check fails on desktop because a centred island cannot share the 40px page edge; every other check passes. | The owner chose the NEON island (answers, question 3). Widening it or adding corner controls would change the pick. Options if the check must pass: accept it as a deliberate exception, or move to a full width bar. |
| D2 | Display face is loaded as Google Fonts' "Big Shoulders" with its optical size fixed at 72, which is the Display cut. | Google merged Big Shoulders Display into one family with an `opsz` axis; the old family name no longer resolves. |
| D3 | Home art is the YouTube thumbnail of each find's own clip, loaded from YouTube. Shorts, spoiler and mature finds never show art on the home page. | Decision 8 (embed, never re-host); the only art we may show without AI processing of Rockstar files. The agent never looked at these images; the owner should eyeball the real stills. |
| D4 | The A24 stack shows the first five safe finds whose titles fit one line (47 characters or fewer), at about 58px on a 1440 screen instead of A24's 72px. Its superscript is the find's category, not a date. | Find titles are sentences, not film titles; at 72px they cannot sit on one line. Every find carries the same `updated_at`, so a date would say nothing. |
| D5 | The home hero stays dark in the light theme (`data-scheme="dark"`). | Art led: the white type sits on the still in both themes, as the A24 and Apple TV picks show. |
| D6 | Glass blur is 20px (the GTA site uses 25px). | Animated glass over 20px drops frames in Safari. |
| D7 | Theme: no saved choice follows the system setting; the toggle in the header saves a choice on the device; `?theme=light|dark` forces one for checks. | Dark first (decision 17) without overriding a visitor who runs a light system. |
| D8 | The header stays a centred NEON island on desktop. The design audit's "shared edges" check fails on it by design; treat those two desktop fails as a known exception, and any other fail as real. | Owner decision, 23 Nov 2026: keep the centred island as picked. |

## 2026-11-23: map screen and find drawer (open to owner review)

| # | Decision | Why |
|---|---|---|
| MP1 | Desktop list column opens on "List", with "Legend" second (Felt shows Legend first). | No pins are placed yet; the list is how every find is reached. |
| MP2 | GetYourGuide's "Close map" pill, heart buttons, prices and ratings, and every locate button are left out. The row's bottom line shows the verification badge and "On the map" when a find is pinned. | The map is a page, a fan guide has no accounts or prices, and a game map has no "my location". |
| MP3 | Groups of nearby finds use Lyft's pink count pill everywhere (GetYourGuide's white cluster circle is not used). | One group style; the owner's pin pick is Lyft. |
| MP4 | The phone selected-pin card is Strava's (the brief); Zesty gives the source chips only. | The direction file named both; the brief settled it. |
| MP5 | The filter menu has no icons per row and uses Mindtrip radios and checkboxes on desktop, Tide Guide's check column on phone. Felt's "Show labels" toggle becomes a checkbox row ("Show the grid"). | A check glyph beside an unticked row read as ticked on phone; one boolean control on the site. |
| MP6 | MasterClass "Moments" rows and Frame.io's timecode chip are not built. | No find has clip timestamps yet. They slot into the drawer's tabs and the sheet when content has them. |
| MP7 | Basemaps are "Official" and "Muted" (the official tiles desaturated, PamPam's idea); the printed A to M, 1 to 9 grid is an overlay. | There is one map file; the grid lets people say "F5". |
| MP8 | Phone chips are drawn 40 high as Rodeo shows and tapped at 44 (an invisible hit area); the toggle and search pill are 50 high (Rodeo 47) so their buttons reach 44. The audit still warns on the chips' drawn height. | Keeps the pick's proportions and the 44px touch rule. |
| MP9 | The map credit "Map © Rockstar Games" sits on the map at all times (bottom left on desktop, top left on phone). | docs/MAP.md: show the credit wherever the map shows. |
| MP10 | The agent never viewed the map art: every screenshot and audit used flat placeholder tiles and stand-in stills. | Rockstar ToS 2.3 and CONTENT-GUIDE rule 5. The owner should look at the real map once on a preview build. |
## 2026-11-23: the lore section is the GTAverse (owner decision)

| # | Decision | Why |
|---|---|---|
| G1 | The lore section is named "The GTAverse": the shared universe across GTA I to VI, Red Dead, Bully and L.A. Noire. The menu reads "GTAverse" (count kept), routes are `/gtaverse` and `/gtaverse/[slug]`, the index title is "The GTAverse", and each connection page keeps its own title. `/lore` and `/lore/*` redirect with a 301 (`public/_redirects`). | Owner decision, 23 Nov 2026. |

## 2026-11-23: slice decisions (find, explainer and lore pages, open to owner review)

| # | Decision | Why |
|---|---|---|
| P1 | Find page: the Disney+ circle and the Google TV second pill open the map only when a find has a pin (`/map?find=<slug>`). No find has a pin yet, so the circle shares the page and the pill opens "How to find it". | The direction file read the circle as "open on the map" (inference); a map link without a pin would land nowhere. |
| P2 | Find page tabs are Related, Clips and Details on both sizes (the direction proposed Shots on the phone). Clips holds the clip and the other YouTube sources as the Xbox grid. | One tab set for one component; Clips covers both the clip and the shots. |
| P3 | Credit: "About the finder" only when `first_finder` exists; otherwise "About the clip" with "Clip by <creator>". Spoiler and mature clips load no thumbnail until revealed. | Owner content rules. |
| P4 | The wanted states table keeps the content's own orientation (one row per state, as Fiverr shows six rows), with the level badge and colour on each state. The direction proposed one column per level, but the content has six named states with sentences, not five numbered levels with short values. | Change the presentation, never the content. |
| P5 | Lore moments sit at the release year of the earliest game each connection lists (release years in `src/lib/lore.ts`). Every moment is in the page, so moving along the line is instant; on a connection page the address follows the selected moment. | One selected moment at a time (owner answer 5), with a real page per connection. |
| P6 | Grok's selected title is set in Newsreader (V7's serif captions) and its description at 64% white instead of 50%. | Answer 6 keeps the serif on lore pages; the summaries run to 60 words, so legibility first. |
| P7 | Queue's quote mark is kept on the phone headline as decoration (hidden from screen readers), though moment titles are not quotes. | The owner named "quote" in the brief; flag if it reads as a quotation. |

## 2026-11-24: collectible layers from Game Checklists (owner exception)

| # | Decision | Why |
|---|---|---|
| C1 | **Owner exception, 24 Nov 2026.** An agent may view the 12 Game Checklists collectible maps reposted by @Sksj002 (https://x.com/Sksj002/status/2124675198209364423, watermarked "Game Checklists") only to read pin numbers and positions. Nothing is generated from them. The agent does not view the official Leonida map image or its tiles, any other Rockstar image, or gameplay footage; code may process images numerically (colour segmentation, feature matching). This supersedes decision 13 for these 12 collectible layers only: their pins are transcribed into `content/collectibles.json` with Game Checklists credited on every item and on the map. Finds still never take a position from any other map. | The owner wants the collectible layers on our map now, credited to the people who mapped them. |
| C2 | Collectibles live in their own file, `content/collectibles.json`, not in `finds.json`. Each item has `pin_accuracy: "transcribed"` and `verification: "single-source"`, our own short label ("Stunt 12"), and the source credit. | They are another map's work, not finds we checked; keeping them apart keeps the find rules (clip, sources, pin basis) intact. |
| C3 | Positions come from a similarity transform per map, fitted in code by SIFT feature matching and RANSAC between each source image and the official image (never viewed). Reprojection error 1.5 to 2.5 px and grid offset about 2 px, in official map pixels. One source pixel is about 5 official pixels, so a pin is good to roughly 5 to 10 px before the reading caveats below. | Their maps are the official map scaled about 0.2 and cropped; a transform from thousands of matched features is far more exact than reading by eye. |
| C4 | Where the source fanned several pins out around one spot (a small hub dot with legs), every pin in the fan is placed at that spot; the note says how far it moved. Pins that only touch their neighbours, with no hub seen, keep their own centre and the note says they may be nudged by up to one pin width. | Their renderer never overlaps pins, so close locations are spread out; the hub is the true spot. |
| C5 | Numbers were read by eye from crops of the source maps. Shop numbers are small and blurred at the 1,080 px the repost offers: 91 of 234 are marked as hard to read and 5 as unreadable (number `null`, "Shop (number unreadable)"). | Never guess silently; the card says when a number may be wrong. |
| C6 | Collectible layers are off by default and are turned on in the basemap menu (both sizes) and the desktop Legend; the choice is remembered on the device (`vf-map-view`). Pins are small quiet discs under the find pins, numbered once zoomed in, never grouped; items sharing one spot sit on a small ring. Their data loads from `/collectibles.json` only when a layer is first turned on. | Collectibles must not crowd the finds, and 892 pins should cost nothing for visitors who never turn them on. |
| C7 | While any collectible layer is on, the map credit gains a second line, "Collectible locations: Game Checklists", and each collectible card ends with "Location: Game Checklists" linking to the post the map came from. Their own site or original post was not found on 24 Nov 2026, so the link is the repost. | Credit wherever their work shows. |
## 2026-11-24: open-source readiness (owner decisions, Stage A answers)

| # | Decision | Why |
|---|---|---|
| OS1 | **Licences:** MIT for code (`LICENSE`); CC BY-NC 4.0 for original content: `content/`, `research/`, the prose in `docs/` and the explainers (`LICENSE-CONTENT`). Copyright holder: "The Vice Files contributors". Game names, images, logos and trademarks belong to Rockstar Games and Take-Two and are not licensed by this repo. | Code stays freely reusable; NC keeps the guide inside Rockstar's non-commercial tolerance and stops ad-funded sites republishing it. |
| OS2 | **Inbound terms:** contributions are accepted under the same licences (MIT for code, CC BY-NC 4.0 for content). No DCO, no CLA. | Simple for contributors; matches the outbound licences. |
| OS3 | **Personal data:** removed from the current files only; git history is left as it is (Stage A option H1). | Low sensitivity, no secret involved; a rewrite would break every clone and open branch. |
| OS4 | **Code of Conduct:** Contributor Covenant 3.0 (the current version), reports to conduct@thevicefiles.com. | The usual standard; a project address, not a personal one. |
| OS5 | **Takedown and credit requests are answered within 48 hours**, everywhere the project states a time. | One promise the maintainers can keep. |
| OS6 | **thevicefiles.com is the only domain in the repo** (docs and schema `$id`s); repo links point to github.com/obileonardo/thevicefiles. | One address; no personal domain in public files. |
| OS7 | **No AI analysis of Rockstar images**, including reading colours from official art. Values sampled from Rockstar's share image were removed from `research/gta6-design-language.md`; values read from the site's CSS and cited fan measurements stay. | Rockstar ToS 2.3 and CONTENT-GUIDE rule 5, applied to analysis as well as generation. |
| OS8 | **CI and Dependabot:** every pull request and push to `staging` and `main` runs a frozen install, `pnpm validate`, `pnpm build` and an asset guard; Dependabot opens weekly npm and Actions updates into `staging`. Repository settings are prepared in `docs/release/STAGE-B-SETTINGS.md` and applied only after the owner approves. | The validator gate cannot be skipped, third-party assets cannot slip in, and settings changes stay the owner's call. |

## 2026-11-24: game switcher and official game logos (owner decisions)

| # | Decision | Why |
|---|---|---|
| GS1 | **Owner decision, 24 Nov 2026. Official game logos identify games, never our brand.** They appear only in the game switcher, on game hubs and in "Also in" chips, unaltered, at a fixed small size, next to the game's name in text, with the visible line "Game logos are trademarks of Rockstar Games and Take-Two Interactive". Never in the wordmark, favicon, social cards, hero or anything that suggests endorsement, and never the Rockstar Games logo. This amends decision 6 for game logos only; docs/LEGAL.md and docs/DESIGN-SYSTEM.md are amended to match. | Naming a game with its own mark is referential use; branding with it is not (docs/LEGAL.md, "Trademarks are the line"). |
| GS2 | **Owner exception to OS7, 24 Nov 2026.** An agent may download each logo from an official Rockstar or Take-Two page (rockstargames.com game pages, press and media pages; never fan sites or wikis) and view it only to size and fit it. No edits, recolouring, tracing or AI processing. Logo files are never committed: `scripts/media/fetch-logos.mjs` downloads them from the URLs recorded in `content/games.json` (page, file URL, retrieval date, licence note, sha256, size) into the git-ignored `public/media/logos/`, and a deploy runs `pnpm logos:fetch` before `pnpm build`, like the map tiles. A changed file fails its checksum and is not used. A game without a confirmed official file shows a text plate. | Keeps the marks out of the public repo and the licences, keeps each file traceable to its official source, and makes a takedown a one-line change. |
| GS3 | **Owner decision, 24 Nov 2026 (approved proposal).** Desktop: a vertical "Games" rail as a second column inside the header menu popover. Phone: a bottom sheet in the map sheet's style (drag, snap, interruptible). Groups: HD (GTA VI, V, IV), 3D (San Andreas, Vice City, III, Liberty City Stories, Vice City Stories), Red Dead (RDR2, RDR), Also from Rockstar (Bully, L.A. Noire, Max Payne 3, Manhunt, The Warriors). Each row: official logo, the name in text, the count of GTAverse connections. Real links and buttons, `aria-expanded`, focus moved and returned, Escape closes. | The by-game door into the GTAverse, accessible where the competitor's is not. |

## 2026-11-24: slice decisions (game switcher, hubs, chapter setting, open data; open to owner review)

| # | Decision | Why |
|---|---|---|
| GS4 | Every logo sits on one fixed dark plate (`--logo-plate`, #0D0C1A) in both themes. The official files are full colour and drawn for the dark ground of Rockstar's own pages; recolouring them for light is not allowed (GS1). A person checks contrast on a preview build. | Shows each mark as published. |
| GS5 | Logo sources, 24 Nov 2026: the logo image each official rockstargames.com game page shows at its top (alt text recorded per game), and the full GTA VI logo image on rockstargames.com/VI. Text plates: The Warriors and GTA Online (their official pages showed no logo image). | The only official files found; text plates where none was confirmed. |
| GS6 | The desktop popover grows to the left of the island (the site rows stay under it) and shifts right only when the window is too narrow. Rail rows are 36 high, 4 apart, 10 between groups, with group labels in a left column, so 15 rows fit a 900 px tall window and link spacing stays even (the design audit's menu check). Plates are 104 x 28 (rail), 120 x 36 (sheet), 64 x 22 (chips), 280 x 64 (hub), wider than the study's 72 x 28 because Rockstar's game wordmarks run 7 to 12 times wider than tall. | Readable marks without breaking the island (D1, D8). |
| GS7 | `content/games.json` maps every game name used in content through each game's `aliases` (the normalisation map; content text is not rewritten). Expansions and remasters map to their base game (The Lost and Damned and The Ballad of Gay Tony to GTA IV, Undead Nightmare to RDR, the Definitive Editions to III and San Andreas). GTA, GTA 2, Chinatown Wars and GTA Online are records in a "More games" group: they have hubs and sit on `/gtaverse/games`, not in the switcher. Midnight Club has no connections and no record. | Every name resolves (validator), and the switcher stays the owner's list. |
| GS8 | Game hubs (`/gtaverse/games/[id]`) show only facts we hold (release year, universe, counts); year of setting waits for sourcing. Connections use the shared connection list (`lore/ConnectionList.astro`, also on `/gtaverse`), finds use the card grid. Fewer than 3 connections shows "We have only N so far, suggest one". | No unsourced facts; one list component. |
| GS9 | "Also in" chips: a find's chips come from its `crossover_games`, a connection's from its `games`, oldest first, each linking to the hub. On connection pages they replace the "Appears in" badges. | Curated from our data, never name matched in text. |
| GS10 | The game lens: `?game=<id>` on `/gtaverse` and `/finds` filters the list, dims and skips other moments on the timeline, and shows a "Showing: Vice City" chip that clears it. Unknown ids are ignored. Set from hubs ("See on the timeline", "Finds for this game"). | Shareable, survives reload, no dead ends. |
| GS11 | "I'm on Chapter N" (`src/lib/chapter.ts`, key `vf-chapter`): a select on spoiler clip gates and the finds list with "No chapter yet", Chapter 1 to 5 (the highest gate in content, if higher), and "Finished". Spoilers gated at or before the chosen chapter open by themselves (clip, card and hero art, Spoiler blocks); spoilers without a chapter stay gated until "Finished"; mature content never opens by itself. Storage blocked: the choice lasts for the page. The map is not changed here (the Map agent owns it); it can adopt `readChapter`, `isUnlocked` and `onChapterChange` from the same file. | Readers past a chapter stop clicking through gates they no longer need. |
| GS12 | Open data: `/data/finds.json`, `/data/connections.json`, `/data/collectibles.json` and `/data`, built from content at build time. Published finds only (a build guard throws on a draft or rumour). Each file starts with the licence (CC BY-NC 4.0), attribution ("The Vice Files contributors"), how to cite, what is not licensed and the content date; records keep their sources, finders, creators and the Game Checklists credit. The footer link is left to the footer's owner. | Reuse under our licence with credits intact. |
| GS13 | "On this page" on explainers is the existing contents rail, made one element: a sticky rail at 1024 px and wider, a closed disclosure in reading order below that. It shows when a page has two or more sections, as the rail did. | One implementation, now on every screen size. |
| GS14 | Inline spoilers: `<Spoiler chapter="Chapter 3">` in Astro pages, and in explainer markdown a paragraph starting "Spoiler:" or "Spoiler (Chapter 3):" (like the existing "Note:" callouts). Native `<details>` with the muted badge; the validator warns when a page or find not marked spoiler has a Spoiler block without a chapter. | Works without JavaScript, announced as a disclosure, follows the chapter setting. |
