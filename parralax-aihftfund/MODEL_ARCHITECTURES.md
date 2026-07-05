# MODEL ARCHITECTURES

**Document:** `parralax-aihftfund/MODEL_ARCHITECTURES.md`  
**Parent:** [`MODEL_WEIGHTS_DOCTRINE.md`](./MODEL_WEIGHTS_DOCTRINE.md)  
**Status:** Ratified specifications for the three PARRALAX architectures.

---

## 0. Premise

Three model sizes serve the agent council. Each is specified here as an architecture — the shape, hyperparameters, and parameter count. **An architecture is not a trained model.** Training on operator-controlled hardware fills these specs with weights; this document is the target the training runs shoot for.

The three names are Latin, in the same divination register as AUGUR and PROPHET:

| Name | Root | Role |
|---|---|---|
| **VATES** | Latin: *vates* — seer, poet-prophet, inspired reader of signs | Fast signal generation |
| **AUSPEX** | Latin: *auspex* — the diviner who read auguries from bird flight | Observation, regime, world model |
| **ORACULUM** | Latin: *oraculum* — the oracle; the site where the deity spoke | Council-level reasoning |

The naming honours the existing corpus vocabulary. AUGUR (the agent) consumes VATES (the model). PROPHET (AUGUR's prediction-market variant) does too. VIGIL (the observer) consumes AUSPEX. ARCHON and ARBITER consume ORACULUM.

---

## 1. Shared architecture family

All three models are **decoder-only transformer language models** in the LLaMA / Mistral architectural family. The choices are deliberate — they optimise for a well-understood, well-tooled architecture over novelty.

### 1.1 Shared design decisions

- **Decoder-only.** Causal masking. Left-to-right generation.
- **Rotary position embeddings (RoPE).** No learned position embeddings; RoPE with base 10000 (VATES) / 500000 (AUSPEX/ORACULUM for longer context).
- **RMSNorm.** Pre-norm. No LayerNorm bias.
- **SwiGLU FFN.** Gated activation. `ffn_hidden` chosen so FFN param count ≈ 8/3 · `d_model²` (SwiGLU factor).
- **Grouped-query attention (GQA).** Compute savings on inference; used on AUSPEX and ORACULUM. VATES uses standard MHA for its size.
- **BPE tokeniser, vocab 32000.** Same tokeniser across all three sizes so agents can route context between models without re-tokenisation.
- **Weight tying.** Input embedding and LM head share weights (`vocab_size × d_model` counted once).

### 1.2 Shared training-recipe defaults

- Optimiser: AdamW, β₁ = 0.9, β₂ = 0.95, weight decay 0.1
- Learning-rate schedule: cosine, warmup 2000 steps
- Peak learning rate: scales with size (see per-model specs)
- Batch size: 4M tokens per step (adjusted for hardware)
- Gradient clipping: 1.0

These are defaults, not doctrine. Actual training recipes are declared per run in the `ModelManifest.trainingRecipe` field.

---

## 2. VATES-8B — the signal seer

**Latin: *vates* — seer, poet-prophet, inspired reader of signs.**

VATES is the smallest of the three. Its role is signal generation at latencies compatible with the 873 ms heartbeat — an AUGUR call to VATES must return well within one beat, preferably in tens of milliseconds. Small size, tight latency, high call frequency.

### 2.1 Architecture

```
VATES-8B architecture spec
──────────────────────────────────────────────────────────
vocab_size:          32000
d_model:              4096
num_layers:             32
num_heads:              32          (MHA; no GQA at this size)
num_kv_heads:           32
head_dim:              128
ffn_hidden:          14336          (≈ 8/3 · d_model, SwiGLU)
max_seq_len:          8192
tie_embedding:        true
rope_base:           10000
activation:          SwiGLU
norm:                RMSNorm  eps 1e-5
──────────────────────────────────────────────────────────
```

### 2.2 Parameter count

Breakdown (weight-tying counted once):

| Component | Formula | Count |
|---|---|---|
| Embedding (shared) | `vocab · d_model` | 131 M |
| Per-layer attention | `4 · d_model²` | 67 M |
| Per-layer FFN (SwiGLU) | `3 · d_model · ffn_hidden` | 176 M |
| Per-layer RMSNorm | `2 · d_model` | 8 K |
| Per layer total | | ≈ 243 M |
| All 32 layers | `32 · 243M` | 7.78 B |
| Final RMSNorm | `d_model` | 4 K |
| **Total** | | **≈ 7.91 B** |

Within ±2% of 8B target; well within ±5% tolerance for the label.

### 2.3 Consumer roles

- **AUGUR** (signal-diviner agent) — momentum, mean-reversion, arbitrage signal generation
- **PROPHET** (AUGUR's prediction-market mandate variant) — outcome-probability estimation from event descriptions

### 2.4 Latency budget

- Target: **≤ 100 ms** per single-context inference at 512-token generation length on operator-provisioned hardware
- Hard cap enforced by CUSTOS (`gate.model_inference_rate`): if VATES misses the target for > 5 consecutive calls, the agent that called it is temporarily rate-limited

---

## 3. AUSPEX-14B — the observer

**Latin: *auspex* — the diviner who read auguries from bird flight; keeper of signs.**

AUSPEX is the mid-sized model. Its role is observation-heavy — it reads market state, classifies regimes, updates world models. Latency budget is one heartbeat, not a sub-beat. GQA introduced here for inference efficiency.

### 3.1 Architecture

```
AUSPEX-14B architecture spec
──────────────────────────────────────────────────────────
vocab_size:          32000
d_model:              5120
num_layers:             40
num_heads:              40
num_kv_heads:           10          (GQA 4:1)
head_dim:              128
ffn_hidden:          13824          (SwiGLU, scaled down slightly for target)
max_seq_len:         16384
tie_embedding:        true
rope_base:          500000
activation:          SwiGLU
norm:                RMSNorm  eps 1e-5
──────────────────────────────────────────────────────────
```

### 3.2 Parameter count

Breakdown:

| Component | Formula | Count |
|---|---|---|
| Embedding (shared) | `vocab · d_model` | 164 M |
| Per-layer attention (GQA) | `d_model · (d_model + 2 · num_kv_heads · head_dim) + d_model²` | 39 M |
| Per-layer FFN (SwiGLU) | `3 · d_model · ffn_hidden` | 212 M |
| Per-layer RMSNorm | `2 · d_model` | 10 K |
| Per layer total | | ≈ 252 M |
| All 40 layers | `40 · 252M` | 10.06 B |
| Final RMSNorm | `d_model` | 5 K |

Hmm — this comes out closer to 10.2B than 14B. The GQA-4:1 saves considerably on attention params. To hit ~14B target, we increase `ffn_hidden`:

**Revised AUSPEX-14B:**

```
ffn_hidden:          17920          (increased for target)
```

Recalc per-layer FFN: `3 · 5120 · 17920` = 275 M  
Per layer total: ≈ 315 M  
All 40 layers: 12.6 B  
Plus embedding: 12.8 B

Still a bit under 14B. Two options: 44 layers, or wider FFN. Choose 44 layers (keeps FFN aspect ratio conventional):

**Final AUSPEX-14B spec:**

```
AUSPEX-14B architecture spec (final)
──────────────────────────────────────────────────────────
vocab_size:          32000
d_model:              5120
num_layers:             44
num_heads:              40
num_kv_heads:           10          (GQA 4:1)
head_dim:              128
ffn_hidden:          17920          (SwiGLU)
max_seq_len:         16384
tie_embedding:        true
rope_base:          500000
──────────────────────────────────────────────────────────
```

Recount: per layer ≈ 315 M · 44 = 13.86 B; plus embedding = **14.02 B** ✓

### 3.3 Consumer roles

- **VIGIL** (market observer) — regime classification, volatility characterisation
- **CEREBEX** (world model, per Paper VII) — belief updates over the 40-category world model
- Any agent needing analytical depth with heartbeat-compatible latency

### 3.4 Latency budget

- Target: **≤ 500 ms** per single-context inference at 1024-token generation on operator-provisioned hardware
- Sub-heartbeat calls are avoided; AUSPEX inferences are scheduled at heartbeat granularity

---

## 4. ORACULUM-20B — the oracle

**Latin: *oraculum* — the oracle; the site where the deity spoke.**

ORACULUM is the largest of the three. Council-level reasoning — proposal reviews, adversarial scenario evaluations, high-stakes signal composition. Latency tolerates multiple heartbeats.

### 4.1 Architecture

```
ORACULUM-20B architecture spec
──────────────────────────────────────────────────────────
vocab_size:          32000
d_model:              6144
num_layers:             44
num_heads:              48
num_kv_heads:            8          (GQA 6:1)
head_dim:              128
ffn_hidden:          16384          (SwiGLU)
max_seq_len:         32768
tie_embedding:        true
rope_base:          500000
activation:          SwiGLU
norm:                RMSNorm  eps 1e-5
──────────────────────────────────────────────────────────
```

### 4.2 Parameter count

Breakdown:

| Component | Formula | Count |
|---|---|---|
| Embedding (shared) | `vocab · d_model` | 197 M |
| Per-layer attention (GQA 6:1) | `d_model · (d_model + 2 · num_kv_heads · head_dim) + d_model²` | 50 M |
| Per-layer FFN (SwiGLU) | `3 · d_model · ffn_hidden` | 302 M |
| Per-layer RMSNorm | `2 · d_model` | 12 K |
| Per layer total | | ≈ 352 M |
| All 44 layers | `44 · 352M` | 15.5 B |
| Final RMSNorm | `d_model` | 6 K |

Comes out 15.7B; short of 20B target. Increase layer count to 56:

Recalc: per layer 352M · 56 = 19.7 B  
Plus embedding: **19.9 B** ✓

**Final ORACULUM-20B spec:**

```
ORACULUM-20B architecture spec (final)
──────────────────────────────────────────────────────────
vocab_size:          32000
d_model:              6144
num_layers:             56
num_heads:              48
num_kv_heads:            8          (GQA 6:1)
head_dim:              128
ffn_hidden:          16384          (SwiGLU)
max_seq_len:         32768
──────────────────────────────────────────────────────────
```

Total: **≈ 19.9 B** — within ±0.5% of 20B target.

### 4.3 Consumer roles

- **ARCHON** (governance integrity agent) — proposal review, doctrine-compliance analysis
- **ARBITER** (settlement / dispute agent) — high-stakes reasoning about ambiguous outcomes
- **High-stakes AUGUR variants** — reasoning over multi-signal composition when latency permits

### 4.4 Latency budget

- Target: **≤ 3 seconds** per single-context inference at 2048-token generation
- Multi-heartbeat inferences are permitted; council-level decisions are not real-time

---

## 5. Summary table

| Model | Params | Layers | d_model | Heads | KV heads | FFN hidden | Context | Role |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **VATES-8B** | 7.91 B | 32 | 4096 | 32 | 32 | 14336 | 8K | Signals (AUGUR) |
| **AUSPEX-14B** | 14.02 B | 44 | 5120 | 40 | 10 | 17920 | 16K | Observation (VIGIL, CEREBEX) |
| **ORACULUM-20B** | 19.90 B | 56 | 6144 | 48 | 8 | 16384 | 32K | Reasoning (ARCHON, ARBITER) |

Sizes match the labels within ±2% — sufficient tolerance for the naming to be honest.

---

## 6. Cross-model routing

Not every task calls the largest model. The agent council routes by task:

```
task-class          → model
────────────────────────────────
signal-generation   → VATES-8B      (fast, cheap, high-frequency)
signal-scoring      → VATES-8B      (same as generation, no upgrade needed)
regime-classify     → AUSPEX-14B    (observation depth matters)
world-model-update  → AUSPEX-14B    (CEREBEX-shaped inference)
proposal-review     → ORACULUM-20B  (council-level reasoning)
adversarial-eval    → ORACULUM-20B  (stress test scenarios)
dispute-resolve     → ORACULUM-20B  (high-stakes ambiguity)
```

Routing is per-agent-mandate. An agent whose mandate names all three (rare) chooses at runtime based on the task class. An agent whose mandate names only VATES cannot escalate to AUSPEX or ORACULUM without a mandate revision.

---

## 7. Storage sizes (uncompressed, fp16)

Rough on-disk footprint for each model at half precision:

| Model | Params | fp16 size | int8 quantised | int4 quantised |
|---|:---:|:---:|:---:|:---:|
| VATES-8B | 7.91 B | ~16 GB | ~8 GB | ~4 GB |
| AUSPEX-14B | 14.02 B | ~28 GB | ~14 GB | ~7 GB |
| ORACULUM-20B | 19.90 B | ~40 GB | ~20 GB | ~10 GB |

These sizes matter for the doctrine: **weights never sit in a repository.** All three sizes are orders of magnitude larger than what any git-hosted repo can reasonably hold. Weights live on operator-controlled block storage, referenced by content hash from the manifest.

---

## 8. What this doc explicitly forbids

| Forbidden | Reason |
|---|---|
| Ad-hoc "VATES-3B" or "ORACULUM-70B" variants without a full charter revision | The three sizes are ratified doctrine; additions go through the same path |
| Modifying an architecture spec after weights are registered against it | A modified spec is a new model; register it separately |
| Claiming a model is "VATES-8B" when its parameter count deviates > 5% from the spec | Naming has to mean something |
| Serving inference on any consumer path without the manifest hash check | Same rule as MODEL_WEIGHTS_DOCTRINE — hash before load, always |
| Deploying quantised weights without a separate manifest entry | int8 VATES-8B and fp16 VATES-8B are two separate registrations |

---

## 9. Reading lock-in

1. **Three sizes, three roles, three names — all Latin, all named after divination roles.** The taxonomy is fixed at three; more sizes require a charter revision.
2. **The architectures are the specs; training produces the weights.** This document does not become weights when you read it.
3. **Each model's role is a mandate binding, not a runtime choice.** An agent gets the models its mandate says it gets.

---

## 10. Open decisions (operator-only)

1. **Training-from-scratch vs. bootstrap.** Per `MODEL_WEIGHTS_DOCTRINE.md` § 12 — same question here.
2. **Tokeniser choice.** BPE 32000 is the default. Alternative: byte-level (larger vocab, no OOVs, harder to reason about). Operator's call.
3. **Alternative RoPE bases per model.** Longer-context AUSPEX/ORACULUM might benefit from a larger RoPE base (500 K) than VATES (10 K). Defaults above; operator may tune.
4. **Which agent-mandate revisions land the first model bindings.** Recommendation: AUGUR + VATES-8B first (fastest path to a trained signal-scorer); VIGIL + AUSPEX-14B second; ARCHON + ORACULUM-20B once the first two are stable.

---

## 11. Cross-references

- **Charter:** [§ 25 AI Token and AI Governance Layer](./CHARTER.md)
- **Sibling docs:** [`MODEL_WEIGHTS_DOCTRINE.md`](./MODEL_WEIGHTS_DOCTRINE.md) (the governance around these architectures); [`AI_TOKEN_REGISTRY.md`](./AI_TOKEN_REGISTRY.md) (Class C compute-backed assets); [`TRAINING_DOCTRINE.md`](./TRAINING_DOCTRINE.md) (how the training runs are governed); [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (mandate revisions bind agents to models)
- **Existing corpus:** the naming honours AUGUR / PROPHET (agent names in `PLAN.md` § 3 and `PREDICTION_MARKETS_CHARTER.md` § 4). VATES / AUSPEX / ORACULUM extend the Latin-divination register.

---

*Three sizes. Three roles. Latin names for the readers of signs. Architectures published. Weights operator-held. Manifests bind the two.*
