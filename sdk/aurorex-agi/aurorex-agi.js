/**
 * AUROREX AGI — Temporal Foresight Intelligence
 *
 * Official Designation: RSHIP-2026-AUROREX-001
 * Classification: Multi-Horizon Temporal Intelligence & Predictive Foresight System
 * Full Name: Aurora Intelligence Executive
 * Latin root: aurora (dawn, first light, harbinger of what is coming)
 *
 * AUROREX is the organism's time-domain intelligence system.  Just as aurora
 * borealis appears at the boundary of night and day, AUROREX operates at the
 * boundary of the known (past) and the unknown (future), illuminating what
 * is about to emerge.
 *
 * AUROREX contains 5 internal sub-models operating across time horizons:
 *
 *  AUROREX-RECALL    — historical synthesis (H-∞ to H-0): extracts structural
 *                       patterns from all past data the organism has processed
 *  AUROREX-SENSE     — real-time intelligence (H-0): current state awareness,
 *                       live signal processing, present-moment coherence
 *  AUROREX-CAST      — short-horizon forecasting (H+1 to H+12): probabilistic
 *                       predictions with φ-weighted confidence intervals
 *  AUROREX-CYCLE     — temporal cycle detection (all horizons): Fibonacci,
 *                       seasonal, resonance, and regime cycles
 *  AUROREX-ORACLE    — long-horizon strategic foresight (H+12 to H+∞):
 *                       scenario generation and black-swan early detection
 *
 * AUROREX operates at φ² Hz (2.618 Hz) — the second harmonic, aligned with
 * medium-frequency temporal dynamics.
 *
 * Theory:
 *  - State Space Models (Harvey, 1989) — structural time series
 *  - Bayesian Time Series (West & Harrison, 1997) — DLM framework
 *  - Regime-Switching Models (Hamilton, 1989) — Markov switching
 *  - Long Memory Processes (Hurst, 1951) — H exponent
 *  - φ-harmonic temporal structures (Medina, AURUM Paper XXII)
 *
 * Applications:
 *  - Airport demand forecasting (AEROLEX + TRAVEX integration)
 *  - Market regime detection for aviation/real estate/healthcare
 *  - IP filing timing optimization (file before the market converges)
 *  - Organism heartbeat prediction and anticipatory resource allocation
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const HEARTBEAT_MS = 873;
const AUROREX_FREQ = PHI ** 2;   // 2.618 Hz

// ── Sub-Model Definitions ─────────────────────────────────────────────────

const SUB_MODELS = {
  RECALL:  { id: 'AUROREX-RECALL',  role: 'Historical synthesis (H-∞ to H-0)',       freq: PHI_INV   },
  SENSE:   { id: 'AUROREX-SENSE',   role: 'Real-time state awareness (H-0)',          freq: PHI       },
  CAST:    { id: 'AUROREX-CAST',    role: 'Short-horizon forecasting (H+1 to H+12)',  freq: PHI**2    },
  CYCLE:   { id: 'AUROREX-CYCLE',   role: 'Temporal cycle detection (all horizons)',  freq: PHI**3    },
  ORACLE:  { id: 'AUROREX-ORACLE',  role: 'Long-horizon foresight (H+12 to H+∞)',     freq: PHI**4    },
};

// ── AUROREX-RECALL ────────────────────────────────────────────────────────

class AurorexRecall {
  /**
   * Extract structural patterns from a historical time series.
   * Returns trend, seasonality, and cycle components (STL-like decomposition).
   * @param {number[]} series — time series values
   * @param {number}   period — seasonal period (default: Fibonacci nearest to series length)
   */
  static decompose(series, period = null) {
    if (series.length < 4) return { trend: series, seasonal: [], residual: [] };

    // Use nearest Fibonacci number as natural period
    const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const p = period || fibs.reduce((best, f) =>
      Math.abs(f - series.length / PHI) < Math.abs(best - series.length / PHI) ? f : best, 1);

    // Trend: φ-weighted moving average
    const trend = series.map((_, i) => {
      const window = series.slice(Math.max(0, i - p), i + p + 1);
      const weights = window.map((_, j) => PHI_INV ** Math.abs(j - Math.floor(window.length / 2)));
      const total = weights.reduce((a, b) => a + b, 0);
      return window.reduce((s, v, j) => s + v * weights[j], 0) / total;
    });

    // Seasonal: detrended series averaged over periods
    const detrended = series.map((v, i) => v - trend[i]);
    const seasonal  = series.map((_, i) => {
      const same_phase = detrended.filter((_, j) => (j % p) === (i % p));
      return same_phase.reduce((a, b) => a + b, 0) / (same_phase.length || 1);
    });

    const residual = series.map((v, i) => v - trend[i] - seasonal[i]);

    const hurst = AurorexRecall._hurstExponent(series);
    return {
      trend, seasonal, residual, period: p, hurst,
      regime: hurst > 0.6 ? 'TRENDING' : hurst < 0.4 ? 'MEAN_REVERTING' : 'RANDOM_WALK',
    };
  }

  /**
   * Hurst exponent via R/S analysis — measures long memory.
   * H > 0.5: trending (persistent), H < 0.5: mean-reverting, H = 0.5: random walk.
   */
  static _hurstExponent(series) {
    if (series.length < 8) return 0.5;
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const dev  = series.map(x => x - mean);
    const cumdev = dev.reduce((acc, d) => { acc.push((acc[acc.length - 1] || 0) + d); return acc; }, []);
    const R = Math.max(...cumdev) - Math.min(...cumdev);
    const S = Math.sqrt(dev.reduce((s, d) => s + d * d, 0) / series.length);
    return S === 0 ? 0.5 : parseFloat((Math.log(R / S) / Math.log(series.length)).toFixed(4));
  }
}

// ── AUROREX-SENSE ─────────────────────────────────────────────────────────

class AurorexSense {
  constructor() {
    this.stream  = [];    // rolling window of real-time signals
    this.maxLen  = 89;    // Fibonacci-89 window
  }

  /** Ingest a real-time data point. */
  observe(value, label = '') {
    this.stream.push({ value, label, ts: Date.now() });
    if (this.stream.length > this.maxLen) this.stream.shift();
  }

  /** Current state snapshot: latest value + φ-weighted velocity + acceleration. */
  snapshot() {
    if (this.stream.length < 2) return { value: this.stream[0]?.value || 0, velocity: 0, acceleration: 0 };
    const vals = this.stream.map(s => s.value);
    const n    = vals.length;
    const velocity     = vals[n-1] - vals[n-2];
    const acceleration = n > 2 ? velocity - (vals[n-2] - vals[n-3]) : 0;
    const phi_momentum = PHI * velocity + PHI_INV * acceleration;
    return {
      value:        vals[n-1],
      velocity,
      acceleration,
      phi_momentum: parseFloat(phi_momentum.toFixed(6)),
      window_size:  n,
      trend:        velocity > 0 ? 'UP' : velocity < 0 ? 'DOWN' : 'FLAT',
    };
  }
}

// ── AUROREX-CAST ──────────────────────────────────────────────────────────

class AurorexCast {
  /**
   * Short-horizon forecast: project N steps forward using φ-exponential smoothing.
   * @param {number[]} series
   * @param {number}   N steps ahead
   * @param {number}   alpha smoothing factor (default: φ⁻¹ ≈ 0.618)
   */
  static forecast(series, N = 5, alpha = PHI_INV) {
    if (series.length === 0) return [];
    // Exponential smoothing: S_t = α·x_t + (1-α)·S_{t-1}
    let S = series[0];
    for (const x of series) S = alpha * x + (1 - alpha) * S;

    // Trend estimate: φ-weighted slope of last 8 observations
    const recent = series.slice(-8);
    const slope  = recent.length > 1
      ? recent.slice(1).reduce((s, x, i) => s + PHI_INV ** i * (x - recent[i]), 0)
        / recent.slice(1).reduce((s, _, i) => s + PHI_INV ** i, 0)
      : 0;

    return Array.from({ length: N }, (_, h) => {
      const point = S + slope * (h + 1);
      const std   = Math.abs(slope) * Math.sqrt(h + 1) * PHI_INV;
      return {
        horizon:    h + 1,
        forecast:   parseFloat(point.toFixed(6)),
        lower_80:   parseFloat((point - 1.282 * std).toFixed(6)),
        upper_80:   parseFloat((point + 1.282 * std).toFixed(6)),
        lower_95:   parseFloat((point - 1.960 * std).toFixed(6)),
        upper_95:   parseFloat((point + 1.960 * std).toFixed(6)),
        confidence: parseFloat((1 - PHI_INV ** (h + 1)).toFixed(4)),
      };
    });
  }
}

// ── AUROREX-CYCLE ─────────────────────────────────────────────────────────

class AurorexCycle {
  /**
   * Detect cycles in a time series using φ-harmonic spectral analysis.
   * @param {number[]} series
   */
  static detect(series) {
    const N = series.length;
    if (N < 8) return { cycles: [], dominant_period: null };

    // Compute autocorrelation at lags 1..N/2
    const mean = series.reduce((a, b) => a + b, 0) / N;
    const variance = series.reduce((s, x) => s + (x - mean) ** 2, 0) / N;
    const acf = Array.from({ length: Math.floor(N / 2) }, (_, lag) => {
      lag += 1;
      const cov = series.slice(0, N - lag).reduce((s, x, i) =>
        s + (x - mean) * (series[i + lag] - mean), 0) / (N - lag);
      return { lag, acf: variance === 0 ? 0 : parseFloat((cov / variance).toFixed(4)) };
    });

    // Find peaks in ACF (local maxima) — these are cycle periods
    const peaks = acf.filter((a, i) =>
      i > 0 && i < acf.length - 1 &&
      a.acf > acf[i-1].acf && a.acf > acf[i+1].acf && a.acf > PHI_INV * 0.5
    );

    // Check which periods are Fibonacci
    const cycles = peaks.map(p => ({
      period:      p.lag,
      strength:    p.acf,
      is_fibonacci: [1,2,3,5,8,13,21,34,55,89].includes(p.lag),
      is_phi_harmonic: Math.abs(p.lag - PHI * Math.round(p.lag / PHI)) / p.lag < 0.1,
    }));

    const dominant = cycles.sort((a, b) => b.strength - a.strength)[0];
    return { cycles, dominant_period: dominant?.period || null, phi_cycles: cycles.filter(c => c.is_phi_harmonic).length };
  }
}

// ── AUROREX-ORACLE ────────────────────────────────────────────────────────

class AurorexOracle {
  /**
   * Long-horizon scenario generation: produces N scenarios with probabilities.
   * Uses φ-weighted branching: most-likely scenario has weight φ, next φ⁻¹, etc.
   * @param {string} context — description of current state
   * @param {string[]} drivers — key variables driving the future
   * @param {number} N — number of scenarios (default: 3)
   */
  static scenarios(context, drivers, N = 3) {
    const archetypes = [
      { name: 'Exponential Growth',    description: 'φ-growth dynamics dominate; all drivers amplify each other',   probability_weight: PHI     },
      { name: 'Stable Equilibrium',    description: 'System finds φ-attractor; sustainable steady state emerges',    probability_weight: PHI_INV },
      { name: 'Phase Transition',      description: 'Critical threshold crossed; fundamental regime change occurs',  probability_weight: PHI_INV ** 2 },
      { name: 'Black Swan Disruption', description: 'Low-probability, high-impact event restructures the landscape', probability_weight: PHI_INV ** 3 },
    ];

    const selected    = archetypes.slice(0, N);
    const total_weight = selected.reduce((s, a) => s + a.probability_weight, 0);

    return selected.map((arch, i) => ({
      scenario_id:   i + 1,
      name:          arch.name,
      probability:   parseFloat((arch.probability_weight / total_weight).toFixed(4)),
      description:   `${arch.description}. Context: ${context}. Key drivers: ${drivers.join(', ')}.`,
      time_horizon:  `${(i + 1) * 12} months`,
      phi_signal:    parseFloat((arch.probability_weight * SCHUMANN_HZ).toFixed(4)),
      early_warning: drivers.slice(0, 2).map(d => `Monitor ${d} for deviation > φ⁻¹`).join('; '),
    }));
  }
}

// ── AUROREX Main Class ────────────────────────────────────────────────────

class AUROREX {
  constructor() {
    this.sense  = new AurorexSense();
    this.beats  = 0;
    this.memory = new EternalMemory('AUROREX');
  }

  /** Full temporal intelligence cycle. */
  async temporalCycle(series, context = '', drivers = []) {
    const decomposition = AurorexRecall.decompose(series);
    const current       = this.sense.snapshot();
    const forecast      = AurorexCast.forecast(series, 5);
    const cycles        = AurorexCycle.detect(series);
    const scenarios     = AurorexOracle.scenarios(context, drivers, 3);

    return { decomposition, current, forecast, cycles, scenarios,
             timestamp: Date.now(), schumann_phase: (2 * Math.PI * SCHUMANN_HZ * Date.now() / 1000) % (2 * Math.PI) };
  }

  pulse() {
    this.sense.observe(this.beats * PHI_INV);  // self-observe each heartbeat
    this.beats++;
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export { AUROREX, AurorexRecall, AurorexSense, AurorexCast, AurorexCycle, AurorexOracle, SUB_MODELS };
export const AUROREX_DESIGNATION = 'RSHIP-2026-AUROREX-001';
export const AUROREX_NAME        = 'Aurora Intelligence Executive';
export const AUROREX_FREQ_HZ     = PHI ** 2;
export default AUROREX;
