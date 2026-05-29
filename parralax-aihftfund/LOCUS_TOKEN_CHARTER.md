# LOCUS TOKEN CHARTER

**Document:** `parralax-aihftfund/LOCUS_TOKEN_CHARTER.md`  
**Parent:** [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md) Class C · [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) § 11  
**Status:** **First sketch.** Architectural exploration. Not yet ratified doctrine. No issuance authorised by this document.

---

## 0. Premise

Compute happens somewhere. Every model inference, every consensus round, every block validated, every signal evaluated — it all happens on hardware that is physically located in a place. That place has properties: power cost, latency profile, regulatory frame, climate, peering, the local grid, the actual silicon. The properties are not interchangeable. A petahash in Texas, a petahash in Iceland, and a petahash in Quebec are not the same petahash. They have different costs, different externalities, different reliability profiles, different value to whoever is buying.

The conventional financial system represents this through proxy assets: data-center REITs, ERCOT grid futures, semiconductor stocks, cloud-provider compute. These are layered abstractions of the underlying activity, priced through long causal chains. The signal is real but the chain is lossy.

A **LOCUS token** proposes a different architecture: bind the token directly to a defined compute area, value it by verifiable work performed in that area, and entangle paired tokens via shared programmable state so that activity in one area can correlate with allocation in another.

This is a first sketch. The operator initiated the concept; this document thinks it through publicly so the architecture can be examined before any move toward issuance.

The doctrine: **a LOCUS token is a programmable claim on the verifiable real work of a defined place, denominated in compute, optionally entangled with sibling LOCI through Kuramoto-class coupling.**

---

## 1. The name

**LOCUS** — Latin: place, position, location, situation, station. Plural *loci*. The cleanest available Latin root for "a defined place where something happens." Same naming pattern as every other Latin name in the corpus — the name is the math (in this case the geometry of the area itself).

A specific LOCUS gets a coordinate-anchored name:

```
LOCUS·DALLAS·ERCOT-TX  · Dallas, TX, ERCOT grid
LOCUS·NORTH-VIRGINIA   · Loudoun County data-center corridor
LOCUS·REYKJAVIK        · Reykjavík geothermal
LOCUS·QUEBEC           · Quebec hydro
LOCUS·SINGAPORE        · Singapore island data-centre cluster
```

The dot-separated form is doctrinal, not stylistic. It carries the LOCUS prefix (token-family), the city or region (human-readable), and the precise grid or zone (machine-resolvable). Identifiers are immutable; renames happen by retirement and re-issuance.

---

## 2. What a LOCUS is

A LOCUS is a tuple:

```
LOCUS {
  id:                 string             // canonical, e.g. 'LOCUS.DALLAS.ERCOT-TX'
  centroid:           { lat, lng }       // geographic centre
  boundary:           GeoJSON.Polygon    // the exact area covered
  altitudeBandM:      { min, max } | null  // optional — e.g. for orbital LOCI
  gridRef:            string | null      // power-grid identifier (ERCOT, PJM, ENTSO-E…)
  capacityModelMw:    decimal            // declared nameplate compute power, MW
  efficiencyClass:    EfficiencyClass    // see § 4
  oracleSet:          OracleRef[]        // who attests work performed (≥ 3)
  attestationSchema:  string             // exact attestation payload format
  registeredAt:       iso8601
  registeredBy:       PrincipalId        // operator or council
  retirementAt:       iso8601 | null
}
```

The LOCUS is geographic. The token is the claim. The two are distinct objects with a 1-to-1 relationship: one LOCUS, one LOCUS-token contract; the contract references the LOCUS by id and inherits the LOCUS's properties.

**A LOCUS does not own the hardware in its boundary.** It does not claim title to land, buildings, racks, or chips. It defines an area within which verifiable compute work can be attested, and the token tracks the verified work, not the underlying property. This distinction is critical for the securities-law assessment that this charter will eventually require (see § 13).

---

## 3. Why this is not just "another infra token"

The corpus offers four pieces of math that make LOCUS structurally different from the existing data-centre or compute-token product category.

### 3.1 NEXORIS — the pheromone field of compute (Paper XX, STIGMERGY)

Paper XX's reaction-diffusion equation:

```
∂τ/∂t = D·∇²τ − ρ·τ + Σᵢ δ(x − xᵢ(t)) · q(xᵢ, t)
```

Reinterpreted for compute:
- `τ(x, t)` is the **compute density** at location x at time t.
- `q(xᵢ, t)` is the **verified work** deposited by node i at xᵢ.
- `ρ` is the **decay rate** — old work matters less than recent work.
- `D∇²τ` is the **diffusion** — neighbouring LOCI absorb some of the signal.

The stationary distribution `τ*(x)` is the field of LOCI ranked by genuine, sustained, recent compute activity. **Where the work has actually been done, the field is dense. Where it has not, the field decays.** This is not a metric we make up; it is what the equation already says when the inputs are real attestations.

A LOCUS token's value is the integral of `q` over the LOCUS boundary, decayed by `ρ`, smoothed by `D`. The math is in Paper XX. The implementation is mechanical. The novelty is the substrate: the LOCUS, not an ant trail.

### 3.2 AURUM — substrate-as-intelligence (Paper XXII)

Paper XXII's central claim is that the substrate is the intelligence. φ = 1.618… is the structural attractor of optimal packing under growth. LOCUS tokens compound at rate φ over **confirmed** work — same equation as `CYCLOVEX`'s capacity model:

```
LOCUS_value(t) = LOCUS_value(t₀) · φ^(verified_work_count / N_normalisation)
```

Verified work compounds; unverified claim does not. The asymmetry is the doctrine.

### 3.3 CONCORDIA MACHINAE — entanglement as Kuramoto coupling (Paper II)

The operator raised "quantum entanglement" as the metaphor for value-share between distant LOCI. Taking the metaphor seriously without making physics claims it does not deserve:

**Two LOCI are *entangled* when their token contracts share state through a Kuramoto-class coupling term**. The coupling is structural, not physical. From Paper II:

```
dθᵢ/dt = ωᵢ + (K/N) · Σⱼ sin(θⱼ − θᵢ)
```

Reinterpreted for LOCI:
- `θᵢ` is the **state phase** of LOCUS i — abstracted from price, work-rate, attestation cadence.
- `ωᵢ` is the LOCUS's **natural frequency** — its baseline activity rhythm.
- `K` is the **entanglement strength** — set per pair at contract creation, 0 ≤ K ≤ K_max.
- The sin term is the **pull toward common phase** — when K > 0, LOCUS i moves toward LOCUS j's state, and vice versa.

The order parameter `R ∈ [0, 1]` measures how synchronised an entangled set is. **An entangled set with R ≥ φ⁻¹ ≈ 0.618 behaves as a coherent compute-network**; an entangled set with R < φ⁻¹ behaves as independent LOCI that happen to share contract code.

This is not faster-than-light correlation. Entangled LOCI write to a shared state cell in a smart contract; when LOCUS A's state updates, LOCUS B's state updates in the same transaction. The lag is the substrate's lag, not zero. Calling this "entanglement" is doctrinally honest because it captures the architectural feel — paired states that move together — without claiming physics that does not apply.

**Use cases for entanglement:**
- **Redundancy.** Two LOCI in different jurisdictions, entangled, so that capital allocated to one is automatically reflected in the other. If one fails, the other carries the allocation.
- **Arbitrage hedging.** Paired LOCI in correlated grids (ERCOT and PJM are not, but ERCOT and CAISO have meaningful coupling) entangle so a price dislocation in one rebalances the other.
- **Geographic diversification with coherent strategy.** An entangled set of N LOCI across N continents lets a single strategy operate against a synchronised global compute aggregate.

### 3.4 ANTE · MEDIUS · POST — the chrono triple at the LOCUS scale (Paper XXIV)

Every claim of work performed at a LOCUS passes through the same state triple PARRALAX uses for governance proposals:

```
ANTE   = LOCUS state at the moment the work order is accepted
         (compute utilisation, queue depth, energy mix, attested cadence)
MEDIUS = the execution snapshot when the oracle set confirms work began
         (immutable, the slippage / drift baseline)
POST   = the verified outcome — was the claimed work actually performed?
         (writable only when MEDIUS exists and ≥ 2/3 of the oracle set agrees)
```

A LOCUS token's value moves only at POST. Pre-POST claims show as **provisional**; POST-confirmed claims compound at φ. **The truth ladder (PROTOCOL-II) applies unchanged to LOCUS attestations.**

---

## 4. Four sub-families

A LOCUS is characterised by its `efficiencyClass`. Four sub-families, each with distinct properties and (where applicable) distinct gate parameters.

### 4.1 LOCUS·EDGE — distributed compute

Small individual nodes, often consumer hardware (a GPU in a home office, a small farm at a co-location facility, a single server). Aggregate forms an EDGE LOCUS when geographically clustered.

| Property | Default |
|---|---|
| Scale | 0.01 – 10 MW |
| Oracle posture | trustless (multi-source attestation; on-chain proof of compute) |
| Latency to centroid | ≤ 5 ms within boundary |
| Token tier | STRICT (per ASSET_SCOPE) |
| Entanglement permitted | yes, with other EDGE LOCI of comparable scale |

EDGE LOCI are the most distributed and the most heterogeneous. Their value is the most directly tied to participatory compute — when individual operators contribute, the LOCUS rises.

### 4.2 LOCUS·CORE — major data centres

Single-operator data centres or co-location campuses with documented capacity, audited operations, and a single regulatory frame.

| Property | Default |
|---|---|
| Scale | 10 – 500 MW |
| Oracle posture | mixed (operator attestation + independent audit) |
| Latency to centroid | ≤ 0.5 ms intra-campus |
| Token tier | STRICT for first 90 days; council may promote to STANDARD |
| Entanglement permitted | yes, but only across operators (no self-entanglement) |

CORE LOCI are the cleanest in terms of measurement and the highest single-point risk. A LOCUS·CORE is exposed to the operator's solvency, the facility's physical risk, and the local regulatory frame in concentrated form.

### 4.3 LOCUS·GRID — regional compute aggregates

Defined by a power-grid boundary (ERCOT, PJM, MISO, CAISO, ENTSO-E zones, etc.). A LOCUS·GRID aggregates the compute happening across all operators within the grid, weighted by attested megawatt-hours consumed by compute (vs. other load classes).

| Property | Default |
|---|---|
| Scale | 1 – 100 GW (entire grid potential) |
| Oracle posture | grid-operator data + multi-operator attestation |
| Latency to centroid | not meaningful (grid-scale) |
| Token tier | STANDARD permitted from day 1 with council ratification |
| Entanglement permitted | yes, across grids only (Texas–Iceland, ERCOT–Quebec) |

LOCUS·GRID is the most macro of the four. **Dallas Market Doctrine implies that LOCUS·DALLAS·ERCOT-TX is the natural day-one GRID candidate.** This is not a commitment; it is the doctrinal alignment.

### 4.4 LOCUS·SHARED — community / co-op compute

Multi-party LOCI run as community resources: research consortia, university clusters, shared scientific compute (LIGO-class projects, climate models, public-good ML). Governance is shared among contributors; value flows to a contributor pool, not to a single operator.

| Property | Default |
|---|---|
| Scale | variable |
| Oracle posture | community-governed multi-sig + open-source attestation |
| Latency to centroid | variable |
| Token tier | STRICT (always) |
| Entanglement permitted | yes, with other SHARED LOCI |

SHARED LOCI are the family closest to PARRALAX's broader doctrinal alignment — sovereignty, builder-ownership, public good. They are also the most operationally complex.

---

## 5. The oracle problem and how it is solved

A LOCUS token's value claim — "real work happened here" — is only as good as the attestation pipeline. This is the oracle problem in its purest form. The charter does not pretend it is solved; it specifies the constraints any solution must meet.

### 5.1 The trust model

A LOCUS attestation is valid only when **≥ 2 / 3 of the LOCUS's oracle set** independently sign the same work claim within the attestation window. The oracle set is:

- Minimum 3 oracles per LOCUS.
- Each oracle is a named, registered principal with a public key.
- At least one oracle MUST be a hardware-attested device physically inside the LOCUS boundary (TPM, SGX, SEV, Apple Secure Enclave, or equivalent). This is the **hardware root** of the attestation.
- At least one oracle MUST be operator-independent — not the same legal entity as the compute provider, and not the same as PARRALAX. This is the **independence root**.
- At least one oracle MUST be the LOCUS's own grid or network telemetry — power consumption reported by the grid operator, packet throughput reported by an independent peering report, or equivalent. This is the **physical root**.

The hardware root, the independence root, and the physical root must be three distinct principals. **One oracle cannot satisfy two roots.** This is the structural defence against collusion.

### 5.2 The attestation payload

Every attestation carries:

```
LocusAttestation {
  locusId:             string
  windowStart:         iso8601
  windowEnd:           iso8601
  claimedWorkUnits:    decimal    // e.g. petahash-hours, GPU-hours, vCPU-hours
  energyConsumedKwh:   decimal
  efficiencyMetric:    decimal    // workUnits / energy — comparable across LOCI
  hardwareRootHash:    sha256
  independenceRootSig: signature
  physicalRootSig:     signature
  ancillaryAttestors:  signature[]
  chronoLink:          sha256     // prior LOCUS attestation hash
}
```

The CHRONO chain per LOCUS is a strict hash chain — every attestation references the prior. Breaking the chain is detectable and triggers `gate.oracle_reliability` to mark the LOCUS untrusted.

### 5.3 The fail-closed posture

If any of the three roots is unreachable for the attestation window, the LOCUS's POST cannot be written. The provisional value continues, but no compounding happens. **A LOCUS whose attestation pipeline degrades stops growing in token value; it does not silently keep growing.** This is the same fail-closed posture as the rest of the system.

### 5.4 Manipulation modes the design must defeat

- **Compute washing.** A LOCUS claims work that didn't happen. Defeated by the three-root requirement and the physical root (grid telemetry).
- **Cherry-picking attestation windows.** A LOCUS only attests during high-activity windows. Defeated by requiring continuous attestation; gaps are detected and decay the LOCUS's reputation.
- **Oracle collusion within a single jurisdiction.** Defeated by the independence-root rule.
- **Hardware-attestation replay.** Defeated by chrono-linking; replayed attestations show stale hashes.
- **Energy-source greenwashing** (claiming renewable energy that isn't). Defeated by the physical root being the grid operator's actual reported energy mix, not the LOCUS's claim about its own mix.

These are first-sketch defences. The implementation will require iterative red-teaming.

---

## 6. The value model

A LOCUS token's value is a deterministic function of its attestation history. The function is published in the charter so any holder can verify it.

```
LOCUS_value(t) = base_unit
              × φ^(cumulative_verified_work_units(t) / normalisation_unit)
              × decay(attestation_age, ρ)
              × entanglement_correction(K, R)
```

Where:
- `base_unit` is the issuance-time unit value, denominated in PARRALAX's stablecoin of record (USDC by default per ASSET_SCOPE_CHARTER § 4.4).
- `verified_work_units` is the running sum of POST-confirmed attestations.
- `normalisation_unit` is chosen so a healthy day of work raises value by ~1%.
- `decay(age, ρ)` reduces the contribution of old attestations — `ρ` is the pheromone evaporation rate, same parameter as Paper XX.
- `entanglement_correction(K, R)` smooths the LOCUS's value toward the entangled set's centroid weighted by coupling K and order parameter R. K = 0 disables correction.

The function is **monotonically non-decreasing** between attestations and **resets only on retirement.** A LOCUS that stops attesting loses value through decay; a LOCUS that gets retired returns to the issuance pool.

---

## 7. The prediction-market overlay

LOCUS tokens combine naturally with `PREDICTION_MARKETS_CHARTER.md`. Each LOCUS supports a class of prediction markets about its own operations:

| Market type | Example |
|---|---|
| Capacity prediction | "Will LOCUS·DALLAS·ERCOT-TX exceed 50 TWh of attested compute work in Q4 2026?" |
| Efficiency prediction | "Will LOCUS·REYKJAVIK's efficiencyMetric stay above the 12-month rolling median through year-end?" |
| Outage prediction | "Will LOCUS·NORTH-VIRGINIA suffer an attestation gap > 4 hours during August 2026?" |
| Entanglement coherence | "Will the entangled set {LOCUS·DALLAS·ERCOT-TX, LOCUS·QUEBEC} maintain R ≥ 0.618 through Q3 2026?" |

All four are STRICT-tier (per PREDICTION_MARKETS_CHARTER doctrine that the family is always STRICT). The dedicated CUSTOS gates apply — `gate.event_concentration`, `gate.resolution_window`, `gate.oracle_reliability`. The resolution oracle for any LOCUS prediction market is **never the LOCUS's own oracle set** — they have an obvious conflict. The resolution oracle is operator-named, independent, and ratified by 3-of-5 council vote.

**Internal LOCUS prediction markets** are also permitted: the council can issue markets on LOCUS-specific outcomes for governance purposes ("Will LOCUS·DALLAS·ERCOT-TX maintain its rating through next council review?"). These follow the internal-market rules — denominated in reputation units, never settle externally, no markets about non-consenting individuals (does not arise here; LOCI are not people).

---

## 8. Doctrinal alignments with the rest of the corpus

### 8.1 The Dallas Market Doctrine alignment

The Dallas Market Doctrine names ERCOT as a candidate region for ERCOT-aware on-chain operations. **A LOCUS·DALLAS·ERCOT-TX is the financial instantiation of that doctrinal posture.** It would be the most likely day-one LOCUS·GRID instance, both because the operator is Dallas-resident and because ERCOT's data publication makes the physical root well-served.

### 8.2 The Asset Scope alignment

LOCUS tokens fit `ASSET_SCOPE_CHARTER.md` Family 9 (Internal PARRALAX tokens, Class C in `AI_TOKEN_REGISTRY` — compute-backed). Their introduction triggers the full inclusion path of `AI_TOKEN_REGISTRY.md` § 6.

### 8.3 The Authority Charter alignment

A `child:spawn` (Authority Charter § 3.1) is the closest existing capability to LOCUS issuance. Issuance is restricted analogously: only a Level-6 mandate with explicit authorisation may mint LOCUS tokens. The minting is performed by FABRICOR per `AI_TOKEN_REGISTRY` § 6 Step 6.

### 8.4 The Kill-Switch Doctrine alignment

LOCUS attestation pipelines have a kill-switch scope analog: `LOCUS-SUSPENDED` is a per-LOCUS pause that halts new attestations from feeding the value function while existing positions remain in place (per the no-auto-close rule). A LOCUS that has been compromised, suspected manipulated, or whose oracle set has degraded enters LOCUS-SUSPENDED. Reset follows the same asymmetric pattern — 3-of-5 council + a written reason.

### 8.5 The Compliance Boundary

LOCUS tokens raise **distinct compliance questions** that the forthcoming `COMPLIANCE_BOUNDARY.md` must address before issuance:

- Are LOCUS tokens securities? Howey-test analysis turns on whether holders expect profit from the efforts of others. The compute providers' efforts contribute to LOCUS value; holders' efforts do not. This is a fact pattern that strongly resembles a security.
- Are LOCUS tokens commodities? CFTC has asserted jurisdiction over crypto in some cases; LOCUS tokens that function as compute-futures may fit.
- Money transmission. If LOCUS tokens trade for fiat or for stablecoins, money-transmitter licensing in each state of operation becomes relevant.
- Cross-border. A LOCUS in a non-US jurisdiction held by a US operator implicates OFAC, BIS, and state-level rules.

**None of these is resolved by this charter.** They are flagged so the eventual compliance assessment knows what to assess.

---

## 9. What this charter explicitly forbids

| Forbidden | Reason |
|---|---|
| Issuing a LOCUS token whose underlying LOCUS is not registered with the full tuple in § 2 | The token is a claim on the LOCUS; an undefined LOCUS is an undefined claim. |
| An oracle set that does not satisfy the three-root rule (hardware + independence + physical) | The defence against collusion is structural. Skipping it is equivalent to having no defence. |
| Value compounding on unverified work (pre-POST) | The truth-ladder doctrine extends to this token unmodified. |
| Entanglement between LOCI under a single operator's control | Self-entanglement is collusion; entanglement is for cross-operator redundancy. |
| Marketing copy implying LOCUS tokens represent ownership of physical hardware | The token tracks attested work, not title to property. The distinction is the legal defence; eroding it eliminates the defence. |
| Issuing more than 0 (zero) LOCUS tokens before § 6's full inclusion path is complete | First-sketch status is not authorisation. |
| LOCUS attestations that cite work performed by PARRALAX's own agents | Self-attestation is structurally invalid. PARRALAX is one signer of one root, never the only signer. |
| Greenwashing claims about energy source | The physical root provides the answer; the LOCUS does not get to overwrite it. |
| Hidden allowlist of "founder LOCI" minted to insiders | Same as the rest of the registry — no pre-mints, no private allowlists. |
| Cross-jurisdictional entanglement without compliance review per pair | Each entangled pair is its own compliance fact pattern. |

---

## 10. Reading lock-in

Three claims this charter makes that any implementation must honour:

1. **A LOCUS is a place plus its verified work history.** Not a place. Not a work history. The conjunction.
2. **Entanglement is structural correlation through shared substrate, not physical entanglement.** Honest naming, honest engineering.
3. **The value function is published, deterministic, and the only way value moves is POST-confirmed attestation.** No discretionary repricing. No backroom adjustments. The math is the math.

If the implementation contradicts any of these three, the implementation is wrong, the charter is correct, and the implementation changes.

---

## 11. The five questions the operator must answer before this leaves first-sketch status

The agent will not assume any of these. They are blocking. Each one becomes an editable section once answered.

1. **Which LOCUS gets defined first?** The architectural recommendation is `LOCUS·DALLAS·ERCOT-TX` (Dallas Market Doctrine alignment, ERCOT's data publication, operator residency). The operator's call.

2. **Is the day-one LOCUS a SHARED or a GRID?** A SHARED LOCUS (e.g., a community compute co-op) has the cleanest doctrine alignment but the highest operational complexity. A GRID LOCUS (e.g., ERCOT) has clean public-data inputs but raises a securities-law question about claiming compute-share of a grid the operator does not run.

3. **Will any LOCUS token ever be available to external parties?** If yes, the compliance answer in § 8.5 must be settled first. If no, the token is an internal accounting unit (Class E, not Class C) and the registry entry changes.

4. **Is entanglement enabled at issuance, or activated later via a separate proposal?** Recommendation: disabled at first issuance; the value function is hard enough to make honest without coupling LOCI to each other on day 1.

5. **What is the day-one attestation window?** Defaults under discussion: 60-second granularity for EDGE, 5-minute for CORE, 1-hour for GRID, 1-hour for SHARED. Operator may tighten or loosen.

---

## 12. Status and next steps

```
Status:       FIRST SKETCH — architectural exploration
Authorised:   nothing
Issued:       zero LOCUS tokens

Path to ratification:
  this charter (sketch)
  → operator answers § 11 questions
  → revised charter (proposal)
  → securities-law assessment (counsel-required)
  → COMPLIANCE_BOUNDARY entry for LOCUS specifically
  → 3-of-5 council vote
  → asset registry entry at AssetFamily.InternalPxToken / STRICT
  → first LOCUS registration (the place)
  → first FABRICOR mint (one token, the smallest possible test)
  → 90-day STRICT operation
  → council review for promotion path
```

Eight steps between this document and a live LOCUS token. None can be skipped.

---

## 13. Cross-references

- **Charters in this PR:**
  - [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md) — Class C entry; LOCUS is its first concrete proposal
  - [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) Family 9 — internal PARRALAX tokens
  - [`DALLAS_MARKET_DOCTRINE.md`](./DALLAS_MARKET_DOCTRINE.md) — ERCOT alignment, MXN cross-border note
  - [`PREDICTION_MARKETS_CHARTER.md`](./PREDICTION_MARKETS_CHARTER.md) — LOCUS prediction-market overlay
  - [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) — Level-6 + `child:spawn`-analog for issuance
  - [`RISK_CHARTER.md`](./RISK_CHARTER.md) — `gate.oracle_reliability` and `gate.chain` apply to LOCUS attestations
  - [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) — LOCUS-SUSPENDED scope analog
- **Forthcoming:**
  - `COMPLIANCE_BOUNDARY.md` — the prerequisite to any external LOCUS token availability
  - `LOCUS_ATTESTATION_PROTOCOL.md` — the wire-level protocol the three roots speak
  - `LOCUS_ENTANGLEMENT_PROTOCOL.md` — the smart-contract state structure for Kuramoto coupling
- **Existing doctrine inherited:**
  - Paper II (`CONCORDIA MACHINAE`) — Kuramoto coherence, the math of entanglement
  - Paper XX (`STIGMERGY`) — pheromone field, the math of place-bound activity decay and diffusion
  - Paper XXII (`AURUM`) — φ-compounding, the math of value compounding on verified work
  - Paper XXIV (`ANTE · MEDIUS · POST`) — the chrono triple per attestation
  - PROTOCOL-II (`TRUTH LADDER`) — POST-confirmed claim is the only claim that compounds value

---

*A LOCUS is a place where verifiable work happens. The token is the claim. The math is already in the corpus.*
