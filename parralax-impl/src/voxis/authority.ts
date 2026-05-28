/**
 * VoxisAuthority verification.
 *
 * Per AGENT_AUTHORITY_CHARTER § 2:
 *   - The doctrine block is read on every heartbeat.
 *   - The block's signature is verified against the embedded blockHash.
 *   - If verification fails, the agent halts.
 *
 * This module provides the verification primitive. It does NOT decide what
 * to do on failure (that is the agent's responsibility); it only reports
 * whether the block is intact.
 *
 * IMPORTANT: The signature scheme is intentionally pluggable. The default
 * implementation here is a placeholder that verifies a SHA-256 hash chain.
 * In production this is replaced by an ed25519 (or hardware-attested) verifier.
 * The pluggability is intentional so the test suite can deterministically
 * verify doctrine behaviour without requiring real keys.
 */

import { createHash } from 'node:crypto';
import type { VoxisAuthority } from '../types/voxis.js';
import type { Sha256 } from '../types/common.js';

export interface SignatureVerifier {
  verify(authority: VoxisAuthority): Promise<boolean>;
}

/**
 * Default placeholder verifier — verifies that `signature` is the
 * hex-encoded SHA-256 of `blockHash` concatenated with a constant pepper.
 * Replace in production with ed25519/hardware-attested verification.
 */
export class PlaceholderVerifier implements SignatureVerifier {
  constructor(private readonly pepper: string = 'parralax-placeholder-pepper') {}

  async verify(authority: VoxisAuthority): Promise<boolean> {
    const expected = createHash('sha256')
      .update(authority.blockHash + this.pepper)
      .digest('hex');
    return expected === authority.signature;
  }
}

/** Compute the canonical blockHash for a VoxisAuthority (sans signature). */
export function computeBlockHash(
  authority: Omit<VoxisAuthority, 'signature' | 'blockHash'>,
): Sha256 {
  // Canonical JSON: sorted keys, no whitespace, deterministic.
  const canonical = canonicalJson(authority);
  return createHash('sha256').update(canonical).digest('hex') as Sha256;
}

/**
 * Read the doctrine block, verify the signature, and return a frozen copy.
 *
 * Returns:
 *   { ok: true, authority }  — block is intact and frozen
 *   { ok: false, reason }    — block is corrupt; agent must halt
 */
export async function readDoctrine(
  raw:      VoxisAuthority,
  verifier: SignatureVerifier,
): Promise<
  | { readonly ok: true;  readonly authority: VoxisAuthority }
  | { readonly ok: false; readonly reason: string }
> {
  // 1. Recompute the blockHash and verify it matches.
  const { signature, blockHash, ...rest } = raw;
  const recomputed = computeBlockHash(rest);
  if (recomputed !== blockHash) {
    return { ok: false, reason: 'blockHash mismatch — doctrine block was tampered with' };
  }

  // 2. Verify the signature against the blockHash.
  const ok = await verifier.verify(raw);
  if (!ok) {
    return { ok: false, reason: 'signature verification failed' };
  }

  // 3. Freeze the block. Deep-freeze the entire object graph so no agent
  //    can mutate any field at runtime.
  const frozen = deepFreeze({ ...raw, signature, blockHash });
  return { ok: true, authority: frozen as VoxisAuthority };
}

// ── helpers ──

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => {
    const v = (value as Record<string, unknown>)[k];
    return JSON.stringify(k) + ':' + canonicalJson(v);
  }).join(',') + '}';
}

function deepFreeze<T>(o: T): T {
  if (o === null || typeof o !== 'object') return o;
  if (Object.isFrozen(o)) return o;
  Object.freeze(o);
  for (const k of Object.keys(o)) {
    deepFreeze((o as Record<string, unknown>)[k]);
  }
  return o;
}
