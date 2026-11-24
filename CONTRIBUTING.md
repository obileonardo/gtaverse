# Contributing to The Vice Files

Thanks for helping. Most contributions are content: a new find, a better source, a fixed location or a credit correction. Code and design changes are welcome too.

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Report a wrong fact, a broken link or a missing credit:** open an issue with the "Correction" template.
- **Suggest a find:** open an issue with the "New find" template, with at least one source URL.
- **Ask for a takedown or a credit change** for a clip or post you made: use the "Takedown or credit request" template, or email takedown@thevicefiles.com if you prefer private contact. We act within 48 hours.
- **Propose a feature or a code change:** open an issue first and say what problem it solves, so we can agree on the approach before you build it.
- **Report a security problem:** do not open a public issue. See [SECURITY.md](SECURITY.md).

Good first tasks are labelled `good first issue`. The research conflicts in [docs/NOW.md](docs/NOW.md) ("Chime's first queue") are also open to anyone who can check them in game or find a better source.

## Set up

You need Node 22.23.4 or later and pnpm 10 (`corepack enable` uses the version pinned in `package.json`).

```sh
pnpm install
pnpm validate   # content checks
pnpm dev        # local site
pnpm build      # validate, then build the static site
```

The map base layer is optional for most work: `pnpm map:fetch` then `pnpm map:tiles` build it locally from Rockstar's download (needs `unzip`). See [docs/MAP.md](docs/MAP.md).

## Branches and pull requests

`staging` is the ground-truth branch. `main` is the released state and moves only when the maintainers say so.

1. Open an issue, or pick an existing one.
2. Branch from the latest `staging`: `git fetch origin` then `git switch -c your-branch origin/staging`. Never branch from or merge `main`.
3. Make one focused change. Keep unrelated edits out of the pull request.
4. Run `pnpm validate` and `pnpm build`. Both must pass.
5. Open a pull request into `staging` with `Closes #<issue>`, fill in the checklist, and paste the `pnpm validate` summary.
6. CI runs the same checks on every pull request. A maintainer reviews and squash-merges. Do not merge your own pull request.

Commit messages: a short line in plain English saying what changed ("Add the Kent Paul substation find"), with detail in the body when it helps.

## Content rules

[docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) is the full guide. The rules that never bend:

1. **Every GTA VI fact has a source URL.** No URL, no fact. Unknown fields stay `null`.
2. **Embed, never re-host.** Clips come only from official platform embeds (YouTube, X, TikTok, Reddit).
3. **No leaks, no piracy.** Nothing from leaked builds, pre-release footage, "archive" maps or the accounts that share them.
4. **Credit the finder** whenever a source names who found it first.
5. **Do not copy other people's work.** Summaries in your own words; pins placed from clips or in game, never copied from another map.

Also:

- **No AI on Rockstar material.** Do not feed Rockstar screenshots, art, the map, trailers or any other Rockstar image into AI tools, for generation or for analysis (including reading colours or labels from them). Rockstar's terms forbid it ([docs/LEGAL.md](docs/LEGAL.md)).
- **No em dashes.** Use a comma, colon or period. The validator fails on them.
- Spoiler and mature flags are set where needed; rumours stay `draft` until a second independent source exists.

## Files that must never be committed

- **No images, fonts, video, audio or archives.** Not Rockstar media, not screenshots from other sites or design references, not font files. Fonts load from Google Fonts at build time; clips are embedded from their platforms.
- **No map files or tiles, no hero media.** `.cache/`, `public/map/` and `public/media/` are git-ignored; keep them that way (docs/MAP.md, docs/HERO.md).
- **No secrets** (`.env` files are ignored).

CI fails any pull request that adds an image, font, video, audio or archive file. If a change genuinely needs an original asset (for example a favicon drawn for the project), say so in the issue first; the maintainers decide and add it to the allowlist in `.github/workflows/ci.yml`.

## Licence of your contribution

By contributing, you agree that your contribution is licensed under the same terms as the project:

- code under the [MIT License](LICENSE);
- content (data, explainers, research and documentation prose) under [CC BY-NC 4.0](LICENSE-CONTENT).

You confirm that you wrote it, or that you have the right to submit it under those terms. Do not submit material you copied from somewhere else. No sign-off line or separate agreement is needed.

Game names, images, logos and trademarks belong to Rockstar Games and Take-Two Interactive and are not licensed by this repository, so contributions must not add their files.
