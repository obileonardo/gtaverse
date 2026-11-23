# Decisions

Dated log. Newest at the bottom. "Owner" decisions are settled and not reopened without the owner. "Slice" decisions were made while building and are open to owner review in the pull request that introduced them.

## 2026-11-23: owner decisions (recorded on this date)

| # | Decision | Why |
|---|---|---|
| 1 | The site is called **The Vice Files**. | A brand without "GTA" in it is easier to defend and does not read as an official product (research/legal-fan-site.md 3i). |
| 2 | Temporary domain **rockstarworld.elvisobi.com**, DNS on Cloudflare. Superseded as the main domain by decision 15. | A personal subdomain is not a UDRP target; it can move later. |
| 3 | The repository keeps the name **gtaverse** for now. | Renaming is cheap later; nothing depends on it yet. |
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
| 15 | **Domain: thevicefiles.com**, bought by the owner on Namecheap, DNS on Cloudflare (Free plan). rockstarworld.elvisobi.com stays as a second address for now. | A dedicated domain matches the brand and keeps the site in its own Cloudflare zone, apart from the owner's other sites. |
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
