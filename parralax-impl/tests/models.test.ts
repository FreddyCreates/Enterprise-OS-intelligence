import { describe, it, expect } from 'vitest';

import {
  VATES_8B,
  AUSPEX_14B,
  ORACULUM_20B,
  PARRALAX_ARCHITECTURES,
  architectureByName,
} from '../src/models/architectures.js';
import {
  countParameters,
  verifyEstimatedParams,
  verifySizeLabel,
  estimateFp16Bytes,
} from '../src/models/param-count.js';
import {
  enumerateTensorDescriptors,
  describeModel,
  verifyDescriptorTotal,
} from '../src/models/init.js';
import {
  MissingLoader,
  NotImplementedError as CheckpointNotImplementedError,
  prepareLoad,
  sha256Of,
} from '../src/models/checkpoint.js';
import type { ModelManifest } from '../src/models/types.js';
import { validateManifest } from '../src/models/types.js';
import type {
  Sha256,
  Iso8601,
  PrincipalId,
  Signature,
} from '../src/types/common.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function goodManifest(overrides: Partial<ModelManifest> = {}): ModelManifest {
  const desc = describeModel(VATES_8B);
  return {
    modelName:        'VATES-8B',
    specHash:         ('a'.repeat(64)) as Sha256,
    weightsHash:      ('b'.repeat(64)) as Sha256,
    totalParams:      desc.totalParams,
    weightsLocation:  '/mnt/operator-storage/models/vates-8b/weights.safetensors',
    foundationModelHash: null,
    parentManifestHash:  null,
    trainingData: {
      sourceManifestHash:  ('c'.repeat(64)) as Sha256,
      licenceAttestation:  'Apache 2.0 + operator custom TOS',
      consentPosture:      'public-dataset',
      piiRedactionSummary: 'PII stripped via named entity redaction pass',
      reproducibilityHash: ('d'.repeat(64)) as Sha256,
    },
    trainingRecipe: {
      optimiser:           'AdamW',
      peakLearningRate:    3e-4,
      warmupSteps:         2000,
      batchSizeTokens:     4_000_000,
      totalTrainingTokens: 2_000_000_000_000,
      gradClip:            1.0,
      hyperparametersHash: ('e'.repeat(64)) as Sha256,
    },
    evaluationResults: [],
    sunset:            [{ kind: 'time-based', expiresAt: '2027-01-01T00:00:00.000Z' as Iso8601 }],
    registeredAt:      '2026-07-01T00:00:00.000Z' as Iso8601,
    registeredBy:      'operator' as PrincipalId,
    councilSigners:    ['council-1', 'council-2', 'council-3'].map((s) => s as PrincipalId),
    signatures:        ['sig-op', 'sig-1', 'sig-2', 'sig-3'].map((s) => s as Signature),
    ...overrides,
  };
}

// ── Parameter counting ─────────────────────────────────────────────────────

describe('Parameter counting — the three ratified architectures', () => {
  it('VATES-8B lands within ±5% of its 8B label', () => {
    const v = verifySizeLabel(VATES_8B);
    expect(v.ok).toBe(true);
    expect(v.actualParams).toBeGreaterThan(7.5e9);
    expect(v.actualParams).toBeLessThan(8.5e9);
  });

  it('AUSPEX-14B lands within ±5% of its 14B label', () => {
    const v = verifySizeLabel(AUSPEX_14B);
    expect(v.ok).toBe(true);
    expect(v.actualParams).toBeGreaterThan(13.3e9);
    expect(v.actualParams).toBeLessThan(14.7e9);
  });

  it('ORACULUM-20B lands within ±5% of its 20B label', () => {
    const v = verifySizeLabel(ORACULUM_20B);
    expect(v.ok).toBe(true);
    expect(v.actualParams).toBeGreaterThan(19e9);
    expect(v.actualParams).toBeLessThan(21e9);
  });

  it('each spec\'s declared estimatedParams matches its true count within ±5%', () => {
    for (const spec of Object.values(PARRALAX_ARCHITECTURES)) {
      const check = verifyEstimatedParams(spec);
      expect(check.ok).toBe(true);
      // Deviation should be < 1% given we computed the estimates ourselves.
      expect(check.deviationPct).toBeLessThan(0.01);
    }
  });

  it('parameter counts strictly increase with model size', () => {
    const v = countParameters(VATES_8B).total;
    const a = countParameters(AUSPEX_14B).total;
    const o = countParameters(ORACULUM_20B).total;
    expect(a).toBeGreaterThan(v);
    expect(o).toBeGreaterThan(a);
  });

  it('fp16 storage estimates are reasonable multiples of parameter count', () => {
    for (const spec of Object.values(PARRALAX_ARCHITECTURES)) {
      const { total } = countParameters(spec);
      const bytes = estimateFp16Bytes(total);
      expect(bytes).toBe(total * 2);
    }
  });
});

// ── Architecture immutability ──────────────────────────────────────────────

describe('Architecture registry', () => {
  it('exposes exactly three ratified architectures', () => {
    const keys = Object.keys(PARRALAX_ARCHITECTURES);
    expect(keys).toEqual(['VATES-8B', 'AUSPEX-14B', 'ORACULUM-20B']);
  });

  it('architectureByName returns the ratified spec', () => {
    expect(architectureByName('VATES-8B').name).toBe('VATES-8B');
    expect(architectureByName('AUSPEX-14B').name).toBe('AUSPEX-14B');
    expect(architectureByName('ORACULUM-20B').name).toBe('ORACULUM-20B');
  });

  it('architectureByName throws for unratified names', () => {
    expect(() => architectureByName('VATES-3B')).toThrow(/no ratified architecture/);
    expect(() => architectureByName('gpt-42')).toThrow(/no ratified architecture/);
  });

  it('each architecture is frozen (immutable at runtime)', () => {
    expect(Object.isFrozen(VATES_8B)).toBe(true);
    expect(Object.isFrozen(AUSPEX_14B)).toBe(true);
    expect(Object.isFrozen(ORACULUM_20B)).toBe(true);
    expect(Object.isFrozen(PARRALAX_ARCHITECTURES)).toBe(true);
  });

  it('all three specs use SwiGLU + RMSNorm + tied embedding', () => {
    for (const spec of Object.values(PARRALAX_ARCHITECTURES)) {
      expect(spec.activation).toBe('SwiGLU');
      expect(spec.norm).toBe('RMSNorm');
      expect(spec.tieEmbedding).toBe(true);
    }
  });

  it('GQA groups: VATES is MHA (1:1); AUSPEX is 4:1; ORACULUM is 6:1', () => {
    expect(VATES_8B.numHeads / VATES_8B.numKvHeads).toBe(1);
    expect(AUSPEX_14B.numHeads / AUSPEX_14B.numKvHeads).toBe(4);
    expect(ORACULUM_20B.numHeads / ORACULUM_20B.numKvHeads).toBe(6);
  });
});

// ── Tensor descriptors ─────────────────────────────────────────────────────

describe('Tensor descriptor enumeration', () => {
  it('descriptor count matches counter-derived total for every architecture', () => {
    for (const spec of Object.values(PARRALAX_ARCHITECTURES)) {
      const v = verifyDescriptorTotal(spec);
      expect(v.matches).toBe(true);
      expect(v.counterTotal).toBe(v.enumeratedTotal);
    }
  });

  it('produces the expected number of tensors per architecture', () => {
    // For SwiGLU + tied embedding: per-layer = 1 attn_norm + 4 attn + 1 ffn_norm + 3 ffn = 9
    // Plus: 1 embedding + 1 final_norm = 2
    // Total: 9 * layers + 2
    for (const spec of Object.values(PARRALAX_ARCHITECTURES)) {
      const ts = enumerateTensorDescriptors(spec);
      const expected = 9 * spec.numLayers + 2;
      expect(ts.length).toBe(expected);
    }
  });

  it('descriptors are grouped correctly', () => {
    const ts = enumerateTensorDescriptors(VATES_8B);
    const groups = new Set(ts.map((t) => t.group));
    expect(groups.has('embedding')).toBe(true);
    expect(groups.has('attention')).toBe(true);
    expect(groups.has('ffn')).toBe(true);
    expect(groups.has('norm')).toBe(true);
  });

  it('descriptors are frozen (immutable)', () => {
    const ts = enumerateTensorDescriptors(VATES_8B);
    expect(Object.isFrozen(ts)).toBe(true);
  });
});

// ── DOCTRINE — no fake weights ─────────────────────────────────────────────

describe('DOCTRINE — the module produces DESCRIPTORS, never tensor data', () => {
  it('describeModel returns descriptors only; no numeric tensor data field', () => {
    const d = describeModel(VATES_8B);
    // Ensure no fields called weights / data / tensors_data / values.
    expect('weights' in d).toBe(false);
    expect('data' in d).toBe(false);
    expect('values' in d).toBe(false);
    // Positive assertion: `tensors` exists and is a descriptor list.
    expect(Array.isArray(d.tensors)).toBe(true);
    for (const t of d.tensors) {
      expect('shape' in t).toBe(true);
      expect('name' in t).toBe(true);
      // A descriptor MUST NOT carry actual tensor data.
      expect('data' in t).toBe(false);
      expect('values' in t).toBe(false);
    }
  });

  it('init module exports NO function that produces tensor bytes', async () => {
    const mod = await import('../src/models/init.js');
    // Names that would suggest producing actual data.
    const forbiddenNames = [
      'randomInit', 'generateWeights', 'produceTensorData',
      'writeTensorsToDisk', 'materialise', 'materialize',
      'createWeights', 'trainWeights',
    ];
    for (const n of forbiddenNames) {
      expect(n in mod).toBe(false);
    }
  });
});

// ── Manifest validation ────────────────────────────────────────────────────

describe('ModelManifest validation', () => {
  it('a fully-populated manifest is valid', () => {
    const v = validateManifest(goodManifest());
    expect(v.valid).toBe(true);
    expect(v.errors).toEqual([]);
  });

  it('rejects a manifest without weightsHash', () => {
    const v = validateManifest(goodManifest({ weightsHash: '' as Sha256 }));
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('weightsHash'))).toBe(true);
  });

  it('rejects a manifest without training-data provenance', () => {
    const bad = goodManifest();
    (bad as unknown as { trainingData: unknown }).trainingData = undefined;
    const v = validateManifest(bad);
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('trainingData'))).toBe(true);
  });

  it('rejects a manifest without a sunset condition', () => {
    const v = validateManifest(goodManifest({ sunset: [] }));
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('sunset'))).toBe(true);
  });

  it('rejects a manifest whose weightsLocation is a public URL', () => {
    const v = validateManifest(goodManifest({ weightsLocation: 'https://huggingface.co/some-model/weights' }));
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('public URL'))).toBe(true);
  });

  it('rejects a manifest with no signatures', () => {
    const v = validateManifest(goodManifest({ signatures: [] }));
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('signature'))).toBe(true);
  });
});

// ── Loader ─────────────────────────────────────────────────────────────────

describe('CheckpointLoader — MissingLoader always throws', () => {
  it('the default MissingLoader refuses every load', async () => {
    const loader = new MissingLoader();
    await expect(loader.load(goodManifest())).rejects.toBeInstanceOf(CheckpointNotImplementedError);
  });

  it('prepareLoad accepts a well-formed manifest for a ratified spec', () => {
    const r = prepareLoad(goodManifest());
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('prepareLoad rejects a manifest for an unratified architecture', () => {
    const bad = goodManifest({ modelName: 'MADEUP-42B' });
    const r = prepareLoad(bad);
    expect(r.valid).toBe(false);
  });

  it('prepareLoad rejects a manifest whose totalParams deviates > 5% from the spec', () => {
    const bad = goodManifest({ totalParams: 3_000_000_000 });   // 3B declared for VATES-8B
    const r = prepareLoad(bad);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('deviates from the ratified spec'))).toBe(true);
  });

  it('sha256Of is deterministic', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const a = sha256Of(bytes);
    const b = sha256Of(bytes);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── DOCTRINE — no third-party hubs ─────────────────────────────────────────

describe('DOCTRINE — third-party hubs are forbidden', () => {
  it('manifest validation rejects http:// weightsLocation', () => {
    const v = validateManifest(goodManifest({ weightsLocation: 'http://example.com/weights' }));
    expect(v.valid).toBe(false);
  });

  it('manifest validation rejects https:// weightsLocation', () => {
    const v = validateManifest(goodManifest({ weightsLocation: 'https://huggingface.co/repo/model.safetensors' }));
    expect(v.valid).toBe(false);
  });

  it('local paths are accepted', () => {
    const v = validateManifest(goodManifest({ weightsLocation: '/mnt/vault/vates-8b/weights.safetensors' }));
    expect(v.valid).toBe(true);
  });
});
