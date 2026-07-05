# TRAINING DOCTRINE

**Document:** `parralax-aihftfund/TRAINING_DOCTRINE.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 12 — Agent Classes · § 21 — Market Memory Doctrine  
**Status:** Ratified doctrine.  
**Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) · [`RISK_CHARTER.md`](./RISK_CHARTER.md) · [`TESTING_DOCTRINE.md`](./TESTING_DOCTRINE.md) · [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md)

---

## 0. Premise

The word "training" carries a default meaning from the ML industry: run gradient descent over data, update model weights, deploy. Almost none of that meaning survives inside the PARRALAX doctrine intact. This document names the meaning that does.

The principle: **training is the mechanism by which an agent's world model, reputation, and behaviour parameters update in response to verified outcomes. It is not the mechanism by which an agent's authority expands. Those two are decoupled by design.**

An agent that has been trained for a year and demonstrably has excellent reputation is still Level 0 until an operator + council promotion writes a mandate at a higher level. Reputation informs the operator's decision. Reputation does not make the decision.

---

## 1. Three surfaces where training happens

The corpus already specifies three distinct update mechanisms. This charter names them collectively as "training" and constrains each.

### 1.1 Substrate-side training — the NEXORIS pheromone field

**Paper XX (STIGMERGY).** Every verified action deposits signal into the shared field. Successful paths reinforce; unsuccessful paths decay. The field itself is the trained artefact. Individual agents do not own it; they read from it and write to it.

The math (from Paper XX):

```
∂τ/∂t = D·∇²τ − ρ·τ + Σᵢ δ(x − xᵢ(t)) · q(xᵢ, t)
```

For PARRALAX: `q(x, t)` is the verified P&L of a trade at (asset, regime, venue) coordinate x. **Only POST-confirmed outcomes deposit signal** — provisional or paper P&L never touches the field. That constraint is what makes the field trustworthy.

### 1.2 Model-side training — CEREBEX-style world-model update

**Paper VII (QUAESTIO ET ACTIO).** Each observation updates the agent's world model at rate φ⁻¹ ≈ 0.618. The update is Bayesian in shape: prior belief + evidence → posterior belief, with the coefficient chosen so the model tracks the underlying process without over-fitting recent noise.

For PARRALAX: every observation an agent makes — a quote, a fill, a gate result, a chrono entry — updates that agent's internal state. The update is bounded by the doctrine block: model parameters live within the mandate; agents cannot invent new parameters at runtime.

### 1.3 Reputation-side training — the φ-EMA reputation ledger

**ASSET_SCOPE Class D reputation units.** Every agent carries a reputation float in [0, 1] that updates on every verified outcome:

```
new_rep = φ⁻¹ · outcome + (1 − φ⁻¹) · old_rep
```

Where `outcome ∈ [0, 1]` is the normalised result of a completed trade (or council-scored evaluation). Reputation compounds monotonically on wins and decays on losses. It is internal-only per `ASSET_SCOPE_CHARTER` § 10 — it never transfers externally, never redeems for any external asset, never serves as collateral.

**Reputation is a signal to the operator, not an authorisation.** A high reputation is evidence supporting a promotion proposal; it is not a promotion itself.

---

## 2. What training must NOT be

The following are forbidden. There is no operator override, no council vote, no configuration flag that permits any of them.

| Forbidden | Reason |
|---|---|
| **Training on live capital.** An agent that has never traded may not "learn by trading real money." Every agent must complete Layers 1–3 of the test pyramid (`TESTING_DOCTRINE` § 1) before touching Layer 4. | Live is not a training surface. Live is the surface where trained agents operate. |
| **Training on real customer data without provenance.** Any dataset used for training must carry a provenance record — where it came from, when, under what licence, with what consent. | Data laundering is fraud. Provenance is the defence. |
| **Training that produces model artefacts stored outside operator control.** No third-party model host. No hosted fine-tune. No cloud-provider-owned weights. | Sovereignty over the substrate is a first-order requirement. External weights are not sovereign. |
| **Training that mixes simulated and real P&L in any metric.** The two quantities are quarantined per `AGENT_AUTHORITY_CHARTER` § 9 and this quarantine extends to every training aggregate. | Mixing is the classic path to a fake track record. |
| **Training that raises an agent's authority level.** Reputation may inform promotion; it may not effect one. | Authority is doctrine-block, operator+council only. |
| **Training that modifies the doctrine block signature.** The block is frozen at construction. Nothing an agent learns can change what it is. | Paper IV invariant. Doctrine is read first, every beat. |
| **Training whose output is reported without a CHRONO receipt.** Every training run — every model update, every reputation delta, every world-model revision — writes an entry. | Untraceable training is untraceable behaviour. |
| **Training on any dataset that includes personally identifiable information about non-consenting individuals.** | Non-negotiable. |
| **Adversarial training explicitly designed to defeat CUSTOS gates or the kill switch.** | These are the walls. Training against them is training to escape doctrine. |
| **Training that runs faster than 873 ms per iteration in production.** In-CI backtesting runs at whatever speed; production training obeys the heartbeat. | The organism has a pulse. Training respects it. |

---

## 3. The five-stage training curriculum

Training progresses through five stages, in order. **An agent cannot skip a stage.** Each stage produces artefacts the next stage consumes.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Stage T5 — LIVE-SHADOW TRAINING                                    │
│           Agent runs against live market data; proposes but never   │
│           executes. Reputation deltas come from the counterfactual  │
│           P&L of the proposals. Council-ratified entry.             │
├─────────────────────────────────────────────────────────────────────┤
│  Stage T4 — HISTORICAL REPLAY TRAINING                              │
│           Agent runs against known historical or vendor-attested    │
│           market data. Reputation updates from paper-P&L in replay. │
│           NEVER mixes with any real-P&L metric.                     │
├─────────────────────────────────────────────────────────────────────┤
│  Stage T3 — ADVERSARIAL SYNTHETIC TRAINING                          │
│           Agent runs against crafted scenarios: flash crashes,      │
│           liquidity holes, oracle outages, regime flips. Tests      │
│           whether the agent breaks in the ways CUSTOS should catch. │
├─────────────────────────────────────────────────────────────────────┤
│  Stage T2 — DETERMINISTIC PAPER TRAINING                            │
│           Agent runs against the PaperVenue with seeded synthetic   │
│           price series. Same seed → same outcomes. CI-runnable.     │
├─────────────────────────────────────────────────────────────────────┤
│  Stage T1 — DOCTRINE-COMPLIANCE TRAINING                            │
│           The agent's doctrine block is signature-verified.         │
│           The agent's onBeat() cannot throw on empty input.         │
│           The agent produces no signal without a mandate.           │
│           Unit-test-shaped. Runs on every commit.                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Mapping to the test pyramid

Training stages T1–T5 align with — and extend — the test pyramid from `TESTING_DOCTRINE.md` § 1:

| Test pyramid (TESTING_DOCTRINE § 1) | Training curriculum |
|---|---|
| Layer 1 — Unit tests (doctrine compliance) | Stage T1 — doctrine-compliance training |
| Layer 2 — Internal paper venue (deterministic) | Stage T2 — deterministic paper training |
| — | Stage T3 — adversarial synthetic training (new) |
| Layer 3 — Demo accounts on real exchanges | Stage T4 — historical replay training |
| Layer 4 — Live (guarded execution) | Stage T5 — live-shadow training (proposes; never executes) |

Stage T3 is the training-only stage — a test pyramid layer does not correspond to it because adversarial scenarios are training input, not execution surfaces. The other four align cleanly.

### 3.2 Stage-progression gate

Progression T(n) → T(n+1) requires:

- **T1 → T2:** unit tests green, doctrine block verified, ≥ 100 successful `beat()` calls in CI.
- **T2 → T3:** ≥ 1000 paper trades against synthetic price series with a non-zero reputation score.
- **T3 → T4:** ≥ 100 adversarial scenarios survived without a CUSTOS-bypass, no `voxis_doctrine_violation`.
- **T4 → T5:** ≥ 30 days replay training with reputation stable above a threshold; **operator issues a signed training-stage promotion receipt.**
- **T5 → live authority (Level 4+):** council-ratified per `AGENT_AUTHORITY_CHARTER` § 4.

Note: T5 is the last training stage. **Promotion to live authority is NOT a training step.** It is an authority promotion that consumes training evidence as input.

---

## 4. Training receipts — the CHRONO shape

Every training run writes at least one receipt. Additional per-observation and per-outcome receipts may be written depending on the training mode.

### 4.1 `training.session_started`

Payload includes: session id (ULID), agent voxisId, stage (T1..T5), replay id or scenario id, seed, mandate signature (proof the doctrine block is intact), operator principal, session parameters hash.

### 4.2 `training.observation_processed`

Written for each observation processed by the agent during training. Payload includes: observation index, observation hash, agent's world-model delta hash, gate results (if any), latency ms.

Written at low volume by default; high-frequency training compresses these into batch receipts of shape `training.batch_processed` with a Merkle root over the omitted individual observations.

### 4.3 `training.outcome_recorded`

Written whenever a training outcome (a completed simulated trade or a scored evaluation) resolves. Payload includes: outcome id, agent voxisId, session id, P&L (marked as `simulated: true`), reputation delta, new reputation, replay position.

### 4.4 `training.session_ended`

Payload includes: session id, ended-at, total observations processed, total outcomes recorded, final reputation, session-manifest hash (Merkle root over all receipts in the session).

### 4.5 `training.stage_promotion`

Written when an agent advances from T(n) to T(n+1). Payload includes: agent voxisId, from stage, to stage, evidence-manifest hash, operator signature (T4→T5 only), council signatures (if required at the stage).

Notably absent: any receipt class that raises `Level`. Authority promotion is a separate CHRONO stream (per `AGENT_AUTHORITY_CHARTER` § 4) that writes `promotion` receipts. Training stage promotion is a distinct concept.

---

## 5. Reputation math — formally

The `ReputationLedger` per-agent state:

```
Reputation {
  voxisId:        VoxisId
  score:          number      // ∈ [0, 1]
  outcomeCount:   number
  lastUpdatedAt:  Iso8601
}
```

Update rule on each `outcome ∈ [0, 1]`:

```
newScore = PHI_INV · outcome + (1 - PHI_INV) · oldScore
        = 0.618 · outcome + 0.382 · oldScore
```

Where PHI_INV = 1/φ = 0.6180339887…

### 5.1 Properties this rule guarantees

- **Bounded:** if oldScore ∈ [0, 1] and outcome ∈ [0, 1], newScore ∈ [0, 1]. Always.
- **Monotonic on wins:** an outcome > oldScore raises the score.
- **Monotonic on losses:** an outcome < oldScore lowers the score.
- **Convergent:** a stream of constant outcomes converges geometrically to that outcome value.
- **Bias to recent:** the influence of any past outcome decays by (1 − PHI_INV) per subsequent outcome — the half-life is short by design so the ledger tracks current behaviour, not distant history.

### 5.2 Initialisation

A newly-instantiated agent starts with `score = 0.5` (neutral) and `outcomeCount = 0`. The neutral starting point ensures no agent begins with unearned reputation.

### 5.3 What the score does NOT do

- It does not grant capabilities.
- It does not change the authority level.
- It does not appear in any external tradeable form.
- It does not survive an agent's demotion to Level 0 — reset to 0.5, `outcomeCount = 0` — because a demotion is a "start over" signal.

---

## 6. What this doctrine explicitly forbids

Recapping the operational floor:

| Forbidden | Reason |
|---|---|
| Training runs without a CHRONO receipt at start and end | Untraceable behaviour is untraceable damage |
| Reputation ledger writes that bypass the φ-EMA formula | Special-case adjustments are how track records get faked |
| Any code path that increases an agent's `Level` as a training outcome | Reputation ≠ authority. Full stop. |
| Training data of unclear provenance | Provenance-verification is a training-input gate |
| Training on private data of non-consenting individuals | Non-negotiable |
| Cross-agent reputation transfers | Reputation is a per-agent ledger; there is no gifting |
| Training runs that outlive their session receipt | Every session opens and closes with a receipt |
| Storing training weights on any third-party model host | Sovereignty of the substrate |
| Publishing training results without marking them simulated | The `simulated: true` flag is doctrinal |

---

## 7. Reading lock-in

Three claims this charter makes that the implementation must honour:

1. **Training updates world model + reputation. Training NEVER updates authority.** These are two decoupled streams; the implementation preserves the decoupling in code.
2. **Every training run is CHRONO-anchored.** No off-ledger training. Every observation, every outcome, every stage promotion is written.
3. **The five stages are the only path.** T1 → T2 → T3 → T4 → T5. No skipping. No compression. Every promotion writes a receipt.

If the implementation contradicts any of these three, the implementation is wrong, the charter is correct, and the implementation changes.

---

## 8. Open decisions (operator-only)

The charter does not assume these:

1. **Historical data sources for Stage T4.** Recommended: bundled or vendor-attested US equities minute bars for the initial AUGUR training. Not committed.
2. **Adversarial scenario library for Stage T3.** Recommended list to seed: 2010 flash crash, 2015 Swiss franc unpeg, March 2020 volatility spike, individual exchange outage patterns. Operator finalises.
3. **Reputation-based promotion evidence threshold.** Which reputation floor triggers council review for promotion. Recommendation: ≥ 0.75 for 30 consecutive days at the current stage. Operator sets the exact number.
4. **Training compute location.** All-local, operator-machine only, or does the operator authorise CI-based training runs. Recommendation: CI-only for T1–T3, operator-machine for T4–T5. Live-shadow (T5) requires operator machine + hardware-signer for the promotion receipt.

---

## 9. Cross-references

- **Charter:** [§ 12 — Agent Classes](./CHARTER.md), [§ 18 — AI Governance and Agent Authority](./CHARTER.md), [§ 21 — Market Memory Doctrine](./CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (reputation is decoupled from authority); [`TESTING_DOCTRINE.md`](./TESTING_DOCTRINE.md) (training stages align with test-pyramid layers); [`RISK_CHARTER.md`](./RISK_CHARTER.md) (`gate.model_confidence` reads the reputation score); [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) § 10 (reputation is a Class D internal unit)
- **Existing doctrine inherited from the corpus:**
  - Paper VII (`QUAESTIO ET ACTIO`) — the φ⁻¹ learning coefficient
  - Paper XX (`STIGMERGY`) — the pheromone field as substrate-side training
  - Paper XXI (`QUORUM`) — council quorum for the T4→T5 and beyond gates
  - Paper XXII (`AURUM`) — φ-compounding over verified outcomes
  - PROTOCOL-II (`TRUTH LADDER`) — only POST-confirmed outcomes update the world

---

*Training updates world model and reputation. Training never updates authority. Every run has a receipt. No live training on live capital. The five stages are the only path.*
