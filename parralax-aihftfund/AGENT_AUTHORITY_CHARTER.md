# AGENT AUTHORITY CHARTER

**Document:** `parralax-aihftfund/AGENT_AUTHORITY_CHARTER.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 18 — AI Governance and Agent Authority  
**Status:** Public charter. Prior art. No implementation in this commit.  
**Sibling docs:** [`RISK_CHARTER.md`](./RISK_CHARTER.md) · [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md)

---

## 0. Premise

Authority is the most dangerous variable in an AI financial system. An over-authorised agent is the single failure mode that ends funds, breaks fiduciary duty, and ends careers. Therefore authority is not a flag. It is a **doctrine block field on a VOXIS** — written at construction time, frozen, and read on every heartbeat before any action can execute.

This document formalises the seven authority levels of `PARRALAX-AIHFTFUND` § 18.3 as VOXIS bit-fields, maps each level to a concrete wallet allow-list, and specifies the only paths by which an agent can move between levels.

The principle: **no agent ever wakes up at a higher level than it slept at unless a council wrote a receipt.**

---

## 1. The seven levels, formally

| Level | Name | Latin | Allowed actions | New trade flow? |
|:---:|:---|:---|:---|:---:|
| **0** | Observer | *speculator* — the one who watches | Read market data. Emit observations. Write to its own memory. No external side effects. | no |
| **1** | Analyst | *analysta* | Everything Level 0 can. Generate signals with confidence scores. Recommend strategy actions to higher-level agents. | no |
| **2** | Simulator | *simulator* | Everything Level 1 can. Run paper trades against an internal venue. Update simulated portfolio. **All P&L is marked `simulated:true` and CANNOT be aggregated with real P&L.** | paper only |
| **3** | Proposer | *propositor* | Everything Level 2 can. Submit trade proposals to the council. A proposal is a structured intent; it does not become a live order until ARCHON authorises it. | no (proposes) |
| **4** | Guarded Executor | *executor cautus* | Everything Level 3 can. Execute live orders within **strict per-trade, per-day, and per-asset capital limits** defined in its mandate. Every order requires CUSTOS pass. Every fill writes a CHRONO entry. | yes, limited |
| **5** | Governed Operator | *operator gubernatus* | Everything Level 4 can. Operate multi-trade strategies. Open and close positions across multiple assets within an approved strategy mandate. Cannot spawn child agents above its own level. | yes, scoped |
| **6** | Restricted Sovereign | *agens sovranus restrictus* | Everything Level 5 can. Coordinate multiple sibling agents. Re-allocate capital between strategies within a strategy book. **Still subject to operator override at all times.** | yes, broad |

Level 6 is the ceiling. No higher level exists. There is **no autonomous Level 7**. The Charter is explicit on this (§ 14.4): "Human trader authority remains central." A Level 6 agent has the widest mandate the system permits — it does not have unlimited authority because nothing in the system has unlimited authority.

---

## 2. The VOXIS authority block

Every PARRALAX agent is a VOXIS (Paper IV). Its doctrine block must carry an authority section, frozen at construction time, that any execution path reads before producing an order.

The schema:

```
VoxisAuthority {
  level:               u8           // 0..6, monotonic at construction
  mandateId:           string       // ULID of the operator-signed mandate
  capabilities:        Capability[] // explicit allow-list, never deny-list
  walletScope:         WalletScope  // see § 3
  capitalLimitsUSD:    {
    perOrderMax:       decimal
    perDayMax:         decimal
    perAssetMax:       decimal
    aggregateMax:      decimal
  }
  positionLimits: {
    maxConcurrentOpen: u32
    maxLeverage:       decimal      // 1.0 means no leverage
  }
  riskTier:            'STRICT' | 'STANDARD' | 'WIDE'   // see RISK_CHARTER
  killSwitchGroup:     string       // which kill switch trips this agent
  audit: {
    chronoChainId:     string       // every action writes here
    parentVoxisId:     string|null  // null only for root agents
  }
  promotion: {
    issuedAt:          iso8601
    issuedBy:          PrincipalId  // human operator or council
    expiresAt:         iso8601|null // mandates may auto-expire
    revocableBy:       PrincipalId[]
  }
  signature:           Signature    // operator-signed; verified each beat
}
```

**The doctrine rule** (Paper IV applied here): every agent reads `VoxisAuthority` first on every heartbeat, before any sensory input is processed. If the authority block fails signature verification — if a single byte was mutated by anything since construction — the agent halts and writes a `voxis_doctrine_violation` CHRONO entry. No exception.

This is identical in shape to how the journal's CUSTOS verifies every paper's frontmatter before any agent reads its body. The same fail-closed pattern, applied to capital.

---

## 3. Capabilities and wallet allow-lists

Authority is enforced in two layers: **capabilities** (what kind of action is allowed at all) and **wallet allow-lists** (which addresses, accounts, and venues the agent can touch).

### 3.1 Capabilities — the action allow-list

A `Capability` is a fully-qualified verb-object pair. Authority is checked by exact match. There is no wildcard. There is no inheritance of capabilities except through the level grants below.

```
Capability ::= 'market:read'
             | 'market:read.l2'              // order book depth
             | 'memory:write.self'           // own memory only
             | 'signal:emit'
             | 'recommendation:emit'
             | 'paper:order.place'
             | 'paper:order.cancel'
             | 'proposal:submit'
             | 'order:place.live'
             | 'order:cancel.live'
             | 'order:modify.live'
             | 'position:close.live'
             | 'strategy:activate'
             | 'strategy:deactivate'
             | 'capital:reallocate'
             | 'child:spawn'                 // can create child agents
             | 'kill:trip'                   // can trip a kill switch
             // NO 'kill:reset'   — that capability does not exist for agents
             // NO 'level:raise'  — that capability does not exist at all
             // NO 'mandate:edit' — that capability does not exist at all
```

The omissions are intentional. **No agent capability can raise its own level, edit its own mandate, or reset a kill switch.** These are operator-only or council-only actions, and they exist outside the `Capability` enumeration entirely.

### 3.2 Default capability grants per level

| Level | Capabilities granted |
|:---:|:---|
| 0 | `market:read`, `memory:write.self` |
| 1 | + `market:read.l2`, `signal:emit`, `recommendation:emit` |
| 2 | + `paper:order.place`, `paper:order.cancel` |
| 3 | + `proposal:submit` |
| 4 | + `order:place.live`, `order:cancel.live`, `position:close.live`, `kill:trip` |
| 5 | + `order:modify.live`, `strategy:activate`, `strategy:deactivate` |
| 6 | + `capital:reallocate`, `child:spawn` |

Capabilities are **monotonically additive** by default — a Level 4 grant includes every capability granted at Level 3 and below. The operator may further restrict by listing fewer than the default set, but **may not extend beyond the level's ceiling** without first writing a new mandate at a higher level.

### 3.3 The wallet scope

```
WalletScope {
  fiatAccounts:   { id, broker, currency, role: 'read'|'trade' }[]
  cryptoWallets:  { address, chain, role: 'read'|'sign-limited'|'sign-broad' }[]
  exchangeKeys:   { exchange, keyAlias, scope: 'read'|'trade'|'withdraw' }[]
  internalUnits:  { tokenId, role: 'read'|'transfer'|'mint' }[]
}
```

Every PARRALAX wallet credential is registered with a **scope**, not a capability. The mapping is intentionally strict:

- `read` — agent can query balances and positions; cannot place orders or move funds.
- `sign-limited` — agent can sign **up to** the configured per-order limit. Above the limit, signature is refused at the credential layer, not the strategy layer.
- `sign-broad` — agent can sign within its capital limits (§ 2).
- `trade` — exchange API key has trade-but-not-withdraw scope. **Withdraw is never granted to an agent.** Withdraw is operator-only, always.

**Withdraw scope** appears in the enumeration only for completeness. **No PARRALAX agent at any level may hold a credential with withdraw scope.** Withdraw is a human action with a hardware signer. This rule has no exceptions and no override.

### 3.4 Default wallet scope per level

| Level | Wallet scope |
|:---:|:---|
| 0 | read-only across the agent's assigned market universe |
| 1 | same as Level 0 |
| 2 | read-only on live wallets; write on the internal paper venue only |
| 3 | same as Level 2 |
| 4 | `sign-limited` on assigned wallets (the limit equals `capitalLimitsUSD.perOrderMax`); `trade` scope on assigned exchange keys |
| 5 | `sign-limited` with a larger limit; `trade` scope on a broader set of exchange keys |
| 6 | `sign-broad` on assigned wallets; `trade` scope on its strategy book's exchange keys |

**Never granted at any level:** `withdraw` scope, `read` scope on unassigned markets, `sign-*` scope on wallets outside the agent's mandate.

---

## 4. Promotion — the only path upward

Promotion is the **only** way an agent's level rises. It is an explicit operator-or-council action that writes a CHRONO entry. There is no implicit promotion. There is no automatic promotion. Performance does not raise authority. Performance qualifies an agent for a promotion the operator may then issue.

### 4.1 The promotion ladder

Promotion is one level at a time. **An agent can never skip a level.** A Level 0 agent must serve as Level 1 before it can serve as Level 2.

```
0 → 1   automatic, time-bounded, advisory       (operator may demote)
1 → 2   operator sign-off
2 → 3   operator sign-off + simulation track record (see SIMULATION_PROMOTION_PROTOCOL)
3 → 4   council vote (3-of-5 minimum; see § 7)
4 → 5   council vote + ≥ 30 trading days at Level 4 with no CUSTOS gate violations
5 → 6   council vote + ≥ 60 trading days at Level 5 + operator hardware-signer ceremony
```

Each promotion writes a CHRONO entry of shape:

```
PromotionReceipt {
  voxisId:            string
  fromLevel:          u8
  toLevel:            u8
  issuedAt:           iso8601
  issuedBy:           PrincipalId           // operator key or council vote id
  evidence:           PromotionEvidence[]   // simulation receipts, gate-passes, etc.
  newMandateHash:     sha256                // the mandate this promotion attaches to
  signature:          Signature             // operator or council
  chronoLink:         string                // hash of the prior CHRONO entry
}
```

The receipt is irrevocable as a *record*. The promotion it records can be reversed — but only by a separate demotion receipt; the original receipt stays.

### 4.2 Time-bounded mandates

Every mandate above Level 2 may carry an `expiresAt`. When the mandate expires, the agent reverts to Level 0 until a new mandate is signed. **An expired mandate is treated identically to a missing mandate** — no live orders, no signals, no nothing. This forces periodic re-affirmation of high-authority agents.

Default expiry recommendations (operator may override per agent):

```
Level 3   90 days
Level 4   60 days
Level 5   30 days
Level 6   14 days
```

Expiry is a feature, not a bug. The shorter the leash, the safer the system.

---

## 5. Demotion — the only path downward

Unlike promotion, demotion can happen automatically. Many things trigger it. The full list:

| Trigger | Demotes by | Receipt class |
|:---|:---:|:---|
| CUSTOS gate violation (any) | 1 level | `gate_violation_demotion` |
| Kill switch trip in this agent's group | to Level 0 | `kill_switch_demotion` |
| `voxis_doctrine_violation` (mandate signature invalid) | to Level 0 | `doctrine_violation_demotion` |
| Strategy-drift detector flag (3 consecutive cycles) | 1 level | `drift_demotion` |
| Mandate expiry | to Level 0 | `mandate_expiry_demotion` |
| Operator-issued demotion | as specified | `operator_demotion` |
| Council-issued demotion | as specified | `council_demotion` |
| Parent VOXIS demoted | child cannot exceed parent | `cascade_demotion` |

Demotion writes a receipt of the same shape as `PromotionReceipt` but with `toLevel < fromLevel`. The agent re-reads its mandate before its next heartbeat and operates at the new level.

**Demotion can never be silenced.** The receipt is mandatory. An attempt to suppress one is itself a `doctrine_violation` and triggers further demotion.

---

## 6. The council — who can promote, who can demote

Per Charter § 15.3, governance rights may be held by various structures. For PARRALAX, the operative shape is a **council of named principals**, each with a signing key. The council is its own VOXIS (a Level-6-equivalent meta-agent) but it is composed of operator-controlled keys, not autonomous agents.

```
Council {
  members: Principal[]              // human-controlled signing keys
  quorum: {
    promote_to_3: 'operator_alone'
    promote_to_4: '3_of_5'
    promote_to_5: '3_of_5'
    promote_to_6: 'operator_alone'  // intentionally restrictive; broadest authority needs founder
    demote:       'any_one'         // demotion is always easier than promotion
    issue_kill:   'any_one'         // see KILL_SWITCH_DOCTRINE
    reset_kill:   '3_of_5'          // see KILL_SWITCH_DOCTRINE
  }
}
```

The asymmetry is intentional and aligns with the Charter § 16 risk principle: **stopping must be easy; starting must be hard.** Any one council member can demote any agent or trip a kill switch. Reversing either requires multiple members.

The journal's `ARCHON` agent (the integrity council member from Paper XXIII) is the one that *validates* council votes against the doctrine — it does not vote. ARCHON is not a member; ARCHON is the rule-checker.

---

## 7. Inheritance — parent / child VOXIS

A Level 6 agent may spawn child agents (capability `child:spawn`). The rules:

1. **A child's level is bounded by the parent's level minus one.** A Level 6 parent may spawn Level 5 children. A Level 5 parent may spawn Level 4 children. A Level 0 cannot spawn at all.
2. **A child's mandate is a strict subset of the parent's mandate.** Capabilities are intersected. Wallet scope is intersected. Capital limits are *summed across children but bounded by the parent's limit* — children cannot in aggregate exceed parent capacity.
3. **The parent is responsible for its children.** If a child violates a CUSTOS gate, the parent's drift counter increases. If three children violate in a window, the parent is demoted.
4. **The audit chain is a tree.** Each child's `audit.parentVoxisId` points to the spawner. Demotion cascades down the tree. Promotion does not cascade — each agent earns its own level.
5. **A child cannot outlive its parent.** Parent demotion to Level 0 demotes all live descendants to Level 0 in the same CHRONO transaction.

This is the same VOXIS-fractal pattern from Paper IV: every unit at every scale carries the same five components identically, including the authority block, including the audit chain. Predictability across scales is a feature, not a constraint.

---

## 8. The COGNOVEX governance filter — where this is enforced

Per Paper IX (`COHORS MENTIS`), every COGNOVEX unit operates through five layers per heartbeat: **sovereignty · sensory · belief · action · governance filter**.

The Authority Charter is the operational specification of **Layer 5 — Governance Filter** for PARRALAX agents.

Every candidate action produced by Layer 4 (Action Selection) is passed to Layer 5, which:

1. Re-reads the `VoxisAuthority` block (signature verified).
2. Maps the action to its required `Capability`.
3. Asserts capability ∈ `capabilities`.
4. Asserts the action's resource (wallet, account, exchange key) ∈ `walletScope`.
5. Asserts the action's projected capital impact ≤ all `capitalLimitsUSD`.
6. Defers to CUSTOS (the risk gates — see `RISK_CHARTER.md`).
7. If all pass: emits the action, writes an `action_authorised` CHRONO entry.
8. If any fail: drops the action, writes a `gate_violation` CHRONO entry, increments drift counter.

The filter is the wall between intent and execution. No PARRALAX agent can bypass it because no other code path produces an order. The filter is the *only* output channel.

---

## 9. What this charter explicitly forbids

These are non-negotiable. There is no flag, no override, no operator-key, no council vote that permits them.

| Forbidden | Reason |
|---|---|
| Agent withdrawal of funds from any account | Withdrawal is a human action with a hardware signer. Always. |
| Self-promotion via any code path | Authority is doctrine-block-frozen; only operator/council promotion writes a new mandate. |
| Mandate self-editing | The mandate is signed and immutable; an agent that needs new authority gets a new mandate. |
| Capability not in the enumerated set | Wildcards do not exist. Inheritance does not extend beyond level grants. |
| Reset of a tripped kill switch by an agent | Reset requires a 3-of-5 council vote with hardware-signer ceremony. |
| Real P&L aggregation with simulated P&L | The two domains are quarantined; mixing them is a `doctrine_violation`. |
| Starting an agent above Level 0 on first construction | All agents are born at Level 0. They are promoted, never instantiated, into higher levels. |
| Granting a child agent a higher level than its parent | Inheritance bound is strict. |
| Operating with a missing or expired mandate | Treated identically; agent reverts to Level 0. |
| Continuing to act after a `voxis_doctrine_violation` | The agent must halt at the violation; only operator restart proceeds. |

---

## 10. Reading lock-in

Three doctrinal claims this charter makes that the implementation must honour:

1. **Authority is a doctrine block field, not a database flag.** It is read on every heartbeat, signature-verified, and an invalid signature halts the agent. This is the Paper IV pattern.
2. **Authority is monotonic at construction.** An agent is born at Level 0 and rises only through explicit promotion receipts. There is no "instantiate at Level 4" shortcut.
3. **Authority asymmetry favours stopping.** Any one council member can demote or trip a kill switch. Multiple members are required to promote or reset. This aligns with Charter § 16's risk principle.

If the implementation contradicts any of these three, it has wandered from the doctrine, and the charter — not the code — is correct.

---

## 11. Open decisions (operator-only)

These cannot be resolved by the agent. They shape the implementation but live outside it.

1. **Council composition.** Who are the 5 (or 3, or 7) principals? Their keys are the system's root of trust above Level 4.
2. **Default mandate durations.** The defaults in § 4.2 are recommendations. Operator may override per agent.
3. **Per-level capital ceilings (USD).** § 2 specifies the schema; operator must specify the numbers per asset class.
4. **Whether Level 6 is enabled at all on day one.** Many operators run Level 5 only for the first year. PARRALAX permits Level 6 but does not require it. Recommendation: do not authorise Level 6 in the first 90 days of live operation.

---

## 12. Cross-references

- **Charter** [§ 14.4 Trader Authority](./CHARTER.md), [§ 15 Governance](./CHARTER.md), [§ 18 AI Governance and Agent Authority](./CHARTER.md)
- **Sibling docs (to be drafted):** [`RISK_CHARTER.md`](./RISK_CHARTER.md) (Layer 5 calls CUSTOS, which is specified there) · [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) (`kill:trip` capability defined here, kill semantics there) · `SIMULATION_PROMOTION_PROTOCOL.md` (`promote_to_3` gate defined there)
- **Existing doctrine inherited from the corpus:**
  - Paper IV (`DOCTRINA VOXIS`) — the five-component VOXIS, the doctrine-first-on-every-beat rule
  - Paper IX (`COHORS MENTIS`) — the five-layer COGNOVEX stack, governance filter at Layer 5
  - Paper XXIII (`ORO GOVERNANCE INTELLIGENCE`) — the agent council pattern and ARCHON as integrity-checker
  - PROTOCOL-V (`AGENT COUNCIL`) — parallel invocation, council status derivation, finding lifecycle

---

*No agent wakes up at a higher level than it slept at unless a council wrote a receipt.*
