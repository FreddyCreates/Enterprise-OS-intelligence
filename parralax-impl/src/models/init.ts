/**
 * Model initialisation — tensor descriptors, never tensor data.
 *
 * IMPORTANT: This module produces DESCRIPTORS of the tensors a trained
 * model would contain. It does NOT produce trained weights. It does NOT
 * produce the numeric tensor data at all — that lives on operator-
 * controlled block storage, referenced by the ModelManifest.
 *
 * The distinction is doctrinal (see MODEL_WEIGHTS_DOCTRINE § 3 / § 4):
 *   - A trained model = spec + weights + manifest + loader.
 *   - This module produces the "spec" side, in enumerable form.
 *   - src/models/checkpoint.ts is the loader that binds real weight bytes.
 *   - A real training run produces the "weights" side.
 *
 * If you find yourself wanting to produce actual tensor data here, stop.
 * That would violate the doctrine (fake track record, weights in a repo).
 * Random init producing 40 GB of file data does not become "trained
 * weights" by being labelled cheerfully; it is bytes without provenance.
 *
 * What this module DOES do: given a ModelArchitectureSpec, emit the full
 * list of TensorDescriptors a trained checkpoint would need to fill,
 * with their names, shapes, dtypes, and grouping tags. Downstream tools
 * (a checkpoint format converter, a memory-planning tool, a training
 * script) can consume this list without any tensor data being present.
 */

import type {
  ModelArchitectureSpec,
  ModelDescriptor,
  TensorDescriptor,
} from './types.js';
import { countParameters, estimateFp16Bytes } from './param-count.js';

/**
 * Enumerate the tensor descriptors that would fill a trained checkpoint
 * for this architecture. Descriptors are returned in a stable order so
 * the same spec always produces the same descriptor sequence.
 */
export function enumerateTensorDescriptors(
  spec: ModelArchitectureSpec,
  dtype: TensorDescriptor['dtype'] = 'fp16',
): ReadonlyArray<TensorDescriptor> {
  const out: TensorDescriptor[] = [];

  // Embedding
  out.push({
    name:  'tok_embedding.weight',
    shape: [spec.vocabSize, spec.dModel],
    dtype,
    group: 'embedding',
  });

  // Per-layer
  for (let i = 0; i < spec.numLayers; i++) {
    const p = `layer.${i}`;

    // Attention norm
    out.push({ name: `${p}.attn_norm.weight`, shape: [spec.dModel], dtype, group: 'norm' });

    // Q/K/V/O projections (GQA-aware)
    out.push({ name: `${p}.attn.q_proj.weight`, shape: [spec.dModel, spec.dModel], dtype, group: 'attention' });
    out.push({ name: `${p}.attn.k_proj.weight`, shape: [spec.numKvHeads * spec.headDim, spec.dModel], dtype, group: 'attention' });
    out.push({ name: `${p}.attn.v_proj.weight`, shape: [spec.numKvHeads * spec.headDim, spec.dModel], dtype, group: 'attention' });
    out.push({ name: `${p}.attn.o_proj.weight`, shape: [spec.dModel, spec.dModel], dtype, group: 'attention' });

    // FFN norm
    out.push({ name: `${p}.ffn_norm.weight`, shape: [spec.dModel], dtype, group: 'norm' });

    // SwiGLU FFN: gate + up + down
    if (spec.activation === 'SwiGLU') {
      out.push({ name: `${p}.ffn.gate_proj.weight`, shape: [spec.ffnHidden, spec.dModel], dtype, group: 'ffn' });
      out.push({ name: `${p}.ffn.up_proj.weight`,   shape: [spec.ffnHidden, spec.dModel], dtype, group: 'ffn' });
      out.push({ name: `${p}.ffn.down_proj.weight`, shape: [spec.dModel, spec.ffnHidden], dtype, group: 'ffn' });
    } else {
      // Vanilla FFN: up + down
      out.push({ name: `${p}.ffn.up_proj.weight`,   shape: [spec.ffnHidden, spec.dModel], dtype, group: 'ffn' });
      out.push({ name: `${p}.ffn.down_proj.weight`, shape: [spec.dModel, spec.ffnHidden], dtype, group: 'ffn' });
    }
  }

  // Final norm
  out.push({ name: 'final_norm.weight', shape: [spec.dModel], dtype, group: 'norm' });

  // LM head — only if not tied
  if (!spec.tieEmbedding) {
    out.push({
      name:  'lm_head.weight',
      shape: [spec.vocabSize, spec.dModel],
      dtype,
      group: 'output',
    });
  }

  return Object.freeze(out);
}

/**
 * Build the full ModelDescriptor for a spec — includes the tensor list
 * plus the aggregate metrics (total params, estimated fp16 bytes).
 */
export function describeModel(
  spec: ModelArchitectureSpec,
  dtype: TensorDescriptor['dtype'] = 'fp16',
): ModelDescriptor {
  const tensors = enumerateTensorDescriptors(spec, dtype);
  const breakdown = countParameters(spec);
  return Object.freeze({
    spec,
    tensors,
    totalParams:          breakdown.total,
    estimatedFp16Bytes:   estimateFp16Bytes(breakdown.total),
  });
}

/**
 * Verify that the descriptor-derived total (summing shape.reduce(*)) matches
 * the count-parameters-from-spec total. Any discrepancy indicates a bug in
 * either the enumerator or the counter — a test invokes this to catch drift.
 */
export function verifyDescriptorTotal(spec: ModelArchitectureSpec): {
  readonly counterTotal: number;
  readonly enumeratedTotal: number;
  readonly matches: boolean;
} {
  const counterTotal = countParameters(spec).total;
  let enumeratedTotal = 0;
  for (const t of enumerateTensorDescriptors(spec)) {
    let n = 1;
    for (const d of t.shape) n *= d;
    enumeratedTotal += n;
  }
  return {
    counterTotal,
    enumeratedTotal,
    matches: counterTotal === enumeratedTotal,
  };
}
