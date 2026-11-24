# The 3D map

`/map` has a 3D view: the official Leonida map draped over relief we drew ourselves, which you can tilt, turn, zoom and fly over. The "3D" button beside the filter and basemap buttons switches views; `/map?view=3d` opens it directly. The list, filters, search, found tracker, popup, drawer and sheet are the same in both views, and a pin sits at the same image pixel in both.

**Relief is approximate, drawn by The Vice Files.** The view says so at all times. No height comes from a leak, from GTADB's height map or any other fan terrain, or from a video. Rockstar has published no elevation data (private research, `community-3d-maps.md`).

## Files

| File | Role |
|---|---|
| `content/relief.json` | Our relief: peaks, ridges and hills as points or lines in image pixels. Schema `schema/relief.schema.json`, checked by `pnpm validate`. |
| `src/components/map/three/relief.ts` | Turns the relief into a height at any pixel. |
| `src/components/map/three/scene.ts` | The Three.js scene: terrain, tiles, light, water, pins, camera, input, frame loop. |
| `src/components/map/three/Map3D.tsx` | The React view. Same `MapApi` as the 2D `MapCanvas`. |
| `src/components/map/MapApp.tsx` | Loads `Map3D` with `React.lazy` only when 3D opens, so Three.js is its own chunk. |

Three.js is pinned at `0.187.0` (`package.json`, exact). The 3D chunk is 585 KB (145 KB gzip) and is never requested by the 2D map (checked: no request for it until the 3D button is pressed).

## Editing the relief

Each feature in `content/relief.json`:

| Field | Meaning |
|---|---|
| `points` | One point (a peak) or a line of points (a ridge or a row of hills), in image pixels as in `docs/MAP.md`. |
| `height_m` | Our guess of the height in metres. Not measured. |
| `radius_px` | How far the feature spreads from its points, in image pixels. |
| `roughness` | 0 to 1: how much fixed noise roughens the slopes. |
| `placed` | `approximate` until a person puts it on the printed name, then `checked`. |
| `basis` | Why it sits where it does. |

`metres_per_pixel` (2) and `vertical_exaggeration` (2) are display choices, not measurements: height in world units is `height_m * vertical_exaggeration / metres_per_pixel`.

To move a feature: run `pnpm map:harness`, click the spot, copy x and y into `points`, set `placed` to `checked`, run `pnpm validate`.

**How the first positions were chosen.** Rockstar's site puts Mount Kalaga National Park on Leonida's "northern fringes". Nobody looked at the map: a script counted land and water pixels per printed grid cell (numbers only) and the peak went on the northernmost land, around cells C5 and C6, with a ridge across C4 to C7 and low hills in D3 to D4 and D7. Every point was then checked to sit mostly on land by the same count. They are approximate until a person places them. Whether such a count is allowed under decision OS7 is an open question for the owner (DECISIONS M3D4).

## How it draws

- **World units.** x and z are image pixels (north is up the image, so -z); height is in image pixels too.
- **Terrain.** A quadtree over the 512 px tile pyramid, from zoom 3 (12 tiles) to zoom 5 (full resolution). Every chunk samples the same 32 px grid and the same height function, so chunks at different levels share edge vertices and never crack. A chunk splits when one of its texels would cover more than 1.25 device pixels; children replace their parent only when all four have loaded. At most 72 tile textures stay cached. Without built tiles every chunk shows the ground colour.
- **Sharpness when tilted.** Tiles use trilinear mipmaps and the GPU's maximum anisotropic filtering, which keeps the far half of a tilted map from going soft.
- **Light.** One light from the north-west, the cartographer's convention. Flat ground keeps exactly the map's own colour (shade 1.0); only slopes darken or brighten. No tone mapping, so the map's colours are not shifted.
- **Water depth.** Water is found by colour at render time: a saturated cyan to blue hue (the thresholds were checked against the colour count in M3D4; the rule itself is generic). It gets a deeper tint away from the shore, read from a blurred mipmap of the same tile, plus a sheen that changes with the view angle. Nothing animates, so frames are drawn only when something changes.
- **Distance haze.** Far ground fades toward the page colour, which reads as depth when tilted.
- **Pins.** Each find with a pin is a marker (a disc with its type icon on a short stem) whose stem foot is the exact pixel, at the terrain height there. All pins at rest are one instanced draw; hovered and selected pins are a second instanced draw on top at 1.15x. Each instance samples one atlas of pin images (type icon by state), sized in CSS px in the vertex shader. Picking maps the pointer to an instance index and its slug with a screen-space test (a 44 px target around the disc), because a raycaster cannot see quads sized in the shader. They stay visible over hills. Rest is pink, hover gets a ring, selected turns white with a pink ring, as in 2D. Nearby finds are not grouped in 3D.
- **Collectible layers.** When a layer is turned on (Legend or Basemap menu), its items show in 3D as the same small disc as the 2D `.cpin`, at the same pixels, all in one `Points` draw call (a GPU point sprite per item, the lightest instanced primitive); items that share a spot sit on a small ring, as in 2D. Tapping one opens the same card. Find pins win when both are under the pointer. Checklist numbers show in 2D only.
- **Theme and basemap.** Colours come from the tokens (`--bg`, `--map-land`, `--accent`, `--on-accent`, `--inverse-*`) and follow the header's theme toggle. "Muted" desaturates in the shader.

## Controls

| Input | Action |
|---|---|
| Drag | Move |
| Right-drag, or Shift, Ctrl or Cmd with drag | Turn and tilt |
| Scroll, pinch, + and - buttons | Zoom, toward the pointer |
| Two fingers | Turn and zoom |
| Tap or click a pin | The same popup (desktop) or card (phone) as 2D, then the drawer or sheet |
| Arrow keys | Move |
| Shift with arrow keys | Turn (left, right) and tilt (up, down) |
| + and - keys | Zoom |
| 0, or the compass button | Back to north at the opening tilt |

Tilt runs from straight down (0 degrees) to 62 degrees. 3D opens straight down on the same spot and scale as the 2D map, then tilts to 50 degrees and moves in a little over 700 ms (`--ease-in-out`). Going back to 2D turns north up and flattens in 320 ms (exits are faster), then hands the spot back to the 2D map. A drag has gentle momentum. Keyboard actions never animate. With `prefers-reduced-motion`, there is no tilt-in, no fly, no momentum: every change is immediate.

## What we learned about the in-game map

The brief allowed watching one or two full-map videos for behaviour only. **We could not watch video**: this agent has no video playback, and the YouTube watch pages returned no description, chapters or transcript text. From text sources only:

- GTA VI's settings list "3D Map Rotation" under Controller Settings, Inverted Controls (so the game has a 3D map that rotates with a stick, and players can invert it). Source: playday.one, "All in-game options in GTA 6", 18 Nov 2026.
- The View button can be set to "Map or Camera"; the PS5 touchpad opens the map directly.
- Previews describe the pause map as detailed satellite-style imagery rather than a street map.

No source gave tilt angles, speeds or transitions. Ours (0 to 62 degrees, opening at 50, 700 ms in, 320 ms out) are our own design choices, not copied or measured from the game. A person can watch the game's map and adjust `TILT_MAX`, `TILT_OPEN` and the durations in `scene.ts`.

## Performance

Measured 24 Nov 2026 on the built site (`astro preview`), headless Chrome for Testing 1252 on an Apple M4 (ANGLE Metal), 1440 x 900 at 2x, placeholder tiles, during about 8 seconds of dragging, turning, tilting and zooming. Worst case: all 12 collectible layers on (892 discs) plus 68 test pins.

| Measure | CPU normal | CPU throttled 4x (a mid laptop stand-in) |
|---|---|---|
| Frame interval, median and 95th percentile | 16.7 ms and 16.7 ms | 16.7 ms and 16.7 ms |
| Longest frame interval | 33.3 ms | 83.3 ms (tile loads) |
| CPU time per frame, median, 95th, max | 0.4, 0.8, 9.1 ms | 1.2, 4.1, 40.9 ms |
| Draw calls in total, of which markers | 49, 2 | 49, 2 |

Markers cost two draw calls whatever the count: one instanced draw for the pins at rest and one `Points` draw for every collectible disc (plus one each for a selected or hovered item). The rare long frames come from new tile textures being uploaded while zooming in, not from markers. CPU throttling does not model a weaker GPU: measure on a real mid laptop and phone before launch.

## Known limits

- Relief positions and heights are guesses until a person checks them against the printed names.
- The water test is a colour rule. Any land printed in a strong cyan would get the water sheen; the deep tint can show a faint step at tile edges because each tile's blurred mipmap only sees that tile.
- The printed grid overlay, pin groups and collectible numbers are 2D only.
- The 3D view needs WebGL 2; without it the view says so and the 2D map and list keep working.
