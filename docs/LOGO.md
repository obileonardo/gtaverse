# Logo

**Chosen: Case File, designed by Chime.** Elvis picked direction 1 on 24 Nov 2026 (decision LG5) and it is implemented from Chime's exported SVGs; Chime may polish it later. A folder with "VF" cut in it, beside THE VICE FILES in Big Shoulders Black caps. Every find is a file: sourced, credited, filed.

## The logo in the site

| Where | What |
|---|---|
| `src/brand/logo.ts` | The drawing: Chime's own outlines (no live text), taken once from the Figma export, moved to the origin and rounded to 0.01. `MARK` (logo panel), `MARK_SMALL` (mark sheet, 32 px and under), `WORDMARK` (one line, from the board's signature lockup), `WORDMARK_STACKED` (logo panel). Renderers: `lockupSvg()`, `stackedSvg()`, `markSvg()`, `faviconSvg()`, `appIconSvg()`. No imports, so Node, Astro and satori all use it. |
| `src/components/ui/Logo.astro` | The component: `variant` `lockup` (default), `stacked` or `mark`; `height` in px; `tone` `site` or `on-pink`; `label` only when it is not inside a labelled link. |
| Header island | The one-line lockup, 18 px folder, 16 px caps, in the link "The Vice Files, home" (desktop, phone and with the menu open). |
| Open Graph cards | The one-line lockup, 36 px folder, white wordmark, bottom left (`src/lib/og.ts`). |
| Favicons | `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (180), `icon-512.png`, `site.webmanifest`, drawn by `pnpm brand:icons` (`scripts/brand/build-favicons.mjs`) and allowed by exact path in the CI asset guard (LG6). `pnpm test` fails if they drift from the logo code. |
| `/design`, Logo | Lockups, mark sizes, clear space, colours, favicons, do and don't, all rendered from the code. |

Rules:
- **Colours** are tokens only: the folder `--accent` (pink `#F976B0`), the VF `--on-accent` (navy `#0D0C1A`), the same in both themes, as on Chime's mark sheet; the wordmark takes the text colour. On a pink ground use `tone="on-pink"` (navy folder, pink VF, navy wordmark), as on Chime's logo panel. Blush is not approved (LG4).
- **Clear space**: half the folder's height on every side.
- **Minimum sizes**: the one-line lockup 13.5 px tall (12 px caps); the mark an 11 px folder (the 16 px favicon). At 32 px and under the mark uses Chime's small drawing.
- **Never** retype the wordmark as live text, stretch, outline, add effects, recolour outside the tokens, or set the logo beside a Rockstar or game mark as one lockup.
- **To update** after Chime polishes it: replace the four path constants in `src/brand/logo.ts` from the new export, run `pnpm brand:icons`, commit `public/`.

What differs from Chime's files (decisions LG7 to LG10): the header uses the board's one-line signature lockup with the VF mark in place of its plain folder; the site colourway is the mark sheet's (pink folder, navy VF) rather than the logo panel's navy folder, which would vanish on the navy island; the 16 px favicon is the 32 px drawing scaled; the touch and manifest icons are composed after Chime's app icon panel.

## The seven directions (history)

By Chime, 24 Nov 2026. Seven directions were shortlisted; Case File was chosen.

## Where to look

**Figma: [The Vice Files, page "Logo Directions"](https://www.figma.com/design/Hi3d7hLiVfY2YfBM7HL4uQ)**

The file sits in my drafts on the GenAI-Labs Figma team. If the link asks for access, request it and I will add you.

The page has a title row and then seven boards, left to right, each 1200 x 1080. Every board has the same six panels, so the directions compare like for like:

| Panel | What it shows |
|---|---|
| Logo | The mark and the wordmark together, on the brand pink (Filed Pin uses navy) |
| Tagline | A headline in the direction's type, with the small signature lockup |
| App icon | The mark as an app icon in a dock, next to two generic apps for scale |
| Browser tab or Social profile | The mark as a favicon on thevicefiles.com, or as an avatar on a profile card |
| Posters | Three portrait posters: a line of copy, the mark alone, a second line |
| Palette | The colours the direction uses |

Everything in Figma is editable: text is real text in the brand fonts, marks are vectors, panels are named frames.

## The rules every direction follows

- **Colours from the site tokens** (`src/styles/tokens.css`): pink `#F976B0` on navy `#0D0C1A`, with cream `#F9F5F0`, surface `#1F1F38` and wine `#8D4053`. I fixed this palette: the directions differ in style, not in colour. The boards also use a blush `#FBD3E6`, which is **not** a site token: the chosen logo uses token colours only unless Elvis approves blush (decision LG4).
- **No Rockstar or GTA marks** (decisions 6 and GS1): no game logo, no Rockstar logo, no GTAArtDeco or Pricedown, nothing that reads as official. Every mark is an original drawing.
- **No Rockstar material went into any tool.** The marks were drawn from scratch as vector shapes; no screenshot, art or map was used as a reference.
- **Fonts with open licences**, all on Google Fonts: Big Shoulders, Archivo, Syne, Fraunces, DM Serif Display and Inter (SIL Open Font License), Permanent Marker (Apache 2.0). Big Shoulders is already the site's display face (decision D2).

## The seven directions

| # | Name | The mark | Wordmark type | Why it fits |
|---|---|---|---|---|
| 1 | **Case File** | A pink folder with "VF" on it | Big Shoulders Black, caps | Every find is a file: sourced, credited, filed. Closest to the site today (same font and palette), so the cheapest to adopt. Works as a favicon at 16 px. |
| 2 | **Filed Pin** | A map pin with a folder inside it | Archivo ExtraBold, lowercase | The map is the product; every pin opens a file. The only direction where the hero sits on navy. |
| 3 | **The Seal** | A round badge reading "THE VICE FILES • FIELD GUIDE • LEONIDA" around a keyhole | Big Shoulders Black, caps | A field guide stamp, and the keyhole says "secrets unlocked". The ring text drops out at small sizes, where a plain keyhole badge takes over. |
| 4 | **Unfolded** | A "V" made of two panels of a folded paper map, with a dashed route ending in a pin | Syne ExtraBold, caps | Map, file and the V of Vice in one shape. **On probation:** I am not sure about it yet. |
| 5 | **Marked** | A hand-drawn marker loop circling "VF", with a scribbled "found it!" | Big Shoulders Black plus Permanent Marker | Circling a spot on a map, the way finders mark a discovery. The only hand-drawn direction. |
| 6 | **Postcard** | A perforated stamp with a pink sunset and "VF", under "Greetings from Leonida" | DM Serif Display | Plays on old Florida postcards without borrowing any game art. The most editorial of the seven. |
| 7 | **Cracked** | A pink egg with a zig-zag crack | Fraunces Black, lowercase | The most literal: the site cracks open Easter eggs. Soft, friendly type. |

## How I got here

I reviewed the directions in rounds on 24 Nov 2026 and kept only the ones I liked:

1. A first set of three sketches (Case File, Filed Pin, a wordmark stamp).
2. Five full boards in mixed palettes. Kept: Case File, Filed Pin. Dropped: Redacted (typewriter with a censor bar), Night Shift (neon script), The Lens (magnifying glass). My call: stay pink and navy, change the style instead.
3. Three new styles in pink and navy. Kept: The Seal. Dropped: Pixel Blip (8-bit monogram), Sunset Stripe (striped V).
4. Two more. Kept: Marked. Dropped: Clipped (paperclip), as too generic. Unfolded replaced it.
5. Three extras to challenge Unfolded. Kept: Postcard, Cracked. Dropped: Route (a one-line VF monogram).

## After the pick

1. **Chosen:** Case File (LG5).
2. **Refine in Figma:** open. Chime may polish spacing, the small sizes and a one-colour version; the site takes the new paths when they come.
3. **Landed in the site:** done, as SVG markup in code (IC3), in the header island and the Open Graph cards (SF2).
4. **Favicon:** done, with the owner's OK and exact-path allowlist entries (LG6).
5. Recorded in `docs/DECISIONS.md` (LG5 to LG10) and `docs/DESIGN-SYSTEM.md`.
