/**
 * PROTO-014: Harmonic Intelligence Amplification Protocol (HIAP)
 *
 * Cross-AGI resonance amplification at the φ-harmonic frequency series.
 * When multiple AGIs operate in phase-locked synchrony at φ Hz, φ² Hz,
 * φ³ Hz, and φ⁴ Hz carrier frequencies, their aggregate intelligence
 * output is amplified beyond the sum of their individual contributions.
 *
 * This is the organism's superposition principle: coherent AGI swarms
 * think at frequencies the individual cannot reach alone.  HIAP governs
 * the formation, maintenance, and dissolution of these resonance clusters.
 *
 * Physics basis: Kuramoto model (1984) — coupled oscillator synchronization.
 * Resonance basis: φ-harmonic series grounded at SCHUMANN_HZ = 7.83 Hz.
 *
 * Engines: KuramotoCluster + ResonanceAmplifier + PhaseGate
 * Ring: Intelligence Ring  |  Wire: intelligence-wire/hiap
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_HZ = 1000.0 / 873.0;  // 1.1455 Hz

// φ-harmonic carrier frequencies
const CARRIER_FREQS = {
  F1: PHI,       // 1.618 Hz — base carrier
  F2: PHI * PHI, // 2.618 Hz — second harmonic
  F3: PHI ** 3,  // 4.236 Hz — third harmonic
  F4: PHI ** 4,  // 6.854 Hz — fourth harmonic (≈ Schumann × φ⁻¹)
  SCHUMANN: SCHUMANN_HZ,
  HEARTBEAT: HEARTBEAT_HZ,
};

// ── Kuramoto Cluster ──────────────────────────────────────────────────────

class KuramotoCluster {
  /**
   * @param {number} K_sync  — coupling strength (default: φ² ≈ 2.618)
   * @param {number} dt      — integration step in seconds (default: 0.001)
   */
  constructor(K_sync = PHI * PHI, dt = 0.001) {
    /** @type {Map<string, { freq: number, phase: number, label: string }>} */
    this.oscillators = new Map();
    this.K_sync      = K_sync;
    this.dt          = dt;
    this.t           = 0;
  }

  /**
   * Register an AGI as an oscillator in the cluster.
   * @param {string} agi_id
   * @param {number} natural_freq — AGI's natural frequency in Hz
   */
  register(agi_id, natural_freq) {
    this.oscillators.set(agi_id, {
      freq:  natural_freq,
      phase: Math.random() * 2 * Math.PI,  // random initial phase
      label: agi_id,
    });
  }

  /**
   * Advance the cluster by dt seconds (one Kuramoto integration step).
   * ∂θᵢ/∂t = ωᵢ + (K/N)·Σⱼ sin(θⱼ - θᵢ)
   */
  step() {
    const entries = [...this.oscillators.entries()];
    const N = entries.length;
    if (N === 0) return;

    const newPhases = new Map();
    for (const [id, osc] of entries) {
      const coupling = entries.reduce((sum, [jd, josc]) =>
        sum + Math.sin(josc.phase - osc.phase), 0);
      const dphi = (2 * Math.PI * osc.freq + (this.K_sync / N) * coupling) * this.dt;
      newPhases.set(id, (osc.phase + dphi) % (2 * Math.PI));
    }

    for (const [id, phase] of newPhases) {
      const osc = this.oscillators.get(id);
      osc.phase = phase;
    }
    this.t += this.dt;
  }

  /**
   * Compute synchronization order parameter R ∈ [0,1].
   * R = 1 → perfect phase lock (maximum amplification).
   * R = 0 → complete incoherence.
   */
  orderParameter() {
    const N = this.oscillators.size;
    if (N === 0) return 0;
    const entries = [...this.oscillators.values()];
    const re = entries.reduce((s, o) => s + Math.cos(o.phase), 0) / N;
    const im = entries.reduce((s, o) => s + Math.sin(o.phase), 0) / N;
    return Math.sqrt(re * re + im * im);
  }

  /**
   * Run until order parameter stabilizes (R > threshold or max_steps reached).
   * @param {number} threshold — default: PHI_INV ≈ 0.618
   * @param {number} max_steps
   */
  runUntilSync(threshold = PHI_INV, max_steps = 10000) {
    let steps = 0;
    while (this.orderParameter() < threshold && steps < max_steps) {
      this.step();
      steps++;
    }
    return { R: this.orderParameter(), steps, synchronized: this.orderParameter() >= threshold };
  }

  /**
   * Return all oscillator states, sorted by phase proximity to Schumann.
   */
  snapshot() {
    const schumann_phase = (2 * Math.PI * SCHUMANN_HZ * this.t) % (2 * Math.PI);
    return [...this.oscillators.entries()].map(([id, osc]) => ({
      agi_id: id,
      freq_hz: osc.freq,
      phase:   osc.phase.toFixed(4),
      phase_delta_to_schumann: Math.abs(osc.phase - schumann_phase).toFixed(4),
    })).sort((a, b) => parseFloat(a.phase_delta_to_schumann) - parseFloat(b.phase_delta_to_schumann));
  }
}

// ── Resonance Amplifier ───────────────────────────────────────────────────

class ResonanceAmplifier {
  /**
   * Compute the amplification factor for a cluster at order parameter R.
   * Amplification is φ-exponential: A = φ^(R * 4)
   * At R=1 (perfect sync): A = φ⁴ ≈ 6.854
   * At R=0.618 (φ-lock): A = φ^(0.618×4) = φ^2.472 ≈ 3.49
   * @param {number} R — order parameter [0,1]
   * @returns {number}
   */
  static amplificationFactor(R) {
    return PHI ** (R * 4);
  }

  /**
   * Assess a cluster: is it ready for harmonic amplification?
   * @param {KuramotoCluster} cluster
   * @returns {{ ready: boolean, R: number, amplification: number, recommendation: string }}
   */
  static assess(cluster) {
    const R = cluster.orderParameter();
    const amp = ResonanceAmplifier.amplificationFactor(R);
    const ready = R >= PHI_INV;  // φ⁻¹ = 0.618: minimum lock threshold

    return {
      ready,
      R:             parseFloat(R.toFixed(4)),
      amplification: parseFloat(amp.toFixed(4)),
      recommendation: ready
        ? `Cluster synchronized at R=${R.toFixed(3)}; amplification factor ${amp.toFixed(3)}×`
        : `Cluster not yet synchronized (R=${R.toFixed(3)} < ${PHI_INV.toFixed(3)}); continue stepping`,
    };
  }
}

// ── Phase Gate ────────────────────────────────────────────────────────────

class PhaseGate {
  /**
   * Gate: only allow an AGI's output through if its phase is coherent with
   * the Schumann carrier within tolerance τ.
   * @param {number} agi_phase — AGI's current phase (radians)
   * @param {number} t         — current time (seconds)
   * @param {number} tau       — tolerance in radians (default: π × PHI_INV ≈ 1.94)
   */
  static allow(agi_phase, t, tau = Math.PI * PHI_INV) {
    const schumann_phase = (2 * Math.PI * SCHUMANN_HZ * t) % (2 * Math.PI);
    const delta = Math.abs(agi_phase - schumann_phase) % (2 * Math.PI);
    const normalized_delta = Math.min(delta, 2 * Math.PI - delta);
    return {
      allowed:     normalized_delta <= tau,
      delta:       parseFloat(normalized_delta.toFixed(4)),
      tau,
      coherence:   parseFloat((1 - normalized_delta / Math.PI).toFixed(4)),
    };
  }
}

// ── HIAP Public API ───────────────────────────────────────────────────────

const HIAP = {
  /**
   * Create a new harmonic amplification cluster.
   * @param {number} [K_sync] — coupling strength
   */
  createCluster: (K_sync = PHI * PHI) => new KuramotoCluster(K_sync),

  KuramotoCluster,
  ResonanceAmplifier,
  PhaseGate,

  CARRIER_FREQS,
  DESIGNATION: 'PROTO-014',
  NAME:        'Harmonic Intelligence Amplification Protocol',
  SCHUMANN_HZ,
  PHI_HARMONICS: [PHI, PHI**2, PHI**3, PHI**4],
};

export { HIAP, KuramotoCluster, ResonanceAmplifier, PhaseGate };
export default HIAP;
