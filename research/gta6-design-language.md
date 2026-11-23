# GTA 6 design language

Research date: 2026-11-23. Labels: **[measured]** read directly by this agent from Rockstar's live site files or the official share image; **[fetched]** from a page read during research; **[snippet]** search summary only.

Primary files measured:
- Official page: https://www.rockstargames.com/VI (HTML, 59 CSS chunks and about 60 JS chunks fetched on 2026-11-23)
- Official share image (og:image, 1200x630): https://www.rockstargames.com/VI/_next/static/media/meta.0t8ty~nlmxq2s.jpg

Nothing was re-hosted; files were read in a temporary folder and deleted.

**IP warning for GTAVerse:** the logo, the GTAArtDeco typeface and the key art are Rockstar property. GTAArtDeco is licensed only for Rockstar brand material and is not for sale. Pricedown is a commercial Typodermic font. Use the language below as direction (palette mood, layout rhythm, motion), not as assets. A fan site that copies the logo or fonts invites takedowns and confuses users about affiliation.

## 1. Logo

- **Structure:** a huge "VI" numeral with "grand theft auto" stacked on three lines across its centre in heavy white letters with a black outline. The wordmark is a mix of lowercase with a capital R ("gRand"), Pricedown's odd unicase forms. [measured visually from the share image; FontAlternatives, Mladen Ruzicic, 15 Nov 2026 [fetched] https://fontalternatives.com/blog/gta-6-font/]
- **Numeral fill:** a sunset gradient. Rockstar publishes no values. A fan measurement (gtavi-designs.com by kerim0x1, 18 Nov 2026 [fetched] https://gtavi-designs.com/) samples six stops top to bottom:
  `#4C5FCA` (0%) > `#813DBB` (22%) > `#CC46A0` (44%) > `#F76685` (62%) > `#FF885F` (80%) > `#FFA948` (100%).
  My own spot samples of the share image found pinks around `#E353CE`, oranges around `#FE7E4F` and blues around `#7399DA` in the numeral, consistent with that ramp but not a substitute for it (JPEG compression shifts values).
- **Outline system:** white keyline `#FFFFFF` around the fill, then a deep violet outer line `#1E0031`; a violet band `#300355` to `#710682` (gtavi-designs [fetched]).

## 2. Colour palette

### From the official site CSS [measured]
Six recurring three-stop radial gradients (each used 4 times), all `radial-gradient(62.79% 100% at 50% 0%, A 0%, B 50%, C 100%)`. They read as light-from-above "sunset glass" fills:

| Name (mine) | Stop 0% | Stop 50% | Stop 100% |
|---|---|---|---|
| Sunrise | `#FFDF80` | `#F4717C` | `#E963C7` |
| Lemon flamingo | `#FFFF99` | `#F5899B` | `#E963BC` |
| Peach | `#FFCC99` | `#F59289` | `#E9639B` |
| Lime coral | `#EEFF99` | `#F5C089` | `#F47187` |
| Mint lagoon | `#99FFAA` | `#89F5E3` | `#799FEC` |
| Sky orchid | `#99CCFF` | `#9B89F5` | `#D263E9` |

Most frequent single accent: **`#F976B0`** (hot pink, 15 uses, set as several CSS custom properties).

Dark surfaces (each 9 to 13 uses): `#0D0C1A`, `#1F1F38`, `#252644`, `#2F2E52`, `#38365D`, `#433F6A`, `#5A5589` (navy-violet ramp) and a wine-purple ramp `#251229`, `#31223E`, `#3E1A37`, `#4B2F54`, `#4D203E`, `#5B2742`, `#6B2E47`, `#8D4053`. Greens `#243830`, `#294235` and blues `#273C5C`, `#2C3868` also appear (probably region-themed sections).

Rockstar's shared design system tokens ("foundry-global-color-*") are also present: a yellow ramp (for example `#FCAF17` at 500), a seafoam grey ramp, and white at many alphas. These are Rockstar-wide, not GTA VI specific.

### From the official share image [measured]
- Panel gutter / background between the art panels: **`#1D002E`** (deep aubergine; matches gtavi-designs' "Board" value).

### Summary palette for a designer
- Night base: `#0D0C1A` to `#1F1F38` (blue-black), with `#1D002E` aubergine for frames.
- Signature accent: `#F976B0` pink.
- Sunset ramp: blue-violet `#4C5FCA` through magenta `#CC46A0` and coral `#F76685` to amber `#FFA948`.
- Pastel highlights: mint `#89F5E3`, lavender `#9B89F5`, peach `#F59289`.
- Text: white, or cream `#FFF1DC` on dark (gtavi-designs).

## 3. Typography

| Use | Typeface | Evidence |
|---|---|---|
| Logo wordmark | Pricedown (Ray Larabie, Typodermic), the series title font since GTA III; Rockstar has not credited it for VI | FontAlternatives, gtavi-designs [fetched]. Reading of the artwork, not a credit |
| "VI" numeral | Custom artwork, not a font | same |
| Official site headings and UI | **GTAArtDeco**: Regular, Medium, Bold, Condensed Bold, Condensed Heavy. Copyright "November 2023 Rockstar Games, Inc.", designed by **Colophon Foundry** per Fonts In Use and the font metadata | [measured]: site loads `GTAArtDeco_*.woff` and CSS families `ArtDecoRegular`, `ArtDecoMedium`, `ArtDecoBold`, `ArtDecoCondensedBold`, `ArtDecoCondensedHeavy`; Colophon credit from gtavi-designs and Fonts In Use via FontAlternatives [fetched] |
| Script accents | **Rage Italic** (`RageItalicStd`, a classic ITC script) | [measured] the site loads `RageItalicStd-*.otf` |
| Body copy | Helvetica Now Display, Helvetica Now Text, Helvetica Neue LT W1G | [measured] @font-face rules |
| CJK | Noto Sans JP, KR, SC, TC (Medium, Bold, Black) | [measured] |
| In-game HUD | Not identified by any source. GTA V used Chalet 1960 / Chalet Comprime 1960 (Fonts In Use), which does not prove GTA VI does | FontAlternatives [fetched] |

Character of the site type: condensed, heavy art deco display caps, tight negative tracking (`-0.015em` is the most common letter-spacing), fluid sizes via `clamp()`, uppercase used about 20 times in the CSS [measured].

## 4. Layout, shape and material (official site) [measured]

- **Pill and circle shapes dominate:** most common radii are the design system's `pill`, `circle` and `50` tokens.
- **Frosted glass:** `backdrop-filter: blur(6.25px)` (most common), `blur(13px)`, `blur(25px)` and a strong `blur(150px) brightness(1.2) saturate(2.5)` glow layer.
- **Soft vignettes and fades:** many linear masks from black to transparent (`#000 60%` to `#0000 100%`), used to fade video and imagery into the dark page.
- **Key art collage:** the share image is a grid of hand-painted panels separated by thick aubergine gutters, with the logo overlapping the centre. Panels: Lucia and Jason embracing with a pistol, a seaplane-helicopter over the skyline, a speedboat with a flamingo, an armed man in shades, a woman in a football jersey with a drink, a yellow supercar by art deco hotels, an alligator, a rapper in gold chains, a wheelie bike with a police car [measured visually].

## 5. Loading screen and key art style

The series' loading screens are painted character illustrations. For VI the official art (share image above, and the cover) shows: semi-realistic painted figures, crisp graphic edges, strong rim light, saturated pastel skies (lilac, peach, pink, cyan), sunset colour grading and dramatic low angles. Each panel has its own pastel sky colour, which creates the patchwork rhythm. [measured visually; no Rockstar description of the style was found]. Search results describing it as "cel-shaded" come from AI-filter marketing sites and are not authoritative [snippet].

## 6. HUD and map UI (in-game)

Source: https://gta6info.com/wiki/HUD [fetched] plus GTABase wanted guide [fetched].
- **Minimap:** bottom left, wide rectangular, with 3D depth while driving [snippet for shape]; **pink GPS route** with distance readout. Police are not shown as dots.
- **Status bars:** moved to the top left (no longer under the minimap as in GTA V): pink heart (Health), lightning bolt (Stamina; screen edges darken when empty), purple eye (Focus), plus armour and O2 when relevant.
- **Top right:** cash (green wallet), BuckMe balance (purple "b"), weapon and ammo, wanted stars.
- **Wanted stars change style by state:** hollow (suspect unknown), white (in pursuit), flashing (visual lost), red (heat). Red heat icons below the stars show what police know (face, outfit, vehicle, weapon, partner, CCTV). A coloured screen-edge glow and a red "reported crime" zone replace cop blips [snippet for glow].
- **Contextual HUD:** "Bars and icons appear when they matter and fade away when they don't."
- **Focus overlay:** weak points tinted red (lethal) or yellow (non-lethal).
- **Map screen:** starts fogged ("Unfogging the Map" mechanic); WAiNK-scanned landmarks turn from grey to colour on the map. No fetched source describes the pause menu layout or blip iconography in detail. **Gap:** blip icon style needs screenshots from launch coverage.
- **Reception:** one designer's Medium essay argues the UI "looks cheap" partly on purpose [snippet] https://medium.muz.li/gta-6s-ui-looks-cheap-as-a-product-designer-i-think-that-s-partly-the-point-6e397b2ddbc2

## 7. Motion on rockstargames.com/VI [measured]

- **Libraries:** GSAP with **ScrollTrigger** (scroll-driven timelines, many `scrub` references) and **Lenis** smooth scrolling. No Framer Motion. Heavy use of video elements.
- **Pattern:** long scroll-scrubbed sequences where video and painted art layers (hero background, foreground, overlay; separate mobile and desktop assets, per the Vice City page structure [fetched]) move at different depths, fading through black masks.
- **CSS easing in use:** `cubic-bezier(.455,.03,.515,.955)` (easeInOutQuad, most common), `(.645,.045,.355,1)` (easeInOutCubic), `(.4,0,.2,1)` (Material standard), `(.32,.72,0,1)` (iOS-style sheet curve), `(.77,0,.175,1)` (easeInOutQuart).
- **Durations:** UI colour and background transitions 0.2 to 0.25 s ease-in-out; opacity fades 0.15 to 1 s; a 0.5 s ease-out lift on transform for cards.
- **Feel:** slow, cinematic, scroll-owned reveals for content; quick, quiet micro-transitions for controls.

## 8. Takeaways for a GTAVerse look

- Dark navy-violet base, not pure black; aubergine frames.
- One loud pink accent; sunset gradients reserved for hero moments.
- Pastel "per-region" colour coding is native to the brand (six radial gradients); maps well onto six regions.
- Condensed heavy display caps plus a neutral grotesk for body. Pick licensable equivalents rather than Rockstar's files.
- Pills, frosted glass and soft fades over hard boxes.
- Scroll-scrubbed hero, but snappy map interactions.
