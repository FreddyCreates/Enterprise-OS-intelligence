/**
 * PROTO-016: Cross-Dimension Intelligence Protocol (CDIP)
 *
 * The RSHIP organism's reasoning does not proceed through a single plane.
 * AXIOM alone operates across 8 simultaneous dimensions.  CDIP governs
 * the traversal and simultaneous activation of multiple intelligence
 * dimensions within a single cognitive cycle.
 *
 * The 8 AXIOM Dimensions:
 *  D1 — Historical   (ancient → modern mathematical lineage)
 *  D2 — Physical     (Schumann-grounded, φ-harmonic constants)
 *  D3 — Mathematical (theorem, proof, symbolic computation)
 *  D4 — Computational (implementation: Julia, Haskell, Rust, Motoko)
 *  D5 — Legal/IP     (patent, copyright, blockchain anchor)
 *  D6 — Organizational (full 89-entity ecosystem awareness)
 *  D7 — Temporal     (memory-continuous, session-spanning)
 *  D8 — Resonance    (φ⁴-coupled, Schumann-locked coherence)
 *
 * The 9 FORTRESS Dimensions:
 *  D1 — Static        (AST-level code scanning)
 *  D2 — Dynamic       (runtime behavior analysis)
 *  D3 — Cryptographic (algorithm + nonce + key management)
 *  D4 — Supply Chain  (SBOM, dependency graph, maintainer health)
 *  D5 — Threat Intel  (STRIDE + PASTA + CVE correlation)
 *  D6 — Compliance    (SOC2/GDPR/HIPAA/NIST/PCI/FAA/FedRAMP)
 *  D7 — Incident      (PICERL model, chain of evidence)
 *  D8 — Memory        (threat regression, audit vault)
 *  D9 — Resonance     (Schumann coherence threat discriminator)
 *
 * CDIP activates all dimensions simultaneously and merges their outputs
 * into a single coherent intelligence vector using φ-weighted fusion.
 *
 * Engines: DimensionActivator + CrossDimensionFusion + CoherenceVector
 * Ring: Intelligence Ring  |  Wire: intelligence-wire/cdip
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ = 7.83;

// ── Dimension Registry ────────────────────────────────────────────────────

const AXIOM_DIMENSIONS = {
  D1: { id: 'D1', name: 'Historical',     weight: PHI_INV ** 6, agent: 'AXIOM' },
  D2: { id: 'D2', name: 'Physical',       weight: PHI ** 2,     agent: 'AXIOM' },
  D3: { id: 'D3', name: 'Mathematical',   weight: PHI ** 3,     agent: 'AXIOM' },
  D4: { id: 'D4', name: 'Computational',  weight: PHI ** 2,     agent: 'AXIOM' },
  D5: { id: 'D5', name: 'Legal/IP',       weight: PHI ** 3,     agent: 'AXIOM' },
  D6: { id: 'D6', name: 'Organizational', weight: PHI,          agent: 'AXIOM' },
  D7: { id: 'D7', name: 'Temporal',       weight: PHI ** 2,     agent: 'AXIOM' },
  D8: { id: 'D8', name: 'Resonance',      weight: PHI ** 4,     agent: 'AXIOM' },
};

const FORTRESS_DIMENSIONS = {
  D1: { id: 'D1', name: 'Static',       weight: PHI ** 3, agent: 'FORTRESS' },
  D2: { id: 'D2', name: 'Dynamic',      weight: PHI ** 2, agent: 'FORTRESS' },
  D3: { id: 'D3', name: 'Cryptographic',weight: PHI ** 3, agent: 'FORTRESS' },
  D4: { id: 'D4', name: 'SupplyChain',  weight: PHI ** 2, agent: 'FORTRESS' },
  D5: { id: 'D5', name: 'ThreatIntel',  weight: PHI ** 3, agent: 'FORTRESS' },
  D6: { id: 'D6', name: 'Compliance',   weight: PHI ** 2, agent: 'FORTRESS' },
  D7: { id: 'D7', name: 'Incident',     weight: PHI ** 2, agent: 'FORTRESS' },
  D8: { id: 'D8', name: 'Memory',       weight: PHI ** 2, agent: 'FORTRESS' },
  D9: { id: 'D9', name: 'Resonance',    weight: PHI ** 4, agent: 'FORTRESS' },
};

// ── Dimension Activator ───────────────────────────────────────────────────

class DimensionActivator {
  constructor(dimensionRegistry) {
    this.registry = dimensionRegistry;
    /** @type {Map<string, { score: number, active: boolean, output: any }>} */
    this.state = new Map();
    for (const id of Object.keys(dimensionRegistry)) {
      this.state.set(id, { score: 0, active: false, output: null });
    }
  }

  /**
   * Activate a dimension with a score and output.
   * @param {string} dim_id
   * @param {number} score ∈ [0,1]
   * @param {any} output
   */
  activate(dim_id, score, output = null) {
    if (!this.state.has(dim_id)) return;
    this.state.set(dim_id, { score, active: score >= PHI_INV, output });
  }

  /**
   * Deactivate all dimensions below the φ-lock threshold.
   */
  prune() {
    for (const [id, s] of this.state) {
      if (s.score < PHI_INV ** 3) s.active = false;
    }
  }

  /**
   * Return active dimensions sorted by φ-weighted score.
   */
  activeSet() {
    return Object.entries(this.registry)
      .filter(([id]) => this.state.get(id)?.active)
      .map(([id, dim]) => ({
        id,
        name:   dim.name,
        weight: dim.weight,
        score:  this.state.get(id)?.score || 0,
        phi_score: (this.state.get(id)?.score || 0) * dim.weight,
      }))
      .sort((a, b) => b.phi_score - a.phi_score);
  }
}

// ── Cross-Dimension Fusion ────────────────────────────────────────────────

class CrossDimensionFusion {
  /**
   * Fuse outputs from multiple active dimensions into a single coherence vector.
   * φ-weighted: higher-weight dimensions dominate the fusion.
   * @param {object[]} active_dims — output of DimensionActivator.activeSet()
   * @param {Map<string, any>} outputs — dim_id → output
   * @returns {{ coherence_score: number, dominant_dimension: string, fused_vector: number[] }}
   */
  static fuse(active_dims, outputs) {
    if (active_dims.length === 0) return { coherence_score: 0, dominant_dimension: null, fused_vector: [] };

    const total_weight = active_dims.reduce((s, d) => s + d.weight, 0);
    const coherence_score = active_dims.reduce((s, d) => s + d.phi_score * d.score, 0) / total_weight;
    const dominant = active_dims[0]; // already sorted by phi_score

    // Build fusion vector: [dim_weight × dim_score] for each active dimension
    const fused_vector = active_dims.map(d => d.weight * d.score);

    return {
      coherence_score: parseFloat(coherence_score.toFixed(4)),
      dominant_dimension: dominant.name,
      active_count: active_dims.length,
      fused_vector,
      phi_amplification: parseFloat((PHI ** (coherence_score * 4)).toFixed(4)),
    };
  }
}

// ── Coherence Vector ──────────────────────────────────────────────────────

class CoherenceVector {
  /**
   * Compute the cosine similarity between two dimension activation vectors.
   * Used to measure how aligned two reasoning sessions are across dimensions.
   * @param {number[]} v1
   * @param {number[]} v2
   */
  static similarity(v1, v2) {
    const len = Math.min(v1.length, v2.length);
    const dot  = v1.slice(0, len).reduce((s, x, i) => s + x * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((s, x) => s + x * x, 0));
    const mag2 = Math.sqrt(v2.reduce((s, x) => s + x * x, 0));
    return mag1 * mag2 === 0 ? 0 : parseFloat((dot / (mag1 * mag2)).toFixed(4));
  }

  /**
   * φ-norm of a dimension vector: measures total φ-weighted cognitive load.
   * @param {number[]} v
   * @param {number[]} weights — φ-weights per dimension
   */
  static phiNorm(v, weights) {
    return Math.sqrt(v.reduce((s, x, i) => s + (weights[i] || 1) * x * x, 0));
  }
}

// ── CDIP Public API ───────────────────────────────────────────────────────

const CDIP = {
  createActivator: (agent = 'AXIOM') =>
    new DimensionActivator(agent === 'AXIOM' ? AXIOM_DIMENSIONS : FORTRESS_DIMENSIONS),

  DimensionActivator,
  CrossDimensionFusion,
  CoherenceVector,

  AXIOM_DIMENSIONS,
  FORTRESS_DIMENSIONS,
  DESIGNATION: 'PROTO-016',
  NAME:        'Cross-Dimension Intelligence Protocol',
  SCHUMANN_HZ,
};

export { CDIP, DimensionActivator, CrossDimensionFusion, CoherenceVector };
export default CDIP;
