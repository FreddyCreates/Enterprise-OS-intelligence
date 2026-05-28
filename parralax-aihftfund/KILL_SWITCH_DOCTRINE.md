# KILL SWITCH DOCTRINE

**Document:** `parralax-aihftfund/KILL_SWITCH_DOCTRINE.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 16.4 — Kill Switch Doctrine  
**Status:** Public charter. Prior art. No implementation in this commit.  
**Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) · [`RISK_CHARTER.md`](./RISK_CHARTER.md)

---

## 0. Premise

The kill switch is the doctrine that makes everything else recoverable.

The Authority Charter says no agent acts beyond its mandate.  
The Risk Charter says no action passes without thirteen gates.  
The Kill Switch Doctrine says: **when something goes wrong anyway, the system stops adding to the problem within milliseconds, and the person who can restart it is a human with a hardware signer.**

This is not a feature. It is the last wall. Every other doctrinal document depends on it.

The single principle: **stopping is unanimous; starting is collective.**

---

## 1. What a kill switch is — and what it isn't

A kill switch is a piece of state, held in one canonical place, that gates whether a class of actions may proceed.

When a switch is **tripped**:
- No new orders are emitted within its scope.
- No new positions are opened within its scope.
- Existing positions are NOT auto-closed (see § 7).
- All other system functions continue: market data flows, observation agents observe, audit agents write receipts, the operator can read everything.

When a switch is **set** (i.e., not tripped):
- Normal authority/risk evaluation proceeds.

The switch has two states and exactly two transitions:

```
set ──trip──▶ tripped
              │
              └──reset──▶ set
```

**Tripping is fast, asymmetric, multi-source.** Resetting is slow, ceremonial, multi-party.

### 1.1 What a kill switch is NOT

A common mistake conflates the kill switch with "panic mode" — close everything, sell everything, run for the exits. **PARRALAX rejects this design.** Forced auto-closing during a flash crash is the loss-amplifier the original disaster always made worse. The kill switch stops *new* exposure. Whether to unwind existing exposure is an operator decision made deliberately, possibly slowly, possibly never.

The kill switch is also not the same as the risk gates. Gates evaluate a single proposed action. The switch halts an entire scope. Gates contribute evidence; they do not pull the switch.

The kill switch is also not the same as agent demotion. A demoted agent still operates within its (lower) mandate. A tripped switch in the agent's scope means no orders, regardless of authority.

---

## 2. Scope — what a kill switch covers

A switch has a scope. The scope is one of:

```
Scope ::= 'system'        // every agent, every strategy, every venue
        | 'agent'         // one VoxisId
        | 'strategy'      // one StrategyId
        | 'asset'         // e.g. 'BTC-USD' across all venues
        | 'venue'         // e.g. 'binance' across all assets
        | 'chain'         // e.g. 'ethereum-mainnet'
        | 'counterparty'  // e.g. 'broker-x'
```

Multiple switches can be tripped concurrently. An action proceeds only if **no switch covering any of its resources is tripped.**

The system switch is the broadest. Tripping it halts everything. Tripping a single asset-scope switch halts only that asset.

There is no narrower switch than `agent`. Per-order kill is what the risk gates are for.

---

## 3. The canonical state holder — a Durable Object

A kill switch's state lives in **exactly one place**. For PARRALAX on the Cloudflare Workers / Durable Objects substrate, the canonical state is a Durable Object — single-writer by design, globally consistent, persistent across worker restarts.

There is exactly one Durable Object per scope-instance:
- one for `system`
- one per agent
- one per strategy
- ... and so on

**No agent caches the state.** Every action evaluation queries the canonical state. The latency cost is the safety. A stale cached "not tripped" can cost more than a query.

If the canonical state is unreachable (Durable Object timeout, network partition):
- The agent treats the switch as **tripped**. Fail closed.
- The agent writes a `gate_unreachable` CHRONO entry.
- The agent does not retry rapidly — backoff is φ-compounding.

This is the "fail closed when in doubt" doctrine the journal's CUSTOS already applies to publication. Here it applies to execution.

---

## 4. Triggers — what can trip a switch

The Charter (§ 16.4) lists ten trigger sources. Formalised here as concrete trigger predicates with the receipt class each writes.

| # | Trigger | Default scope | Source | Receipt |
|:--:|:---|:---|:---|:---|
| 1 | **Loss threshold** | strategy + system | drawdown gate observes exceedance | `trip.loss` |
| 2 | **Abnormal volatility** | asset | NEXORIS regime classifier reports >Nσ event | `trip.volatility` |
| 3 | **Exchange failure** | venue | VIGIL exchange-health monitor reports outage | `trip.exchange` |
| 4 | **API failure** | venue | repeated authentication / order-place failures | `trip.api` |
| 5 | **Chain congestion** | chain | gas + mempool depth above threshold | `trip.chain` |
| 6 | **Agent malfunction** | agent | three CUSTOS gate failures in 1h, or `voxis_doctrine_violation` | `trip.agent` |
| 7 | **Excessive order frequency** | agent or strategy | orders / second above mandated rate | `trip.frequency` |
| 8 | **Strategy drift** | strategy | `gate.strategy_consistency` drift counter exceeds tolerance | `trip.drift` |
| 9 | **Unauthorised action attempt** | agent | gate.human_override violation, or capability not in mandate | `trip.unauthorised` |
| 10 | **Human command** | any | operator-issued, hardware-signed | `trip.operator` |

Plus three derived triggers added by this document:

| # | Trigger | Default scope | Source | Receipt |
|:--:|:---|:---|:---|:---|
| 11 | **System-wide gate failure rate** | system | 10+ gate failures across all agents in 1h | `trip.system_failure_rate` |
| 12 | **Council vote to trip** | as voted | any 1 council member's signed message | `trip.council` |
| 13 | **CHRONO write failure** | system | substrate cannot accept receipts | `trip.substrate` |

The thirteen sources are a **union**. The switch trips when *any one* fires. There is no "majority" requirement to trip. There is no requirement that multiple sources agree.

This asymmetry is the doctrine. A single failing signal that turns out to be wrong costs a small opportunity. A single missed real failure can cost the fund.

---

## 5. The trip receipt

Every trip writes a receipt before the switch state is observed-as-tripped by any agent:

```
KillTripReceipt {
  switchId:       string              // identifies the scope-instance
  scope:          Scope               // see § 2
  scopeRef:       string | null       // VoxisId / StrategyId / etc. for non-system scopes
  trigger:        TriggerSource       // one of the 13 in § 4
  triggerDetails: object              // measurements, thresholds, source IDs
  trippedAt:      iso8601
  trippedBy:      PrincipalId         // automatic source name, council key, or operator key
  signature:      Signature           // signing principal's signature
  chronoLink:     string              // hash of the prior CHRONO entry
}
```

**The receipt is written first; the state flips second.** Order matters. If the receipt write fails, the trip itself is treated as having failed — but in PARRALAX's fail-closed posture, this is a `trip.substrate` event in its own right and the system switch trips immediately.

The trip receipt is permanent. Even when the switch is later reset, the trip receipt stays. The audit chain shows every trip and every reset for the life of the fund.

---

## 6. Reset — the only path back

Resetting a tripped switch is **deliberately hard**. The shape varies by scope.

### 6.1 Reset requirements per scope

| Scope | Reset requirement |
|:---|:---|
| `agent` | 3-of-5 council vote |
| `strategy` | 3-of-5 council vote |
| `asset` | 3-of-5 council vote |
| `venue` | 3-of-5 council vote + venue-health re-verification by VIGIL |
| `chain` | 3-of-5 council vote + chain-health re-verification by VIGIL |
| `counterparty` | 3-of-5 council vote + sanctions re-check |
| `system` | **operator hardware-signer ceremony** + 3-of-5 council vote |

The system-switch reset is the strictest in the entire system — stricter even than promoting an agent to Level 6. This is intentional. The system switch is the bottom of the barrel; a reset is "trust the machine again."

### 6.2 The reset receipt

```
KillResetReceipt {
  switchId:           string
  scope:              Scope
  scopeRef:           string | null
  resetAt:            iso8601
  resetBy:            PrincipalId[]            // all signers
  signatures:         Signature[]              // matched to resetBy
  reason:             string                   // operator-written explanation, mandatory
  evidence:           ResetEvidence[]          // health checks, post-mortem links, etc.
  priorTripReceipt:   string                   // SHA of the trip receipt being undone
  chronoLink:         string
}
```

The `reason` field is mandatory and is the only free-text field in the schema. It exists so the audit log carries the human judgment that lifted the halt, not just the cryptographic signatures.

### 6.3 What a reset does NOT do

A reset re-enables new orders within the scope. It does **not**:

- Re-open closed positions automatically.
- Re-arm any automated unwind that the operator started during the halt.
- Clear any drift counters, agent demotions, or risk-tier downgrades that occurred while the switch was tripped.
- Undo CHRONO entries written during the halt.

Resetting means "the machine may resume." It does not mean "pretend the trip didn't happen."

### 6.4 The cooldown

After any reset, a `cooldown` window is in effect. During the cooldown:

- All agents within the previously-tripped scope operate at one risk tier tighter than their mandate (STRICT if WIDE, STRICT if STANDARD, STRICT if already STRICT).
- All capital limits are halved.
- All orders require `model_confidence` gate at one tier above the agent's default minimum.

Default cooldown windows:

| Scope reset | Cooldown duration |
|:---|:---|
| `agent` | 1 hour |
| `strategy` | 4 hours |
| `asset` / `venue` / `chain` / `counterparty` | 24 hours |
| `system` | 72 hours |

Operators may lengthen cooldowns. They may not shorten them below the defaults without a council vote.

---

## 7. The "no auto-close" rule

When a switch trips, existing positions are **not** automatically closed. This is the most often-misunderstood part of the doctrine.

Reasons:

1. **Auto-close during a flash crash amplifies the loss.** The classic 2010 flash-crash pattern: stop-losses cascading became the sell pressure that caused the next stop-loss to trigger. PARRALAX does not become that cascade.
2. **Auto-close removes operator optionality.** A halted system whose positions are still open can be unwound deliberately by the operator. An auto-closed system has already locked in the worst price.
3. **The kill switch is a stop-new-risk mechanism, not an exit-existing-risk mechanism.** Conflating the two has ended funds.

**What may happen automatically when a switch trips:**
- Open *limit orders* may be cancelled (operator-configured per agent; default: cancel non-reducing limit orders, keep reducing limit orders).
- Stop-losses on open positions remain in force.
- Position monitoring continues; the operator gets normal real-time visibility.

**What requires an explicit operator action:**
- Closing or reducing any position not already protected by a pre-existing stop-loss.
- Hedging existing exposure with new positions (a new position requires a switch-reset, or a fresh mandate).

This rule is consciously asymmetric: tripping is fast and automatic; unwinding is deliberate and human.

---

## 8. Per-scope behaviour summary

What happens when each scope-class of switch trips:

| Scope tripped | New orders blocked from… | Other agents… | Existing positions |
|:---|:---|:---|:---|
| `agent` | the one agent | unaffected | held (per § 7) |
| `strategy` | every agent assigned to that strategy | unaffected on other strategies | held |
| `asset` | every agent for that asset | trade other assets freely | held in that asset |
| `venue` | every agent for that venue | trade other venues freely | held at that venue |
| `chain` | every on-chain action on that chain | other chains free; off-chain free | held |
| `counterparty` | every order against that counterparty | unaffected elsewhere | held |
| `system` | every agent, every strategy, every venue, every chain | nothing trades | held |

The composition is **AND-blocking**: if any switch covering a resource is tripped, the action is blocked. There is no "at least one switch must allow."

---

## 9. The kill-switch lifecycle in the audit chain

A single kill cycle produces, at minimum, these CHRONO entries in order:

```
1. trip.<source>                  the trip receipt (§ 5)
2. agent.action_blocked × N       one per attempted action while tripped
3. operator.policy_change × M     any operator decisions during halt (close, hedge, hold)
4. council.vote.reset             council vote message(s)
5. reset.<scope>                  the reset receipt (§ 6.2)
6. cooldown.start                 cooldown window begins (§ 6.4)
7. cooldown.end                   cooldown window ends
```

Every entry is signed by its writer. Every entry links to the prior entry's hash. The full chain for any incident is fetchable from `/audit/` (using the journal's existing ARBITER + audit page pattern, scoped to PARRALAX's operator-private audit surface).

A reader of the audit chain six months later can reconstruct exactly:
- What tripped the switch.
- When.
- Why (the trigger details).
- What happened during the halt.
- Who reset it and on what evidence.
- What the cooldown effect was on subsequent trades.

This is CHRONO's purpose at the trade scale.

---

## 10. The relationship to AGENT_AUTHORITY_CHARTER

A tripped switch interacts with agent authority as follows:

1. The `kill:trip` capability (Authority Charter § 3.1) exists at Level 4+ — any qualifying agent may trip a switch within its scope-of-action (its own agent switch, its strategy switch, its asset/venue switches).
2. The capability to **reset** a switch is not in the `Capability` enumeration at all. No agent at any level may reset a switch. Reset is operator/council only.
3. When a switch trips on an agent, that agent is also demoted to Level 0 (`kill_switch_demotion`, Authority Charter § 5). The trip and the demotion are written as a single CHRONO transaction.
4. When the system switch trips, every active agent is demoted to Level 0 in cascade. Reset of the system switch does **not** restore agent levels — each agent must be re-promoted individually after the system reset.

This means a system-wide kill is the most expensive operational event possible: it costs every agent's earned authority, and reconstituting the system is a manual re-promotion pass. The cost is the deterrent against trigger-happy resets.

---

## 11. What this doctrine explicitly forbids

| Forbidden | Reason |
|---|---|
| Cached "not tripped" state used in a hot path | The canonical state is the only state. Caching is silent failure waiting to happen. |
| Reset by any single agent or any single principal at any scope | Stopping is unanimous; starting is collective. |
| Auto-close of positions on trip | Loss amplification through cascade is the failure this doctrine exists to prevent. |
| Skip-cooldown after reset | Cooldown is structural. Operators may lengthen, never shorten below default. |
| A switch with no scope or with a fabricated scope | The seven scopes in § 2 are exhaustive. There is no `Scope = 'other'`. |
| A trip without a receipt | The receipt is written before the state flips. No receipt, no trip. |
| Reset that re-arms automation paused during the halt | Reset re-enables new orders only. Anything else the operator paused stays paused until separately resumed. |
| A "test mode" that disables the kill switch in production | There is no test mode that disables the switch. The switch operates identically in paper and live; only its scope and the actions it gates differ. |
| Operator-only reset (no council) at any scope above `agent`-level kills | The council is the second wall. Bypassing it makes the doctrine dependent on a single human's worst day. |

---

## 12. Reading lock-in

Three doctrinal claims the implementation must honour:

1. **Stopping is asymmetric to starting.** Any one signed trigger trips a switch. A council vote (and, for the system switch, a hardware-signer ceremony) is required to reset. This asymmetry is the doctrine, not a parameter.
2. **The switch stops new exposure; it does not unwind existing exposure.** Auto-close is forbidden. Unwinding is an explicit operator action with its own audit trail.
3. **The canonical state is queried, never cached, on every action.** A stale "not tripped" is the failure mode this doctrine is designed to prevent.

If the implementation contradicts any of these three, the implementation is wrong, the doctrine is correct, and the implementation must change.

---

## 13. Open decisions (operator-only)

These shape the implementation. The agent will not assume them.

1. **Council composition** — same question as AGENT_AUTHORITY_CHARTER § 11.1; the same council operates here.
2. **Cooldown durations** — § 6.4 gives defaults. Operator may lengthen per scope. Operator must not shorten without explicit council vote.
3. **Cancellation policy on trip** — § 7 says default is "cancel non-reducing limit orders, keep reducing limit orders." Operator may override per agent.
4. **Trigger thresholds** — the numbers behind "abnormal volatility", "excessive frequency", "system-wide failure rate" must all be set. Recommendations:
   - Abnormal volatility: 3σ over a 15-minute realised window, asset-specific.
   - Excessive frequency: 2× the mandated rate, sustained for 60 seconds.
   - System-wide failure rate: 10 gate failures in 1 hour OR 50 in 24 hours, whichever comes first.
5. **Whether the system switch trips automatically at all on day one** — many operators run the first 30 days with the system switch reachable only via manual `trip.operator` and `trip.council`, observing how often the automated triggers *would have* fired. Recommendation: yes — run in observation mode for the first 30 days; automated `trip.system_failure_rate` and `trip.substrate` enabled only after the patterns are understood.

---

## 14. Cross-references

- **Charter:** [§ 16.4 — Kill Switch Doctrine](./CHARTER.md), [§ 14.4 — Trader Authority](./CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (the `kill:trip` capability and `kill_switch_demotion` are defined there), [`RISK_CHARTER.md`](./RISK_CHARTER.md) (gates contribute to `trip.system_failure_rate` but do not themselves trip switches)
- **Existing doctrine inherited from the corpus:**
  - Journal's CUSTOS — the fail-closed integrity pattern this doctrine extends
  - Paper XXIV (`ANTE · MEDIUS · POST`) — the chrono state triple; a trip is itself a state transition with an ANTE (state at trip), MEDIUS (the trip event itself), and POST (state after reset)
  - Paper III (`SYSTEMA INVICTUM`) — antifragility: the system that absorbs the trip and learns from it grows stronger; the system that suppresses trips becomes fragile

---

*Stopping is unanimous. Starting is collective. The last wall is the operator with a hardware signer.*
