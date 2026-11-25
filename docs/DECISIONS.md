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
| 6 | **Not allowed as our branding**: the GTA VI logo, the Rockstar logo, the GTAArtDeco font. Amended by GS1: official game logos may identify games (switcher, hubs, chips), never brand the site. | Trademark and font-copyright risk; suggests endorsement. |
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

## 2026-11-24: slice decisions (site features: launch SEO, trust pages, hubs, feed, deploy config; open to owner review)

| # | Decision | Why |
|---|---|---|
| SF1 | One launch switch, `site.indexable` in `src/lib/site.ts`, default `false`. While off: `noindex, nofollow` meta on every page, `X-Robots-Tag: noindex, nofollow` added to the `/*` block of `dist/_headers` at build, and `robots.txt` disallows everything with no sitemap line. `/prd` is always noindex. `pnpm seo:check` fails if any of the three disagree. | One place to flip at launch, and a check that the three signals never drift apart. |
| SF2 | Open Graph cards are text only, generated at build with satori (one dev dependency) and sharp from static TrueType instances of Big Shoulders and Inter fetched from Google Fonts into `node_modules/.cache`. Nothing binary is committed. | No Rockstar art or YouTube thumbnails in previews (OS7, decision 8); the asset guard forbids committed images. |
| SF3 | JSON-LD: `WebSite` with `SearchAction` to `/map?q=`, `Organization` with `publishingPrinciples` and `correctionsPolicy`, `ItemPage` for finds (sources as `citation`, the finder or clip creator as `contributor`), `Article` for explainers, `CollectionPage` with `ItemList` for lists and hubs, `BreadcrumbList` on every page below the home page. | The map does not read `?q=` yet (study item 3 belongs to the map work); the action is ready for it. Google retired the sitelinks search box in 2024, so this is low stakes. |
| SF4 | `added_at` on finds is the day a find entered the guide. The 85 existing finds carry the research date, 2026-11-23 (research headers; git history agrees for every id). Script: `scripts/one-off/backfill-added-at.mjs`. | Never guess a date; the feed and "New this week" need a real one. |
| SF5 | "New this week" shows finds added in the seven days before the build, skipping finds already shown above it, and disappears when there are none. `/rss.xml` lists every published find by `added_at`; spoiler and mature finds carry a gate line instead of their summary. | The site is static, so "this week" is as of the last build; spoilers stay gated in feed readers. |
| SF6 | Region hubs exist for every region below the state with at least one published find in it or inside it (46); category hubs for every find category with a published find (12). Hubs show no map link until finds carry pins (P1). | Leonida itself would repeat /finds. |
| SF7 | Nearby on find pages: pinned finds by pixel distance first, then finds in the same place or anywhere inside it, deepest shared region first; the state never counts as near. Related drops finds already in Nearby. Unit tested (`pnpm test`). | No find has a pin yet, so the region rule carries it today. |
| SF8 | `/finders` counts people (first finders and the creators of cited YouTube, X, Reddit and TikTok posts, one row per registry id) separately from outlets and wikis. Official Rockstar accounts count as outlets. Sorted by finds credited, then first finds, then clips. | Credit people for their work; Rockstar is not a fan finder. |
| SF9 | The corrections log is GitHub: issues labelled `correction` and the history of `content/`. No new content file. | A public, dated record that already exists. |
| SF10 | Root `wrangler.jsonc` serves `./dist` as static assets (worker `thevicefiles`) on thevicefiles.com only (amended 24 Nov 2026, see SF11). The personal domain sits beside `prd/wrangler.jsonc`, which already names it, but it conflicts with OS6 ("thevicefiles.com is the only domain in the repo"): the owner should confirm or drop it. `prd/wrangler.jsonc` attaches both domains to the `vicefiles-prd` worker (thevicefiles.com serves the PRD today), so they must move from that worker before the first deploy. | The brief named both; OS6 is the owner's to reopen. |
| SF11 | `pnpm run deploy` (not `pnpm deploy`, which is a built-in pnpm command) runs `map:fetch`, `map:tiles`, `build`, then `wrangler deploy` through `pnpm dlx wrangler@4.159.0`, so wrangler is not a project dependency. Not run. | Keeps CI installs small; production deploys need the owner's go. |

## 2026-11-24: map HD, 3D view, links, search and found tracker (open to owner review)

| # | Decision | Why |
|---|---|---|
| M3D1 | Tiles are 512 px, shown one map pixel per device pixel (256 CSS px from one level deeper on 2x screens), WebP quality 90 with smart chroma subsampling, and zoom stops half a level past native detail (4.5 on 2x, 5.5 on 1x). | Measured cause of the soft map: no retina tiles and zoom past full resolution (docs/MAP.md, Sharpness). Deeper zoom would only stretch pixels; AI upscaling is never an option. |
| M3D2 | The 3D view is Three.js 0.187.0, loaded only when 3D opens, over relief we drew in `content/relief.json`, labelled "Relief is approximate, drawn by The Vice Files." on screen. | No reusable non-leak terrain exists; our own drawing is honest and editable. |
| M3D3 | 3D opens straight down on the 2D view's spot and scale, then tilts to 50 degrees (range 0 to 62); 2D stays mounted underneath so switching back keeps its place. Pins are not grouped in 3D and the printed grid is 2D only. | Continuity between views; the tilt angles are our choice, since no source described the game's. |
| M3D4 | **Resolved 24 Nov 2026: code-only pixel counting is allowed, consistent with tiling and collectible registration.** To keep the hand-drawn hills on land, a script counted land and water pixels of the official map per grid cell and averaged its main colours (numbers only; no image was viewed and no AI tool saw the map). OS7 forbids reading colours from official art. If that rule covers this, a person should re-place the relief in the harness (the points are marked `approximate`) and the counts are discarded; the water shader's rule (a saturated cyan to blue hue) is generic and does not need the counts. | Flagged rather than decided by the agent: the rule and the method may conflict. |
| M3D5 | Found toggle lives in the drawer and the phone sheet, not yet on the find page. | The find page belongs to the pages work; the store (`found.ts`) is ready for it. |
| M3D6 | A link with `?q`, `?category` or `?region` starts from the default filters, ignoring filters saved on the device. | A shared link shows what the sender saw, and spoiler or mature finds never appear unasked. |
| SF11 | rockstarworld.elvisobi.com permanently redirects (301) to the same path on thevicefiles.com through a Cloudflare redirect rule on the elvisobi.com zone. The repo deploys thevicefiles.com only, and the PRD worker serves no domain. | Owner decision, 24 Nov 2026: one home, no duplicate site, personal domain out of the repo config. |

## 2026-11-24: home hero modes (owner decisions)

| # | Decision | Why |
|---|---|---|
| H1 | The home hero background has three modes, **trailer, key art and line art**, switched by three circles at the top right. They rotate on their own; the active circle's ring is the timer; choosing a circle stops the rotation. The YouTube clip thumbnails are no longer the hero background. | Owner, 24 Nov 2026: the creators' clips as hero art "feels boring". |
| H2 | The trailer and key art are **Rockstar's official downloads** (`GTAVI_Videos.zip`, `GTAVI_Artwork_Wallpapers.zip`), re-encoded for the web by the build and credited "Trailer and art: Rockstar Games". Never committed; built at deploy like the map tiles (docs/HERO.md). | Decision 5 allows official media inside content with a credit; owner approved the downloads. |
| H3 | **Narrow exception to OS7:** the agent may view the official trailer clips and wallpapers only to choose the loop moments and crops. Nothing is generated from them (no AI upscaling, style transfer or derived art), and no other Rockstar imagery, the map or tiles are viewed. | Owner approval, 24 Nov 2026. Choosing a crop needs eyes on the frame. |
| H4 | The find list stays; hovering a line shows that find's clip thumbnail in a small tilted frame beside it (first tap shows it on touch screens, second tap opens). Spoiler and mature finds never show a thumbnail. | Owner brief. |

## 2026-11-24: slice decisions (home hero modes, open to owner review)

| # | Decision | Why |
|---|---|---|
| HS1 | The official videos zip holds no full trailer: eight character clips of 1 to 1.5 s (silent) and a 33 s animated cover art. The "trailer" is the eight clips cut together with hard cuts (Lucia, Cal, Boobie, Brian, Real Dimez, Raul, DreQuan, Jason), 9 s, looping. | The closest thing to a trailer in the official files. Re-hosting a YouTube trailer is never allowed (decision 8). |
| HS2 | The animated cover art is never shown: it is built on the GTA VI and Rockstar logos. Only its music is used, as the trailer's sound (24 s from 0:04, faded in and out), fetched only when a visitor turns sound on. The agent could not listen to it: **the owner should check it has no voice over.** | Decision 6 (no logos as branding). The character clips have no audio track. |
| HS3 | Key art: five logo-free wallpapers (Jason and Lucia on the car, Jason and Lucia at dusk, Cal Hampton, Real Dimez, Boobie Ike), the landscape file on desktop and Rockstar's own phone file on phones. Postcards (lettered), the cover art and the album art (logos), the motel and robbery pieces were left out. | Art first, no logos, no lettering competing with the find list. |
| HS4 | The landscape MP4 lands at CRF 31 (3.4 MB) to stay inside the 2 to 4 MB band; the clips are fast moving and grainy. Browsers that play AV1 get a 2.3 MB WebM instead. | Owner's size band. If it looks soft on a big screen, a 1280 wide reel at CRF 26 is the alternative. |
| HS5 | The line art is drawn by our own small canvas renderer (about 4 KB compressed, loaded only when needed), not Three.js. | The look is perspective hairlines and a slow camera; Three.js would add about 150 KB for the same picture. |
| HS6 | The coastline is traced by code from the cached official map (colour classes, no person or AI looks at the map) and written to the git-ignored `public/media/hero/coast.json`; it is never committed, because it is a shape derived from Rockstar's map. | docs/MAP.md, OS7. |
| HS7 | Video encoding uses the `ffmpeg-static` dev dependency (ffmpeg 6.0 with libx264 and SVT-AV1); its binary downloads on the first `pnpm media:build`, not on install. | Homebrew's ffmpeg on the build Mac has no libx264, VP9 or AV1 encoder; the brief allowed ffmpeg-static. |
| HS8 | D3 is superseded for the hero background: home art is now the official reel, key art and our line art. The YouTube thumbnail still appears in the peek frame and the NEON sub bar. | H1. |
| HS9 | The line art's weapons are a generic compact pistol and a generic pump shotgun of our own design (no real or in-game model), shown as a still product study with three shells; the pink accent is one shell. | Owner brief, 24 Nov 2026: weapons as line art; original drawings only. |
| HS10 | Line art timing: one drawing per 10 s visit, the four drawings in turn across visits (coastline, coupe, sidearms, walk). Each is fully drawn by 3.75 s and drifts for the rest. Showing all four in one visit would need about 40 s and dwarf the trailer and key art. | Each drawing gets a whole slot; the rotation stays about 28 s. |
| HS11 | The coastline is traced as the outer edge of each land mass (main island plus the major islands), not every land and water boundary, so it draws as a few continuous closed lines; the old trace drew 39 loops including lakes and specks, which read as broken dashes. | Owner brief, 24 Nov 2026: one clean outline. |

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

## 2026-11-24: layout and motion (owner decisions)

| # | Decision | Why |
|---|---|---|
| L1 | **The gutter is 128px** on the left and right at 1440 and wider (`--gutter`, also `--page-pad`), stepping down to 96 at 1280, 64 at 1024, 40 at 768 and 16 on the phone. Page content, header-aligned content, the home hero and the footer share it; `--container-max` is 1664 so wider screens keep 128 and centre the rest. | Owner, 24 Nov 2026: "the padding to the right can be 128 pixels to the right or 128 pixels to the left. That can be our gap". |
| L2 | **Home hero placement:** the mode circles and their caption sit top right at the gutter, centred on the island (the caption goes under the circles below 1280, where there is no room beside them); the finds list left-aligns at the gutter, its category labels attached to each line; the scroll arrow aligns to the right gutter. | Owner, 24 Nov 2026. |
| L3 | **Home hero intro**, top left at the gutter, its top level with the island: "The Vice Files is a fan-made field guide to GTA VI. Every secret in Leonida, shown in the clip of the fan who found it, labelled by how sure we are, and linked across the Rockstar universe." Small body type, about 36 characters a line, text-2 with the name in text-1, no panel, a soft local scrim under it for contrast over the trailer and key art. It enters first in the hero wave. Hidden below 1024: between 768 and 1023 the island leaves no room beside it, and on the phone the Apple TV slides fill the art from the bottom while the peek frame opens into that space (the page heading carries the same sentence for readers). | Owner, 24 Nov 2026 (annotated screenshot); the phone placement was left to the build and the audit. |
| L4 | **Text containers never clip glyphs** (docs/DESIGN-SYSTEM.md, rules). The A24 lines had descenders cut ("egg", "skiing", "Negra"): the ellipsis now clips sideways only and the reveal mask moved to the list item, which carries 0.2em of room above and below. | Owner bug report, 24 Nov 2026. |
| L5 | **The hero's peek card follows the cursor** over the finds list: it rides the pointer on critically damped springs (about 60ms behind a moving pointer, never past it), offset above and to the right so it never covers the word under the pointer, flipped and clamped inside the hero and its gutters; it glides across every line and only crossfades its picture when the line changes; it leans up to 3 degrees with its own horizontal speed and settles flat. It fades and grows in from the corner nearest the cursor. Touch keeps tap to show, tap to open; reduced motion places it beside the line without following. **This overrides the motion study's "no cursor effects" rule for this one element.** | Owner, 24 Nov 2026: "the card should be on the area where my mouse is ... it should move with the mouse, and of course across the sections too". |
| L6 | The hero's scroll arrow is a 20px icon in a 44px hit area, in text-2, bottom right: its glyph on the right gutter, its bottom on the list's last line. | Owner, 24 Nov 2026: "way too large". |
| L7 | The trailer's sound toggle moves into the hero controls: option A (default) beside the mode circles as an outlined toggle, its place kept while hidden so the caption never jumps; option B top left beside the intro, behind a temporary `?sound=b` flag until the owner picks. | Owner, 24 Nov 2026: a better place than the lone button at the bottom right. |
| M1 | **Motion pass:** the motion study's top 15, built with the owner's rules: no bounce or overshoot, exits on a different curve at 60 to 75% of the entrance, an exit and an entrance never slide at the same time (fades may overlap briefly), per-component reduced motion, composite-only properties, native scrolling. | Owner approval of the study, 24 Nov 2026, and the owner's clarification of "two movements never overlap". |

## 2026-11-24: slice decisions (motion pass, open to owner review)

| # | Decision | Why |
|---|---|---|
| MS1 | Page transitions are the browser's own cross-document view transitions, not Astro's client router. Firefox (no support yet) navigates instantly. | Zero JavaScript and no change to how pages load; every island, script, scroll restore and the back-forward cache keep working. |
| MS2 | The find still does not travel from its card into the find page (a shared-element transition from the study's opportunity map, not in the top 15). | It would add a second moving element to every page change; the root transition already removes the seam. |
| MS3 | The phone hero title rises as one block through its mask, not split line by line. The desktop finds list rises line by line (each line is one line). | The phone title wraps in Big Shoulders, which may still be loading when the page first paints, so measured line breaks could be wrong. |
| MS4 | Exits: drawer 260 in / 180 out, toast 400 / 260, popup 180 / 120, phone card 260 / 180. Opening again during an exit reverses from where it is (CSS transitions with `@starting-style`). | The 60 to 75% rule; transitions retarget, keyframes restart. |
| MS5 | Filter changes animate list rows with FLIP (at most 20 rows near the screen; 240 to 380ms by distance); rows that leave fade in place for 120ms while the others close the gap. | Rows that stay never jump, and nothing waits. |
| MS6 | The GTAverse timeline arcs join a moment to the five nearest moments that share its first game (sharing any game links almost everything: GTA V is in 43 connections). | A link that means something, and a band that stays readable. |
| MS7 | One key fact per explainer is marked in its markdown with `<mark data-draw>` (no words changed): "between midnight and 4 AM", "the outcome changes with your earlier choices", "a separate Criminal Profile", "no breakups and no cheating", "Cloud CCTV cannot". | The study asks for one authored phrase per explainer; these are the facts a reader is most likely to come for. Open to the owner. |
| MS8 | The map's blurred base is built with the tiles (`public/map/base.webp`, 480px wide, never committed, like the tiles). Without it the map works as before. | Derived from Rockstar's map, so it follows the tiles' rule (docs/MAP.md). |

## 2026-11-24: slice decisions (icon family, open to owner review)

| # | Decision | Why |
|---|---|---|
| IC1 | One icon family in `src/icons/family.ts`, generated by `scripts/icons/build.py` with the Capsa glyph method vendored in `scripts/icons/capsa.py`. Solid is the default set, Line the setting. This answers decision 18 with the owner's later choice: our own GTA-style set drawn the Capsa way, not the paid pack and never Rockstar's icons. | The owner's standing rule: every project's icons use the Capsa style and its own generator. |
| IC2 | The family stays on Capsa's 20 unit grid (viewBox `0 0 20 20`), not the 24 grid of the brief. | Capsa's weights and keylines are defined on 20; a 24 grid would rescale every number by 1.2 and render the same. |
| IC3 | Icons are code (SVG markup in TypeScript), never `.svg` files. | The CI asset guard blocks committed `.svg` files. |
| IC4 | Knock-outs use Capsa's mask compositing with an id unique per instance (`src/icons/render.ts`). | A mask id shared by two icons breaks when the first one is hidden; per-instance ids also suit Leaflet pins and the 3D pin atlas. |
| IC5 | `rockstar-crossover` gets its own glyph (two overlapping worlds); the wanted `star` is no longer a category icon. `github` is an original branch glyph, not GitHub's mark. | No Rockstar or GitHub mark is redrawn; a star meant both "wanted" and "crossover". |
| IC6 | `/design/icons` is a noindex review page, excluded from the sitemap, the route list and the SEO check, with `X-Robots-Tag: noindex` on `/design/*`. | It is a design system page, not content. |
| IC7 | No component is rewired in this slice. The migration plan is in `docs/ICONS.md`; whether the current menu item keeps switching to a filled icon or shows its state by colour alone is an owner decision. | The Motion pass is editing the same components. |

## 2026-11-24: logo directions (open to owner review)

| # | Decision | Why |
|---|---|---|
| LG1 | Seven logo directions are shortlisted in Figma (docs/LOGO.md): Case File, Filed Pin, The Seal, Unfolded, Marked, Postcard, Cracked. None is chosen; the header keeps its text wordmark until Elvis and Chime pick. | Chime reviewed in rounds and kept these seven. |
| LG2 | Every direction uses our own palette, pink `#F976B0` on navy `#0D0C1A` (Chime's call), and only original marks and open-licence Google Fonts. | Decisions 6 and GS1: nothing that reads as official or borrows a Rockstar mark or font. |
| LG3 | The logo files live in Figma, not in the repository. The chosen logo will ship as SVG markup in code, like the icons (IC3); a favicon file needs an allowlist entry in the CI asset guard. | The asset guard blocks committed images, `.svg` included. |
| LG4 | Blush `#FBD3E6` on Chime's boards is not a site token. The chosen logo ships in token colours only (pink, navy, cream, surface, wine) unless Elvis approves blush. The header keeps its text wordmark until the pick; the logo then replaces it in the header island and the Open Graph cards. | Colours come only from the owner's picks. Found in review of #41, 24 Nov 2026. |
## 2026-11-24: icon family round 2 (owner review)

| # | Decision | Why |
|---|---|---|
| IC8 | **Owner approved round 2, 24 Nov 2026.** Map blips follow GTA VI's blip and HUD language (spec in `docs/ICONS.md`): chunky silhouettes on keylined plates, pins on a pointer for the map, plateless halos for stars and the player arrow, states shown on the plate (`blipSvg()` in `src/icons/render.ts`). The language was learned from gameplay frames of clips our finds cite (owner exception, study only); every glyph is our own drawing. | The owner's verdict on round 1: the game's own icons look better and more premium. |
| IC9 | **Owner decision, 24 Nov 2026.** Collectible-layer plates use GTA coral `#F76685` from the GTA VI sunset ramp, as the named token `--blip-collectible` in both themes, with `--blip-collectible-ink` and `--blip-collectible-key` navy `#0D0C1A` in both themes. Navy glyph on coral is 6.6:1 (AA); the keyline stays navy rather than following the ground because coral on the cream light map is 2.7:1. The hue is never adjusted per theme. | The owner's pick replaces the amber proposal; contrast is fixed by the keyline, not by changing the colour. |
| IC10 | **Owner decision, answers IC7.** In the menu, items at rest show the Line drawing and the current item switches to the Solid drawing ("Switch to the solid icon"). Solid stays the default everywhere else. Applied when the components are rewired (migration plan, `docs/ICONS.md`). | Keeps the current item obvious without a second colour. |

## 2026-11-24: slice decisions (design system page, open to owner review)

| # | Decision | Why |
|---|---|---|
| DS1 | The design system is a page, `/design`, built from the code on every build: tokens parsed from `tokens.css`, contrast computed (WCAG 2, alpha composited on the theme ground), props and notes read from each component's source, token usage counted across `src/`. Noindex, out of the sitemap, the route list and the SEO check, with `X-Robots-Tag` on `/design` and `/design/*`. | Owner: a design system always in sync with the code. Nothing on the page is a second copy of a value. |
| DS2 | The contents rail is one component, `site/ContentsRail.astro`, extracted from the explainer page unchanged (same markup, script and styles; the explainer still lifts it beside its reading column). `/design` places it in a left column and tracks sections, not headings. | Owner rule: one implementation per component. Verified pixel-identical on an explainer at 1440 and 390. |
| DS3 | The timeline and the map's parts (list row, drawer, toast) are shown in same-origin frames (`/design/timeline`, `/design/map-parts`) that follow the page's height, theme and data switch. The phone sheet is the real map at 390 px in a frame. | The timeline's headline is always an h1, and `map.css` uses global class names (`.sheet`) that restyle the timeline when both load on one page. |
| DS4 | The map's list row, drawer frame and toast are drawn on `/design/map-parts` with `map.css`'s own classes and the real `DrawerContent`, `ui.tsx` twins and `usePresence`, because `MapApp.tsx` keeps them inside itself. | No shared component may be edited in this slice; exporting them from `MapApp.tsx` would make the specimen the real thing. |
| DS5 | Specimens use real content: a showcaseable find, a spoiler find, a real explainer level table, and for the worst case the longest title, region, category, game and creator in our content. No mature find has a clip yet, so the mature gate is shown on the default clip and says so. | Demo data is never faked; worst cases are plausible because they are ours. |
## 2026-11-24: full screen menu with an art panel (owner decisions)

| # | Decision | Why |
|---|---|---|
| M1 | **Owner decision, 24 Nov 2026.** The header menu opens as a full screen pane, after the owner's BitcoinOS pick ("Full-screen menu with art panel"): a large art panel with cut corners on the left, numbered heavy caps links with arrows under bracket labels, small utility links. It replaces the Apple Sports popover and the Peacock overlay (the Games rail of GS3 and GS6 moves into it as the right column; on the phone the Games list sits inline in the sheet instead of a second sheet). | Owner: "rather than it opening as a drop-down, I would prefer if it opens as a pane." |
| M2 | **Owner decision, 24 Nov 2026.** Hovering or focusing a game swaps the art to that game's official cover art; a main link shows its own picture (the GTA VI wallpapers already in the hero media for Home, Finds, Explainers and GTAverse, our own coast line drawing for Map). Crossfade, no flash; pictures load when the menu first opens. | Owner: "some images of GTA or Red Dead, but such that when you hover on these, the image here changes." |
| M3 | **Owner exception to OS7, 24 Nov 2026 (as GS2).** The cover art comes only from Rockstar's own pages: the cover each `rockstargames.com/games/<game>` page shows, which is the same file as that game's tile on `rockstargames.com/games` (GTA VI, V, Red Dead Redemption 2, Red Dead Redemption and Bully, whose own pages are separate sites, use that tile). An agent may view the files only to size and crop them. They are fetched at deploy by `scripts/media/fetch-logos.mjs` (one implementation with the logos), checked against the sha256 in `content/games.json`, never committed, and credited "Art: Rockstar Games" under the panel. | Same narrow rule as the logos; reproducible and checkable. |
| M4 | **Owner decision, 24 Nov 2026.** Motion keeps the existing language: the surface grows out of the island (`--dur-morph`, `--ease-out`), the art fades and settles, then the links rise one after another with shrinking gaps; closing is faster on the exit curve (`--dur-morph-out`, `--ease-standard`) and nothing slides on the way out. Reduced motion: fades only. Keyboard opens and closes do not animate. Focus stays in the header, Escape closes, focus returns to the menu button. The current link keeps the solid icon (IC7). | Owner's motion rules (24 Nov 2026) and the design system. |

## 2026-11-24: slice decisions (full screen menu, open to owner review)

| # | Decision | Why |
|---|---|---|
| M5 | Desktop (1280 and wider) is three columns inside the 128 px gutter: art (with its caption and the theme button under it), the guide (search, five heavy caps links, the latest three finds, utility links and the chapter setting), and Games. Below 1280 it is one scrolling sheet (three columns do not fit the heavy caps and game names at 1024): the art becomes a 112 to 168 px banner that stays at the top and follows the last focused or touched item, then search, links, Games, latest finds, utility links. | The reference's two zones plus the content the owner asked for; a 15 game list needs its own column at 900 px tall. |
| M6 | The art panel keeps a 0.76 shape (the covers are 0.81), so cover titles stay whole; the caption and credit sit under the art, never on it. GTA VI's official tile is a wide banner, so the panel shows a recorded crop of its centre (the logo panel). | Covers carry their own titles; text over them read as clutter. |
| M7 | The latest three finds skip story spoilers and mature finds, as every preview does (`feed.ts`). | Spoiler rule. |
| M8 | The phone no longer opens a second sheet for Games: the list is part of the scrolling menu, rows 52 high with 120 x 36 plates. The sheet drag code is removed. `vf:open-games` opens the menu and focuses the current game. | One surface, fully reachable by keyboard and screen reader, no nested modal. |

## 2026-11-24: slice decisions (design system cleanup, open to owner review)

The owner asked for every inconsistency the `/design` page surfaced to be fixed ("fix them all").

| # | Decision | Why |
|---|---|---|
| DC1 | New token `--accent-ink`: `#F976B0` in dark (unchanged look), `#9F4E77` in light, which is GTA pink `#F976B0` shaded 38% toward night navy `#0D0C1A` (5.05:1 on the ground, 4.57:1 on `--surface-3`). It draws every pink mark that shows a state on the ground: the focus ring, the current marker in the contents and policy rails, the active tab underline, the timeline's selected marker, the explainer's key-fact stroke and the targeted source chip. `--accent` stays the brand pink for fills behind a navy label (primary button, count pill, selection); pink text keeps `--accent-text`. Pins on the map keep `--accent`: they sit on the map art, not on the theme ground. | Pink on the light ground is 2.35:1, under the 3:1 a state mark needs. No text used `--accent`. A shade of the brand pink keeps the hue; no new colour. |
| DC2 | `--text-3` in dark goes from white 50% to 52%: 4.69:1 on `--surface-3` (was 4.46:1), 5.68:1 on the ground. | The smallest step that clears AA on every surface it sits on. |
| DC3 | The "New" badge reads two tokens, `--badge-new-fill` and `--badge-new-text`: white and navy in dark (unchanged), `#2F2F2F` and white in light (the light theme's inverse pill). | A white badge on a white card in light was invisible. |
| DC4 | A clip's spoiler or mature gate goes compact in a frame 420 px wide or less (8 px gaps, 16 px padding, the text at the caption step), and while the gate is up the frame grows to hold it when it is still taller than the clip's ratio. Revealing removes the gate and the frame is the plain ratio box again. The chapter select inside a gate never grows past it. | Compact alone cannot fit at every width (a 254 px frame is 143 px tall); growing is the only way nothing clips at any width. |
| DC5 | Menu Games rows: a name too long for the column wraps to a second, balanced line (rows grow from 32 to 36 px for those names only) instead of truncating. | At 1280 the Red Dead names needed 58 px more than the column has; a smaller type step or a wider column could not close that without moving the art and guide columns. |
| DC6 | Exit timings inside the owner's 60 to 75% rule: `--dur-popover-out` 140 to 130 ms (72%), `--dur-peek-out` 200 to 180 ms (69%), now read by the map drawer's and phone card's exits (both already ran 180 ms), `--dur-page-out` 160 to 180 ms (64%). `--dur-drawer-in/out` (420/300) were read by nothing and are removed: the drawer runs on the peek pair. | The rule is decision M1; a token that nothing reads documents a timing that does not exist. |
| DC7 | `map.css` is scoped by a zero-specificity prefix, `:where(.vf-map)`, on every rule (the class sits on `.map-app` and on the `/design` specimens' root), not by renaming classes or CSS modules. | Same look by construction: no class name changes in five React files and Leaflet markup, and `:where()` keeps every selector's specificity. |
| DC8 | Removed 31 tokens that nothing reads (checked with grep across `src`, `scripts`, `content` and `tools`): the 27 the design page listed, `--dur-drawer-in/out` (DC6) and `--dur-overlay-in/out`. The icon sheet's stand-in map drew its roads with `--map-road` and `--map-road-major`, now `--border-1` and `--border-2` (the same values in both themes). | A clean base before the round-2 home and map build. |
| DC9 | The Timeline takes `headingLevel` (1 by default, the page's h1 on `/gtaverse` pages; 2 in the `/design` frame), and its script reads its curves from the motion tokens. `GameChips` renders through the shared `Chip` (new `lead` slot for the plate). The Astro Button gained `stack`, the React Button `outline` and `iconEnd`. | One implementation per component; no values copied out of `tokens.css`. |

## 2026-11-24: logo chosen and implemented (owner decisions)

| # | Decision | Why |
|---|---|---|
| LG5 | **The logo is Chime's direction 1, Case File**: a folder with "VF" cut in it, beside THE VICE FILES in Big Shoulders caps. Elvis loved the logo panel and the mark-size sheet and liked the full board (24 Nov 2026), and asked for it to be implemented now from Chime's exported SVGs; Chime may polish it later. It ships as code (`src/brand/logo.ts`, `src/components/ui/Logo.astro`, IC3) in the header island, the Open Graph cards, the favicons and `/design`. Colours are the tokens `--accent` and `--on-accent`, never blush (LG4 stands). | Owner pick. Closest direction to the site (same font and palette) and readable as a favicon at 16 px. |
| LG6 | **Favicon files are committed**: `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png` (180) and `public/icon-512.png`, drawn by `pnpm brand:icons` from the logo code, with `public/site.webmanifest`. The four images are allow-listed in the CI asset guard by exact path, never a pattern; everything else stays blocked. | Owner decision, 24 Nov 2026: favicons must ship as files, and a script keeps them reproducible. |

## 2026-11-24: slice decisions (logo implementation, open to owner review)

| # | Decision | Why |
|---|---|---|
| LG7 | The header island uses the one-line lockup from the signature on Chime's board (folder 1.12 times the cap height, 0.78 cap heights to the wordmark), with the VF mark in place of the board's plain folder, an 18 px folder and 16 px caps. The two-line panel lockup is too tall for a 48 px island. | Keeps the island's size and spacing (D8) with Chime's own proportions. |
| LG8 | On the site the mark wears the mark-sheet colourway in both themes: pink folder, navy VF, wordmark in the text colour. The logo panel's navy folder with a pink VF is the `on-pink` tone, for pink grounds only. | A navy folder disappears on the navy island; the mark sheet shows pink and navy on both grounds. |
| LG9 | At 32 px and under (folder height) the mark uses Chime's small drawing from the mark sheet, whose VF is a little wider; above, the logo panel's drawing. The 16 px favicon is the 32 px drawing scaled (Chime's 16 px frame sits the VF about a quarter pixel further left, which reads as Figma's pixel snapping). | Follows the sheet without a third drawing. |
| LG10 | The touch and manifest icons are the mark at 56 % of a navy square with square corners (iOS and Android round them), after Chime's app icon panel. The Organization JSON-LD names `/icon-512.png` as the logo, and the SEO check now requires the icon links and that each file is built. | One source for every icon; search engines get a logo. |

## 2026-11-24: Stage C release check (open to owner review)

| # | Decision | Why |
|---|---|---|
| RC1 | `prd/wrangler.jsonc` is removed. The owner deleted the `vicefiles-prd` Worker on 24 Nov 2026; the PRD page (`prd/public/index.html`) stays and is served by the main site at `/prd` (`src/pages/prd.html.ts`), noindex through `public/_headers`. This closes the open part of SF10. `prd/public/_headers` belonged to the deleted Worker and was removed on the owner's go on 24 Nov 2026. | Dead deploy config invites a deploy that recreates the old Worker. |
| RC2 | CI also runs `pnpm test`. | The unit tests (nearby finds, line art, icons, logo) were only run by hand. |
| RC3 | Releases from `staging` to `main` are merge commits; everything else stays squash-only. On 25 Nov 2026, on the owner's go: repository merge commits allowed; ruleset 27944180 renamed "Protect staging" (staging only, squash only); ruleset 27945451 renamed "Protect main: releases from staging only" (update, deletion, force push blocked, pull request with code owner review, merge method `merge` only, CI "Validate and build"); `main` reset once to `staging` (a819974), dropping the squash release commit c83804d (PR #66, same content). | A squash release leaves `main` with a commit `staging` lacks, so every later release conflicts (simulated: a README edit conflicted). A merge commit keeps `staging`'s history inside `main`, so the next release merges cleanly (simulated twice). |

## 2026-11-25: X and Reddit clip media (open to owner review)

| # | Decision | Why |
|---|---|---|
| CM1 | X and Reddit clips show the post's own still like a YouTube clip (extends D3): the video poster or first photo, hotlinked from `pbs.twimg.com` or `preview.redd.it`, never downloaded or re-hosted. `pnpm clips:resolve` (`scripts/clips/resolve-media.mjs`, run by `pnpm run deploy` before the build) reads every clip in `content/finds.json` and writes `content/generated/clip-media.json` (`"x:<id>"` or `"reddit:<id>"` to kind, thumb, width, height); X from the public `api.fxtwitter.com`, Reddit from its `.json` (403 for scripts) and then the official embed page. A failed lookup keeps the previous entry; a clip with no entry keeps the "Watch on" link box. Every surface reads stills through `findStill` (`src/lib/media.ts`), which calls `clipStill` (`src/lib/clip.ts`). | The owner reported clips "not loading": the six X and Reddit finds showed only a link, while their platforms serve a still the way YouTube does. |
| CM2 | Playback stays click to load. X video posts load `platform.twitter.com/embed/Tweet.html` (`dnt=true`, the page's theme; no `widgets.js`), Reddit video posts load the `embed.reddit.com` URL that Reddit's own `widgets.js` builds; the clip frame then grows to the height the post reports. X and Reddit photo posts show the photo linked to the post; Reddit text posts keep the link box. The home Spotlight and Watch the clips stay YouTube only: they play inside a fixed 16:9 frame that a post card does not fit. A still that fails to load hides (Base.astro marks it `data-failed`) and its frame shows the glow. The actions say what a tap does (`clipLabels` in `src/lib/clip.ts`): "Play clip" and "Watch the clip" for videos, "View photo" and "View the photo" for photo posts, "Read the post" for text posts, on the find hero, its bar, the home hero, the timeline and the map drawer. | Decision 8 (official embeds only) and the existing click-to-load rule; no broken-image icons. |

## 2026-11-25: search reads questions (open to owner review)

| # | Decision | Why |
|---|---|---|
| SR1 | The one site search (header menu box and map search, `src/components/map/search.ts`) reads plain questions: question words are dropped, money amounts read as "money", plurals and topic groups match, matching is at the start of a word, and words that match nothing are left out and named under the list. Type matches rank above text mentions; money questions rank by the biggest dollar amount. Placeholders now say "Search or ask". | Chime, 25 Nov 2026: visitors should be able to ask "Where can I get 200k?" or "Where is the NPC you cannot snipe?" and see the finds. Every word of a question had to match before, so a question found nothing. |
| SR2 | It is not an AI chat. It runs in the browser on our own content, with our own word lists (`content/search-terms.json`, new `topics` groups), so it costs nothing, works on the static site and cannot invent an answer. A chat backed by a language model is a separate owner decision (cost, an API key, server code, and the "no AI on Rockstar content" rule). | Chime picked this first, 25 Nov 2026. Trust is the product; a search that only shows our sourced finds keeps it. |

