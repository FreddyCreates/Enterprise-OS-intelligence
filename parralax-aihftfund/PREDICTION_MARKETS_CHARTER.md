# PREDICTION MARKETS CHARTER

**Document:** `parralax-aihftfund/PREDICTION_MARKETS_CHARTER.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 8 — Asset Scope · `ASSET_SCOPE_CHARTER.md` § 9  
**Status:** Public charter. Prior art. No implementation in this commit.

---

## 0. Premise

Prediction markets are a distinct asset class. They are not spot, not derivatives in the traditional sense, not equities, not crypto majors. They are **contracts on the outcome of a defined future event**, priced as a probability, settled to a fixed value on resolution.

Their structure differs from every other family in `ASSET_SCOPE_CHARTER.md` along five axes:

1. **Outcome is bounded.** Binary contracts settle at $0 or $1. Categorical contracts settle to one of N values. There is no unbounded upside.
2. **Time decay is structural.** Every contract has a known resolution date. The closer to resolution, the lower the optionality.
3. **Oracle risk is the dominant non-market risk.** The contract is worth nothing if the oracle that determines settlement is captured, bribed, or wrong.
4. **Liquidity is event-correlated.** Markets crowd around major events (elections, sports playoffs, macro releases) and thin out elsewhere.
5. **Regulatory frame is unresolved at the federal level in the US.** CFTC has asserted jurisdiction over event contracts in some cases; SEC in others; some markets operate offshore.

Because of these differences, prediction markets get their own charter. The general doctrine of the system applies — every action has a receipt, every gate fails closed, no agent has unlimited authority — but the **gate parameters, agent mandates, and counterparty selection** are specific to this family.

The doctrine: **prediction markets are in-scope at STRICT with their own specialised gates, on regulated or fully-decentralised venues only.**

---

## 1. Why prediction markets matter to PARRALAX

Three reasons, in order of importance:

### 1.1 They are themselves a parallax surface

Prediction markets price the *probability* of an outcome. Other markets price the *consequences* of an outcome (the equity will move, the currency will react, the volatility will spike). The same future event is observed from two angles: the prediction market's probability and the consequence market's implied probability extracted from option skew or futures basis.

The difference between those two probabilities is signal. That difference is the kind of parallax this system is named for.

### 1.2 They are a clean test of the truth ladder

A binary contract resolves to a deterministic value at a known time. Either the strategy was right (and gets paid) or it was wrong (and gets nothing). There is no "but the position is still open"; the contract closes itself. This makes prediction markets an ideal **track-record substrate** for AUGUR — the signal agent — because the closure is automatic.

### 1.3 They make internal governance falsifiable

PARRALAX can issue **internal prediction markets** on the outcomes of its own decisions ("Will Strategy X exceed its drawdown limit before quarter-end?", "Will the council ratify the proposed AI-token addition?"). These are not financial speculation. They are a structured way to surface and aggregate the council's beliefs. They are governance instruments.

---

## 2. Three sub-families

| # | Sub-family | Examples | Venue type | Day-1 posture |
|:--:|:---|:---|:---|:---:|
| **A** | **Regulated event contracts** | Kalshi-class (CFTC-registered binaries) | Centralised, regulated | in-scope STRICT |
| **B** | **Decentralised event markets** | UMA / Augur / Polymarket-class | On-chain, oracle-based | in-scope STRICT (limited) |
| **C** | **Internal PARRALAX prediction markets** | "Will Strategy X exceed 2% MDD before Q3?" | Internal-only | in-scope STRICT (council-only) |

Excluded from scope (any tier, any venue):

- Sports betting books (PARRALAX is not a sportsbook).
- Politically charged election markets on venues with documented manipulation history.
- Markets denominated in unbacked memecoins.
- Markets without a clearly published, source-linked resolution criterion.
- Markets where the operator-of-the-venue is also a participant on one side of the contract.

The exclusion list is additive and follows the same removal/re-inclusion asymmetry as the asset scope charter.

---

## 3. The dedicated gates

In addition to all gates in `RISK_CHARTER.md`, prediction-market actions pass through three additional gates. These extend CUSTOS for this family.

### 3.1 `gate.event_concentration`

**Purpose:** prevent over-concentration of capital in any single event outcome.

**Parameters:**

```
EventConcentrationLimits {
  perEventMaxUSD:            decimal   // hard cap per event, any side
  perEventClassMaxUSD:       decimal   // cap per event class (e.g. 'election', 'sports')
  perOracleMaxUSD:           decimal   // cap per oracle / resolution source
  perResolutionDateMaxUSD:   decimal   // cap per calendar date of resolution
  netDirectionalOutcomeMax:  decimal   // long-bias on a single outcome across events
}
```

**Check:** post-action exposure across each dimension stays within its limit. The `perOracleMaxUSD` gate is the unusual one — it caps how much PARRALAX trusts any single oracle to resolve outcomes correctly.

**Failure semantics:** rejected. Drift counter increments.

**Receipt class:** `gate.event_concentration`.

### 3.2 `gate.resolution_window`

**Purpose:** prevent stale positions accumulating into resolution and prevent entering positions too close to resolution unless the edge is clear.

**Parameters:**

```
ResolutionWindowLimits {
  minHoursToResolution:       u32      // refuse new entry within N hours of resolution
  preResolutionReduceWindow:  u32      // begin reducing positions N hours before
  forceCloseHoursBefore:      u32      // if non-zero, auto-flatten N hours before
  minEdgeBpsForLateEntry:     u32      // edge required to enter within minHours
}
```

**Check:** the action's effective time-to-resolution is outside the configured windows, OR the signal's stated edge clears the late-entry threshold.

**Failure semantics:** rejected. The `forceCloseHoursBefore` window is **a documented exception** to the no-auto-close rule of `KILL_SWITCH_DOCTRINE.md` § 7 — but it is *not* a kill-switch action. It is a per-asset hygiene action, predictable and pre-disclosed in the agent's mandate, and the operator may set `forceCloseHoursBefore: 0` to disable it.

**Receipt class:** `gate.resolution_window`.

### 3.3 `gate.oracle_reliability`

**Purpose:** refuse trades on markets whose resolution oracle's reliability has degraded.

**Parameters:**

```
OracleReliabilityLimits {
  oracleAllowlist:            OracleRef[]      // explicit allow-list per venue
  oracleBlocklist:            OracleRef[]      // overrides allowlist
  minHistoricalAccuracyPct:   decimal          // rolling resolution-accuracy floor
  minResolutionDisputeWindow: u32              // require dispute window for on-chain oracles
  blockOnRecentManipulation:  boolean
  recentManipulationWindowDays: u32
}
```

**Check:** the resolution oracle for the market is on the allowlist, off the blocklist, has historical accuracy above the floor, and has no documented manipulation in the recent window.

**Failure semantics:** rejected. Oracle blocklist takes precedence over allowlist — an oracle on both is blocked.

**Receipt class:** `gate.oracle_reliability`.

---

## 4. The dedicated agent role — PROPHET

A new sub-mandate of AUGUR specifically for prediction markets.

### 4.1 PROPHET — Latin: *propheta* / *vates* (seer)

PROPHET is not a separate agent in the 10-agent council from `PLAN.md` § 3. It is a **specialised mandate within AUGUR** for prediction-market signals. The reasons for keeping it within AUGUR rather than spinning out a new agent:

- The council is already large at 10 agents. Adding an 11th for one sub-family would dilute the architecture.
- AUGUR's existing infrastructure (signal scoring, confidence, council agreement) applies identically to prediction-market signals.
- The doctrine "the names came from the math" prefers reusing existing names where the math is the same.

PROPHET is therefore a **mandate variant** with these specifics:

- `walletScope` includes only prediction-market venues.
- `capabilities` add `proposal:submit` with a sub-tag `target: 'prediction'`.
- `riskTier` is STRICT (never STANDARD or WIDE) — prediction markets are always STRICT by family doctrine.
- Confidence threshold floor is **higher than spot AUGUR** (default 0.75 vs. 0.65) because resolution is binary and being wrong has no salvage path.
- Signal output includes a mandatory **claimed edge** field (basis points expected return) that `gate.resolution_window` evaluates against `minEdgeBpsForLateEntry` for late-window entries.

---

## 5. Internal prediction markets

### 5.1 Purpose

PARRALAX can issue prediction markets on its own internal questions. Examples:

- *Strategy outcome markets.* "Will Strategy X close Q3 above its watermark?"
- *Council-decision markets.* "Will the council ratify the proposed AI-token X addition?"
- *Risk-event markets.* "Will any agent trigger a kill switch in the next 30 days?"
- *Adversarial markets.* "Will the operator override CUSTOS in the next quarter?"

These are not gambling. They are a **structured belief-aggregation tool**. The market price is the council's aggregated probability; the deviation between any one council member's private estimate and the market is information that surfaces and can be examined.

### 5.2 Strict constraints

- **Internal markets are not tradeable by external participants.** Only council members and the operator may take positions. This is enforced by FABRICOR at mint and by VENDITOR at order placement.
- **Internal markets use internal accounting units only.** No fiat, no crypto, no external value flows.
- **Internal markets have an immutable resolution criterion.** The criterion is set at mint time, signed, and CHRONO-anchored. The resolver is a named principal (operator or council).
- **Internal markets never settle to anything outside the system.** Resolution updates internal reputation units; nothing exits.
- **Adversarial markets cannot have the operator as their resolver.** A market about the operator's behaviour must be resolved by the council; a market about a council member's behaviour must be resolved by an independent observer (or the operator if no other neutral party is available).

### 5.3 What internal markets are forbidden to do

| Forbidden | Reason |
|---|---|
| Trade against external counterparties | Internal-only is a structural constraint, not a policy. |
| Pay out in any external asset | Reputation units are the only payout. |
| Be priced in any way that implies dollar value | Misrepresentation risk to anyone who sees a screenshot. |
| Resolve based on private information | The resolution criterion must be source-linked to publicly observable facts. |
| Be created on adversarial topics about non-consenting individuals | Internal markets are governance tools, not surveillance. No markets about anyone who has not signed up to be a council member. |

---

## 6. Resolution semantics

### 6.1 Definition

A prediction-market position has three distinct states:

```
open       — contract is live, can be traded
resolving  — resolution event has occurred, oracle is determining outcome
settled    — outcome determined, contract pays out
disputed   — outcome contested; resolution paused per venue dispute protocol
```

These map to the trade truth ladder from `READING.md` § 2 with a sub-extension:

```
fill_received  → position open (open)
[time passes]
[event occurs]
                  → resolving
[oracle reports]
                  → settled
[settlement paid to wallet]
                  → settled_reconciled (the ladder's terminal state)
```

A contract that enters `disputed` returns to `resolving` after the venue's dispute protocol concludes, and only then progresses to `settled`. **No PARRALAX strategy may report P&L on a contract until `settled_reconciled`.** Prediction-market P&L is therefore reported with longer latency than spot P&L — sometimes by hours, sometimes by days, occasionally by weeks if disputes are involved.

### 6.2 The doctrine on disputes

When a contract enters the `disputed` state:

- The agent's position is held; not auto-closed.
- The agent stops emitting signals for that event class until resolution.
- The dispute itself is a CHRONO entry, with a link to the venue's dispute record.
- If the dispute resolves against the consensus the agent acted on (the agent was on the winning side at execution but the oracle reversed), this is a **resolution miss** event and triggers a CUSTOS review for oracle reliability.

Multiple resolution misses on the same oracle within a window auto-add it to `oracle_reliability.oracleBlocklist`.

---

## 7. Venue qualification for external prediction markets

A prediction-market venue is qualified for inclusion only if:

1. **Regulated path:** CFTC-registered designated contract market (DCM) or equivalent in another major jurisdiction.

   **OR**

2. **Decentralised path:**
   - Open-source contracts audited by a recognised firm.
   - Published dispute resolution protocol with at least 24-hour challenge window.
   - Documented operational history of at least 12 months.
   - On a chain that is in `gate.chain.contractAllowlist`.
   - Resolution oracle is itself decentralised (not a single multisig that can rewrite outcomes).

   **AND, for both paths:**

3. The venue publishes its resolution methodology per market in plain language before the market opens.
4. The venue has no demonstrable conflict of interest in the resolution of any specific market PARRALAX engages.

Venues that fail any single criterion are excluded. Day-1 venue list is **operator-set on deployment**; the agent does not assume any specific venue.

---

## 8. The internal prediction market issuance protocol

When the operator or council wants to issue an internal market:

1. **Drafting.** A proposed market is drafted with: question, resolution criterion (source-linked), resolution date, resolver principal, payout schedule (in internal reputation units), participant allowlist.
2. **CUSTOS review.** CUSTOS confirms: the criterion is source-linked; the resolver is appropriate (not the subject of the market); no overlap with an existing live market on the same question.
3. **Council ratification.** 3-of-5 council vote. For adversarial markets (where the resolver is not the operator), the subject of the market is recused from the vote.
4. **FABRICOR mint.** A market NFT is minted to the venue contract; the issuance receipt is CHRONO-anchored.
5. **Trading window.** Council members and operator may take positions, denominated in reputation units, for the open period.
6. **Resolution.** The named resolver, at the resolution date, reads the source-linked criterion and writes the resolution receipt.
7. **Settlement.** Payouts are computed by FABRICOR; positions are updated.
8. **Audit.** The entire lifecycle is hash-chained from mint to settlement.

The protocol cannot be shortened. Each step writes a CHRONO entry.

---

## 9. What this charter forbids

| Forbidden | Reason |
|---|---|
| Engaging prediction markets without the three dedicated gates active | The general risk charter is insufficient for this family. |
| Trading on markets where the resolution criterion is not source-linked | Cannot tell if the agent was right. |
| Issuing internal markets on non-consenting individuals | Internal markets are governance tools, not surveillance. |
| Letting an internal market settle to external value of any kind | Internal-only is structural. |
| Treating prediction-market P&L as final before `settled_reconciled` | Disputes can reverse outcomes; P&L is provisional until ladder closes. |
| Engaging unregulated centralised venues | Either regulated, or fully decentralised — never "centralised but offshore". |
| PROPHET signals without a claimed-edge field | `gate.resolution_window` requires it for late entries. |
| Sportsbook engagement under any framing | Outside scope. |
| Bypassing `gate.oracle_reliability` because "the oracle is well-known" | Familiarity is not reliability; the gate runs every time. |

---

## 10. Reading lock-in

1. **Prediction markets are STRICT — always.** No tier promotion exists for this family. Different mathematics, different posture.
2. **Internal prediction markets exist; they are governance tools and never settle to external value.**
3. **The truth ladder extends with `disputed` and only closes at `settled_reconciled`.** Provisional P&L is provisional. The chain decides.

---

## 11. Open decisions (operator-only)

1. **Day-1 external venue allowlist.** The agent does not assume which venues; operator must specify.
2. **Day-1 oracle allowlist.** Same.
3. **`forceCloseHoursBefore` default.** Recommendation: 0 (disable). Operator may enable per-strategy.
4. **Internal-market issuance enablement.** Default: not enabled until the council is formed (per `AGENT_AUTHORITY_CHARTER.md` § 6).
5. **Whether PROPHET signals are aggregated with spot AUGUR signals in any cross-asset strategy.** Default: no. The two are scored separately.

---

## 12. Cross-references

- **Charter:** [§ 8.5 NFTs and Programmable Ownership](./CHARTER.md), [§ 11.4 Risk Governance Layer](./CHARTER.md), [§ 25 AI Token and AI Governance Layer](./CHARTER.md)
- **Sibling docs:** [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) § 9 (this charter is its detail), [`RISK_CHARTER.md`](./RISK_CHARTER.md) (three new gates extend it), [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (PROPHET as a mandate variant of AUGUR), [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) § 7 (the documented exception via `gate.resolution_window.forceCloseHoursBefore`)
- **Existing doctrine inherited from the corpus:**
  - PROTOCOL-II (`TRUTH LADDER`) — extended here with `resolving` and `disputed`
  - PROTOCOL-V (`AGENT COUNCIL`) — used directly for internal-market ratification
  - Paper XXI (`QUORUM`) — the council's vote on internal-market issuance is a quorum event

---

*Prediction markets are STRICT by family. Internal markets are governance, not gambling.*
