# The Journal

The public-facing static site for the Enterprise OS Intelligence corpus.

**Scope (locked by [`/PUBLIC-VIEW-PLAN.md`](../PUBLIC-VIEW-PLAN.md)):**

- The papers (sanitized).
- The Mathematics page (the equations and the names they produced).
- The Latin Lexicon.
- The free AI tools (paralegal · analyst · student).
- A page for public schools — no district named, no school named.

**Explicitly out of scope:** MERIDIAN (separate enterprise page later), ORO live governance feed (stays wrapped), any customer / school / district names.

## Architecture

- **Framework:** [Astro 5](https://astro.build) — static output, no SSR, no client hydration framework.
- **Substrate (phase C):** Cloudflare Pages.
- **Substrate (phase B, planned):** ICP Public Gateway canister — see `/canisters/public-gateway/`.
- **Content source:** `/papers/*.md` (canonical) → synced into `src/content/papers/` at build time.
- **Gate:** [`tools/doc-sanitizer.js`](../tools/doc-sanitizer.js) runs in `--verify` mode against the synced content before `astro build`. If anything fails, the build fails. Nothing bypasses the sanitizer.

## Local development

```bash
cd journal
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`. Editing a paper at `/papers/*.md` requires a sync — run `npm run sync` or restart `npm run dev`.

## Production build

```bash
npm run build
```

This runs, in order:

1. **`sync`** — copies `papers/**/*.md` into `src/content/papers/` with frontmatter.
2. **`verify`** — runs the Mundator Cognitus sanitiser PASS 2 (read-only strict verify) against the synced papers. Build fails if anything sensitive survives.
3. **`astro build`** — generates static HTML/CSS/JS in `dist/`.
4. **`copy-releases`** — copies the free-tool zips into `dist/releases/`.
5. **`verify-checksums`** — re-computes SHA-256 of each zip in `dist/releases/` and compares it to `releases/CHECKSUMS.sha256`. Build fails on any mismatch.

The site is `dist/`. Deploy it as a static site (Cloudflare Pages, Netlify, an ICP asset canister, anything that serves static files).

## Deploying to Cloudflare Pages

Wired via [`.github/workflows/journal-deploy.yml`](../.github/workflows/journal-deploy.yml). Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN` (already set)
- `CLOUDFLARE_ACCOUNT_ID` (must be added — see PR description)

The journal deploys to the Pages project named `journal-medina`. When a custom domain is assigned, no code change is needed; Pages handles the routing.

## Doctrine

This site obeys [`/PUBLIC-VIEW-PLAN.md`](../PUBLIC-VIEW-PLAN.md). The four non-negotiables (§ 9) are encoded in the build pipeline itself:

1. **Mundator Cognitus is the gate.** `npm run verify` is part of `npm run build`. There is no way to skip it.
2. **No claim without a source.** Every claim on a page links to the file in the repository that backs it.
3. **No school named. No district named.** Public-facing language only.
4. **No faked live data.** The heartbeat dot animation is the only animated element. No fake numbers, no fake feeds.

*VIVIT · MEMINIT · DONAT.*
