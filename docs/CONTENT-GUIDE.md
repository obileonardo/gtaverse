# Content guide

How to add or fix content in The Vice Files. Written for contributors (hi Chime). If something here is unclear, open an issue rather than guessing.

## The five rules that never bend

1. **Every GTA VI fact has a source URL.** No URL, no fact. If you are unsure, leave the field `null` and say why in `notes`.
2. **Embed, never re-host.** Clips come only from official platform embeds: YouTube, X, TikTok, Reddit. Never download a video or screenshot from someone else and upload it.
3. **No leaks, no piracy.** Nothing from leaked builds, pre-release footage, "archive" maps, PC ports of leaked builds, or the accounts that share them. Sources marked `blocked` in `content/sources.json` are never cited, linked or embedded.
4. **Credit the finder.** If a source names who found it first, they go in `first_finder`. Crediting is how we earn the community's trust.
5. **Do not copy other people's work.** Write summaries in your own words. Do not paste text from guide sites, and never from AI-written SEO sites. Do not copy pins from Game Checklists, MapGenie, GTABase, State of Leonida or any other map: use them to cross-check only. Do not feed Rockstar screenshots, art or the map into AI tools (Rockstar's terms forbid it).

## Where things live

| File | What it holds |
|---|---|
| `content/finds.json` | Every find on the map. |
| `content/connections.json` | Lore items linking GTA VI to other Rockstar games. |
| `content/regions.json` | Counties, regions, districts, towns, islands, water. |
| `content/categories.json` | Find categories and the 12 collectible map layers. |
| `content/sources.json` | Every creator, outlet, wiki and account we cite. |
| `content/explainers/*.md` | Explainer pages. |
| `schema/*.schema.json` | The exact shape of each file. Read the `description` fields. |
| `research/` | The original research. Read-only history: do not edit. |

## Adding a find, step by step

1. **Search first.** Check `content/finds.json` for the same thing under another name.
2. **Trace it to the earliest post.** Find the first Reddit, X, TikTok or YouTube post you can. That person is the `first_finder` if the post shows they found it.
3. **Find a second independent source.** A second video from a different creator who shows it in their own game counts. Two wiki pages copying each other count as one. GTA6Info and gta6wiki.eu are aggregators, so they are useful but they are not independent confirmation of each other.
4. **Pick the verification level** (below).
5. **Add the sources to `content/sources.json`** if the creator or outlet is not there yet. Articles are registered by outlet (for example `gamerant`); YouTube channels as `yt-<name>`; X accounts as `x-<handle>`; Reddit users as `reddit-u-<name>`.
6. **Add the find** using the template below.
7. **Link it.** Add region ids to `region_ids` and add the find id to each of those regions' `evidence_finds`. If it clearly matches a lore item, add the connection id to `related_connections` and the find id to that connection's `related_finds`. Only link where a source supports the match.
8. **Run `pnpm validate`** and fix everything it reports. It tells you the exact list it expects when two sides are out of sync.
9. **Open a pull request** that links an issue (see "How to submit").

### Find template

```json
{
  "id": "short-kebab-case-name",
  "slug": "short-kebab-case-name",
  "title": "What it is, in a few words",
  "status": "draft",
  "category": "easter-egg",
  "verification": "single-source",
  "spoiler": false,
  "mature": false,
  "chapter_gate": null,
  "area": "Area as the sources describe it, including any disagreement",
  "region_ids": ["key-lento"],
  "location_description": "How to get there, in your own words.",
  "pin": null,
  "summary": "What happens and why it matters, in your own words.",
  "crossover_games": [],
  "related_connections": [],
  "first_finder": null,
  "clip": null,
  "sources": [
    {
      "source_id": "yt-robbin-rams",
      "type": "youtube",
      "url": "https://www.youtube.com/watch?v=...",
      "creator": "Robbin Rams",
      "published": null,
      "embeddable": true,
      "fetched": true
    }
  ],
  "notes": null,
  "updated_at": "2026-11-23"
}
```

Field notes:
- `id` and `slug`: lowercase, hyphens, unique. Keep them the same.
- `status`: start at `draft`. Switch to `published` once the find meets the rules below.
- `category`: an id from `content/categories.json` with `kind: "find"`.
- `area`: free text. If guides disagree, say so here ("Disputed: Bobcat Key or Watson Bay").
- `pin`: leave `null`. Pins are placed on the official Rockstar map in pixel coordinates in a later step, from clips, never copied from another map.
- `first_finder`: `{ "handle": "u/name", "platform": "reddit", "url": "https://..." }`, or `null` when no source names them. `url` may be `null` if the person has no public link.
- `clip`: must be one of the find's own sources with `embeddable: true` on YouTube, X, TikTok or Reddit. Shape: `{ "platform", "url", "creator", "source_id" }`.
- `fetched`: `true` only if you actually opened and read the page.
- `notes`: conflicts between sources, credit details, anything a reviewer should know.
- `updated_at`: today's date, `YYYY-MM-DD`.

## Verification levels

| Level | Meaning | Can it be published? |
|---|---|---|
| `multi-source` | Two or more independent sources show or confirm it. | Yes |
| `single-source` | One source, or several that all trace back to one original report. | Yes, labelled as single-source |
| `rumor` | Reported but not shown, or the only source could not be checked. | No: stays `draft` (the validator enforces this) |
| `debunked` | Shown to be false, a hoax or satire. | Only as an explicit myth-busting entry |

When a rumor gets a second independent source, upgrade it and publish it.

## Credit rules

- Credit the first finder by handle, with a link, whenever a source names them.
- Credit every creator whose clip or article we use, in the find's `sources`.
- If the press credits someone without a link, write their name in `notes` and leave `url` null. Never guess a profile URL.
- If a creator asks us to remove their clip or change their credit, we do it within 24 hours, no questions (see [LEGAL.md](LEGAL.md)).
- On the site every discovery card shows "Found by [creator]" with a link, and "Image (c) Rockstar Games" where an official image is used.

## Spoiler rules

Set `spoiler: true` when a find reveals story content or only becomes reachable through story progress beyond the opening. Use `chapter_gate` when a source states the chapter.

- Spoiler finds are hidden by default on the site, clip included.
- Never embed a clip that is mainly an isolated cutscene, an ending, or a story reveal. Rockstar's posting policy names these as takedown targets. If the only clip is like that, set `clip: null`.
- Never embed isolated in-game TV shows, cartoons or comedy performances for the same reason.
- Explainers stay spoiler-free. If a detail is a story spoiler, leave it out.

## Mature rules

Set `mature: true` for sexual content or anything else clearly adult beyond the game's baseline violence. Mature finds are age-gated on the site. Memorials to real people are not mature, but they are written with care: they are real bereavements.

## What we never add

- Money glitches, duplication exploits, cheats or mod menus. Rockstar's posting policy lists "Encouraging Cheating" as a takedown trigger.
- Anything from leaks, pre-release footage or piracy.
- Content copied from AI-generated or SEO guide sites. Those sites (gta6tuto and similar, marked `caution` in sources) can be leads only, never the sole source.
- Claims that an NPC is a real person unless Rockstar confirmed it. Write "fans compare X to Y".

## Lore connections

Connections in `content/connections.json` use confidence levels: `canon` (exists in game, documented), `strong` (several independent reports), `speculative` (fan reading or single source), `debunked` (false or satire). A theory is never `canon` unless Rockstar confirmed it.

## Regions

Only add a region with a source URL or at least one find that names it. Add `vibe` tags (rich, dangerous, rural and so on) only when a source supports them, and put that wording in `vibe_note`. The game has no official danger or wealth rating, so never invent one.

## Explainers

Explainers are Markdown files in `content/explainers/` with frontmatter:

```markdown
---
title: Wanted level and heat
slug: wanted-level-and-heat
status: draft
spoiler: false
updated_at: 2026-11-23
sources:
  - url: https://example.com/source-one
    title: Source one (Outlet)
---
```

- Cite every claim with `[n]`, where `n` is the position in `sources` (starting at 1). The validator rejects any paragraph, list item or table row without a citation.
- Lines starting with `Note:` are editorial statements about our method. They need no citation and must not contain game facts.
- Known gaps go in HTML comments: `<!-- gap: what is missing and why -->`.
- Link to finds, connections and regions with `[[find:id]]`, `[[connection:id]]`, `[[region:id]]`. The validator checks they exist.
- The frontmatter parser supports only `key: value` lines and the `sources` list shown above.

## Writing style

- No em dashes anywhere. Use a comma, colon or period. The validator fails on them.
- Short sentences, plain words, British or American spelling is fine but stay consistent within an entry.
- State uncertainty plainly: "reportedly", "one guide says", "unconfirmed".

## How to submit

1. Open an issue (use the "New find" or "Correction" template) or pick an existing one.
2. Create a branch from the latest `main`.
3. Make your change and run `pnpm install` once, then `pnpm validate`.
4. Open a pull request with `Closes #<issue>` and fill in the checklist.
5. Do not merge your own pull request; the owner reviews.
