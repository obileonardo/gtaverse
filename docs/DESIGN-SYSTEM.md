# Design system

The shared look of The Vice Files. Build every page from these tokens and components; do not add a second button, card, chip, badge, tab or icon style. If a page needs something new, add it here (tokens in `src/styles/tokens.css`, component in `src/components/ui/`) and document it below.

Sources: the owner's taste board picks and answers of 23 Nov 2026 (board analysis `tokens.md` and `direction-*.md`), the GTA VI palette measured in `research/gta6-design-language.md`, and the owner's design standards.

## Rules that never bend

- Dark first. Light is a full theme, never the default. Base `#0D0C1A`.
- Pink `#F976B0` is the accent. In light it is a fill only; pink text in light uses `--accent-text` (`#8D4053`).
- The sunrise gradient (`--glow-hero`) only for hero moments and for items without art.
- Buttons, chips and pills are fully rounded.
- No box shadows. Elevation is a surface step plus a 1px `--border-1`.
- No bounce easing. Exits are faster than entrances. Only `transform` and `opacity` animate (plus `clip-path` for reveals). Keyboard actions never animate.
- Motion (owner rules for the motion pass, 24 Nov 2026): no bounce or overshoot, no twitching; arriving and leaving use different curves and leaving takes 60 to 75% of the entrance; an exit and an entrance never slide at the same time (fades may overlap briefly); no letter-by-letter motion on reading text, no loops, no cursor effects, no scroll-jacking (scrolling stays native). See "Motion".
- Text containers never clip glyphs. An element that clips (`overflow` other than `visible`) and holds text gives every line box room for the full glyph: clip sideways only (`overflow: clip visible` for an ellipsis), or move the clip to a non-interactive wrapper that carries `padding-block` (about 0.14 to 0.2em) cancelled by a matching negative margin. Descenders (g, j, p, q, y) and accented capitals (É, Ñ) are never cut, also mid-animation.
- No em or en dashes in copy or code comments.
- No Rockstar logo, GTAArtDeco or Pricedown, and no game logo as our brand. Official game logos appear only as game identifiers through `GamePlate` (switcher, hubs, "Also in" chips), unaltered, beside the game's name, with the trademark line (decisions GS1 to GS6). Icons are our own drawings.
- Text never under 12px. Touch targets 44px or more on phone.

## Files

| File | What it holds |
| --- | --- |
| `src/styles/tokens.css` | Every token: colour (dark and light), type, spacing, sizes, radii, borders, motion, z layers |
| `src/styles/base.css` | Reset, page ground, type role classes, `.container`, `.page`, `.sr-only`, skip link |
| `src/styles/components.css` | The styles of every shared component (Icon, Button, Chip, Badge, Tabs), loaded on every page by `base.css`. The Astro components and the map's React island render the same classes, so each component has one look |
| `src/layouts/Base.astro` | Page shell: fonts, theme script, header, footer, search and sharing tags. Props `title`, `description`, `layout` (`page` or `bare`), `sub`, and (optional) `jsonLd`, `breadcrumbs`, `ogType`, `noindex` |
| `src/components/site/PageHead.astro` | List page head: display caps title, mono count, lede, optional breadcrumb trail (finders, region and category hubs) |
| `src/components/site/DocPage.astro` | Policy page: the explainer's reading column with a rail of the policy pages (about, editorial policy, corrections, takedowns) |
| `src/components/FindGrid.astro` | The finds index card grid as a component (hubs) |
| `src/components/site/Header.astro` | The NEON island, the desktop popover menu and the phone overlay menu, the theme toggle, the sub bar |
| `src/components/site/Footer.astro` | Footer with the legal disclaimer and takedown address (legal copy: keep word for word) |
| `src/components/ui/Button.astro` | Pill button |
| `src/components/ui/Chip.astro` | Filter chip |
| `src/components/ui/Badge.astro` | Badges and tags |
| `src/components/Verification.astro` | Verification tag for a find (uses Badge) |
| `src/components/ui/Card.astro` | Card |
| `src/components/ui/Tabs.astro` | Underline tabs |
| `src/components/ui/LevelTable.astro` | The one table style (Fiverr level system) |
| `src/components/Clip.astro` | A creator's clip: thumbnail first, player on tap, spoiler and mature gate |
| `src/components/home/Hero.astro` | The home hero: three background modes (trailer, key art, line art) with ring timed circles, the A24 stack with its peek frame, the Apple TV slides (docs/HERO.md). Intro (owner decision, 24 Nov 2026): a small text block top left at the gutter, level with the island, text-2 with the name in text-1, over a soft local scrim; hidden below 1024. The mode circles and their caption sit top right at the gutter, centred on the island; the finds list starts at the left gutter |
| `src/components/lore/Timeline.astro` | The GTAverse timeline (Grok on desktop, Queue on the phone) |
| `src/components/ui/Icon.astro`, `icons.ts` | Icon wrapper and the icon set |
| `src/lib/nav.ts` | Main navigation items and counts, `isCurrent()` |
| `src/lib/media.ts` | `findStill()` (YouTube thumbnail of the creator's post), `showcaseable()`, `categoryLabel()`, `regionLabel()`, `categoryIcon()`, `categoryChipLabel()` |
| `src/lib/clip.ts` | `youtubeId()`, `ytThumb()`, `ytEmbed()`: the click-to-load clip helpers shared by `Clip.astro` and the map |
| `src/components/games/` | `GamePlate.astro` (a game's official logo on the fixed dark plate, or a text plate), `GameChips.astro` ("Also in" link chips), `GameLens.astro` (the `?game=` lens and its "Showing" chip) |
| `src/components/lore/ConnectionList.astro` | The numbered connection list by year, on `/gtaverse` and every game hub |
| `src/components/ChapterControl.astro`, `src/lib/chapter.ts` | "I'm on Chapter N": the select and the shared rules that open spoilers the visitor has played past |
| `src/components/Spoiler.astro`, `src/lib/spoiler.ts` | The inline spoiler block (native `<details>`), also made from explainer "Spoiler:" paragraphs |
| `src/lib/games.ts` | Games, aliases, counts, `logoOf()`, the switcher groups (`content/games.json`) |
| `src/components/map/` | The map screen and find drawer (React island on `/map`): `MapApp.tsx`, `MapCanvas.tsx` (Leaflet), `Sheet.tsx` (phone sheets), `FindDetail.tsx`, `Menus.tsx`, `ClipPlayer.tsx`, `ui.tsx` (the shared components for React), `map.css` |

## Theme

- Dark tokens live on `:root`. Light tokens live on `:root[data-theme='light']`.
- An inline script in `Base.astro` sets `data-theme` before first paint: `?theme=light|dark` in the URL (for checks), then the visitor's saved choice (`localStorage` key `vf-theme`), then `prefers-color-scheme`.
- The theme toggle in the header saves the choice on the device.
- `data-scheme="dark"` on any element keeps that region dark in both themes. Use it for art led regions where type sits on artwork (the home hero).

## Colour tokens

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#0D0C1A` | `#F9F5F0` | page ground |
| `--surface-1` | `#1F1F38` | `#FFFFFF` | drawers, sheets, panels, framed cards |
| `--surface-2` | `#252644` | `#F2F1F6` | chips, wells, media tiles |
| `--surface-3` | `#2F2E52` | `#ECEAE7` | hover, current row |
| `--border-1` | `#38365D` | `#D8D8D6` | 1px separators and edges |
| `--border-2` | `#433F6A` | `#C5C5C8` | strong outlines |
| `--text-1` | white 92% | `#2F2F2F` | primary text |
| `--text-2` | white 64% | `#5F5F5F` | secondary text |
| `--text-3` | white 50% | `#666666` | labels, footnotes (AA on `--bg`) |
| `--accent` | `#F976B0` | `#F976B0` (fill only) | primary buttons, pins, active underline |
| `--accent-text` | `#F976B0` | `#8D4053` | pink text and links |
| `--on-accent` | `#0D0C1A` | `#0D0C1A` | text on pink |
| `--accent-tint` | pink 16% | wine 10% | secondary buttons |
| `--inverse-fill` / `--inverse-text` | `#F2F2F2` / navy | `#2F2F2F` / white | selected chip, Apple TV Play pill |
| `--glass-fill`, `--glass-border`, `--glass-blur` | navy 72%, white 12%, 20px | white 72% | island, glass buttons and chips, menus |
| `--glass-hover`, `--glass-hover-soft` | white 10%, 5% | ink 8%, 4% | current item pill, hover |
| `--scrim`, `--overlay-fill` | | | behind popovers, phone menu overlay |
| `--glow-hero` | sunrise radial at 35% | at 16 to 28% | hero moments, items without art |
| `--badge-verify-*` | `#FBC7E4` fill, pink edge, navy text | same | multi-source verification |
| `--level-1` to `--level-5` | mint, lavender, pink, peach, amber | | wanted level columns (explainer) |
| `--logo-plate`, `--logo-plate-edge` | `#0D0C1A`, white 10% | same (fixed) | the plate behind an official game logo, the same in both themes (GS4) |
| `--map-*` | navy ramp | GetYourGuide palette | map land, roads, water, park, labels, halos |

## Type

| Family token | Face | Use |
| --- | --- | --- |
| `--font-display` | Big Shoulders (Display cut, `opsz` 72, weight 800 to 900) | caps titles: find titles, phone hero title, wordmark, card glow labels. Always add `font-variation-settings: var(--font-display-axes)` |
| `--font-body` | Inter | everything else, including the A24 title stack (weight 500) |
| `--font-mono` | Geist Mono | dates, years, counts, timecodes, superscripts |
| `--font-serif` | Newsreader | lore pages only |

Fonts are fetched from Google Fonts at build time by Astro's font loader (`astro.config.mjs`) and served from our domain.

Scale tokens (desktop / phone): `--text-display-xl` 144 clamp / 64, `--text-display-l` 72 / 56, `--text-display-m` 48 / 40, `--text-display-s` 28 / 24, `--text-h1` 28, `--text-h2` 22, `--text-title-l` 20, `--text-title` 17, `--text-body-l` 18 / 20, `--text-body` 16 / 17, `--text-body-s` 14 / 15, `--text-label` 14 / 15, `--text-label-caps` 12, `--text-caption` 13, `--text-mono` 13 / 17, `--text-mono-caps` 12, `--text-stat` 20, `--text-menu` 25. Role classes in `base.css`: `.display-xl`, `.display-l`, `.display-m`, `.display-s`, `.h1`, `.h2`, `.title`, `.body-l`, `.body-s`, `.caption`, `.label-caps`, `.mono`, `.mono-caps`, `.muted`, `.tabular`.

## Spacing, sizes, radii

- Spacing on a 4px base: `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48, `-16` 64, `--space-section` 96 desktop / 64 phone.
- The gutter (owner decision, 24 Nov 2026): `--gutter` is 128 at 1440 and wider, 96 from 1280, 64 from 1024, 40 from 768 and 16 on the phone. `--page-pad` is the same value under the name every component already uses; `--container-max` is 1664 (1920 minus the gutter twice), so wider screens keep a 128 gutter and centre the rest. Use `.container` for anything that should line up with the header and footer: page content, the home hero (its intro, the finds list, the mode circles, the scroll arrow) and the footer all share this edge.
- Sizes: `--chip-h` 34, `--chip-h-touch` 40, `--btn-h-s/m/l/xl` 32/40/48/56, `--ctrl-size-s/-/l/xl` 32/44/48/52, `--island-w` 336, `--island-h` 48, `--island-sub-h` 44, `--tab-underline` 3, `--icon-s/m/l` 16/20/24.
- Radii: `--radius-xs` 4 (badges, island), `-s` 8, `-m` 12 (card media), `-l` 16 (framed cards), `-xl` 20 desktop / 28 phone (menus), `--radius-sheet` 32, `--radius-full` (buttons, chips, pills).

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | every entrance, press |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | movement on screen (tab underline, map fly) |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | drawers and sheets |
| `--ease-colour` | `cubic-bezier(0.455, 0.03, 0.515, 0.955)` | colour and crossfades |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | exits |
| `--dur-press` 140, `--dur-colour` 200, `--dur-popover-in/out` 180/140, `--dur-overlay-in/out` 220/160, `--dur-peek-in/out` 260/200, `--dur-drawer-in/out` 420/300, `--dur-fly` 600, `--dur-crossfade` 500, `--dur-card-lift` 500, `--stagger` 40 | ms | |

Motion, part 2 (the motion study's tokens, 24 Nov 2026):

| Token | Value | Use |
| --- | --- | --- |
| `--ease-reveal` | `cubic-bezier(0.22, 1, 0.36, 1)` | arrivals of 480ms and longer: title lines, card walls, the 404 |
| `--ease-crit` | `linear(...)`, a critically damped spring from rest | CSS indicators that should feel like the springs (contents marker) |
| `--dur-page-out` / `--dur-page-in` | 160 / 280ms | page transitions: the old page fades, the new one rises 8px, fades overlap by 60ms |
| `--dur-morph` / `--dur-morph-out` | 280 / 180ms | one surface changing shape (menu from the island, chip check, copy button), and most exits |
| `--dur-roll` | 280ms | a digit or word rolling to a new value |
| `--dur-reveal` / `--dur-reveal-group` | 640 / 480ms | title lines once per page; cards and rows on first view |
| `--dur-image-in` | 240ms | a still fading in once decoded |
| `--dur-theme` | 520ms | the theme circle |
| `--dur-ping` | 700ms | the map's one "here it is" ring |
| `--dur-moment` | 900ms | rare moments only (404) |
| `--dur-fade-reduced` | 150ms | reduced motion: a movement becomes this fade |
| `--stagger-group`, `--stagger-hero`, `--stagger-cap` | 50ms, 70ms, 6 | first-view groups (each gap 10% shorter, capped at the sixth), hero lines |
| `--spring-sheet`, `--spring-travel`, `--spring-lead`, `--spring-trail` | 0.4, 0.3, 0.2, 0.34 (seconds of response, damping ratio 1) | read by `src/scripts/motion/spring.ts` |

Press feedback is `scale(0.97)` on `:active`. Hover styles live inside `@media (hover: hover) and (pointer: fine)`. Every animated component has its own `prefers-reduced-motion` rule that keeps a short opacity fade and drops movement; there is no site-wide rule that cuts animations to nothing (only `scroll-behavior` is reset globally).

Where motion lives:
- Page transitions: the browser's cross-document view transitions (`@view-transition` in `base.css`), no router. The island is its own layer (`view-transition-name: island`) so it never redraws; an open menu fades with the old page (`site-menu`). Between game hubs the page slides from the side of the move (`game-next`, `game-prev` types, set by `src/scripts/site-motion.ts` and read in `pagereveal` in `Base.astro`).
- Before first paint (inline script in `Base.astro`): `html.js` (hidden start states only exist under it), `html.nav-back` (entrances never replay on back navigation), the image fade (every image fades in once decoded, at once if it was ready for the first frame; opt out with `data-nofade`, used for an LCP still).
- `src/scripts/site-motion.ts`: card walls and `[data-reveal] > li` rows reveal once on first view (stagger capped at the sixth, never on back navigation).
- `src/scripts/motion/`: `spring.ts` (the one critically damped spring: retargets with its velocity, never passes its target), `roll.ts` (rolling numbers, only changed digits move), `pill.ts` (the travelling hover pill with lead and trail edges).
- `src/components/map/motion.tsx`: `usePresence` (exits for the drawer, toast, popup and phone cards), `RollNumber`, `listFlip` (rows keep their place when filters change).

## Z layers

`--z-map` 0, `--z-pins` 10, `--z-map-ui` 20, `--z-panel` 30, `--z-drawer` 40, `--z-scrim` 45, `--z-header` 50, `--z-popover` 60, `--z-overlay` 70, `--z-toast` 80. The header is always on top of page content; an open menu dims everything but the header.

## Components

### Button (`ui/Button.astro`)
Pill. `variant`: `primary` (pink, the one main action of a view), `inverse` (white pill over art, Apple TV Play), `glass` (over art or map), `secondary` (pink tint), `quiet` (surface, for Cancel), `ghost` (no fill until hover: bare icon actions such as the drawer's Felt actions and close). `.btn--stack` puts the icon above the label for equal-width actions (Apple Maps place actions), still fully rounded. Disabled buttons sit at 40% opacity. `size`: `s` 32, `m` 40, `l` 48, `xl` 56. `icon`, `iconEnd`, `iconOnly` + `label` (circle). `href` renders a link.
Pill. `variant`: `primary` (pink, the one main action of a view), `inverse` (white pill over art, Apple TV Play), `glass` (over art or map), `secondary` (pink tint), `quiet` (surface, for Cancel), `outline` (no fill, 1px edge: V7 timeline arrows, Mindtrip "View profile"). `size`: `s` 32, `m` 40, `l` 48, `xl` 56. `icon`, `iconEnd`, `iconOnly` + `label` (circle). `href` renders a link.
```astro
<Button href="/finds/x" variant="inverse" size="l" icon="play">Play clip</Button>
<Button variant="glass" size="l" icon="pin" iconOnly label="Open the map" />
```

### Chip (`ui/Chip.astro`)
Filter chip, 34 high (40 with `touch`). `selected` turns it into the white pill with a dark label and sets `aria-pressed`. `glass` for chips over the map. `icon`, `count`, `href`.

### Badge (`ui/Badge.astro`) and Verification (`Verification.astro`)
`variant`: `meta` (grey rectangle: type, region, game), `verified` (pink sticker), `outline`, `muted` (dashed), `debunked`, `new`. Verification maps the four content levels: multi-source = `verified` + check, single source = `outline` + dot, rumour = `muted` + question mark, debunked = `debunked` + cross. Never by colour alone.
```astro
<Verification level={find.verification} />
<Badge variant="meta">Vice City</Badge>
```

### Card (`ui/Card.astro`)
One card style: 16:9 media (radius 12, 1px edge), then pink caps kicker, title (17/600, two lines max) and meta (one line). `framed` puts it on `--surface-1` with a border and 16 padding. Without an image the media shows the sunrise glow with the kicker in display caps. `href` makes the whole card one link; `srcset` and `sizes` pass to the image.

### Tabs (`ui/Tabs.astro`)
Underline tabs: caps labels with 0.1em tracking, active at full text colour with a 3px pink underline that moves to the new tab, a hairline under the row. Panels are named slots; keyboard arrows, Home and End work. Content swaps without sliding.
```astro
<Tabs id="find" tabs={[{ id: 'related', label: 'Related' }, { id: 'details', label: 'Details' }]}>
  <div slot="related">...</div>
  <div slot="details">...</div>
</Tabs>
```

### Icon (`ui/Icon.astro`, `ui/icons.ts`)
24 x 24 line glyphs, 1.5 stroke, round ends, `currentColor`. `size` `s` 16, `m` 20, `l` 24 or a number. `solid` gives the filled form for the current item. `label` only when the icon is the whole control. Icons: `menu`, `close`, `home`, `map`, `finds`, `explainers`, `lore`, `pin`, `play`, `sun`, `moon`, `arrow-right`, `arrow-down`, `arrow-up-right`, `chevron-right`, `chevron-down`, `check`, `question`, `cross`, `dot`, `filter`, `layers`, `plus`, `minus`, `share`, `link`, `search`, `grid`, `hand`, `clip`, `article`, `chat`, and one per find category (`egg`, `person`, `keyhole`, `globe`, `car`, `candle`, `crosshair`, `star`, `gem`, `flag`, `bolt`, `ghost`, mapped in `categoryIcon()`). Solid icons cut their inner detail with `--icon-cut`; set it to the ground the icon sits on. A diagonal arrow means "opens another site"; a chevron means "opens here".
24 x 24 line glyphs, 1.5 stroke, round ends, `currentColor`. `size` `s` 16, `m` 20, `l` 24 or a number. `solid` gives the filled form for the current item. `label` only when the icon is the whole control. Icons: `menu`, `close`, `home`, `map`, `finds`, `explainers`, `lore`, `pin`, `play`, `sun`, `moon`, `arrow-right`, `arrow-down`, `arrow-up-right`, `chevron-right`, `chevron-left`, `chevron-down`, `arrow-left`, `check`, `question`, `cross`, `dot`, `share`, `info`, `link`, `film`, `alert`, `radio`, `flame` (solid too), `star` (line = hollow, solid = filled wanted star), `star-flash` (dashed, a flashing star), and for the home hero `image`, `wire`, `sound`, `sound-off`. Solid icons cut their inner detail with `--icon-cut`; set it to the ground the icon sits on. A diagonal arrow means "opens another site"; a chevron means "opens here".

### LevelTable (`ui/LevelTable.astro`)
Every table on the site. A sheet on `--surface-1` (radius 20, 24 padding, 1px edge), no cell borders, a 30% label column, rows striped full width (white 4% dark, `#f8f8f8` light), values centred when every cell in the column is 28 characters or fewer, a quiet footnote. A row can carry a level badge: the rounded hexagon in `--level-1` to `--level-5` with a glyph, and the label in the same colour (ink in light). On the phone a long value drops under the short one. Explainer markdown tables render through it automatically.
```astro
<LevelTable head={['State', 'How it looks']} rows={[{ label: 'In Pursuit', badge: { icon: 'star', solid: true, tone: 3 }, cells: ['White stars'] }]} footnote="Source: GTABase" />
```

### Clip (`Clip.astro`)
16:9 frame (`ratio` to change it) with the creator's thumbnail and a glass play circle; the player (youtube-nocookie) loads on tap. `spoiler` or `mature` show a gate on the glow with a reveal pill, and no thumbnail loads until it is revealed. `caption={false}` drops the credit line when the page credits the creator elsewhere.

### Timeline (`lore/Timeline.astro`)
One selected moment at a time. Desktop: Grok hairline across the page, mono year labels on 1px ticks, V7 ruler ticks hanging under the line, event ticks in pink, a square marker; the moment's date, serif title and description under the marker with Queue's polaroid to the right; V7 outline arrow pills, arrow keys, Home and End (keyboard moves never animate). Phone: Queue sheet with a scrubbing year ruler (native scroll and snap) under a fixed centre tick, the serif headline with a quote mark, the polaroid, "Watch the clip", the serif body; swipe to move. The track moves with `--ease-in-out` 500ms; the moment swap is direction aware: the old moment stops moving at 120ms and fades by 160ms, the new one moves in from 120ms over 280ms (never two slides at once). The polaroid settles into its tilt as it arrives, the phone ruler's year rolls, and thin accent arcs join the moment to the nearest moments that share its first game, drawn after the band has landed. Reduced motion: fades only.

### Header (`site/Header.astro`)
- Desktop: island 336 x 48, centred, 32 from the top, glass, radius 4. Left: hamburger and wordmark. Right: Map and the theme toggle. The hamburger opens the glass popover (Apple Sports): icon + label rows 48 high, 4 apart, current item in a pill with a solid icon, counts as mono superscripts. The page behind dims; the header stays clear. Escape closes instantly.
- Phone: the island spans the width less 16 each side. The hamburger opens the full screen overlay (Peacock): rows 80 apart, icon 31, label 25 semibold, the column at 32% of the width, current item white with a solid icon, a 52 close circle at the bottom. Focus stays inside; Escape closes.
- Sub bar (NEON): pass `sub={{ href, label, image }}` to `Base` on pages with a hero. Desktop only. Add `data-subbar="hidden"` on the header to step it away (the home page does this once the hero scrolls off).

- Games switcher (decisions GS3 and GS6). Desktop: the popover has two columns; the "Games" rail (404 wide) sits left of the site rows, which stay under the island. Caps "Games" label and an "All games" link, then the groups with their labels in an 84 wide left column, rows 36 high, 4 apart and 10 between groups: plate (104 x 28), short name, mono superscript connection count; the current hub gets the current pill and `aria-current`; the trademark line closes the rail. The rail scrolls if the window is short. Phone: a "Games" row (a button with `aria-expanded`) in the overlay opens the same element as a bottom sheet over a scrim tied to the sheet's position: handle, "Games" title, "All games", a 44 close circle, rows 56 high with 120 x 36 plates. It drags 1:1, springs (critically damped, seeded with the flick's speed) to half or full height or closed, can be caught mid-flight, scrolls its list only at full height, and closes with Escape, the close circle, the scrim or a flick down; focus moves into it and back to the Games row. Keyboard opens never animate. `vf:open-games` (a document event) opens it from any page.

### GamePlate (`games/GamePlate.astro`)
The official logo, scaled to fit a fixed box with `object-fit: contain` on the fixed dark plate (`--logo-plate`, radius 8, 1px edge), never recoloured, filtered or cropped. Without a fetched official file it is a text plate (the short name in display caps). `size`: `rail` 104 x 28, `sheet` 120 x 36, `chip` 64 x 22, `hub` 280 x 64. `alt` stays empty when the name is visible beside it; pass the full title where the plate stands alone (hub header).

### GameChips (`games/GameChips.astro`)
"Also in": a caps label and one touch chip per game (chip plate + short name), oldest first, each linking to `/gtaverse/games/[id]`. Renders nothing for no games.

### GameLens (`games/GameLens.astro`)
`?game=<id>` on a page: items with `data-lens-games` that do not list the id get `data-lens-off` (hidden), `data-lens-group` hides when empty, a "Showing" caps label with the selected chip (close icon) clears it, and "Game hub" links on. The timeline listens (`vf:game-lens`) and dims and skips the other moments.

### ChapterControl (`ChapterControl.astro`) and Spoiler (`Spoiler.astro`)
ChapterControl: "I'm on" and a pill select (40 high, 44 and 16px on the phone so iOS does not zoom); every copy stays in sync. Spoiler: a `<details>` on `--surface-2` with a dashed edge, the muted caps badge ("Spoiler, Chapter 3") and a pink "Reveal" as its summary; it opens by itself once the chapter setting reaches it.

### React twins (`map/ui.tsx`)
The map is a React island, and Astro components cannot render inside it. `ui.tsx` renders `Icon`, `Button`, `Chip`, `Badge`, `Verification` and `Tabs` with exactly the classes and markup of the Astro components, reading the same `icons.ts`; their look lives once, in `components.css`. Change a component's look there, never in the twin.

### Map (`/map`, `components/map/`)
- Desktop (GetYourGuide): list column (26%, Felt "List | Legend" tabs, GetYourGuide chip row, 120px photo rows) beside a rounded map; Mindtrip filter menu and Felt basemap popover from two glass circles top right; GetYourGuide zoom stack bottom right; Airbnb popup at a pin; Felt inspector drawer (360 wide) with the clip on top.
- Phone (Rodeo): full map, glass chips above a list/map toggle and a search pill; Tide Guide glass menus; Strava card for a tapped pin; Apple Maps sheet with the clip on top (MasterClass). Sheets drag 1:1, release into a critically damped spring seeded with the finger's speed, snap to the point the flick was heading for, and can be caught mid-flight.
- Pins: GetYourGuide photo and value pins (desktop), Rodeo round pins with a name (phone), Lyft pink count pills for finds close together. Selected is the inverse fill.
- Collectible layers (decisions C1 to C7): off by default, switched in the basemap menu (`LayerRows` in `Menus.tsx`, also in the desktop Legend). Collectible pins (`.cpin`) are 12px quiet discs with a 2px `--text-1` edge on `--surface-1`, under the find pins, never grouped; zoomed in they grow to 24 high and show the checklist number in Geist Mono 12. Items sharing one spot sit on a small ring (`.cpin--ring`). Selected is the inverse fill with a pink ring. A tap opens the collectible card (`.ccard`): caps kicker with the layer, the label, "Number n of total in their checklist", any reading note, and "Location: Game Checklists" linking the source; it sits in the Airbnb popup slot on desktop and the Strava card slot on phone. While a layer is on, the map credit gains a second line, "Collectible locations: Game Checklists".
- Every find opens from the list, so the map works with no pins. Filters (type chips; verification, clip, spoilers, mature and region in the menu) are remembered on the device (`vf-map-filters`); spoilers and mature are hidden by default. `/map?find=<slug>` opens a find.
- 3D view (`map/three/`, docs/MAP-3D.md): a "3D" glass control between Filters and Basemap (pressed = inverse fill, as an open control), the compass (a glass circle with N and a pink tick that turns with the camera; tap for north), and the honesty line "Relief is approximate, drawn by The Vice Files." as a glass caption pill. 3D pins are the 2D pin colours as a disc on a stem; collectibles are the `.cpin` disc. The view fades in over the 2D map, which stays mounted.
- Found tracker: the drawer's check icon button and the phone sheet's "Found" action are toggles (`aria-pressed`, pressed = inverse fill); the filter menu's Found group holds "Hide found", found counts per type and the export and import code field (a 16px input so iOS does not zoom).

### Page layouts
- `layout="page"` (default): content sits in `.container.page`, below the floating island.
- `layout="bare"`: full width (heroes, the map). Add your own `.container` for content that should line up.

### Search and sharing (`Base.astro`, `src/lib/seo.ts`, `src/lib/routes.ts`)
- Every page gets a canonical URL, Open Graph and Twitter tags and its own Open Graph card: a 1200 x 630 PNG drawn at build time (`src/lib/og.ts`) on the night navy ground with the sunrise glow, the kicker in pink caps, the title in Big Shoulders 900, one meta line in Inter and the wordmark. Text only: never Rockstar art or a YouTube still.
- `src/lib/routes.ts` lists every public page; the sitemap, `llms.txt` and the cards are built from it. A new page type goes there.
- Search engines are kept out by one switch, `site.indexable` in `src/lib/site.ts` (robots meta, `X-Robots-Tag` in `dist/_headers`, `robots.txt`).

### Policy pages and credits
- The footer carries a second row: the policy pages (`src/lib/trust.ts`), "Submit a find", "Suggest a correction" (prefilled GitHub issue links from `.github/ISSUE_TEMPLATE/*`, `src/lib/issues.ts`) and the RSS feed. The legal paragraphs stay word for word.
- `/finders` rows reuse the find page's credit card (avatar initial on the pink tint, name, platform) with an outline "Profile" pill and a 44px ghost circle per original post.

## Art and stills

The home hero's background is the exception: Rockstar's official trailer clips and wallpapers, built at deploy and credited, and our own line art (docs/HERO.md, decisions H1 to H4). Everywhere else the only art on open pages is the creator's own YouTube thumbnail (`findStill()`), served by YouTube, never re-hosted. Spoiler and mature finds never show art outside their reveal (`showcaseable()`). Shorts are skipped (portrait thumbnails). Anything without art gets `--glow-hero`.

## Known decisions open to the owner

See the "design foundation" rows in `docs/DECISIONS.md`.
