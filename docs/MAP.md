# Map

How the official Leonida map becomes our base map, how positions on it are written down, and how Chime places or corrects a pin. Chime (ChimeXXD) owns pins (decision 19).

## The source file

| | |
|---|---|
| File | "The Great State of Leonida", Rockstar's "Leonida Map & Cover Art Poster" printable download |
| Page | https://www.rockstargames.com/VI/downloads |
| Zip | `Leonida_Map_Poster_Printable.zip`, 45,419,826 bytes, one entry |
| Image | `Leonida_Map_Poster_Printable.jpg`, **5,775 x 7,900 px**, 300 dpi, JPEG, **CMYK** (GRACoL2013_CRPC6 profile) |
| Measured | 2026-11-23. Sizes and SHA-256 hashes are pinned in `content/map.json` under `source`. |

Legal rules (docs/LEGAL.md):
- The zip, the image, the tiles and any screenshot of them are Rockstar's copyright. They are **never committed**: `.cache/`, `public/map/` and `tools/map-harness/screenshots/` are git-ignored. The tiles reach the site only through the build.
- Wherever the map shows, show the credit from `content/map.json` `source.attribution`: "Map © Rockstar Games."
- **Never feed the map, its tiles or screenshots of it into AI tools** (CONTENT-GUIDE rule 5, Rockstar ToS 2.3). Labels and pins are read by a person.
- Keep the pipeline swappable: a takedown is met by switching `public/map/` to an original illustrated map with the same pixel space.

## Pipeline

```
pnpm install
pnpm map:fetch     # download the zip to .cache/map/, verify size, type and SHA-256, extract the JPEG
pnpm map:tiles     # build public/map/tiles/, public/map/meta.json and public/map/preview.jpg
pnpm map:grid      # optional: re-measure the printed grid and compare with content/map.json
pnpm map:harness   # optional: local harness at http://127.0.0.1:4317/tools/map-harness/index.html
pnpm map:shots     # optional: headless screenshots of the harness plus its self-check
```

Both main steps are idempotent. `map:fetch` reuses a verified cache and **fails** if Rockstar's file has changed (size, hash or pixel size), because every pin depends on the pixel space; see "If Rockstar updates the map".

`map:tiles` output, 2026-11-23:

| Zoom | Image size | Tiles |
|---|---|---|
| 0 | 180 x 247 | 1 |
| 1 | 361 x 494 | 4 |
| 2 | 722 x 988 | 12 |
| 3 | 1,444 x 1,975 | 48 |
| 4 | 2,888 x 3,950 | 192 |
| 5 (full resolution) | 5,775 x 7,900 | 713 |

970 tiles, 5.66 MiB in total, largest tile 22.9 KiB. Cloudflare static assets allow 20,000 files per deployment and 25 MiB per file, so the full resolution fits with room to spare. The tiler caps max zoom automatically if a future source would break the file limit.

Tile details: 256 px WebP (quality 82), CMYK converted to sRGB through the embedded profile, path `tiles/{z}/{x}/{y}.webp`. Edge tiles are padded to 256 px with transparent pixels. `meta.json` holds width, height, tile size, max zoom, tile URL template, per-zoom counts, the source and the attribution.

## Coordinate system

Every position (pins, labels, grid) is a **pixel of the original image**: origin top-left, x to the right, y downward, integers, `0 <= x < 5775` and `0 <= y < 7900`.

In Leaflet use `L.CRS.Simple` with `maxNativeZoom: 5` (`meta.maxZoom`). Zoom 5 is full resolution, so:

```js
const toLatLng = (x, y) => map.unproject([x, y], meta.maxZoom);
const toPixel = (latlng) => map.project(latlng, meta.maxZoom); // round x and y
```

Proof it holds: tile pixels at zoom 5 match the source image at the same position (mean difference 0.15 to 2.98 grey levels, which is WebP noise) and differ more when shifted by 2 px; the harness checks that every loaded tile sits exactly where its pixels say (0 px offset at every zoom tested).

### The printed grid

Measured by `scripts/map/measure-grid.mjs`, which reads pixels only (no viewing, no OCR):

- The map frame runs from (187, 186) to (5582, 7706). The white margin outside it holds the grid labels.
- **Letters A to M label the 13 rows** (down both sides, top to bottom). **Numbers 1 to 9 label the 9 columns** (across top and bottom, left to right). 13 ink groups sit on each side and 9 on the top and bottom; glyph widths confirm the order (the ninth letter is a 6 px stroke, an I; the first number is the lightest, a 1).
- Interior cells are 600 px square. Row A is 461 px tall and row M 459 px, cut by the frame; column 9 is 595 px wide.
- We write a cell as row letter then column number, for example `F5`. Exact bounds are in `content/map.json` under `grid`.

Note: the pre-download report said "an A to M, 1 to 9 grid" without saying which axis; letters are rows, not columns.

### Labels

`content/map.json` `labels` records each place name printed on the map: `{ id, label, x, y, kind, region_id }`, with x and y at the centre of the printed text, `label` exactly as printed, and `region_id` set only when the label names a region in `content/regions.json`. Never rename an existing region id to match a label: note the mismatch and raise it.

**Status: empty.** Reading labels means looking at the map, and the map must not go into AI tools, so a person records them. To record one: open the harness, click the centre of the printed name, copy the x and y from "Picked", add the entry, run `pnpm validate`.

## Pins

Fields on each find in `content/finds.json`:

| Field | Meaning |
|---|---|
| `pin` | `{ "x": int, "y": int }` in the pixel space above, or `null` until placed. |
| `pin_accuracy` | `exact`: placed at the spot itself, from a clip or first-hand. `landmark`: on a specific labelled place on the map. `area`: the centre of a district or region. `null` when `pin` is null. |
| `pin_basis` | What the position came from: the clip URL and timestamp (`exact`), or the map label id or location text used (`landmark`, `area`). `null` when `pin` is null. |

The validator enforces: pin, accuracy and basis are all set or all null; the pin lies inside the image (error) and inside the map frame (warning otherwise).

**Status: 0 of 85 finds pinned.** First-pass landmark and area pins need the labels above, which are not recorded yet.

### How Chime places or corrects a pin

1. Find the spot from the find's clip or in game. Never take a find's position from Game Checklists, MapGenie, GTABase, State of Leonida or any other map; use them only to cross-check (decision 13). The collectible layers below are the one exception (decision C1), and they never feed finds.
2. Run `pnpm map:fetch`, `pnpm map:tiles` and `pnpm map:harness`, open the harness and zoom in.
3. Click the spot. "Picked" shows `"pin": { "x": ..., "y": ... }` and the grid cell.
4. In `content/finds.json` set `pin`, `pin_accuracy` and `pin_basis`, and set `updated_at` to today.
   - From a clip or in game at the exact spot: `exact`, basis is the clip URL and timestamp (for example `https://www.youtube.com/watch?v=... at 2:14`).
   - On a printed place name: `landmark`, basis is the label id (for example `label:key-lento`).
   - On a district or region: `area`, basis names it (for example `area: Grassrivers`).
5. Correcting: replace the numbers, raise accuracy if you can (area to landmark to exact), update the basis and `updated_at`, and say what changed in the pull request.
6. Run `pnpm validate`, then open a pull request into `staging`.

Pins can be checked in the harness: click a red pin to see its title, accuracy and basis.

## Collectible layers

`content/collectibles.json` (schema `schema/collectibles.schema.json`) holds 892 collectible locations in 12 layers, transcribed on 2026-11-24 from the 12 Game Checklists maps reposted by @Sksj002, under the owner's exception (decision C1). Every item credits Game Checklists and links the post its map came from.

| Layer | On the map | Marked on their map | Their total | Numbers hard to read | Unreadable |
|---|---|---|---|---|---|
| Collectible card sets | 102 | 102 | 480 | 0 | 0 |
| Cocaine flamingos | 8 | 8 | 22 | 0 | 0 |
| Drone time trials | 42 | 42 | 42 | 0 | 0 |
| Fish and fishing spots | 35 | 35 | 41 | 0 | 0 |
| Kitty litter labs | 12 | 12 | 13 | 0 | 0 |
| Magazines, books and comics | 25 | 25 | 36 | 0 | 0 |
| Meditation spots | 10 | 10 | 10 | 0 | 0 |
| Meteorites | 11 | 11 | 11 | 0 | 0 |
| Payday loan jobs | 7 | 7 | 7 | 0 | 0 |
| Shops and stores | 234 | 234 | 261 | 91 | 5 |
| Stunts | 397 | 397 | 397 | 20 | 0 |
| Tattoo studios | 9 | 9 | 11 | 0 | 0 |

How they were made (scripts and the number readings are in `scripts/one-off/collectibles/`, the images are never committed):

1. **Images.** The 12 maps came from the post's media at the largest size X serves (1,080 px wide, about 1,490 tall). No higher resolution or original post was found.
2. **Registration, code only.** `register.py` matches SIFT features between each map and a 2,310 px wide sRGB copy of the official image (made with `sharp`, never viewed) and fits a RANSAC similarity transform. Every map came out at a scale of 4.979 official px per source px with no rotation; reprojection error 1.5 to 2.5 px, 3,400 to 6,300 inliers per map. `gridcheck.py` carries our measured grid lines into each map and finds their printed grid within about 2 px on average.
3. **Pins, code plus reading.** `detect.py` finds the purple pin discs by colour and shape (centre of the disc's convex hull; pieces cut apart by digits are merged; discs that touch without a gap are split). The counts match their stated "marked" totals on all 12 maps. Numbers were read by eye from enlarged crops; `check.py` lists duplicates and gaps against the totals, and the closer crops that settled them are recorded in `compile.py`.
4. **Fans.** Their renderer never overlaps pins: close locations are fanned out around a small hub dot with legs. `hubs.py` finds hubs (dropping purple spots that recur at the same official place on other maps, which are part of the base map) and traces legs; fanned pins are placed at the hub. Three fans were settled by hand (noted in `compile.py`).
5. **Export.** `export.py` writes the file with each item's note: a hard to read number, a fanned pin and how far it moved, or a touching pin that may be nudged.

Accuracy: about 5 to 10 px from the transform and the disc centre, plus up to one pin width (about 60 to 135 px, per layer in `pin_radius_px`) where their map nudged a pin, plus the hub spacing inside the big fans in Vice City and Vice Beach. Treat these as "this is the spot their map shows", not a measured position. The validator checks: every layer is a `map-layer` category, counts match the items and `categories.json`, numbers are unique per layer and within the total, pins lie inside the image, and every item has a credit.

To rerun: put the 12 images as `m01.jpg` to `m12.jpg` in an empty folder outside the repo, make a Python venv with `opencv-python-headless` and `numpy`, and run the scripts in the order above from a work folder (`python -I register.py <images> <official copies> reg.json`, then `detect.py`, `detect_v1.py` (only to map the first readings), `hubs.py`, `gridcheck.py`, `compile.py`, `export.py`).

## If Rockstar updates the map

`pnpm map:fetch` stops with a hash or size mismatch. Then: download the new file into the cache by hand, run `pnpm map:grid`, and compare. If the pixel size and grid are unchanged, update the hashes in `content/map.json` and rebuild. If they changed, every label and pin needs a transform (the grid gives matching points) before the new tiles ship.

## The map screen

`/map` is a React island (`src/components/map/`, documented in `docs/DESIGN-SYSTEM.md`). It reads `public/map/tiles/` at `/map/tiles/{z}/{x}/{y}.webp` with Leaflet 1.9.4 (`L.CRS.Simple`, `maxNativeZoom` 5) and `content/map.json` for the frame and the grid. A deployment without built tiles still works: the map shows its ground colour and every find opens from the list. A pin appears as soon as a find has `pin` set, with no other change.

## Files

| File | Role |
|---|---|
| `content/map.json` | Coordinate system: image, source, tiles, grid, labels. Schema `schema/map.schema.json`. |
| `content/collectibles.json` | Collectible layers transcribed from Game Checklists (decision C1). Schema `schema/collectibles.schema.json`. Served to the map as `/collectibles.json` (`src/pages/collectibles.json.ts`). |
| `scripts/one-off/collectibles/` | How the collectible layers were transcribed: registration, pin detection, fans, readings, export. |
| `scripts/map/fetch-map.mjs` | Download, verify, extract. |
| `scripts/map/build-tiles.mjs` | Tiles, meta.json, preview. |
| `scripts/map/measure-grid.mjs` | Re-measures the printed grid. |
| `tools/map-harness/` | Unstyled Leaflet harness, its local server and the screenshot script. Verification only, not the product. |
