# Icons

The Vice Files has one icon family: original glyphs in a GTA HUD and map blip spirit, drawn with the owner's Capsa glyph method. Every glyph has a **Solid** drawing (the default) and a **Line** drawing (the setting). Nothing is copied from Rockstar files, the paid third-party pack or leaked assets, and no Rockstar or GitHub mark is redrawn.

- Source of truth: `scripts/icons/build.py` (the drawings) and `scripts/icons/capsa.py` (the Capsa method, vendored).
- Output: `src/icons/family.ts`, generated. Never edit it by hand. Rebuild with `python3 scripts/icons/build.py` (standard library only).
- Renderer: `src/icons/render.ts` (`iconSvg()`, `glyphMarkup()`, `resolveGlyph()`).
- Review page: `/design/icons` (noindex, not in the sitemap): every glyph in both sets at 16, 20, 24 and 32 px, on both themes.
- Checks: the build fails on a glyph outside the live area, a missing Solid or Line drawing, an old name with no glyph, a category with no glyph, or an em or en dash. `pnpm test` (scripts/test/icons.test.ts) checks the generated file against `src/components/ui/icons.ts` and `content/categories.json`.

## Where the method comes from

The owner's rule: icons in every project use the Capsa icon style, drawn with Capsa's own generator and rules. `scripts/icons/capsa.py` holds Capsa's geometry and compositing helpers copied verbatim from `Capsa/design-references/brand/icons/src` (materials.py, heroes.py, ui_glyphs.py, glyph_sets.py, glyphs.py, as of 2 Nov 2026). Capsa is the owner's own project, so the method is reused as is. If Capsa's method changes, copy the functions again; never edit them to change a drawing.

46 glyphs reuse Capsa's own drawings unchanged: the universal controls (close, check, arrows, chevrons, share, copy, play, info and so on), so the site's controls match the owner's other products, and a few objects whose Capsa drawing already says the right thing (the globe, the person, the people, the flask, the standing books, the shield). The other 50 carry this site's own meaning (map blips, collectible layers, wanted states, verification, site sections) and are new drawings made with the same helpers and rules. `single-source` reuses `check`.

## Rules

**Grid.** 20 units, live area 2 to 18. Line centres sit within 2.75 and 17.25. Coordinates on a 0.25 grid where possible, every curve a cubic bezier. The brief asked for a 24 grid; Capsa's rules are defined on 20, and a 24 grid would only rescale every number by 1.2 with identical rendering, so the family stays on Capsa's grid. The viewBox is `0 0 20 20`.

**Sizes.** 16, 20 and 24 px (`--icon-s/m/l`). Every glyph is checked at all three on `/design/icons`. 32 px is shown for review only; above that, a glyph is not the right tool.

| Size | Solid bar (1.75) | Line (1.5) | Use |
|---|---|---|---|
| 16 | 1.4 px | 1.2 px | badges, chips, list rows, map pins |
| 20 | 1.75 px | 1.5 px | buttons, menus, the drawer |
| 24 | 2.1 px | 1.8 px | map controls, the header, empty states |

**Stroke.** Line set: one 1.5 line, round caps and joins. Solid set: marks are blunt 1.75 bars with 0.45 corners (Capsa's `pl()`), never round-capped strokes; a bar that must bend is the same bar stroked with butt caps and mitred joins.

**Corners.** Rounded by cubics (`rpoly`): 0.4 to 1 on small corners, up to 2.25 on frames. No sharp corner on an object; only a zigzag, a spark or a facet may stay crisp.

**Detail.** Detail inside a solid is a knock-out, never a second outline. Knock-outs at least 1.25 wide, bars and gaps at least 1.5. A glyph exaggerates what identifies it and drops what cannot survive 16 px; it never adds detail.

**Solid or Line.**
- Solid is the default everywhere (owner standard: "Solid glyphs by default, line glyphs as a setting").
- Line is a site setting, never a per-place choice. A page does not mix the two sets.
- Toggle pairs keep their state in both sets: the hollow `star` is open and `star-filled` stays filled even in Line. `chapter` (the bookmark) and the dots of `list`, `rss` and `dot` stay filled too.

**Colour hierarchy.** Icons take `currentColor`, so they follow the type beside them:
- `--text-1`: the current item, actions, and icons that carry meaning on their own (map blips, verification).
- `--text-2`: supporting icons (the pin beside a place name, a row's leading icon, a chevron).
- `--accent` (pink): only on the one main action of a view and the selected map pin. Never a second colour inside a glyph.
- On a pin or tile, the glyph uses the tile's ink (`--on-accent` on pink, `--inverse-text` on white).

**Meaning.** Each glyph is a thing or a state a fan recognises, not a decoration: a vigil candle for a memorial, a sheet ghost for paranormal, a bug for a glitch, the patrol car's beacon for cops responding, a masked figure for suspect unknown, the flash-sheet heart for a tattoo studio.

## What is drawn (97 glyphs, 194 drawings)

| Group | Glyphs |
|---|---|
| Map blips (find categories) | `easter-egg`, `weapon`, `vehicle`, `collectible`, `npc`, `memorial`, `real-world-reference`, `rockstar-crossover`, `paranormal`, `glitch`, `secret-location`, `activity` |
| Collectible layers | `card-sets`, `cocaine-flamingo`, `drone-time-trial`, `fishing`, `kitty-litter-lab`, `magazine`, `meditation`, `meteorite`, `payday-loan-job`, `shop`, `stunt`, `tattoo-studio` |
| Wanted and heat | `star` (hollow), `star-filled`, `star-flash`, `heat`, `cops-responding`, `suspect-unknown` |
| Verification | `multi-source`, `single-source` (reuses `check`), `rumour`, `debunked` |
| Navigation and controls | `menu`, `close`, `search`, `filter`, `layers`, `map`, `list`, `grid`, `2d`, `3d`, `tilt`, `rotate`, `zoom-in`, `zoom-out`, `plus`, `minus`, `locate`, `pin`, `share`, `link`, `copy`, `check`, `theme-light`, `theme-dark`, `arrow-up/down/left/right`, `chevron-up/down/left/right`, `arrow-up-right`, `external-link`, `info`, `alert`, `eye`, `spoiler`, `chapter`, `found`, `hide-found`, `download`, `github`, `rss`, `dot`, `hand` |
| Media | `play`, `pause`, `sound-on`, `sound-off`, `clip`, `image`, `wire`, `article`, `chat` |
| Site | `home`, `finds`, `explainers`, `gtaverse`, `games`, `finders`, `about`, `takedown` |

`categoryGlyphs` in `family.ts` maps every id in `content/categories.json` to its glyph.

Deliberate choices:
- `rockstar-crossover` is two overlapping worlds (ours solid, the other game's a ring), never the Rockstar mark. It replaces the wanted `star`, which no longer doubles as a category.
- `github` is an original source-code glyph (a branch). GitHub's guidelines do not allow its mark to be altered, so it is not redrawn; if the owner wants the Octocat, use GitHub's own file unaltered, beside the word GitHub.
- `rss` is the web feed symbol, which is free to use.
- `2d` and `3d` are lettered, as map apps label the view switch, and drawn as bars, not set in a font.
- `single-source` reuses `check` and `multi-source` is the double check, so the pair reads like sent and read receipts.

## Rendering

Drawings without knock-outs are plain paths. Drawings with knock-outs use Capsa's compositing: an SVG mask whose id is the token `%ID%` in `family.ts`. `render.ts` replaces it with an id that is unique per instance, because a mask id shared by two icons breaks when the first one sits in a hidden element.

```ts
import { iconSvg, glyphMarkup } from '../icons/render';
iconSvg('easter-egg', { size: 16 });                 // a whole <svg>, aria-hidden
iconSvg('close', { size: 20, label: 'Close' });      // role="img" with a label when it is the whole control
glyphMarkup('pin', 'line', useId());                 // inner markup for a React <svg>, id sanitised
```

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

Not done in this change: no component reads the family yet. In order, one small pull request each:

1. **Swap the two renderers.** `ui/Icon.astro` and `Icon` in `map/ui.tsx` render through `render.ts`: `viewBox 0 0 20 20`, `fill="currentColor"`, no stroke attributes, `name` typed as `IconRef` so old names keep compiling. The `solid` prop maps through `legacySolid` (so `star` + `solid` draws `star-filled`) and is otherwise ignored; the `stroke` prop goes (weights are part of the drawing). React passes `useId()` as the mask id.
2. **Swap the three string renderers.** `svg()` in `map/MapCanvas.tsx` (Leaflet pins), `src/lib/explainers.ts` (the wanted level table) and `iconImage()` in `map/three/scene.ts` (the 3D pin atlas) call `iconSvg()`. Each call gets its own id, so pins never share a mask.
3. **Rename at the call sites.** `categoryIcons` in `src/lib/media.ts` becomes `categoryGlyphs` (adds the 12 layers), `Verification.astro` and `Timeline.astro` use `multi-source`, `single-source`, `rumour`, `debunked`, `nav.ts` uses `gtaverse`, the explainer level map uses `heat`, `cops-responding`, `suspect-unknown`, `star-filled`. Then drop the aliases that nothing uses.
4. **Set the default set and the setting.** Solid everywhere by default (owner standard). Owner decision needed: today the menu shows line icons at rest and solid for the current item; under the Capsa rule the current item is shown by colour (`--text-1` against `--text-2`) and its pill, not by switching sets. A Line setting, if wanted, follows Capsa: both drawings in each icon, CSS picks one from `<html data-icons>`, set before first paint.
5. **Retire the old set.** Delete `src/components/ui/icons.ts` and the `--icon-cut` token (knock-outs are real transparency now), update the Icon section of `docs/DESIGN-SYSTEM.md`, and move `/design/icons` into the `/design` system when it exists.
6. **Watch the bundle.** `family.ts` is 145 KB raw, 32 KB gzipped. Astro pages only ship the markup they render, but the map's React island would bundle the whole map. Before step 1 lands there, emit a per-island subset (the build can write `family-map.ts` with only the glyphs the map uses).

Check after each step: `pnpm build`, `pnpm test`, the design audit at 1440 and 390 in both themes, and screenshots of the menu, the map pins and the drawer against the current site.
