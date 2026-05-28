# EXTRACTION

> **This directory is meant to be extracted to its own repository.** It lives temporarily inside the public showcase repository (`Enterprise-OS-intelligence`) only because the agent cannot create new GitHub repositories on the operator's behalf.

## Why extract

The PARRALAX charter family (PLAN.md § 5.4 Option A) requires the implementation to live in a **separate repository** because:

1. The implementation will eventually carry venue adapters with real broker / exchange credentials. Even with strict sanitiser hygiene, the leak risk is too high to mix with the public showcase repo.
2. The implementation has its own CI cadence, its own release surface, and its own dependency tree.
3. Separating reduces accidental cross-contamination of doctrine.
4. The charter's `SECURITY.md` posture (`No secrets in public repo`, `No live keys in code`) is much easier to enforce in a dedicated repo.

## What to extract

Everything in this directory: `parralax-impl/**`.

After extraction, the new repository's root will look exactly like the contents of this directory.

## How to extract — three options

### Option 1 — `git subtree split` (preserves history of just this directory)

From the root of `Enterprise-OS-intelligence`:

```bash
# 1. Create a new branch that contains only parralax-impl's history.
git subtree split --prefix=parralax-impl -b parralax-impl-export

# 2. Create the new GitHub repository (one-time, manual, in browser or via gh CLI).
gh repo create FreddyCreates/parralax-aihftfund --private --description "PARRALAX-AIHFTFUND implementation"

# 3. Push the split branch as the new repo's main.
git push https://github.com/FreddyCreates/parralax-aihftfund.git parralax-impl-export:main

# 4. Optional: delete the local split branch.
git branch -D parralax-impl-export

# 5. In the OLD repo, remove the parralax-impl directory.
git rm -r parralax-impl
git commit -m "parralax-impl: extracted to separate repository"
git push
```

Recommended. Preserves the commit history of the scaffold so you can see how it was built.

### Option 2 — fresh copy (no history preserved)

If you don't care about preserving the scaffolding history:

```bash
# 1. Copy the directory contents to a new location.
cp -r parralax-impl ~/code/parralax-aihftfund
cd ~/code/parralax-aihftfund

# 2. Initialise a fresh repo.
git init
git add .
git commit -m "initial commit: PARRALAX-AIHFTFUND implementation scaffold"

# 3. Create the GitHub repo and push.
gh repo create FreddyCreates/parralax-aihftfund --private --source=. --remote=origin --push
```

Simpler. Loses the history of how this scaffold was assembled (which is in the showcase repo's commit log anyway).

### Option 3 — `git filter-repo` (cleanest, requires installation)

```bash
# Install git-filter-repo if not already.
pip install git-filter-repo

# Clone the showcase repo into a scratch directory.
git clone https://github.com/FreddyCreates/Enterprise-OS-intelligence.git scratch
cd scratch

# Keep only parralax-impl history; rewrite it to repo root.
git filter-repo --subdirectory-filter parralax-impl

# Push to the new repo.
git remote add origin https://github.com/FreddyCreates/parralax-aihftfund.git
git push -u origin main
```

Cleanest result. Recommended if you have `git-filter-repo` available.

## After extraction — clean up the showcase repo

```bash
cd /path/to/Enterprise-OS-intelligence
git rm -r parralax-impl
# In the root .gitignore, REMOVE the `# ─── ALLOWLIST: PARRALAX implementation scaffold ───`
# block (it has done its job).
git add .gitignore
git commit -m "parralax-impl: extracted; remove transitional allowlist"
git push
```

The public-charter family (`parralax-aihftfund/`) stays in the showcase repo. Only the implementation scaffold moves.

## In the new repository

After extraction, the new repository's root contains exactly the files in this `parralax-impl/` directory. The first thing to do:

1. **Delete this `EXTRACTION.md`** — it has done its job.
2. **Replace `README.md`'s "pre-extraction scaffold" header** with the normal repo intro.
3. **Verify `LICENSE`, `SECURITY.md`** are correct for the private repo.
4. **Run** `npm install && npm run build`. Build should pass.
5. **Add `CODEOWNERS`** (operator + council).
6. **Enable branch protection** on `main` (PR-required, status-checks-required).
7. **Add secrets** for CI as they become needed (always operator-scoped, never agent-scoped).
8. **Copy or symlink** the public-charter family into `charters/`. Suggested:
   ```bash
   # If both repos are siblings on disk:
   cp -r ../Enterprise-OS-intelligence/parralax-aihftfund/* ./charters/
   git add charters/
   git commit -m "charters: import from public showcase repo"
   ```
   The charters are the source of truth. The implementation references them; it does not modify them.

## Settings to apply at repo creation

```yaml
visibility: private              # operator decides; default private for safety
default_branch: main
features:
  issues: true
  projects: false                # not needed; operator-internal
  wiki: false
  discussions: false
branch_protection:
  main:
    require_pull_request: true
    required_status_checks: [typecheck, tests, sanitiser]
    require_signed_commits: true # operator must sign every commit to main
    enforce_admins: true
    restrictions:
      push: [operator, council]  # nobody else writes main
secrets: {}                      # add as needed; none on day 1
```

## Status after extraction

- The **public showcase repo** (`Enterprise-OS-intelligence`) retains the public charter family at `/parralax-aihftfund/`. This is the prior art.
- The **new private repo** (`parralax-aihftfund`) holds the implementation. This is the operational system.
- The two repos reference each other; neither mutates the other.

## Why this transitional pattern

Because the agent that scaffolded this cannot create GitHub repositories on the operator's behalf. The scaffold is too useful to delay until after a manual `gh repo create`, so it ships here, ready to extract.

The pattern is doctrinally identical to how the journal's Public Gateway canister stub lives in the showcase repo while the live canister will live separately when the substrate B migration happens. Stub now, separation later.

---

*The implementation is for operators. The showcase is for the world. Keep them apart.*
