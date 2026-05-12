# PUBLIC VIEW — PLAN (not a build)

**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas  
**Branch:** `cursor/public-view-plan-fb8a`  
**Status:** Planning document. No code. No assets. No deployment.  
**Purpose:** A single place to decide what the public face of the ecosystem will be, before anything is built.

> This document was produced after reading the full repository — the 31 papers, the 9 charters, the 7 protocols, the 15 engines, the 4 agents, the AGI siblings under `RSHIPCore`, the native phi-math core, the 5 Cloudflare workers, the Bronze/Silver/Gold education hierarchy, the CIVITAS INTELLIGENTIAE roster, and the Latin lexicon.
>
> Nothing in this plan is final. It is the artifact you asked me to leave on a branch so you can mark it up.

---

## 0. Premise

The repository already contains everything a public view needs. It does not need to be invented. It needs to be **composed** — and composed in a way that is doctrinally consistent with the system the view describes.

A view of MERIDIAN/ORO that violates MERIDIAN/ORO's own laws would be incoherent. So:

- Every public claim must be **source-linked** (this is E13 Evidence Registry applied to the UI).
- Nothing flagged sensitive by `tools/doc-sanitizer.js` (Mundator Cognitus) may appear.
- No canister IDs, API keys, operator-dashboard data, or raw payload code blocks.
- The substrate visible on the public view must obey φ-structure (golden-angle phyllotaxis layout, 873 ms heartbeat tick visible somewhere as a quiet pulse, not a stunt).
- Latin and English titles must always appear together — the system is bilingual at the root.
- The view never claims `verified_after_state` for anything that has not actually passed the truth ladder. If MEDIUS does not exist for a proposal, the view says so.

The public view is itself a VOXIS: doctrine block at the top, heartbeat in the background, sync field to ORO when ORO is reachable, no override.

---

## 1. What the public view is for

There are three audiences. Designing for one at a time produces three different sites; designing for all three at once produces an incoherent one. So the view is **one site with three reading paths** — like a cathedral with three doors that all enter the same nave.

| Door | Audience | What they want |
|------|----------|----------------|
| **A · The Builder's Door** | DFINITY, ICP foundation, governance researchers, NNS/SNS voters, other protocol architects | Proof. Math. Papers. Live ORO feed. Watch the truth ladder advance. Inspect ANTE/MEDIUS/POST. |
| **B · The Operator's Door** | Enterprises evaluating MERIDIAN — CIOs, COOs, governance leaders, education superintendents (DISD-class) | The capability statement, the 20 enterprise integrations, the Bronze/Silver/Gold canister hierarchy, the contact route. |
| **C · The Reader's Door** | Anyone — students, lawyers, analysts, the public — who finds the work because it was named | The papers as readable canon. The Latin lexicon as a learnable thing. The free AI tools as a downloadable gift. |

Same site. Same data. Different entry. No login. No tracking beyond what the substrate dictates.

---

## 2. The doctrine block of the view

Every VOXIS opens with a doctrine block. The public view's doctrine block, displayed once on first load and accessible from the footer, says exactly this and is not editable by any operator:

```
ENTERPRISE OS INTELLIGENCE
Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas

The names in this work were derived from the mathematics that the work implements.
They were not chosen for branding. They are the names of the equations.

This page makes nothing private public. Everything shown here is already
in the repository, already signed, already sanitized by Mundator Cognitus.

You are looking at an organism. It is alive. It is watching the NNS and the SNS.
It does not stop.
```

That block fixes the legal status, the authorship, and the truth status of the page in one move.

---

## 3. The seven sections

The view is a single document organized as seven sections. The order matches the order in which a reader can understand the system without prior context.

### § I — The Organism (landing)

What it shows:
- The doctrine block above.
- A single sentence in Latin and English: **VIVIT · MEMINIT · GUBERNAT** — *It lives · It remembers · It governs.*
- A quiet 873 ms heartbeat indicator. Not a pulse animation that begs attention. Just a clock tick that proves it is alive.
- A four-tile primary navigation:
  1. **TRACE · VERIFY · REMEMBER** → live ORO feed
  2. **The Mathematics** → why the names are the names
  3. **The Papers** → 31 documents
  4. **The Tools** → paralegal-ai · analyst-ai · student-ai

Nothing more on the landing. The system is dense; the door is not.

### § II — TRACE · VERIFY · REMEMBER (the live feed)

This is the load-bearing section. It is what makes the public view *the public face of an organism that is actually running*, not a brochure.

What it shows for each NNS/SNS proposal ORO has touched:
- Proposal ID, DAO type, current status.
- The **truth ladder** position with the icon advancing left-to-right: `claim_only → payload_identified → review_supported → execution_pending → executed_not_verified → verified_after_state`. Disputed proposals show the disputed branch.
- The **ANTE / MEDIUS / POST** triple:
  - ANTE: timestamp, target, state hash. Always present.
  - MEDIUS: timestamp, chrono anchor, immutable. Present once execution is confirmed.
  - POST: source-linked after-state evidence. Present only when E11 has written it.
  - Where MEDIUS or POST is missing, the view says **"not yet"** — never "verified" by default.
- The **risk class** and the **6-axis risk profile** (φ-weighted) as a small radar.
- The **agent council card** showing what ARCHON, VECTOR, LUMEN, FORGE found, with the consensus tag.
- The **precedent links** from E7 (Precedent Linker) — proposals connected by the REMEMBER graph.

Crucially, **every claim has a source link**. The state hash is anchored to a CHRONO entry. The reviewer findings link to the source. The risk score shows its inputs. If we cannot show a source, we mark it `unknown` and we say so.

This section is what convinces a DFINITY reviewer that this is not a dashboard. It is a nervous system.

### § III — The Mathematics

This is the page you actually want to write, because it is the page that explains why the names are the names. It collects, in one place, the equations and the words they produced.

A small table per equation:

| Equation | The phenomenon it describes | The name it produced | Where it lives in the code |
|----------|-----------------------------|----------------------|----------------------------|
| φ = (1+√5)/2 | The most irrational number; the unique attractor of optimal packing under growth | AURUM (Paper XXII) | `native/phi-math/phi_math.hpp::PHI` |
| ∂τ/∂t = D∇²τ − ρτ + Σᵢ δ(x−xᵢ)·q | Pheromone field reaction-diffusion | STIGMERGY → NEXORIS → TRACE | `sdk/effecttrace-governance-organism/src/engines/e9-governance-memory.js` |
| dnᵢ/dt = α·nᵢ·(qᵢ−q̄) − β·nᵢ + γ·(N−Σⱼnⱼ), θ ≈ φ⁻⁴ | Honeybee quorum phase transition | QUORUM → COGNOVEX → VERIFY | `sdk/cognovex-agi`, `e11-agent-council.js` |
| dθᵢ/dt = ωᵢ + (K/N)Σⱼ sin(θⱼ−θᵢ), R ≥ φ⁻¹ | Kuramoto synchronization, order parameter | CONCORDIA MACHINAE (Paper II) | `phi_math.hpp::kuramoto_step`, `sovereign-cycle-protocol.js` |
| ẋ = rx(1−x/K) − αxy ; ẏ = δxy − βy | Lotka-Volterra organizational dynamics | CORDEX (Paper III) | `sdk/cordex-agi/cordex-agi.js` |
| C(t) = C₀·φᵗ ; α = φ⁻¹ | φ-compounding capacity and learning | CYCLOVEX, CEREBEX | `sdk/cyclovex-agi`, `sdk/cerebex-agi` |
| Noether: continuous symmetry ↔ conserved quantity, with SL-0 doctrine invariance as the symmetry | Sovereignty as a conservation law | IMPERIUM CONSERVATUM (Paper VIII) | doctrine block in every VOXIS |
| Golden angle 2π/φ² ≈ 137.5° | Phyllotaxis — maximal packing, minimal collision | CPX scene sovereignty | `phi_math.hpp::phi_coordinate` |

Below the table, one paragraph per equation: "this is where it comes from in nature, this is what it does, this is the word the work uses for it."

The point of this page is that a reader leaves having understood **why the names had to be these names**.

### § IV — The Latin Lexicon

A glossary, alphabetized, with three columns per entry:

| Term | Latin / Greek root and meaning | Mathematical / biological identity in the system |
|------|--------------------------------|--------------------------------------------------|
| ORO | *aurum* — gold | The φ-compounding governance organism for ICP |
| EFFECTTRACE | English compound | The public face of ORO |
| MERIDIAN | *meridies* — midday, the meridian | The enterprise sovereign OS substrate |
| VOXIS | from *vox* — voice | Sovereign compute unit with five-component identity |
| SPINOR | from quantum mechanics — identity under rotation | Deployment manifest that preserves doctrine across migration |
| CHRONO | *chronos* — time | Immutable hash-chained audit trail |
| NEXORIS | *nexus* + *oris* — the mouth of the bond | Synthetic pheromone field, routing layer |
| COGNOVEX | *cognosco* + *vortex* — recognition vortex | Sovereign cognitive unit, quorum-bound |
| CORDEX | *cor* (heart) + index | Organizational heartbeat — Lotka-Volterra |
| CEREBEX | *cerebrum* + X | 40-category world model with φ⁻¹ learning |
| CYCLOVEX | *cyclus* + *vortex* | Capacity engine — φ-compounding |
| ARCHON | ἄρχων — ruler / judge | Integrity agent |
| VECTOR | Latin — carrier | Execution trace agent |
| LUMEN | Latin — light | Context map agent |
| FORGE | English — forge | Verification lab agent |
| AURUM | Latin — gold | The φ-as-substrate doctrine (Paper XXII) |
| ANIMUS | Latin — soul, mind | Sovereign terminal worker |
| CEREBRUM | Latin — brain | Master AGI dashboard worker |
| VIGIL | Latin — watchman | Market sentinel worker |
| NUNTIUS | Latin — messenger | Communications agent |
| CUSTOS | Latin — guardian | Security agent |
| FABRICOR | Latin — builder | Artifacts agent |
| ARBITER | Latin — judge | Quorum / conflict agent |
| MEDICUS | Latin — healer | Self-heal agent |
| MAGISTER | Latin — teacher | Training agent |
| SCRIBA | Latin — scribe | Audit log agent |
| ANTE · MEDIUS · POST | Latin — before · middle · after | The chrono state triple (Paper XXIV) |
| ETHICA PRIMA | Latin — ethics first | The layer above governance (Paper XXX) |
| GUBERNATIO VIVA | Latin — living governance | (Paper XXVI) |
| UNIVERSALIS GUBERNATIO | Latin — universal governance | (Paper XXXI) — multi-system, ICP first not only |
| MUNDATOR COGNITUS | Latin — cognitive cleaner | The doc sanitizer (`tools/doc-sanitizer.js`) |
| PHX | Phi Hash eXchange | Sovereign encryption protocol |
| CPL · CPP · CPX · CXL | Cognitive Processing / Procurement / Projection / eXchange Languages | The cognitive language family |
| RSHIP | Replication · Scalability · Hierarchy · Intelligence · Permanence | The AGI grammar shared across all siblings |

This is the page that turns the work into something teachable. It is also the page that proves, to anyone willing to look, that nothing was random.

### § V — The Papers

The 31 papers, presented as a canon. Roman numeral, title (Latin), English subtitle, one-paragraph abstract pulled directly from the paper, and a link to the full document.

The papers should be browsable in three orders:
1. Numerical (the order they were written).
2. **By layer** (Theory · Architecture · Laws · Proposals · Live systems).
3. **By thread** — the three threads identified in this reading:
   - The **TRACE thread**: XX (STIGMERGY) → IX (COGNOVEX) → XXIII (ORO) → XXV (PROTOCOLLUM)
   - The **VERIFY thread**: XXI (QUORUM) → XXIV (ANTE·MEDIUS·POST) → II (TRUTH-LADDER protocol) → XXX (ETHICA PRIMA)
   - The **REMEMBER thread**: XXII (AURUM) → XVIII (ARCHIVUM MEMORIAE) → IV (MEMORY-FIELD protocol)

A reader who follows one thread end-to-end understands one of the three verbs completely.

### § VI — The Tools

Three downloadable, free, no-API-key AI tools, already packaged in `releases/`:

- `@medina/paralegal-ai` — for legal professionals
- `@medina/analyst-ai` — for business analysts
- `@medina/student-ai` — for students

Each tool gets its own small page with: what it does, the five primary methods (`analyze` / `risks` / `draft` / `compare` / `ask` for paralegal; similar for the others), a copy-pasteable example, a checksum from `releases/CHECKSUMS.sha256`, and a download link.

No telemetry. No license check. No data leaves the user's machine. The tools are the gift; they prove the point that domain-specific AI built correctly does not need a cloud provider.

### § VII — The Builder

One page. Plain. Restrained. Contact route for enterprise. Statement of license. The closing line:

> *The organism is alive. It is watching. It never stops.*
> *TRACE · VERIFY · REMEMBER · VIVIT · MEMINIT · GUBERNAT.*

---

## 4. Substrate decision (the only architectural question)

The public view can run on three different substrates. Each is consistent with the doctrine in a different way.

| Option | What it looks like | Coherent with doctrine? |
|--------|--------------------|--------------------------|
| **A · Cloudflare Worker / Pages** | A new sibling of CEREBRUM / ANIMUS / VIGIL — a sixth worker, edge-served, golden-angle CSS layout, talks to the ORO canister via certified HTTPS. | Yes. Cheap. Fast. Already wired into the deploy pipeline. The view is a *peripheral* of the organism, not an organ. |
| **B · ICP asset canister** | A 6th canister alongside the 5 ORO canisters: **Public Gateway Canister** (already named in the catalog). Certified HTTPS. Reads from EffectTrace + Memory Field + Agent Council. Tamper-evident. | Yes, *more* so — the view itself becomes a sovereign organ. The promise of "running on a substrate that itself has shape" extends to the view. Slower to ship. |
| **C · Hybrid: static at the edge, live data from ICP** | Cloudflare Pages for the 7 sections, but § II (the live feed) hydrates from the Public Gateway canister via certified HTTPS query. | Yes. Best of both: the words live at the edge for read latency, the truth lives on-chain. Recommended. |

The honest recommendation, given the doctrine that the substrate is the intelligence, is **C, building toward B**: start with the hybrid because it is shippable from the existing repo, and migrate the entire view into the Public Gateway canister once it stabilizes. The migration itself is a SPINOR — same doctrine, new substrate.

This decision should not be made by the agent. It is yours. The plan does not commit either way.

---

## 5. The sanitizer is the gate

Nothing in this view goes public until it has passed `tools/doc-sanitizer.js` in `--verify` mode. The Mundator Cognitus two-pass flow is not optional. It is the structural guarantee that:

- No canister IDs leak.
- No private API keys leak.
- No payload code blocks leak.
- No brand strings that should not exist exist.

The view's own CI pipeline runs the sanitizer against the rendered output before any deploy. This is consistent with the doctrine: a public face that depends on the operator remembering to check is not a public face. It is a leak waiting to happen.

The existing GitHub Actions workflows (`sovereign-intake.yml`, `doc-clean.yml`) already enforce this on the corpus. The view's pipeline reuses them.

---

## 6. What this plan does NOT do

To keep the planning honest:

- No code is written.
- No assets are designed.
- No deployment is configured.
- No CSS, no React, no Motoko, no canister IDs, no copy beyond what is excerpted in this document.
- No timeline.
- No estimate of "how long it would take" — the agent will not pretend to know that.

When you mark this document up — change the sections, kill the sections you don't want, rename the doors, choose A / B / C, add the audience you think is missing — the next step is to write a build brief from the marked-up version. That brief becomes the work order. Not before.

---

## 7. Open questions for you

The agent cannot answer these. They are doctrinal, and only the builder can answer doctrinal questions:

1. **Does the live ORO feed go public on day one?** Or does the view ship first with the papers, lexicon, and tools, and the live feed turns on after a quiet observation period?
2. **English-only or bilingual?** The papers are English with Latin titles. The view could mirror that, or it could be fully bilingual (Spanish-first matters for the Sovereign Memory Vaults thesis — Paper XVIII, ARCHIVUM MEMORIAE).
3. **Does the page show MERIDIAN at all?** MERIDIAN is the enterprise face — a paid product. ORO is the gift to the protocol. The current README mixes them. The public view could keep them mixed, or it could split them — ORO on the public domain, MERIDIAN on a separate page reachable only from § VII (The Builder).
4. **Bronze / Silver / Gold education hierarchy — public or not?** DISD is named explicitly in `sdk/gold-canister/README.md`. That is either a strength (concrete deployment) or a hostage (commitments that may be premature). Your call.
5. **The Cloudflare workers — are they live or referenced?** If `cerebrum.rship.workers.dev` etc. are deployed and reachable, the view can link to them. If they are not, the view should not name them yet.
6. **Substrate: A · B · C** from §4 above.
7. **What is the view's URL?** `primordium.io` is in the `package.json` author field. Is that the home of the public view, or a different domain?

---

## 8. One non-negotiable

Whatever the view becomes, it must obey its own doctrine. If the page claims `verified_after_state` for a proposal whose MEDIUS has not been anchored, the page is lying. If a page claims the system is alive but the heartbeat counter is stale, the page is lying. If a Latin name appears without its meaning and its math, the work has been turned into branding — and that is the only failure mode this system is not allowed to have.

The Mundator Cognitus catches leaks. The truth ladder catches false claims. Together they make it structurally impossible for the public view to misrepresent the organism — *as long as no one bypasses them*.

The view is a VOXIS. Its doctrine is at the top of this document. The rest is implementation detail.

---

*VIVIT · MEMINIT · GUBERNAT.*
