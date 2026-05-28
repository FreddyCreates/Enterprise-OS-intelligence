# RISK CHARTER

**Document:** `parralax-aihftfund/RISK_CHARTER.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 16 — Risk Charter  
**Status:** Public charter. Prior art. No implementation in this commit.  
**Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) · [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md)

---

## 0. Premise

Risk control is not a secondary feature. It is the substrate of the system. An execution engine without risk gates is not a sovereign trading system — it is an attack surface.

The Authority Charter establishes *who is allowed to act*. This charter establishes *what an action must clear before it executes*. Together with the Kill Switch Doctrine, they are the three walls between a signal and a fill.

The doctrine: **every gate fails closed by default, every gate produces a receipt, no gate can be silenced by an agent.**

---

## 1. CUSTOS — the risk gate agent

Per `AGENT_AUTHORITY_CHARTER.md` § 8, the COGNOVEX governance filter (Layer 5) defers risk decisions to **CUSTOS**. CUSTOS is the journal's existing fail-closed integrity gate, instantiated for PARRALAX as the risk gate runtime.

CUSTOS evaluates a candidate action against a configured list of gates **in sequence**, halting on the first failure. The signature:

```
custos.evaluate(action: ProposedAction, context: MarketContext)
  → GateResult { passed: boolean, receipts: GateReceipt[], firstFailure: GateId | null }
```

Order matters. Cheap gates run first (capital, exposure — these need no market data). Market-dependent gates run after (volatility, liquidity, slippage). Counterparty gates run last. **An action is authorised only if every gate passes.**

CUSTOS is itself a VOXIS at Level 6 (the maximum), spawned by the operator at system construction. It cannot be demoted by ordinary triggers; only the operator can replace it, and only with hardware-signer ceremony.

---

## 2. The thirteen gates

From Charter § 16.3, with formal parameter shapes, receipt schemas, and failure semantics.

### 2.1 Capital gate

**Purpose:** prevent any single order from exceeding the agent's mandate capital limits.

**Parameters:** read from `VoxisAuthority.capitalLimitsUSD` (set at mandate signing; immutable per agent).

**Check:** for the action's notional value in USD-equivalent:

```
action.notionalUSD ≤ perOrderMax
agentDailyNotionalUSD + action.notionalUSD ≤ perDayMax
agentAssetExposureUSD + action.notionalUSD ≤ perAssetMax
agentAggregateUSD + action.notionalUSD ≤ aggregateMax
```

**Failure semantics:** action rejected. Agent's drift counter increments. If three rejections occur within a rolling 1-hour window, agent is demoted one level (see Authority Charter § 5).

**Receipt class:** `gate.capital`. Always written, pass or fail.

### 2.2 Exposure gate

**Purpose:** bound total open position size in a given asset, market, or strategy.

**Parameters:**

```
ExposureLimits {
  perAssetMaxOpen:        decimal   // USD-equivalent
  perStrategyMaxOpen:     decimal
  perVenueMaxOpen:        decimal
  perChainMaxOpen:        decimal   // for on-chain positions
  netDirectionalMaxLong:  decimal   // long bias cap
  netDirectionalMaxShort: decimal   // short bias cap
}
```

**Check:** post-action exposure across each dimension stays within its limit.

**Failure semantics:** action rejected. The agent must either reduce exposure first (close other positions) or wait for natural decay.

**Receipt class:** `gate.exposure`.

### 2.3 Leverage gate

**Purpose:** bound effective leverage system-wide and per-position.

**Parameters:**

```
LeverageLimits {
  systemMax:       decimal   // e.g. 2.0 = 2× max across the whole system
  perStrategyMax:  decimal
  perAssetMax:     decimal
  perPositionMax:  decimal
}
```

**Check:**

```
post_leverage = (gross_exposure_post_action) / (equity_post_action)
post_leverage ≤ all configured limits
```

**Failure semantics:** action rejected. **No exception** — even for "obvious" trades. Leverage is the single largest contributor to fund-ending events.

**Receipt class:** `gate.leverage`.

### 2.4 Volatility gate

**Purpose:** suspend trading when realised or implied volatility exceeds bounds the strategy was authorised for.

**Parameters:**

```
VolatilityLimits {
  rv_window_seconds:   u32        // realised vol window (e.g. 900 = 15min)
  rv_max:              decimal    // suspend above this annualised vol
  iv_max:              decimal    // implied vol ceiling (where available)
  regime_change_block: boolean    // suspend across regime transitions
}
```

**Check:** computed realised volatility (or implied where market provides) over the configured window stays below the limit. If `regime_change_block` is true, also fails when the NEXORIS regime-classifier reports a transition within the prior N cycles.

**Failure semantics:** action rejected. The agent should wait, not retry immediately. CUSTOS imposes a backoff: each rejection within the same volatility regime increases the wait time by φ (golden ratio compounding, as in AURUM).

**Receipt class:** `gate.volatility`.

### 2.5 Drawdown gate

**Purpose:** stop adding risk while in drawdown beyond a threshold.

**Parameters:**

```
DrawdownLimits {
  perStrategyDailyMaxPct:    decimal    // e.g. 0.02 = 2%
  perStrategyWeeklyMaxPct:   decimal
  perStrategyMonthlyMaxPct:  decimal
  systemDailyMaxPct:         decimal    // e.g. 0.01 = 1% of equity
  systemWeeklyMaxPct:        decimal
  haltOnExceed:              'no_new_open'|'no_new_open_or_add'|'reduce_only'
}
```

**Check:** mark-to-market drawdown from the rolling-high stays within all limits. When exceeded, gate enforces the configured `haltOnExceed` mode:

- `no_new_open` — existing positions may be adjusted; no new positions opened.
- `no_new_open_or_add` — also blocks adding to existing positions.
- `reduce_only` — only close-or-reduce orders permitted.

**Failure semantics:** action rejected. Drawdown halts auto-release when the rolling drawdown recovers below the threshold for at least N consecutive cycles (operator-configured, default 60 minutes).

**Receipt class:** `gate.drawdown`.

### 2.6 Liquidity gate

**Purpose:** refuse orders the market cannot absorb at a non-disastrous price.

**Parameters:**

```
LiquidityLimits {
  maxOrderPctOfDV:     decimal   // % of typical daily volume
  maxOrderPctOfTopN:   decimal   // % of top-N levels of the book
  minBookDepthUSD:     decimal   // book must show at least this much depth
  topNLevels:          u8        // e.g. 10
  zeroLiquidityBlock:  boolean   // refuse outright if book is one-sided
}
```

**Check:** the order's size relative to recent average daily volume and to current top-N book depth stays within configured percentages. Empty side of book triggers immediate fail.

**Failure semantics:** action rejected, OR (operator-configurable) auto-split into smaller child orders that each pass the gate. Default: rejected. Splitting requires explicit `order:modify.live` capability and an `order_split` receipt.

**Receipt class:** `gate.liquidity`.

### 2.7 Slippage gate

**Purpose:** refuse orders whose expected fill diverges from intended price beyond tolerance.

**Parameters:**

```
SlippageLimits {
  maxBpsFromMid:        u32      // e.g. 25 = 25 basis points
  maxBpsFromIntended:   u32      // intended price was set by the proposing agent
  blockOnInversion:     boolean  // refuse if expected fill is on the wrong side
}
```

**Check:** estimated execution price (using current top-of-book + book walk for size) stays within the configured spread from mid and from the agent's intended price.

**Failure semantics:** action rejected. Slippage gate failure is the most common reason a paper strategy looks profitable and a live one doesn't — CUSTOS quarantines the loss.

**Receipt class:** `gate.slippage`.

### 2.8 Exchange / venue gate

**Purpose:** refuse routing to a venue that has failed recent health checks.

**Parameters:**

```
VenueHealthLimits {
  maxOrderApiLatencyMs:    u32     // recent p99 of order-place latency
  maxOrderFailureRatePct:  decimal // recent failure rate
  minMarketDataFreshnessMs: u32    // staleness threshold
  outage_block:            boolean // hard-block any venue flagged outage
}
```

**Check:** the venue's rolling health metrics (held by CUSTOS, refreshed by VIGIL) stay within bounds.

**Failure semantics:** action rejected. The proposing agent may re-route to a different venue (if its mandate permits) by submitting a new action. **Same venue retry is auto-rejected for a backoff window.**

**Receipt class:** `gate.venue`.

### 2.9 Chain risk gate

**Purpose:** block on-chain actions when the chain is congested, the agent's wallet has stale state, or the contract being touched has been flagged.

**Parameters:**

```
ChainRiskLimits {
  maxGasGwei:               decimal
  maxPendingNonceGap:       u32       // wallet should not have stranded nonces
  minPeerConfirmations:     u32       // for read state
  contractAllowlist:        Address[] // every contract the agent may call
  contractBlocklist:        Address[] // override; overrides allowlist
  blockOnReorg:             boolean
}
```

**Check:** chain conditions are within bounds and the called contract is on the allow-list and off the block-list.

**Failure semantics:** action rejected. Contract block-list takes precedence over allow-list — an entry on both means blocked. **No agent at any level may call a contract not on its mandate's allow-list.**

**Receipt class:** `gate.chain`.

### 2.10 Smart contract risk gate

**Purpose:** block interactions with contracts whose risk score has degraded.

**Parameters:**

```
SmartContractLimits {
  minAuditFreshness_days:   u32       // require recent audit
  minTVL_USD:               decimal   // for DeFi pools
  maxRecentExploitProximity: u32      // hops in the on-chain graph
  permittedRoles:           Role[]    // 'reader' | 'depositor' | 'borrower' | ...
}
```

**Check:** the target contract's risk profile (held by VIGIL on-chain monitoring) meets the limits, and the action's role is in the permitted set.

**Failure semantics:** action rejected. Smart contract gate is stricter than the chain gate — chain gate is "is the chain healthy"; smart contract gate is "is this contract trustworthy enough to send funds to *right now*."

**Receipt class:** `gate.smartcontract`.

### 2.11 Counterparty gate

**Purpose:** refuse trades against counterparties whose risk profile has degraded.

**Parameters:**

```
CounterpartyLimits {
  perCounterpartyMaxExposureUSD: decimal
  minCreditRating:               string   // for centralised counterparties
  outageBlockSeconds:            u32      // time after an outage before re-engaging
  blockOnSanctionsFlag:          boolean  // OFAC, etc.
}
```

**Check:** the counterparty's current risk profile passes the limits.

**Failure semantics:** action rejected. Counterparty gate failure on an OFAC flag is also a `compliance_alert` CHRONO entry that notifies the operator out-of-band.

**Receipt class:** `gate.counterparty`.

### 2.12 Model confidence gate

**Purpose:** refuse to act on signals below the agent's mandated confidence threshold.

**Parameters:**

```
ModelConfidenceLimits {
  minSignalConfidence:    decimal   // e.g. 0.65
  minCouncilAgreement:    decimal   // when multiple agents weighed in
  rejectOnStaleModel:     boolean   // refuse if model version older than X days
  maxModelStalenessDays:  u32
}
```

**Check:** the signal carries a confidence ≥ threshold, the model version is fresh, and (for multi-agent signals) council agreement is sufficient.

**Failure semantics:** action rejected. **This is the only gate where the agent may retry** — if the agent re-emits with a higher confidence after additional evidence, CUSTOS re-evaluates without a cooldown.

**Receipt class:** `gate.model_confidence`.

### 2.13 Strategy consistency gate

**Purpose:** detect when an agent is acting outside its strategy's documented behaviour.

**Parameters:**

```
StrategyConsistencyLimits {
  expectedAssetSet:        Asset[]
  expectedVenueSet:        Venue[]
  expectedHoldingWindow:   { minSeconds, maxSeconds }
  expectedFrequencyPerDay: { min, max }
  driftToleranceCycles:    u32   // consecutive deviations before flag
}
```

**Check:** the action stays within the strategy's documented envelope. Drift is counted; on exceeding tolerance, a `drift_flag` is raised — which triggers an Authority Charter demotion (see § 5 there).

**Failure semantics:** action rejected. Drift counter increments. Three consecutive cycles of drift demote the agent one level.

**Receipt class:** `gate.strategy_consistency`.

### 2.14 Human override gate

**Purpose:** give the operator a single-button stop on any action class, agent, strategy, or asset.

**Parameters:**

```
HumanOverrideRules {
  paused: {
    agents:     VoxisId[]
    strategies: StrategyId[]
    assets:     Asset[]
    venues:     Venue[]
    chains:     Chain[]
  }
  pausedUntil: iso8601 | null
}
```

**Check:** none of the action's resources appear in any `paused` set.

**Failure semantics:** action rejected, no drift counter increment (this is operator policy, not agent error). The pause auto-expires at `pausedUntil`; the operator may also lift it earlier via a hardware-signer ceremony.

**Receipt class:** `gate.human_override`.

---

## 3. The receipt schema

Every gate writes a receipt of the same shape:

```
GateReceipt {
  gateId:        GateId           // e.g. 'gate.capital'
  voxisId:       string           // agent being evaluated
  actionHash:    sha256           // the proposed action
  result:        'pass' | 'fail'
  failureReason: string | null    // present iff result === 'fail'
  parameters:    object           // the gate's current parameters (audit trail)
  observed:      object           // the values being checked
  timestamp:     iso8601
  chronoLink:    string           // hash of the prior CHRONO entry
  signature:     Signature        // CUSTOS-signed
}
```

The receipt is mandatory. **A gate that runs without writing a receipt is a doctrine violation** — CUSTOS halts if it cannot reach the CHRONO substrate. There is no "skip the receipt for performance" path; performance is bounded by what the substrate can absorb, not the other way around.

---

## 4. Failure semantics — the shared rules

Beyond per-gate rules above, every gate failure obeys:

1. **Rejection is immediate.** The action does not execute. There is no "retry on transient failure" except where explicitly noted (model confidence gate, § 2.12).
2. **The proposing agent's drift counter increments by 1** for all gate failures except `gate.human_override` (operator policy is not agent error).
3. **The CHRONO entry is written before the rejection returns to the agent.** Audit always precedes notification.
4. **The proposing agent is informed of the failure class** but not given enough information to "engineer around" the gate — failure messages are operator-readable, not adversarial.
5. **Three rejections in a 1-hour rolling window from the same agent on any gates** triggers a single-level demotion (Authority Charter § 5).
6. **Ten rejections in a 1-hour rolling window across the whole system** trips the system-wide kill switch (`KILL_SWITCH_DOCTRINE.md` § 4).

---

## 5. Gate sequencing

Gates run in this fixed order on every evaluation:

```
1.  gate.human_override        (cheapest, most-decisive)
2.  gate.capital
3.  gate.exposure
4.  gate.leverage
5.  gate.strategy_consistency
6.  gate.model_confidence
7.  gate.drawdown
8.  gate.volatility
9.  gate.liquidity
10. gate.slippage
11. gate.chain                  (only if on-chain action)
12. gate.smartcontract          (only if smart-contract action)
13. gate.venue                  (always last — most expensive freshness check)
14. gate.counterparty           (always last alongside venue)
```

The order is operator-tuneable but defaults reflect: cheapest-first (no need to query market data to know the operator has paused this agent); deterministic-before-probabilistic (capital limits are fixed numbers, volatility is a measurement); and ending with the most expensive checks (venue health is real-time, counterparty involves external data).

---

## 6. Risk tiers — three operator-selectable defaults

Per `VoxisAuthority.riskTier`, an agent's mandate selects one of three default parameter sets. Operators may override per-agent, but the tiers exist so a Level-4 agent can be spun up safely without bespoke parameter tuning.

| Tier | Posture | Typical use |
|:---|:---|:---|
| **STRICT** | Tight limits across every gate. Drawdown caps at 0.5% daily. Volatility cap low. Liquidity requires ≥ 5× daily depth coverage. | Newly promoted Level 4 agents; first 30 days of any live strategy. |
| **STANDARD** | Industry-typical limits. Drawdown caps at 1% daily. | Established Level 4 & 5 agents with proven track record. |
| **WIDE** | Looser bounds for strategies that *legitimately* need them (e.g. event-driven HFT). Drawdown caps at 2% daily. Volatility cap higher. | Level 5 & 6 agents with documented strategy-specific justification; requires council ratification. |

Default for any new mandate without explicit specification: **STRICT**. Operators must consciously widen.

---

## 7. The relationship to the kill switch

Gates and kill switches are different in shape:

- **A gate** evaluates a single proposed action. If it fails, that one action is rejected; the agent continues.
- **A kill switch** halts an entire scope (an agent, a strategy, an asset, or the system). It does not evaluate; it stops.

A gate failure may *contribute* to a kill switch trip (rule 6 in § 4: ten cross-system gate failures in an hour trip the system switch), but the gate itself does not trip the switch. The switch is its own mechanism — see `KILL_SWITCH_DOCTRINE.md`.

---

## 8. What this charter explicitly forbids

| Forbidden | Reason |
|---|---|
| Skipping a gate for performance | Performance is bounded by what the gates allow. Never the other way around. |
| Gates that produce no receipt | Audit precedes execution. A silent gate is a broken gate. |
| Agent-side bypass of a gate result | The Authority Charter's governance filter is the only output channel; CUSTOS sits inside it. |
| Operator-side bypass of a gate without a written override receipt | Operator pauses, override-receipts, and parameter changes are all CHRONO entries. Nothing is silent. |
| Gate parameters edited by an agent | Operator-only. Editing requires hardware-signer ceremony for STRICT-tier agents. |
| Multiple simultaneous parameter sets ("dev" vs "live") | Single source of truth per agent. A new parameter set is a new mandate. |
| Tiered "soft" gates that warn but don't block | Either it's a gate or it isn't. Warnings live in monitoring, not in CUSTOS. |
| Risk tiers above WIDE | If a strategy needs more than WIDE, the right answer is "do not run that strategy here." |

---

## 9. Reading lock-in

Three doctrinal claims the implementation must honour:

1. **CUSTOS is the only path between intent and execution for risk-bearing actions.** No code path produces a live order without passing through CUSTOS first.
2. **Every gate writes a receipt.** Pass or fail, deterministic or probabilistic, hot path or cold. A gate that ran without recording the run did not run.
3. **The default risk posture is STRICT.** Loosening is conscious; tightening is automatic.

If the implementation contradicts any of these three, the implementation is wrong, the charter is correct, and the implementation must change.

---

## 10. Open decisions (operator-only)

These shape the implementation but live outside it. The agent will not assume them.

1. **Per-tier numeric parameter sets.** STRICT/STANDARD/WIDE all have schemas above; operator must specify the numbers per asset class.
2. **Asset class boundaries.** Are crypto perps the same tier as crypto spot? Is FX the same tier as equities? Operator-defined.
3. **Council quorum for gate parameter edits.** Default: operator hardware-signer alone for tightening; 3-of-5 council for loosening. Operator may adjust.
4. **Initial allow-list for `gate.chain` and `gate.smartcontract`.** Which chains and which contracts are touchable on day one. Recommendation: **none** until each is individually reviewed and added by hardware-signer ceremony.

---

## 11. Cross-references

- **Charter:** [§ 16 — Risk Charter](./CHARTER.md), [§ 14.5 — Execution Principle](./CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (this charter operationalises Layer 5 risk decisions), [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) (a separate mechanism; gates contribute but do not trip)
- **Existing doctrine inherited from the corpus:**
  - PROTOCOL-III (`RISK SCORING`) — the φ-weighted 6-axis risk classification, extended here to a 13-gate evaluation
  - Paper III (`SYSTEMA INVICTUM`) — the antifragility doctrine: stress informs the gates, the gates inform the system, the system survives the stress
  - Journal's `CUSTOS` agent — the fail-closed integrity gate pattern this charter extends to capital

---

*Every gate fails closed by default. Every gate writes a receipt. No gate can be silenced.*
