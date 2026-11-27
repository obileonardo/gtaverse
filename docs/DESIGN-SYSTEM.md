# Design system

The shared look of The Vice Files. Build every page from these tokens and components; do not add a second button, card, chip, badge, tab or icon style. If a page needs something new, add it here (tokens in `src/styles/tokens.css`, component in `src/components/ui/`) and document it below.

Sources: the owner's taste board picks and answers of 23 Nov 2026 (board analysis `tokens.md` and `direction-*.md`), the GTA VI palette measured in `research/gta6-design-language.md`, and the owner's design standards.

## Rules that never bend

- Dark first. Light is a full theme, never the default. Base `#0D0C1A`.
- Pink `#F976B0` is the accent. In light it is a fill only, always behind a navy label: pink text in light uses `--accent-text` (`#8D4053`), and a pink mark that shows a state (focus ring, current marker, active underline, the key-fact stroke) uses `--accent-ink` (`#9F4E77`, the pink shaded 38% toward night navy). In dark all three are `#F976B0`.
- The sunrise gradient (`--glow-hero`) only for hero moments and for items without art.
- Buttons, chips and pills are fully rounded.
- No box shadows. Elevation is a surface step plus a 1px `--border-1`.
- No bounce easing. Exits are faster than entrances. Only `transform` and `opacity` animate (plus `clip-path` for reveals). Keyboard actions never animate.
- Motion (owner rules for the motion pass, 24 Nov 2026): no bounce or overshoot, no twitching; arriving and leaving use different curves and leaving takes 60 to 75% of the entrance; an exit and an entrance never slide at the same time (fades may overlap briefly); no letter-by-letter motion on reading text, no loops, no cursor effects, no scroll-jacking (scrolling stays native). See "Motion". Cursor effects have exactly three owner exceptions, all for a mouse on a fine pointer only and never on touch, the keyboard or reduced motion: the hero's peek card that follows the cursor over the finds list (L5); since 26 Nov 2026, the two figures in home chapter 014 turning a few degrees toward the pointer on a soft spring and a subtle tilt toward the pointer on the character and asset cards (LR43); and the optional game cursors (LR48): an opt-in setting, off by default and remembered per visitor, never over text fields or other text-entry controls, with trails capped and gone within 300ms (see "Game cursors").
- Text containers never clip glyphs. An element that clips (`overflow` other than `visible`) and holds text gives every line box room for the full glyph: clip sideways only (`overflow: clip visible` for an ellipsis), or move the clip to a non-interactive wrapper that carries `padding-block` (about 0.14 to 0.2em) cancelled by a matching negative margin. Descenders (g, j, p, q, y) and accented capitals (É, Ñ) are never cut, also mid-animation. Sideways too: tight tracking lets a glyph's ink pass its box, so a sideways clip carries about 0.05em of inline room (cancelled by a negative margin), a clip that only needs one axis clips only that axis (the roll: `overflow: visible clip`), and `tools/page-check/clip-audit.mjs` checks the ink, not the box (LR1, LR2).
- No em or en dashes in copy or code comments.
- No Rockstar logo, GTAArtDeco or Pricedown, and no game logo as our brand. Official game logos appear only as game identifiers through `GamePlate` (switcher, hubs, "Also in" chips), unaltered, beside the game's name, with the trademark line (decisions GS1 to GS6). Icons are our own drawings.
- Our logo is Chime's Case File (decision LG5, [LOGO.md](LOGO.md)): SVG markup in code (IC3) through `ui/Logo.astro`, in token colours only (`--accent` folder, `--on-accent` VF, the wordmark in the text colour). Never retype the wordmark as live text.
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
| `src/components/site/ContentsRail.astro` | "On this page": the contents rail (sticky at 1024 and wider, a closed disclosure below) with the travelling marker and the reading progress line. The explainers and `/design` use it; the page places it |
| `src/components/FindGrid.astro` | The finds index card grid as a component (hubs) |
| `src/components/site/Header.astro` | The NEON island, the full screen menu with its art panel (desktop columns, phone sheet), the theme toggles, the sub bar |
| `src/components/site/Footer.astro` | Footer (round 2: HUXLEY 014, Kacio Felipe C04, Eat Hungry Tiger, A24 phone): the About page's three principles as a closing line over an official wallpaper (credited), the wordmark fitted to the content width, five ruled link cells with mono labels (guide, about, credits, open, contact with the takedown and conduct addresses), the two legal paragraphs (keep them word for word), a dotted rule with the credit row (copyright, licences, unofficial), and an art strip. Without built wallpapers the band sits on the sunrise glow and the strip is left out |
| `src/components/home/ChapterHead.astro` | The head every round 2 home chapter (001 to 015) opens on: a 1px `--rule-soft` rule that draws from the left (scaleX), the mono index (`index` 1 prints `001`, a string prints as given) with its 6px square bullet, the bracket label (`[ By the numbers ]`), an optional `count` superscript and an `end` slot for links at the right. `heading={false}` when the chapter has its own visible title. Without `index` it prints the rule and the label only (the unnumbered search band, LR28) |
| `src/components/home/AskBar.astro`, `src/lib/ask.ts` | The search band ("Ask the map", LR28 to LR32): an unnumbered band between the hero and Spotlight (ChapterHead without `index`), the search pill (56 high, a 44 round submit, a plain GET form to `/map?q=`, the header menu's pattern at the band's size) and "Try" with example question link chips (44 high) from `content/search-terms.json` `examples`; an example that lists no find on the map with its default filters is left out at build time (`ask.ts`) and fails `pnpm test` (`scripts/test/ask.test.ts`). The fields of a find that map search and filters read are built once, in `src/lib/map-fields.ts`, for `/map`, the band and the test |
| `src/components/home/Spotlight.astro` to `CollectibleLayers.astro` | Home chapters 001 to 008 (board r2 direction): Spotlight (Siena panel with Apple's peek and pager; Peacock card on the phone; `spotlight.ts`), Selected finds (Unseen Studio's counted pills and 1.95:1 grid with a layout animation on filter; `selected-finds.ts`), New this week (Linear cards under A24's rule, PlayStation feed with the Found toggle on the phone; `new-this-week.ts`), Watch the clips (Dasha C04 big clip and rail, Monije's full-bleed still strip; `watch-clips.ts`), Manifesto (Justin Jefferson 012, the About standfirst), By type (HUXLEY 007 ruled cells and tile strip with travelling brackets; `by-type.ts`), The map (Joby line map of our coast with every collectible location, region rows that light their own pins and show a region tag (LR23), PamPam card over the map's zoom 3 tiles headed by the "Open the map" pill (LR24); `the-map.ts`), Collectible layers (HUXLEY 013). What each shows is computed in `src/lib/home.ts` |
| `src/lib/found-store.ts` | The found tracker's storage with no framework (read, write, toggle, subscribe), shared by the map's `useFound()` and the home page's Found toggles |
| `src/scripts/motion/ease.ts` | `cubicBezier()`, `easeInOut` (the `--ease-in-out` token solved for x) and `glideScroll()`, for a scroll position glided on the token's curve |
| `src/components/home/Chapter009Numbers.astro` to `Chapter015Gtaverse.astro` | Home chapters 009 to 015 (board r2 direction): By the numbers (Coda sticky stage, Marina rows on the phone), Regions (Olha's two panels under a faint giant word that names the chosen region, LR25), How it is made (FLORA cards with real components), Finders and sources (Dropbox and HUXLEY 009), Explainers (Kacio C11 and Notion), The two leads (Dasha C08 with our own line-art figures, `leads-art.ts`), GTAverse (Justin Jefferson 005 scroll track; a dashed route behind the cards lights each grey card as the scroll reaches it, LR18 to LR22). Each takes an optional `index` and owns its top padding (`--space-chapter`) |
| `src/lib/wallpaper.ts` | `wallpaper(i)`: an official hero wallpaper (built at deploy) for the places the owner approved outside the hero (home Explainers, footer), or null |
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
| `src/components/ui/Logo.astro`, `src/brand/logo.ts` | The logo (Case File, LG5): component, Chime's paths and the SVG renderers for the site, the cards and the favicons |
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
| `--text-3` | white 52% | `#666666` | labels, footnotes (AA on every surface, 4.69:1 on `--surface-3` in dark) |
| `--accent` | `#F976B0` | `#F976B0` (fill only) | primary buttons, pins, the count pill: fills behind a navy label |
| `--accent-text` | `#F976B0` | `#8D4053` | pink text and links |
| `--accent-ink` | `#F976B0` | `#9F4E77` | pink state marks on the ground: focus ring, current marker in rails, active tab underline, timeline marker, key-fact stroke (3:1 or more on every light surface; 4.57:1 on `--surface-3`) |
| `--on-accent` | `#0D0C1A` | `#0D0C1A` | text on pink |
| `--accent-tint` | pink 16% | wine 10% | secondary buttons |
| `--inverse-fill` / `--inverse-text` | `#F2F2F2` / navy | `#2F2F2F` / white | selected chip, Apple TV Play pill |
| `--glass-fill`, `--glass-border`, `--glass-blur` | navy 72%, white 12%, 20px | white 72% | island, glass buttons and chips, menus |
| `--glass-hover`, `--glass-hover-soft` | white 10%, 5% | ink 8%, 4% | current item pill, hover |
| `--glow-hero` | sunrise radial at 35% | at 16 to 28% | hero moments, items without art |
| `--badge-verify-*` | `#FBC7E4` fill, pink edge, navy text | same | multi-source verification |
| `--badge-new-fill`, `--badge-new-text` | white, navy | `#2F2F2F`, white | the "New" badge (white on cream vanished in light) |
| `--level-1` to `--level-5` | mint, lavender, pink, peach, amber | | wanted level columns (explainer) |
| `--blip-collectible`, `-ink`, `-key` | GTA coral `#F76685`, navy glyph and keyline | same (fixed) | collectible-layer map blip plates (IC9, `docs/ICONS.md`) |
| `--logo-plate`, `--logo-plate-edge` | `#0D0C1A`, white 10% | same (fixed) | the plate behind an official game logo, the same in both themes (GS4) |
| `--map-land`, `--map-halo` | `#1F1F38`, navy 80% | cream, cream 85% | map ground behind the tiles, label halos |

## Type

| Family token | Face | Use |
| --- | --- | --- |
| `--font-display` | Big Shoulders (Display cut, `opsz` 72, weight 800 to 900) | caps titles: find titles, phone hero title, wordmark, card glow labels. Always add `font-variation-settings: var(--font-display-axes)` |
| `--font-body` | Inter | everything else, including the A24 title stack (weight 500) |
| `--font-mono` | Geist Mono | dates, years, counts, timecodes, superscripts |
| `--font-serif` | Newsreader | lore pages only |

Fonts are fetched from Google Fonts at build time by Astro's font loader (`astro.config.mjs`) and served from our domain.

Scale tokens (desktop / phone): `--text-display-xl` 144 clamp / 64, `--text-display-l` 72 / 56, `--text-display-m` 48 / 40, `--text-display-s` 28 / 24, `--text-h1` 28, `--text-h2` 22, `--text-title-l` 20, `--text-title` 17, `--text-body-l` 18 / 20, `--text-body` 16 / 17, `--text-body-s` 14 / 15, `--text-label` 14 / 15, `--text-label-caps` 12, `--text-caption` 13, `--text-mono` 13 / 17, `--text-mono-caps` 12, `--text-stat` 20. Role classes in `base.css`: `.display-xl`, `.display-l`, `.display-m`, `.display-s`, `.h1`, `.h2`, `.title`, `.body-l`, `.body-s`, `.caption`, `.label-caps`, `.mono`, `.mono-caps`, `.muted`, `.tabular`.

## Spacing, sizes, radii

- Round 2 tokens (board analysis `tokens-r2.md`): `--rule-soft` (a page rule quieter than a card edge), `--rule-dotted`, `--frame-card` (the sunrise stops at full strength, GTAverse card frames), `--text-section`, `--text-manifesto`, `--text-stat-xl`, `--text-mono-display`, `--tracking-wide`, `--cut-s/m/l` 12/24/56, `--tilt` 2.5deg, `--space-chapter` 160 / 96 (between home chapters). Font weights added for them: Big Shoulders 100, Inter 200 to 900 and italic, Geist Mono 300.
- Spacing on a 4px base: `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48, `-16` 64, `--space-section` 96 desktop / 64 phone.
- The gutter (owner decision, 24 Nov 2026): `--gutter` is 128 at 1440 and wider, 96 from 1280, 64 from 1024, 40 from 768 and 16 on the phone. `--page-pad` is the same value under the name every component already uses; `--container-max` is 1664 (1920 minus the gutter twice), so wider screens keep a 128 gutter and centre the rest. Use `.container` for anything that should line up with the header and footer: page content, the home hero (its intro, the finds list, the mode circles, the scroll arrow) and the footer all share this edge.
- Sizes: `--chip-h` 34, `--chip-h-touch` 40, `--btn-h-s/m/l/xl` 32/40/48/56, `--ctrl-size` 44, `--ctrl-size-xl` 52, `--island-w` 470 (400 from 1024 to 1279, 336 from 768 to 1023, LR7), `--island-h` 48, `--island-sub-h` 44, `--tab-underline` 3. Icon sizes are the Icon component's own `size` (16, 20, 24), not tokens.
- Radii: `--radius-xs` 4 (badges, island), `-s` 8, `-m` 12 (card media), `-l` 16 (framed cards), `-xl` 20 desktop / 28 phone (menus), `--radius-sheet` 32, `--radius-full` (buttons, chips, pills).

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | every entrance, press |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | movement on screen (tab underline, map fly) |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | drawers and sheets |
| `--ease-colour` | `cubic-bezier(0.455, 0.03, 0.515, 0.955)` | colour and crossfades |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | exits |
| `--dur-press` 140, `--dur-colour` 200, `--dur-popover-in/out` 180/130 (exit 72%), `--dur-peek-in/out` 260/180 (69%: the map's drawer and phone card), `--dur-crossfade` 500, `--dur-card-lift` 500 | ms | |

Motion, part 2 (the motion study's tokens, 24 Nov 2026):

| Token | Value | Use |
| --- | --- | --- |
| `--ease-reveal` | `cubic-bezier(0.22, 1, 0.36, 1)` | arrivals of 480ms and longer: title lines, card walls, the 404 |
| `--ease-crit` | `linear(...)`, a critically damped spring from rest | CSS indicators that should feel like the springs (contents marker) |
| `--dur-page-out` / `--dur-page-in` | 180 / 280ms (exit 64%) | page transitions: the old page fades, the new one rises 8px, fades overlap by 60ms |
| `--dur-morph` / `--dur-morph-out` | 280 / 180ms (exit 64%) | one surface changing shape (menu from the island, chip check, copy button), and most exits |
| `--dur-swap-out` / `--dur-swap-in` | 180 / 280ms (exit 64%) | content swapping in one place (Spotlight text, By type cells, Regions): the old leaves, and the new starts only once it is gone (LR13); pictures may crossfade on the same pair |
| `--dur-roll` | 280ms | a digit or word rolling to a new value |
| `--dur-roll-l` | 480ms | a display number rolling (the home stats), long enough to follow (LR14) |
| `--dur-reveal` / `--dur-reveal-group` | 640 / 480ms | title lines once per page; cards and rows on first view |
| `--dur-image-in` | 240ms | a still fading in once decoded |
| `--dur-theme` | 520ms | the theme circle |
| `--dur-ping` | 700ms | the map's one "here it is" ring |
| `--dur-moment` | 900ms | rare moments only (404) |
| `--dur-fade-reduced` | 150ms | reduced motion: a movement becomes this fade |
| `--dur-trail` | 280ms | one mark of the optional game cursor's trail, from drawn to gone (LR48, LR52: within 300ms) |
| `--stagger-group`, `--stagger-hero`, `--stagger-cap` | 50ms, 70ms, 6 | first-view groups (each gap 10% shorter, capped at the sixth), hero lines |
| `--spring-sheet`, `--spring-travel`, `--spring-lead`, `--spring-trail` | 0.4, 0.3, 0.2, 0.34 (seconds of response, damping ratio 1) | read by `src/scripts/motion/spring.ts` |

Press feedback is `scale(0.97)` on `:active`. Hover styles live inside `@media (hover: hover) and (pointer: fine)`. Every animated component has its own `prefers-reduced-motion` rule that keeps a short opacity fade and drops movement; there is no site-wide rule that cuts animations to nothing (only `scroll-behavior` is reset globally).

Where motion lives:
- Page transitions: the browser's cross-document view transitions (`@view-transition` in `base.css`), no router. The island is its own layer (`view-transition-name: island`, set only while a transition runs, because a named element is a backdrop root and would stop the glass from blurring the page) so it never redraws; an open menu is part of the island's snapshot and fades out with it. Between game hubs the page slides from the side of the move (`game-next`, `game-prev` types, set by `src/scripts/site-motion.ts` and read in `pagereveal` in `Base.astro`): the old page leaves in `--dur-morph-out` (64% of the `--dur-morph` entrance) and the new one starts once the old one has stopped moving, so two slides never overlap.
- Before first paint (inline script in `Base.astro`): `html.js` (hidden start states only exist under it), `html.nav-back` (entrances never replay on back navigation), the image fade (every image fades in once decoded, at once if it was ready for the first frame; opt out with `data-nofade`, used for an LCP still).
- Pointer exceptions (LR43): `src/components/home/hero-peek.ts` (L5), `leads-turn.ts` (the chapter 014 figures turn up to 6 degrees on `--spring-sheet`, LR44, LR45) and `card-tilt.ts` (character and asset cards tilt up to 3 degrees on `--spring-travel`, LR46). Each writes its transform (or redraws its own canvas) on the moving element and runs its loop only while something moves. `leads-turn.ts` and `card-tilt.ts` also put everything back at rest off screen or in a hidden tab; the peek card follows only while the pointer is over the hero's list, and is left as L5 built it.
- `src/scripts/site-motion.ts`: card walls and `[data-reveal] > li` rows reveal once on first view (stagger capped at the sixth, never on back navigation).
- `src/scripts/motion/`: `spring.ts` (the one critically damped spring: retargets with its velocity, never passes its target), `roll.ts` (rolling numbers, only changed digits move; with `align: 'centre'` a number that changes length rolls as a whole on its centre line, LR10), `pill.ts` (the travelling hover pill with lead and trail edges).
- `src/components/map/motion.tsx`: `usePresence` (exits for the drawer, toast, popup and phone cards), `RollNumber`, `listFlip` (rows keep their place when filters change).

## Z layers

`--z-header` 50 (the header), `--z-overlay` 70 (the skip link sits one above it). Layers inside a component (the map's panels, pins and sheets) are local `z-index` values in its own stylesheet. The header is always on top of page content; an open menu dims everything but the header.

## Components

### Button (`ui/Button.astro`)
Pill. `variant`: `primary` (pink, the one main action of a view), `inverse` (white pill over art, Apple TV Play), `glass` (over art or map), `secondary` (pink tint), `quiet` (surface, for Cancel), `ghost` (no fill until hover: bare icon actions such as the drawer's Felt actions and close), `outline` (no fill, 1px edge: V7 timeline arrows, the finders' "Profile" pill). `size`: `s` 32, `m` 40, `l` 48, `xl` 56. `icon` before the label, `iconEnd` after it, `iconOnly` + `label` for a circle. `stack` puts the icon (20) above the label for equal-width actions (Apple Maps place actions: the map drawer's Find page, Map, Found, Share), still fully rounded. Disabled buttons sit at 40% opacity. `href` renders a link. The map's React twin (`map/ui.tsx`) takes the same variants and props; the look of both lives once, in `components.css`.
```astro
<Button href="/finds/x" variant="inverse" size="l" icon="play">Play clip</Button>
<Button variant="glass" size="l" icon="pin" iconOnly label="Open the map" />
```

### Chip (`ui/Chip.astro`)
Filter chip, 34 high (40 with `touch`). `selected` turns it into the white pill with a dark label and sets `aria-pressed`. `glass` for chips over the map. `icon`, `count`, `href`. `check={false}` drops the widening check on a toggle chip, for a row where exactly one chip is selected (the white fill marks it and the row never changes width). The `lead` slot puts something before the icon and label (the game plate in the "Also in" chips).

### Badge (`ui/Badge.astro`) and Verification (`Verification.astro`)
`variant`: `meta` (grey rectangle: type, region, game), `verified` (pink sticker), `outline`, `muted` (dashed), `debunked`, `new`. Verification maps the four content levels: multi-source = `verified` + check, single source = `outline` + dot, rumour = `muted` + question mark, debunked = `debunked` + cross. Never by colour alone.
```astro
<Verification level={find.verification} />
<Badge variant="meta">Vice City</Badge>
```

### Card (`ui/Card.astro`)
One card style: 16:9 media (radius 12, 1px edge), then pink caps kicker, title (17/600, two lines max) and meta (one line). `framed` puts it on `--surface-1` with a border and 16 padding. `line` gives Unseen Studio's caption (home Selected finds): no kicker line, the title (20/600) and meta (20/400, `--text-2`) on one line each with an ellipsis, an arrow at the right and a `--rule-soft` rule 8px under; hover lifts the media 4px and nudges the arrow. Without an image the media shows the sunrise glow with the kicker in display caps. `href` makes the whole card one link; `srcset` and `sizes` pass to the image.

### Tabs (`ui/Tabs.astro`)
Underline tabs: caps labels with 0.1em tracking, active at full text colour with a 3px pink underline that moves to the new tab, a hairline under the row. Panels are named slots; keyboard arrows, Home and End work. Content swaps without sliding.
```astro
<Tabs id="find" tabs={[{ id: 'related', label: 'Related' }, { id: 'details', label: 'Details' }]}>
  <div slot="related">...</div>
  <div slot="details">...</div>
</Tabs>
```

### Icon (`ui/Icon.astro`, `ui/icons.ts`)
**Being replaced** by the icon family in `src/icons/` (Capsa method, Solid and Line, 97 glyphs; rules, old to new names and the migration plan in `docs/ICONS.md`, sheet at `/design/icons`). Until the migration lands, components still render the set below.
24 x 24 line glyphs, 1.5 stroke, round ends, `currentColor`. `size` `s` 16, `m` 20, `l` 24 or a number; `stroke` overrides the 1.5. `solid` gives the filled form (for the current item, `flame`, the wanted `star`). `label` only when the icon is the whole control. Icons (`ui/icons.ts`): navigation `menu`, `close`, `home`, `map`, `finds`, `explainers`, `lore`, `search`, `grid`; arrows `arrow-right`, `arrow-left`, `arrow-down`, `arrow-up-right`, `chevron-right`, `chevron-left`, `chevron-down`; actions and states `pin`, `play`, `sun`, `moon`, `check`, `question`, `cross`, `dot`, `filter`, `layers`, `plus`, `minus`, `share`, `link`, `hand`, `info`, `alert`; media and kinds `clip`, `film`, `article`, `chat`, `radio`; the wanted level `star` (line = hollow, solid = filled), `star-flash` (dashed, a flashing star), `flame`; the home hero `image`, `wire`, `sound`, `sound-off`; and one per find category (`egg`, `person`, `keyhole`, `globe`, `car`, `candle`, `crosshair`, `star`, `gem`, `flag`, `bolt`, `ghost`, mapped in `categoryIcon()`). Solid icons cut their inner detail with `--icon-cut`; set it to the ground the icon sits on. A diagonal arrow means "opens another site"; a chevron means "opens here".

### Logo (`ui/Logo.astro`, `src/brand/logo.ts`)
`variant` `lockup` (default: the mark and THE VICE FILES on one line), `stacked` (Chime's two-line panel) or `mark`; `height` in px (the folder's height; the stacked wordmark's height); `tone` `site` (pink folder, navy VF, wordmark in `currentColor`; any ground, both themes) or `on-pink` (navy folder, pink VF, for a pink ground); `label` only when the logo is not inside a labelled link. Clear space is half the folder's height; the lockup is never under 13.5 px tall, the mark never under an 11 px folder, and at 32 px and under the mark uses Chime's small drawing. Favicons come from the same code (`pnpm brand:icons`, LG6). Rules: [LOGO.md](LOGO.md).

### LevelTable (`ui/LevelTable.astro`)
Every table on the site. A sheet on `--surface-1` (radius 20, 24 padding, 1px edge), no cell borders, a 30% label column, rows striped full width (white 4% dark, `#f8f8f8` light), values centred when every cell in the column is 28 characters or fewer, a quiet footnote. A row can carry a level badge: the rounded hexagon in `--level-1` to `--level-5` with a glyph, and the label in the same colour (ink in light). On the phone a long value drops under the short one. Explainer markdown tables render through it automatically.
```astro
<LevelTable head={['State', 'How it looks']} rows={[{ label: 'In Pursuit', badge: { icon: 'star', solid: true, tone: 3 }, cells: ['White stars'] }]} footnote="Source: GTABase" />
```

### Clip (`Clip.astro`)
16:9 frame (`ratio` to change it) with the creator's thumbnail and a glass play circle (`.clip__play` in `components.css`, the one play control, also used by the home clip chapter); the player (youtube-nocookie) loads on tap. `spoiler` or `mature` show a gate on the glow with a reveal pill, and no thumbnail loads until it is revealed. The gate never clips: in a frame 420 wide or less it goes compact (tighter gaps, the text one type step down), and if it is still taller than the clip's ratio the frame grows to hold it until the clip is revealed. `caption={false}` drops the credit line when the page credits the creator elsewhere.

### Timeline (`lore/Timeline.astro`)
One selected moment at a time. `headingLevel` (default 1) sets the headline's level: the page's h1 on `/gtaverse` pages, 2 where it is embedded (`/design/timeline`); moment titles and their "more" headings follow one and two levels below. Its curves are read from the motion tokens. Desktop: Grok hairline across the page, mono year labels on 1px ticks, V7 ruler ticks hanging under the line, event ticks in pink, a square marker; the moment's date, serif title and description under the marker with Queue's polaroid to the right; V7 outline arrow pills, arrow keys, Home and End (keyboard moves never animate). Phone: Queue sheet with a scrubbing year ruler (native scroll and snap) under a fixed centre tick, the serif headline with a quote mark, the polaroid, "Watch the clip", the serif body; swipe to move. The track moves with `--ease-in-out` 500ms; the moment swap is direction aware: the old moment stops moving at 120ms and fades by 160ms, the new one moves in from 120ms over 280ms (never two slides at once). The polaroid settles into its tilt as it arrives, the phone ruler's year rolls, and thin accent arcs join the moment to the nearest moments that share its first game, drawn after the band has landed. Reduced motion: fades only.

### Header (`site/Header.astro`)
- Island: 470 x 48 from 1280 (400 from 1024, 336 from 768; LR7), centred, 32 from the top (8 on the phone, where it spans the width less 16 each side), glass, radius 4. Left: the menu button and the logo (the one-line lockup, an 18 px folder, LG7). Right: Map and the theme toggle. It stays above the open menu; its menu button turns into the close cross.
- Menu (decisions M1 to M8, the owner's BitcoinOS pick): one full screen surface on `--bg` that grows out of the island. Desktop (1280 and wider), three columns inside the gutter: the art panel (shape 0.76, cut corners 56, radius 8) with its caption and credit under it and the theme button below; the guide (search pill 48 high with a white round submit, "[ The guide ]" in mono, five rows of number, icon, heavy caps label in Big Shoulders 900 at 32 to 44, mono superscript count and arrow, between 1px hairlines, then "[ Latest finds ]", the utility links About, Finders, Data, Submit a find, and the chapter setting); and "[ Games ]" (group labels, rows 32 high with the 104 x 28 plate, short name and count, the trademark line; a name too long for the column wraps to a second, balanced line instead of truncating, and its row grows by 4). Below 1280, one scrolling sheet: the art is a banner 112 to 168 high that stays at the top, then search, links (32 caps, rows 56), Games (rows 52, 120 x 36 plates), latest finds, utility links. The current link has the solid icon and the current pill; hover glides the travelling pill.
- Art (`src/lib/menu.ts`): hovering (after 60ms), focusing or touching a link with `data-art-key` crossfades the panel to that picture in `--dur-image-in`, only once it is decoded, over the old one, so the ground never flashes. Games show their official cover art (`public/media/menu/`, built by `pnpm logos:fetch`), main links the hero wallpapers and Map our coast drawing; no file means the sunrise glow. The starting picture loads on open, the rest at low priority once the surface has grown.
- Motion (M4): open, the surface clip grows from the island in `--dur-morph` on `--ease-out`; the art fades from 100ms and settles from scale 1.04 by 500ms; the links rise 16px from 320ms with gaps of 40, 35, 30, 25ms; the other sections fade in at 400ms. Close: words fade in 100ms while the surface folds back in `--dur-morph-out` on `--ease-standard`. Keyboard: no motion. Reduced motion: the surface fades in `--dur-fade-reduced`, nothing moves.
- Behaviour: Escape closes, focus stays inside the header while open and returns to the menu button, the page behind is `inert` and does not scroll. `vf:open-games` (a document event) opens the menu on the Games list.
- Sub bar (NEON): pass `sub={{ href, label, image }}` to `Base` on pages with a hero. Desktop only, hidden while the menu is open. Add `data-subbar="hidden"` on the header to step it away (the home page does this once the hero scrolls off).

### GamePlate (`games/GamePlate.astro`)
The official logo, scaled to fit a fixed box with `object-fit: contain` on the fixed dark plate (`--logo-plate`, radius 8, 1px edge), never recoloured, filtered or cropped. Without a fetched official file it is a text plate (the short name in display caps). `size`: `rail` 104 x 28, `sheet` 120 x 36, `chip` 64 x 22, `hub` 280 x 64. `alt` stays empty when the name is visible beside it; pass the full title where the plate stands alone (hub header).

### GameChips (`games/GameChips.astro`)
"Also in": a caps label and one touch chip per game, oldest first, each linking to `/gtaverse/games/[id]`: the shared `Chip` with the chip plate in its `lead` slot and the short name. `level` sets the label's tag. Renders nothing for no games.

### GameLens (`games/GameLens.astro`)
`?game=<id>` on a page: items with `data-lens-games` that do not list the id get `data-lens-off` (hidden), `data-lens-group` hides when empty, a "Showing" caps label with the selected chip (close icon) clears it, and "Game hub" links on. The timeline listens (`vf:game-lens`) and dims and skips the other moments.

### ChapterControl (`ChapterControl.astro`) and Spoiler (`Spoiler.astro`)
ChapterControl: "I'm on" and a pill select (40 high, 44 and 16px on the phone so iOS does not zoom); every copy stays in sync. Spoiler: a `<details>` on `--surface-2` with a dashed edge, the muted caps badge ("Spoiler, Chapter 3") and a pink "Reveal" as its summary; it opens by itself once the chapter setting reaches it.

### Game cursors (`CursorControl.astro`, `src/scripts/cursor/`, LR48 to LR52)
The menu's "Cursor" select (Normal, Player arrow, Pistol) beside the theme button, the same pill as "I'm on"; hidden on touch and under reduced motion. Off by default; `vf-cursor` in localStorage. When on, `cursor.ts` loads and sets a real CSS cursor from `src/icons/cursors.ts` (generated: `locate` and `weapon` in the halo form, 32 px, coloured `--inverse-fill` with a `--bg` keyline for the theme). It only replaces the default arrow: its rules sit in the `vf-cursor` cascade layer, so links, buttons, reading text, every form control (`cursor: revert`), editable text and a spoiler's summary keep their native cursor. The trail (tracers in `--accent-ink` behind the arrow, puffs in `--text-3` from the pistol) is WAAPI transform and opacity in one `pointer-events: none`, `aria-hidden` layer, capped at 8 or 6 marks, each gone in `--dur-trail` (280ms); none over the native cursor, while a button is held, or while the tab is hidden.

### React twins (`map/ui.tsx`)
The map is a React island, and Astro components cannot render inside it. `ui.tsx` renders `Icon`, `Button`, `Chip`, `Badge`, `Verification` and `Tabs` with exactly the classes and markup of the Astro components, reading the same `icons.ts`; their look lives once, in `components.css`. Change a component's look there, never in the twin.

### Map (`/map`, `components/map/`)
- Scope: every rule in `map.css` sits under `:where(.vf-map)`, the class on the map's root (`.map-app`, and the root of the `/design` specimens), so its class names (`.sheet`, `.tabs`, `.media`, `.field`) never restyle other components. `:where()` adds no specificity, so the cascade inside the map is unchanged. A new rule starts with `:where(.vf-map) `.
- Desktop (round 2, owner decision Q4 A): the map is full bleed and everything floats over it. Felt's Legend | List panel top left (`--map-panel-w`, 16 under the island, radius 8, glass, 1 px edge), headed by Jeff christy C12's HUD (region title in thin and bold Big Shoulders caps, a 40 x 2 rule, the objective chip that sums up the type filter and opens the filter menu, the Found checklist); Legend rows are the type filters (blip 24, label, count, `aria-pressed`); the List rows are 96 high with a 72 still and a Found check. The find opens in Jeff christy C08's frosted panel at the right (`--map-detail-w`): clip, hanging tab, corner ticks, title between hairlines, number box, status lines, numbers pair, icon row, Details and Sources tabs. C12's hint row runs along the bottom (FILTERS, 2D | 3D, LAYERS, then zoom level, scale and credit), with Fit, minus and plus at the right. Menus open beside whichever control opened them (up from the bottom row, down from the panel). C12's vignette (`--map-vignette`) and grid (6% lines, square ticks).
- Phone: Corner's round 44 buttons in the top corners under the island (basemap and layers; filters with a count), active filters as a row that bleeds off the right edge, a pills row (Found, 2D | 3D, Fit) and an edge-to-edge category rail of blips over the bar (list toggle and search pill). A tapped pin brings Hypelist's card carousel (native scroll snap; swiping pans the map). Tide Guide glass menus and hint toast. Apple Maps sheet with the clip on top, with C08's numbers. Sheets drag 1:1 and release into a critically damped spring.
- Pins: the round-2 blips (`docs/ICONS.md`) from `src/icons/blips-map.ts` via `map/blip.tsx`, anchored at the pointer tip in a 44 px button; label tags (inverse fill, 1 px keyline, radius 4, wrap at 180 px, never clipped) on hover, focus, selection and at zoom 4+ with a collision pass; selected is the 40 px pin with an accent keyline, a `--blip-glow` disc and a ticked 1 px ring; clusters are stacked plates with an accent count and a member list on hover or focus.
- Collectible layers (decisions C1 to C7): off by default, switched in the Legend's layer block and the basemap menu (`LayerRows`), or by `?layer=`. Pins are the coral collectible blip at 20 (28 selected), drawn on one canvas (`map/blipCanvas.ts`, aria-hidden) that follows the map's zoom; zoomed in, the checklist number shows in a tag. A tap or click opens the collectible card (`.ccard`) in the detail slot (desktop) or the card slot (phone). While a layer is on, the credit adds "Collectible locations: Game Checklists".
- Every find opens from the list, so the map works with no pins. Filters (type chips; verification, clip, spoilers, mature and region in the menu) are remembered on the device (`vf-map-filters`); spoilers and mature are hidden by default. `/map?find=<slug>` opens a find.
- 3D view (`map/three/`, docs/MAP-3D.md): the 2D | 3D segmented pill in the bottom row, the compass in the bottom right group, the honesty line as a glass caption pill above it. 3D pins are the same blip pins on a stem; collectibles the same coral blip pins. The view fades in over the 2D map, which stays mounted.
- Found tracker: the drawer's check icon button and the phone sheet's "Found" action are toggles (`aria-pressed`, pressed = inverse fill); the filter menu's Found group holds "Hide found", found counts per type and the export and import code field (a 16px input so iOS does not zoom).

### Page layouts
- `layout="page"` (default): content sits in `.container.page`, below the floating island.
- `layout="bare"`: full width (heroes, the map). Add your own `.container` for content that should line up.

### Search and sharing (`Base.astro`, `src/lib/seo.ts`, `src/lib/routes.ts`)
- Every page gets a canonical URL, Open Graph and Twitter tags and its own Open Graph card: a 1200 x 630 PNG drawn at build time (`src/lib/og.ts`) on the night navy ground with the sunrise glow, the kicker in pink caps, the title in Big Shoulders 900, one meta line in Inter and the logo (the one-line lockup, LG5). Text only: never Rockstar art or a YouTube still.
- `src/lib/routes.ts` lists every public page; the sitemap, `llms.txt` and the cards are built from it. A new page type goes there.
- Search engines are kept out by one switch, `site.indexable` in `src/lib/site.ts` (robots meta, `X-Robots-Tag` in `dist/_headers`, `robots.txt`).

### Policy pages and credits
- The footer carries a second row: the policy pages (`src/lib/trust.ts`), "Submit a find", "Suggest a correction" (prefilled GitHub issue links from `.github/ISSUE_TEMPLATE/*`, `src/lib/issues.ts`) and the RSS feed. The legal paragraphs stay word for word.
- `/finders` rows reuse the find page's credit card (avatar initial on the pink tint, name, platform) with an outline "Profile" pill and a 44px ghost circle per original post.

## Art and stills

The home hero's background is the exception: Rockstar's official trailer clips and wallpapers, built at deploy and credited, and our own line art (docs/HERO.md, decisions H1 to H4). The header menu's art panel is the second: each game's official cover art and the same hero wallpapers, built at deploy and credited under the panel (decisions M2, M3). Everywhere else the only art on open pages is the creator's own YouTube thumbnail (`findStill()`), served by YouTube, never re-hosted. Spoiler and mature finds never show art outside their reveal (`showcaseable()`). Shorts are skipped (portrait thumbnails). Anything without art gets `--glow-hero`.

## Masks and fades

- **Fades** (`.fade-top`, `.fade-bottom`, `.fade-y` in `components.css`, length `--fade-length`): a mask on eased stops, so a picture or a dark band dissolves into the page's own ground in either theme. Used by the hero (its art runs 160px past the hero and fades there) and the footer's band and art strip (LR11). Never over text.
- **Readout mask** (LR12): one radial mask over a whole picture that carries our text, clear where the picture matters and darkening toward the text. Not a scrim per text block. Spotlight's is the reference.
- **Check:** `node tools/page-check/contrast.mjs` turns every picture pure white (the worst case) and measures every line of text against what is behind it (AA: 4.5:1, 3:1 for large text). Rockstar media is blocked throughout.

## The design system page (`/design`)

`/design` is this document, live: built from the code on every build, noindex and out of the sitemap, the route list and the SEO check (`public/_headers` and `scripts/check-seo.mjs` cover `/design` and `/design/*`). Tokens are read from `tokens.css` (with their use from this file's tables when the CSS has no comment), contrast is computed, components are the real components with their props and notes read from their own sources, and every motion demo plays the real tokens. Its parts live in `src/components/design/`; specimens that need a page of their own (the timeline, whose phone layout follows the window width and which is embedded there at `headingLevel` 2, and the map's parts, so the map's stylesheet loads only there) sit in frames at `/design/timeline` and `/design/map-parts` (`Frame.astro`). A "Demo data / Worst case" switch (`?data=worst`) swaps text-bearing specimens to the longest values in our content. The icon sheet is `/design/icons`. A new token or component shows up there on the next build; a new component needs a specimen in `ComponentsSection.astro`.

## Known decisions open to the owner

See the "design foundation" rows in `docs/DECISIONS.md`.
