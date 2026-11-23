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
