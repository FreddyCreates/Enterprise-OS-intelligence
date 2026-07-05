# MODEL WEIGHTS DOCTRINE

**Document:** `parralax-aihftfund/MODEL_WEIGHTS_DOCTRINE.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 25 — AI Token and AI Governance Layer · [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md)  
**Status:** Ratified doctrine.

---

## 0. Premise

Every ML model in the world is one thing: a large collection of numeric parameters (weights) that a training process fitted to a dataset. The industry treats these weights carelessly — they get uploaded to model hubs, downloaded by anyone, quantised, forked, fine-tuned, re-hosted, cached in a hundred places at once. This treatment is incompatible with the PARRALAX doctrine.

For PARRALAX to use language models — for AUGUR to score signals, for VIGIL to classify regimes, for ARCHON to review proposals — the weights those models run on must satisfy the same sovereignty and traceability constraints that everything else in this system does.

The doctrine: **model weights are compute-backed assets (`AI_TOKEN_REGISTRY` Class C) subject to the same provenance and custody rules as any other asset PARRALAX handles. They are not a free-floating resource; they are an accountable artefact with a manifest, a training receipt, and a sunset path.**

---

## 1. What a "model" is inside PARRALAX

A model is a tuple:

```
Model {
  spec:      ModelArchitectureSpec       // the shape (published, deterministic)
  weights:   TensorArray                 // the numeric parameters (private, operator-held)
  manifest:  ModelManifest               // the provenance record (public metadata)
  loader:    CheckpointLoader            // the code that binds weights to spec
}
```

Every one of these four pieces must exist for the model to be considered *ready for use*. A weights blob without a manifest is unusable. A spec without weights is a plan, not a model. A manifest whose weights hash does not match the weights on disk is a doctrine violation.

---

## 2. The three PARRALAX architectures

Three model sizes serve the agent council. Each has its own architecture spec (see `MODEL_ARCHITECTURES.md`) and a Latin name in the same divination register as AUGUR.

| Name | Size | Primary role | Agents that consume it |
|---|:---:|---|---|
| **VATES-8B** | ~8B params | Signal generation on tight latency budgets | AUGUR (signal), PROPHET (prediction-market variant) |
| **AUSPEX-14B** | ~14B params | Observation, regime classification, world-model updates | VIGIL, CEREBEX-style world modelling |
| **ORACULUM-20B** | ~20B params | Council-level reasoning, proposal review, adversarial scenario evaluation | ARCHON, ARBITER, high-stakes AUGUR variants |

The three sizes are not arbitrary — they map to the compute-latency-cost trade-off each role actually faces. Signal generation must be fast (VATES). Regime classification can afford one heartbeat (AUSPEX). Council reasoning tolerates seconds (ORACULUM). **Larger is not automatically better.** A larger model that misses the latency budget of the role it serves is a worse fit than a smaller one that hits it.

---

## 3. What model weights ARE, in this doctrine

Weights are, structurally:

- A **Class C asset** in the `AI_TOKEN_REGISTRY.md` taxonomy — compute-backed.
- Governed by the same eight-step inclusion path any Class C asset requires.
- Registered in the asset registry once trained and ready.
- CHRONO-anchored via `model.weights_registered` on first use, and by `model.checkpoint_loaded` on every load thereafter.
- Physically located on hardware the operator controls.
- Cryptographically bound to their manifest (weights SHA-256 = manifest.weightsHash; if not, refuse to load).

---

## 4. What model weights are NOT, in this doctrine

| NOT | Reason |
|---|---|
| Downloadable from a third-party model hub | Hubs are not sovereign; their re-hosts, mirrors, and quantisations can drift silently |
| Committable to a public repository | Weights are operator-private per `SECURITY.md`. A public repo cannot hold them, ever. |
| Fine-tunable by any agent | Fine-tuning is a training run; every training run needs a manifest, provenance, ratification |
| Loadable without a matching manifest | No manifest = no load. The loader refuses. |
| Interchangeable across sizes without a promotion event | Swapping VATES for AUSPEX in a running agent is a mandate change, not a hot-swap |
| Present in more than one deployed copy without an operator-signed replication receipt | Replicated weights require a paper trail |
| Free of a sunset path | Every deployed weight set has a scheduled review; no forever-live weights |

---

## 5. Training data provenance — the input-side requirement

Weights inherit the provenance of the data they were trained on. A weight set without an attested training-data manifest cannot be registered. **PARRALAX does not train on data of unclear origin.**

Required for any training run:

- **Data source manifest.** Where the data came from (public dataset name + version + hash; vendor + contract reference; operator-generated + collection procedure).
- **Licence attestation.** What licence applies. Is that licence compatible with the intended use?
- **Consent posture.** If any portion of the data derives from user contribution, was consent obtained? Was consent revocable? Is a revocation channel plumbed?
- **PII redaction attestation.** If PII was possibly present in the raw data, what redaction was applied? Who verified?
- **Reproducibility hash.** A hash over the exact dataset used, so a reviewer can independently confirm what fed the training.

These attestations become part of `ModelManifest.trainingData` and cannot be updated after registration — if the data changes, that is a new model.

---

## 6. Weights registration — the eight-step path

Every model that PARRALAX uses passes through this path. The path mirrors `AI_TOKEN_REGISTRY.md` § 6 (which governs Class C assets in general) and refines it for weights.

```
Step 1.  Architecture spec landed
         MODEL_ARCHITECTURES.md carries the spec. Parameter count within
         ±1% of the stated size.

Step 2.  Training-data manifest assembled
         All fields in § 5 populated and hash-verified.

Step 3.  Training recipe declared
         Optimiser, learning-rate schedule, batch size, sequence length,
         checkpoint intervals, evaluation harness. Reproducibility hash.

Step 4.  Training run authorised
         Operator hardware-signer ceremony + council 3-of-5 vote for any
         training exceeding an operator-defined compute budget (recommend:
         ≥ $10K estimated compute cost triggers council review).

Step 5.  Training executed
         On operator-controlled hardware. CHRONO entries per checkpoint.
         Kill-switch on training divergence or cost overrun.

Step 6.  Evaluation harness run
         Post-training, before registration. Metrics recorded per
         evaluation task. Failing evaluations do not block registration
         (that is the operator's call) but they are permanent record.

Step 7.  Manifest signed
         Operator + council 3-of-5 sign the ModelManifest. Weights SHA-256
         included. Storage location recorded (operator hardware pointer;
         not a URL to a public service).

Step 8.  Registered in the asset registry
         AssetFamily.InternalPxToken · Class C · risk tier STRICT.
         Available for consumption by agents whose mandate names the
         model by manifest hash.
```

**No expedited path.** No "quick fine-tune" that skips steps. A fine-tune is a full training run and passes the same eight steps.

---

## 7. Consumption — how an agent uses a model

Once registered, an agent may consume a model **only if its mandate names the model's manifest hash**. This means:

- Adding a model to an agent is a mandate revision (per `AGENT_AUTHORITY_CHARTER.md`).
- Rotating a model version is a mandate revision.
- Removing a model is a mandate revision.
- An agent that discovers a manifest-hash mismatch at load time refuses to load and writes a `voxis_doctrine_violation`.

The agent's config carries the model reference by hash, not by name. Names are for humans; hashes are for machines and for auditors.

```
mandate.aiModels = [
  { manifestHash: 'sha256:abc…' role: 'signal-scorer'   maxInferencePerMinute: 60 },
  { manifestHash: 'sha256:def…' role: 'regime-classify' maxInferencePerMinute: 12 },
]
```

**Per-minute inference caps** are operator-set. They prevent a runaway agent from burning through compute budget. CUSTOS gates them (`gate.model_inference_rate`, added in a future revision).

---

## 8. Sunset path

Every registered model has an operator-set sunset condition. Options:

- **Time-based.** Auto-deregister after N days unless renewed by operator signature.
- **Metric-based.** Auto-deregister if performance on a specified evaluation drops below a threshold.
- **Successor-based.** Auto-deregister when a successor model is registered against the same role.
- **Manual.** Requires explicit operator deregistration; never auto-expires.

**Every model must have at least one sunset condition.** A model with none is a doctrine violation.

On deregistration:
- Agents consuming the model see their next `beat()` return a doctrine-violation halt.
- The operator must issue a mandate revision replacing the model reference before the agent can resume.
- The weights themselves are not deleted; they remain on operator-controlled storage as evidence.

---

## 9. Third-party foundation models — the exception, tightly bounded

The doctrine as stated forbids downloading weights from third-party hubs. Reality complicates this: an operator may legitimately want to bootstrap PARRALAX on top of an open-source foundation model (Llama, Mistral, Phi, Qwen, DeepSeek, etc.) rather than training from scratch.

**This is permitted only under these conditions:**

1. The foundation-model release is directly attested by the publishing organisation (signed by their key or hosted at a URL they publish and control).
2. The weights are downloaded once, hashed, and stored on operator-controlled hardware. The hash is recorded in `ModelManifest.foundationModelHash`.
3. Every subsequent load verifies the on-disk hash against the manifest.
4. **The model is treated as PARRALAX-registered** — full manifest, sunset path, asset registry entry. The fact that its base weights came from elsewhere is a field in the manifest, not an exemption from the doctrine.
5. Any fine-tuning done on top writes a new manifest with `parentManifestHash` set to the base model.
6. The operator is responsible for the base model's licence terms (is commercial use permitted, does the licence require attribution, are there use restrictions).

There is **no** provision for "just use the OpenAI/Anthropic/Google API and call it PARRALAX." Those are third-party inference services; the weights are not operator-held; the substrate is not sovereign. That path is closed by the doctrine.

---

## 10. What this doctrine explicitly forbids

| Forbidden | Reason |
|---|---|
| Weights on any third-party model host | Sovereignty of the substrate |
| Weights in any public repository, ever | Operator-private posture |
| Loading weights without a matching manifest hash | Cryptographic binding, not naming |
| Fine-tuning without going through the full 8-step registration path | A fine-tune is a full training run |
| Any model without a sunset path | Perpetual weights == unmaintained substrate |
| Third-party inference APIs (OpenAI/Anthropic/Google/etc.) treated as "our model" | Not sovereign; not operator-controlled |
| Undisclosed training data provenance | Data laundering |
| Agents consuming models not named by hash in their mandate | Mandate-outside consumption is unauthorised |
| Weights replicated across machines without a replication receipt | Every copy is a copy that needs tracing |
| "Emergency" hot-swaps of production models without a promotion event | The doctrine has no emergency-bypass path here |

---

## 11. Reading lock-in

Three claims this doctrine makes that the implementation must honour:

1. **Weights are compute-backed assets (Class C).** Registered in the asset registry. Governed by the same 8-step inclusion path. No exceptions.
2. **The manifest is the contract.** No weights load without a matching manifest hash. No manifest exists without provenance. No provenance means no registration.
3. **The three PARRALAX sizes (VATES-8B, AUSPEX-14B, ORACULUM-20B) are architectures, not weights.** Each is an operator-buildable spec. Training produces the weights; the spec produces nothing on its own.

If the implementation contradicts any of these three, the implementation is wrong, the charter is correct, and the implementation changes.

---

## 12. Open decisions (operator-only)

The charter does not assume:

1. **Whether to train from scratch or bootstrap from a foundation model.** Cost/quality/timeline trade-off. Recommendation: bootstrap VATES-8B from an open-source 7-8B foundation model for a first release; train ORACULUM-20B from scratch or bootstrap from a compatible 20B base once operator infrastructure permits.
2. **Compute budget per model.** Operator-set; council-reviewed above a threshold.
3. **Training-data assembly path.** Public datasets only; vendor-attested only; operator-collected with consent; some mixture. Provenance requirements apply either way.
4. **Whether to publish evaluation results externally.** Recommendation: no publication in first year; internal-only. Publication of comparative benchmarks against competitors is a marketing decision governed by `DALLAS_MARKET_DOCTRINE` § 7's boilerplate rule.

---

## 13. Cross-references

- **Charter:** [§ 25 AI Token and AI Governance Layer](./CHARTER.md), [§ 17 Asset Creation Charter](./CHARTER.md)
- **Sibling docs:** [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md) (Class C compute-backed assets); [`MODEL_ARCHITECTURES.md`](./MODEL_ARCHITECTURES.md) (the three PARRALAX architecture specs); [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md) (how training runs are governed); [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (mandate revisions required to change model bindings); [`SIMULATION_PROMOTION_PROTOCOL.md`](./SIMULATION_PROMOTION_PROTOCOL.md) (model rollout is a promotion event above the sim/live boundary)
- **Existing doctrine:**
  - Paper VII (`QUAESTIO ET ACTIO`) — the φ⁻¹ learning coefficient training operates under
  - Paper XXII (`AURUM`) — the substrate-is-intelligence claim; models are one form of substrate
  - Paper IV (`DOCTRINA VOXIS`) — every VOXIS unit's doctrine block; a model binding is a doctrine-block field

---

*Weights are compute-backed assets. The manifest is the contract. No load without hash match. No fine-tune without the full path. No third-party inference services treated as our model.*
