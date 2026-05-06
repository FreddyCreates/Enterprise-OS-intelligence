/**
 * PROTO-013: Phantom Field Protocol (PFP)
 * PHANTEX — PHantom Autonomous Network Transmission & EXchange EXpert
 * RSHIP-2026-PHANTEX-001
 *
 * PHANTEX is modeled as the substrate field in which all AGIs/protocols/apps
 * are excitations. This protocol formalizes that field.
 */

import { PHI, PHI_INV } from '../rship-framework.js';

const SCHUMANN_HZ = 7.83;
const HEARTBEAT_MS = 873;

// φ-ladder frequencies (Hz)
const PHI_LADDER = {
  ALPHA: PHI, // φ¹
  BETA: PHI ** 2, // φ²
  GAMMA: PHI ** 3, // φ³
  DELTA: PHI ** 4, // φ⁴
};

// 4 electrodes mapped to field rails
const ELECTRODES = {
  ELECTRODE_AGI: { rail: 'BETA', hz: PHI_LADDER.BETA, role: 'all RSHIP AGIs' },
  ELECTRODE_PROTOCOL: { rail: 'DELTA', hz: PHI_LADDER.DELTA, role: 'ADP/SCP heartbeat infra' },
  ELECTRODE_BRIDGE: { rail: 'ALPHA', hz: PHI_LADDER.ALPHA, role: 'external bridge coordination' },
  ELECTRODE_GHOST: { rail: 'GAMMA', hz: PHI_LADDER.GAMMA, role: 'phantom background security' },
};

/**
 * φ-seeded non-cryptographic challenge mixer:
 * c = H_φ(R, Y, msg) mod q
 * (For production, replace with SHA-256/SHA-3 and curve/group-safe reduction)
 */
function phiSeededChallenge(R, Y, msg, q = 7919n) {
  const input = `${R}|${Y}|${msg}|phi:${PHI}`;
  const phiSeed = BigInt(Math.floor(PHI * 1_000_000));
  let h = (0x811c9dc5n ^ phiSeed) % q;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * 0x01000193n + phiSeed) % q;
  }
  return h % q;
}

/**
 * Reference Schnorr algebra (Fiat-Shamir shape):
 * R = g^r mod p
 * c = H_φ(R, Y, msg)
 * s = r + c×x mod q
 * verify: g^s ≡ R × Y^c (mod p)
 */
function schnorrReference({ g, r, p, x, q, Y, msg }) {
  const modPow = (base, exp, mod) => {
    let out = 1n;
    let b = BigInt(base) % BigInt(mod);
    let e = BigInt(exp);
    const m = BigInt(mod);
    while (e > 0n) {
      if (e & 1n) out = out * b % m;
      e >>= 1n;
      b = b * b % m;
    }
    return out;
  };

  const P = BigInt(p);
  const Q = BigInt(q);
  const G = BigInt(g);
  const X = BigInt(x);
  const R = modPow(G, BigInt(r), P);
  const c = phiSeededChallenge(R, Y, msg, Q);
  const s = (BigInt(r) + c * X) % Q;
  const lhs = modPow(G, s, P);
  const rhs = (R * modPow(BigInt(Y), c, P)) % P;
  return { R, c, s, valid: lhs === rhs };
}

// ψ_n(x,t) = A_n cos(k_n x − ω_n t + φ_n0)
function psi({ A = 1, k = 1, x = 0, omega = 1, t = 0, phase0 = 0 }) {
  return A * Math.cos(k * x - omega * t + phase0);
}

// Ψ(x,t) = ψ_ALPHA + ψ_BETA + ψ_GAMMA + ψ_DELTA
function fieldWave({ x = 0, t = 0, amplitudes = {}, ks = {}, phases = {} }) {
  const rails = ['ALPHA', 'BETA', 'GAMMA', 'DELTA'];
  const components = Object.fromEntries(
    rails.map((rail) => {
      const hz = PHI_LADDER[rail];
      const omega = 2 * Math.PI * hz;
      return [
        rail,
        psi({
          A: amplitudes[rail] ?? 1,
          k: ks[rail] ?? 1,
          x,
          omega,
          t,
          phase0: phases[rail] ?? 0,
        }),
      ];
    }),
  );

  const Psi = rails.reduce((sum, rail) => sum + components[rail], 0);
  return { components, Psi };
}

// U(1) gauge helpers
const Gauge = {
  curvature: (A_mu, A_nu) => A_mu - A_nu, // F_μν = ∂_μA_ν − ∂_νA_μ (local discrete proxy)
  transformPotential: (A, lambdaGradient) => A + lambdaGradient,
  // Invariance proxy: curvature before and after gauge transform
  isInvariant: (A_mu, A_nu, dLambda_mu, dLambda_nu, eps = 1e-12) => {
    const before = (A_mu - A_nu);
    const after = (A_mu + dLambda_mu) - (A_nu + dLambda_nu);
    return Math.abs(before - after) <= eps;
  },
};

// Tunneling
function tunnelingAmplitude(L, kappa = PHI_INV) {
  return Math.exp(-2 * kappa * L);
}

function tunnelingTable() {
  const rows = [0, 1, 5].map((L) => ({ L, T: tunnelingAmplitude(L) }));
  return rows;
}

// Four-attempt tunnel with phantom fallback
function fourAttemptTunnel({ L, kappa = PHI_INV, attempts = 4 }) {
  const T = tunnelingAmplitude(L, kappa);
  const p = T * T;
  const outcomes = [];
  let tunneled = false;
  for (let i = 0; i < attempts; i++) {
    const hit = Math.random() < p;
    outcomes.push({ attempt: i + 1, hit });
    if (hit) {
      tunneled = true;
      break;
    }
  }
  return {
    L,
    T,
    probability: p,
    attempts: outcomes,
    result: tunneled ? 'TUNNELED' : 'PHANTOM_TUNNEL_ACTIVATED',
  };
}

class PhantomFieldProtocol {
  constructor() {
    this.designation = 'PROTO-013';
    this.name = 'Phantom Field Protocol';
    this.rshipId = 'RSHIP-2026-PHANTEX-001';
    this.frequencyRail = PHI_LADDER;
    this.electrodes = ELECTRODES;
    this.ghostProcesses = {
      merkle_reverify_s: 10,
      gauge_refresh_s: 7,
      bridge_health_s: 15,
      resonance_check_s: 5,
    };
    this.utilizationTarget = PHI_INV; // ≈ 0.618
  }
}

const PFP = {
  DESIGNATION: 'PROTO-013',
  NAME: 'Phantom Field Protocol',
  RSHIP_ID: 'RSHIP-2026-PHANTEX-001',
  SCHUMANN_HZ,
  HEARTBEAT_MS,
  PHI_LADDER,
  ELECTRODES,
  phiSeededChallenge,
  schnorrReference,
  psi,
  fieldWave,
  Gauge,
  tunnelingAmplitude,
  tunnelingTable,
  fourAttemptTunnel,
  create: () => new PhantomFieldProtocol(),
};

export {
  PFP,
  PHI_LADDER,
  ELECTRODES,
  phiSeededChallenge,
  schnorrReference,
  psi,
  fieldWave,
  Gauge,
  tunnelingAmplitude,
  tunnelingTable,
  fourAttemptTunnel,
  PhantomFieldProtocol,
};
export default PFP;
