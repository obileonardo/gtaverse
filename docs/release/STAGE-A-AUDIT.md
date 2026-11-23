# Open-source readiness: Stage A audit

Audit date: 2026-11-23. Scope: `origin/staging` at `731f5ba`, the full history of every public ref (all 7 branches plus `refs/pull/3,4,7,8,10/head`, 17 commits), and the text of all 12 issues and pull requests. Method: the owner's "GitHub open-source readiness" master prompt, Stage A only. Nothing was remediated, no setting was changed, no history was touched.

This repository is public, so this report is public too. It names files and lines, never values: no secret was found, and personal data is referred to by location only.

Status labels used below: **Confirmed** (seen in repo evidence), **Probable** (needs a check), **Recommended** (improvement), **Not verified** (could not check), **Owner** (needs an owner or legal decision).

---

## 1. Executive summary

The Vice Files is an unofficial, non-commercial fan field guide to GTA VI: an Astro static site built from validated JSON and Markdown content, plus a research archive and a local pipeline that turns Rockstar's official Leonida map download into tiles. It went public on 23 Nov 2026, the day it was created.

**Engineering condition: good for its age.** The content model is strict (JSON Schemas, a validator that checks references both ways, rumor gating, citation rules and an em dash scan), the site has no server code, `pnpm install --frozen-lockfile`, `pnpm validate` and `pnpm build` all pass, and the legal rules for third-party IP are written down and mostly enforced by `.gitignore` and the validator.

**What is clean (verified):**
- No secrets in the working tree or in any commit on any public ref (gitleaks 8.30.1 over a mirror clone that includes pull request refs, plus manual pattern searches).
- No image, font, video, archive or other binary file has ever been committed on any public ref. The Rockstar map, its tiles and harness screenshots are git-ignored and never appeared in history. No Mobbin asset or reference exists anywhere in history.
- Every commit uses the noreply address. No absolute local paths, session ids or scratchpad paths in files, commit messages, issues or pull requests.
- No Cloudflare account id or zone id anywhere; `prd/wrangler.jsonc` carries only custom-domain routes.
- GitHub secret scanning and push protection are on.

**Primary release risks:**
1. **No licence at all** (no `LICENSE`, `package.json` says `UNLICENSED`). The repo is public but legally "all rights reserved", while it invites outside contributions.
2. **Personal data on public branches**, against the owner's standing rule: the owner's country of residence and personal account exposure, the contents of the owner's private X bookmark folder, and the owner's full name.
3. **No branch protection** on `staging` or `main` while a collaborator and several agents push.
4. **The default branch is `main`, a two-file stub.** Visitors see an outdated README, and GitHub reads issue templates from the default branch, so the takedown and new-find templates that `docs/LEGAL.md` relies on are not live.

**Overall recommendation: NOT READY, REMEDIATION REQUIRED.** No critical security exposure exists, so there is no reason to make the repo private. Two blockers (licence, personal data) must be resolved before it can be called open source and before community contributions are invited.

---

## 2. Repository and architecture overview

| Area | What it is | Evidence |
|---|---|---|
| Stack | Astro 7.4.13 (static output), React 19 integration (not yet used by any page), TypeScript 7 (strict), pnpm 10.32.0, Node (Astro 7 needs 22.23.4 or later) | `package.json`, `astro.config.mjs`, `node_modules/astro/package.json` engines |
| Content | `content/*.json` (85 finds, 85 connections, 59 regions, 24 categories, 120 sources, map metadata) and 5 Markdown explainers | `content/` |
| Schemas and validation | JSON Schema 2020-12 per type; `scripts/validate.mjs` (ajv) checks schemas, ids both ways, region evidence, rumor gating, clips, citations, em dashes; `uri` restricted to http and https | `schema/`, `scripts/validate.mjs:27-40` |
| Site | 175 static pages: home, map shell, finds, explainers, lore; design tokens and components; clips load as click-to-play YouTube embeds | `src/` |
| Map pipeline (local only) | Downloads Rockstar's printable map zip, verifies size and SHA-256, extracts one named JPEG, builds 970 WebP tiles into git-ignored `public/map/` | `scripts/map/*.mjs`, `docs/MAP.md`, `.gitignore:15-18` |
| Map harness (local only) | Node server bound to 127.0.0.1 with a path allowlist; Playwright screenshot script | `tools/map-harness/` |
| PRD page | Static HTML deployed separately as a Cloudflare assets-only Worker, `noindex` | `prd/public/`, `prd/wrangler.jsonc` |
| Research | Launch-week research kept verbatim as history | `research/` |
| GitHub | 3 issue templates, 1 PR template, no workflows | `.github/` |

Data flow: `research/` (history) was migrated once into `content/` (`scripts/one-off/migrate-research.mjs`), content is hand-edited from now on, `pnpm build` runs the validator then `astro build`, and fonts are fetched from Google Fonts at build time and self-hosted. Map tiles are built locally from Rockstar's download and reach the site only through the build, never through git.

Components that cannot run outside the owner's machine: none. The map pipeline needs network access to rockstargames.com and the `unzip` command; everything else needs only Node and pnpm.

---

## 3. Open-source readiness scorecard

**Scoring method.** Categories 1 to 14 carry weights that sum to 100, set by release impact for this kind of project (a public content and static-site repo with no server and no user data). PASS earns the full weight, NEEDS IMPROVEMENT earns 40 to 70 percent by judgement, FAIL or NOT VERIFIED earns 0 to 20 percent. The score is advisory. **A score never overrides a blocker.**

| # | Category | Weight | Status | Score | Priority |
|---|---|---|---|---|---|
| 1 | Security and credential hygiene | 12 | PASS | 12 | Keep |
| 2 | Git history and privacy | 10 | NEEDS IMPROVEMENT | 5 | P1 |
| 3 | Copyright and MIT licensing | 12 | FAIL | 0 | P1 |
| 4 | Third-party dependency compliance | 6 | PASS | 6 | Keep |
| 5 | Code quality and maintainability | 6 | NEEDS IMPROVEMENT | 4 | P3 |
| 6 | Architecture and modularity | 5 | PASS | 5 | Keep |
| 7 | Test reliability | 6 | NEEDS IMPROVEMENT | 3 | P3 |
| 8 | Build reproducibility | 6 | NEEDS IMPROVEMENT | 4 | P3 |
| 9 | Environment configuration | 4 | PASS | 4 | Keep |
| 10 | Documentation quality | 8 | NEEDS IMPROVEMENT | 5 | P2 |
| 11 | Contributor experience | 7 | NEEDS IMPROVEMENT | 3 | P2 |
| 12 | GitHub Actions and supply-chain security | 6 | NEEDS IMPROVEMENT | 3 | P2 |
| 13 | Repository governance | 7 | FAIL | 1 | P1 |
| 14 | Release engineering | 5 | NEEDS IMPROVEMENT | 2 | P4 |
| 15 | **Overall publication readiness** | | **NOT READY** | **57 / 100** | |

Per category:

1. **Security and credential hygiene: PASS.** Evidence: gitleaks over all history and the tree found nothing; no `.env` files tracked; no tokens, keys or credentials in any blob; the site has no server code and no environment variables; content URLs are restricted to http and https before build. Risk: low. Action: keep push protection on; add CI so the validator gate cannot be skipped.
2. **Git history and privacy: NEEDS IMPROVEMENT.** Evidence: all commits use the noreply address; no binaries ever committed; but personal data sits in `research/` and `prd/` on every ref since commit `770a87e` and `2093df0` (F-02). Action: remove from the tip; owner decides on history.
3. **Copyright and MIT licensing: FAIL.** Evidence: no `LICENSE`; `package.json:7` is `"license": "UNLICENSED"`; GitHub reports `licenseInfo: null`. Action: add a code licence and a content licence (F-01, section 7).
4. **Third-party dependency compliance: PASS.** Evidence: `pnpm licenses list`: 165 MIT, 8 ISC, 8 BSD-2, 4 BSD-3, 7 Apache-2.0, 3 BlueOak-1.0.0, 2 MPL-2.0 (lightningcss, build tool), 1 CC0, 1 LGPL-3.0-or-later (`@img/sharp-libvips`, dev only, used by the local map script, never distributed). No GPL or AGPL. Nothing is shipped to visitors except Astro's own runtime output and self-hosted OFL fonts.
5. **Code quality: NEEDS IMPROVEMENT.** Evidence: clear comments, strict TypeScript, small focused modules; `tsc --noEmit` exit 0. Gaps: no formatter or linter config, no `astro check` (so `.astro` files are not type-checked), React integration installed but unused.
6. **Architecture: PASS.** Content, schema, validation, site and map pipeline are cleanly separated; the map is swappable for an original fallback in the same pixel space (`docs/MAP.md`).
7. **Test reliability: NEEDS IMPROVEMENT.** The validator is a strong content test and PR #8 reports negative tests, but they are not committed as fixtures; there are no tests for the site and nothing runs automatically.
8. **Build reproducibility: NEEDS IMPROVEMENT.** `pnpm install --frozen-lockfile` and `pnpm build` pass on Node 24.21.0 (175 pages). Gaps: `engines.node` says `>=20` but Astro 7.4.13 requires `>=22.23.4` (F-09); the build needs network access for Google Fonts; the map needs Rockstar's 45 MB download and the `unzip` binary (undocumented prerequisite).
9. **Environment configuration: PASS.** The only variable is an optional `PORT` for the harness. `.env*` is ignored. No `.env.example` is needed today.
10. **Documentation quality: NEEDS IMPROVEMENT.** Strong legal, content, map and design docs. Gaps: README has no run or build steps and no licence section; `PROJECT.md:36-37` and `docs/NOW.md:61` are stale ("no site yet"); takedown SLA is 24 hours in `docs/LEGAL.md:43,47` and the template, 48 hours in `prd/public/index.html:374`.
11. **Contributor experience: NEEDS IMPROVEMENT.** `docs/CONTENT-GUIDE.md` and the templates are good, but the templates are not live (F-04), and there is no `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` or `SECURITY.md`. GitHub community health: 28 percent.
12. **GitHub Actions and supply chain: NEEDS IMPROVEMENT.** No workflows exist (so no workflow attack surface) and the default token is read-only, but: no CI, Dependabot alerts and security updates off, 3 high advisories on `sharp` 0.34.5, any action allowed and SHA pinning not required.
13. **Repository governance: FAIL.** No branch protection and no rulesets on `main` or `staging`; merge commits and rebase merging are allowed (the owner's repos are squash-only); private vulnerability reporting is off; wiki and projects are on and unused; default branch is the stub `main`.
14. **Release engineering: NEEDS IMPROVEMENT.** Version 0.1.0, no tags, releases or changelog. Appropriate for a pre-launch project; needs a light process before the first public release.

---

## 4. Critical release blockers

Both blockers are about open-source status and the owner's rules, not about an active security exposure. Neither requires taking the repo private.

| ID | Blocker | Evidence | Why it blocks |
|---|---|---|---|
| **B1** (F-01) | No licence for code or content | No `LICENSE` file on any branch; `package.json:7` `"license": "UNLICENSED"`; GitHub `licenseInfo: null` | Without a licence nobody may legally reuse, fork or modify the code or content, and contributions arrive with no stated terms, while `docs/CONTENT-GUIDE.md`, three issue templates and the collaborator model all invite them. "Open source" cannot be claimed. |
| **B2** (F-02) | Personal data on public branches and in history | `research/legal-fan-site.md:239` (owner's country of residence), `:70`, `:242-243` and `PROJECT.md:23` (owner's personal Rockstar account and personal-domain exposure analysis); `research/x-bookmarks-gta-vi-build.md:3` and the whole file (contents of the owner's private X bookmark folder); `prd/public/index.html:181` (owner's full name) | The owner's standing rule: no personal data on the public repo. Intrinsic sensitivity is low to moderate, and the full name is already shown on the owner's GitHub profile, so the owner may choose to accept the name. |

No other blocker was found within the scope of this audit. This does not guarantee the repository is free of every risk.

---

## 5. Detailed findings register

Severity: BLOCKER, HIGH, MEDIUM, LOW, INFO. Confidence: High, Medium, Low.

### F-01 No licence (BLOCKER, High)
- **Affected:** repository root, `package.json:7`.
- **Evidence:** no `LICENSE*` on any of 82 paths ever committed; GitHub API `licenseInfo: null`.
- **Explanation:** default copyright applies. Code, content and research cannot be reused, and inbound contributions have no terms. A single MIT file would also be wrong, because content, research and third-party material need different treatment (section 7).
- **Impact:** blocks open-source status and safe acceptance of community pull requests.
- **Remediation:** add `LICENSE` (MIT, code), `LICENSE-CONTENT` (chosen content licence), a licensing map in the README, a third-party and trademark notice, and set `package.json` `license` to an SPDX expression for the code. Inbound terms in `CONTRIBUTING.md` (inbound equals outbound, optionally DCO sign-off).
- **Verify:** GitHub shows the licence in the sidebar; `package.json` license is valid SPDX; README maps every top-level path to a licence.
- **Owner approval:** yes (copyright holder, content licence, DCO).

### F-02 Personal data on public branches and in history (BLOCKER under the owner's rule, High)
- **Affected:** `research/legal-fan-site.md:70,185,239,242-243`; `PROJECT.md:23`; `research/x-bookmarks-gta-vi-build.md` (whole file, line 3 states the source); `prd/public/index.html:181`.
- **Evidence:** blob-level search of every historical blob (114 blobs) and the tree. These lines exist since the research import (`770a87e`) and the PRD commit (`2093df0`) and are on `staging`, `content-foundations`, `prd-page`, `map-base`, `site-scaffold`, `design-foundation` and their pull request refs.
- **Explanation:** a public legal-risk analysis names where the owner lives and what account the owner could lose; the bookmark file discloses private account activity (which posts the owner saved), even though the posts themselves are public.
- **Impact:** low to moderate personal exposure; conflicts with the owner's standing rule.
- **Remediation:** Stage B edits the tip: generalise the jurisdiction and account lines to non-personal wording ("the owner's jurisdiction", "a maintainer's Rockstar account"), reword the bookmark file's provenance or move the file to a private location and keep only the derived leads, and replace the owner's name in the PRD with "Owner" or the GitHub handle (owner's choice). History: see section 6, option H1 or H2.
- **Verify:** search the tip for the cited strings returns nothing; history decision recorded in `docs/DECISIONS.md`.
- **Owner approval:** yes (what counts as personal here, and the history option).

### F-03 No branch protection or rulesets on `staging` or `main` (HIGH, High)
- **Evidence:** `GET /branches/main/protection` and `/branches/staging/protection` return 404 "Branch not protected"; `GET /rulesets` returns `[]`; ChimeXXD has `write`.
- **Impact:** anyone with write (a collaborator, an agent session with the owner's token) can push directly to `staging` (ground truth) or `main`, force-push over history, or delete either branch. The documented model (decision 16) is not enforced.
- **Remediation:** a ruleset on `main` and `staging`: require a pull request, block force pushes and deletion, require the CI check from F-07 once it exists, restrict `main` updates to the owner. Owner configures this in GitHub settings (Stage B can prepare the exact settings).
- **Verify:** API shows the ruleset; a direct push to `staging` is rejected.
- **Owner approval:** yes (settings change).

### F-04 Default branch is the stub `main`; templates and docs are not live (HIGH, High)
- **Evidence:** `defaultBranchRef: main`; `main` is `124dbf9` "Initial commit: README and gitignore"; community profile reports `issue_template: null`, `pull_request_template: null`, health 28 percent, although `.github/ISSUE_TEMPLATE/*.md` exist on `staging`.
- **Explanation:** GitHub reads issue templates, community files and the repo front page from the default branch. The takedown template that `docs/LEGAL.md` ("The repository has a 'Takedown request' issue template") relies on is not offered to visitors.
- **Impact:** the public takedown route is broken (the email route still exists, see F-12); visitors see an outdated README; the repo looks empty.
- **Remediation, two options:** (a) make `staging` the default branch (keeps `main` as the released state; matches decision 16 because PRs already target `staging`); or (b) fast-forward `main` to `staging` on the owner's go. Recommend (a) now and (b) at the first release.
- **Owner approval:** yes.

### F-05 Contradiction between the AI rule and the research record (MEDIUM, Medium)
- **Affected:** `research/gta6-design-language.md:6,15,18,70`; `docs/LEGAL.md` ("No AI processing of Rockstar content"); `docs/CONTENT-GUIDE.md` rule 5.
- **Evidence:** the research states that an agent fetched 59 CSS chunks and about 60 JS chunks of Rockstar's site and sampled colours from the official share image by eye ("My own spot samples of the share image").
- **Explanation:** the project's own rule, citing Rockstar ToS 2.3, forbids feeding Rockstar content into AI tools. Whether reading and measuring for research counts as prohibited "processing" is a legal judgement, but the public record documents it, and the map agent (decision M5) treated the same rule strictly.
- **Impact:** inconsistency a hostile reader could cite; low legal likelihood.
- **Remediation:** owner decides whether the rule covers analysis (not only generation); then either reword the research provenance or record a clarified rule in `docs/DECISIONS.md`. Do not delete research without approval.
- **Owner approval:** yes.

### F-06 Dependency advisories on `sharp` 0.34.5 (MEDIUM, High)
- **Evidence:** `pnpm audit`: 3 high: GHSA-f88m-g3jw-g9cj (libvips CVEs, fixed in 0.35.0), GHSA-rgj7-g3m4-5g8c (libheif, fixed in 0.35.4), GHSA-wq5f-xc86-pv6w (librsvg, fixed in 0.35.5). `package.json` pins `"sharp": "~0.34.5"`, which cannot reach 0.35.
- **Explanation:** `sharp` is a dev dependency used only by the local map scripts on Rockstar's JPEG, whose SHA-256 is verified first; it is not shipped to visitors. Real exploitability is low.
- **Remediation:** raise to `~0.35.5` in its own PR, rebuild tiles and confirm byte-level tile parity checks still pass (`docs/MAP.md` verification). Enable Dependabot alerts.
- **Owner approval:** no for the bump PR; yes for enabling alerts (setting).

### F-07 No CI; the validator gate depends on the build command (MEDIUM, High)
- **Evidence:** no `.github/workflows/`; `package.json` `build` runs `node scripts/validate.mjs && astro build`, but `astro build` alone skips validation, and the link sanitising for `href={s.url}` (`src/pages/finds/[slug].astro:19,29`, `src/components/Clip.astro:17,20`) relies on the validator's http and https rule.
- **Impact:** a contributor PR that breaks content or adds a `javascript:` URL is caught only if someone runs `pnpm validate` locally.
- **Remediation:** one workflow on `pull_request` into `staging` and `main`: checkout, pnpm setup, `pnpm install --frozen-lockfile`, `pnpm validate`, `pnpm build`, an asset guard (F-08). `permissions: contents: read`, no secrets, no `pull_request_target`, actions pinned to verified commit SHAs (looked up at implementation time, not invented here).
- **Owner approval:** yes (adds a workflow).

### F-08 No automated guard against third-party assets (MEDIUM, High)
- **Evidence:** today no binary has ever been committed (82 text paths, largest blob 161 KB, pack 297 KiB), and `.gitignore` covers the map. But protection is manual, and upcoming UI branches work from design references (issue #12 names many third-party apps as references).
- **Remediation:** a CI step (and optional validator rule) that fails on any image, font, video, archive or PDF outside an explicit allowlist (for example an original favicon), and on any file under `public/map/` or `.cache/`. Document the rule in `CONTRIBUTING.md`: never commit Rockstar media, Mobbin or other reference screenshots, or font files.
- **Owner approval:** yes (with F-07).

### F-09 Node engine range is wrong (MEDIUM, High)
- **Evidence:** `package.json` `"engines": { "node": ">=20" }`; Astro 7.4.13 declares `node >=22.23.4`.
- **Impact:** contributors on Node 20 or early 22 get confusing failures.
- **Remediation:** set `engines.node` to `>=22.23.4`, add `.nvmrc` or `.node-version`, state it in the README.
- **Owner approval:** no.

### F-10 GitHub security features partly off (MEDIUM, High)
- **Evidence:** secret scanning and push protection enabled; Dependabot alerts disabled (API 403 "disabled"), Dependabot security updates disabled, private vulnerability reporting `enabled: false`, no `SECURITY.md`, `isSecurityPolicyEnabled: false`.
- **Remediation:** enable Dependabot alerts and security updates, enable private vulnerability reporting, add a short `SECURITY.md` (what is in scope: the site, the build, the harness; how to report: private vulnerability reporting).
- **Owner approval:** yes (settings).

### F-11 Stale and inconsistent documentation (MEDIUM, High)
- **Evidence:** `PROJECT.md:36-37` "No visual design or site code yet"; `docs/NOW.md:61` "Nothing is deployed; there is no site yet" and "Waiting on owner" lists PRs already merged; README has no `pnpm dev` or `pnpm build` steps, no Node version, no licence section; takedown response time differs (24 hours in `docs/LEGAL.md:43,47` and `.github/ISSUE_TEMPLATE/takedown-request.md:8`, 48 hours in `prd/public/index.html:374`); `unzip` is an undocumented prerequisite of `pnpm map:fetch`.
- **Remediation:** refresh README (what, run, build, validate, map pipeline, licensing, legal, contributing, security), update `PROJECT.md` and `docs/NOW.md`, align the SLA (owner picks 24 or 48 hours).
- **Owner approval:** SLA choice only.

### F-12 Takedown mailbox delivery not verified (LOW, Medium)
- **Evidence:** `docs/LEGAL.md:35` and `docs/NOW.md` say forwarding for takedown@thevicefiles.com is "being set up". DNS shows Cloudflare Email Routing MX records for thevicefiles.com, so routing exists.
- **Not verified:** end-to-end delivery. The owner should send a test message and record the result.

### F-13 Merge policy does not match the owner's standard (LOW, High)
- **Evidence:** `mergeCommitAllowed: true`, `rebaseMergeAllowed: true`, `squashMergeAllowed: true`, `deleteBranchOnMerge: false`.
- **Remediation:** squash only, delete head branches on merge. Owner setting.

### F-14 Personal domain in schema ids and docs (LOW, High)
- **Evidence:** every `schema/*.schema.json:3` `$id` is `https://rockstarworld.elvisobi.com/schema/...`; the personal subdomain also appears in `README.md`, `PROJECT.md`, `docs/LEGAL.md`, `docs/DECISIONS.md`, `docs/NOW.md`, `prd/wrangler.jsonc`, `prd/public/index.html`.
- **Explanation:** decisions 2 and 15 make this an owner choice and the domain is already public. But schema `$id`s should point at the primary domain (decision 15), and every mention ties the project to the owner's personal domain.
- **Remediation:** move `$id`s to `https://thevicefiles.com/schema/...` (validator compiles by file, so ids are cosmetic; confirm with `pnpm validate`); keep or drop the second address in docs per owner choice.

### F-15 Repository name, description and topics (LOW, Medium)
- **Evidence:** repo name `gtaverse` (contains the GTA mark; decision 3 keeps it for now); description "Fan-made field guide to GTA VI and the Rockstar universe" lacks "unofficial"; no topics; homepage empty.
- **Remediation:** description "Unofficial, non-commercial fan field guide to GTA VI (The Vice Files)", homepage `https://thevicefiles.com` once live, topics such as `astro`, `static-site`, `fan-site`, `json-schema`. Rename stays an owner decision.

### F-16 Rockstar-measured colour values reused in design tokens (INFO, High)
- **Evidence:** 15 hex values (one of them plain white) appear in both `research/gta6-design-language.md` (measured from Rockstar's site CSS and a fan measurement) and `src/styles/tokens.css`.
- **Explanation:** single colours are not protected by copyright; the risk is cumulative trade dress ("looks official"), which decisions 6, 7 and 18 already manage by banning logos, the GTAArtDeco font and copied icons. Recorded so the owner sees it in one place; no change recommended.

### F-17 Third-party requests from visitors' browsers (INFO, High)
- **Evidence:** home and find pages load thumbnails from `i.ytimg.com` on page view (`src/lib/media.ts:13`, `src/components/Clip.astro:14`); the player itself loads only on click from `youtube-nocookie.com`.
- **Explanation:** fine legally (decision 8, D3), but the comment "no tracking on load" in `Clip.astro:2` is only true for the player. A short privacy note on the site should say thumbnails come from YouTube and analytics are Cloudflare Web Analytics (cookieless). Site work, not repo work.

### F-18 Code quality tooling gaps (LOW, High)
- **Evidence:** no Prettier, ESLint or EditorConfig; no `astro check` (and `@astrojs/check` not installed); `@astrojs/react`, `react`, `react-dom` installed but no `.tsx` or React island exists yet.
- **Remediation:** add `.editorconfig` and `astro check` to CI; leave React until the map UI decides (issue #12 may use it). No sweeping formatting pass.

### F-19 Unused repo features (LOW, High)
- **Evidence:** `hasWikiEnabled: true`, `hasProjectsEnabled: true`, nothing in either.
- **Remediation:** disable the wiki (docs live in `docs/`); leave Projects if the owner plans to use it.

### F-20 Validator negative tests not committed (LOW, High)
- **Evidence:** PR #8 reports negative tests (bad pins, labels, grid) passing, but no fixtures or test script exist in the tree.
- **Remediation:** commit a small `scripts/validate.test.mjs` with invalid fixtures under `scripts/fixtures/`, run in CI.

---

## 6. Security and privacy assessment

### Coverage

| Check | Tool or method | Scope | Result |
|---|---|---|---|
| Secrets in history | gitleaks 8.30.1, `git --all` log options, redacted | Mirror clone of every public ref including `refs/pull/*` (16 commits with diffs, about 2.15 MB) | No leaks found |
| Secrets in tree | gitleaks `dir` | Worktree at `731f5ba` | No leaks found |
| Credential patterns | Manual search of all 114 historical blobs for `token`, `secret`, `password`, `api_key`, `account_id`, `zone_id`, `CLOUDFLARE_`, 32-hex ids, IPv4 | All blobs | Only 127.0.0.1 in harness code; no ids, no credentials |
| Personal data | Manual search for local paths (`/Users/`, `/Volumes/`, `/private/tmp`), scratchpad and session paths, owner names, personal emails, phone patterns, country | All blobs, commit messages, 12 issue and PR bodies with comments and reviews | Findings F-02 and F-14 only; no local paths; only project, third-party outlet and Take-Two contact emails |
| Commit identity | `git log --all` author and committer | 17 commits | All `74096579+obileonardo@users.noreply.github.com` or GitHub's noreply |
| Third-party assets | Every path ever committed, blob sizes, pack size, searches for image, font, video, archive and data-URI content, and for "mobbin" | All refs | No binary file ever committed; the only data URI is a small inline SVG play icon in `prd/public/index.html:113`; no Mobbin reference |
| GitHub settings | GitHub REST API | Repo | See F-03, F-04, F-10, F-13 |

Tool note: trufflehog is not installed, so verification of live credentials was not run; gitleaks plus manual search found nothing to verify. Local branches `map-ui`, `pages-ui` and `bookmarks-deep-read` have no commits beyond `staging` at audit time and are not pushed, so they are out of scope; they should pass the F-08 guard before they are pushed.

### Application security

- **Static site, no server code, no auth, no user data, no forms.** Most of OWASP Top 10 is not applicable.
- **Output encoding:** Astro escapes expressions by default. The two `set:html` uses are safe: `src/components/ui/Icon.astro:26` renders static markup from `icons.ts`, `src/components/ui/Tabs.astro:32` renders already-rendered slot HTML.
- **Link injection:** content URLs land in `href` attributes. The validator restricts `uri` to http and https (`scripts/validate.mjs:32-40`), which blocks `javascript:` URLs, but only when validation runs (F-07).
- **Embeds:** YouTube player loads on click from `youtube-nocookie.com` with a fixed URL built from a parsed video id.
- **Security headers:** the PRD page sets `nosniff`, `Referrer-Policy` and `noindex` (`prd/public/_headers`). The main site has no `_headers` yet (no CSP, no frame options). It is not deployed; handle it with the deploy.
- **Local tools:** the harness server binds to 127.0.0.1 and rejects paths outside an allowlist after normalisation (`tools/map-harness/serve.mjs:18-21`); the map fetch verifies content type, zip signature, size and SHA-256, and extracts exactly one expected entry through `execFileSync` with an argument array (no shell). No issues.
- **Adversarial view of the public repo:** an attacker gains nothing operational: no credentials, no account or zone ids, no private endpoints, no admin surfaces. Realistic vectors are social and procedural: a malicious content PR (mitigated by F-07), a direct push by a compromised write token (mitigated by F-03), or abuse of the public takedown template once live (mitigated by the "rights holders may email privately" note and human review).

### History options for F-02

| Option | What | Pros | Cons |
|---|---|---|---|
| **H1 (recommended)** | Fix the tip only; record the decision | No disruption; low sensitivity; 0 forks, 0 stars, public for under a day | Old blobs stay reachable through history and `refs/pull/*` |
| H2 | Rewrite history to drop the lines, then force-push all branches | Removes data from branch history | Breaks every clone and in-flight agent branch; GitHub keeps `refs/pull/*` and cached views, so full removal needs a GitHub Support request; must be coordinated with ChimeXXD |

Deleting a file or adding it to `.gitignore` does not remove it from history, and rewriting history does not guarantee removal from caches, forks or anyone who already cloned. No secret was exposed, so no rotation is needed.

---

## 7. Licensing and intellectual property assessment

### Ownership
- **All 17 commits** are authored by the owner's account. ChimeXXD has write access but no commits yet, so there is no third-party contribution to clear today. This is the cheapest moment to set inbound terms.
- **AI-assisted work:** commit trailers show Claude as co-author. Copyright in purely machine-generated text is uncertain in some jurisdictions; this does not prevent applying a licence but limits how strongly it can be enforced. Owner awareness only.

### Recommended licence split (recommendation, not a decision)

| Material | Paths | Recommended | Why |
|---|---|---|---|
| Code | `src/`, `scripts/`, `tools/`, `schema/`, root configs, `prd/` code | **MIT** | The owner's standard; schemas and scripts are reusable. |
| Original writing and data | `content/` (JSON and explainers), `docs/`, `research/` (the project's own writing) | **CC BY-NC 4.0** (recommended) or CC BY 4.0 | See trade-off below. |
| Third-party material | Quotes from Rockstar, Take-Two, outlets and creators; game names, logos, images, the Leonida map, clips and thumbnails | **Not licensed by the project** | Belongs to the rights holders; used for non-commercial commentary and reference. |

**CC BY-NC 4.0 vs CC BY 4.0.** NC matches the project's own posture: the site exists inside Rockstar's tolerance for "non-commercial uses", and the content is a structured guide to Rockstar's IP. Under CC BY, an ad-funded guide or SEO site could republish the whole dataset legally from the project's side, which is the competitor type the PRD positions against. The cost: NC is not "open" under the OSI and Open Definition, it blocks reuse by ad-supported wikis such as Fandom, and "non-commercial" is fuzzy at the edges. Facts themselves (a location, a code) are not copyrightable either way; the licence covers the selection, wording and structure.

**Proposed files (Stage B, after the owner decides):** `LICENSE` (MIT), `LICENSE-CONTENT` (CC legal code reference and a short summary), a README "Licensing" section mapping paths to licences, a `NOTICE` or `THIRD_PARTY_NOTICES.md` with the trademark statement (adapted from the footer in `docs/LEGAL.md`), the OFL fonts self-hosted at build (Big Shoulders, Inter, Geist Mono, Newsreader), and "Map (c) Rockstar Games; not included in this repository". `package.json` `"license": "MIT"` (applies to the package code) with `private: true` kept.

**Copyright holder:** the MIT notice needs one. Options: the owner's legal name (conflicts with the no-personal-data rule), the GitHub handle, or "The Vice Files contributors". Owner decision.

### Dependencies
Permissive throughout; LGPL libvips and MPL lightningcss are build-time only and not redistributed. No attribution file is needed for the code dependencies today. Re-check when the map UI adds Leaflet (BSD-2-Clause) or other client libraries, because those ship to visitors.

### Third-party assets and trademarks (verified)
- Rockstar map: never committed; pipeline downloads it locally; tiles git-ignored (`.gitignore:15-18`, `docs/MAP.md`).
- Rockstar logos, GTAArtDeco, Pricedown: no files anywhere in history; docs forbid them.
- Mobbin: no asset or reference in history.
- Icons: SVG paths in `src/components/ui/icons.ts`, stated original; no copied files.
- Fonts: Google Fonts under OFL, fetched at build, not committed.
- Clips and thumbnails: embedded or hotlinked from the platforms, never re-hosted.
- Trademark: repo name contains "GTA" (F-15, owner decision 3); the footer disclaimer is solid and should also appear in the README licensing section.
- Research quotes Rockstar's policy and ToS in short excerpts for commentary; acceptable, flagged for legal awareness only.
- Tension between the AI rule and the research provenance: F-05.

---

## 8. Code quality and architecture assessment

Strengths: a small, readable codebase; the validator is the most valuable piece and is thorough; scripts are defensive (hash checks, no shell, allowlisted local server); design tokens and components are documented in `docs/DESIGN-SYSTEM.md`; decisions are logged with reasons.

Improvement opportunities, in order of value: CI that runs validate and build (F-07); committed negative tests for the validator (F-20); `astro check` in CI (F-18); correct Node engine (F-09); the `sharp` bump (F-06). No refactoring is recommended. `scripts/one-off/migrate-research.mjs` is a deliberate audit record (decision S12) and should stay, labelled as such in the README.

Public interfaces: none are offered as a supported API. The JSON Schemas are the closest thing; their `$id`s should move to the primary domain (F-14) and they should be described as "content format, may change before 1.0".

---

## 9. Documentation and contributor experience assessment

| File | Status | Need |
|---|---|---|
| `README.md` | Present, partial | Rewrite: what it is, screenshots only if safe and original, run, build, validate, map pipeline, project structure, licensing, legal, contributing, security |
| `LICENSE`, `LICENSE-CONTENT` | Missing | Required (B1) |
| `CONTRIBUTING.md` | Missing (CONTENT-GUIDE covers content only) | Short file: branch from `staging`, PR into `staging`, squash, checks to run, asset rules, inbound licence terms, points to CONTENT-GUIDE |
| `CODE_OF_CONDUCT.md` | Missing | Contributor Covenant 2.1 is the usual choice; owner must name a contact (takedown address or a separate one); not adopted without approval |
| `SECURITY.md` | Missing | Required with F-10 |
| `.github/ISSUE_TEMPLATE/*` | Present on `staging`, not live | Live once F-04 is fixed; add `config.yml` linking the takedown email for private reports |
| `.github/pull_request_template.md` | Present | Add a line for "no binary assets" and "licence of new content" |
| `CODEOWNERS` | Missing | Useful: `content/` and `docs/MAP.md` to ChimeXXD (decision 19), everything to the owner |
| `.github/dependabot.yml` | Missing | npm weekly, grouped minor and patch; GitHub Actions monthly once workflows exist |
| `.github/workflows/ci.yml` | Missing | F-07 |
| `.editorconfig`, `.nvmrc` | Missing | F-09, F-18 |
| `CHANGELOG.md` | Missing | Optional until the first release |
| `SUPPORT.md` | Missing | Not needed; issues suffice |
| `.env.example` | Missing | Not needed (no required variables) |
| `THIRD_PARTY_NOTICES.md` or `NOTICE` | Missing | Recommended for trademarks, map, fonts (section 7) |

Approachable first contributions exist in `docs/NOW.md` "Chime's first queue" (25 sourced research conflicts). The `good first issue` and `help wanted` labels already exist; a few of those items could become issues once templates are live.

---

## 10. Proposed file changes (Stage B, pending approval)

| Change | Path | Why | Finding |
|---|---|---|---|
| Create | `LICENSE`, `LICENSE-CONTENT`, `THIRD_PARTY_NOTICES.md` | Licence split and trademark notice | F-01 |
| Modify | `package.json` (`license`, `engines.node`, `sharp`) | SPDX licence, correct Node, patched sharp | F-01, F-09, F-06 |
| Modify | `research/legal-fan-site.md` (lines 70, 185, 239, 242-243), `PROJECT.md:23`, `research/x-bookmarks-gta-vi-build.md`, `prd/public/index.html:181` | Remove personal data from the tip | F-02 |
| Modify | `research/gta6-design-language.md` provenance lines or `docs/DECISIONS.md` | Resolve the AI-rule contradiction per owner decision | F-05 |
| Create | `.github/workflows/ci.yml` | Validate, build, asset guard, `astro check` | F-07, F-08, F-18 |
| Create | `.github/dependabot.yml` | Dependency alerts and updates | F-10 |
| Create | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (if approved), `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml` | Contributor readiness | F-04, F-10 |
| Create | `.editorconfig`, `.nvmrc` | Consistent setup | F-09, F-18 |
| Modify | `README.md`, `PROJECT.md`, `docs/NOW.md`, `docs/LEGAL.md` or PRD SLA line | Accuracy | F-11 |
| Modify | `schema/*.schema.json` `$id` | Primary domain | F-14 |
| Create | `scripts/validate.test.mjs`, `scripts/fixtures/` | Regression tests for the validator | F-20 |
| Settings (owner) | Default branch, ruleset, merge policy, Dependabot, private vulnerability reporting, wiki, description, topics | Governance | F-03, F-04, F-10, F-13, F-15, F-19 |

Nothing is proposed for removal except the personal lines in F-02. Research files stay, edited only where the owner approves.

---

## 11. Implementation plan

Risk is the chance of breaking the site, a collaborator's work or a legal position. Effort is wall time for one agent plus owner clicks.

| Phase | Item | Risk | Effort | Depends on |
|---|---|---|---|---|
| **1. Blockers** | 1a. Edit personal lines out of the tip (F-02), one PR into `staging` | Low (text only; `pnpm validate` scans for em dashes) | 20 min | Owner answers Q2, Q3 |
| | 1b. Record the history choice H1 or H2 in `docs/DECISIONS.md`; H2 only with a written plan, backups and ChimeXXD notified | H1 none; H2 high | H1 5 min; H2 2 h plus Support request | 1a |
| **2. Licensing** | 2a. `LICENSE`, `LICENSE-CONTENT`, notices, README licensing section, `package.json` license (F-01) | Low | 45 min | Owner answers Q1, Q4, Q5 |
| | 2b. Inbound terms in `CONTRIBUTING.md` (and DCO setting if chosen) | Low | 20 min | 2a |
| **3. Code, build, env** | 3a. Node engine and `.nvmrc` (F-09) | Low | 10 min | none |
| | 3b. `sharp` to `~0.35.5`, rebuild tiles locally, re-run the tile parity check (F-06) | Medium (tile output could shift) | 30 min | none; separate PR |
| | 3c. Validator negative fixtures and test script (F-20) | Low | 45 min | none |
| | 3d. Schema `$id`s to the primary domain (F-14) | Low | 10 min | Q7 |
| **4. Docs and contributors** | 4a. README rewrite, `PROJECT.md`, `docs/NOW.md`, SLA alignment (F-11) | Low | 1 h | 2a, Q6 |
| | 4b. `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS`, issue template `config.yml`, PR template lines, optional `CODE_OF_CONDUCT.md` | Low | 45 min | 2b, Q8 |
| **5. GitHub config and automation** | 5a. CI workflow with validate, build, `astro check`, asset guard; least privilege; SHA-pinned actions (F-07, F-08, F-18) | Low to medium (a new check can block in-flight PRs; land it after map-ui and pages-ui or make it advisory first) | 1 h | 3a |
| | 5b. `dependabot.yml` (F-10) | Low | 10 min | none |
| | 5c. Owner settings: default branch `staging`, ruleset on `main` and `staging`, squash only, delete branch on merge, Dependabot alerts and updates, private vulnerability reporting, wiki off, description, topics (F-03, F-04, F-10, F-13, F-15, F-19). Stage B writes the exact checklist; the owner clicks | Low (a ruleset may block an agent's direct push, which is the point) | 15 min owner | 5a for required checks |
| **6. Final validation (Stage C)** | Re-run gitleaks on all refs, the personal-data search, the asset inventory, `pnpm install --frozen-lockfile`, `pnpm validate`, `pnpm build`, CI green, community profile at or near 100 percent, go/no-go | None | 45 min | 1 to 5 |

Coordination: map-ui (#12), pages-ui (#11) and bookmarks-deep-read are in flight. Stage B PRs touch docs, licences, configs and research only, and should avoid `src/` until those merge. Land the CI workflow last or as non-blocking at first so it does not stall them.

---

## 12. Questions requiring owner decisions

1. **Content licence:** CC BY-NC 4.0 (recommended) or CC BY 4.0 for `content/`, `docs/` and `research/`? Code is MIT either way.
2. **Personal data scope:** remove all four items in F-02, or keep your full name in the PRD (it is already on your GitHub profile)? For the X bookmarks file: reword its provenance, or move it out of the repo and keep only the leads?
3. **History:** H1 (fix the tip, recommended) or H2 (rewrite and force-push, with a GitHub Support request for pull request refs)?
4. **Copyright holder** in the MIT notice: your legal name, your GitHub handle, or "The Vice Files contributors"?
5. **Inbound terms:** a plain "contributions are licensed under the same terms" statement, or also require DCO sign-off on commits? (No CLA is proposed.)
6. **Takedown response time:** 24 hours (LEGAL and the template) or 48 hours (PRD)?
7. **Domains in the repo:** move schema ids and docs to thevicefiles.com only, or keep the personal subdomain as the second address in docs?
8. **Code of Conduct and contact:** adopt Contributor Covenant 2.1? Which address handles conduct reports and security reports (takedown@thevicefiles.com, or a separate one)?
9. **Default branch:** switch the default to `staging` now, or fast-forward `main` to `staging`?
10. **AI rule scope (F-05):** does "no AI processing of Rockstar content" cover reading and measuring for research, or only generating media?

---

## 13. Overall recommendation

**NOT READY, REMEDIATION REQUIRED.**

The repository is safe to stay public: no secrets, no credentials, no infrastructure ids, no Rockstar or Mobbin assets and no local paths exist anywhere in its public history, and the legal rules for third-party IP are documented and largely enforced. It is not yet an open-source project: it has no licence (B1), it carries personal data against the owner's standing rule (B2), its branches are unprotected (F-03), and the default branch hides the templates and docs that the legal process relies on (F-04). Phases 1 and 2 clear the blockers in about two hours of agent work once questions 1 to 5 are answered; phases 3 to 5 bring it to a professional standard without touching the site code that other agents are building.

**Stage A ends here. No remediation, settings change or history change will be made until the owner approves the Stage B plan.**
