# The Vice Files

An unofficial, non-commercial fan field guide to Grand Theft Auto VI and the wider Rockstar universe. Domain: thevicefiles.com, with rockstarworld.elvisobi.com as a second address for now (in progress, not live yet).

- **Map:** every secret, Easter egg, rare vehicle, unique weapon, memorial and real-world reference in Leonida, with an embedded clip and credit to the fan who found it.
- **Explainers:** how the wanted level, the protagonists, NPCs, the relationship system and the regions actually work, with every claim sourced.
- **Lore:** how GTA VI connects to GTA I to V, Vice City, San Andreas, Red Dead Redemption, Bully, L.A. Noire, Max Payne and Manhunt.

## Repository

| Path | What |
|---|---|
| [PROJECT.md](PROJECT.md) | What this is, who it is for, limits and current stage |
| [docs/NOW.md](docs/NOW.md) | Current status and open questions |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Dated decision log |
| [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) | How to add a find or fix content |
| [docs/LEGAL.md](docs/LEGAL.md) | Legal position, footer disclaimer, takedown process |
| `content/` | The content base: finds, connections, regions, categories, sources, explainers |
| `schema/` | JSON Schemas for every content type |
| `scripts/validate.mjs` | Validation for all content |
| `research/` | The original launch-week research (read-only history) |

## Validate the content

```sh
pnpm install
pnpm validate
```

## Contributing

Read [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) first. Every fact needs a source, every finder gets credit, clips are embedded and never re-hosted, and nothing from leaks or piracy is ever added.

## Disclaimer

The Vice Files is an unofficial fan site. It is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA, Grand Theft Auto VI and related marks are trademarks of Take-Two Interactive Software, Inc. Game images, artwork and the Leonida map are (c) Rockstar Games and are used for non-commercial fan commentary and reference. Copyright concerns and credit corrections: takedown@thevicefiles.com.
