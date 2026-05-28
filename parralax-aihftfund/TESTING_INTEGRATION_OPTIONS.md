# TESTING INTEGRATION — OPTIONS AND RECOMMENDATION

**Document:** `parralax-aihftfund/TESTING_INTEGRATION_OPTIONS.md`  
**Status:** Decision document. Not yet doctrine. Awaits operator selection. No implementation in this commit.

---

## 0. The question

> Should PARRALAX test agent execution via TradingView, demo accounts on existing exchanges, or its own internal exchange?

This document lays out the three options you raised, their pros and cons, and a recommendation. The recommendation is conservative and stacked — it picks **all three**, in the right order, for the right purposes.

---

## 1. What we are actually testing

Before picking the surface, name the thing under test. There are at least four distinct things:

| # | Thing under test | What evidence we need |
|:--:|:---|:---|
| 1 | **Agent decision logic** | Did AUGUR emit the right signal given the market state? Did CUSTOS correctly fail the right gates? Deterministic, reproducible. |
| 2 | **Execution path** | Did VECTOR route to the right venue? Did VENDITOR's adapter produce the right API call? Did SCRIBA index the result? |
| 3 | **Real-world execution quality** | Slippage, fill rate, partial fills, race conditions, exchange-side errors — none of which a deterministic test can produce. |
| 4 | **Operator experience** | Can the operator see what the system is doing, sanely, in real time? Can the operator intervene? |

A test surface that addresses one of these doesn't address the others. The recommendation below is to use a different surface for each, not to pick one.

---

## 2. Option 1 — TradingView integration

### 2.1 What this is

TradingView is the dominant retail-and-pro charting platform. It offers:
- High-quality charts and indicators (the actual product).
- Pine Script for indicator/strategy authoring.
- Webhook alerts that can fire HTTP requests to any URL.
- "Broker integrations" (Alpaca, Tradier, OANDA, others) that let TradingView place orders on the user's behalf.
- A paper-trading mode on its own simulated venue.

### 2.2 What you'd actually get

Two distinct things, often conflated:

| TradingView surface | What PARRALAX would use it for |
|---|---|
| **The chart UI** | Operator's visual oversight — a real-time view of what's happening, with PARRALAX's positions and signals overlaid. Excellent for *seeing*. |
| **The webhook-to-broker pipe** | A way for TradingView alerts to fire PARRALAX webhooks, OR for PARRALAX to push signals into TradingView indicators. Useful, but limited. |

### 2.3 Pros

- The chart is, candidly, better than what we'd build ourselves in any reasonable timeframe. Operator visibility is a real benefit.
- Webhooks are simple, well-documented, and rate-stable.
- Pine Script lets the operator sketch a strategy idea and see it on a chart before committing it to AUGUR.
- No regulatory complications — it's a chart and a webhook.

### 2.4 Cons

- **TradingView is not an execution venue.** It routes orders through brokers; it isn't one. The actual execution surface is still Alpaca / OANDA / Tradier / etc. So TradingView is an indirection, not a replacement for venue testing.
- **Webhook alerts have latency.** They are not HFT-suitable. Anything that depends on millisecond timing cannot go through this path.
- **It is a third-party dependency.** A free-tier outage means PARRALAX's operator UI goes dark. Paid tiers help but don't eliminate the risk.
- **Your data flows through TradingView's infra.** This violates the journal's "no third-party telemetry" doctrine if PARRALAX strategy parameters are encoded in Pine Script and pushed to TradingView servers.

### 2.5 Verdict on TradingView

**Use it for what it's good at: operator chart UI and "I want to sketch an idea visually before committing it."** Do *not* use it as an execution layer. Do *not* push secret strategy parameters into Pine Script on TradingView's servers.

---

## 3. Option 2 — Demo accounts on existing exchanges

### 3.1 What this is

Most regulated brokers and most major crypto exchanges offer a paper-trading account that mirrors the live API but routes orders to a simulated venue. Names:

- **Alpaca Paper Trading** — US equities, free, very clean API, no balance limit.
- **IBKR Paper Account** — multi-asset, requires live IBKR account, near-identical API to live.
- **Binance Spot Testnet** + **Futures Testnet** — free, separate API keys, periodic resets.
- **Coinbase Sandbox** — limited but free.
- **Kraken Demo** — futures only; spot demo is more limited.
- **OANDA fxTrade Practice** — FX; very mature.
- **Kalshi Sandbox** — for prediction-market testing.

### 3.2 What you'd actually get

Two important things:

| What you get | Why it matters |
|---|---|
| **Real API surface** | The venue's quirks, rate limits, error messages, partial fills, idempotency keys. The things that break in production are usually here. |
| **Real market data** | Real-time top-of-book, real order book, real volatility. You're testing against the actual world. |

You don't get real fills (the orders don't actually clear), so you don't get real slippage or real adverse selection. But you do get the structure of the venue.

### 3.3 Pros

- **The highest-fidelity test short of going live.** Real venues, real data, real APIs, real failures.
- **One adapter per venue** — the same adapter (with a different API key) becomes the live adapter. Symmetry.
- **No capital at risk.** A demo account that destroys its simulated balance is a test you wanted to run.
- **Free.** Every venue above offers paper for free; a few want a live account behind it (IBKR), most don't.

### 3.4 Cons

- **Demo venues do not perfectly model the live venue.** Specifically, demo books are often more liquid than live books, partial fills are rarer, and adverse selection is absent. You will overperform on demo and underperform on live; the gap must be respected.
- **Periodic resets erase track records.** Binance testnet resets monthly, balances reset to default. You cannot use these as a long-term ledger; SCRIBA must preserve its own.
- **Latency is higher on some testnets.** Useful for testing logic, not for HFT validation.
- **API drift.** Demo APIs occasionally diverge from live APIs in ways that bite at promotion time. Both should be in CI.

### 3.5 Verdict on demo accounts

**This is the right surface for "is the agent ready to go live?"** Test against the real APIs of the venues you actually intend to trade on. Promotion to live from paper requires a clean demo-account track record per `SIMULATION_PROMOTION_PROTOCOL` (forthcoming charter).

---

## 4. Option 3 — Build PARRALAX's own internal exchange

### 4.1 Two readings of "own exchange"

You said "create his exchange so he can we can start as him in his own exchange." I read this two ways. Both are real options. Pick one.

#### 4.1.a "Own exchange" = internal paper venue

A deterministic, in-process matching engine that PARRALAX runs locally to simulate fills against a synthetic order book (or against real market data piped in). This is **already in the PLAN.md Phase 2** and is, in fact, the foundation of the entire test pyramid.

#### 4.1.b "Own exchange" = a real, registered exchange

A separate regulated venue under a separate legal entity (a money-services business, an alternative trading system, or a registered exchange). This is a real strategic option — particularly given the Dallas Market Doctrine and the regulatory tailwind in Texas. But it is a **multi-year, multi-million-dollar undertaking**, not a testing surface. It is not the answer to "how do we test the agent."

### 4.2 The paper-venue interpretation (4.1.a)

Pros:
- **Deterministic.** Same inputs → same fills. Reproducible bugs. Test suites that mean something.
- **Zero external dependencies.** No API rate limits, no third-party outages, no test-data costs.
- **Arbitrary speed.** Replay a year of data in five minutes.
- **Adversarial test scenarios are possible.** "What does the agent do during a flash crash?" can be simulated by piping in a synthetic crash.
- **CI-friendly.** Every PR can run the full test suite without touching external venues.

Cons:
- **It is not a venue.** The fills are simulated. There is no slippage, no adverse selection, no real counterparty risk, no real exchange-side error.
- **A strategy that looks good on the paper venue can still fail live.** This is *exactly* why demo accounts (Option 2) exist.

### 4.3 The own-real-exchange interpretation (4.1.b)

Pros:
- **Maximum sovereignty.** PARRALAX owns the matching engine, owns the book, owns the resolution.
- **Strategic optionality.** A real exchange is a serious asset; it can attract listings, market makers, fees.
- **Dallas alignment.** Texas regulatory frame, TXSE adjacency.

Cons:
- **Years and millions of dollars.** This is a real exchange-building project, not a testing strategy.
- **Multi-front compliance.** SEC, FINRA, state regulators, listing rules, market-maker requirements, custody rules.
- **Doesn't solve the testing question.** Even if PARRALAX has its own exchange, agents would still need to be tested against *other* exchanges' APIs to be sovereign across markets.

### 4.4 Verdict on "own exchange"

**Reading 4.1.a** (paper venue) is **mandatory, regardless of any other choice.** It is the deterministic foundation. Already in the plan.

**Reading 4.1.b** (real exchange) is a **separate strategic question** — worth considering, but on its own timeline and its own charter, not as part of testing strategy.

---

## 5. The recommendation — use all three, in this order

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TEST PYRAMID                                                           │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  4. LIVE (smallest position sizes, guarded execution)         │     │
│  │      Last. Only after 3 is clean.                             │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  3. DEMO ACCOUNTS ON REAL EXCHANGES                           │     │
│  │      Alpaca paper · IBKR paper · Binance/Kraken testnet ·     │     │
│  │      OANDA fxTrade Practice · Kalshi sandbox                  │     │
│  │      Tests venue adapters with REAL APIs and REAL market data │     │
│  │      Promotion gate to live — see SIMULATION_PROMOTION        │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  2. INTERNAL PAPER VENUE                                      │     │
│  │      Deterministic. CI-runnable. Adversarial scenarios.       │     │
│  │      The foundation. Used in EVERY phase below.               │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  1. UNIT TESTS — DOCTRINE COMPLIANCE                          │     │
│  │      VoxisAuthority verifies. Gates fail closed. Kill switch  │     │
│  │      asymmetric. Receipts always written.                     │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ─── operator visibility (orthogonal to all layers) ───                │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  TRADINGVIEW                                                  │     │
│  │  Used as: chart UI for operator visibility. Position overlay. │     │
│  │  NOT used as: execution layer. NOT used to store secret       │     │
│  │  strategy params. Operator's "see what's happening" surface.  │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Concrete sequencing

The implementation plan that comes out of this recommendation:

**Phase T1 — Unit tests and the paper venue** (PLAN.md Phase 2 territory; implementation-scaffold PR scope)

- Build the deterministic paper venue.
- Unit tests for VoxisAuthority (signature freezes), CUSTOS gates (fail-closed), kill switch (asymmetric).
- Every agent's logic is testable against the paper venue with synthetic market scenarios.
- This is where 80% of bugs get caught.

**Phase T2 — Demo-account adapters**

- One venue at a time, smallest scope first. Recommended order:
  1. **Alpaca paper** (US equities; cleanest API, most documented).
  2. **OANDA fxTrade Practice** (FX; mature, MXN/USD supported per Dallas doctrine).
  3. **Binance Spot Testnet** (crypto; broadest asset coverage on testnet).
  4. **Kalshi sandbox** (prediction markets; CFTC-regulated).
  5. **IBKR paper** (multi-asset breadth; harder to set up but most flexible).
- Each adapter ships with paper-mode CI and demo-mode integration tests.
- An agent cannot be promoted to live on a venue until its adapter has passed both.

**Phase T3 — TradingView for operator UI**

- After Phases T1 and T2 are clean.
- Build the read-only TradingView overlay: positions, signals, gate states.
- Pine Script integration optional — operator may use it to sketch ideas.
- NO secret strategy parameters in TradingView. The chart is a window, not a vault.

**Phase T4 — Guarded live** (per `SIMULATION_PROMOTION_PROTOCOL`, forthcoming charter)

- Smallest possible position sizes.
- Per-trade, per-day, per-asset caps from `AGENT_AUTHORITY_CHARTER` enforced.
- Tight kill-switch triggers.
- 30 days minimum before any consideration of widening.

The pyramid is sequential. **Skipping a layer is forbidden** by the simulation-promotion protocol; the gate enforces it.

---

## 6. What this means for the implementation scaffold

The implementation-scaffold repository (Option A, the separate PARRALAX repo) needs to ship with the following on day 1:

1. **The paper venue adapter** (`src/venues/paper.ts`).
2. **A venue adapter interface** that every later adapter conforms to (`src/venues/types.ts`).
3. **One demo-account stub** to prove the pattern — Alpaca paper is the recommended first one (`src/venues/alpaca-paper.ts`).
4. **A test suite** that uses the paper venue for unit tests and (when API keys are present in `.env`) the demo adapter for integration tests.
5. **No live adapter at all.** Live adapters are added per-venue, per-PR, each its own change with its own council ratification, well after demo-account testing has matured.
6. **No TradingView integration on day 1.** TradingView is a Phase T3 deliverable — the operator UI layer comes after the execution layer is stable.

---

## 7. Operator decisions (what you need to pick)

To finalise the testing posture as doctrine (rather than this decision document), you need to choose:

1. **First demo-account venue.** Recommendation: Alpaca paper. Lowest friction, US equities, immediate value.
2. **TradingView integration scope.** Recommendation: read-only operator-overlay only, no Pine Script secrets. You can override if you want a richer integration.
3. **"Own real exchange" — yes or no, and if yes, on what horizon.** Recommendation: defer the decision; build the trading system first; revisit in 12 months when a track record exists.
4. **Whether the operator UI itself lives on TradingView or as a PARRALAX-owned Astro page** (like the journal). Recommendation: PARRALAX-owned for the canonical interface; TradingView as an optional secondary view.

When you mark this document up with your answers, the agent will draft a follow-up `TESTING_DOCTRINE.md` that fixes the choices as charter.

---

## 8. What this document deliberately does NOT do

- Does not commit PARRALAX to any specific venue, broker, or exchange.
- Does not commit PARRALAX to TradingView at any layer.
- Does not start writing adapters.
- Does not contradict any existing charter — every option above is compatible with `AGENT_AUTHORITY`, `RISK_CHARTER`, `KILL_SWITCH`, and `ASSET_SCOPE`.
- Does not assume "own real exchange" is on or off the table — that question is bigger than testing.

---

## 9. Cross-references

- **Charter:** [§ 11.5 Execution Layer](./CHARTER.md), [§ 22 Multi-Market Operating Model](./CHARTER.md), [§ 32 Roadmap](./CHARTER.md)
- **Sibling docs:** [`PLAN.md`](./PLAN.md) (Phase 2 + 4 in the implementation roadmap), [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (promotion gate from Simulator/L2 to Guarded Executor/L4), [`DALLAS_MARKET_DOCTRINE.md`](./DALLAS_MARKET_DOCTRINE.md) (venue preference), [`PREDICTION_MARKETS_CHARTER.md`](./PREDICTION_MARKETS_CHARTER.md) (Kalshi-class venue tested at Phase T2)
- **Forthcoming:** `SIMULATION_PROMOTION_PROTOCOL.md` (gate from each phase to the next), `TESTING_DOCTRINE.md` (this document, hardened, after operator selections)

---

*Use the paper venue for logic. Use demo accounts for fidelity. Use TradingView for seeing. Use live only after all three are clean.*
