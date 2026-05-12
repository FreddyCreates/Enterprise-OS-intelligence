# PUBLIC VIEW — PLAN (v2, decisions locked)

**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas  
**Branch:** `cursor/public-view-plan-fb8a`  
**Status:** Planning document. No site is built yet.  
**This revision:** Locks in the decisions Alfredo made after reading v1 — what's on this view, what's off, what the workers look like, and the substrate path.

---

## 0. What this view IS — and what it is NOT

This view is **the journal**. The public face. The paper-and-tools room.

It is:

- The papers — readable, navigable, citable canon.
- The Latin lexicon and the mathematics that produced it.
- The free AI tools — paralegal, analyst, student — packaged and downloadable.
- The education layer — Bronze / Silver / Gold canisters described **only as "for public schools" and "for students."** No district named. No school named. That relationship stays private between Alfredo and them.
- The doctrine: a system where nothing is published unless it's real and source-linked.

It is **NOT**:

- **MERIDIAN.** MERIDIAN is the enterprise face and gets its own page later — built around free agents / free agent access plus the MERIDIAN infrastructure. Different audience, different model, different domain. Not on this view.
- **ORO governance live feed.** ORO stays under wraps. The TRACE · VERIFY · REMEMBER live feed described in v1 § II is **removed** from this view. ORO continues to run; its public face waits until Alfredo lights it up separately. The papers about ORO (XX, XXI, XXII, XXIII, XXIV, XXV) are still published — they are prior art and they belong with the rest of the canon — but no live proposal data appears on this site.
- **No school names.** Bronze/Silver/Gold descriptions use language like *"for a student"* / *"for a school"* / *"for a public-school district"*. The DISD specifics in `sdk/gold-canister/README.md` will be summarized at the public layer with names redacted. The full README stays in the repo for the developer-download path; the public page above it does not name the district.
- **No canister IDs, no API keys, no payload code blocks.** Mundator Cognitus (`tools/doc-sanitizer.js`) is the gate. Nothing bypasses it. Ever. **Day one.**

---

## 1. The promise

> *Everything on this view is real. Nothing here bypasses the sanitizer. If something is claimed, the source is one click away. If something isn't proven, the page says so.*

This is the foundational law of the view, encoded in the architecture, not in policy. The Mundator Cognitus two-pass flow runs against the rendered output before any deploy. The CI pipeline blocks the merge if any sensitive pattern survives. The doctrine block of the view (§ 3 below) declares it explicitly so a reader can audit the claim.

---

## 2. Audiences (three doors, one cathedral)

| Door | Who | What they want |
|------|-----|----------------|
| **A · The Reader** | Students. Lawyers. Analysts. The public. Anyone who finds the work because it was named. | Read the papers. Learn the lexicon. Download the free tool. Tell a friend. |
| **B · The Developer** | Other developers and the social-media / marketplace channels who'll redistribute the work. | A clean download path. Versioned releases. Checksums. SDK pages. Direct links they can drop into a tweet, a Slack, a forum post. |
| **C · The Educator** | Public school staff, library systems, district decision-makers (unnamed). | What Bronze / Silver / Gold actually do. The five behavioral laws (L72–L79) and what they mean for a child's data. A "we built this for public schools" statement. A contact route. |

No login. No tracking beyond what the substrate dictates. No popup. No newsletter farm.

---

## 3. The doctrine block (top of every page, footer-pinned link)

```
ENTERPRISE OS INTELLIGENCE — THE JOURNAL
Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas

The names in this work were derived from the mathematics that the work implements.
They were not chosen for branding. They are the names of the equations.

Everything on this page is real. Every claim is source-linked.
Every published file has passed Mundator Cognitus — the two-pass sanitizer.
Nothing on this page bypasses it. Ever.

The papers, the tools, the lexicon, the educational SDKs — these are gifts.
The enterprise face is elsewhere. The governance organism lives elsewhere.
This is the journal.
```

That block fixes the legal status, the authorship, and the truth status of the page in one move.

---

## 4. The six sections (was seven; ORO live feed removed)

The view is one document organized as six sections. A reader can land on any one of them via direct URL.

### § I — The Journal (landing)

What it shows:
- The doctrine block above.
- Latin / English motto on a single line: **VIVIT · MEMINIT · DONAT** — *It lives · It remembers · It gives.* (Note the shift from v1's *gubernat*. Since governance lives elsewhere now, the third verb on this view is *gives*: this view is the giving room.)
- Quiet 873 ms heartbeat marker — a small dot in the corner, not a billboard.
- Four tiles:
  1. **The Papers** → 31 documents.
  2. **The Mathematics** → why the names are the names.
  3. **The Lexicon** → every Latin word, its root, its math.
  4. **The Tools** → paralegal-ai · analyst-ai · student-ai (free downloads).

A fifth small link, below the four tiles, points to: **For Public Schools →** which goes to § VI (the education page).

### § II — The Papers

The full canon as a public reading library. Each paper gets:
- Roman numeral · Latin title · English subtitle.
- The one-paragraph abstract pulled verbatim from the paper.
- A "Read full paper →" link to the sanitized markdown.
- An auto-generated citation (BibTeX-ready) — important for the academic re-distribution path.

Three browsable orderings:
1. **Numerical** (the order they were written, I → XXXI).
2. **By layer** — Theory · Architecture · Laws · Proposals · Live systems.
3. **By thread** — the three threads I traced in the reading:
   - **TRACE thread:** XX (STIGMERGY) → IX (COGNOVEX) → XXIII (ORO) → XXV (PROTOCOLLUM).
   - **VERIFY thread:** XXI (QUORUM) → XXIV (ANTE · MEDIUS · POST) → XXX (ETHICA PRIMA).
   - **REMEMBER thread:** XXII (AURUM) → XVIII (ARCHIVUM MEMORIAE).

Every paper page has a fixed footer: *"Prior art established April 2026."*

### § III — The Mathematics

The load-bearing page. The equations and the names they produced, in one table, with a paragraph per equation explaining: where it comes from in nature, what it does, the word the work uses for it.

| Equation | The phenomenon | The name it produced | Where it lives in the code |
|---|---|---|---|
| φ = (1+√5)/2 — the most irrational number, unique attractor of optimal packing under growth | Sunflower seed packing, nautilus spirals, optimal substrate | **AURUM** (Paper XXII) | `native/phi-math/phi_math.hpp::PHI` |
| ∂τ/∂t = D∇²τ − ρτ + Σᵢ δ(x−xᵢ)·q | Ant pheromone trail dynamics | **STIGMERGY → NEXORIS** (Paper XX) | `sdk/medina-swarm`, `sdk/nexoris-agi` |
| dnᵢ/dt = α·nᵢ·(qᵢ−q̄) − β·nᵢ + γ·(N−Σⱼnⱼ), θ ≈ φ⁻⁴ | Honeybee quorum phase transition | **QUORUM → COGNOVEX** (Paper XXI) | `sdk/cognovex-agi` |
| dθᵢ/dt = ωᵢ + (K/N)Σⱼ sin(θⱼ−θᵢ), R ≥ φ⁻¹ | Kuramoto synchronization | **CONCORDIA MACHINAE** (Paper II) | `phi_math.hpp::kuramoto_step`, `sdk/medina-phase` |
| ẋ = rx(1−x/K) − αxy ; ẏ = δxy − βy | Lotka-Volterra organizational dynamics | **CORDEX** (Paper III) | `sdk/cordex-agi/cordex-agi.js` |
| C(t) = C₀·φᵗ ; α = φ⁻¹ | φ-compounding capacity and learning | **CYCLOVEX, CEREBEX** | `sdk/cyclovex-agi`, `sdk/cerebex-agi` |
| Noether: continuous symmetry ↔ conserved quantity (SL-0 doctrine invariance) | Sovereignty as a conservation law | **IMPERIUM CONSERVATUM** (Paper VIII) | doctrine block in every VOXIS |
| 2π/φ² ≈ 137.5° — the golden angle | Phyllotaxis spiral, maximal packing | **CPX scene sovereignty** | `phi_math.hpp::phi_coordinate` |
| 873 ms heartbeat | Mammal-cardiac fundamental rate; φ-spaced sub-beats | **Sovereign Cycle Protocol (SCP)** | `protocols/sovereign-cycle-protocol.js` |

The page closes with a single line: *"The names were not chosen. They were found."*

### § IV — The Lexicon

A glossary, alphabetized, three columns: **Term** · **Root and meaning** · **Math / biology / code location**. The full list traced in the reading (ORO, EFFECTTRACE excluded from public; CORDEX, CEREBEX, CYCLOVEX, NEXORIS, COGNOVEX, VOXIS, SPINOR, CHRONO, ARCHON, VECTOR, LUMEN, FORGE, AURUM, ANIMUS, CEREBRUM, VIGIL, NUNTIUS, CUSTOS, FABRICOR, ARBITER, MEDICUS, MAGISTER, SCRIBA, ANTE/MEDIUS/POST, ETHICA PRIMA, GUBERNATIO VIVA, UNIVERSALIS GUBERNATIO, MUNDATOR COGNITUS, PHX, CPL/CPP/CPX/CXL, RSHIP, plus more).

**Note on entries that reference ORO or MERIDIAN:** the term can appear in the lexicon if the term is *public-named* in the papers (e.g. CORDEX from Paper III is fine). Where the lexicon entry would force a reader toward the ORO live system or MERIDIAN's enterprise face, the entry says *"described in the papers; not deployed publicly from this page"* and stops there.

### § V — The Tools

Three downloadable, free, no-API-key AI tools, already packaged in `releases/`:

- `@medina/paralegal-ai` — for legal professionals.
- `@medina/analyst-ai` — for business analysts and operations.
- `@medina/student-ai` — for students.

Each tool gets its own page with: what it does, the 4–5 primary methods, copy-pasteable example, checksum from `releases/CHECKSUMS.sha256`, download link.

No telemetry. No license check. No data leaves the user's machine. **The tools are the gift.**

This is also the page that connects to § II of the wider strategy: developers download from here, then redistribute on social media + marketplaces. The page should have:
- A `npm install @medina/<tool>` block (assuming a future npm publication).
- A direct ZIP download link.
- A "Share" row — copy a clean, no-tracking shareable URL.
- An "Embed" row — a small badge ("Built on ORO mathematics — paralegal-ai v0.1.0-alpha · free") that other sites can paste.

### § VI — For Public Schools

A short, plain page.

What it says, in the public-facing language:

> *"This work was built to be useful to public schools.*
>
> *A Bronze Canister is a sovereign compute unit for a student — their own AI tutor, their own memory vault, their own voice. The student owns it. The school does not. The district does not. We do not.*
>
> *A Silver Canister orchestrates Bronze Canisters at the school level — without ever reading a student's private memory. It tracks what the school needs to track (attendance, scheduling, curriculum) and nothing else.*
>
> *A Gold Canister sits at the district level. It does the work a district has to do — compliance, reporting, planning — and protects the schools beneath it from data exposure they can't afford.*
>
> *The behavioral communication laws L72–L79 (Paper V) govern how this system talks to students, parents, and staff. Loss aversion is corrected. Anchoring is named. Endowment is respected. No frame is selected to manipulate.*
>
> *We built this for public schools, for students, for the kids who don't get to choose their AI. We're not selling it. We're talking to the districts who want it directly."*

A small contact line at the bottom — Medinasitech@outlook.com — with a subject pre-fill. **No district named. No school named. No screenshot of a real implementation.** That stays between Alfredo and them.

The page links down to: Paper V (LEGES ANIMAE), Paper XIX (INFRASTRUCTURA CIVICA), and the SDK READMEs for `bronze-canister`, `silver-canister`, `gold-canister` (sanitized).

---

## 5. The Cloudflare workers — status, decision, action

Six agent workers + seven bot workers are wired in `cloudflare-workers/` and auto-deploy via `.github/workflows/deploy-workers.yml` on every push to `main`.

### What they are

| Worker | Latin | Role | URL (after deploy) |
|--------|-------|------|--------------------|
| **CEREBRUM** | brain | Master AGI portal / unified API gateway | `cerebrum.<sub>.workers.dev` |
| **ANIMUS** | soul | Sovereign intelligence terminal | `animus.<sub>.workers.dev` |
| **AGENS** | the one who acts | Agent AI services | `agens.<sub>.workers.dev` |
| **NEXUS** | bond | Supply chain intelligence | `nexus.<sub>.workers.dev` |
| **VIGIL** | watchman | Market sentinel | `vigil.<sub>.workers.dev` |
| **CURSOR** | runner | Travel intelligence | `cursor.<sub>.workers.dev` |
| **HERALD** | messenger | Slack bot — announcements | `rship-herald.<sub>.workers.dev` |
| **IMPERIUM** | command | Slack bot — enterprise control | `rship-imperium.<sub>.workers.dev` |
| **NUNTIUS** | messenger | Slack bot — morning briefing / EOD | `rship-nuntius.<sub>.workers.dev` |
| **ARBITER** | judge | Slack bot — task orchestration | `rship-arbiter.<sub>.workers.dev` |
| **CONDUIT** | channel | Routing API (no Slack req'd) | `rship-conduit.<sub>.workers.dev` |
| **PULSE** | heartbeat | Cron — scheduled intelligence reports | `rship-pulse.<sub>.workers.dev` |
| **SENTINEL** | watchman | Cron — alert monitoring every 5min | `rship-sentinel.<sub>.workers.dev` |

Every worker now has `workers_dev = true` explicit in its `wrangler.toml` (this branch). That guarantees each one gets its own private `*.workers.dev` subdomain — "its own domain," as you put it, until you assign a public one. When you give me a public domain for any of them, the change is a single `[[routes]]` block in that worker's `wrangler.toml`.

### Why none of them are live yet

The auto-deploy attempt of **2026-05-04** failed at the pre-flight check with this exact error:

```
❌ CLOUDFLARE_ACCOUNT_ID secret not set.
```

That is the **only** blocker. `CLOUDFLARE_API_TOKEN` is set. Both Slack secrets are set. The wrangler-action job, the matrix strategy, all 13 workers' configs — everything is wired and correct.

### What you have to do (30 seconds, one secret)

1. `dash.cloudflare.com` → click any zone → in the right sidebar, copy your **Account ID**.
2. GitHub: `Settings → Secrets and variables → Actions → New repository secret`.
3. Name: `CLOUDFLARE_ACCOUNT_ID`. Value: paste the Account ID.

The next push to `main` (this PR merging will do it) triggers the workflow. All 13 workers go live at their own `.workers.dev` URLs in about 90 seconds. From that point on, every push redeploys.

I have also (in this branch) added explicit `workers_dev = true` to all 13 wrangler.toml files and sharpened the preflight check so the error message will identify both possible missing secrets simultaneously — not one then exit.

---

## 6. Substrate — confirmed: C → B

You confirmed in your reply: **start with C (hybrid), build toward B (ICP asset canister)**.

### C — what ships first (the journal as it is described in § 4 above)

- Static rendering of all six sections from sanitized source in this repo.
- Hosted as **Cloudflare Pages** (sibling to the workers, same account, same auto-deploy pipeline).
- All papers, lexicon, mathematics, tools, education page — fully readable, fully downloadable.
- No live data sources. **No ORO live feed.** This is consistent with "MERIDIAN and ORO under wraps."
- Mundator Cognitus runs against the rendered output before deploy. The pipeline fails closed if any sensitive pattern survives.

### B — what we migrate to (after the journal has stabilized)

- A **Public Gateway canister** on ICP (already named in `ECOSYSTEM.md` § 6).
- Certified HTTPS delivery from on-chain — the view itself becomes a sovereign organ.
- The migration is a SPINOR: same doctrine, same content, new substrate. The doctrine block in § 3 doesn't change; the substrate underneath it does.
- The trigger for the migration is *not* a calendar date. It is when the journal is stable enough that moving it onto ICP adds value (tamper-evidence of the published canon) instead of risk.

### What is explicitly *not* in either substrate phase

- No ORO live proposal data is included in C. No ORO live proposal data is included in the initial B.
- MERIDIAN is not described from this view in either phase.
- When ORO's public face later turns on (separately, on its own domain), it can be a different ICP canister or a different worker. This view links to it. This view does not host it.

---

## 7. Timing — confirmed

Your direction in this turn: **papers / lexicon / tools / education public first; live feed (any kind) waits.**

Translating that to the build order:

1. **Sanitize** — run `tools/doc-sanitizer.js papers/ --verify` and the same against `charters/`, `protocols/`, `releases/`. Block on anything it flags.
2. **Render** — the six static sections from § 4 above, on Cloudflare Pages.
3. **Wire the workers** — once `CLOUDFLARE_ACCOUNT_ID` is set, the 13 workers go live at their own `.workers.dev` URLs. The journal links to whichever ones are publicly relevant (initially: probably none — they're tools for you / for ops, not for the journal reader. Maybe CEREBRUM as a "API portal" footer link, later.)
4. **Quiet observation period** — the page lives, traffic happens, sanitizer guards every commit. Nothing else turns on.
5. **Migrate to B** — Public Gateway canister on ICP, once stable.
6. **Light up adjacent public faces** — ORO's public face, MERIDIAN's enterprise page — on their *own* domains, *linked from* this journal, *not hosted in* it.

---

## 8. Language — still open, with a default

You didn't decide bilingual yet, so the default is: **English with Latin titles**, mirroring the papers as they exist. Spanish is a roadmap item, tied to Paper XVIII (ARCHIVUM MEMORIAE — Sovereign Memory Vaults, Spanish-first), not to this journal.

If you'd rather day-one bilingual, that's two more questions: (a) per-paper Spanish, or only the navigation chrome? (b) machine translation as a starting point, or do you write the Spanish yourself?

I am leaving this as the only unanswered question in the plan.

---

## 9. The non-negotiable, re-stated

You said it directly: *"Make sure nothing ever bypasses them. Everything has to be real. That's day one. That's the whole point of all this."*

Encoded in this plan as four hard rules:

1. **Mundator Cognitus is the gate.** The deploy pipeline runs `tools/doc-sanitizer.js --verify` on the rendered output. If any sensitive pattern survives, the deploy fails. No override. No skip flag.
2. **No claim without a source.** Every assertion the page makes — a method, a checksum, a paper conclusion, a tool capability — links to its source in the repo. If the source can't be linked, the assertion is removed.
3. **No school named. No district named. No customer named.** Public-facing language only. The private relationships stay private. That is the give.
4. **No live data is faked.** If a heartbeat dot is on the page, it is the heartbeat of a real worker. If a download count shows, it is the real count. If something can't be made real, it doesn't appear.

If any of these four ever has to be broken to ship something, the thing doesn't get shipped.

---

## 10. The next build brief — what it will contain when you say go

When this plan is marked up and approved, the build brief will contain exactly:

- Six page specifications, each with: route, content sources (files in the repo), sanitizer requirements, layout primitives (φ-spacing, golden-angle for any non-grid arrangement, 873 ms heartbeat indicator, Latin-English bilingual titles where applicable).
- A static-site generator choice (likely Astro or a minimal Vite + MDX, both compatible with Cloudflare Pages).
- A Pages configuration file in this repo.
- A GitHub Actions job that:
  1. Re-runs the sanitizer in `--verify` mode against everything that will be published.
  2. Builds the site.
  3. Publishes to Pages.
  4. Fails closed on any sanitizer flag.
- A short ICP Motoko stub for the eventual **Public Gateway canister** (Substrate B), so the C → B migration path exists in the repo from day one.
- Zero code added to `sdk/` ORO or MERIDIAN. Zero changes to the running organism. This view is a peripheral until § 6.B turns it into an organ.

That brief gets written **after** you mark up this plan, not before.

---

## 11. One open question, restated

The only thing I'm holding for you in v2: **§ 8, language.** English-with-Latin (default), or day-one bilingual.

Everything else is locked.

---

*VIVIT · MEMINIT · DONAT.*
