# Legal position

Short summary of [research/legal-fan-site.md](../research/legal-fan-site.md) (researched 2026-11-23). That file has the quotes, sources and reasoning. This is research, not legal advice: before any monetisation, or if a demand letter arrives, talk to a US-qualified IP lawyer.

## Where we stand

- **No licence exists.** Rockstar and Take-Two publish no fan kit, brand licence or press-asset terms for fans.
- **A written tolerance does exist, and it names fan sites.** Rockstar's "Policy on posting copyrighted Rockstar Games material" says: "Generally, Take-Two Interactive does not object to our fans using materials for non-commercial uses in a manner which does not intentionally spoil the plot for others." It is revocable at any time.
- **Non-commercial is the condition.** Ads or paid tiers move the site outside that tolerance. We run neither.
- **Trademarks are the line.** The GTA VI logo, the Rockstar logo, and anything that suggests the site is official carry the most risk. Rockstar's own Mod Guidelines forbid suggesting endorsement or affiliation.
- **The GTAArtDeco font is proprietary.** Never extract or self-host it.
- **Rockstar owns every capture.** Player screenshots and clips belong to Rockstar under its terms; crediting creators is courtesy, not a licence. That is why we embed, never re-host.
- **No AI processing of Rockstar content.** Rockstar's terms explicitly prohibit using its content with generative AI tools. The project applies this to analysis too: no AI reading of Rockstar images, including sampling colours from official art (decision OS7).
  - One narrow owner exception (decision GS2, 24 Nov 2026): an agent may download official game logos from Rockstar or Take-Two pages and view them only to size and fit them in the game switcher. No edits, recolouring, tracing or AI processing of the logos, ever.
  - A second narrow owner exception (decision M3, 24 Nov 2026): an agent may download each game's official cover art from Rockstar's own pages and view it only to size and crop it for the header menu's art panel. No edits, recolouring, tracing or AI processing beyond that.

## What we use and how

| Asset | Our rule |
|---|---|
| Official Leonida map, key art, screenshots | Allowed inside content with a credit line. Keep the map pipeline swappable for an original fallback map. |
| Official trailer loop and key art (home hero) | Cut and scaled from Rockstar's official downloads, credited on screen ("Trailer: Rockstar Games", "Art: Rockstar Games"). Fetched and checked against recorded hashes at deploy (`pnpm media:fetch`, `pnpm media:build`), never committed: `public/media/` and `.cache/` are git-ignored and the CI asset guard blocks them ([HERO.md](HERO.md), decisions HS1 to HS3). |
| Game Checklists collectible maps | Positions transcribed into `content/collectibles.json` under the owner's exception (decision C1). Their pins are their work: every collectible card and the map credit name "Game Checklists" and link to the post the maps came from (decision C7). Their images are never committed or shown. |
| Rockstar Games logo | Never. |
| Official cover art (one per game in the switcher) | Only in the header menu's art panel, scaled and cropped, never otherwise altered, credited "Art: Rockstar Games" under the panel. Files come only from Rockstar's own game pages, are fetched at deploy by `scripts/media/fetch-logos.mjs`, checked against the sha256 in `content/games.json`, and never committed (decisions M2, M3). |
| Official game logos (GTA VI and the other games) | Only to identify a game: in the game switcher, on game hubs and in "Also in" chips, unaltered, at a fixed small size, next to the game's name in text, with the visible line "Game logos are trademarks of Rockstar Games and Take-Two Interactive". Never as our branding (wordmark, favicon, social cards, hero). Files come only from official Rockstar or Take-Two pages, are never committed, and are fetched at build (`pnpm logos:fetch`, decisions GS1 and GS2). A takedown of a logo means removing its record's `logo` (the game falls back to a text plate). |
| GTAArtDeco font | Never. Display type is an original lookalike with a proper licence. |
| HUD and blip icons | Original icons, never copied files. |
| YouTube, X, TikTok, Reddit clips | Official embeds only. Do not crop out creator names or platform chrome. Honour disabled embedding. |
| Spoiler clips, isolated cutscenes, isolated in-game TV | Never embedded. Spoiler finds are hidden by default. |
| Leaks, pre-release material, archive maps | Never, in any form. |
| Money glitches and exploits | Never featured. |
| "Grand Theft Auto VI" and "Rockstar Games" in plain text | Fine to describe what the site covers. |

## Footer disclaimer (every page)

> The Vice Files is an unofficial fan site. It is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA, Grand Theft Auto VI, Red Dead Redemption, Bully, L.A. Noire, Max Payne, Manhunt and related marks are trademarks of Take-Two Interactive Software, Inc. Game images, artwork and the Leonida map are (c) Rockstar Games and are used for non-commercial fan commentary and reference. Videos are embedded from their original platforms and remain the property of their rights holders. Copyright concerns and credit corrections: takedown@thevicefiles.com.

On the site, "(c)" is rendered as the copyright symbol.

Game logos shipped (decision GS1), so the site footer's marks sentence now names them: "Grand Theft Auto, GTA and related names, images, materials and their logos are trademarks and copyrights of their respective owners" (24 Nov 2026). The switcher, hubs and chips keep their own trademark line.

Site: thevicefiles.com. Contact: takedown@thevicefiles.com (forwarding being set up).

Also required:
- On each discovery card: "Found by [creator] · [platform link]" and "Image (c) Rockstar Games" where an official image is used.
- On story-related pages: "Story spoilers below. Hidden by default."

## Takedown response process

1. **Publish a contact route** for copyright and trademark concerns: a dedicated page with takedown@thevicefiles.com. Respond within 48 hours.
2. **On any notice from Take-Two, Rockstar or their agents:** remove or disable the named item at once, without arguing first. Log it privately: date, sender, item, URL, action taken.
3. **Do not file counter-notices against Take-Two** unless a lawyer advises it. A counter-notice invites a lawsuit in the US.
4. **Check for a pattern.** If a notice targets a whole category (for example the official map tiles), switch that category to the original fallback site-wide.
5. **Creator requests** (remove my clip, change my credit): honour within 48 hours, no questions.
6. **Name or impersonation complaints:** keep the brand name in one config so a rename is quick.
7. **Cloudflare notices:** answer through Cloudflare's process. Keep the site on its own Cloudflare project, ideally its own zone, so action cannot touch the owner's other sites.
8. **Hygiene:** no-leaks rule for contributors; a source on every pin; never accept submissions built from leak material.

The repository has a "Takedown request" issue template for creators. Rights holders may prefer private contact: takedown@thevicefiles.com is the primary route.
