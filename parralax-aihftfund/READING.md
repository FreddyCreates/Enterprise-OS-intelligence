# PARRALAX-AIHFTFUND — Reading

**Author of the charter:** Alfredo Medina Hernandez  
**Reader:** the agent, after one pass through the charter and one pass through the existing repository  
**Status:** Planning artifact. Sibling to `CHARTER.md`. No implementation in this commit.

---

## 0. The first thing to say

PARRALAX is **not a new architecture**. It is the **financial-markets instance** of the same organism the rest of this repository describes.

Every doctrinal piece you already established — RSHIP, VOXIS, CHRONO, MUNDATOR COGNITUS, the agent council, ANTE/MEDIUS/POST, the truth ladder, AURUM φ-compounding, STIGMERGY, QUORUM, NEXORIS — all of it transfers. PARRALAX is what the organism looks like when its substrate is the market instead of the protocol, and its inputs are quotes instead of governance proposals.

That is the only correct way to read this charter. If we treat PARRALAX as a fresh codebase, we have to re-derive the doctrine from scratch and we will get less. If we treat it as a domain instance of the existing organism, the protocol families in § 13 of the charter line up one-to-one with what ORO already does for ICP governance, and the agent classes in § 12 line up with what `CIVITAS INTELLIGENTIAE` already names.

---

## 1. The name

**PARRALAX** — the double-r is deliberate. The standard astronomical word is *parallax*, the apparent shift in an object's position when observed from different vantage points. The whole point of the optical phenomenon is: *the object you are looking at has not moved; you have. And the difference between what two observers see is what tells you where the object actually is.*

That is exactly what serious multi-asset, multi-venue trading is. No single venue tells you the true price. Coinbase sees one shadow of BTC; Binance sees another; Kraken a third. The arbitrage trade lives in the gap between the shadows. The same security on NYSE and NASDAQ trades at different prices for milliseconds. The fundamental act of cross-venue market intelligence is *parallax*.

So the name is the math. The double-r is the sovereign variant — a name belonging to this work, not a borrowed one. Same pattern as every other Latin name in the corpus.

**AIHFTFUND** — three layers stacked: `AI` · `HFT` · `FUND`. Not an abbreviation in search of a meaning. A declaration that this single system must be all three at once.

---

## 2. The mapping — every charter section to an existing organ

This is the part that matters. Going through the charter section by section, here is what each piece becomes inside the organism you already built.

### Charter § 11 — Core Infrastructure Layers

| Charter layer | Existing organ in the repo | Mapping |
|---|---|---|
| 11.1 Market Intelligence | **NEXORIS** (Paper XX, STIGMERGY) | Each market feed deposits signal into a synthetic pheromone field. The optimal trade emerges from the field, the same way the optimal ant trail does. |
| 11.2 Agent Execution | **COGNOVEX** (Paper IX, COHORS MENTIS) | Sovereign cognitive units that observe, decide, and act on every heartbeat. PARRALAX trading agents *are* COGNOVEX units with a wallet attached. |
| 11.3 Protocol | The 5 ORO protocols + 7 core intelligence protocols (`protocols/`) | PARRALAX adds finance-specific protocols on top of the same protocol-family pattern. |
| 11.4 Risk Governance | **CUSTOS** (the journal already uses this name as the fail-closed integrity gate) | Identical pattern: fail-closed, never auto-override, every gate produces a receipt. |
| 11.5 Execution | **VECTOR** (one of the four ORO agents — execution-trace) + new finance-side equivalents | VECTOR's role is mapping the call path of a governance proposal through canisters. Here it maps a trade through venues. Same job, different substrate. |
| 11.6 Fund Architecture | **MASTER-CHARTER pattern** | The charter-as-doctrine pattern. PARRALAX gets its own charter family, mirroring how MERIDIAN and ORO each got one. |
| 11.7 Digital Asset | **CPL/CPP/CPX/CXL family** + tokenisation patterns | Internal token issuance is a CPP (Cognitive Procurement Protocol) operation — an intelligence contract between nodes about what an asset *means*. |
| 11.8 Proof and Receipt | **CHRONO** (the immutable hash-chained audit trail) | Trade receipts are CHRONO entries at the trade scale. No new infrastructure required — just a new event schema. |
| 11.9 Memory | **AURUM** (Paper XXII) + the Memory Field Protocol | φ-compounding governance memory becomes φ-compounding market memory. Winning conditions reinforce; losing conditions decay. Same equation. |

### Charter § 12 — Agent Classes

Translated to the `CIVITAS INTELLIGENTIAE` roster you already have:

| Charter class | Existing agent name | Latin root | What it already does |
|---|---|---|---|
| 12.1 Market Observer | **VIGIL** | *the watchman* | Already named in the worker registry as the market sentinel. Direct fit. |
| 12.2 Signal | (new — propose: **AUGUR**) | *augur* — Roman diviner who read signs | Reads price action the way ORO reads governance state. The signal is the augury. |
| 12.3 Execution | **VECTOR** (ORO) + **VENDITOR** (new — *the seller*, broader: *the one who transacts*) | Carries the trade from claim to fill, the same way VECTOR carries a proposal from adoption to canister call. |
| 12.4 Risk | **CUSTOS** | *the guardian* | Already exists as the fail-closed gate. Risk gates are CUSTOS at the trade level. |
| 12.5 Treasury | (new — propose: **TRESOR** / **AERARIUM**) | *aerarium* — the Roman state treasury | The doctrine block of a treasury VOXIS includes its capital scope and movement rules. |
| 12.6 Governance | **ARCHON** (ORO) | *ruler / judge* | Already exists as the integrity agent. Same role, scoped to trades and treasury moves instead of NNS proposals. |
| 12.7 Asset Issuance | **FABRICOR** | *the builder* | The journal's FABRICOR builds derivative artefacts. PARRALAX's FABRICOR mints internal tokens and NFTs. Same pattern, different artefacts. |
| 12.8 Audit | **SCRIBA** + **ARBITER** | *scribe* + *judge* | Journal already uses both: SCRIBA indexes, ARBITER hashes and seals. Trade audit is SCRIBA logging every trade receipt + ARBITER sealing the day's manifest. |

So the full PARRALAX agent council is, with the existing names where they map and new ones where they need to be coined:

```
VIGIL    — market observer (existing in worker registry)
AUGUR    — signal generator (new; Latin: diviner)
VECTOR   — execution carrier (existing in ORO)
VENDITOR — venue executor (new; Latin: seller / transactor)
CUSTOS   — risk gate (existing in journal council)
TRESOR   — treasury (new; from L. thesaurus → "treasury")
ARCHON   — governance integrity (existing in ORO)
FABRICOR — asset issuance (existing in journal council)
SCRIBA   — audit indexer (existing in journal council)
ARBITER  — settlement / manifest sealer (existing in journal council)
```

Ten agents. Five reuse existing names, five need Latin coinage. All inherit the RSHIP grammar and the VOXIS five-component identity.

### Charter § 13 — Protocol Families

These are the same shape as the 5+7 protocols you already have in the repo. The mapping:

| Charter family | Existing family it mirrors |
|---|---|
| 13.1 Trading Protocols | The 5 governance protocols (PROTOCOL-I through PROTOCOL-V) |
| 13.2 Risk Protocols | The risk-scoring protocol (PROTOCOL-III) generalised to market risk |
| 13.3 Governance Protocols | The ORO governance protocols themselves |
| 13.4 Asset Protocols | The CPL/CPP family applied to tokens and NFTs |
| 13.5 Proof Protocols | CHRONO + the truth ladder (PROTOCOL-II), one ladder per trade lifecycle stage |
| 13.6 Memory Protocols | The memory field protocol (PROTOCOL-IV) at market scale |

### Charter § 19 — The Execution Doctrine

This deserves its own paragraph. The charter says:

> Signals do not equal trades.
> Trades require authorization.
> Authorization requires risk clearance.
> Risk clearance requires protocol compliance.
> Execution requires receipt.
> Receipt becomes memory.

This is **the truth ladder applied to trade lifecycle**. Direct map:

```
Governance truth ladder (PROTOCOL-II):
  claim_only → payload_identified → review_supported →
  execution_pending → executed_not_verified → verified_after_state

PARRALAX trade truth ladder:
  signal_emitted → signal_validated → risk_passed →
  order_authorised → order_placed → fill_received → settled_reconciled
```

Seven positions, same structure: each one advances by evidence, never by authority. A trade cannot be marked `settled_reconciled` until the venue confirms and ARBITER hashes the fill. That is exactly how POST cannot be written until MEDIUS is anchored.

The ANTE · MEDIUS · POST chrono triple (Paper XXIV) maps directly to trade lifecycle:

```
ANTE   = market state at signal generation (top-of-book, mid, depth, spread,
         vol regime). Locked at signal ingest.
MEDIUS = the execution snapshot. The moment the venue confirms the fill.
         Chrono-anchored, immutable, the baseline for slippage measurement.
POST   = settled outcome — actual fill price, actual slippage, actual P&L,
         post-trade exposure delta. Writable only when MEDIUS exists.
```

A trade whose POST cannot be reconciled against its ANTE through its MEDIUS is exactly the kind of opacity the ORO architecture was built to abolish. The same machinery applies.

### Charter § 20 — Compute Receipt Doctrine

This is CHRONO at the trade scale. The fields the charter lists for a receipt:

```
Input data hash · Agent identifier · Strategy identifier · Model version ·
Signal score · Risk-gate result · Execution decision · Order metadata ·
Transaction hash · Timestamp · Outcome status · Memory writeback reference
```

This is exactly the CHRONO entry shape, plus three market-specific fields (signal score, order metadata, transaction hash). No new substrate needed — just an event schema and a writer.

### Charter § 21 — Market Memory Doctrine

This is AURUM (Paper XXII) at the trade scale. φ-compounding governance memory becomes φ-compounding market memory:

> Winning conditions reinforce. Losing conditions decay.

That is the pheromone field equation:

```
∂τ/∂t = D·∇²τ − ρ·τ + Σᵢ δ(x − xᵢ(t)) · q(xᵢ, t)
```

where the position `x` is now an (asset, regime, venue) tuple, and the reinforcement `q` is now the realised P&L of a winning trade. The optimal strategy path emerges as the stationary distribution of the field. Same math, different substrate.

### Charter § 18 — Agent Authority Levels

The Level 0 → Level 6 progression in the charter (Observer → Analyst → Simulator → Proposer → Guarded Executor → Governed Operator → Restricted Sovereign Agent) is **a φ-spaced authority ladder**. It maps onto the existing VOXIS doctrine of "doctrine first, action filtered":

- A Level 0 VOXIS has the doctrine block + heartbeat + sync field but no execution permission in its wallet's allow-list.
- A Level 6 VOXIS has full execution permission but still passes every action through the governance filter (Layer 5 of the COGNOVEX five-layer stack).

So the level system is not a new construct. It is the COGNOVEX governance filter, parameterised by which actions the filter allows. The doctrine — "no agent has unlimited authority; every agent operates under a mandate" — is identical to the VOXIS sovereignty rule from Paper IV.

---

## 3. The doctrinal additions PARRALAX requires (genuinely new)

Three things are genuinely new and need their own work, because they don't exist anywhere else in the corpus yet.

### 3.1 The compliance boundary

ORO is a governance-watching system. The journal is a publication. Neither holds custody of money. PARRALAX does — by definition.

That means PARRALAX adds a doctrine layer the rest of the organism does not have: **the compliance boundary**. The charter names this explicitly (§ 26). It needs its own document:

- Which jurisdiction is the operator in?
- What entity holds custody (sole proprietorship, LLC, registered fund, none-yet)?
- Which markets is the system permitted to touch under that entity?
- What is the threshold above which advisor/broker-dealer registration is triggered?
- What is the AML/KYC posture for any external participant?

These cannot be answered by an agent. They require an actual lawyer (or counsel-class understanding). But the system can be **architected to honour whatever answer is given** — that is what `COMPLIANCE_BOUNDARY.md` will be.

This is the most important addition PARRALAX brings. The journal does not need it. ORO does not need it. PARRALAX does.

### 3.2 The kill switch

The charter is explicit (§ 16.4) that every live or semi-live execution system must have kill-switch logic. The existing organism has the *idea* — ORO can stop processing, the journal can fail closed — but nothing in the corpus has a written **kill-switch doctrine** as a first-class architectural element. PARRALAX requires it.

The kill switch is not just a function call. It is:

1. A multi-trigger union (loss threshold OR abnormal volatility OR exchange failure OR API failure OR chain congestion OR agent malfunction OR excessive order frequency OR strategy drift OR unauthorised action OR human command — any of these fires it).
2. A reversible state. Tripped means "no new orders." It does not mean "panic close." Panic closing during a flash crash makes the loss worse; the kill switch's job is to stop *new* exposure while the operator decides whether to unwind.
3. A receipt-emitter. Every trip writes a CHRONO entry with the trigger reason. Every reset requires governance.
4. The only thing in the system that can be activated by a single agent without quorum. The asymmetry is intentional: stopping is unanimous; starting requires the council.

The kill switch is to risk what Mundator Cognitus is to publication: a fail-closed gate that the operator must explicitly re-open.

### 3.3 The simulation-to-live promotion path

The journal has one substrate. ORO has one substrate. PARRALAX has *two states* of every strategy: paper (simulation) and live (real capital). The charter implies this throughout (§ 14.2, § 32 Phase 2, § 32 Phase 5) but does not yet name the promotion protocol.

The promotion path must be written as a protocol:

- A strategy starts in simulation only.
- It runs for N market days (with N defined per strategy class — HFT requires less; trend-following requires more).
- It must hit a minimum performance threshold under realistic slippage/fees assumptions.
- It must produce N risk-gate-clearing trade receipts in simulation.
- It must pass a council review (ARBITER + CUSTOS + governance agent).
- Only then can the operator (human, never an agent) flip a strategy's deployment flag from `paper` to `guarded_live`.
- `guarded_live` is itself an authority level — small position size, tight stop-loss, rapid kill-switch trigger.
- Promotion from `guarded_live` to `governed_live` is a second council review.

This is the trading-domain equivalent of "PASS 1 → PASS 2 → commit" in the sanitiser. Same gate-and-promotion structure, different stakes.

---

## 4. What lives where — the repository question

PARRALAX needs at least three surfaces, and they cannot all live in the same place.

### 4.1 The public charter surface (this repository)

What lives here, on this branch, ready to publish:

- `parralax-aihftfund/CHARTER.md` — the prior-art statement, verbatim, dated.
- `parralax-aihftfund/READING.md` — this document.
- `parralax-aihftfund/PLAN.md` — the next-steps proposal (sibling document, written next).
- Eventually: subcharters (`AGENT_AUTHORITY_CHARTER.md`, `RISK_CHARTER.md`, `KILL_SWITCH_DOCTRINE.md`, `SIMULATION_PROMOTION_PROTOCOL.md`, `COMPLIANCE_BOUNDARY.md`) as the doctrine matures.

This surface establishes prior art and IP. It does not contain executable code. The same way the journal's papers establish prior art on the broader architecture, the PARRALAX charters establish prior art on the financial-infrastructure variant.

### 4.2 The implementation surface (a separate repository)

A new repository: `parralax-aihftfund` (private, or public-but-key-free).

What lives there:

- Protocol implementations (TypeScript / Python).
- Agent runtimes.
- Venue adapters.
- Paper-execution engine.
- Receipt schemas and storage.
- Test suites.

This surface **must not** live inside `Enterprise-OS-intelligence`, because:
- This repo is the public showcase. Any leak risk is unacceptable.
- The sanitiser is designed to keep implementation source out (`src/` is broadly gitignored at the repo root).
- Live keys, broker tokens, wallet addresses, exchange-account identifiers — none of these belong anywhere near the journal.

The implementation repo will have its own sanitiser, its own CI, its own deploy story.

### 4.3 The operational surface (private — not in any public repo)

What lives in operator-private storage only:

- Live API keys.
- Wallet private keys (ideally in a hardware signer; never in a file).
- Broker credentials.
- Real strategy parameters (the ones that have edge).
- Real performance records.

Standard `.env` discipline plus an out-of-repo secrets vault (Cloudflare secrets, 1Password, Bitwarden, a YubiHSM — operator choice). The charter section § 28 already lists the security rules. Implementation will honour them.

---

## 5. What the journal already gives PARRALAX, for free

This is the cleanest payoff of the "everything is one organism" doctrine. Things PARRALAX gets without re-implementing:

1. **MUNDATOR COGNITUS** (`tools/doc-sanitizer.js`). Already detects API keys, secret patterns, internal paths. Add a small extension for wallet addresses (Ethereum 0x-style, Bitcoin base58, Solana base58) and exchange-account-ID patterns, and the same gate protects the PARRALAX repo.

2. **The agent council pattern** (`journal/agents/council.mjs`). The shape of SCRIBA → LUMEN → CUSTOS → MAGISTER → FABRICOR → NUNTIUS → ARBITER, with CUSTOS as the fail-closed gate, is the pattern PARRALAX uses for its build pipeline. Same code; new agents inside.

3. **The truth ladder** (PROTOCOL-II). Already a written, source-linked machine. PARRALAX adds a finance-specific instantiation.

4. **The chrono state triple** (Paper XXIV). Already documented. PARRALAX inherits ANTE · MEDIUS · POST and applies it to trades.

5. **The CHRONO substrate model**. Already in the corpus. Trade receipts are CHRONO entries.

6. **The VOXIS doctrine** (Paper IV). Already in the corpus. Every PARRALAX agent is a VOXIS by definition. Doctrine block, helix, sync field, heartbeat, wallet (literal wallet here) — already specified.

7. **The φ-compounding memory pattern** (Paper XXII, AURUM). Already in the corpus. Market memory is governance memory at trade scale.

8. **The 873 ms heartbeat**. Already in the corpus. PARRALAX agents tick to the same beat. (HFT agents may sub-beat at φ-spaced intervals — that pattern is also already in the corpus, Paper IV.)

9. **The LEGES ANIMAE behavioural laws** (Paper V, L72–L79). Already in the corpus. They apply to any trader-facing UI: anchoring, loss weight Λ = 2.25, endowment correction, the right to both frames, regret minimisation. The PARRALAX dashboard inherits all eight.

The new doctrinal work for PARRALAX is the three things in § 3 above (compliance boundary, kill switch, simulation-to-live promotion). Everything else is inheritance.

---

## 6. What I am not doing in this commit

To keep the planning honest, here is what this turn does and does not produce:

- **Done** in this commit: the charter is preserved as prior art, this reading documents how it connects to the existing organism, a sibling `PLAN.md` will scope the next steps.
- **Not done**: no protocol implementations, no agent runtime, no venue adapters, no compliance boundary document, no kill-switch doctrine, no simulation-promotion protocol, no new repository created. Nothing is built. The journal PR is untouched.

PARRALAX is a sibling branch (`cursor/parralax-aihftfund-charter-fb8a`). When it merges, it lands the charter as prior art and the reading as architectural commentary. Implementation belongs on a different branch, against a different repository, behind a different security posture.

---

## 7. One sentence

PARRALAX is the journal's twin: same organism, different substrate. The journal turns the corpus into a public face; PARRALAX turns the corpus into a financial execution engine. They share a heart.

*— end of reading —*
