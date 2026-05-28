# PARRALAX-AIHFTFUND — Plan

**Branch:** `cursor/parralax-aihftfund-charter-fb8a` (off `main`, separate from the journal branch)  
**Status:** Planning document. No implementation.  
**Sibling docs:** `CHARTER.md` (your charter, verbatim) · `READING.md` (the architectural mapping).

---

## 0. What this PR is for

This PR lands two artifacts on `main`:

1. The PARRALAX charter as prior art.
2. The reading — the document that proves PARRALAX is the financial-domain instance of the same organism the journal, ORO, and MERIDIAN already implement.

It does not start the build. It establishes the IP, fixes the doctrine, and scopes the work.

---

## 1. The three surfaces, restated

| Surface | Where it lives | Contains |
|---|---|---|
| **Public charter** | This repo, this PR | Charters, doctrines, protocol specifications. Prior art. No code. |
| **Implementation** | A new private (or key-free public) repository: `parralax-aihftfund` | Protocol implementations, agent runtimes, venue adapters, paper engine, receipt schemas, tests. |
| **Operational** | Operator-private (Cloudflare secrets / 1Password / YubiHSM / hardware signer) | Real API keys, wallet private keys, broker credentials, live strategy parameters. **Never in any repository, public or private.** |

The boundary between surfaces is the only thing the agent can enforce by design. Once a key is in a file, the only protection left is the sanitiser and operator discipline. The boundary keeps that line crisp.

---

## 2. The minimum public PARRALAX surface, after this PR

What lives in `parralax-aihftfund/` of this repo after this PR is merged:

```
parralax-aihftfund/
  CHARTER.md         your charter, prior art established 2026-05-28
  READING.md         the architectural mapping
  PLAN.md            this document
```

What lives there **after the next public-charter PRs** (each its own commit, each its own subdoctrine):

```
parralax-aihftfund/
  CHARTER.md
  READING.md
  PLAN.md
  AGENT_AUTHORITY_CHARTER.md     ← Levels 0–6, mapped to VOXIS authority bits
  RISK_CHARTER.md                ← every risk gate from § 16, with the receipt schema
  KILL_SWITCH_DOCTRINE.md        ← multi-trigger union, asymmetric stop/start
  SIMULATION_PROMOTION_PROTOCOL.md ← paper → guarded_live → governed_live
  COMPLIANCE_BOUNDARY.md         ← jurisdiction · entity · permitted markets · thresholds
  TRADE_TRUTH_LADDER.md          ← the seven-position state machine (see READING § 2)
  ASSET_ISSUANCE_CHARTER.md      ← internal tokens, NFTs, supply / rights / proof rules
  TREASURY_CHARTER.md            ← TRESOR agent's mandate and limits
  EXECUTION_DOCTRINE.md          ← the § 19 loop, formalised
  RECEIPT_SCHEMA.md              ← the CHRONO entry schemas for every receipt class
  PROTOCOLS/                     ← markdown specs of the protocol families in § 13
    TRADING/
    RISK/
    GOVERNANCE/
    ASSET/
    PROOF/
    MEMORY/
```

This is all written-doctrine. No code. The implementation repo references these specs.

---

## 3. The agent council for PARRALAX

Reusing existing names where they fit, coining new ones where they must. All ten are VOXIS units (doctrine · helix · sync · heartbeat · wallet). All ten inherit the RSHIP grammar.

| # | Name | Latin / Greek | Role | New? |
|---|---|---|---|---|
| 1 | **VIGIL** | *the watchman* | Market observer — price action, volatility, liquidity, on-chain flows | reuse (worker registry) |
| 2 | **AUGUR** | *Roman diviner who read signs* | Signal generator — scores, arbitrage detection, regime classification | **new** |
| 3 | **VECTOR** | *carrier* | Execution path — order routing, venue selection, fill management | reuse (ORO agent) |
| 4 | **VENDITOR** | *seller / transactor* | Venue-side adapter — concrete API calls to brokers, exchanges, DEXes | **new** |
| 5 | **CUSTOS** | *the guardian* | Risk gates — every position, every order, every transfer fails closed by default | reuse (journal council) |
| 6 | **TRESOR** | *thesaurus → treasury* | Capital movement — fiat, stablecoins, wallet balances, accounting units | **new** |
| 7 | **ARCHON** | *ruler / judge* | Governance integrity — strategy approvals, treasury auth, charter compliance | reuse (ORO agent) |
| 8 | **FABRICOR** | *the builder* | Asset issuance — internal tokens, NFTs, compute-receipt artefacts | reuse (journal council; same name, new artefacts) |
| 9 | **SCRIBA** | *scribe* | Trade-receipt indexer — every action produces an entry it captures | reuse (journal council) |
| 10 | **ARBITER** | *judge / settler* | Settlement & manifest — end-of-period sealing, dispute resolution, hashes | reuse (journal council) |

This council answers Charter § 12 completely. Five existing names; five new coinages; one consistent VOXIS doctrine across all ten.

**Adjacent council members already named elsewhere in the corpus that may be invoked but are not core:**

- **CEREBRUM** (worker registry) — could front a unified gateway / API surface for the operator dashboard.
- **NUNTIUS** (journal council) — could announce performance digests (with the privacy posture decided per § 5 below).
- **MEDICUS** (CIVITAS INTELLIGENTIAE) — self-heal for agent process failure.

---

## 4. The truth ladder for trades

From `READING.md` § 2, restated here because it is the spine of the execution doctrine:

```
signal_emitted        — AUGUR has emitted a candidate signal
signal_validated      — passed schema + sanity (no NaN, no stale data, no anomaly)
risk_passed           — every CUSTOS gate has cleared (capital, exposure, vol, slippage…)
order_authorised      — ARCHON has recorded the authorisation receipt
order_placed          — VENDITOR has submitted to the venue; ack received
fill_received         — venue has reported fill (price, size, fees)
settled_reconciled    — ARBITER has matched the fill to the ANTE; CHRONO sealed
```

Each transition is gated by evidence, never by authority. Each transition writes a receipt. The trade cannot be reported as profitable until `settled_reconciled` is reached and the realised P&L is computed against the actual fill price, not the expected one.

The chrono triple per trade:

```
ANTE   = market state at signal_emitted (top-of-book, mid, spread, depth, vol regime)
MEDIUS = exact state at fill_received (immutable, the slippage baseline)
POST   = settled outcome (actual price, slippage, P&L, exposure delta)
```

This is `PROTOCOL-II — Truth Ladder` and `Paper XXIV — Ante · Medius · Post`, instantiated for trades. Same machinery. No new substrate.

---

## 5. The decisions only you can make

These cannot be resolved by the agent. They need your call before the implementation repo can be scoped properly.

### 5.1 The compliance boundary (highest priority)

- Operator jurisdiction — Texas / United States.
- Entity for custody — sole proprietor, single-member LLC, registered RIA, registered CTA, exempt, or none-yet (paper-only)?
- Markets in scope on day one — crypto only, equities via a registered broker (Alpaca / IBKR), FX via OANDA, DeFi via own wallet?
- Counterparty discipline — any external participants ever, or strictly proprietary capital?
- Tax posture — mark-to-market election (§ 475(f)) likely, but that's a CPA call, not the agent's.

The shape of `COMPLIANCE_BOUNDARY.md` depends on the answers. The agent will draft once you set the parameters; it will not draft on assumptions.

### 5.2 The visibility posture

PARRALAX is operational. It is NOT a journal-style public surface. But it has multiple visibility tiers worth deciding now:

- **Charter family** — public (this repo, prior art, IP). Yes.
- **Performance** — public, private, or aggregated-anonymised? Most serious quant operators publish nothing; some publish monthly aggregates.
- **Strategy descriptions** — public general / private specific. Standard pattern.
- **Live position book** — private, always. (Even strategy-disclosed funds don't show live positions.)
- **Audit log of trades for compliance** — operator-only, but reproducible from the receipts.

Default if nothing is said: charter public, everything else private.

### 5.3 The substrate stack for the implementation repo

Decisions, with the agent's recommendation in italics:

- Language for agents — *TypeScript with strict typing (consistent with journal; large ecosystem of exchange/broker SDKs).*
- Receipt store — *SQLite at first; D1 when on Cloudflare; eventually CHRONO on ICP via the same Public Gateway canister pattern.*
- Market-data ingestion — *Cloudflare Workers with KV cache + Vectorize for similar-regime lookup; Hyperdrive if a Postgres time-series backend is added.*
- Paper-execution engine — *deterministic, in-process, no network. Same agent code, different VENDITOR.*
- Live-execution venue adapters — *one per venue, each its own NPM module, each requires its own credential bundle, each capable of running in paper mode without those credentials.*
- Kill switch — *Durable Object (single source of truth across workers).*
- Reporting — *static site generated by the same Astro pipeline the journal uses, operator-private, served from a separate Pages project (`parralax-ops` or similar).*

These are all reversible. Sketching them now lets the build start.

### 5.4 The branch / repo decision

Two options, your call:

- **Option A** — create a new repository `FreddyCreates/parralax-aihftfund` and start the implementation there. Recommended. Clean separation. No risk of leaking implementation patterns into the public showcase.
- **Option B** — implement in a sibling top-level `parralax-aihftfund-impl/` directory inside this repo, broadly gitignored (like `src/` already is) with explicit allowlist for sanitised public-doctrine docs. Possible, but the leak risk is higher.

The agent strongly recommends Option A. The agent will not create a new repository without explicit instruction.

---

## 6. The order of public-charter PRs (after this one)

Each of these is a separate PR on its own branch off `main`. Each one lands a single concept fully written. None of them contain code.

1. **`parralax: AGENT_AUTHORITY_CHARTER.md`** — Levels 0–6 mapped to VOXIS authority bits and to wallet allow-lists.
2. **`parralax: RISK_CHARTER.md`** — every risk gate from charter § 16.3, with the receipt schema and the gate's failure semantics.
3. **`parralax: KILL_SWITCH_DOCTRINE.md`** — the multi-trigger union, the asymmetric start/stop semantics, the reset-requires-governance rule.
4. **`parralax: SIMULATION_PROMOTION_PROTOCOL.md`** — the gate that lets a paper strategy become a live one, never reversed by an agent.
5. **`parralax: TRADE_TRUTH_LADDER.md`** — the seven-position state machine, formalised as a protocol document with the receipt schema per transition.
6. **`parralax: RECEIPT_SCHEMA.md`** — the CHRONO entry schemas for every receipt class.
7. **`parralax: COMPLIANCE_BOUNDARY.md`** — written only after the answers in § 5.1 above are set.

The order is intentional. Authority before risk; risk before kill-switch; kill-switch before promotion; promotion before truth-ladder; truth-ladder before receipt-schema; everything before compliance.

The agent will draft each one when asked. Until then they remain proposals.

---

## 7. The order of implementation PRs (in the separate repository)

Drafted here so the work is scoped, not because anything is to be built today.

```
Phase 1 — Foundation (mirrors charter § 32 Phase 1)
  1.1 Repository scaffold + sanitiser + CI (mirror of journal pipeline)
  1.2 Receipt schema + CHRONO-style write-only journal
  1.3 Doctrine block infrastructure (every agent reads it on every heartbeat)
  1.4 The 10-agent VOXIS skeletons (no behaviour yet)

Phase 2 — Paper Execution
  2.1 Market-data adapters (read-only, free-tier feeds first)
  2.2 AUGUR — basic signal protocol
  2.3 CUSTOS — every gate from charter § 16.3, fail-closed
  2.4 VECTOR + VENDITOR (paper venue) — deterministic in-process fills
  2.5 SCRIBA — trade receipt indexer
  2.6 ARBITER — end-of-session manifest

Phase 3 — Strategy Memory + AURUM
  3.1 NEXORIS-style pheromone field over (asset, regime, venue)
  3.2 φ-compounding memory of winning conditions
  3.3 Strategy-drift detector

Phase 4 — Live Venue Adapters
  4.1 One crypto exchange (CCXT-class, key-gated, paper-mode by default)
  4.2 One equities broker (Alpaca or IBKR, paper-account default)
  4.3 One DEX adapter (read-only first; signing requires hardware path)

Phase 5 — Authority Promotion
  5.1 Level 0 → Level 4 promotion gates (per AGENT_AUTHORITY_CHARTER)
  5.2 Kill switch (Durable Object; multi-trigger)
  5.3 Guarded live (smallest possible position sizes)

Phase 6 — Sovereign Fund Operating Layer
  6.1 Operator dashboard (Astro + Pages, operator-private)
  6.2 TRESOR — treasury accounting
  6.3 Strategy allocation engine
  6.4 Performance + receipt audit exports

Phase 7 — Autonomous Coordination
  7.1 Multi-agent strategy composition
  7.2 Cross-market arbitrage
  7.3 Adaptive authority (CUSTOS automatically narrows on drift)
```

This roadmap is the charter's § 32 with the agent council mapped in. Nothing is committed; the order is proposed.

---

## 8. What the agent will do next, by default

Unless you say otherwise:

- **Land this PR** when you approve it. Just the three files (`CHARTER.md`, `READING.md`, `PLAN.md`) in `parralax-aihftfund/`.
- **Wait** for direction on:
  - Whether to draft the next public-charter document (Authority? Risk? Kill switch?).
  - Whether to set up the implementation repository (Option A above) — the agent will not do this without explicit instruction.
  - Whether to extend the journal's MUNDATOR COGNITUS with finance-specific patterns (wallet addresses, exchange-account IDs).

If you say "keep going" without specifying, the agent will draft, in order, the next three subcharter documents (`AGENT_AUTHORITY_CHARTER.md`, `RISK_CHARTER.md`, `KILL_SWITCH_DOCTRINE.md`) on this same branch. It will still not start the implementation repository without explicit instruction.

---

## 9. One non-negotiable, restated

Same doctrine as the journal, scoped for finance:

> Every executed trade has a receipt. Every receipt has a hash. Every hash is chained to the prior. No trade is `settled` until the chain closes. No agent escalates its authority without governance. No kill switch is reset without a council. No live key sits in a file. No simulation result is reported as a real result. No real result is reported until reconciled.

That is PARRALAX. It is the same doctrine as the journal — *every claim has a source, nothing bypasses the gate, the system stays unsurveilled* — applied to capital instead of words.

---

*Build real financial machinery. Govern every agent. Prove every action. Control every risk. Preserve trader sovereignty.*
