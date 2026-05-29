# TESTING DOCTRINE

**Document:** `parralax-aihftfund/TESTING_DOCTRINE.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 11.5 — Execution Layer · [`TESTING_INTEGRATION_OPTIONS.md`](./TESTING_INTEGRATION_OPTIONS.md)  
**Status:** **Ratified doctrine.** Hardens two operator decisions from `TESTING_INTEGRATION_OPTIONS.md` § 7.  
**Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) · [`RISK_CHARTER.md`](./RISK_CHARTER.md) · [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md)

---

## 0. The two operator decisions ratified here

| # | Question | Operator decision |
|:--:|---|---|
| 1 | First demo-account venue | **Alpaca Paper Trading** (US equities) |
| 2 | TradingView integration scope | **Read-only operator overlay only.** No Pine Script secrets. No execution layer. |

The remaining two questions in `TESTING_INTEGRATION_OPTIONS.md` § 7 (own real exchange; canonical operator UI surface) stay open for now and are addressed in § 9 below.

These two decisions are doctrine now. The implementation honours them; no agent at any authority level can bypass them without operator-issued mandate revision and a CHRONO entry.

---

## 1. The test pyramid — ratified, four layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 4 — LIVE  (Guarded Executor / Level 4+; smallest position sizes)│
│           Only after Layer 3 is clean for ≥ 30 trading days             │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 3 — DEMO ACCOUNTS ON REAL EXCHANGES                              │
│           Day 1: ALPACA PAPER TRADING (US equities)                     │
│           Future, council-ratified: OANDA Practice (FX, incl. USD/MXN), │
│                                     Binance Spot Testnet, Kalshi Sandbox│
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 2 — INTERNAL PAPER VENUE (deterministic, in-process)             │
│           The foundation. Runs in CI on every PR.                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 1 — UNIT TESTS  (doctrine compliance, fail-closed)               │
│           VoxisAuthority verifies. Gates fail closed. KillSwitch        │
│           asymmetric. Receipts always written. Chrono chain verifies.   │
└─────────────────────────────────────────────────────────────────────────┘
        ◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇  orthogonal to all layers  ◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇
┌─────────────────────────────────────────────────────────────────────────┐
│  TRADINGVIEW — read-only operator overlay                               │
│           Charts + position/signal/gate visibility                      │
│           NOT an execution layer. NEVER signs orders.                   │
│           NO Pine Script storage of secret strategy parameters.         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Skipping a layer is forbidden.** The simulation-promotion protocol (forthcoming charter) enforces this at the agent-authority level: no agent may be promoted from Simulator (Level 2) to Guarded Executor (Level 4) without a clean Layer 2 + Layer 3 record.

---

## 2. Alpaca Paper Trading — the day-one demo-account venue

### 2.1 Why Alpaca paper

- Cleanest commercial paper-trading API for US equities.
- Free; no funded account required to use the paper environment.
- Near-identical API surface to Alpaca's live trading; the same adapter (with different credentials) becomes the live adapter.
- Mature SDK ecosystem; well-documented WebSocket data feeds.
- No exotic instruments; US-listed common stock, ETFs, options on stocks (we are not enabling options day 1 per `ASSET_SCOPE_CHARTER.md` § 6.4).
- Sits inside the `equity:` family of `ASSET_SCOPE_CHARTER.md` § 6.

### 2.2 The adapter's contract

The Alpaca-paper adapter conforms to the `Venue` interface defined in the implementation scaffold (`parralax-impl/src/venues/types.ts`). The contract:

```
interface Venue {
  // Identity
  readonly id:          VenueId
  readonly capabilities: VenueCapabilities

  // Read (always available, even without credentials)
  getQuote(asset):       Promise<Quote>
  getOrderBook(asset):   Promise<OrderBook>
  getPositions():        Promise<Position[]>
  getBalances():         Promise<Balance[]>

  // Trade (requires credentials; paper or live)
  placeOrder(req):       Promise<OrderAck>
  cancelOrder(id):       Promise<OrderAck>
  modifyOrder(id, req):  Promise<OrderAck>

  // Health
  health():              Promise<VenueHealth>
}
```

`VenueCapabilities` carries the boolean flags CUSTOS reads when routing orders (`canTrade`, `canShort`, `canMargin`, `supportsLimit`, etc.). The Alpaca-paper adapter sets `canShort = false`, `canMargin = false` on day 1 — `ASSET_SCOPE_CHARTER.md` § 6.3 forbids shorts before a separate operator mandate.

### 2.3 Credential handling

Per `SECURITY.md`:

- Alpaca paper API key + secret are loaded from `ALPACA_PAPER_KEY` and `ALPACA_PAPER_SECRET` env vars at runtime.
- No keys live in code. No keys live in committed config. `.env.example` carries only the *names*.
- The adapter's read methods work without credentials (public market data). The trade methods require credentials and fail closed when absent.
- The sanitiser pattern-blocks any token shape resembling an Alpaca key in any committed file.

### 2.4 Adapter promotion path

The same adapter file (`parralax-impl/src/venues/alpaca-paper.ts`) services both paper and live by way of a base-URL parameter and a credential-scope flag. **Promotion from paper to live is a separate operator action**, not an automatic step:

1. The adapter ships in paper-only mode on day 1.
2. After ≥ 30 trading days of clean paper operation under guarded execution (Level 4 agent), the operator may submit a council proposal to enable a `LIVE` variant.
3. The live variant uses a separate env-var pair (`ALPACA_LIVE_KEY` / `ALPACA_LIVE_SECRET`) — never reuses paper credentials.
4. Live activation writes a `mandate.adapter_promotion` CHRONO entry signed by the operator and ratified 3-of-5 by the council.
5. The first 14 days of live operation use a hard cap of $100 USD per order regardless of any agent mandate that might permit more — a separate `gate.capital` override at the venue layer.

This is the trading-domain instantiation of the simulation-promotion protocol — same shape, scoped to one venue.

---

## 3. TradingView — read-only operator overlay only

### 3.1 What TradingView is for in PARRALAX

A second pair of human eyes on what the system is doing. The chart shows the operator:

- Current positions across in-scope assets (read from PARRALAX state).
- Recent fills, annotated on the price chart.
- Active signals (AUGUR emissions) overlaid as markers.
- CUSTOS gate states — which gates are currently failing or passing for the current strategy set.
- KillSwitch state per scope.
- Drawdown vs. configured limits.

That is the overlay. Nothing about it touches execution.

### 3.2 What TradingView is NOT for in PARRALAX

- **Not an execution surface.** TradingView does not place orders. Even via webhook-to-broker. Any order PARRALAX places goes through `VECTOR`/`VENDITOR` against the registered venue adapter; TradingView is never in the path.
- **Not a strategy authoring tool with secret parameters.** Pine Script lives on TradingView's servers. Storing secret strategy parameters there would mean storing them off-machine. The journal's "no third-party telemetry" doctrine extends here.
- **Not a signal source.** TradingView indicators can inspire ideas, but a Pine-Script-emitted signal is not a PARRALAX signal until it is re-implemented inside an AUGUR mandate that lives in the PARRALAX repository. The line is: ideas come from anywhere; signals come from agents we own.
- **Not a kill switch.** A TradingView alert does not trip a PARRALAX kill switch. Only the operator (always), the council, or the automated triggers in `KILL_SWITCH_DOCTRINE.md` § 4 can.
- **Not a billing-tier dependency.** If TradingView's paid tier becomes unavailable, PARRALAX's operation does not degrade. The chart goes dark; the system runs.

### 3.3 The overlay data shape

PARRALAX exposes the overlay as a read-only HTTPS endpoint that returns JSON (or a TradingView-native UDF — operator-decided in § 9). The shape:

```
OperatorOverlay {
  asOf:        iso8601
  positions:   { asset, side, qty, avgPrice, unrealisedPnLUsd, riskTier }[]
  signals:     { agentId, asset, score, timestamp, status }[]
  fills:       { asset, side, qty, price, venueId, timestamp }[]
  gates: {
    [strategyId]: {
      capital, exposure, leverage, volatility, drawdown,
      liquidity, slippage, venue, modelConfidence,
      strategyConsistency, humanOverride
    } /* each entry: 'pass'|'fail'|'unevaluated' */
  }
  killSwitch:  { scope, phase, trippedSinceMs }[]
  drawdown:    { strategyId, dailyPct, weeklyPct, maxDailyPct, maxWeeklyPct }[]
  heartbeat: {
    beat:    number    // 873ms ticks since genesis
    builtAt: iso8601
  }
}
```

The endpoint requires operator authentication. There is no public read. No webhook-back-into-PARRALAX from TradingView is implemented; PARRALAX is the publisher, TradingView is the renderer.

### 3.4 What CUSTOS sees from TradingView

Nothing. TradingView is downstream of CUSTOS in the data flow; nothing it sends comes back through the gates because nothing it sends arrives at the execution path. CUSTOS does not have a `gate.tradingview_input` entry, and never will.

---

## 4. Test ordering across CI

Per the test pyramid, CI runs:

1. **Sanitiser** — Mundator Cognitus finance-extended `--verify`. Fail-closed.
2. **Typecheck** — `tsc --noEmit`, strict mode.
3. **Layer 1 unit tests** — doctrine compliance (`tests/voxis.test.ts`, `tests/chrono.test.ts`, `tests/killswitch.test.ts`).
4. **Layer 2 paper-venue integration tests** — deterministic fills against the in-process venue (`tests/venues.test.ts`).
5. **Layer 3 demo-account integration tests** — **opt-in via secret presence.** If `ALPACA_PAPER_KEY` is set as a CI secret, the Alpaca-paper integration tests run against the live paper API. If not, they are skipped with a clearly-logged notice. PRs from forks (which do not get secret access) skip these tests; PRs from the main repo with the secret configured run them.

Layer 4 (live) never runs in CI. Live activation is a hardware-signed operator action, not an automated pipeline.

---

## 5. The promotion path between layers (recap)

```
unit test (Layer 1)
  green for ≥ 7 days
    → strategy is eligible for Layer 2 paper-venue integration

paper-venue (Layer 2)
  ≥ 1000 simulated trades, ≥ 30 days clean, no CUSTOS violations
    → operator may propose Layer 3 promotion to council

demo-account (Layer 3)
  ≥ 30 trading days clean on Alpaca paper, no API failures > 0.5%
    → operator may propose Layer 4 promotion to council

live guarded (Layer 4)
  smallest possible position sizes ($100 cap per order × 14 days)
  → after clean run, council may approve widening per mandate
```

No agent self-promotes. Every promotion is operator + council + CHRONO entry.

---

## 6. The TradingView posture — operational specifics

### 6.1 Where the overlay endpoint lives

The endpoint is hosted by PARRALAX (operator infrastructure), not by TradingView. Recommendation: a Cloudflare Worker fronting the operator's authenticated state read. The journal's own Cloudflare worker pattern (CEREBRUM-class) is the reference.

### 6.2 Authentication

- HTTPS only.
- Operator-issued bearer token, rotated per `SECURITY.md`.
- Token never appears in any TradingView config that gets saved to TradingView's servers. The token is entered by the operator at session start and held in browser-local storage only.
- A token compromise rotates the token within minutes; the prior token is invalidated server-side.

### 6.3 The Pine Script constraint

- Pine Script is **permitted for visual indicators only.** A custom indicator that displays PARRALAX positions or signals on the chart is fine.
- Pine Script is **forbidden from carrying any strategy parameter PARRALAX considers secret.** Concretely: no model weights, no threshold parameters that constitute strategy edge, no proprietary calculations beyond what could be public knowledge.
- Pine Script is **forbidden from calling out via TradingView webhooks to anything that signs orders.** Period.

Operators who want to sketch an idea visually in Pine Script may do so. The signal it suggests becomes a PARRALAX signal only when re-implemented inside an AUGUR mandate in the implementation repository.

### 6.4 If TradingView dies or banishes us

The system runs unchanged. The overlay endpoint continues to serve. The operator can render it through any other charting tool (a custom dashboard, Grafana, a desktop client). TradingView is one renderer of an open overlay; nothing more.

---

## 7. What this doctrine forbids

| Forbidden | Reason |
|---|---|
| Any venue adapter that does not conform to the `Venue` interface | Conformance is what makes adapter swapping possible. Drift here means lock-in to one venue. |
| Live trading on Alpaca (or any venue) without the 30-day paper record and the council promotion | The simulation-promotion protocol is the gate. |
| Using paper credentials for live trading or vice versa | Cross-credential reuse defeats the gate; the live variant uses separate env vars. |
| Any TradingView path that signs orders | Execution authority is operator/council-only; TradingView is rendering, not authority. |
| Storing strategy secrets in Pine Script | Pine Script lives off-machine; off-machine secrets are leaks waiting to happen. |
| TradingView-initiated kill switches | Per `KILL_SWITCH_DOCTRINE.md`: trips are operator / council / automated; TradingView is not in the list. |
| CI runs that skip Layer 1 or Layer 2 | The pyramid is not optional. |
| Layer 3 tests against live Alpaca (not paper) | Live API access never runs in CI. Ever. |
| Public exposure of the operator overlay endpoint | The overlay is operator-authenticated; no public read. |
| Re-using Cloudflare worker secret keys across the journal and PARRALAX workers | Each system carries its own credentials; cross-system reuse expands blast radius. |

---

## 8. Reading lock-in

1. **Alpaca paper is the day-one demo-account venue.** Other venues (OANDA Practice, Binance Testnet, Kalshi Sandbox, IBKR Paper) are roadmap, each via its own adapter + council ratification.
2. **TradingView is operator-rendering, never execution.** The overlay endpoint is the only contract; everything else is the renderer's problem.
3. **No layer of the test pyramid is skippable.** Promotion from each layer to the next is operator + council + CHRONO entry.

If the implementation contradicts any of these three, the implementation is wrong, the doctrine is correct, and the implementation changes.

---

## 9. Open decisions still pending (from `TESTING_INTEGRATION_OPTIONS.md` § 7)

These two questions remain open. They are NOT resolved by this doctrine.

### 9.1 "Own real exchange" — yes / no / horizon

The recommendation in `TESTING_INTEGRATION_OPTIONS.md` § 4.4 stands: build the trading system first; revisit the question of whether to stand up a regulated venue after ≥ 12 months of live operation produces a track record. This doctrine does not change that recommendation; it does not close the question either.

### 9.2 Canonical operator UI — PARRALAX-owned page vs. TradingView as primary

The recommendation also stands: **PARRALAX-owned canonical operator UI** (an Astro-built page following the journal's pattern, served from operator infrastructure). TradingView remains a secondary view that consumes the same overlay endpoint as the canonical UI. The doctrine here ratifies TradingView as a secondary surface; the choice of whether the canonical UI is built first or whether TradingView serves as the primary surface for the first months of operation is left to the operator.

---

## 10. Cross-references

- **Charter:** [§ 11.5 — Execution Layer](./CHARTER.md), [§ 22 — Multi-Market Operating Model](./CHARTER.md), [§ 28 — Security Charter](./CHARTER.md), [§ 32 — Roadmap](./CHARTER.md) (Phase 4 = adapter integration)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (Level 4+ for live execution); [`RISK_CHARTER.md`](./RISK_CHARTER.md) (`gate.venue` reads venue health from adapter `health()`); [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) (no TradingView path to trip); [`DALLAS_MARKET_DOCTRINE.md`](./DALLAS_MARKET_DOCTRINE.md) (TXSE adapter follows the same paper-first protocol when TXSE goes live); [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) (US equities long-only day 1, no shorts, no options); [`TESTING_INTEGRATION_OPTIONS.md`](./TESTING_INTEGRATION_OPTIONS.md) (the options doc this doctrine hardens from)
- **Implementation:** the scaffold's `src/venues/types.ts`, `src/venues/paper.ts`, `src/venues/alpaca-paper.ts`, and `src/operator-ui/tradingview.ts` are the concrete artefacts that honour this doctrine.
- **Existing doctrine inherited:** the journal's "no third-party telemetry" doctrine — extended here to "no strategy secrets stored on third-party platforms," with TradingView named explicitly.

---

*Alpaca paper for US equities, day one. TradingView as the chart, never the executor. No layer of the pyramid is skippable.*
