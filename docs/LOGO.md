# Logo directions

Status on 24 Nov 2026: **seven directions, none chosen yet.** The owners pick one (or two to refine) before anything goes into the site.

## Where to look

**Figma: [The Vice Files, page "Logo Directions"](https://www.figma.com/design/Hi3d7hLiVfY2YfBM7HL4uQ)**

The file sits in Chime's drafts on the GenAI-Labs Figma team. If the link asks for access, request it from there and Chime will add you.

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

- **Colours from our own tokens** (`src/styles/tokens.css`): pink `#F976B0` on navy `#0D0C1A`, with cream `#F9F5F0`, blush `#FBD3E6`, surface `#1F1F38` and wine `#8D4053`. The owner fixed this palette: directions differ in style, not in colour.
- **No Rockstar or GTA marks** (decisions 6 and GS1): no game logo, no Rockstar logo, no GTAArtDeco or Pricedown, nothing that reads as official. Every mark is an original drawing.
- **No Rockstar material went into any tool.** The marks were drawn from scratch as vector shapes; no screenshot, art or map was used as a reference.
- **Fonts with open licences**, all on Google Fonts: Big Shoulders, Archivo, Syne, Fraunces, DM Serif Display and Inter (SIL Open Font License), Permanent Marker (Apache 2.0). Big Shoulders is already our display face (decision D2).

## The seven directions

| # | Name | The mark | Wordmark type | Why it fits |
|---|---|---|---|---|
| 1 | **Case File** | A pink folder with "VF" on it | Big Shoulders Black, caps | Every find is a file: sourced, credited, filed. Closest to the site today (same font and palette), so the cheapest to adopt. Works as a favicon at 16 px. |
| 2 | **Filed Pin** | A map pin with a folder inside it | Archivo ExtraBold, lowercase | The map is the product; every pin opens a file. The only direction where the hero sits on navy. |
| 3 | **The Seal** | A round badge reading "THE VICE FILES • FIELD GUIDE • LEONIDA" around a keyhole | Big Shoulders Black, caps | A field guide stamp, and the keyhole says "secrets unlocked". The ring text drops out at small sizes, where a plain keyhole badge takes over. |
| 4 | **Unfolded** | A "V" made of two panels of a folded paper map, with a dashed route ending in a pin | Syne ExtraBold, caps | Map, file and the V of Vice in one shape. **On probation:** the owner is not sure about it yet. |
| 5 | **Marked** | A hand-drawn marker loop circling "VF", with a scribbled "found it!" | Big Shoulders Black plus Permanent Marker | Circling a spot on a map, the way finders mark a discovery. The only hand-drawn direction. |
| 6 | **Postcard** | A perforated stamp with a pink sunset and "VF", under "Greetings from Leonida" | DM Serif Display | Plays on old Florida postcards without borrowing any game art. The most editorial of the seven. |
| 7 | **Cracked** | A pink egg with a zig-zag crack | Fraunces Black, lowercase | The most literal: we crack open Easter eggs. Soft, friendly type. |

## How we got here

The owner reviewed the directions in rounds on 24 Nov 2026 and kept only the ones they liked:

1. A first set of three sketches (Case File, Filed Pin, a wordmark stamp).
2. Five full boards in mixed palettes. Kept: Case File, Filed Pin. Dropped: Redacted (typewriter with a censor bar), Night Shift (neon script), The Lens (magnifying glass). Instruction: stay pink and navy, change the style instead.
3. Three new styles in pink and navy. Kept: The Seal. Dropped: Pixel Blip (8-bit monogram), Sunset Stripe (striped V).
4. Two more. Kept: Marked. Dropped: Clipped (paperclip), as too generic. Unfolded replaced it.
5. Three extras to challenge Unfolded. Kept: Postcard, Cracked. Dropped: Route (a one-line VF monogram).

## What happens after the pick

1. **Choose.** Reply on the pull request or tell Chime: one direction, or two to refine.
2. **Refine in Figma:** spacing, the mark at 16, 32 and 180 px, a one-colour version, light and dark grounds.
3. **Land it in the site.** The CI asset guard blocks committed `.svg` files, so the logo ships the way the icons do (decision IC3): as SVG markup in code. It replaces the text wordmark in the header island and the text in the Open Graph cards (decision SF2).
4. **Favicon.** A favicon file is a binary asset, so it needs an owner decision and an entry in the asset guard allowlist in `.github/workflows/ci.yml` (CONTRIBUTING.md, "Files that must never be committed").
5. Record the choice in `docs/DECISIONS.md` and update `docs/DESIGN-SYSTEM.md`.
