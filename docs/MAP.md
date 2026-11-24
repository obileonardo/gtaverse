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

That table is the 256 px build of 23 Nov. Since 24 Nov tiles are 512 px (see "Sharpness"): 258 tiles, 8.16 MiB, largest 109.9 KiB (z0 1, z1 1, z2 4, z3 12, z4 48, z5 192). Cloudflare static assets allow 20,000 files per deployment and 25 MiB per file, so the full resolution fits with room to spare. The tiler caps max zoom automatically if a future source would break the file limit.

Tile details: 512 px WebP (quality 90, effort 6, smart chroma subsampling), CMYK converted to sRGB through the embedded profile, every level resized from the full image with Lanczos3, path `tiles/{z}/{x}/{y}.webp`. Zoom numbers stay on the 256 px reference, so zoom 5 is still full resolution and the pixel space is unchanged. Edge tiles are padded with transparent pixels. `meta.json` holds width, height, tile size, max zoom, tile URL template, per-zoom counts, the source and the attribution. **After pulling this change, run `pnpm map:tiles` again before a deploy**: the front end now asks for 512 px tiles.

### Sharpness

Why the map looked soft and pixelated (owner, 24 Nov), measured, not guessed:

1. **No retina tiles.** Leaflet drew each 256 px tile at 256 CSS px, so on a 2x screen every map pixel was stretched over 2 x 2 device pixels at every zoom.
2. **Zoom past full resolution.** Max zoom was 6, one level past the full-resolution tiles, so the deepest zoom stretched each map pixel over 4 x 4 device pixels.
3. **Compression.** Quality 82 with plain 4:2:0 chroma softened thin coloured lines and small type.

The fix:

- 512 px tiles. On a 1x screen a tile shows at 512 CSS px; at 1.5x and above it shows at 256 CSS px from one level deeper (`zoomOffset` 1, `maxNativeZoom` 4), so every device pixel gets a map pixel. One pyramid serves both, with a quarter of the requests 256 px tiles would need (`sharpTiles()` in `MapCanvas.tsx`).
- Zoom stops half a level past native detail: 4.5 on a 2x screen, 5.5 on 1x. At the cap a map pixel covers 1.41 device pixels, which bilinear scaling keeps soft rather than blocky; `image-rendering` stays `auto` because nearest-neighbour would show blocks. Pin groups split from half a level under the cap.
- WebP quality 90 with smart chroma subsampling. On 14 sample tiles (8 at zoom 5, 4 at zoom 4, 2 at zoom 3), compared with the uncompressed tile: chroma PSNR 37.7 to 39.6 dB, luma 42.7 to 43.1 dB, 32.7 to 47.1 KiB a tile. Quality 95 and 98 gained under 1.7 dB luma for 30 to 60% more bytes; near-lossless was 4.7x bigger. Numbers only: nobody looked at the tiles.
- No AI upscaling of any kind, ever (CONTENT-GUIDE rule 5). The source has 5,775 x 7,900 real pixels; we show them one to one.

Map pixels per device pixel on a 2x screen, measured in headless Chrome at 1440 x 900 with the + button (tile URL zoom and drawn tile size read from the page):

| Map zoom | Before | After |
|---|---|---|
| 1.5 (about the fitted view) | 0.71 | 1.41 |
| 2, 3, 4 | 0.5 | 1.0 |
| 4.5 | 0.35 | 0.71 (the cap) |
| 5 | 0.5 | not reachable |
| 6 (old cap) | 0.25 | not reachable |

On 1x screens the old setup was already 1.0 up to zoom 5 and 0.5 at 6; now it is 1.0 up to 5 and 0.71 at the cap, 5.5.

## Coordinate system

Every position (pins, labels, grid) is a **pixel of the original image**: origin top-left, x to the right, y downward, integers, `0 <= x < 5775` and `0 <= y < 7900`.

In Leaflet use `L.CRS.Simple`; zoom 5 (`meta.maxZoom`) is full resolution, so:

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

`/map` is a React island (`src/components/map/`, documented in `docs/DESIGN-SYSTEM.md`). Round 2 (owner decision Q4 A, 24 Nov 2026; spec in the round-2 taste board's `analysis/direction-map-r2.md`): the map fills the screen and everything floats over it. Desktop: Felt's Legend | List panel on the left, headed by Jeff christy C12's HUD (region title, the type filter summary, the Found checklist), whose Legend rows are the type filters; the find detail as Jeff christy C08's frosted panel on the right; C12's hint row along the bottom (filters, 2D | 3D, layers, zoom level, scale in grid cells, credit, Fit and zoom). Phone: Corner's round corner buttons, a pills row (Found, 2D | 3D, Fit) and an edge-to-edge category rail over the bar; a tapped pin brings Hypelist's card carousel (swiping pans the map); Tide Guide's glass menus and hint toast. Pins are the round-2 blips (`docs/ICONS.md`), anchored at the pointer's tip, with label tags that wrap instead of clipping, a glow ring on the selected find, connection lines to related pinned finds, and clusters drawn as stacked plates with a count. Spoilers open by themselves once the visitor's chapter setting reaches them (`src/lib/chapter.ts`); mature content never does. It reads `public/map/tiles/` at `/map/tiles/{z}/{x}/{y}.webp` with Leaflet 1.9.4 (`L.CRS.Simple`, 512 px tiles, see "Sharpness") and `content/map.json` for the frame and the grid. A deployment without built tiles still works: the map shows its ground colour and every find opens from the list. A pin appears as soon as a find has `pin` set, with no other change. The 3D view is in `docs/MAP-3D.md`.

### Links

These round-trip, so a view can be shared and survives a reload (`src/components/map/url.ts`): `?q=` (search), `?category=a,b` (type chips), `?region=` (region filter), `?view=3d` (the 3D view; 2D is left out), `?find=` (the open find), `?layer=a,b` (collectible layers that are on, so a page can link straight to a layer). Defaults are left out of the URL and unknown values are ignored. A link with `q`, `category` or `region` shows exactly that view from the default filters (spoilers and mature stay hidden); without them, the filters saved on the device apply.

### Search

`src/components/map/search.ts`. Every word must match somewhere in a find: title, type, region, summary, location text, area, the finder's handle, the clip creator, the source creators, or one of our own words for its type or region in `content/search-terms.json` (schema `schema/search-terms.schema.json`; we wrote every word, nothing is copied from another site). Filler words ("where", "the", "gta") are dropped, a leading @ is ignored, accents and case do not matter. Results order: title matches, then matches in the find's own text, then synonym-only matches. Examples measured on the build: "where is the ufo" lists the Port Gellhorn UFO first; "@ProfessorMikeX" and "seepa" list that finder's finds; "everglades" lists Grassrivers finds; a query with no match shows the empty state with "Reset filters".

### Found tracker

`src/components/map/found.ts`. "Found" in the drawer (check icon) and in the phone sheet marks a find as found on this device (`localStorage` key `vf-found`); the filter menu's Found group has "Hide found", found counts per type and an export code (`VF1.` plus base64url of the slugs) to paste into another browser. No accounts, nothing leaves the device. With storage blocked the list lasts for the visit and nothing errors. Unknown slugs in an imported code are ignored.

## Files

| File | Role |
|---|---|
| `content/map.json` | Coordinate system: image, source, tiles, grid, labels. Schema `schema/map.schema.json`. |
| `content/collectibles.json` | Collectible layers transcribed from Game Checklists (decision C1). Schema `schema/collectibles.schema.json`. Served to the map as `/collectibles.json` (`src/pages/collectibles.json.ts`). |
| `scripts/one-off/collectibles/` | How the collectible layers were transcribed: registration, pin detection, fans, readings, export. |
| `scripts/map/fetch-map.mjs` | Download, verify, extract. |
| `scripts/map/build-tiles.mjs` | Tiles, meta.json, preview. |
| `scripts/map/measure-grid.mjs` | Re-measures the printed grid. |
| `content/search-terms.json` | Our own search words per type and region. |
| `content/relief.json` | Our hand-drawn relief for the 3D view (`docs/MAP-3D.md`). |
| `tools/map-harness/` | Unstyled Leaflet harness, its local server and the screenshot script. Verification only, not the product. |

## Performance (round 2)

Collectible pins (up to 892 with every layer on) are drawn on one canvas (`src/components/map/blipCanvas.ts`), not one DOM marker each. It works like Leaflet's canvas renderer: the canvas covers the view plus a 15% margin, redraws at the animation frame after a move or zoom ends, and follows a zoom while it animates with one CSS transform, so the pins stay on screen and travel with the map. Sprites are the same blip SVG as everywhere else, rasterised once per layer and state at the device pixel ratio. Clicks and hovers are hit-tested against a 32 px grid index built with each draw (a 30 px target, 44 on touch). The canvas is `aria-hidden`; the list and the detail panel are the accessible path, and a picked collectible opens the same card. Find pins stay DOM buttons (focusable, with tags); their clusters are computed once per zoom level and cached, and on zoom end, one frame after the canvas redraw, only the pins and clusters whose grouping or state changed are rebuilt (see "Long frames at 4x CPU" below).

Measured 24 Nov 2026 on the built site (`astro preview`), headless Chrome for Testing 1252 on an Apple M4, 1440 x 900 at 2x, flat placeholder tiles, a temporary fixture of 70 pinned finds and all 12 layers on. Frame interval in ms, median / 95th percentile / longest:

| Action | Before (892 DOM markers), 1x | After, 1x | Before, 4x | After, 4x |
|---|---|---|---|---|
| Pan (four 0.6 s pans) | 16.7 / 16.7 / 16.8 | 16.7 / 16.8 / 16.8 | 16.7 / 33.4 / 66.7 | 16.7 / 16.8 / 33.4 |
| Zoom flight (two levels in and back) | 100 / 149.9 / 200 | 16.7 / 16.8 / 16.8 | 100 / 166.7 / 283.3 | 16.7 / 16.8 / 50.1 |
| Zoom buttons (three in, three out) | not measured | 16.7 / 16.7 / 16.8 | not measured | 16.7 / 33.4 / 100.1 |
| Filter (six Legend toggles) | 16.7 / 16.8 / 33.4 | 16.7 / 16.8 / 16.8 | 16.7 / 50 / 83.3 | 16.7 / 16.7 / 66.7 |
| Open a find (three, each flies to its pin) | 66.6 / 183.3 / 233.4 | 16.7 / 16.8 / 50 | 150.1 / 399.9 / 399.9 | 16.7 / 33.4 / 83.4 |
| 3D (four zoom steps) | 16.7 / 16.7 / 16.8 | 16.7 / 16.8 / 33.3 | 16.7 / 16.8 / 100 | 16.7 / 16.8 / 116.7 |

The longest frames left at 4x are not the collectibles: with no layer on at all, the same runs at 4x peak at 83 (zoom flight), 67 (zoom buttons) and 133 ms (open a find), from new tiles arriving and the detail panel mounting. CPU throttling does not model a weaker GPU: measure on a real mid laptop and phone before launch.

### Long frames at 4x CPU (issue #57)

Profiled 24 Nov 2026 with Chrome DevTools Protocol performance traces (main-thread tasks, JS samples and the stack of every forced style or layout pass), same setup as above. The tiles and the detail panel were not the cause. What was, at 4x:

| Where | Cause in the trace | Fix |
|---|---|---|
| Every zoom end that regrouped pins, every selection (`MapCanvas.tsx`, `draw`) | All 70 find markers cleared and rebuilt: their SVG parsed again through `innerHTML` (`createIcon` 13 to 16 ms, ParseHTML 8 ms), then a style pass over all of them (10 ms) | Markers are kept by a key made from what they show and only moved; only pins and clusters that changed are rebuilt |
| Same frame (`placeTags`) | `clientWidth` read right after the rebuild forced a synchronous style and layout pass (11 + 4.5 ms) | The size comes from Leaflet (`getSize()`), reads come before writes, unchanged data attributes are not rewritten |
| Cluster splits and merges | `element.animate()` once per marker: 18 ms of script for one regroup | CSS animations (`.pin--split`, `.cluster--merge`, same keyframes, duration and easing), started by a class in the markup |
| Clusters | Each carried its hidden member list (six more SVGs), parsed on every regroup | The list is filled on the first hover or focus, before the popover shows |
| End of every zoom (`blipCanvas.ts`) | `getComputedStyle` and setting `ctx.font` on every redraw forced a style pass (5 to 8.5 ms) | Tag colours read once per theme; the font is set only when the context does not hold it; the redraw runs at the next animation frame, so a flight's last frame does not carry it; the find pins follow a frame later |
| Opening a find (`ui.tsx`, `Tabs`) | The underline measured `offsetLeft` in a layout effect as the panel mounted: a synchronous style and layout pass of the new panel (12 + 25 ms) | On mount the ResizeObserver's first callback places it, after the browser's own layout and before paint |
| Opening a find (`types.ts`, `formatDate`) | `toLocaleDateString` built a new formatter each call; loading its locale data took 32 ms on the first open | One `Intl.DateTimeFormat`, made while the browser is idle (`requestIdleCallback`) |
| Opening a find (`MapApp.tsx`, `motion.tsx`) | `usePresence` stored the value from an effect, so the whole screen rendered twice in the click; all 68 list rows re-rendered on every selection and pin hover | The kept value is a ref; rows are memoised with stable handlers; "In view" keeps its set when the same finds are in view |
| Opening a find (`MapApp.tsx`, `openFind`) | The flight's first steps (new tile levels, 15 to 20 ms) and `focus()` (a forced style pass of the new panel) ran in the frame the panel mounted in | Focus moves and the flight starts one frame later |

Not causes, from the same traces: image decoding (all 96 tile decodes in a zoom-button run ran on raster worker threads, none on the main thread, so `decoding="async"` would change nothing) and the frosted panel's backdrop filter (layerising is 4 to 8 ms a frame at 4x, from about 250 composited layers: Leaflet's tiles and markers).

Before and after, three rounds of each run alternating between the two builds (the machine was shared, load average 40 to 210, so single runs swing by a frame or two). Frame interval in ms, median of the rounds' medians / median of their 95th percentiles / longest frame in any round (frames over 50 ms, summed over the rounds):

| Action | Before, 1x | After, 1x | Before, 4x | After, 4x |
|---|---|---|---|---|
| Zoom buttons (three in, three out) | 16.7 / 16.8 / 33.4 (0) | 16.7 / 16.8 / 33.3 (0) | 16.7 / 16.8 / 116.7 (8) | 16.7 / 16.8 / 33.4 (0) |
| Open a find (three, each flies to its pin) | 16.7 / 16.8 / 200 (3) | 16.7 / 16.8 / 33.3 (0) | 16.7 / 33.3 / 116.7 (18) | 16.7 / 16.8 / 50.1 (2) |
| Pan (four 0.6 s pans) | 16.7 / 16.7 / 16.8 (0) | 16.7 / 16.7 / 16.8 (0) | 16.7 / 16.8 / 50 (0) | 16.7 / 16.8 / 50 (0) |
| Zoom flight (two levels in and back) | 16.7 / 16.8 / 99.9 (1) | 16.7 / 16.7 / 16.8 (0) | 16.7 / 16.8 / 83.3 (4) | 16.7 / 16.8 / 66.7 (1) |

What is left at 4x: opening a find is the panel's own render and its first style and layout pass (about 20 ms each at 4x), three frames at most; a zoom flight's end is Leaflet's tile and marker update. Fewer composited layers (the 96 grid ticks are Leaflet markers) would be the next step, but drawing them in SVG or on the canvas would make them scale during a zoom, so they stay.
