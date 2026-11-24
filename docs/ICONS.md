# Icons

The Vice Files has one icon family: original glyphs in GTA VI's map blip and HUD language, drawn with the owner's Capsa glyph method. Every glyph has a **Solid** drawing (the default) and a **Line** drawing (the setting); the 36 map blip glyphs also have a **blip** (the glyph on its plate) and most have a **pin** (the plate on a pointer, for the map). Nothing is traced or copied from Rockstar files, the paid third-party pack or leaked assets, and no Rockstar or GitHub mark is redrawn.

- Source of truth: `scripts/icons/gta.py` (round 2: the blip layer and the plate system), `scripts/icons/build.py` (the other drawings, the catalogue and the output) and `scripts/icons/capsa.py` (the Capsa method, vendored).
- Output: `src/icons/family.ts`, generated. Never edit it by hand. Rebuild with `python3 scripts/icons/build.py` (standard library only).
- Renderer: `src/icons/render.ts`: `iconSvg()` (a glyph), `blipSvg()` (a blip or pin, with a state), `glyphMarkup()`, `resolveGlyph()`.
- Review page: `/design/icons` (noindex, not in the sitemap): blips on a stand-in map, blip states, every plate and pin, the IC7 menu rule, then every glyph in both sets at 16, 20, 24 and 32 px on both themes.
- Checks: the build fails on a glyph outside the live area, a missing Solid or Line drawing, a glyph drawn twice, a blip with no glyph, an old name with no glyph, a category with no glyph, or an em or en dash. `pnpm test` (scripts/test/icons.test.ts) checks the generated file against `src/components/ui/icons.ts` and `content/categories.json`, and that every category has a blip and a pin.

## GTA VI style spec

Round 1 drew good single glyphs, but they read as a generic UI set, not as GTA. Round 2 studied how GTA VI draws its HUD, minimap and map blips and redrew the blip layer in that language. The study used, by owner exception (24 Nov 2026), only official Rockstar media and the creator gameplay clips our finds already cite, watched through YouTube's embed player; frames were looked at for style only, kept outside the repo and deleted after. The official screenshot pack and the Launch Trailer show no HUD at all (every image is cinematic), so the numbers below come from gameplay frames (pause map, minimap, wanted meter, HUD status) in about 30 cited clips.

What the game does (measured on 1080p frames):

| Element | What we saw |
|---|---|
| Minimap blip | A rounded square plate about 21 px wide (2 % of screen height), corner radius about a quarter of the side, a dark keyline about 1 to 1.5 px all round. The glyph is a flat, dark, solid silhouette about 60 % of the plate. Most plates are light grey; a few are tinted (a pale lavender plate for a harbour). |
| Pause map pin | The same plate standing on a short pointer centred under it (about a quarter of the plate wide, an eighth of it deep), so the point marks the spot. Plates are colour coded by kind: warm off-white for most services, pastel green for businesses, pastel gold for special places, pale lavender for stores, teal for the mission at hand. Some carry a tiny corner badge top right (a dollar sign on businesses). Minor points are tiny plain white squares with no glyph. |
| Legend rail | White solid glyphs about 28 px on a dark translucent rail. The current tab inverts to a white tile with a dark glyph. Small amber diamonds mark tabs with new items. |
| Player and waypoint | The player is a heading arrowhead with a notched back, light, with a dark keyline; on the pause map a dashed reticle rings it. The waypoint is a teardrop in a strong colour with a dark centre dot. |
| Wanted meter | A row of crisp five-point stars top right. Lit stars are light with a thin dark keyline; unlit stars are dark and translucent, the same shape. |
| HUD status | Round plates about 24 px in a strong red with thin white line glyphs, under the stars. |
| Glyph drawing | Flat, no gradients, no inner outlines. Generic, chunky objects seen from their most telling side (a car head on, a pistol in profile, a basket, a fuel pump, a shirt, a money bag). Detail is one to three bold cuts, never fine lines. Corners slightly rounded; points (stars, arrowheads) stay crisp. Letters stand in for brands and characters. |

The five rules we took from it (the spec in five lines):
1. A blip is a chunky dark silhouette on a light rounded-square plate with a dark keyline; live states use a round plate; stars and the player arrow have no plate, only the keyline.
2. On the map the plate stands on a pointer whose tip is the exact spot.
3. Plates are colour coded by layer, never by glyph colour: finds neutral, collectible layers coral, live states accent, verification by level.
4. Detail is one to three cuts, at least 2 units wide for a hole and 1.75 for a line, because the glyph is drawn at 0.62 scale inside its plate.
5. State changes the plate, not the glyph: selected turns the keyline accent, new and found add a corner badge, filtered out fades.

Everything is our own drawing. We share the language (plate, keyline, pointer, chunky silhouette, colour coded layers), not any icon: where the game uses a generic object (a car head on, a pistol) we drew our own on the 20 unit grid with Capsa's helpers, and where it uses its own marks (letters, brand logos, its tattoo and store glyphs) we used none of them.

### The plate system (20 unit grid)

```
 plate (lists, legends, HUD)          pin (the map)                 halo (stars, player, waypoint)

  .-------------------.              .-----------------.                    /\
 |  keyline 1.25       |            |  keyline 1.1      |                  /  \    glyph at 0.8 scale,
 |  .---------------.  |            |  .-------------.  |                 /    \   keyline 1.75 drawn
 |  | plate 17.5    |  |            |  | plate 15.5  |  |                /  /\  \  under the silhouette
 |  | radius 4.75   |  |            |  | radius 4.25 |  |               /__/  \__\
 |  |  glyph x0.62  |  |            |  | glyph x0.55 |  |
 |  '---------------'  |            |  '-----v-------'  |   pointer: 5 wide, 2.6 deep,
  '-------------------'              '-------v---------'    tip at the bottom centre = the spot
```

| Shape | Size | Keyline | Glyph | Used by |
|---|---|---|---|---|
| Square plate | 17.5, radius 4.75 | 1.25 | 0.62 | find categories, collectible layers (lists, legends, filters) |
| Round plate | 17.5 | 1.25 | 0.62 | wanted live states, verification |
| Pin | 15.5 plate, radius 4.25, pointer 5 by 2.6 | 1.1 | 0.55 | the same glyphs on the map; anchor at the bottom centre |
| Halo | no plate | 1.75 | 0.8 | `star`, `star-filled`, `star-flash`, `locate`, `pin` |

Blip sizes: 20 px is the smallest (filter chips), 24 in lists and legends, 32 for map pins, 40 for the selected pin. Below 20, use the plain glyph.

### Tones

Colours are existing design tokens only; nothing new is introduced. Each blip colours its plate, ink and keyline through `--blip-plate`, `--blip-ink`, `--blip-key`, which fall back to the tokens below, so a container can recolour every blip inside it. The plate is the inverse of the ground and the keyline is the ground itself, so in the light theme plates turn dark with a cream keyline and still stand off the map.

| Tone | Plate | Ink | Keyline | Glyphs |
|---|---|---|---|---|
| find | `--inverse-fill` | `--inverse-text` | `--bg` | the 12 find categories, single source |
| collectible | `--blip-collectible` (GTA coral `#F76685`) | `--blip-collectible-ink` | `--blip-collectible-key` | the 12 collectible layers |
| alert | `--accent` | `--on-accent` | `--bg` | heat, cops responding, suspect unknown |
| verified | `--badge-verify-fill` | `--badge-verify-text` | `--bg` | multi-source |
| muted | `--surface-3` | `--text-1` | `--bg` | rumour, debunked |
| star | `--inverse-fill` | `--inverse-fill` | `--bg` | the wanted stars |
| player, waypoint | none | `--inverse-fill`, `--accent` | `--bg` | locate, pin |

Collectible-layer plates are GTA coral `#F76685` from the GTA VI sunset ramp (owner decision IC9, 24 Nov 2026), a named token in `src/styles/tokens.css` for both themes. Its glyph and keyline are navy `#0D0C1A` in both themes: the glyph is 6.6:1 on coral (AA), and the keyline stays navy instead of following the ground because coral on the cream light map is only 2.7:1; the navy edge is what separates the plate there. The hue never changes per theme.

### States

`blipSvg(name, { form, state })`, state one of: `default`; `selected` (keyline `--accent`; render it at 40 px); `new` (amber diamond badge top right, the game's new-item mark); `found` (the blip fades to 55 % and wears a mint check badge); `dim` (filtered out, 40 %). States only change variables and add a badge; the glyph never changes.

## Rules

**Grid.** 20 units, live area 2 to 18. Line centres sit within 2.75 and 17.25. Coordinates on a 0.25 grid where possible, every curve a cubic bezier. The viewBox is `0 0 20 20`. Blip glyphs may use the full 1.75 to 18.25 because they are always scaled into a plate.

**Sizes.** Glyphs at 16, 20 and 24 px (the Icon component's `s`, `m` and `l`); blips at 20, 24, 32 and 40.

| Size | Solid bar (1.75) | Line (1.5) | Use |
|---|---|---|---|
| 16 | 1.4 px | 1.2 px | badges, chips, list rows |
| 20 | 1.75 px | 1.5 px | buttons, menus, the drawer |
| 24 | 2.1 px | 1.8 px | map controls, the header, empty states |

**Two layers.**
- *Map blips* (find categories, collectible layers, wanted and heat, verification): the GTA blip language above. Solid silhouettes, one to three cuts, holes at least 2 wide and cut lines at least 1.75.
- *UI controls* (menu, search, filter, zoom, share, arrows): the calm layer. Universal marks keep Capsa's own drawings so the site's controls match the owner's other products; bars 1.75, cuts at least 1.25. `locate` (the player arrow) and `pin` (the waypoint) are drawn in the blip language because they are blips in the game too.

**Stroke.** Line set: one 1.5 line, round caps and joins. Solid set: marks are blunt bars (Capsa's `pl()`), never round-capped strokes; a bar that must bend is the same bar stroked with butt caps and mitred joins.

**Corners.** Rounded by cubics (`rpoly`): 0.4 to 1.25 on objects, up to 2.5 on soft bodies. Stars, arrowheads and the pointer stay crisp (0.35 or less).

**Solid or Line.**
- Solid is the default everywhere (owner standard: "Solid glyphs by default, line glyphs as a setting").
- Menu: items at rest show the Line drawing and the current item switches to the Solid drawing (owner decision IC7, 24 Nov 2026: "Switch to the solid icon"), with `--text-1` and its pill.
- Toggle pairs keep their state in both sets: the hollow `star` is open and `star-filled` stays filled even in Line. `chapter` and the dots of `list`, `rss` and `dot` stay filled too.

**Colour hierarchy.** Plain glyphs take `currentColor`, so they follow the type beside them: `--text-1` for the current item, actions and icons that carry meaning on their own; `--text-2` for supporting icons; `--accent` only on the one main action of a view. Blips carry their own tones (above) and are never recoloured by the text around them.

**Meaning.** Each glyph is a thing or a state a fan recognises, not a decoration: a vigil candle for a memorial, a sheet ghost for paranormal, a bug for a glitch, the patrol car's beacon for cops responding, a balaclava for suspect unknown, the flash-sheet heart and banner for a tattoo studio.

## What is drawn (97 glyphs, 194 drawings, 36 blips, 31 pins)

| Group | Glyphs |
|---|---|
| Map blips (find categories) | `easter-egg`, `weapon`, `vehicle`, `collectible`, `npc`, `memorial`, `real-world-reference`, `rockstar-crossover`, `paranormal`, `glitch`, `secret-location`, `activity` |
| Collectible layers | `card-sets`, `cocaine-flamingo`, `drone-time-trial`, `fishing`, `kitty-litter-lab`, `magazine`, `meditation`, `meteorite`, `payday-loan-job`, `shop`, `stunt`, `tattoo-studio` |
| Wanted and heat | `star` (hollow), `star-filled`, `star-flash`, `heat`, `cops-responding`, `suspect-unknown` |
| Verification | `multi-source`, `single-source`, `rumour`, `debunked` |
| Navigation and controls | `menu`, `close`, `search`, `filter`, `layers`, `map`, `list`, `grid`, `2d`, `3d`, `tilt`, `rotate`, `zoom-in`, `zoom-out`, `plus`, `minus`, `locate`, `pin`, `share`, `link`, `copy`, `check`, `theme-light`, `theme-dark`, `arrow-up/down/left/right`, `chevron-up/down/left/right`, `arrow-up-right`, `external-link`, `info`, `alert`, `eye`, `spoiler`, `chapter`, `found`, `hide-found`, `download`, `github`, `rss`, `dot`, `hand` |
| Media | `play`, `pause`, `sound-on`, `sound-off`, `clip`, `image`, `wire`, `article`, `chat` |
| Site | `home`, `finds`, `explainers`, `gtaverse`, `games`, `finders`, `about`, `takedown` |

Round 2 redrew from scratch the 36 blip glyphs, both sets (the 34 of the blip layer plus `locate` and `pin`), and added the plate, pin, halo, tone, badge and state system. The other 61 glyphs were checked against the spec and kept: the controls are the calm layer by design, and the media and site glyphs already follow the solid, chunky rules.

Fixes asked for in round 2:
- `cocaine-flamingo`: redrawn as the lawn flamingo in profile (plump body with a tail point, S neck, small head with the hooked beak, one straight leg and one folded), so it reads as a flamingo at 16 px.
- `weapon`: a pistol in profile that reads at 16 px: long slide with a front sight and hammer, a raked grip, a trigger guard with a real hole.
- `single-source`: its own glyph (one ring, one dot), the way the site's single-source badge already says it, so it no longer reuses `check`.

Deliberate choices:
- `rockstar-crossover` is two linked rings (two worlds), never the Rockstar mark.
- `vehicle` is a car seen head on, the clearest car silhouette at blip size.
- `github` is an original source-code glyph (a branch). GitHub's guidelines do not allow its mark to be altered, so it is not redrawn.
- `rss` is the web feed symbol, which is free to use.
- `2d` and `3d` are lettered, as map apps label the view switch, and drawn as bars, not set in a font.

`categoryGlyphs` in `family.ts` maps every id in `content/categories.json` to its glyph.

## Rendering

Drawings without knock-outs are plain paths. Drawings with knock-outs use Capsa's compositing: an SVG mask whose id is the token `%ID%` in `family.ts`. `render.ts` replaces it with an id that is unique per instance, because a mask id shared by two icons breaks when the first one sits in a hidden element.

```ts
import { iconSvg, blipSvg, glyphMarkup } from '../icons/render';
iconSvg('easter-egg', { size: 16 });                          // a whole <svg>, aria-hidden
iconSvg('close', { size: 20, label: 'Close' });               // role="img" with a label when it is the whole control
blipSvg('easter-egg', { form: 'pin', size: 32 });             // a map pin; anchor it at its bottom centre
blipSvg('glitch', { form: 'pin', state: 'found', size: 32 }); // faded, with the found badge
glyphMarkup('pin', 'line', useId());                          // inner markup for a React <svg>, id sanitised
```

Blip colours are CSS variables, which canvas images (the 3D pin atlas) cannot read: there the fallback hex in each variable (the dark theme value) is used.

Old names still resolve: `resolveGlyph('egg')` returns `easter-egg`.

## Old names to new

Every name in `src/components/ui/icons.ts` resolves through `aliases` in `family.ts`. Names not listed kept their name: `menu`, `close`, `home`, `map`, `finds`, `explainers`, `pin`, `play`, `arrow-right`, `arrow-down`, `arrow-up-right`, `chevron-right`, `chevron-down`, `chevron-left`, `arrow-left`, `check`, `dot`, `filter`, `layers`, `plus`, `minus`, `share`, `link`, `search`, `grid`, `hand`, `clip`, `article`, `chat`, `info`, `alert`, `star`, `star-flash`, `image`, `wire`, `sound-off`.

| Old | New | Note |
|---|---|---|
| `lore` | `gtaverse` | the section's name |
| `sun` | `theme-light` | |
| `moon` | `theme-dark` | |
| `question` | `rumour` | every use was rumour or speculative |
| `cross` | `debunked` | every use was debunked |
| `egg` | `easter-egg` | |
| `person` | `npc` | |
| `keyhole` | `secret-location` | |
| `globe` | `real-world-reference` | |
| `car` | `vehicle` | |
| `candle` | `memorial` | |
| `crosshair` | `weapon` | now a pistol in profile, the blip idea |
| `gem` | `collectible` | |
| `flag` | `activity` | |
| `bolt` | `glitch` | now a bug |
| `ghost` | `paranormal` | |
| `film` | `clip` | one video glyph |
| `flame` | `heat` | |
| `radio` | `cops-responding` | now the patrol car's beacon |
| `sound` | `sound-on` | |
| `star` with `solid` | `star-filled` | `legacySolid` in `family.ts`: the old `solid` flag meant the filled wanted star, not the Solid set |

New glyphs with no old name: the 12 collectible layers, `rockstar-crossover`, `suspect-unknown`, the verification four, `list`, `2d`, `3d`, `tilt`, `rotate`, `zoom-in`, `zoom-out`, `locate`, `copy`, `pause`, `theme-*`, `arrow-up`, `chevron-up`, `external-link`, `eye`, `spoiler`, `chapter`, `found`, `hide-found`, `download`, `github`, `rss`, `games`, `finders`, `about`, `takedown`.

## Migration plan (after the Motion pull request merges)

Status (24 Nov 2026): step 2 and step 6 are done for the map. The map island draws every pin, cluster plate, legend row and rail item with the blips, from a generated subset (`src/icons/blips-map.ts`, written by `build.py` beside `family.ts`, rendered by `src/components/map/blip.tsx`), and the 3D view draws the same pins into its atlas. `pnpm test` checks the subset against the family. The other steps are still open. In order, one small pull request each:

1. **Swap the two renderers.** `ui/Icon.astro` and `Icon` in `map/ui.tsx` render through `render.ts`: `viewBox 0 0 20 20`, `fill="currentColor"`, no stroke attributes, `name` typed as `IconRef` so old names keep compiling. The `solid` prop maps through `legacySolid` (so `star` + `solid` draws `star-filled`) and is otherwise ignored; the `stroke` prop goes (weights are part of the drawing). React passes `useId()` as the mask id.
2. **Map pins become blips.** `svg()` in `map/MapCanvas.tsx` (Leaflet pins) calls `blipSvg(glyph, { form: 'pin', state })` with the icon anchor at the bottom centre; the selected pin passes `state: 'selected'` at 40 px, found finds `found`, filtered-out ones `dim`. `iconImage()` in `map/three/scene.ts` (the 3D pin atlas) uses the same pins. `src/lib/explainers.ts` (the wanted level table) uses `blipSvg('star-filled')` and the live state blips.
3. **Rename at the call sites.** `categoryIcons` in `src/lib/media.ts` becomes `categoryGlyphs` (adds the 12 layers), `Verification.astro` and `Timeline.astro` use `multi-source`, `single-source`, `rumour`, `debunked`, `nav.ts` uses `gtaverse`, the explainer level map uses `heat`, `cops-responding`, `suspect-unknown`, `star-filled`. Then drop the aliases that nothing uses.
4. **Set the default set and the menu rule.** Solid everywhere by default (owner standard). The menu shows Line at rest and Solid for the current item (IC7). A Line setting, if wanted, follows Capsa: both drawings in each icon, CSS picks one from `<html data-icons>`, set before first paint.
5. **Retire the old set.** Delete `src/components/ui/icons.ts` and the `--icon-cut` token (knock-outs are real transparency now), update the Icon section of `docs/DESIGN-SYSTEM.md`, and move `/design/icons` into the `/design` system when it exists.
6. **Watch the bundle.** `family.ts` now also carries the blip and pin markup. Astro pages only ship the markup they render, but the map's React island would bundle the whole family. Before step 2 lands there, emit a per-island subset (the build can write `family-map.ts` with only the glyphs and pins the map uses).

Check after each step: `pnpm build`, `pnpm test`, the design audit at 1440 and 390 in both themes, and screenshots of the menu, the map pins and the drawer against the current site.
