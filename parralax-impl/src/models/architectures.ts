/**
 * The three PARRALAX architecture specs.
 *
 * Per MODEL_ARCHITECTURES.md § 2/3/4:
 *   VATES-8B     — 7.91B params · signal generation      · AUGUR, PROPHET
 *   AUSPEX-14B   — 14.02B params · observation           · VIGIL, CEREBEX
 *   ORACULUM-20B — 19.90B params · council-level         · ARCHON, ARBITER
 *
 * Every field here is doctrine. Changing a value here without a matching
 * charter revision is forbidden by MODEL_ARCHITECTURES § 8.
 *
 * The parameter counts are computed by src/models/param-count.ts and
 * verified against the estimatedParams here in tests. If a spec is
 * altered and the count drifts > 5%, the tests fail.
 */

import type { ModelArchitectureSpec } from './types.js';

// ── VATES-8B — the signal seer ─────────────────────────────────────────────
export const VATES_8B: ModelArchitectureSpec = Object.freeze({
  name:            'VATES-8B',
  sizeLabel:       '8B',
  estimatedParams: 7_915_966_464,      // computed exactly: ~7.92 B (−1.05% from 8B label)

  vocabSize:       32_000,
  dModel:          4_096,
  numLayers:       32,
  numHeads:        32,
  numKvHeads:      32,                 // MHA at this size
  headDim:         128,
  ffnHidden:       14_336,
  maxSeqLen:       8_192,
  ropeBase:        10_000,

  tieEmbedding:    true,
  activation:      'SwiGLU',
  norm:            'RMSNorm',
  normEps:         1e-5,

  targetLatencyMs: 100,
  role:            'signal generation (AUGUR, PROPHET)',
});

// ── AUSPEX-14B — the observer ──────────────────────────────────────────────
export const AUSPEX_14B: ModelArchitectureSpec = Object.freeze({
  name:            'AUSPEX-14B',
  sizeLabel:       '14B',
  estimatedParams: 13_795_742_720,     // computed exactly: ~13.80 B (−1.46% from 14B label)

  vocabSize:       32_000,
  dModel:          5_120,
  numLayers:       40,
  numHeads:        40,
  numKvHeads:      10,                 // GQA 4:1
  headDim:         128,
  ffnHidden:       17_920,
  maxSeqLen:       16_384,
  ropeBase:        500_000,

  tieEmbedding:    true,
  activation:      'SwiGLU',
  norm:            'RMSNorm',
  normEps:         1e-5,

  targetLatencyMs: 500,
  role:            'observation, regime, world model (VIGIL, CEREBEX)',
});

// ── ORACULUM-20B — the oracle ──────────────────────────────────────────────
export const ORACULUM_20B: ModelArchitectureSpec = Object.freeze({
  name:            'ORACULUM-20B',
  sizeLabel:       '20B',
  estimatedParams: 19_700_742_144,     // computed exactly: ~19.70 B (−1.50% from 20B label)

  vocabSize:       32_000,
  dModel:          6_144,
  numLayers:       50,
  numHeads:        48,
  numKvHeads:      8,                  // GQA 6:1
  headDim:         128,
  ffnHidden:       16_384,
  maxSeqLen:       32_768,
  ropeBase:        500_000,

  tieEmbedding:    true,
  activation:      'SwiGLU',
  norm:            'RMSNorm',
  normEps:         1e-5,

  targetLatencyMs: 3_000,
  role:            'council-level reasoning (ARCHON, ARBITER)',
});

/** The full ratified set of PARRALAX architectures. Immutable. */
export const PARRALAX_ARCHITECTURES = Object.freeze({
  'VATES-8B':     VATES_8B,
  'AUSPEX-14B':   AUSPEX_14B,
  'ORACULUM-20B': ORACULUM_20B,
} as const);

export type ArchitectureName = keyof typeof PARRALAX_ARCHITECTURES;

/** Get an architecture by name. Throws if the name is not ratified. */
export function architectureByName(name: string): ModelArchitectureSpec {
  const known = (PARRALAX_ARCHITECTURES as Record<string, ModelArchitectureSpec>)[name];
  if (!known) {
    throw new Error(
      `architectures: no ratified architecture named '${name}'; ` +
      `permitted: ${Object.keys(PARRALAX_ARCHITECTURES).join(', ')}. ` +
      `Adding a new architecture requires a MODEL_ARCHITECTURES.md charter revision.`,
    );
  }
  return known;
}
