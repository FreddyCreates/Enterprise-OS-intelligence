# SIMULATION PROMOTION PROTOCOL

**Document:** `parralax-aihftfund/SIMULATION_PROMOTION_PROTOCOL.md`  
**Parents:** [`TESTING_DOCTRINE.md`](./TESTING_DOCTRINE.md) · [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md) · [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md)  
**Status:** Ratified doctrine.

---

## 0. Premise

Both `TESTING_DOCTRINE.md` (§ 1 the four-layer test pyramid) and `TRAINING_DOCTRINE.md` (§ 3 the five-stage training curriculum) refer repeatedly to a promotion gate — "promotion between layers requires operator + council + CHRONO entry." This document is that gate, specified.

Two related but distinct promotion streams are gated here:

- **Test-pyramid promotion.** A strategy or agent moves from Layer 1 → Layer 2 → Layer 3 → Layer 4 (live guarded).
- **Training-stage promotion.** An agent moves T1 → T2 → T3 → T4 → T5.

The two streams intersect at the boundary between simulation and real capital. A single Simulation Promotion Protocol governs both, with distinct receipt classes for each.

The doctrine: **no agent, no strategy, no code path may unilaterally promote itself. Every promotion is an explicit operator action, evidenced by receipts, ratified by the council above the simulation/live boundary, and written into CHRONO as a permanent record.**

---

## 1. The two promotion streams, in one diagram

```
             │ TRAINING STAGES         │ TEST-PYRAMID LAYERS
─────────────┼─────────────────────────┼───────────────────────────────
 SIMULATION  │ T1  doctrine-compliance │ Layer 1  unit tests
             │ T2  deterministic paper │ Layer 2  paper venue
             │ T3  adversarial synth   │ (training-only)
─────────────┼─────────────────────────┼───────────────────────────────
             │ T4  historical replay   │ Layer 3  demo accounts
─────────────┼─────────────────────────┼───────────────────────────────
             │ T5  live-shadow         │ Layer 4  live guarded
 REAL        │      (propose, no exec) │      (small positions)
 CAPITAL     │                         │
```

The **critical boundary** is between T3/Layer 2 and T4/Layer 3 — this is where the system starts touching real venues (even if only demo). Every gate above that boundary requires a **council** vote in addition to operator sign-off.

---

## 2. The stages, and what each requires to advance

### 2.1 Test-pyramid layer promotions

| Advance | Gate |
|---|---|
| Layer 1 → Layer 2 | Unit tests green on CI for ≥ 7 consecutive days · operator sign-off (single key) |
| Layer 2 → Layer 3 | ≥ 1000 paper-venue trades against deterministic replay · zero CUSTOS gate violations of `capital`, `leverage`, `exposure` in that window · operator + council 3-of-5 vote |
| Layer 3 → Layer 4 (guarded live) | ≥ 30 trading days clean on demo account (per `TESTING_DOCTRINE` § 2.4) · operator hardware-signer ceremony · council 3-of-5 vote · 14-day $100/order hard cap applies automatically |

### 2.2 Training-stage promotions

| Advance | Gate |
|---|---|
| T1 → T2 | Doctrine block signature verified · ≥ 100 successful `beat()` calls · operator sign-off |
| T2 → T3 | ≥ 1000 paper trades with a non-zero reputation score · operator sign-off |
| T3 → T4 | ≥ 100 adversarial scenarios survived without CUSTOS-bypass and without `voxis_doctrine_violation` · operator + council 3-of-5 vote |
| T4 → T5 | ≥ 30 days replay training with reputation stable above the operator-set floor (recommended 0.75) · operator hardware-signer ceremony · council 3-of-5 vote |

### 2.3 What is NOT in this protocol

Training-stage T5 → Level-4 authority is **not** a promotion here. That is the authority-promotion protocol in `AGENT_AUTHORITY_CHARTER.md` § 4. T5 evidence *informs* the authority vote; it does not *effect* it.

---

## 3. The promotion request

Every promotion begins with a written request from the operator. The request carries:

```
PromotionRequest {
  requestId:          string           // ULID
  stream:             'test-pyramid' | 'training-stage'
  subject:            AgentRef | StrategyRef
  fromStep:           string           // e.g. 'T2' or 'Layer-2'
  toStep:             string           // e.g. 'T3' or 'Layer-3'
  evidence: {
    receiptChain:     Sha256           // hash of the CHRONO chain segment carrying the evidence
    metrics:          Record<string, number>
    windowStart:      Iso8601
    windowEnd:        Iso8601
  }
  operator:           PrincipalId
  operatorSignature:  Signature
  submittedAt:        Iso8601
}
```

The request is CHRONO-anchored on submission as `promotion.request_submitted`. The subject is notified via the standard event bus. **No promotion is granted without this record.**

---

## 4. The council vote

For gates above the simulation/live boundary — T3→T4, T4→T5, Layer 2→3, Layer 3→4 — the operator's signature is necessary but not sufficient. A council vote follows.

### 4.1 Vote mechanics

- Council members receive the promotion request via a signed message.
- Each member independently reviews the evidence chain and metrics.
- Each member signs a `PromotionVote` (approve or reject) with their council key.
- The vote is CHRONO-anchored as `promotion.vote_cast`.
- When ≥ 3 approve votes are received within the vote window (default 7 days), the promotion is ratified.
- If ≥ 3 reject votes are received, the promotion is denied.
- If neither threshold is reached before window close, the promotion lapses (implicit denial).

### 4.2 Vote transparency

Vote records are **internal to the council** but permanent in CHRONO. The council may aggregate anonymised counts in operator dashboards; individual votes are not published externally.

### 4.3 Council members recuse from votes about their own agents

A council member who owns or operationally oversees the subject agent must recuse from that agent's promotion vote. Recusal is a CHRONO entry (`promotion.council_recusal`), not a silent abstention.

---

## 5. The promotion receipt

On ratification, a promotion receipt is written:

```
PromotionRatified {
  requestId:         string
  ratifiedAt:        Iso8601
  ratifiedBy:        PrincipalId[]        // operator + approving council members
  signatures:        Signature[]
  effectiveAt:       Iso8601              // may be after ratifiedAt if cooldown applies
  cooldownUntil:     Iso8601 | null       // e.g. for L3→L4, first 14 days = $100/order cap
  automaticGuards:   AutomaticGuard[]     // structured post-promotion constraints
  priorReceiptHash:  Sha256
}
```

**Automatic guards** are the operational constraints that apply immediately after promotion — the L3→L4 $100/order cap, the T4→T5 no-execution constraint, etc. These are encoded structurally so CUSTOS reads them without additional configuration. A promotion that lists no automatic guards for a gate that requires them is a doctrine violation.

---

## 6. Post-promotion behaviour

### 6.1 Cooldown

Every promotion above the simulation/live boundary carries an initial **cooldown window** during which stricter parameters apply:

| Promotion | Cooldown length | Constraints during cooldown |
|---|---|---|
| Layer 2 → Layer 3 | 7 days | ≤ 10 trades per day; STRICT risk-tier only |
| Layer 3 → Layer 4 (guarded) | 14 days | ≤ $100 notional per order; ≤ 20 trades per day |
| T3 → T4 | 7 days | reputation delta capped at ± 0.05 per day |
| T4 → T5 | 14 days | proposals reviewed by operator before any downstream consumption |

Cooldown is enforced by CUSTOS as an automatic-guard-derived parameter override. **An agent cannot exit cooldown by request** — only by the passage of time and by not tripping any gate during the window.

### 6.2 Demotion during cooldown

Any CUSTOS gate violation during cooldown demotes the subject one step, per `AGENT_AUTHORITY_CHARTER.md` § 5. The cooldown demotion writes a distinct receipt class (`promotion.cooldown_demotion`) so post-mortem reviews can distinguish it from an ordinary drift-triggered demotion.

### 6.3 Reset after demotion

An agent demoted during cooldown returns to the prior step and its reputation ledger resets to neutral (`ReputationLedger.reset()`). Re-promotion follows the full protocol from scratch. **There is no "second try with the prior evidence"** — evidence is per-attempt, not per-agent.

---

## 7. What this protocol forbids

| Forbidden | Reason |
|---|---|
| Self-promotion by any agent | The doctrine's central claim: promotion is an operator action |
| Skipping the request or the vote | The gate is the audit trail |
| Council votes without recusal on conflicted subjects | Recusal is structural, not gracious |
| Automatic-guard-less promotions above the sim/live boundary | Guards are what make cooldown enforceable |
| Cooldown shortening for any reason | The clock is the safety |
| Re-using evidence from a lapsed request | Every attempt is new |
| Promotion receipts without a full signature set | Missing signatures = no promotion |
| Silent vote abstention | Recuse explicitly; a missing vote reads as a soft reject |
| Council members promoting their own agents | See recusal |
| Any receipt shape that omits `priorReceiptHash` | The chain is non-negotiable |

---

## 8. Reading lock-in

Three claims this protocol makes that the implementation must honour:

1. **Promotion is bidirectional-asymmetric.** Requests + votes go up; automatic guards + cooldown + demotion mechanisms come down. The vote-side is deliberate; the demotion-side is automatic. Same asymmetry as the kill switch (`KILL_SWITCH_DOCTRINE.md`).
2. **Every promotion writes a chained receipt.** No off-ledger promotions. The vote record, the ratification receipt, the automatic-guard set, and the cooldown clock are all CHRONO entries.
3. **Cooldown is not skippable.** Not by the operator, not by the council, not by the agent. It is a passage-of-time constraint enforced structurally.

---

## 9. Open decisions (operator-only)

The charter does not assume:

1. **Council composition specific to promotion votes.** Same council as `AGENT_AUTHORITY_CHARTER.md` § 6, or a distinct quorum? Recommendation: same council; distinct quorum size only if council grows beyond seven members.
2. **Vote window length.** Default 7 days above. Operator may shorten to 3 days for lower-stakes promotions (T1→T2, Layer 1→2) or lengthen to 14 days for T4→T5.
3. **Cooldown parameters for cooldown-per-agent overrides.** Some agents may warrant stricter cooldowns than the defaults. Operator sets per agent.
4. **Whether promotion evidence has an expiry.** Recommendation: evidence older than 30 days at time of request lapses; the operator must accumulate fresh evidence. Not enforced by default.

---

## 10. Cross-references

- **Charter:** [§ 14.5 Execution Principle](./CHARTER.md), [§ 15 Governance Charter](./CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (promotion of Level 0..6 is separate from this protocol); [`TESTING_DOCTRINE.md`](./TESTING_DOCTRINE.md) (Layer promotions gated here); [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md) (Stage promotions gated here); [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) (the asymmetry pattern this protocol mirrors)
- **Existing doctrine:**
  - Paper XXI (`QUORUM`) — council quorum semantics
  - Paper XXIV (`ANTE · MEDIUS · POST`) — promotion is itself an ANTE→MEDIUS→POST transition (state before, ratified event, cooldown-adjusted state after)

---

*Promotion is an operator action. The council ratifies above the simulation/live boundary. Cooldown is not skippable. Every step writes a receipt.*
