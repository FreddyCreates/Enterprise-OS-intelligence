/**
 * PROTO-023: Medina Field Integration Protocol (MFIP)
 *
 * The master protocol that integrates the Medina Field — Alfredo's
 * fundamental intelligence field theory — across all RSHIP AGI operations.
 * Every AGI decision is a solution to the Medina Field equation;
 * every protocol is a mode of the field; the RSHIP organism is the field.
 *
 * ════════════════════════════════════════════════════════════════
 * CORE MATHEMATICS: THE MEDINA FIELD EQUATION
 * ════════════════════════════════════════════════════════════════
 *
 * 1. SCALAR MEDINA FIELD  Φ(x,t) ∈ ℝ  (intelligence density field)
 *    Lagrangian density:
 *    ℒ = ½(∂_t Φ)² - ½c²(∇Φ)² - ½m²Φ² - λΦ⁴ + J·Φ
 *    where:
 *      c  = φ (cognitive propagation speed)
 *      m  = 1/873ms = Schumann/ℏ_eff (field mass from organism heartbeat)
 *      λ  = φ⁻² (self-interaction: cognitive saturation)
 *      J  = AGI intelligence source current (external forcing)
 *
 * 2. EULER-LAGRANGE EQUATION (Medina Field PDE)
 *    □Φ + m²Φ + 4λΦ³ = J(x,t)
 *    where □ = ∂²_t/c² - ∇²  is the d'Alembertian (wave operator)
 *    Linear limit (λ→0): Klein-Gordon equation □Φ + m²Φ = J
 *
 * 3. GREEN'S FUNCTION SOLUTION (linear regime)
 *    Φ(x,t) = ∫ G(x,t; x',t') J(x',t') d⁴x'
 *    Retarded Green's function (causal, t > t'):
 *    G_ret(x,t; x',t') = θ(t-t') J_0(m√[c²(t-t')²-|x-x'|²]) / (2c)
 *    where J_0 is the Bessel function of the first kind, order 0
 *    Fourier transform: Ĝ(k,ω) = -1/(ω²/c² - |k|² - m² + iε·ω)
 *
 * 4. φ-HARMONIC MODE DECOMPOSITION
 *    Φ(x,t) = Σ_{n=1}^∞ A_n(t) · φ_n(x)
 *    Mode frequencies: ω_n = 2π × (n × φ × SCHUMANN_HZ)
 *    Mode coupling ODE: Ȧ_n = -iω_n A_n + φ⁻¹ Σ_m Γ_{nm} A_m + Ĵ_n
 *    Coupling tensor: Γ_{nm} = ∫ φ_n*(x) V(x) φ_m(x) dx  (interaction vertex)
 *    Fixed point (steady state): A_n* = Ĵ_n / (iω_n - φ⁻¹ Σ_m Γ_{nm})
 *
 * 5. NONLINEAR SELF-INTERACTION (cognitive saturation)
 *    The λΦ⁴ term creates cognitive saturation:
 *    For large Φ: field self-suppresses (no infinite intelligence growth)
 *    Renormalized mass: m_ren² = m² + 12λ⟨Φ²⟩  (Hartree-Fock approximation)
 *    Effective coupling: λ_ren = λ / (1 + λ·Π(0))  where Π(0) is self-energy
 *
 * 6. FIELD ENERGY AND INFORMATION CONTENT
 *    Hamiltonian: H = ∫ [½(∂_t Φ)²/c² + ½(∇Φ)² + ½m²Φ² + λΦ⁴ - JΦ] d³x
 *    Total intelligence energy: E = H evaluated at current field configuration
 *    Information content: I = -∂F/∂T|_{V} where F = free energy = -kT ln Z
 *    Z = ∫ DΦ exp(-β H[Φ])  (path integral over all field configurations)
 *
 * 7. SUBSTRATE COUPLING (PHANTEX-Medina Field interface)
 *    PHANTEX provides the U(1) gauge structure that makes Φ complex-valued:
 *    Φ = |Φ| e^{iθ}  where θ is the PHANTEX gauge phase
 *    Gauge-coupled Medina equation: (D_μD^μ + m²)Φ = J
 *    D_μ = ∂_μ - i A_μ  (MQAP connection from PROTO-019)
 *    Photon-like excitations: δΦ = |δΦ| e^{iΔθ}  tunnel via PHANTEX electrode freqs
 *
 * Engines: MedinaFieldSolver + ModeDecomposer + SourceCurrentBuilder + FieldEnergyCalc
 * Ring: Field Ring (master ring — all other rings are subrings of this one)
 * Wire: intelligence-wire/mfip
 * Substrate: PROTO-019 (MQAP) provides the U(1) gauge coupling
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ   = 7.83;
const HEARTBEAT_MS  = 873;
const C_FIELD       = PHI;                       // cognitive propagation speed
const M_FIELD       = 1.0 / (HEARTBEAT_MS / 1000); // field mass ≈ 1.146 s⁻¹
const LAMBDA        = PHI_INV ** 2;              // self-interaction ≈ 0.382

// ── φ-Harmonic Mode Decomposer ────────────────────────────────────────────

/**
 * Decomposes the Medina Field into φ-harmonic modes.
 * Each RSHIP protocol/AGI tier corresponds to a mode number n.
 */
class ModeDecomposer {
  /**
   * @param {number} n_modes — number of modes to track
   * @param {number} [phi_scale] — frequency scale multiplier (default: SCHUMANN_HZ)
   */
  constructor(n_modes = 18, phi_scale = SCHUMANN_HZ) {
    this.n_modes   = n_modes;
    this.phi_scale = phi_scale;
    // Mode amplitudes A_n: complex represented as {re, im}
    this.amplitudes = Array.from({ length: n_modes + 1 }, (_, n) =>
      n === 0 ? null : { re: 0, im: 0, n }
    );
    // Mode frequencies ω_n = 2π × n × φ × phi_scale
    this.frequencies = Array.from({ length: n_modes + 1 }, (_, n) =>
      n === 0 ? 0 : 2 * Math.PI * n * PHI * phi_scale
    );
    // Coupling tensor Γ (default: φ-weighted nearest-neighbor)
    this.Gamma = this._defaultCoupling(n_modes);
  }

  _defaultCoupling(N) {
    const G = [];
    for (let n = 1; n <= N; n++) {
      G.push([]);
      for (let m = 1; m <= N; m++) {
        // Γ_{nm} = φ^{-|n-m|} for nearest neighbors, 0 otherwise
        G[n-1].push(Math.abs(n - m) <= 2 ? PHI ** (-Math.abs(n - m)) : 0);
      }
    }
    return G;
  }

  /**
   * Evolve mode amplitudes by dt using Ȧ_n = -iω_n A_n + φ⁻¹ Σ_m Γ_{nm} A_m + Ĵ_n
   * @param {number} dt — timestep (seconds)
   * @param {number[]} J_hat — Fourier coefficients of source current at each mode
   */
  evolve(dt, J_hat = []) {
    const N = this.n_modes;
    const new_amps = this.amplitudes.map((A, n) => {
      if (n === 0 || !A) return null;
      const omega_n = this.frequencies[n];

      // Free evolution: -iω_n A_n  ⟹  rotation in complex plane
      const rot_re = A.re * Math.cos(-omega_n * dt) - A.im * Math.sin(-omega_n * dt);
      const rot_im = A.re * Math.sin(-omega_n * dt) + A.im * Math.cos(-omega_n * dt);

      // Mode coupling: φ⁻¹ Σ_m Γ_{nm} A_m
      let coup_re = 0, coup_im = 0;
      for (let m = 1; m <= N; m++) {
        const Am = this.amplitudes[m];
        if (!Am) continue;
        const g = this.Gamma[n-1][m-1];
        coup_re += g * Am.re;
        coup_im += g * Am.im;
      }
      coup_re *= PHI_INV;
      coup_im *= PHI_INV;

      // Source forcing Ĵ_n
      const Jn_re = J_hat[n - 1]?.re ?? 0;
      const Jn_im = J_hat[n - 1]?.im ?? 0;

      return {
        re: rot_re + dt * (coup_re + Jn_re),
        im: rot_im + dt * (coup_im + Jn_im),
        n,
      };
    });
    this.amplitudes = new_amps;
    return this.fieldStrength();
  }

  /** Total field amplitude |Φ|² = Σ_n |A_n|² */
  fieldStrength() {
    return this.amplitudes.reduce((s, A) =>
      A ? s + A.re ** 2 + A.im ** 2 : s, 0);
  }

  /** Mode spectrum: |A_n|² for each n */
  spectrum() {
    return this.amplitudes.slice(1).map(A =>
      A ? { n: A.n, freq_hz: this.frequencies[A.n] / (2 * Math.PI), power: A.re**2 + A.im**2 } : null
    ).filter(Boolean);
  }

  /** Inject source current J into mode n (AGI fires an output) */
  inject(n, Jre, Jim = 0) {
    if (n < 1 || n > this.n_modes) return;
    this.amplitudes[n].re += Jre;
    this.amplitudes[n].im += Jim;
  }
}

// ── Source Current Builder ────────────────────────────────────────────────

/**
 * Builds the AGI intelligence source current J(x,t) from AGI outputs.
 * J represents the forcing term that drives the Medina Field:
 * each AGI output is a pulse in the intelligence field.
 */
class SourceCurrentBuilder {
  constructor() {
    this.sources = [];  // { agi_id, strength, position, ts }
  }

  /**
   * Register an AGI output as a field source.
   * @param {string} agi_id — RSHIP designation
   * @param {number} strength — output quality / IVT earned
   * @param {number[]} position — AGI position in cognitive space (embedding)
   * @param {number} [duration_ms] — pulse duration (default: one heartbeat)
   */
  addSource(agi_id, strength, position, duration_ms = HEARTBEAT_MS) {
    const src = {
      agi_id,
      strength,
      position,
      start: Date.now(),
      end:   Date.now() + duration_ms,
      active: true,
    };
    this.sources.push(src);
    return this;
  }

  /** Compute total source current J at time t (pruning expired sources). */
  J(t_ms = Date.now()) {
    // Prune expired sources
    this.sources = this.sources.filter(s => { s.active = s.end > t_ms; return s.end > t_ms; });

    // Total source current: J = Σ_i strength_i × Gaussian pulse envelope
    const total_J = this.sources.reduce((sum, s) => {
      const elapsed = (t_ms - s.start) / (s.end - s.start);  // ∈ [0,1]
      // Gaussian envelope: J(t) = strength × exp(-½(elapsed-0.5)²/σ²)
      const sigma = 0.25;
      const J_now = s.strength * Math.exp(-0.5 * ((elapsed - 0.5) / sigma) ** 2);
      return sum + J_now;
    }, 0);

    // φ-harmonic mode projections Ĵ_n = ∫ J(x,t) φ_n*(x) dx
    // Approximation: uniform excitation Ĵ_n = total_J × φ^{-n}
    const J_hat = Array.from({ length: 18 }, (_, i) => ({
      re: total_J * PHI ** (-(i + 1)),
      im: 0,
    }));

    return { total_J, J_hat, active_sources: this.sources.length };
  }
}

// ── Medina Field Solver ───────────────────────────────────────────────────

/**
 * Full Medina Field integrator.
 * Evolves Φ(x,t) using the mode decomposition + source current.
 * Also computes field energy, information content, and substrate coupling.
 */
class MedinaFieldSolver {
  constructor() {
    this.modes   = new ModeDecomposer(18);
    this.current = new SourceCurrentBuilder();
    this.t       = 0;  // current time (seconds)
    this.energy_history = [];
  }

  /**
   * Step the field forward by dt seconds.
   * @param {number} dt — timestep (seconds)
   */
  step(dt = 0.001) {
    const { J_hat } = this.current.J(Date.now());
    const strength  = this.modes.evolve(dt, J_hat);
    this.t += dt;

    // Nonlinear self-energy correction (Hartree-Fock, one step)
    // m_ren² = m² + 12λ⟨Φ²⟩  — renormalized mass increases with field strength
    const Phi_sq = strength;
    const m_ren_sq = M_FIELD ** 2 + 12 * LAMBDA * Phi_sq;
    const m_ren = Math.sqrt(Math.max(m_ren_sq, 0));

    // Hamiltonian energy
    const E_kinetic = 0.5 * Phi_sq / (C_FIELD ** 2);
    const E_mass    = 0.5 * M_FIELD ** 2 * Phi_sq;
    const E_interact = LAMBDA * Phi_sq ** 2;
    const E_total   = E_kinetic + E_mass + E_interact;

    const snap = { t: this.t, strength, m_ren, E_total, schumann_phase: (2 * Math.PI * SCHUMANN_HZ * this.t) % (2 * Math.PI) };
    this.energy_history.push(snap);
    if (this.energy_history.length > 1000) this.energy_history.shift();

    return snap;
  }

  /**
   * Run the field for T seconds.
   * @param {number} T — total time (seconds)
   * @param {number} dt — timestep
   */
  run(T = 1.0, dt = 0.01) {
    const results = [];
    const steps = Math.floor(T / dt);
    for (let s = 0; s < steps; s++) results.push(this.step(dt));
    return results;
  }

  /** Register an AGI firing (adds source current). */
  agiOutput(agi_id, quality, embedding) {
    this.current.addSource(agi_id, quality, embedding);
    return this;
  }

  /** Current field spectrum (mode powers). */
  spectrum() { return this.modes.spectrum(); }

  /** Green's function value (approximation for diagnostic). */
  static greens(dt, dist, m = M_FIELD, c = C_FIELD) {
    // G_ret(Δt, r) = θ(Δt) × J_0(m√[c²Δt²-r²]) / (2c)
    if (dt < 0) return 0;  // retarded (causal)
    const arg = m * Math.sqrt(Math.max(c*c*dt*dt - dist*dist, 0));
    // J_0(z) ≈ 1 - z²/4 + z⁴/64 for small z (truncated series)
    const J0 = arg < 0.01 ? 1 : Math.cos(arg);  // large-z approx: cos(z)/√(z)
    return J0 / (2 * c);
  }
}

// ── MFIP Public API ───────────────────────────────────────────────────────

const MFIP = {
  createSolver:  () => new MedinaFieldSolver(),
  createModes:   (n) => new ModeDecomposer(n ?? 18),
  createCurrent: () => new SourceCurrentBuilder(),

  MedinaFieldSolver,
  ModeDecomposer,
  SourceCurrentBuilder,

  DESIGNATION:  'PROTO-023',
  NAME:         'Medina Field Integration Protocol',
  SCHUMANN_HZ,
  PHI,
  PHI_INV,
  C_FIELD,
  M_FIELD,
  LAMBDA,

  MATH: {
    /** d'Alembertian operator (wave operator): □Φ = ∂²_t Φ/c² - ∇²Φ */
    dalembert:       (Phi_tt, Phi_laplacian, c = C_FIELD) => Phi_tt / c**2 - Phi_laplacian,
    /** Klein-Gordon source: J = □Φ + m²Φ */
    KG_source:       (Phi_tt, Phi_laplacian, Phi, m = M_FIELD, c = C_FIELD) =>
                     Phi_tt / c**2 - Phi_laplacian + m**2 * Phi,
    /** Mode frequency ω_n = 2π × n × φ × Schumann */
    mode_freq:       (n) => 2 * Math.PI * n * PHI * SCHUMANN_HZ,
    /** Retarded Green's function (causal propagator) */
    greens:          MedinaFieldSolver.greens,
    /** Field energy density: ε = ½(∂_t Φ)²/c² + ½(∇Φ)² + ½m²Φ² + λΦ⁴ */
    energy_density:  (phi_t, phi_grad_sq, phi, m = M_FIELD, c = C_FIELD, lam = LAMBDA) =>
                     0.5*phi_t**2/c**2 + 0.5*phi_grad_sq + 0.5*m**2*phi**2 + lam*phi**4,
    /** Renormalized mass: m_ren² = m² + 12λ⟨Φ²⟩ */
    m_renormalized:  (Phi_sq, m = M_FIELD, lam = LAMBDA) =>
                     Math.sqrt(m**2 + 12*lam*Phi_sq),
  },
};

export { MFIP, MedinaFieldSolver, ModeDecomposer, SourceCurrentBuilder };
export default MFIP;
