# Security policy

## Reporting a vulnerability

Please report security problems privately through GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the problem, how to reproduce it and what it affects.

https://github.com/obileonardo/thevicefiles/security/advisories/new

Do not open a public issue or pull request for a security problem. The maintainers will reply in the advisory, agree a fix with you there, and credit you when the fix is published unless you ask not to be named.

## What is in scope

- The static site built from this repository (`src/`) and served at thevicefiles.com, including how content URLs end up in links and embeds.
- The content validator (`scripts/validate.mjs`), which is the gate that stops unsafe links (for example `javascript:` URLs) reaching the site.
- The build and the GitHub Actions workflows in `.github/workflows/`.
- The local map pipeline (`scripts/map/`) and the local map harness (`tools/map-harness/`).
- The PRD page in `prd/`.

## What is out of scope

- Rockstar Games, Take-Two, YouTube, X, TikTok, Reddit, Google Fonts and Cloudflare services themselves. Report those to their owners.
- Content accuracy, credit or copyright requests. Use the issue templates, or email takedown@thevicefiles.com for copyright concerns.

## Supported versions

The site is deployed from the latest code. Only the current `staging` and `main` branches receive fixes.

## How the project limits risk

- The site is static: no server code, no accounts, no forms, no user data.
- Content URLs are restricted to `http` and `https` by the validator, and CI runs the validator on every pull request.
- Clips load from `youtube-nocookie.com` only when a visitor presses play.
- GitHub secret scanning and push protection are on; no credentials live in the repository.
