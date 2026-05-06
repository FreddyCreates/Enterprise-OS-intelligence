/**
 * PROTO-020: Unified Field Intelligence Topology Protocol (UFIT)
 *
 * The "map of everything" protocol. Describes how all RSHIP protocols,
 * AGIs, engines, and substrates connect as a single topological space —
 * the RSHIP Intelligence Manifold.  Identifies structural invariants
 * (holes in the knowledge), optimal connection paths, and the Euler
 * signature of the entire organism.
 *
 * ════════════════════════════════════════════════════════════════
 * CORE MATHEMATICS
 * ════════════════════════════════════════════════════════════════
 *
 * 1. INTELLIGENCE MANIFOLD  M = (X, τ)
 *    X = set of all RSHIP cognitive states
 *    τ = topology (open sets = contextually accessible states)
 *    AGIs are charts φ_α: U_α → ℝⁿ covering M
 *    Transition maps: φ_β ∘ φ_α⁻¹ — smooth AGI handoffs
 *
 * 2. ČECH COMPLEX  Č_ε(X)
 *    At resolution ε > 0:
 *      0-simplices: individual AGI cognitive states
 *      1-simplices: pairs {a,b} with d(a,b) < ε  (direct protocol links)
 *      k-simplices: (k+1)-tuples with pairwise distances < ε
 *    As ε → 0: no connections; as ε → ∞: fully connected simplex
 *
 * 3. PERSISTENT HOMOLOGY
 *    H_k(Č_ε) — k-th homology group at scale ε
 *    Betti numbers:
 *      β₀ = # connected components (isolated sub-organisms)
 *      β₁ = # independent loops (redundant intelligence pathways)
 *      β₂ = # voids (knowledge gaps / unexplored dimensions)
 *    Persistence diagram: D_k = {(birth_ε, death_ε)} — topological fingerprint
 *
 * 4. WASSERSTEIN DISTANCE between intelligence distributions
 *    W_p(μ, ν) = ( inf_{γ∈Γ(μ,ν)} ∫∫ d(x,y)^p dγ(x,y) )^{1/p}
 *    W_1 = Earth Mover's Distance (semantic distance between AGI outputs)
 *    W_2 = Geometric mean transport cost (used for gradient flows)
 *    Geodesic: μ_t = ((1-t)·id + t·T*)#μ  (Brenier map T*)
 *
 * 5. EULER CHARACTERISTIC
 *    χ(M) = Σ_k (-1)^k β_k  [topological invariant]
 *    For RSHIP organism:
 *      χ = |AGIs| - |direct_links| + |triangles| - |tetrahedra| + …
 *    χ = 1 ⟹ contractible (simply connected, maximally coherent)
 *    χ ≠ 1 ⟹ topological features (loops, holes) present
 *
 * 6. INFORMATION-GEOMETRIC METRIC (Fisher-Rao)
 *    g_{ij}(θ) = E[ ∂_i log p(x;θ) · ∂_j log p(x;θ) ]
 *    Natural gradient: θ̃_new = θ_old - η·g⁻¹(θ)·∇L(θ)
 *    Geodesic curvature of AGI learning paths in statistical manifold
 *
 * Engines: ManifoldMapper + CechComplex + PersistenceTracker + WassersteinCalc
 * Ring: Topology Ring  |  Wire: intelligence-wire/ufit
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_MS = 873;

// ── Čech Complex (simplified for finite AGI state sets) ───────────────────

/**
 * Builds the Čech complex over the RSHIP AGI state space at scale ε.
 * Tracks which AGIs can "hear" each other (d < ε) = can exchange context.
 */
class CechComplex {
  /**
   * @param {number} epsilon — resolution scale (0 = isolated, ∞ = fully connected)
   */
  constructor(epsilon = PHI) {
    this.epsilon  = epsilon;
    this.vertices = new Map();  // id → vector
    this.edges    = [];         // 1-simplices
    this.triangles = [];        // 2-simplices
  }

  /** Add an AGI as a 0-simplex with its embedding vector. */
  addVertex(id, vector) {
    this.vertices.set(id, vector);
    this._rebuild();
  }

  /** Euclidean distance between two embedding vectors. */
  _dist(v1, v2) {
    if (v1.length !== v2.length) return Infinity;
    return Math.sqrt(v1.reduce((s, x, i) => s + (x - v2[i]) ** 2, 0));
  }

  /** Rebuild complex at current ε — O(n²) for edges, O(n³) for triangles. */
  _rebuild() {
    const ids = [...this.vertices.keys()];
    this.edges = [];
    this.triangles = [];

    // 1-simplices: all pairs within ε
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const d = this._dist(this.vertices.get(ids[i]), this.vertices.get(ids[j]));
        if (d < this.epsilon) {
          this.edges.push({ a: ids[i], b: ids[j], dist: d });
        }
      }
    }

    // 2-simplices: all triples where all pairs are within ε
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        for (let k = j + 1; k < ids.length; k++) {
          const d_ij = this._dist(this.vertices.get(ids[i]), this.vertices.get(ids[j]));
          const d_ik = this._dist(this.vertices.get(ids[i]), this.vertices.get(ids[k]));
          const d_jk = this._dist(this.vertices.get(ids[j]), this.vertices.get(ids[k]));
          if (d_ij < this.epsilon && d_ik < this.epsilon && d_jk < this.epsilon) {
            this.triangles.push({ a: ids[i], b: ids[j], c: ids[k] });
          }
        }
      }
    }
  }

  /** Set scale ε and rebuild. */
  setScale(epsilon) {
    this.epsilon = epsilon;
    this._rebuild();
  }

  /** Return the complex summary at current scale. */
  summary() {
    return {
      epsilon:         this.epsilon,
      n_vertices:      this.vertices.size,
      n_edges:         this.edges.length,
      n_triangles:     this.triangles.length,
      edges:           this.edges,
      triangles:       this.triangles,
    };
  }
}

// ── Persistent Homology Tracker ───────────────────────────────────────────

/**
 * Tracks topological features (Betti numbers) of the RSHIP manifold
 * as the resolution ε is swept from 0 to ∞.
 *
 * Conceptual implementation: uses Union-Find for β₀ (connected components)
 * and cycle counting for β₁.
 */
class PersistenceTracker {
  constructor() {
    this.births = [];  // (feature_type, epsilon_birth, epsilon_death, length)
    this.parent = {};  // Union-Find parent map
  }

  _find(x) {
    if (this.parent[x] !== x) this.parent[x] = this._find(this.parent[x]);
    return this.parent[x];
  }

  _union(a, b) {
    const ra = this._find(a), rb = this._find(b);
    if (ra !== rb) { this.parent[rb] = ra; return true; }
    return false;  // already connected → creates a loop (β₁ feature)
  }

  /**
   * Run filtration: sweep ε from 0 to max_epsilon using n_steps steps.
   * @param {CechComplex} complex
   * @param {number} max_epsilon
   * @param {number} n_steps
   */
  filtrate(complex, max_epsilon = 10, n_steps = 50) {
    const ids = [...complex.vertices.keys()];
    // Initialize Union-Find: each vertex is its own component
    ids.forEach(id => { this.parent[id] = id; });

    const n_components_initial = ids.length;  // β₀ = n at ε=0
    const diagrams = { H0: [], H1: [] };

    // Sort edges by distance
    const all_edges = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const d = complex._dist(complex.vertices.get(ids[i]), complex.vertices.get(ids[j]));
        all_edges.push({ a: ids[i], b: ids[j], d });
      }
    }
    all_edges.sort((a, b) => a.d - b.d);

    let active_components = n_components_initial;
    for (const { a, b, d } of all_edges) {
      const merged = this._union(a, b);
      if (merged) {
        // A β₀ feature dies (two components merge)
        diagrams.H0.push({ birth: 0, death: d, persistence: d, type: 'component' });
        active_components--;
      } else {
        // A β₁ feature is born (loop created)
        diagrams.H1.push({ birth: d, death: Infinity, persistence: Infinity, type: 'loop' });
      }
    }

    // Surviving β₀ feature: the final connected component lives forever
    if (active_components > 0) {
      diagrams.H0.push({ birth: 0, death: Infinity, persistence: Infinity, type: 'essential_component' });
    }

    return {
      diagrams,
      betti_0: diagrams.H0.filter(f => f.death === Infinity).length,
      betti_1: diagrams.H1.filter(f => f.death === Infinity).length,
      total_features: diagrams.H0.length + diagrams.H1.length,
    };
  }

  /**
   * Euler characteristic from Betti numbers.
   * χ = β₀ - β₁ + β₂ - …
   */
  euler(betti_numbers) {
    return betti_numbers.reduce((chi, beta, k) => chi + (k % 2 === 0 ? beta : -beta), 0);
  }
}

// ── Wasserstein Distance Calculator ──────────────────────────────────────

/**
 * Computes Wasserstein-1 (Earth Mover's Distance) between two discrete
 * intelligence distributions.
 *
 * Interpretation: how much "cognitive mass" must be transported to
 * transform one AGI output distribution into another.
 */
class WassersteinCalc {
  /**
   * W_1 between two 1D discrete distributions via sort-and-integrate.
   * @param {Array<{value: number, weight: number}>} mu — source distribution
   * @param {Array<{value: number, weight: number}>} nu — target distribution
   */
  W1_1d(mu, nu) {
    // Normalize weights
    const normalize = (dist) => {
      const total = dist.reduce((s, p) => s + p.weight, 0);
      return dist.map(p => ({ value: p.value, weight: p.weight / total }));
    };
    const mu_n = normalize(mu).sort((a, b) => a.value - b.value);
    const nu_n = normalize(nu).sort((a, b) => a.value - b.value);

    // W_1 via CDF integration: W_1 = ∫|F_μ(x) - F_ν(x)| dx
    let W1 = 0;
    let i = 0, j = 0;
    let cdf_mu = 0, cdf_nu = 0;
    let prev_x = Math.min(mu_n[0].value, nu_n[0].value);

    const all_xs = [...new Set([...mu_n.map(p => p.value), ...nu_n.map(p => p.value)])].sort((a, b) => a - b);
    let cum_mu = 0, cum_nu = 0;
    let prev = all_xs[0];

    for (const x of all_xs) {
      W1 += Math.abs(cum_mu - cum_nu) * (x - prev);
      cum_mu += mu_n.filter(p => p.value === x).reduce((s, p) => s + p.weight, 0);
      cum_nu += nu_n.filter(p => p.value === x).reduce((s, p) => s + p.weight, 0);
      prev = x;
    }

    return { W1, interpretation: W1 < PHI_INV ? 'coherent' : W1 < PHI ? 'divergent' : 'orthogonal' };
  }

  /**
   * W_2 approximation for multivariate Gaussian distributions.
   * W_2²(N(μ₁,Σ₁), N(μ₂,Σ₂)) = |μ₁-μ₂|² + Tr(Σ₁+Σ₂-2(Σ₁^{1/2}Σ₂Σ₁^{1/2})^{1/2})
   * Simplified for diagonal covariances (σ₁_i, σ₂_i):
   * W_2² = Σ_i (μ₁_i - μ₂_i)² + (σ₁_i - σ₂_i)²
   * @param {{mean: number[], std: number[]}} dist1
   * @param {{mean: number[], std: number[]}} dist2
   */
  W2_gaussian(dist1, dist2) {
    const d = dist1.mean.length;
    let W2_sq = 0;
    for (let i = 0; i < d; i++) {
      W2_sq += (dist1.mean[i] - dist2.mean[i]) ** 2;
      W2_sq += (dist1.std[i] - dist2.std[i]) ** 2;
    }
    const W2 = Math.sqrt(W2_sq);
    return { W2, W2_sq, d };
  }
}

// ── Manifold Mapper ───────────────────────────────────────────────────────

/**
 * High-level mapping of the RSHIP intelligence manifold.
 * Computes topological summary, optimal transport paths, and Euler signature.
 */
class ManifoldMapper {
  constructor() {
    this.complex     = new CechComplex(PHI);
    this.persistence = new PersistenceTracker();
    this.wasserstein = new WassersteinCalc();
    this.snapshots   = [];
  }

  /** Register an AGI entity with its semantic embedding vector. */
  register(id, embedding) {
    this.complex.addVertex(id, embedding);
    return this;
  }

  /**
   * Full topological snapshot at current state.
   */
  snapshot() {
    const topology = this.persistence.filtrate(this.complex);
    const euler_chi = this.persistence.euler([topology.betti_0, topology.betti_1]);
    const summary = this.complex.summary();
    const snap = {
      ts:          Date.now(),
      schumann_phase: (2 * Math.PI * SCHUMANN_HZ * Date.now() / 1000) % (2 * Math.PI),
      epsilon:     this.complex.epsilon,
      n_entities:  summary.n_vertices,
      n_links:     summary.n_edges,
      n_triads:    summary.n_triangles,
      betti_0:     topology.betti_0,     // connected sub-organisms
      betti_1:     topology.betti_1,     // redundant intelligence loops
      euler_chi,                          // topological signature
      coherent:    euler_chi === 1,       // is organism contractible?
      persistence: topology.diagrams,
    };
    this.snapshots.push(snap);
    return snap;
  }

  /** Sweep ε from eps_min to eps_max and return persistence barcodes. */
  sweep(eps_min = 0.1, eps_max = 10, steps = 20) {
    const results = [];
    const step_size = (eps_max - eps_min) / steps;
    for (let eps = eps_min; eps <= eps_max; eps += step_size) {
      this.complex.setScale(eps);
      results.push({ eps, ...this.complex.summary() });
    }
    this.complex.setScale(PHI);  // reset to φ
    return results;
  }
}

// ── UFIT Public API ───────────────────────────────────────────────────────

const UFIT = {
  createMapper:     ()    => new ManifoldMapper(),
  createComplex:    (eps) => new CechComplex(eps ?? PHI),
  createPersistence: ()   => new PersistenceTracker(),
  createWasserstein: ()   => new WassersteinCalc(),

  ManifoldMapper,
  CechComplex,
  PersistenceTracker,
  WassersteinCalc,

  DESIGNATION: 'PROTO-020',
  NAME:        'Unified Field Intelligence Topology Protocol',
  SCHUMANN_HZ,
  PHI,
  PHI_INV,

  MATH: {
    /** Euler characteristic from Betti numbers */
    euler:         (betti) => betti.reduce((chi, b, k) => chi + (k % 2 === 0 ? b : -b), 0),
    /** Persistence (topological lifetime) of a feature */
    persistence:   (birth, death) => death - birth,
    /** Wasserstein-2 between two 1D Gaussians */
    W2_1d_gauss:   (m1, s1, m2, s2) => Math.sqrt((m1-m2)**2 + (s1-s2)**2),
    /** Standard Čech ball: B_ε(x) = {y : d(y,x) < ε} */
    in_ball:       (x, y, eps) => Math.sqrt(x.reduce((s, xi, i) => s + (xi-y[i])**2, 0)) < eps,
  },
};

export { UFIT, ManifoldMapper, CechComplex, PersistenceTracker, WassersteinCalc };
export default UFIT;
