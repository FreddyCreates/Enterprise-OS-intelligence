# CLOUDFLARE CAPABILITY PLAN
### What just became possible — and what we must not do with it

**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas  
**Branch:** `cursor/public-view-plan-fb8a`  
**Status:** Planning document. Sibling to `PUBLIC-VIEW-PLAN.md`. No new code in this commit.  
**Context:** The Cloudflare account exposes Workers + Pages Functions, Workers Builds, Workers Logs, Durable Objects, D1, KV, Workers AI, Queues, Hyperdrive, Vectorize, Logpush, Browser Run, and Containers. The journal scaffolded in this branch uses only Pages (static) and `.workers.dev` for the 13 RSHIP workers. Everything else is unused capability sitting on the same account.

---

## 0. The doctrine has not changed

Before listing capabilities, the four non-negotiables from `PUBLIC-VIEW-PLAN.md` § 9 still bind every line below:

1. Mundator Cognitus is the gate. No content reaches the public surface that has not passed PASS 2 strict verification.
2. No claim without a source.
3. No school named. No district named. No customer named.
4. No faked live data. If a number appears on the page, it is real.

And one new non-negotiable specific to this addendum:

5. **No promise of data locality is broken.** The three free AI tools (`paralegal-ai`, `analyst-ai`, `student-ai`) are downloadable because they run on the user's machine and nothing leaves it. Any Cloudflare-hosted feature that resembles these tools but ships user data to a remote inference endpoint is *not* a substitute — it is a different product. The tools' doctrine of locality is the gift; the journal must not contradict it.

---

## 1. Capability matrix — what each piece is for

| Service | What it is | What we *could* use it for | What we *must not* use it for |
|---------|------------|----------------------------|-------------------------------|
| **Pages + Workers Functions** | Static hosting + serverless functions co-located. Up to 15 min CPU/req. | Journal (already wired). Read-only API endpoints that augment static pages (search, paper graph). | Anything that bypasses the sanitiser. Anything that serves content not produced by the build. |
| **Workers Builds** | 6 concurrent build slots, Cloudflare-hosted CI. | Move some/all of the 13 worker builds off GitHub Actions for redundancy. | Run the sanitiser inside Workers Builds in a way that loses the GH audit trail. The sanitiser PASS 2 stays in GitHub Actions where the logs are durable. |
| **Workers Logs (7-day)** | Filter and analyse worker logs. | Operator visibility on worker health, request counts, error rates. | Log visitor identifiers, search queries, or any content the visitor typed. |
| **Durable Objects** | Stateful compute with SQL inside it. | The journal's audit ledger — every deploy, every commit, every PASS 2 result — as a hash-chained record. A non-ICP shadow of CHRONO. | Store visitor sessions, per-user state, or anything that turns the journal into a stateful application. The journal stays a document. |
| **D1** | Serverless SQL database at the edge. | Public-safe metadata: which paper was last sanitised, which build was last deployed, the hash chain of journal versions. | Visitor analytics. Search history. Anything that records "who looked at what." |
| **KV** | Edge key-value store, low latency. | Precomputed paper-to-paper similarity graph (built once per release, served fast). Short-ID redirects for citation URLs. Cache of expensive computations. | Anything user-state-shaped. |
| **Workers AI** | All AI models in Cloudflare's catalog. Monthly free allowance. | At **build time only**: embeddings of every paper and every lexicon entry → fed into Vectorize for semantic search. Used as an *operator* tool — not as a *visitor* tool — to detect missing lexicon terms, draft new citations, etc. | Online inference of the free tools' methods (`ai.analyze`, `ai.brief`, `ai.study`, etc.). The tools' promise is that data does not leave the user's machine. We do not break that promise by offering a hosted variant. |
| **Queues** | Reliable async messaging. | Fan-out for the bots (HERALD, NUNTIUS, etc.) so a single event delivers to Slack + Discord + log without blocking the producer. | Anything the user-facing journal needs synchronously. |
| **Hyperdrive** | Connector to existing databases over Workers. | Not relevant to the journal. Relevant to MERIDIAN — connecting to enterprise SAP / Oracle / Salesforce. | Anything on the journal. The journal does not talk to operational databases. |
| **Vectorize** | Vector database, embedding-aware. | The semantic-search index of the canon. The paper-graph backbone. The lexicon's "related terms" graph. | Storing visitor queries. (Queries hit the index; nothing about them is retained.) |
| **Logpush / Trace** | Push logs/traces to external storage. | Operator-only — durable archive of build and worker logs to satisfy "everything has to be real." | Visitor data. |
| **Browser Run** | Headless browser inside a worker. | Generate PDF versions of every paper at build time. Generate OG-image social cards per paper. Capture the rendered journal as a screenshot artifact for the audit ledger. | Crawl external user sites. Capture anything from a user's browser context. |
| **Containers** | Serverless containers. | Heavier batch jobs at release time — e.g., re-running PASS 1 + PASS 2 across all corpora in parallel, or producing the precomputed paper graph faster than Workers can. Hosting a future "try the SDK in your browser" REPL. | Replacing the static deploy of the journal. The journal stays static. Containers are tooling. |

---

## 2. Five features to add to the journal — each justified by doctrine

These are the features that the new capabilities make possible *without* violating any non-negotiable. They are listed in priority order, with the smallest first.

### Feature A — **Semantic search across the canon**

> *"Search the work" — natural-language query over the 34 papers and the lexicon.*

- **Build time:** embed every paper (and every lexicon entry) with a Workers AI text-embedding model. Store vectors in Vectorize. Persist the vector → source-path map in KV.
- **Runtime (a Workers Function at `/api/search`):** embed the user's query, run a k-nearest-neighbour search against the index, return the top N results with paper id, title, and the matched excerpt.
- **Front-end:** a single `<input>` on `/papers/` and on `/lexicon/`. Results render as static-looking cards. No history kept. No autocomplete. No "recent searches."
- **Why this passes doctrine:**
  - The embeddings index only contains text that already passed Mundator Cognitus.
  - The query is sent to Workers AI for embedding, *only* to compute a vector. Nothing about the query is stored anywhere. The Worker logs request counts, not request bodies.
  - The result is grounded — each result links to the paper that produced the match. Source-linked by construction.
  - If Vectorize / Workers AI are off, the input degrades to a `<form action="/papers/">` that scrolls to the paper list. The journal never depends on the live feature.
- **Cost shape:** one-time per release for embeddings (34 papers + ~45 lexicon entries ≈ 100 embeddings per build). Per-query: one embedding + one Vectorize lookup. Both within Cloudflare free tier at expected journal traffic.

### Feature B — **Paper graph (precomputed at build time)**

> *Each paper page shows: "Papers connected by content. Papers in the same thread. Papers cited inline."*

- **Build time:** after embeddings are computed (Feature A), compute cosine similarity between every paper pair. For each paper, keep the top 5 most-similar siblings. Persist the resulting graph to KV (one entry per paper).
- **Runtime:** the paper page reads its row from KV at render and shows three short lists (similarity-related, same-thread, inline-cited).
- **Why this passes doctrine:**
  - The graph is built from the actual content. No fabricated edges.
  - The "inline-cited" list is built by regex-scanning each paper for references to other papers (e.g. "Paper XXI", "see XXIV"). Real citations, not hallucinated ones.
  - If KV is unavailable at request time, the paper page renders without the sidebar. The paper itself is unaffected.
- **Bonus:** the same graph is exported as `/papers/graph.json` for academic re-use.

### Feature C — **PDF and social-card per paper**

> *Every paper has a downloadable PDF and a 1200×630 OG image suitable for sharing.*

- **Build time:** Browser Run renders each paper page to a PDF (`/papers/<id>.pdf`) and to a `og.png` social card (Latin title + English subtitle, set on a golden-angle phyllotaxis background, watermark "VIVIT · MEMINIT · DONAT").
- **Front-end:** each paper page gains "Download PDF" and "Cite" buttons. The OG image is wired into the page's `<meta property="og:image">`.
- **Why this passes doctrine:**
  - The PDF is generated from the sanitiser-verified rendered HTML — same source of truth as the web page.
  - The social card contains only title + subtitle + motto. No fabricated data.
  - The image is generated at build time, not on demand. No request-time browser-rendering loop.
- **Cost shape:** N × Browser-Run invocations per release, where N = 34. Reasonable within the free-tier monthly allowance if releases are infrequent.

### Feature D — **The audit ledger (`/audit/`)**

> *A public page that lists every journal deploy, with commit hash, sanitiser result, timestamp, and the SHA-256 of every file published.*

- **Build time:** the deploy workflow appends a row to a D1 table (or to a Durable Object's SQLite) — `(deployId, commitSha, builtAt, sanitiserPass2OK, fileCount, distSha256)`. The full manifest of file hashes goes to KV under `manifest:<deployId>`.
- **Front-end:** `/audit/` lists the rows newest-first. Clicking a row expands the file manifest. Each file has its SHA-256 visible.
- **Why this passes doctrine:**
  - The ledger contains *only* deploy metadata. No visitor data. No requests, no IPs, no queries.
  - It is the journal's own CHRONO — a public, tamper-evident record of what was published when. This is the "everything has to be real" doctrine made visible.
  - When the journal migrates to the ICP Public Gateway canister (substrate B), this ledger is its first CHRONO citizen. Same shape, new substrate.
- **Cost shape:** ~1 D1 row + 1 KV entry per deploy. Negligible.

### Feature E — **Heartbeat parity (`/api/heartbeat`)**

> *The footer heartbeat dot links to a real heartbeat endpoint that always returns the current 873 ms-aligned beat number.*

- **Runtime:** a Worker Function at `/api/heartbeat` returns `{beat: number, ms: 873, phi: 1.618…, builtAt: <deploy timestamp>}`. The beat is computed as `Math.floor((Date.now() - genesisMs) / 873)` where `genesisMs` is the timestamp of the first deploy of this page (stored in D1).
- **Front-end:** the heartbeat dot in the footer remains a CSS animation (no JS required); but the dot is now a `<a href="/api/heartbeat">` link, and a small "beat #" appears alongside it for users who choose to query.
- **Why this passes doctrine:**
  - The number is computed, not faked. Anyone can verify it by computing `(now - genesisMs)/873`.
  - The endpoint logs request counts, not request bodies.
  - If the endpoint is down, the dot still animates. The journal does not depend on it.

---

## 3. Two ecosystem-side opportunities (not on the journal)

The capabilities also matter outside the journal. These are listed for completeness and are **out of scope** for the current PR.

### Opportunity 1 — The 13 workers become a real network

- **CEREBRUM** becomes the gateway: it accepts a high-level request, runs Vectorize to identify which sibling worker (ANIMUS / NEXUS / VIGIL / CURSOR / AGENS) should answer, fans the request out via Queues, aggregates and returns. The same φ-weighted routing from `RSHIP-Routing-Protocol` becomes real, edge-resident.
- **PULSE** (cron bot) writes its scheduled reports to a Durable Object so they survive worker restarts, and into KV so they can be queried.
- **SENTINEL** (5-minute alert scan) writes its findings to D1 with a small public view at a separate worker domain.
- The bots (HERALD / IMPERIUM / NUNTIUS / ARBITER) fan messages out via Queues so a slow Slack call doesn't block a fast Discord call.

This is a separate workstream — *not* on the journal. Worth scoping into its own plan when the journal is shipped.

### Opportunity 2 — MERIDIAN gets its rightful home

- The enterprise face that does not belong on this journal does belong on a sibling site. With Hyperdrive, that site can talk to enterprise databases (SAP / Oracle / Salesforce). With Containers, it can host the heavier connectors. With Workers AI, it can run real-time analysis. With Durable Objects, it can hold per-tenant state.
- **MERIDIAN's site is a future commit on a separate branch.** The current branch's job is to land the journal. MERIDIAN's plan will be its own document.

---

## 4. What we explicitly will NOT do

This list matters as much as what we *will* do. Saying these out loud, in a planning document, is how they stay non-negotiable.

1. **No hosted version of `paralegal-ai`, `analyst-ai`, or `student-ai`.** The tools are gifts because they run on the user's machine. A hosted variant is a different product. If we ever build one, it goes on a separate domain, with separate language, and the journal does not link to it as a substitute.
2. **No visitor analytics.** No Google Analytics, no Plausible, no Workers Logs of request bodies, no D1 table of "what did people search for." If we want to know how the journal is doing, we read the durable Workers Logs *aggregates* — request counts and error counts, not content.
3. **No A/B testing.** The journal is one site. Every visitor sees the same words.
4. **No login.** No accounts. No "save this paper to your list." The journal is a document. Documents do not have accounts.
5. **No request-time generation of content.** The journal is statically built. The only request-time features are read-only augmentations (Feature A, B, D, E) that degrade gracefully when off.
6. **No bypassing Mundator Cognitus.** Every new piece of content — papers, social cards, PDFs, lexicon entries — passes PASS 2 before deploy. No exceptions. No `--force`. No "this is just a quick fix."
7. **No telemetry to outside services.** Logpush to our own R2 / Workers-account storage is fine (operator audit). Telemetry to a third party is not.
8. **No "AI-generated" papers.** Every paper that appears on `/papers/` was written by the builder. Workers AI may help build search and graphs, but it does not write content.

---

## 5. Phasing — what ships in what order

The current PR ships the static journal (substrate C). This document does not add to that PR; it scopes the *next* PRs.

**Phase C1 — Static journal lands (this PR).**
- Already built, already verified, already pushed. Waiting on `CLOUDFLARE_ACCOUNT_ID` to deploy.

**Phase C2 — Add Feature A (semantic search) + Feature D (audit ledger).**
- Smallest pair. Maximum doctrinal payoff (search = real intelligence; audit = real history).
- Independent of each other; either can ship first.

**Phase C3 — Add Feature B (paper graph) + Feature C (PDF & social cards).**
- Builds on Feature A's embeddings.
- Browser Run integration is the only new operational dependency.

**Phase C4 — Add Feature E (heartbeat endpoint).**
- Smallest of all. Polish.

**Phase B — Migrate to ICP Public Gateway canister.**
- After C1–C4 stabilise. The SPINOR is the migration: same doctrine, same content, new substrate. The audit ledger (D1) becomes a CHRONO citizen.

**Phase E — Ecosystem workstream (the 13 workers as a real network) and Phase M (MERIDIAN's separate enterprise site).**
- Out of scope for the journal. Each is its own plan, its own PR, its own branch.

---

## 6. Costs / monthly allowance sanity check

The Cloudflare free tier's monthly allowances are generous for this shape of site. A quick back-of-envelope:

- **Workers AI embeddings (Feature A build):** ~100 embeddings per release × N releases/month. Well under any free-tier allowance.
- **Workers AI embeddings (Feature A runtime):** 1 embedding per user query. If the journal sees 10,000 queries/month, that is 10,000 embedding requests. Free tier on the small embedding models accommodates this comfortably; if traffic spikes, the journal degrades to "show paper list, no rank" instead of failing.
- **Vectorize:** ~100 vectors stored. Free tier handles thousands.
- **D1:** ~1 row per deploy. Tens per month at most.
- **KV:** ~100 entries (one per paper-graph row). Reads dominate; well within free tier.
- **Browser Run (Feature C):** ~34 invocations per release. If we release weekly, that's ~136 invocations/month. Within free tier.
- **Queues:** out of scope for the journal.
- **Containers:** out of scope for the journal.

If any feature crosses an allowance, the build pipeline can detect it (Cloudflare API returns usage) and the feature self-disables with a sanitised "feature paused" note in the footer. The journal never goes dark; only its augmentations do.

---

## 7. Open questions for Alfredo

1. **Semantic search now or later?** Feature A is the highest-value addition. It is also the most visible. Light it up in C2 or wait until the journal has been quiet for a while first?
2. **Audit ledger format.** Should the public `/audit/` page show the full file manifest by default, or hide it behind a "show manifest" toggle?
3. **PDF aesthetic.** Should PDFs match the web page aesthetic exactly, or use a traditional academic two-column LaTeX-shaped layout? (Both are achievable in Browser Run via CSS print rules.)
4. **OG card style.** Should the social card show only the Latin title, or both Latin title + English subtitle? Should the watermark say `VIVIT · MEMINIT · DONAT` or only the paper's three-word encoding (where one exists)?
5. **MERIDIAN's separate domain — when?** Not on the journal, but the capability set is also what unlocks MERIDIAN's public face. Worth scoping that plan once the journal stabilises.

These are doctrinal, not technical. The agent does not have a side on them.

---

## 8. The single non-negotiable, restated

> *Everything on this page is real. Nothing here bypasses the sanitiser. If something is claimed, the source is one click away. If something isn't proven, the page says so.*

Every capability above is an opportunity to break this rule or to deepen it. The plan above chooses deepening. Search returns sources. The graph is built from content. The ledger is the deploy history. The heartbeat is computable. The PDFs are the same words on a different surface.

Nothing in the plan offers "AI-generated commentary" on the papers. Nothing offers "an assistant that explains the work." Those would be different products, with different doctrines, and they do not live in the journal.

---

*VIVIT · MEMINIT · DONAT.*
