# The Vice Files

An unofficial, non-commercial fan field guide to Grand Theft Auto VI and the wider Rockstar universe.

Site: https://thevicefiles.com

- **Map:** every secret, Easter egg, rare vehicle, unique weapon, memorial and real-world reference in Leonida, with an embedded clip and credit to the fan who found it.
- **Explainers:** how the wanted level, the protagonists, NPCs, the relationship system and the regions actually work, with every claim sourced.
- **The GTAverse:** how GTA VI connects to GTA I to V, Vice City, San Andreas, Red Dead Redemption, Bully, L.A. Noire, Max Payne and Manhunt.

Every fact has a source, every finder gets credit, rumours are labelled, and spoilers are hidden by default.

## Run it locally

You need Node 22.23.4 or later and pnpm 10 (`corepack enable` picks up the version pinned in `package.json`). The map download also needs the `unzip` command.

```sh
pnpm install      # install dependencies
pnpm map:fetch    # optional: download Rockstar's official Leonida map into .cache/map/ and verify it
pnpm map:tiles    # optional: cut it into tiles in public/map/
pnpm logos:fetch  # official game logos and the menu's cover art into public/media/ (git-ignored); run before every deploy build
pnpm clips:resolve # the stills of X and Reddit clips (image URLs only) into content/generated/clip-media.json; commit it
pnpm dev          # local dev server
pnpm build        # validate the content, then build the static site into dist/
```

Other commands:

| Command | What it does |
|---|---|
| `pnpm validate` | Checks every content file against its schema, cross-references, rumour gating, citations and the no em dash rule |
| `pnpm test` | Unit tests (`scripts/test/`) |
| `pnpm seo:check` | After a build: checks every page's canonical, Open Graph and JSON-LD data, the sitemap and the index switch |
| `pnpm preview` | Serves the built site from `dist/` |
| `pnpm map:grid` | Re-measures the printed map grid and compares it with `content/map.json` |
| `pnpm map:harness`, `pnpm map:shots` | Local map harness and its screenshots (see [docs/MAP.md](docs/MAP.md)) |

The map steps are optional. Without them the site still builds, but the map screen has no base map. The map and its tiles are Rockstar's and are never committed: `.cache/` and `public/map/` are git-ignored. Fonts are fetched from Google Fonts at build time, so the build needs network access.

## How the content works

The site is an [Astro](https://astro.build) static site with no server code. All content is plain JSON and Markdown in the repository, so a pull request is the review queue.

| Path | What |
|---|---|
| `content/finds.json` | Every find on the map: location, verification level, sources, finder credit, clip, spoiler and mature flags |
| `content/connections.json` | GTAverse connections between GTA VI and other Rockstar games |
| `content/regions.json`, `content/categories.json` | Regions of Leonida, find categories and map layers |
| `content/sources.json` | Every creator, outlet, wiki and account cited |
| `content/map.json` | The official map's size, grid, tile settings and labels |
| `content/explainers/*.md` | Explainer pages, with a citation on every claim |
| `schema/` | JSON Schemas for every content type (the content format may change before 1.0) |
| `scripts/validate.mjs` | The validator that `pnpm validate` and `pnpm build` run |
| `scripts/map/` | The local map pipeline: download, verify, tile, measure |
| `scripts/one-off/` | The one-time migration from `research/` to `content/`, kept as an audit record; do not re-run |
| `src/` | The site: pages, components, design tokens |
| `research/` | The original launch-week research, kept as history |
| `prd/` | The product requirements page, built into the site at `/prd` (`src/pages/prd.html.ts`) |
| `tools/map-harness/` | A local-only harness for checking the map and pins |

Project docs:

| Doc | What |
|---|---|
| [PROJECT.md](PROJECT.md) | What this is, who it is for, limits and current stage |
| [docs/NOW.md](docs/NOW.md) | Current status and open questions |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Dated decision log |
| [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) | How to add a find or fix content |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Design tokens and components |
| [docs/MAP.md](docs/MAP.md) | The map pipeline, coordinates and pins |
| [docs/LOGO.md](docs/LOGO.md) | The logo (Case File, by Chime): where it lives in code, its rules, the favicons, and the seven directions it was chosen from |
| [docs/LEGAL.md](docs/LEGAL.md) | Legal position, footer disclaimer and takedown process |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md). Branch from `staging` and open pull requests into `staging`. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](SECURITY.md).

## Licences

The repository has two licences, plus material it does not license at all:

| What | Licence |
|---|---|
| Code: `src/`, `scripts/`, `tools/`, `schema/`, `prd/` code and the root configuration files | [MIT](LICENSE) |
| Original content: `content/` (data and explainers), `research/`, the prose in `docs/` and the other prose files | [CC BY-NC 4.0](LICENSE-CONTENT) |
| `CODE_OF_CONDUCT.md` | Adapted from the Contributor Covenant 3.0 (CC BY-SA 4.0) |
| Game names, images, logos, the Leonida map, trademarks and other Rockstar Games and Take-Two material | **Not licensed by this repository.** They belong to their owners. |

Copyright (c) 2026 The Vice Files contributors. Content may be reused for non-commercial purposes with credit; see [LICENSE-CONTENT](LICENSE-CONTENT). Facts (where something is, a keypad code) are not owned by anyone. Contributions are accepted under the same licences.

## Disclaimer

The Vice Files is an unofficial fan site. It is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA, Grand Theft Auto VI, Red Dead Redemption, Bully, L.A. Noire, Max Payne, Manhunt and related marks are trademarks of Take-Two Interactive Software, Inc. Game images, artwork and the Leonida map are (c) Rockstar Games and are used for non-commercial fan commentary and reference. Videos are embedded from their original platforms and remain the property of their rights holders.

Copyright concerns and credit corrections: takedown@thevicefiles.com, answered within 48 hours.
