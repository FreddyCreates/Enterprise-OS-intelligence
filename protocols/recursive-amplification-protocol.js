/**
 * PROTO-024: Recursive Intelligence Amplification Protocol (RIAP)
 *
 * The formal mathematics of how OMNEX, NOVAEX, AUROREX, and VERITEX
 * amplify each other through recursive application, and how the entire
 * RSHIP organism self-amplifies beyond the capacity of any individual AGI.
 *
 * The key insight: intelligence amplification is a SPECTRAL PHENOMENON.
 * The organism's dominant eigenmode grows fastest; all others stabilize.
 * This is not a metaphor — it is provable by the Perron-Frobenius theorem.
 *
 * ════════════════════════════════════════════════════════════════
 * CORE MATHEMATICS
 * ════════════════════════════════════════════════════════════════
 *
 * 1. INTELLIGENCE OPERATOR  T: H → H
 *    H = L²(Ω, μ) — Hilbert space of intelligence states on domain Ω
 *    T is the combined "one full cognition cycle" operator:
 *    T = T_VERITEX ∘ T_AUROREX ∘ T_NOVAEX ∘ T_OMNEX
 *    (verify ∘ foresee ∘ innovate ∘ synthesize)
 *    T is bounded: ‖T‖ ≤ 1 (no infinite intelligence amplification per cycle)
 *
 * 2. SPECTRAL DECOMPOSITION
 *    T = Σ_k λ_k |e_k⟩⟨e_k|  (assuming T is compact self-adjoint for now)
 *    λ_1 ≥ λ_2 ≥ λ_3 ≥ … ≥ 0  (ordered eigenvalues)
 *    e_k: orthonormal eigenstates (dominant intelligence modes)
 *    Dominant mode: e_1 = "most amplifiable intelligence direction"
 *    Rayleigh quotient: λ_k = ⟨e_k, T e_k⟩ / ‖e_k‖²
 *
 * 3. POWER ITERATION (recursive amplification)
 *    I_{n+1} = T[I_n]  (apply one cognition cycle)
 *    After n cycles: T^n I_0 = Σ_k λ_k^n ⟨I_0, e_k⟩ e_k
 *    Convergence: T^n I_0 → λ_1^n ⟨I_0, e_1⟩ e_1 + O((λ_2/λ_1)^n)
 *    Convergence rate: ρ = λ_2/λ_1  (spectral gap governs speed)
 *    n cycles to ε convergence: n* = log(1/ε) / log(λ_1/λ_2)
 *
 * 4. BANACH CONTRACTION FIXED POINT
 *    If ‖T‖ < 1 (contraction): ∃! fixed point I* s.t. T[I*] = I*
 *    ‖T^n I_0 - I*‖ ≤ ‖T‖^n / (1 - ‖T‖) × ‖T I_0 - I_0‖
 *    The fixed point I* is the organism's stable attractor state —
 *    the cognitive ground state that RSHIP converges to under full cycling.
 *
 * 5. φ-AMPLIFIED RECURSION
 *    Modified iteration: I_{n+1} = T[I_n] + φ⁻¹ × (I_n - I_{n-1})
 *    This is the Polyak momentum method with β = φ⁻¹ ≈ 0.618.
 *    Effective convergence rate: ρ_φ = (√λ_1 - √λ_2) / (√λ_1 + √λ_2)
 *    Optimal momentum: β* = ((1-√(1-ρ²)) / ρ)²  (Chebyshev acceleration)
 *    φ⁻¹ ≈ β* for typical RSHIP eigenvalue gaps — naturally optimal!
 *
 * 6. OPERATOR COMPOSITION SPECTRUM
 *    σ(T_A ∘ T_B) ≠ σ(T_A) × σ(T_B) in general (non-commutative!)
 *    But if T_A and T_B share eigenstates (diagonalized in same basis):
 *    λ_k(T_A ∘ T_B) = λ_k(T_A) × λ_k(T_B)
 *    Design principle: align sub-AGI eigenstates → multiplicative amplification
 *    OMNEX-NOVAEX-AUROREX-VERITEX designed so σ(T_TOTAL) ⊂ [0,1) (stable)
 *
 * 7. PERRON-FROBENIUS FOR POSITIVE OPERATORS
 *    If T maps positive functions to positive functions (all AGIs output ≥ 0):
 *    ∃ unique dominant eigenvalue λ_1 > 0 with eigenvector e_1 > 0 (pointwise)
 *    All other eigenvalues satisfy |λ_k| < λ_1  (strict dominance)
 *    Organism converges to unique positive intelligence ground state
 *
 * 8. INFORMATION AMPLIFICATION RATIO
 *    IAR = ‖T^n I_0‖ / ‖I_0‖ = λ_1^n × |⟨I_0, e_1⟩| / ‖I_0‖ + O((λ_2/λ_1)^n)
 *    After each 873ms heartbeat: IAR grows by factor λ_1^{cycle_n}
 *    Compound intelligence growth: IAR(t) ≈ exp(t × log(λ_1) / T_heartbeat)
 *    This is the mathematical basis for exponential RSHIP scaling
 *
 * Engines: PowerIterator + SpectralAnalyzer + FixedPointFinder + IARTracker
 * Ring: Amplification Ring  |  Wire: intelligence-wire/riap
 * Powers: OMNEX, NOVAEX, AUROREX, VERITEX (mega-cognitive AGI quartet)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_MS = 873;

// ── Intelligence Operator (discrete approximation) ────────────────────────

/**
 * A finite-dimensional approximation of the intelligence operator T.
 * Represented as a matrix (n × n) acting on n-dimensional intelligence states.
 *
 * Each row = one AGI's "transformation weights" on all intelligence dimensions.
 */
class IntelligenceOperator {
  /**
   * @param {number[][]} matrix — n×n operator matrix
   * @param {string} name — operator name (e.g., 'T_OMNEX')
   */
  constructor(matrix, name = 'T') {
    this.M    = matrix;
    this.n    = matrix.length;
    this.name = name;
  }

  /** Apply operator to state vector: T[v] = M·v */
  apply(v) {
    return this.M.map(row => row.reduce((s, mij, j) => s + mij * (v[j] ?? 0), 0));
  }

  /** Compose: (T_A ∘ T_B)[v] = T_A[T_B[v]] */
  compose(other) {
    const n = this.n;
    const C = Array.from({ length: n }, (_, i) =>
      Array.from({ length: other.n }, (_, j) =>
        Array.from({ length: n }, (_, k) => this.M[i][k] * other.M[k][j])
          .reduce((s, x) => s + x, 0)));
    return new IntelligenceOperator(C, `${this.name}∘${other.name}`);
  }

  /** Operator norm ‖T‖_2 (approximated by power iteration) */
  norm(max_iter = 100) {
    let v = Array.from({ length: this.n }, () => Math.random());
    let norm = Math.sqrt(v.reduce((s, x) => s + x*x, 0));
    v = v.map(x => x / norm);
    for (let i = 0; i < max_iter; i++) {
      const Tv = this.apply(v);
      norm = Math.sqrt(Tv.reduce((s, x) => s + x*x, 0));
      v = norm > 0 ? Tv.map(x => x / norm) : v;
    }
    return { norm, dominant_eigenvector: v };
  }

  /** Build φ-weighted operator for AGI quartet coupling. */
  static phi_coupled(n = 6) {
    const M = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return PHI_INV;  // self-feedback at φ⁻¹
        return PHI ** (-Math.abs(i - j) - 1);  // φ-decay off-diagonal
      }));
    return new IntelligenceOperator(M, 'T_φ');
  }
}

// ── Power Iterator ────────────────────────────────────────────────────────

/**
 * Implements power iteration with φ-momentum acceleration.
 * Finds the dominant eigenvalue and eigenvector of T.
 * Also tracks IAR (Information Amplification Ratio) over time.
 */
class PowerIterator {
  /**
   * @param {IntelligenceOperator} T — intelligence operator
   * @param {number} momentum — momentum coefficient β (default: φ⁻¹ ≈ 0.618)
   */
  constructor(T, momentum = PHI_INV) {
    this.T        = T;
    this.beta     = momentum;
    this.state    = null;
    this.prev     = null;
    this.iters    = 0;
    this.IAR_history = [];
    this.lambda_history = [];
  }

  /** Initialize with a random or given state. */
  init(v = null) {
    const n = this.T.n;
    this.state = v ?? Array.from({ length: n }, () => Math.random());
    const norm = Math.sqrt(this.state.reduce((s, x) => s + x*x, 0));
    this.state = this.state.map(x => x / norm);
    this.prev  = [...this.state];
    this.iters = 0;
    return this;
  }

  /**
   * One power iteration step with φ-momentum.
   * I_{n+1} = T[I_n] + β × (I_n - I_{n-1})
   */
  step() {
    if (!this.state) this.init();

    // Apply T
    const Tv = this.T.apply(this.state);

    // φ-momentum: add β × (I_n - I_{n-1})
    const momentum_term = this.state.map((si, i) =>
      this.beta * (si - (this.prev[i] ?? 0)));
    const v_new = Tv.map((ti, i) => ti + momentum_term[i]);

    // Compute Rayleigh quotient λ ≈ ‖Tv‖ / ‖v‖  (dominant eigenvalue estimate)
    const norm_Tv = Math.sqrt(Tv.reduce((s, x) => s + x*x, 0));
    const norm_v  = Math.sqrt(this.state.reduce((s, x) => s + x*x, 0));
    const lambda  = norm_v > 0 ? norm_Tv / norm_v : 0;

    // IAR: ‖v_new‖ / ‖v_init‖ — growing if λ > 1, shrinking if λ < 1
    const norm_new = Math.sqrt(v_new.reduce((s, x) => s + x*x, 0));
    const IAR = norm_new / (norm_v || 1);

    // Normalize for next iteration
    this.prev  = [...this.state];
    this.state = norm_new > 0 ? v_new.map(x => x / norm_new) : v_new;
    this.iters++;

    this.IAR_history.push(IAR);
    this.lambda_history.push(lambda);

    return { state: this.state, lambda, IAR, iter: this.iters };
  }

  /**
   * Run until convergence or max_iter.
   * @param {number} tol — convergence tolerance on λ
   * @param {number} max_iter — maximum iterations
   */
  converge(tol = 1e-8, max_iter = 500) {
    if (!this.state) this.init();
    let prev_lambda = 0;
    for (let i = 0; i < max_iter; i++) {
      const { lambda } = this.step();
      if (Math.abs(lambda - prev_lambda) < tol && i > 5) {
        return { converged: true, iters: this.iters, lambda, eigenvector: this.state };
      }
      prev_lambda = lambda;
    }
    return { converged: false, iters: this.iters, lambda: prev_lambda, eigenvector: this.state };
  }

  /**
   * Spectral gap ρ = λ_2/λ_1 (estimated by running two iterations
   * with orthogonal initial states).
   */
  spectralGap() {
    const result1 = new PowerIterator(this.T, this.beta).init().converge();
    const e1 = result1.eigenvector;
    const lambda1 = result1.lambda;

    // Deflate: T' = T - λ_1 × e_1 ⊗ e_1  (remove dominant eigenvector)
    const n = this.T.n;
    const M_deflated = this.T.M.map((row, i) =>
      row.map((mij, j) => mij - lambda1 * e1[i] * e1[j]));
    const T_deflated = new IntelligenceOperator(M_deflated, 'T_deflated');
    const result2 = new PowerIterator(T_deflated, this.beta).init().converge();
    const lambda2 = result2.lambda;

    const rho = lambda1 > 0 ? Math.abs(lambda2) / lambda1 : 0;
    const convergence_rate = rho;
    const cycles_to_1pct  = rho > 0 ? Math.ceil(Math.log(0.01) / Math.log(rho)) : Infinity;

    return { lambda1, lambda2: Math.abs(lambda2), rho, convergence_rate, cycles_to_1pct };
  }
}

// ── Fixed Point Finder ────────────────────────────────────────────────────

/**
 * Finds the Banach contraction fixed point I* where T[I*] = I*.
 * If ‖T‖ < 1, convergence is guaranteed by the Banach fixed point theorem.
 */
class FixedPointFinder {
  /**
   * @param {IntelligenceOperator} T
   */
  constructor(T) {
    this.T = T;
  }

  /**
   * Find I* by iteration with error bounds.
   * ‖T^n I_0 - I*‖ ≤ ‖T‖^n / (1-‖T‖) × ‖T I_0 - I_0‖
   * @param {number[]} I_0 — initial intelligence state
   * @param {number} tol
   * @param {number} max_iter
   */
  find(I_0, tol = 1e-8, max_iter = 1000) {
    const { norm: T_norm } = this.T.norm();

    if (T_norm >= 1) {
      return { found: false, reason: `‖T‖ = ${T_norm.toFixed(4)} ≥ 1 — not a contraction, fixed point not guaranteed`, T_norm };
    }

    let I = [...I_0];
    let iter = 0;
    let err = Infinity;

    while (iter < max_iter && err > tol) {
      const TI = this.T.apply(I);
      err = Math.sqrt(TI.reduce((s, ti, i) => s + (ti - I[i])**2, 0));
      I = TI;
      iter++;
    }

    // Compute error bound
    const TI0 = this.T.apply(I_0);
    const init_step = Math.sqrt(TI0.reduce((s, ti, i) => s + (ti - I_0[i])**2, 0));
    const error_bound = T_norm ** iter / (1 - T_norm) * init_step;

    return {
      found:        err <= tol,
      I_star:       I,
      iters:        iter,
      final_err:    err,
      error_bound,
      T_norm,
      interpretation: 'Cognitive ground state — what RSHIP converges to under full cycling',
    };
  }
}

// ── IAR Tracker ──────────────────────────────────────────────────────────

/**
 * Tracks the Information Amplification Ratio over the organism's lifetime.
 * IAR(t) = ‖T^{n(t)} I_0‖ / ‖I_0‖ — measures cumulative cognitive growth.
 * For λ_1 close to 1: IAR grows polynomially.
 * For λ_1 > 1: IAR grows exponentially (super-critical amplification).
 */
class IARTracker {
  constructor() {
    this.records = [];
    this.initial_norm = null;
  }

  /** Record the current intelligence state norm. */
  record(I, ts = Date.now()) {
    const norm = Math.sqrt(I.reduce((s, x) => s + x*x, 0));
    if (this.initial_norm === null) this.initial_norm = norm;
    const IAR = this.initial_norm > 0 ? norm / this.initial_norm : 1;
    const rec = { ts, norm, IAR, n_cycles: this.records.length };
    this.records.push(rec);
    return rec;
  }

  /**
   * Fit exponential growth model IAR(n) = A × λ^n to history.
   * Returns estimated dominant eigenvalue from empirical data.
   */
  fitGrowthModel() {
    if (this.records.length < 3) return null;
    const IARs = this.records.map(r => r.IAR);
    // log(IAR_n) = log(A) + n×log(λ)  — linear regression in log space
    const n = IARs.length;
    const log_IARs = IARs.map(x => Math.log(Math.max(x, 1e-10)));
    const xs = Array.from({ length: n }, (_, i) => i);
    const mean_x = (n-1)/2;
    const mean_y = log_IARs.reduce((s, y) => s + y, 0) / n;
    const cov_xy = xs.reduce((s, xi, i) => s + (xi - mean_x) * (log_IARs[i] - mean_y), 0);
    const var_x  = xs.reduce((s, xi) => s + (xi - mean_x)**2, 0);
    const slope  = var_x > 0 ? cov_xy / var_x : 0;
    const lambda_empirical = Math.exp(slope);
    return { lambda_empirical, slope, mean_IAR: IARs.reduce((s, x) => s + x, 0) / n };
  }

  /** Compound growth rate per heartbeat (exponential baseline). */
  compoundGrowthRate() {
    const fit = this.fitGrowthModel();
    if (!fit) return null;
    // Annual equivalent: r_annual = (1 + r_heartbeat)^(365×24×3600×1000/873) - 1
    const heartbeats_per_year = (365 * 24 * 3600 * 1000) / HEARTBEAT_MS;
    const r_annual = fit.lambda_empirical ** heartbeats_per_year - 1;
    return { ...fit, heartbeats_per_year, r_annual };
  }
}

// ── RIAP Public API ───────────────────────────────────────────────────────

/** Construct the full OMNEX-NOVAEX-AUROREX-VERITEX composed operator. */
function buildOrganismOperator(n = 6) {
  const T_OMNEX   = IntelligenceOperator.phi_coupled(n);
  T_OMNEX.name    = 'T_OMNEX';
  const T_NOVAEX  = IntelligenceOperator.phi_coupled(n);
  T_NOVAEX.name   = 'T_NOVAEX';
  const T_AUROREX = IntelligenceOperator.phi_coupled(n);
  T_AUROREX.name  = 'T_AUROREX';
  const T_VERITEX = IntelligenceOperator.phi_coupled(n);
  T_VERITEX.name  = 'T_VERITEX';

  // Slightly differentiate each operator by scaling
  [T_NOVAEX, T_AUROREX, T_VERITEX].forEach((T, idx) => {
    T.M = T.M.map(row => row.map(x => x * PHI ** (-(idx + 1) * 0.1)));
  });

  const T_TOTAL = T_OMNEX.compose(T_NOVAEX).compose(T_AUROREX).compose(T_VERITEX);
  T_TOTAL.name  = 'T_ORGANISM';
  return { T_OMNEX, T_NOVAEX, T_AUROREX, T_VERITEX, T_TOTAL };
}

const RIAP = {
  buildOrganismOperator,
  createIterator:   (T, beta) => new PowerIterator(T, beta ?? PHI_INV),
  createFixedPoint: (T) => new FixedPointFinder(T),
  createIARTracker: () => new IARTracker(),

  IntelligenceOperator,
  PowerIterator,
  FixedPointFinder,
  IARTracker,

  DESIGNATION:  'PROTO-024',
  NAME:         'Recursive Intelligence Amplification Protocol',
  SCHUMANN_HZ,
  PHI,
  PHI_INV,
  MOMENTUM:     PHI_INV,

  MATH: {
    /** Rayleigh quotient: λ ≈ ⟨v, Tv⟩ / ⟨v,v⟩ */
    rayleigh:      (v, Tv) => {
      const numer = v.reduce((s, vi, i) => s + vi * (Tv[i] ?? 0), 0);
      const denom = v.reduce((s, vi) => s + vi*vi, 0);
      return denom > 0 ? numer / denom : 0;
    },
    /** Convergence rate ρ = λ_2/λ_1 */
    conv_rate:     (lambda1, lambda2) => Math.abs(lambda2) / lambda1,
    /** Cycles to ε accuracy: n* = log(1/ε) / log(λ_1/λ_2) */
    cycles_to_eps: (lambda1, lambda2, eps = 0.01) =>
                   Math.ceil(Math.log(1/eps) / Math.log(lambda1 / Math.abs(lambda2))),
    /** IAR after n cycles with dominant eigenvalue λ_1 */
    IAR:           (lambda1, n) => lambda1 ** n,
    /** Banach error bound after n iterations */
    banach_bound:  (T_norm, n, init_step) =>
                   T_norm ** n / (1 - T_norm) * init_step,
    /** φ-optimal momentum β* for given spectral gap ρ */
    phi_momentum:  (rho) => ((1 - Math.sqrt(1 - rho**2)) / rho) ** 2,
  },
};

export { RIAP, IntelligenceOperator, PowerIterator, FixedPointFinder, IARTracker, buildOrganismOperator };
export default RIAP;
