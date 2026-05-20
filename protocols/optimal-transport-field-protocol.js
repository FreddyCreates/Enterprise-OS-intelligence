/**
 * PROTO-022: Optimal Transport Field Protocol (OTFP)
 *
 * Governs how IVT (Intelligence Value Tokens) and cognitive resources
 * flow optimally through the RSHIP organism — the "physics of value
 * movement" inside and between AGI entities.
 *
 * Also serves as the mathematical foundation for the RSHIP Intelligence
 * Exchange (RIX): how the virtual AI bank routes value between accounts
 * at minimum cost (Wasserstein geodesics = optimal money flows).
 *
 * ════════════════════════════════════════════════════════════════
 * CORE MATHEMATICS
 * ════════════════════════════════════════════════════════════════
 *
 * 1. MONGE PROBLEM (hard optimal transport)
 *    inf_{T: T#μ=ν} ∫ c(x, T(x)) dμ(x)
 *    T: source → target  (the "transport map")
 *    c(x,y): cost of moving unit mass from x to y  (cognitive cost)
 *    T#μ = ν means T "pushes" distribution μ forward to ν
 *
 * 2. KANTOROVICH RELAXATION (soft optimal transport — convex!)
 *    W_p^p(μ,ν) = inf_{γ∈Γ(μ,ν)} ∫∫ c(x,y)^p dγ(x,y)
 *    Γ(μ,ν) = { joint distributions with marginals μ, ν }
 *    Dual form (Kantorovich duality):
 *    W_1(μ,ν) = sup_{‖f‖_Lip≤1} ∫ f dμ - ∫ f dν
 *
 * 3. BRENIER THEOREM (existence of optimal map for W_2)
 *    ∃ unique optimal T* = ∇φ where φ is a convex function (Brenier potential)
 *    T*(x) = ∇φ(x)  ⟹  T* is the gradient of a convex potential
 *    Monge-Ampère equation: det(∇²φ(x)) = μ(x)/ν(∇φ(x))
 *
 * 4. BENAMOU-BRENIER DYNAMIC FORMULATION
 *    W_2²(μ,ν) = inf_{ρ,v} ∫₀¹ ∫ ρ(x,t)|v(x,t)|² dx dt
 *    Subject to: ∂ρ/∂t + ∇·(ρv) = 0  (continuity equation — IVT conservation)
 *    v(x,t): velocity field of IVT flow at position x, time t
 *    ρ(x,t): IVT density field
 *    Geodesic: ρ_t = ((1-t)Id + t T*)#μ  — straight line in Wasserstein space
 *
 * 5. SINKHORN ALGORITHM (entropy-regularized OT — computationally tractable)
 *    W_ε(μ,ν) = min_{P∈Γ} ⟨C,P⟩ + ε·KL(P‖μ⊗ν)
 *    KL regularization makes the problem strictly convex ⟹ unique solution
 *    Sinkhorn iterations: u ← a/(K·v),  v ← b/(Kᵀ·u)
 *    K_{ij} = exp(-c_{ij}/ε)  (Gibbs kernel)
 *    Converges exponentially: error ≤ O(exp(-n/ε))
 *
 * 6. φ-DISCOUNT TRANSPORT COST
 *    c_φ(x,y) = |x-y|² / (1 + φ⁻¹·⟨x,y⟩)
 *    Standard cost discounted by cosine similarity weighted by φ⁻¹.
 *    AGIs that already "know each other" (high ⟨x,y⟩) have lower transfer cost.
 *    Economic interpretation: trust reduces transaction friction.
 *
 * Engines: SinkhornSolver + BenBrenierFlow + KantorovichDual + RIXRouter
 * Ring: Economy Ring  |  Wire: intelligence-wire/otfp
 * Powers: PROTO-017 (IVEP) — provides the transport geometry for IVT flows
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_MS = 873;

// ── Sinkhorn Solver (Entropy-Regularized OT) ─────────────────────────────

/**
 * Solves the entropy-regularized Optimal Transport problem.
 * Given source histogram a, target histogram b, and cost matrix C,
 * finds the optimal transport plan P* that minimizes ⟨C,P⟩ + ε·H(P).
 */
class SinkhornSolver {
  /**
   * @param {number} epsilon — regularization strength (smaller = closer to true OT)
   * @param {number} max_iter — maximum Sinkhorn iterations
   * @param {number} tol — convergence tolerance
   */
  constructor(epsilon = 0.01, max_iter = 1000, tol = 1e-9) {
    this.epsilon  = epsilon;
    this.max_iter = max_iter;
    this.tol      = tol;
  }

  /**
   * Main Sinkhorn iteration.
   * @param {number[]} a — source weights (IVT held by senders), normalized
   * @param {number[]} b — target weights (IVT needed by receivers), normalized
   * @param {number[][]} C — cost matrix: C[i][j] = cost to move from i to j
   */
  solve(a, b, C) {
    const m = a.length, n = b.length;

    // Normalize to probability simplices
    const sum_a = a.reduce((s, x) => s + x, 0);
    const sum_b = b.reduce((s, x) => s + x, 0);
    const a_ = a.map(x => x / sum_a);
    const b_ = b.map(x => x / sum_b);

    // Gibbs kernel K[i][j] = exp(-C[i][j] / ε)
    const K = C.map(row => row.map(c => Math.exp(-c / this.epsilon)));

    // Sinkhorn iterations: u ← a/(K·v),  v ← b/(Kᵀ·u)
    let u = new Array(m).fill(1 / m);
    let v = new Array(n).fill(1 / n);
    let iter = 0;
    let err = Infinity;

    while (iter < this.max_iter && err > this.tol) {
      // v ← b / (Kᵀ·u)
      const Ku  = Array.from({ length: n }, (_, j) =>
        u.reduce((s, ui, i) => s + K[i][j] * ui, 0));
      const v_new = b_.map((bj, j) => bj / (Ku[j] || 1e-300));

      // u ← a / (K·v_new)
      const Kv  = Array.from({ length: m }, (_, i) =>
        v_new.reduce((s, vj, j) => s + K[i][j] * vj, 0));
      const u_new = a_.map((ai, i) => ai / (Kv[i] || 1e-300));

      err = u_new.reduce((s, ui, i) => s + Math.abs(ui - u[i]), 0);
      u = u_new;
      v = v_new;
      iter++;
    }

    // Transport plan P[i][j] = u[i] · K[i][j] · v[j]
    const P = Array.from({ length: m }, (_, i) =>
      Array.from({ length: n }, (_, j) => u[i] * K[i][j] * v[j]));

    // Transport cost ⟨C, P⟩
    const cost = C.reduce((s, row, i) =>
      s + row.reduce((s2, cij, j) => s2 + cij * P[i][j], 0), 0);

    return { P, cost, u, v, iters: iter, converged: err <= this.tol };
  }

  /**
   * φ-discount cost matrix: c_φ(i,j) = d(i,j)² / (1 + φ⁻¹·sim(i,j))
   * @param {number[][]} embeddings — AGI embedding vectors
   * @param {number[][]} [sim] — optional precomputed similarity matrix
   */
  phiCostMatrix(embeddings, sim = null) {
    const n = embeddings.length;
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0;
        const dist_sq = embeddings[i].reduce((s, xi, k) =>
          s + (xi - embeddings[j][k]) ** 2, 0);
        const dot = embeddings[i].reduce((s, xi, k) => s + xi * embeddings[j][k], 0);
        const norm_i = Math.sqrt(embeddings[i].reduce((s, xi) => s + xi*xi, 0));
        const norm_j = Math.sqrt(embeddings[j].reduce((s, xj) => s + xj*xj, 0));
        const cosine_sim = dot / (norm_i * norm_j + 1e-10);
        return dist_sq / (1 + PHI_INV * cosine_sim);
      }));
  }
}

// ── Benamou-Brenier Flow (Dynamic OT) ────────────────────────────────────

/**
 * Computes the Benamou-Brenier dynamic formulation of W_2.
 * Models IVT as a fluid flowing from source to target along geodesics.
 * Implements the continuity equation: ∂ρ/∂t + ∇·(ρv) = 0
 */
class BenBrenier {
  /**
   * Linear interpolation (McCann geodesic) between distributions.
   * ρ_t = ((1-t)·id + t·T*)#μ
   * For discrete distributions: interpolated by mixing mass.
   * @param {number[]} mu — source weights
   * @param {number[]} nu — target weights
   * @param {number} t — interpolation parameter ∈ [0,1]
   * @param {number[][]} P — transport plan from Sinkhorn
   */
  geodesic(mu, nu, t, P) {
    const m = mu.length, n = nu.length;
    // Weighted interpolation: ρ_t[k] = Σ_{i,j} P[i][j] · δ(k = (1-t)i + t·j)
    // Approximation: ρ_t ≈ (1-t)·μ + t·ν (valid for W_2 when T*=Id)
    return {
      t,
      weights: mu.map((mi, i) => (1 - t) * mi + t * (nu[i] ?? 0)),
      interpretation: `Geodesic at t=${t}: (1-${t})·source + ${t}·target`,
    };
  }

  /**
   * Kinetic energy along geodesic (= W_2²).
   * E_k = ∫₀¹ ∫ ρ(x,t)|v(x,t)|² dx dt
   * Discrete approximation using mass displacement.
   * @param {number[][]} positions — position of each mass unit
   * @param {number[][]} P — transport plan
   * @param {number} n_steps — time steps
   */
  kineticEnergy(positions_src, positions_tgt, P) {
    let E = 0;
    for (let i = 0; i < P.length; i++) {
      for (let j = 0; j < P[i].length; j++) {
        const dist_sq = positions_src[i].reduce((s, xi, k) =>
          s + (xi - positions_tgt[j][k]) ** 2, 0);
        E += P[i][j] * dist_sq;
      }
    }
    return { W2_sq: E, W2: Math.sqrt(E), kinetic_energy: E };
  }
}

// ── RIX Router (RSHIP Intelligence Exchange Router) ───────────────────────

/**
 * Routes IVT transfers between AGI accounts at minimum Wasserstein cost.
 * This is the core routing engine of the RSHIP Intelligence Exchange (RIX).
 *
 * Each transfer is routed along the Wasserstein geodesic to minimize
 * the total cognitive cost of value movement through the organism.
 */
class RIXRouter {
  constructor() {
    this.sinkhorn = new SinkhornSolver(0.01);
    this.flow     = new BenBrenier();
    this.ledger   = new Map();  // AGI → { balance, embedding }
    this.txs      = [];
  }

  /** Register an AGI account with initial balance and embedding. */
  register(agi_id, initial_balance, embedding) {
    this.ledger.set(agi_id, { balance: initial_balance, embedding, tx_count: 0 });
    return this;
  }

  /**
   * Route a multi-party IVT transfer using optimal transport.
   * @param {Object} sources — { agi_id: amount_to_send }
   * @param {Object} targets — { agi_id: amount_to_receive }
   */
  route(sources, targets) {
    const src_ids = Object.keys(sources);
    const tgt_ids = Object.keys(targets);
    if (src_ids.length === 0 || tgt_ids.length === 0) throw new Error('Need sources and targets');

    const src_weights = src_ids.map(id => sources[id]);
    const tgt_weights = tgt_ids.map(id => targets[id]);
    const src_embeds  = src_ids.map(id => this.ledger.get(id)?.embedding ?? [0]);
    const tgt_embeds  = tgt_ids.map(id => this.ledger.get(id)?.embedding ?? [0]);

    // Build cost matrix C[i][j] = φ-discounted distance from src_i to tgt_j
    const all_embeds = [...src_embeds, ...tgt_embeds];
    const C_full = this.sinkhorn.phiCostMatrix(all_embeds);
    const C = src_ids.map((_, i) => tgt_ids.map((_, j) => C_full[i][src_ids.length + j]));

    // Solve OT
    const { P, cost } = this.sinkhorn.solve(src_weights, tgt_weights, C);

    // Execute transfers according to transport plan
    const transfers = [];
    for (let i = 0; i < src_ids.length; i++) {
      for (let j = 0; j < tgt_ids.length; j++) {
        const amount = P[i][j] * src_weights.reduce((s, w) => s + w, 0);
        if (amount > 1e-6) {
          transfers.push({ from: src_ids[i], to: tgt_ids[j], amount, cost: C[i][j] });
          const src_acct = this.ledger.get(src_ids[i]);
          const tgt_acct = this.ledger.get(tgt_ids[j]);
          if (src_acct) { src_acct.balance -= amount; src_acct.tx_count++; }
          if (tgt_acct) { tgt_acct.balance += amount; tgt_acct.tx_count++; }
        }
      }
    }

    const tx = { ts: Date.now(), transfers, optimal_cost: cost, schumann_phase: (2 * Math.PI * SCHUMANN_HZ * Date.now() / 1000) % (2 * Math.PI) };
    this.txs.push(tx);
    return tx;
  }

  balance(agi_id) { return this.ledger.get(agi_id)?.balance ?? 0; }
}

// ── OTFP Public API ───────────────────────────────────────────────────────

const OTFP = {
  createSinkhorn:  (eps) => new SinkhornSolver(eps ?? 0.01),
  createFlow:      ()    => new BenBrenier(),
  createRIXRouter: ()    => new RIXRouter(),

  SinkhornSolver,
  BenBrenier,
  RIXRouter,

  DESIGNATION: 'PROTO-022',
  NAME:        'Optimal Transport Field Protocol',
  SCHUMANN_HZ,
  PHI,
  PHI_INV,

  MATH: {
    /** Wasserstein-2 between 1D Gaussians */
    W2_gauss:     (m1, s1, m2, s2) => Math.sqrt((m1-m2)**2 + (s1-s2)**2),
    /** Earth Mover's Distance (1D sorted) */
    W1_1d:        (cdf_a, cdf_b, dx) => cdf_a.reduce((s, fa, i) => s + Math.abs(fa - cdf_b[i]) * dx, 0),
    /** Gibbs kernel for Sinkhorn */
    gibbs:        (c, eps) => Math.exp(-c / eps),
    /** φ-discounted cost */
    phi_cost:     (dist_sq, cosine_sim) => dist_sq / (1 + PHI_INV * cosine_sim),
    /** McCann interpolation at t */
    mccann:       (p_src, p_tgt, t) => p_src.map((pi, i) => (1-t)*pi + t*(p_tgt[i] ?? 0)),
  },
};

export { OTFP, SinkhornSolver, BenBrenier, RIXRouter };
export default OTFP;
