# Open-source readiness: Stage B repository settings

Prepared 2026-11-24 for the owner. **Nothing in this file has been applied.** Each setting lists what it is today (read through the GitHub API on 2026-11-24), the exact command to change it, and why. Apply them after the Stage B pull request is approved, in the order below. Every command needs `gh` signed in as a repository admin.

The repository: `obileonardo/thevicefiles`. Findings refer to [STAGE-A-AUDIT.md](STAGE-A-AUDIT.md).

## Already done (no action)

| Setting | State | Finding |
|---|---|---|
| Default branch | `staging` | F-04 |
| Secret scanning and push protection | Enabled | F-10 |
| Default workflow token | `read`, cannot approve pull requests | F-07 |

## 1. Merge policy: squash only, delete branches after merge (F-13)

Today: merge commits, rebase and squash are all allowed; head branches are kept after merge.

```sh
gh api -X PATCH repos/obileonardo/thevicefiles \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F allow_squash_merge=true \
  -F delete_branch_on_merge=true
```

Why: the owner's repositories merge by squash only, which keeps one commit per pull request on `staging` (the `Co-Authored-By` trailers survive in the squash message). Deleting merged branches keeps the branch list honest.

## 2. Security features (F-10)

Today: Dependabot alerts off, Dependabot security updates off, private vulnerability reporting off.

```sh
# Dependabot alerts
gh api -X PUT repos/obileonardo/thevicefiles/vulnerability-alerts

# Dependabot security updates (pull requests for vulnerable dependencies)
gh api -X PUT repos/obileonardo/thevicefiles/automated-security-fixes

# Private vulnerability reporting (SECURITY.md sends reporters here)
gh api -X PUT repos/obileonardo/thevicefiles/private-vulnerability-reporting
```

Why: alerts and security updates catch advisories like the three `sharp` ones Stage A found. `SECURITY.md` tells reporters to use "Report a vulnerability", which only exists once private vulnerability reporting is on. Apply this one before or together with the merge, or the link in `SECURITY.md` leads nowhere.

Check:

```sh
gh api repos/obileonardo/thevicefiles/private-vulnerability-reporting   # {"enabled":true}
gh api repos/obileonardo/thevicefiles/automated-security-fixes          # {"enabled":true,...}
```

## 3. GitHub Actions permissions (F-07, scorecard category 12)

Today: any action from any repository may run, and SHA pinning is not required.

```sh
gh api -X PUT repos/obileonardo/thevicefiles/actions/permissions \
  --input - <<'JSON'
{ "enabled": true, "allowed_actions": "selected", "sha_pinning_required": true }
JSON

gh api -X PUT repos/obileonardo/thevicefiles/actions/permissions/selected-actions \
  --input - <<'JSON'
{ "github_owned_allowed": true, "verified_allowed": false, "patterns_allowed": ["pnpm/action-setup@*"] }
JSON
```

Why: CI uses only `actions/checkout`, `actions/setup-node` (GitHub-owned) and `pnpm/action-setup`, all pinned to full commit SHAs. Allowing only these, and refusing any workflow that uses a tag instead of a SHA, stops a pull request from pulling in an unreviewed action. Dependabot keeps the pins current (`.github/dependabot.yml`, weekly). If a future workflow needs another action, add its pattern here.

Optional, for a public repo that will take outside contributions:

```sh
gh api -X PUT repos/obileonardo/thevicefiles/actions/permissions/fork-pr-contributor-approval \
  -f approval_policy=all_external_contributors
```

Today it is `first_time_contributors`. The stricter policy means a maintainer clicks "Approve and run" before any fork's workflow runs. CI has no secrets and a read-only token, so the default is acceptable; this is defence in depth.

## 4. Branch rules for `staging` and `main` (F-03)

Today: one active ruleset, "thevicefiles" (id 27944180), blocks deletion and force pushes, but its target list is empty (`"include": []`), so **it protects no branch**. Direct pushes to `staging` and `main` are still possible.

**Apply after CI has run once** on the Stage B pull request, so the required check name ("Validate and build") exists and can be seen passing.

### 4a. Update the existing ruleset to cover both branches

```sh
gh api -X PUT repos/obileonardo/thevicefiles/rulesets/27944180 \
  --input - <<'JSON'
{
  "name": "Protect staging and main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/staging", "refs/heads/main"], "exclude": [] } },
  "bypass_actors": [
    { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "require_code_owner_review": true,
        "dismiss_stale_reviews_on_push": true,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [ { "context": "Validate and build" } ]
      }
    }
  ]
}
JSON
```

What it does:
- Nobody can delete or force-push `staging` or `main`.
- Every change arrives through a pull request that passes CI and is squash-merged.
- A pull request needs one approval from a code owner (`.github/CODEOWNERS`: the owner everywhere, the owner or ChimeXXD for `content/`).
- Repository admins (the owner) may bypass the rules **only when merging a pull request** (`bypass_mode: pull_request`), so the owner can merge their own pull requests, which GitHub does not let them approve. A direct push to `staging` is rejected for everyone, including agent sessions that use the owner's token.

### 4b. Only the owner moves `main`

```sh
gh api -X POST repos/obileonardo/thevicefiles/rulesets \
  --input - <<'JSON'
{
  "name": "main moves only on the owner's go",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [
    { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" }
  ],
  "rules": [ { "type": "update", "parameters": { "update_allows_fetch_and_merge": false } } ]
}
JSON
```

Why: decision 16 says `main` moves only on the owner's go. With this rule, collaborators with write access cannot merge into `main`; the owner can, through a pull request.

Check:

```sh
gh api repos/obileonardo/thevicefiles/rules/branches/staging   # lists deletion, non_fast_forward, pull_request, required_status_checks
gh api repos/obileonardo/thevicefiles/rules/branches/main      # the same, plus update
```

A direct `git push origin staging` should now fail with "Repository rule violations".

## 5. Tidy-up (F-15, F-19)

Today: wiki on and empty, projects on and empty, no homepage, no topics, description lacks "unofficial".

```sh
gh api -X PATCH repos/obileonardo/thevicefiles \
  -F has_wiki=false \
  -f homepage=https://thevicefiles.com \
  -f description="Unofficial, non-commercial fan field guide to GTA VI: secrets map, explainers and the GTAverse"

gh api -X PUT repos/obileonardo/thevicefiles/topics \
  -f 'names[]=astro' -f 'names[]=static-site' -f 'names[]=fan-site' -f 'names[]=json-schema'
```

Why: docs live in `docs/`, so the wiki is a second place for stale text. "Unofficial" in the description matches the disclaimer. Leave Projects on only if the owner plans to use it (`-F has_projects=false` turns it off). The topic list is a suggestion; the owner picks.

## Not settings, but owner actions

- **PRD page redeploy.** This pull request removes the owner's name and a personal research card from `prd/public/index.html`, but thevicefiles.com currently serves the deployed copy, which still shows them until the PRD is redeployed.
- **Second domain route.** `prd/wrangler.jsonc` still routes the old personal subdomain to the PRD Worker. It was left unchanged because removing a custom-domain route changes live infrastructure. Removing it, and detaching that domain in Cloudflare, is the owner's call.
- **Mailboxes.** Send a test message to takedown@thevicefiles.com and conduct@thevicefiles.com and record that both arrive (F-12).
