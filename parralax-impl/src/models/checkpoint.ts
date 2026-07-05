/**
 * Checkpoint loader — the boundary between manifest and weights.
 *
 * Per MODEL_WEIGHTS_DOCTRINE:
 *   - No weights load without a matching manifest hash.
 *   - The manifest is the contract; the loader enforces it.
 *   - Third-party model hubs are forbidden.
 *   - Weights live on operator-controlled block storage.
 *
 * This module defines the CheckpointLoader interface. The default in-tree
 * implementation is a MissingLoader that throws NotImplementedError for
 * every load — the scaffold does not ship a real checkpoint loader
 * because that requires either a filesystem + tensor library binding
 * (safetensors, GGUF, etc.) or a real block-storage client. Both are
 * per-deployment concerns.
 *
 * When the operator adds a real loader (safetensors, GGUF, etc.), it
 * implements CheckpointLoader with the same signature and passes the
 * ChronoWriter through so every load writes a receipt.
 */

import { createHash } from 'node:crypto';

import type {
  ModelManifest,
  ModelDescriptor,
  ManifestValidation,
} from './types.js';
import { validateManifest } from './types.js';
import { architectureByName } from './architectures.js';
import { describeModel } from './init.js';
import type { ChronoWriter } from '../chrono/receipt.js';
import type { Sha256 } from '../types/common.js';

// ── Errors ─────────────────────────────────────────────────────────────────
export class ModelLoadError extends Error {
  constructor(message: string) {
    super(`checkpoint: ${message}`);
    this.name = 'ModelLoadError';
  }
}
export class NotImplementedError extends Error {
  constructor(op: string) {
    super(`checkpoint: ${op} not implemented in the default scaffold — supply a real loader per SECURITY.md`);
    this.name = 'NotImplementedError';
  }
}

// ── Load-attempt result ───────────────────────────────────────────────────
export interface LoadedModel {
  readonly manifest:   ModelManifest;
  readonly descriptor: ModelDescriptor;
  /** Opaque token the caller uses to invoke the model. Format is loader-defined. */
  readonly handle:     unknown;
}

// ── The loader contract ───────────────────────────────────────────────────
export interface CheckpointLoader {
  /** Load a model given its manifest. Verifies weightsHash against on-disk bytes. */
  load(manifest: ModelManifest, opts?: { chrono?: ChronoWriter; chainId?: string }): Promise<LoadedModel>;
}

// ── The scaffold-default loader — always throws ───────────────────────────
//
// Deliberately throws for every operation. Prevents accidental use of an
// unconfigured loader in any code path. The operator supplies a real
// implementation for their deployment.
export class MissingLoader implements CheckpointLoader {
  async load(_manifest: ModelManifest): Promise<LoadedModel> {
    throw new NotImplementedError('load');
  }
}

// ── Pre-load validation — always runs, regardless of loader ──────────────

/**
 * Verify a manifest is structurally complete AND its declared spec/params
 * match the ratified architecture. Callers invoke this before load; the
 * loader also invokes it.
 *
 * NB: this function does NOT read the weights bytes. Verifying the weights
 * hash against disk is the loader's job (the loader has the byte stream).
 */
export function prepareLoad(manifest: ModelManifest): ManifestValidation {
  const structural = validateManifest(manifest);
  if (!structural.valid) return structural;

  // Confirm the manifest references a ratified architecture.
  try {
    const spec = architectureByName(manifest.modelName);
    // Confirm the declared totalParams roughly matches the spec.
    const desc = describeModel(spec);
    const deviation = Math.abs(desc.totalParams - manifest.totalParams) / desc.totalParams;
    if (deviation > 0.05) {
      return {
        valid: false,
        errors: [
          `manifest.totalParams (${manifest.totalParams}) deviates from the ratified spec ` +
          `(${desc.totalParams}) by ${(deviation * 100).toFixed(2)}%; exceeds 5% tolerance`,
        ],
      };
    }
  } catch (e) {
    return { valid: false, errors: [e instanceof Error ? e.message : String(e)] };
  }

  return { valid: true, errors: [] };
}

/** Compute the SHA-256 of a bytes buffer. Loader uses this to verify weights. */
export function sha256Of(bytes: Uint8Array): Sha256 {
  return createHash('sha256').update(bytes).digest('hex') as Sha256;
}
