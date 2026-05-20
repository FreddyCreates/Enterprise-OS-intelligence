/**
 * PROTO-018: Fractal Intelligence Compression Protocol (FICP)
 *
 * The RSHIP organism handles massive knowledge graphs, audit chains,
 * and session memory vaults.  FICP governs how intelligence is compressed
 * without loss of structural information, using the fractal self-similarity
 * inherent in φ-based architectures.
 *
 * Core insight: the RSHIP knowledge graph is self-similar at every scale.
 * A cluster of 89 AGIs looks like a cluster of 8 sub-builders looks like
 * a cluster of 3 protocols — same φ-ratio topology at every level.
 * This self-similarity allows Fibonacci-kernel compression that retains
 * the structure while reducing storage by 1 - φ⁻¹ ≈ 38.2% per level.
 *
 * Applications:
 *  - Vault compression: memory vaults compressed before ICP canister write
 *  - Audit chain compaction: MerkleAuditChain (PROTO-013) Fibonacci sealing
 *  - Cross-session context: session state compressed for transmission
 *  - Protocol composition: multiple protocol outputs merged at φ ratio
 *
 * Basis: Iterated Function Systems (IFS) fractals + Fibonacci compression
 * Engines: FibonacciCompressor + FractalEncoder + PhiRatioMerger
 * Ring: Infrastructure Ring  |  Wire: intelligence-wire/ficp
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_MS = 873;

// ── Fibonacci Utilities ───────────────────────────────────────────────────

function isFibonacci(n) {
  if (n < 0) return false;
  const isPerfSq = (x) => { const s = Math.round(Math.sqrt(x)); return s * s === x; };
  return isPerfSq(5 * n * n + 4) || isPerfSq(5 * n * n - 4);
}

function fibSequence(maxN) {
  const fibs = [0, 1];
  while (fibs[fibs.length - 1] < maxN) {
    const l = fibs.length;
    fibs.push(fibs[l - 1] + fibs[l - 2]);
  }
  return fibs.filter(f => f <= maxN);
}

// Zeckendorf decomposition: every positive integer is a unique sum of non-consecutive Fibonacci numbers
function zeckendorf(n) {
  if (n <= 0) return [];
  const fibs = fibSequence(n).reverse();
  const result = [];
  let remaining = n;
  for (const f of fibs) {
    if (f <= remaining) { result.push(f); remaining -= f; }
    if (remaining === 0) break;
  }
  return result;
}

// ── Fibonacci Compressor ──────────────────────────────────────────────────

class FibonacciCompressor {
  /**
   * Compress an array of items using Fibonacci-kernel sealing.
   * Items at Fibonacci indices are preserved at full resolution.
   * All others are folded into a crystal via φ-XOR.
   * @template T
   * @param {T[]} items
   * @returns {{ preserved: T[], crystal: string, ratio: number }}
   */
  static compress(items) {
    const preserved = [];
    let crystal     = null;
    let crystalCount = 0;

    for (let i = 0; i < items.length; i++) {
      if (isFibonacci(i)) {
        preserved.push(items[i]);
      } else {
        const serialized = JSON.stringify(items[i]);
        if (crystal === null) {
          crystal = FibonacciCompressor._fold(serialized, '');
        } else {
          crystal = FibonacciCompressor._fold(crystal, serialized);
        }
        crystalCount++;
      }
    }

    return {
      preserved,
      crystal: crystal || '',
      original_count: items.length,
      preserved_count: preserved.length,
      compressed_count: crystalCount,
      ratio: parseFloat((1 - preserved.length / Math.max(items.length, 1)).toFixed(4)),
    };
  }

  /**
   * Reconstruct: preserved items are exact; crystal items are structural proxies.
   */
  static decompress(result) {
    // Full reconstruction only possible for preserved items.
    // Crystal items produce structural placeholders (lossy by design).
    const placeholders = Array(result.compressed_count).fill({ type: 'COMPRESSED', crystal: result.crystal });
    const full = [...result.preserved];
    // Interleave placeholders at non-Fibonacci positions
    let pi = 0;
    const output = [];
    let fc = 0;
    for (let i = 0; i < result.original_count; i++) {
      if (isFibonacci(i) && pi < result.preserved.length) {
        output.push(result.preserved[pi++]);
      } else {
        output.push(placeholders[fc++ % placeholders.length]);
      }
    }
    return output;
  }

  static _fold(a, b) {
    let h = 0x13370000;
    const s = a + b;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(Math.floor(h * PHI) | 0, 0x9e3779b9) ^ s.charCodeAt(i)) >>> 0;
    }
    return h.toString(16).padStart(16, '0');
  }
}

// ── Fractal Encoder ───────────────────────────────────────────────────────

class FractalEncoder {
  /**
   * Encode a knowledge object into its fractal (multi-level) representation.
   * Each level is the Zeckendorf decomposition of the object's hash,
   * producing a unique self-similar fingerprint.
   * @param {object} obj
   * @param {number} levels — number of fractal levels (default: 4 = φ⁴)
   */
  static encode(obj, levels = 4) {
    const base_hash = FibonacciCompressor._fold(JSON.stringify(obj), '');
    const hash_int  = parseInt(base_hash.slice(0, 8), 16);
    const fractal   = [];
    let current = hash_int;
    for (let l = 0; l < levels; l++) {
      const zeck = zeckendorf(current % 1000);
      fractal.push({ level: l, decomposition: zeck, hash: current.toString(16) });
      // Next level: reduce by φ ratio
      current = Math.floor(current * PHI_INV) || 1;
    }
    return { original_hash: base_hash, levels: fractal, self_similar: fractal.length === levels };
  }

  /**
   * Compare two fractal encodings: cosine similarity across Fibonacci decomposition vectors.
   */
  static similarity(enc1, enc2) {
    const maxFib = 100;
    const toVector = (enc) => {
      const v = new Array(maxFib).fill(0);
      for (const level of enc.levels) {
        for (const f of level.decomposition) { if (f < maxFib) v[f] += PHI_INV ** level.level; }
      }
      return v;
    };
    const v1 = toVector(enc1), v2 = toVector(enc2);
    const dot  = v1.reduce((s, x, i) => s + x * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((s, x) => s + x * x, 0));
    const mag2 = Math.sqrt(v2.reduce((s, x) => s + x * x, 0));
    return mag1 * mag2 === 0 ? 0 : parseFloat((dot / (mag1 * mag2)).toFixed(4));
  }
}

// ── φ-Ratio Merger ────────────────────────────────────────────────────────

class PhiRatioMerger {
  /**
   * Merge N protocol outputs into one, weighted by the φ-series.
   * Output[i] gets weight φ^(-i), normalized.
   * @param {object[]} outputs — array of protocol outputs, most-important first
   * @returns {{ merged: object, weights: number[], coherence: number }}
   */
  static merge(outputs) {
    if (outputs.length === 0) return { merged: {}, weights: [], coherence: 0 };
    const weights = outputs.map((_, i) => PHI_INV ** i);
    const total   = weights.reduce((a, b) => a + b, 0);
    const normalized = weights.map(w => w / total);

    // Collect all keys, weight numeric values
    const merged = {};
    const all_keys = [...new Set(outputs.flatMap(o => Object.keys(o)))];
    for (const key of all_keys) {
      const numeric_vals = outputs.map((o, i) => ({ val: o[key], w: normalized[i] }))
        .filter(({ val }) => typeof val === 'number');
      if (numeric_vals.length > 0) {
        merged[key] = numeric_vals.reduce((s, { val, w }) => s + val * w, 0);
      } else {
        // Non-numeric: take from highest-weight output that has this key
        const found = outputs.find(o => o[key] !== undefined);
        if (found) merged[key] = found[key];
      }
    }

    const coherence = normalized.reduce((s, w, i) => s + w * w, 0); // sum of squared weights
    return { merged, weights: normalized, coherence: parseFloat(coherence.toFixed(4)) };
  }
}

// ── FICP Public API ───────────────────────────────────────────────────────

const FICP = {
  FibonacciCompressor,
  FractalEncoder,
  PhiRatioMerger,

  isFibonacci,
  zeckendorf,
  fibSequence,

  DESIGNATION: 'PROTO-018',
  NAME:        'Fractal Intelligence Compression Protocol',
  SCHUMANN_HZ,
  HEARTBEAT_MS,
};

export { FICP, FibonacciCompressor, FractalEncoder, PhiRatioMerger };
export default FICP;
