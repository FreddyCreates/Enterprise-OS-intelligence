# PARRALAX-AIHFTFUND

> Sovereign AI-native financial execution infrastructure.

This directory holds the **public charter family** for `PARRALAX-AIHFTFUND` — the financial-markets instance of the same organism described elsewhere in this repository (the journal, the papers, ORO, MERIDIAN, the CIVITAS INTELLIGENTIAE agent roster).

This is prior-art only. **No implementation code lives here.** The implementation belongs in a separate repository, behind separate security posture (see `PLAN.md` § 1 and § 5.4).

## Documents

### Root

| Document | Purpose |
|---|---|
| [`CHARTER.md`](./CHARTER.md) | The canonical PARRALAX-AIHFTFUND charter, v1.0, verbatim. Prior art. |
| [`READING.md`](./READING.md) | The architectural mapping. How every section of the charter resolves to an organ that already exists in the corpus (NEXORIS, COGNOVEX, CHRONO, ANTE·MEDIUS·POST, the truth ladder, AURUM, VOXIS), and where genuinely new doctrine is required (compliance boundary, kill-switch doctrine, simulation-to-live promotion). |
| [`PLAN.md`](./PLAN.md) | Next steps. The 10-agent council, the seven public sub-charters proposed, the seven-phase implementation roadmap, and the decisions only the operator can make. |

### The three walls between intent and execution

| Document | Purpose |
|---|---|
| [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) | **Who is allowed to act.** Levels 0–6 formalised as VOXIS doctrine-block fields, mapped to capability enumerations and wallet allow-lists. Promotion (deliberate, one level at a time, with receipts); demotion (automatic, eight triggers). No agent withdrawal at any level. No instantiation above Level 0. |
| [`RISK_CHARTER.md`](./RISK_CHARTER.md) | **What an action must clear before it executes.** Thirteen CUSTOS gates, each with parameter schema, check rule, failure semantics, receipt class. Capital · Exposure · Leverage · Volatility · Drawdown · Liquidity · Slippage · Venue · Chain · Smart-contract · Counterparty · Model-confidence · Strategy-consistency · Human-override. Three operator-selectable risk tiers (STRICT / STANDARD / WIDE), default STRICT. |
| [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) | **The last wall.** Multi-trigger union, asymmetric stop/start (any one signed trigger trips; council vote required to reset; system reset requires hardware-signer ceremony). Canonical state in a Durable Object, never cached. **No auto-close of positions** — the switch stops new exposure; unwinding is deliberate operator action. |

These three documents together specify the entire trade-authorisation pipeline: an action proposed by an agent must pass its authority check (Authority Charter), then every relevant risk gate (Risk Charter), then a check that no kill switch covering its resources is tripped (Kill Switch Doctrine). Failure at any wall halts the action and writes a CHRONO entry.

### Geography, asset universe, prediction-market sub-doctrine

| Document | Purpose |
|---|---|
| [`DALLAS_MARKET_DOCTRINE.md`](./DALLAS_MARKET_DOCTRINE.md) | **The home-venue doctrine.** PARRALAX is Dallas-resident and Dallas-oriented. TXSE is preferred when live (tie-breaker, not constraint). MXN/USD is tier-1 FX by proximity. America/Chicago is the operational rhythm. Federal compliance governs first; Texas state posture is the simplifying layer. Four-pole U.S. equity model: NY/NJ · Chicago · Texas · crypto-native. |
| [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) | **The enumerated universe.** Nine asset families with day-1 status: crypto majors (spot) · stablecoins · fiat (FX) · listed equities · external AI tokens · NFTs · prediction markets · internal accounting units · internal PARRALAX tokens. Every asset enters at STRICT; loosening is gated. Six categories permanently excluded by doctrine. 90-day watchlist before inclusion; 180-day before re-inclusion of a retired asset. Internal PARRALAX tokens — none on day 1, every future issuance gets its own charter. |
| [`PREDICTION_MARKETS_CHARTER.md`](./PREDICTION_MARKETS_CHARTER.md) | **A distinct family with its own doctrine.** Three sub-families (regulated · decentralised · internal-PARRALAX). Three dedicated CUSTOS gates extend the risk charter (event-concentration · resolution-window · oracle-reliability). PROPHET is a mandate variant of AUGUR — not a new council seat. Internal prediction markets are governance instruments, not speculation; never settle outside the system; never about non-consenting individuals. Truth ladder extends with `resolving` and `disputed`; P&L is provisional until `settled_reconciled`. |

### Operator decision support

| Document | Purpose |
|---|---|
| [`TESTING_INTEGRATION_OPTIONS.md`](./TESTING_INTEGRATION_OPTIONS.md) | **TradingView vs. demo accounts vs. own internal venue — with recommendation.** Test pyramid: unit-tests → internal paper venue → demo accounts on real exchanges → live (guarded). TradingView orthogonal as operator chart UI, never as execution layer. **Two of four questions now resolved** (see TESTING_DOCTRINE below); two remain open. |
| [`TESTING_DOCTRINE.md`](./TESTING_DOCTRINE.md) | **Ratified testing doctrine.** Hardens the two resolved questions: (a) **Alpaca Paper Trading** is the day-one demo-account venue for US equities; future venues (OANDA, Binance Testnet, Kalshi Sandbox, IBKR Paper) require council ratification. (b) **TradingView is a read-only operator overlay only** — never an execution surface, never a kill-switch trigger, never a strategy-parameter store. Locks the four-layer test pyramid as doctrine: unit-tests → paper venue → demo accounts → live (guarded). Skipping any layer is forbidden. Promotion between layers requires operator + council + CHRONO entry. |
| [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md) | **What training means in this doctrine.** Three update surfaces (substrate-side NEXORIS pheromone field · model-side CEREBEX φ⁻¹ Bayesian update · reputation-side φ-EMA ledger). Ten forbidden patterns including: no training on live capital, no third-party model hosts, no mixing simulated and real P&L, **no training that raises an agent's authority level.** Five-stage curriculum T1→T5 aligned with the test pyramid. Every run CHRONO-anchored. Reputation is a signal to the operator, not an authorisation. **Reputation and authority are decoupled by design.** |
| [`SIMULATION_PROMOTION_PROTOCOL.md`](./SIMULATION_PROMOTION_PROTOCOL.md) | **The formal gate between simulation and real capital.** Governs both test-pyramid layer promotions (Layer 1→4) and training-stage promotions (T1→T5). Above the simulation/live boundary, promotions require operator + 3-of-5 council vote + hardware-signer ceremony. Cooldown windows apply post-promotion and are not shortenable by anyone. Ten non-negotiables including: no self-promotion, no evidence re-use from lapsed requests, no promotion receipts without full signature set. Bidirectional asymmetry — requests go up deliberately, demotion comes down automatically. |

### AI models and weights — the operator's own foundation stack

| Document | Purpose |
|---|---|
| [`MODEL_WEIGHTS_DOCTRINE.md`](./MODEL_WEIGHTS_DOCTRINE.md) | **Weights are compute-backed assets (Class C).** Every model has a manifest; no weights load without a matching hash; no third-party model hubs; no third-party inference APIs treated as "our model." Training data provenance is required (source manifest, licence attestation, consent posture, PII redaction, reproducibility hash). Eight-step registration path — no compression permitted. Sunset paths mandatory. Foundation-model bootstrap allowed only under six explicit conditions with the base weights operator-held. |
| [`MODEL_ARCHITECTURES.md`](./MODEL_ARCHITECTURES.md) | **Three architecture specs.** `VATES-8B` (7.92B params · signal generation, ≤100ms · consumed by AUGUR/PROPHET); `AUSPEX-14B` (13.80B params · observation and world-model, ≤500ms · consumed by VIGIL/CEREBEX); `ORACULUM-20B` (19.70B params · council-level reasoning, ≤3s · consumed by ARCHON/ARBITER). All decoder-only LLaMA-family transformers with SwiGLU, RMSNorm, RoPE, GQA (AUSPEX/ORACULUM), shared 32K BPE vocab. Latin names in the divination register matching AUGUR/PROPHET. Parameter counts land within ±1.5% of the label; computed exactly by `parralax-impl/src/models/param-count.ts` and verified in tests. |

### Tokens — registry, taxonomy, and the first concrete proposal

| Document | Purpose |
|---|---|
| [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md) | **Inventory of every internal-token concept named across the corpus.** Forty-one named concepts, **zero issued.** Five classes: Governance · Utility · Compute-backed · Reputation · Risk/credit-units, plus a provenance-NFT transverse pattern. Five concrete token charters proposed (LOCUS first sketch landed; PARRALAX-GOV / -ACCESS / -REP / -TRES not started). Eight-step inclusion path from naming to issuance — no compression permitted. Seven doctrinal constraints universal to every token. |
| [`LOCUS_TOKEN_CHARTER.md`](./LOCUS_TOKEN_CHARTER.md) | **First sketch — place-bound compute-backed entangled tokens.** A LOCUS is a tuple of (geographic boundary + verified work history); the token is the claim. Four sub-families (EDGE · CORE · GRID · SHARED). The "entanglement" concept is precise: structural correlation through shared substrate via Kuramoto coupling (Paper II) — not literal quantum entanglement; honest naming. Value compounds at φ on POST-confirmed work (Paper XXII). The pheromone reaction-diffusion equation (Paper XX) reinterpreted with compute density as the field. Three-root oracle defence against compute washing. Natural prediction-market overlay (capacity / efficiency / outage / entanglement-coherence markets). Five blocking operator questions before this leaves first-sketch status. Eight steps from sketch to a live LOCUS token. |

## What this work is, and what it is not

| Is | Is not |
|---|---|
| The financial-markets instance of an existing organism | A new organism |
| A charter family establishing IP and doctrine | An implementation |
| Sibling to the journal and to MERIDIAN | Part of the journal |
| Public-by-design (prior-art) | A trading bot anyone can run |
| Operator-and-builder-facing | A consumer product |
| Risk-aware, compliance-aware, kill-switchable by construction | A speculative experiment |

## Identity

```
Name:        PARRALAX-AIHFTFUND
Author:      Alfredo Medina Hernandez
Affiliation: Medina Tech · Chaos Lab · Dallas, Texas
Version:     1.0 (charter)
Prior art:   May 2026
```

## The one non-negotiable

> Every executed trade has a receipt. Every receipt has a hash.  
> Every hash is chained to the prior. No trade is `settled` until the chain closes.  
> No agent escalates its authority without governance.  
> No kill switch is reset without a council.  
> No live key sits in a file.  
> No simulation result is reported as a real result.  
> No real result is reported until reconciled.

— `PARRALAX-AIHFTFUND/PLAN.md` § 9
