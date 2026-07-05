/**
 * Parameter counting from first principles.
 *
 * Per MODEL_ARCHITECTURES.md § 2/3/4: every model spec must yield a
 * parameter count within ±5% of its stated size label. This module does
 * the counting deterministically from a ModelArchitectureSpec so the
 * numbers cannot silently drift.
 *
 * The formulas match standard LLaMA-family transformer decoders with:
 *   - SwiGLU FFN (3 matrices: gate, up, down; hidden dim = ffnHidden)
 *   - Grouped-query attention (numKvHeads may be < numHeads)
 *   - RMSNorm (2 per layer + 1 final; each is d_model parameters)
 *   - Optional weight-tying (embedding shared with LM head)
 */

import type { ModelArchitectureSpec } from './types.js';

export interface ParamCountBreakdown {
  readonly embedding:            number;
  readonly perLayerAttention:    number;
  readonly perLayerFfn:          number;
  readonly perLayerNorm:         number;
  readonly perLayerTotal:        number;
  readonly allLayers:            number;
  readonly finalNorm:            number;
  readonly lmHead:               number;   // 0 if tied
  readonly total:                number;
}

export function countParameters(spec: ModelArchitectureSpec): ParamCountBreakdown {
  const embedding = spec.vocabSize * spec.dModel;

  // Attention: Q · d_model + K · (numKvHeads · headDim) + V · (numKvHeads · headDim) + O · d_model
  // Q projection is always d_model × d_model.
  // K/V projections are d_model × (numKvHeads × headDim).
  // O projection is d_model × d_model.
  // Total: 2 · d_model² + 2 · d_model · numKvHeads · headDim
  const perLayerAttention =
    2 * spec.dModel * spec.dModel +
    2 * spec.dModel * spec.numKvHeads * spec.headDim;

  // FFN — SwiGLU has three matrices (gate, up, down).
  const ffnFactor = spec.activation === 'SwiGLU' ? 3 : 2;
  const perLayerFfn = ffnFactor * spec.dModel * spec.ffnHidden;

  // Norms — 2 per layer (attn-norm and ffn-norm), each d_model params.
  const perLayerNorm = 2 * spec.dModel;

  const perLayerTotal = perLayerAttention + perLayerFfn + perLayerNorm;
  const allLayers     = spec.numLayers * perLayerTotal;

  const finalNorm = spec.dModel;
  const lmHead    = spec.tieEmbedding ? 0 : spec.vocabSize * spec.dModel;

  const total = embedding + allLayers + finalNorm + lmHead;

  return {
    embedding,
    perLayerAttention,
    perLayerFfn,
    perLayerNorm,
    perLayerTotal,
    allLayers,
    finalNorm,
    lmHead,
    total,
  };
}

/**
 * Verify that a spec's estimatedParams field lands within the given
 * tolerance of the true count. Used at spec-load time and in tests.
 */
export function verifyEstimatedParams(
  spec: ModelArchitectureSpec,
  tolerancePct = 0.05,
): { readonly ok: boolean; readonly actual: number; readonly declared: number; readonly deviationPct: number } {
  const { total } = countParameters(spec);
  const deviation = Math.abs(total - spec.estimatedParams) / spec.estimatedParams;
  return {
    ok:            deviation <= tolerancePct,
    actual:        total,
    declared:      spec.estimatedParams,
    deviationPct:  deviation,
  };
}

/**
 * Verify that the sizeLabel (e.g. '8B') is honest — the true count should
 * land within ±5% of the numeric interpretation of the label.
 */
export function verifySizeLabel(spec: ModelArchitectureSpec): { readonly ok: boolean; readonly labelParams: number; readonly actualParams: number } {
  const { total } = countParameters(spec);
  const labelParams = parseSizeLabel(spec.sizeLabel);
  const deviation = Math.abs(total - labelParams) / labelParams;
  return {
    ok:           deviation <= 0.05,
    labelParams,
    actualParams: total,
  };
}

function parseSizeLabel(label: string): number {
  const m = label.match(/^(\d+(?:\.\d+)?)\s*([KMBT])$/i);
  if (!m) throw new Error(`param-count: cannot parse size label '${label}'`);
  const n = parseFloat(m[1]!);
  const scale = m[2]!.toUpperCase() === 'K' ? 1e3
              : m[2]!.toUpperCase() === 'M' ? 1e6
              : m[2]!.toUpperCase() === 'B' ? 1e9
              : /* T */                       1e12;
  return n * scale;
}

/** fp16 storage estimate in bytes. */
export function estimateFp16Bytes(total: number): number {
  return total * 2;
}
