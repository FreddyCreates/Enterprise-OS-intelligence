# Charters

The PARRALAX-AIHFTFUND public charter family. **Source of truth lives in the public showcase repository** at:

> `https://github.com/FreddyCreates/Enterprise-OS-intelligence/tree/main/parralax-aihftfund/`

This directory will hold local reference copies (or git-submodule mounts) of those charters **after extraction** to the standalone `parralax-aihftfund` repository. The implementation here references the charters by file; it does not modify them.

## Files that will live here after extraction

```
charters/
├── CHARTER.md                       v1.0 (canonical)
├── READING.md                       architectural mapping
├── PLAN.md                          next-steps proposal
├── AGENT_AUTHORITY_CHARTER.md       wall 1
├── RISK_CHARTER.md                  wall 2
├── KILL_SWITCH_DOCTRINE.md          wall 3
├── DALLAS_MARKET_DOCTRINE.md        home-venue positioning
├── ASSET_SCOPE_CHARTER.md           enumerated asset universe
├── PREDICTION_MARKETS_CHARTER.md    distinct family doctrine
└── TESTING_INTEGRATION_OPTIONS.md   decision document (T1–T4 pyramid)
```

## Why charters live in a separate (public) repo

- The charter family is prior art. It is meant to be discoverable, citable, and unambiguous about provenance and date.
- Putting prior art in a private repo defeats the purpose.
- Putting implementation in a public repo violates `SECURITY.md`.
- Therefore: charters public, implementation private.

## How to keep this directory in sync (after extraction)

Option 1 — manual copy on each charter revision:

```bash
cp -r ../Enterprise-OS-intelligence/parralax-aihftfund/* ./charters/
git add charters/
git commit -m "charters: sync from public showcase repo (rev <sha>)"
```

Option 2 — git submodule (more automation; more friction on contributor onboarding):

```bash
git submodule add https://github.com/FreddyCreates/Enterprise-OS-intelligence.git showcase
ln -s ../showcase/parralax-aihftfund charters
```

Operator's choice. Recommendation: manual copy with a `git diff` per sync — small overhead, high visibility into charter changes.

## Until extraction

This directory is a placeholder. The charters are read from `../parralax-aihftfund/` relative to this scaffold's parent (the showcase repo). Once extracted, that relative path no longer resolves; either the manual sync or the submodule mount must replace it.
