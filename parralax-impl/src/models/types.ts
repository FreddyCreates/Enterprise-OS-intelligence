/**
 * Model types — the shape of PARRALAX architectures, weights, and manifests.
 *
 * Per MODEL_WEIGHTS_DOCTRINE:
 *   A Model is a tuple: spec + weights + manifest + loader.
 *   Every one must exist. A weights blob without a manifest is unusable.
 *   A manifest whose hash does not match the on-disk weights is a doctrine
 *   violation. The loader refuses to bind mismatched pairs.
 *
 * This module defines the types. src/models/architectures.ts carries the
 * three PARRALAX specs. src/models/init.ts creates tensor DESCRIPTORS
 * (not tensor data — data is external). src/models/checkpoint.ts is the
 * loader that a real training run's checkpoint format binds to.
 */

import type { Sha256, Iso8601, PrincipalId, Signature } from '../types/common.js';

// ── The architecture spec ──────────────────────────────────────────────────

export type Activation = 'SwiGLU' | 'GELU' | 'ReLU';
export type NormType   = 'RMSNorm' | 'LayerNorm';

export interface ModelArchitectureSpec {
  /** Latin identifier: VATES-8B, AUSPEX-14B, ORACULUM-20B. */
  readonly name:            string;
  /** Coarse parameter-count label (e.g. '8B'). Actual count in `estimatedParams`. */
  readonly sizeLabel:       string;
  /** Estimated parameter count. Verified by param-count.ts against ±5%. */
  readonly estimatedParams: number;

  // ── Transformer hyperparameters ─────────────────────────────────────────
  readonly vocabSize:    number;
  readonly dModel:       number;
  readonly numLayers:    number;
  readonly numHeads:     number;
  /** For GQA. Equals numHeads for MHA. */
  readonly numKvHeads:   number;
  readonly headDim:      number;
  readonly ffnHidden:    number;
  readonly maxSeqLen:    number;
  readonly ropeBase:     number;

  // ── Design flags ─────────────────────────────────────────────────────────
  readonly tieEmbedding: boolean;
  readonly activation:   Activation;
  readonly norm:         NormType;
  readonly normEps:      number;

  // ── Operational constraints ─────────────────────────────────────────────
  /** Target latency budget in ms for a single-context inference. CUSTOS reads this. */
  readonly targetLatencyMs: number;
  /** Human-facing description of the role this model serves. */
  readonly role: string;
}

// ── Tensor descriptor ──────────────────────────────────────────────────────
//
// A TensorDescriptor is the SHAPE and NAME of a tensor. It is NOT the tensor
// data itself. Training produces the data; this module produces the shape.
// A model built entirely of descriptors is a spec, not a trained model.
//
// The distinction matters because it makes it structurally impossible for
// this module to produce anything that looks like weights but isn't.

export interface TensorDescriptor {
  readonly name:  string;                  // e.g. 'layer.12.attn.q_proj.weight'
  readonly shape: ReadonlyArray<number>;   // e.g. [4096, 4096]
  readonly dtype: 'fp32' | 'fp16' | 'bf16' | 'int8' | 'int4';
  /** Optional grouping tag for parameter counting and initialisation. */
  readonly group?: 'embedding' | 'attention' | 'ffn' | 'norm' | 'output';
}

// ── The full descriptor set for a model ────────────────────────────────────

export interface ModelDescriptor {
  readonly spec:        ModelArchitectureSpec;
  readonly tensors:     ReadonlyArray<TensorDescriptor>;
  readonly totalParams: number;
  readonly estimatedFp16Bytes: number;
}

// ── The manifest — what a REAL trained model carries ───────────────────────

export interface TrainingDataAttestation {
  readonly sourceManifestHash:    Sha256;
  readonly licenceAttestation:    string;
  readonly consentPosture:        'operator-collected' | 'vendor-attested' | 'public-dataset' | 'mixed';
  readonly piiRedactionSummary:   string;
  readonly reproducibilityHash:   Sha256;
}

export interface TrainingRecipe {
  readonly optimiser:           string;             // e.g. 'AdamW'
  readonly peakLearningRate:    number;
  readonly warmupSteps:         number;
  readonly batchSizeTokens:     number;
  readonly totalTrainingTokens: number;
  readonly gradClip:            number;
  readonly hyperparametersHash: Sha256;             // hash of the full recipe
}

export interface EvaluationResult {
  readonly harnessName:   string;
  readonly taskName:      string;
  readonly metricName:    string;
  readonly metricValue:   number;
  readonly evaluatedAt:   Iso8601;
}

export type SunsetCondition =
  | { readonly kind: 'time-based';    readonly expiresAt: Iso8601 }
  | { readonly kind: 'metric-based';  readonly evaluation: string; readonly floor: number }
  | { readonly kind: 'successor';     readonly waitFor: string }
  | { readonly kind: 'manual' };

export interface ModelManifest {
  readonly modelName:        string;               // e.g. 'VATES-8B'
  readonly specHash:         Sha256;               // hash of the architecture spec
  readonly weightsHash:      Sha256;               // SHA-256 of the weight bytes on disk
  readonly totalParams:      number;

  /** Path pointing to operator-controlled block storage. Never a URL to a public service. */
  readonly weightsLocation:  string;

  /** If bootstrapped from a foundation model, its verified hash. Null if trained from scratch. */
  readonly foundationModelHash: Sha256 | null;
  /** If this manifest is a fine-tune, the parent manifest hash. Null otherwise. */
  readonly parentManifestHash:  Sha256 | null;

  readonly trainingData:     TrainingDataAttestation;
  readonly trainingRecipe:   TrainingRecipe;
  readonly evaluationResults: ReadonlyArray<EvaluationResult>;

  readonly sunset:           ReadonlyArray<SunsetCondition>;

  // Registration audit
  readonly registeredAt:     Iso8601;
  readonly registeredBy:     PrincipalId;
  readonly councilSigners:   ReadonlyArray<PrincipalId>;
  readonly signatures:       ReadonlyArray<Signature>;
}

// ── Manifest validity ─────────────────────────────────────────────────────

export interface ManifestValidation {
  readonly valid:   boolean;
  readonly errors:  ReadonlyArray<string>;
}

/**
 * Validate a manifest for structural completeness — before any load.
 * Does NOT verify the weight-hash-against-disk; that is the loader's job.
 */
export function validateManifest(m: ModelManifest): ManifestValidation {
  const errors: string[] = [];
  if (!m.modelName)             errors.push('manifest: modelName required');
  if (!m.specHash)              errors.push('manifest: specHash required');
  if (!m.weightsHash)           errors.push('manifest: weightsHash required');
  if (m.totalParams <= 0)       errors.push('manifest: totalParams must be > 0');
  if (!m.weightsLocation)       errors.push('manifest: weightsLocation required');
  if (m.weightsLocation.startsWith('http://') || m.weightsLocation.startsWith('https://'))
                                 errors.push('manifest: weightsLocation must not be a public URL — operator-controlled storage only');
  if (!m.trainingData)          errors.push('manifest: trainingData attestation required');
  if (!m.trainingData?.sourceManifestHash)  errors.push('manifest: trainingData.sourceManifestHash required');
  if (!m.trainingData?.reproducibilityHash) errors.push('manifest: trainingData.reproducibilityHash required');
  if (!m.trainingRecipe)        errors.push('manifest: trainingRecipe required');
  if (!m.trainingRecipe?.hyperparametersHash) errors.push('manifest: trainingRecipe.hyperparametersHash required');
  if (!m.sunset || m.sunset.length === 0)     errors.push('manifest: sunset conditions required (at least one) — no forever-live weights');
  if (!m.registeredBy)          errors.push('manifest: registeredBy required');
  if (!m.signatures || m.signatures.length === 0) errors.push('manifest: at least one signature required');

  return { valid: errors.length === 0, errors };
}
