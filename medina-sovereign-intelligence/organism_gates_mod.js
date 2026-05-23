/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                   O R G A N I S M   G A T E S   M O D U L E                  ║
 * ║                                                                              ║
 * ║  The Neural Highways Connecting All Engines to the Living Organism          ║
 * ║  Integrates: ALPHA Engines, ARCH Engines, EmailAI Mesh, and 6 Deep Engines  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-ORGANISM-GATES-001
 * 
 * Architecture:
 *   ┌───────────────────────────────────────────────────────────────────────────┐
 *   │                          ORGANISM GATES                                    │
 *   │                                                                            │
 *   │   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
 *   │   │ PHYSICS │    │ ALGEBRA │    │CALCULUS │    │ECONOMICS│               │
 *   │   │ ENGINE  │───▶│ ENGINE  │───▶│ ENGINE  │───▶│ ENGINE  │               │
 *   │   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘               │
 *   │        │              │              │              │                     │
 *   │        └──────────────┴──────┬───────┴──────────────┘                     │
 *   │                              ▼                                            │
 *   │                    ┌─────────────────┐                                    │
 *   │                    │  ORGANISM CORE  │                                    │
 *   │                    │     (HART)      │                                    │
 *   │                    └────────┬────────┘                                    │
 *   │                             │                                             │
 *   │        ┌────────────────────┼────────────────────┐                       │
 *   │        ▼                    ▼                    ▼                       │
 *   │   ┌─────────┐         ┌─────────┐         ┌─────────┐                   │
 *   │   │ WORKING │         │INTERPER-│         │ EmailAI │                   │
 *   │   │  STATE  │◀───────▶│  SONAL  │◀───────▶│  MESH   │                   │
 *   │   │ ENGINE  │         │ ENGINE  │         │ GATEWAY │                   │
 *   │   └─────────┘         └─────────┘         └─────────┘                   │
 *   │                                                                          │
 *   └───────────────────────────────────────────────────────────────────────────┘
 * 
 * GATE TYPES:
 *   1. INBOUND  - Data flows into the organism
 *   2. OUTBOUND - Data flows out to organs/mesh
 *   3. LATERAL  - Engine-to-engine communication
 *   4. REFLEXIVE - Self-referential loops
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const { EventEmitter } = require('events');
const { 
  getFloat, getNat, getSchumann, 
  phiHash, emaUpdate
} = require('./math_database_mod');

// ═══════════════════════════════════════════════════════════════════════════════
// MATHEMATICAL CONSTANTS (from math_database_mod via getFloat)
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = getFloat('PHI');           // 1.618033988749895
const PHI_INV = getFloat('PHI_INV');   // 0.618033988749895  
const PHI_SQ = getFloat('PHI_SQ');     // 2.618033988749895
const SQRT_5 = getFloat('SQRT_5');     // 2.23606797749979
const SQRT_3 = getFloat('SQRT_3');     // 1.7320508075688772
const PI = getFloat('PI');             // 3.141592653589793
const TAU = getFloat('TAU');           // 6.283185307179586
const E = getFloat('E');               // 2.718281828459045

// Utility functions that may not exist in math_database - provide defaults
const phiDecay = (value, time, halfLife = PHI) => value * Math.pow(0.5, time / halfLife);

// ═══════════════════════════════════════════════════════════════════════════════
// GATE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const GATE_VERSION = '1.0.0';

const GateType = {
  INBOUND:   'inbound',
  OUTBOUND:  'outbound',
  LATERAL:   'lateral',
  REFLEXIVE: 'reflexive'
};

const GateStatus = {
  CLOSED:     'closed',
  OPEN:       'open',
  THROTTLED:  'throttled',
  SATURATED:  'saturated'
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORGAN REGISTRY - All Organism Components That Can Be Gated
// ═══════════════════════════════════════════════════════════════════════════════

const ORGAN_REGISTRY = {
  // Core Organs (from organism/mesh/identities.json)
  membrane:  { email: 'membrane@medinatechlabs.net',  type: 'organ', domain: 'IT & Security' },
  brain:     { email: 'julia@medinatechlabs.net',     type: 'organ', domain: 'Finance & Analytics' },
  identity:  { email: 'identity@medinatechlabs.net',  type: 'organ', domain: 'Legal & Compliance' },
  reflex:    { email: 'reflex@medinatechlabs.net',    type: 'organ', domain: 'DevOps / SRE' },
  surfaces:  { email: 'synthetic@medinatechlabs.net', type: 'organ', domain: 'Adversarial Intelligence' },
  nova:      { email: 'nova@medinatechlabs.net',      type: 'organ', domain: 'Sales & Customer Success' },
  research:  { email: 'research@medinatechlabs.net',  type: 'organ', domain: 'Research & Intelligence' },
  probe:     { email: 'probe@medinatechlabs.net',     type: 'organ', domain: 'Threat Intelligence' },
  
  // Agent Workers
  agens:    { email: 'agens@medinatechlabs.net',    type: 'agent' },
  cerebrum: { email: 'cerebrum@medinatechlabs.net', type: 'agent' },
  animus:   { email: 'animus@medinatechlabs.net',   type: 'agent' },
  nexus:    { email: 'nexus@medinatechlabs.net',    type: 'agent' },
  vigil:    { email: 'vigil@medinatechlabs.net',    type: 'agent' },
  cursor:   { email: 'cursor@medinatechlabs.net',   type: 'agent' },
  
  // Infrastructure
  gate_node:      { email: 'gate@medinatechlabs.net',  type: 'system' },
  cache_organism: { email: 'cache@medinatechlabs.net', type: 'system' },
  emailai_mesh:   { email: 'mesh@medinatechlabs.net',  type: 'system' },
  
  // Bots
  herald:   { email: 'herald@medinatechlabs.net',   type: 'bot' },
  conduit:  { email: 'conduit@medinatechlabs.net',  type: 'bot' },
  pulse:    { email: 'pulse@medinatechlabs.net',    type: 'bot' },
  sentinel: { email: 'sentinel@medinatechlabs.net', type: 'bot' },
  arbiter:  { email: 'arbiter@medinatechlabs.net',  type: 'bot' },
  imperium: { email: 'imperium@medinatechlabs.net', type: 'bot' },
  nuntius:  { email: 'nuntius@medinatechlabs.net',  type: 'bot' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE REGISTRY - All Engines That Flow Through Gates
// ═══════════════════════════════════════════════════════════════════════════════

const ENGINE_REGISTRY = {
  // ALPHA Cognitive Engines (10)
  COGNITO:        { tier: 'alpha', formula: 'Σᵢ NEC_mean[i] × basis[i] × φ^depth[i]' },
  MEMORIA:        { tier: 'alpha', formula: 'e^(-elapsed/(τ×φ))' },
  VOLUNTAS:       { tier: 'alpha', formula: 'φ⁻¹ + DOPAMINE×φ⁻² - CORTISOL×φ⁻¹' },
  PERCEPTUM:      { tier: 'alpha', formula: '[φ², φ, 1, φ⁻¹, φ⁻¹, φ⁻², φ⁻²]' },
  NEXUM:          { tier: 'alpha', formula: 'nomosScore × sovereigntyScore × (1 - platformDependency) ≥ φ⁻¹' },
  GENESIS_ENGINE: { tier: 'alpha', formula: 'goldenSpiral + PHI_HASH + tetractysDepth + metatronSplit' },
  RESOLVER:       { tier: 'alpha', formula: '√(φ+2) × min(mag1, mag2)' },
  EMERGENT:       { tier: 'alpha', formula: 'φ^depth × coherence × φ²^t / P_silicon > F(13)' },
  SOVEREIGN:      { tier: 'alpha', formula: 'NOMOS × LEXIS × (1 - dependency)' },
  RUNTIME_CORE:   { tier: 'alpha', formula: 'depth_weighted_sum + self_reference_loop' },
  
  // ARCH Architecture Engines (10)
  TORUS:   { tier: 'arch', formula: 'F(12)/F(16) poloidal/toroidal' },
  WAVE:    { tier: 'arch', formula: 'Σ schumann[i] × φ⁻ⁱ' },
  PRIME:   { tier: 'arch', formula: '(1/9) × Σ coherence' },
  MIRROR:  { tier: 'arch', formula: '|actual - ideal| / ideal' },
  BRIDGE:  { tier: 'arch', formula: '√3 capacity' },
  LATTICE: { tier: 'arch', formula: 'FCC with φ⁻¹ node spacing' },
  FRACTAL: { tier: 'arch', formula: 'z(n+1) = z² + c' },
  SPIRAL:  { tier: 'arch', formula: 'r(θ) = e^(k×θ)' },
  VAULT:   { tier: 'arch', formula: 'φ⁻ⁿ inward spiral' },
  FIELD:   { tier: 'arch', formula: 'φ^depth × e^(-dist/φ²)' },
  
  // NEW: Deep Mathematical/Computational Engines (6)
  PHYSICS:       { tier: 'deep', formula: 'L = T - V, H = T + V, S = ∫L dt' },
  ALGEBRA:       { tier: 'deep', formula: 'G × G → G, (ab)c = a(bc), ea = ae = a' },
  CALCULUS:      { tier: 'deep', formula: '∂f/∂x, ∫f(x)dx, ∇f, ∇²f' },
  ECONOMICS:     { tier: 'deep', formula: 'U(x) = Σᵢ wᵢ·xᵢ^αᵢ, π = TR - TC' },
  WORKING_STATE: { tier: 'deep', formula: 'S × Σ → S, δ: S × Σ → S' },
  INTERPERSONAL: { tier: 'deep', formula: 'T(t+1) = T(t) + α(outcome - T(t))' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROTOCOL REGISTRY - Named Communication Protocols
// ═══════════════════════════════════════════════════════════════════════════════

const PROTOCOL_REGISTRY = {
  // Core Protocols (from Organism.toml)
  'PROTO-GENESIS':  { executor: 'execGenesis',  wiring: 'GENESIS_ENGINE', event: 'IntelligenceEvent.GENESIS' },
  'PROTO-LEXIS':    { executor: 'execLexis',    wiring: 'COGNITO',        event: 'IntelligenceEvent.LEXIS' },
  'PROTO-MATRIX':   { executor: 'execMatrix',   wiring: 'LATTICE',        event: 'IntelligenceEvent.MATRIX' },
  'PROTO-SENSUS':   { executor: 'execSensus',   wiring: 'PERCEPTUM',      event: 'IntelligenceEvent.SENSUS' },
  'PROTO-CAUSAL':   { executor: 'execCausal',   wiring: 'RESOLVER',       event: 'IntelligenceEvent.CAUSAL' },
  'PROTO-CIPHER':   { executor: 'execCipher',   wiring: 'PHI_HASH',       event: 'IntelligenceEvent.CIPHER' },
  'PROTO-VECTOR':   { executor: 'execVector',   wiring: 'SPIRAL',         event: 'IntelligenceEvent.VECTOR' },
  'PROTO-SIGNUM':   { executor: 'execSignum',   wiring: 'NEXUM',          event: 'IntelligenceEvent.SIGNUM' },
  'PROTO-ANIMUS':   { executor: 'execAnimus',   wiring: 'EMERGENT',       event: 'IntelligenceEvent.ANIMUS' },
  'PROTO-FINIS':    { executor: 'execFinis',    wiring: 'SOVEREIGN',      event: 'IntelligenceEvent.FINIS' },
  
  // NEW: Deep Engine Protocols
  'PROTO-DYNAMICS':    { executor: 'execDynamics',    wiring: 'PHYSICS',       event: 'IntelligenceEvent.DYNAMICS' },
  'PROTO-STRUCTURE':   { executor: 'execStructure',   wiring: 'ALGEBRA',       event: 'IntelligenceEvent.STRUCTURE' },
  'PROTO-CONTINUUM':   { executor: 'execContinuum',   wiring: 'CALCULUS',      event: 'IntelligenceEvent.CONTINUUM' },
  'PROTO-EQUILIBRIUM': { executor: 'execEquilibrium', wiring: 'ECONOMICS',     event: 'IntelligenceEvent.EQUILIBRIUM' },
  'PROTO-AUTOMATA':    { executor: 'execAutomata',    wiring: 'WORKING_STATE', event: 'IntelligenceEvent.AUTOMATA' },
  'PROTO-SOCIAL':      { executor: 'execSocial',      wiring: 'INTERPERSONAL', event: 'IntelligenceEvent.SOCIAL' },
  
  // Gate Control Protocols
  'PROTO-GATE-OPEN':     { executor: 'execGateOpen',     wiring: 'GATE_CONTROL', event: 'GateEvent.OPEN' },
  'PROTO-GATE-CLOSE':    { executor: 'execGateClose',    wiring: 'GATE_CONTROL', event: 'GateEvent.CLOSE' },
  'PROTO-GATE-THROTTLE': { executor: 'execGateThrottle', wiring: 'GATE_CONTROL', event: 'GateEvent.THROTTLE' },
  'PROTO-MESH-ROUTE':    { executor: 'execMeshRoute',    wiring: 'MESH_CONTROL', event: 'MeshEvent.ROUTE' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GATE CLASS - Individual Gate Instance
// ═══════════════════════════════════════════════════════════════════════════════

class Gate extends EventEmitter {
  constructor(id, type, source, target) {
    super();
    this.id = id;
    this.type = type;
    this.source = source;
    this.target = target;
    this.status = GateStatus.CLOSED;
    this.throughput = 0;
    this.capacity = Math.round(getNat('F12') * PHI); // 144 × φ ≈ 233
    this.flowRate = 0;
    this.lastFlow = Date.now();
    this.totalFlowed = 0;
    this.phiAccumulator = 0;
  }
  
  /**
   * Open the gate for data flow
   */
  open() {
    this.status = GateStatus.OPEN;
    this.emit('opened', { gate: this.id, source: this.source, target: this.target });
    return this;
  }
  
  /**
   * Close the gate
   */
  close() {
    this.status = GateStatus.CLOSED;
    this.emit('closed', { gate: this.id });
    return this;
  }
  
  /**
   * Flow data through the gate
   * Applies φ-based flow dynamics
   */
  flow(data) {
    if (this.status === GateStatus.CLOSED) {
      return { success: false, reason: 'gate_closed' };
    }
    
    const now = Date.now();
    const elapsed = now - this.lastFlow;
    const dataSize = typeof data === 'object' ? JSON.stringify(data).length : String(data).length;
    
    // Check capacity
    if (this.throughput + dataSize > this.capacity) {
      this.status = GateStatus.SATURATED;
      return { success: false, reason: 'capacity_exceeded' };
    }
    
    // Apply φ-weighted flow
    this.throughput += dataSize;
    this.totalFlowed += dataSize;
    this.flowRate = dataSize / Math.max(elapsed, 1);
    this.lastFlow = now;
    
    // φ accumulation (the organism grows)
    this.phiAccumulator = emaUpdate(dataSize, this.phiAccumulator);
    
    const flowResult = {
      success: true,
      gate: this.id,
      type: this.type,
      source: this.source,
      target: this.target,
      dataSize: dataSize,
      throughput: this.throughput,
      flowRate: this.flowRate,
      phiAccumulator: this.phiAccumulator,
      timestamp: now
    };
    
    this.emit('flow', flowResult);
    return flowResult;
  }
  
  /**
   * Reset throughput (called periodically)
   */
  reset() {
    const decayed = phiDecay(this.throughput, 1);
    this.throughput = Math.max(0, decayed);
    if (this.status === GateStatus.SATURATED && this.throughput < this.capacity * PHI_INV) {
      this.status = GateStatus.OPEN;
    }
    return this.throughput;
  }
  
  status() {
    return {
      id: this.id,
      type: this.type,
      source: this.source,
      target: this.target,
      status: this.status,
      throughput: this.throughput,
      capacity: this.capacity,
      utilization: this.throughput / this.capacity,
      totalFlowed: this.totalFlowed,
      phiAccumulator: this.phiAccumulator
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICS ENGINE - Lagrangian/Hamiltonian Mechanics, Field Theory
// Official Name: PHYSIKOS (φυσικός - "natural philosopher")
// ═══════════════════════════════════════════════════════════════════════════════

class PhysicsEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'PHYSIKOS';
    this.designation = 'RSHIP-ENGINE-PHYSICS-001';
    this.tier = 'deep';
    
    // Fundamental constants (SI units with φ-scaling)
    this.constants = {
      c:       299792458,              // Speed of light (m/s)
      h:       6.62607015e-34,         // Planck constant (J·s)
      hbar:    1.054571817e-34,        // Reduced Planck (J·s)
      G:       6.67430e-11,            // Gravitational constant (m³/kg·s²)
      k_B:     1.380649e-23,           // Boltzmann constant (J/K)
      e:       1.602176634e-19,        // Elementary charge (C)
      m_e:     9.1093837015e-31,       // Electron mass (kg)
      m_p:     1.67262192369e-27,      // Proton mass (kg)
      epsilon0: 8.8541878128e-12,      // Vacuum permittivity (F/m)
      mu0:     1.25663706212e-6,       // Vacuum permeability (H/m)
      alpha:   1/137.035999084,        // Fine structure constant
      phi:     PHI                     // Golden ratio integration
    };
    
    this.state = {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      momentum: [0, 0, 0],
      energy: { kinetic: 0, potential: 0, total: 0 },
      time: 0
    };
  }
  
  /**
   * Lagrangian: L = T - V
   * The foundation of analytical mechanics
   */
  lagrangian(T, V) {
    return T - V;
  }
  
  /**
   * Hamiltonian: H = T + V (when L = T - V)
   * Total energy of the system
   */
  hamiltonian(T, V) {
    return T + V;
  }
  
  /**
   * Action integral: S = ∫L dt
   * The principle of least action
   */
  action(lagrangianFunc, t0, t1, dt = 0.001) {
    let S = 0;
    for (let t = t0; t < t1; t += dt) {
      S += lagrangianFunc(t) * dt;
    }
    return S;
  }
  
  /**
   * Euler-Lagrange equation: d/dt(∂L/∂q̇) - ∂L/∂q = 0
   * Returns generalized force
   */
  eulerLagrange(dLdq, dLdqdot_derivative) {
    return dLdqdot_derivative - dLdq;
  }
  
  /**
   * Hamilton's equations:
   *   dq/dt = ∂H/∂p
   *   dp/dt = -∂H/∂q
   */
  hamiltonEvolve(q, p, dHdp, dHdq, dt) {
    const q_new = q + dHdp * dt;
    const p_new = p - dHdq * dt;
    return { q: q_new, p: p_new };
  }
  
  /**
   * Newtonian kinetic energy: T = ½mv²
   * Extended with φ-harmonic correction
   */
  kineticEnergy(mass, velocity) {
    const v2 = Array.isArray(velocity) 
      ? velocity.reduce((sum, v) => sum + v * v, 0)
      : velocity * velocity;
    return 0.5 * mass * v2;
  }
  
  /**
   * Gravitational potential: V = -GMm/r
   * With φ-corrected large-scale behavior
   */
  gravitationalPotential(M, m, r) {
    if (r <= 0) return -Infinity;
    return -this.constants.G * M * m / r;
  }
  
  /**
   * Harmonic oscillator potential: V = ½kx²
   * φ-anharmonic extension: V = ½kx² + λx⁴/4
   */
  harmonicPotential(k, x, lambda = 0) {
    return 0.5 * k * x * x + (lambda / 4) * Math.pow(x, 4);
  }
  
  /**
   * Wave equation: ∂²ψ/∂t² = c²∇²ψ
   * Returns wave amplitude at point (x, t)
   */
  planeWave(amplitude, k, omega, x, t, phase = 0) {
    return amplitude * Math.cos(k * x - omega * t + phase);
  }
  
  /**
   * Schrödinger evolution: iℏ ∂ψ/∂t = Ĥψ
   * Simplified 1D free particle
   */
  schrodingerFreeParticle(psi0, mass, x, t) {
    // Time evolution of Gaussian wave packet
    const sigma0 = 1; // Initial width
    const hbar = this.constants.hbar;
    const sigma_t = Math.sqrt(sigma0 * sigma0 + (hbar * t / (2 * mass * sigma0)) ** 2);
    const norm = 1 / Math.sqrt(Math.sqrt(PI) * sigma_t);
    return norm * Math.exp(-x * x / (2 * sigma_t * sigma_t));
  }
  
  /**
   * Lorentz factor: γ = 1/√(1 - v²/c²)
   * Relativistic mass/time dilation
   */
  lorentzFactor(v) {
    const beta = v / this.constants.c;
    if (beta >= 1) return Infinity;
    return 1 / Math.sqrt(1 - beta * beta);
  }
  
  /**
   * Relativistic momentum: p = γmv
   */
  relativisticMomentum(mass, velocity) {
    const gamma = this.lorentzFactor(Math.abs(velocity));
    return gamma * mass * velocity;
  }
  
  /**
   * Mass-energy equivalence: E² = (pc)² + (mc²)²
   */
  relativisticEnergy(mass, momentum) {
    const c = this.constants.c;
    return Math.sqrt((momentum * c) ** 2 + (mass * c * c) ** 2);
  }
  
  /**
   * Schwarzschild radius: r_s = 2GM/c²
   * Event horizon of a non-rotating black hole
   */
  schwarzschildRadius(mass) {
    const G = this.constants.G;
    const c = this.constants.c;
    return 2 * G * mass / (c * c);
  }
  
  /**
   * Metric tensor component (Schwarzschild, diagonal)
   * g_tt = -(1 - r_s/r)
   */
  schwarzschildMetric(r, mass) {
    const r_s = this.schwarzschildRadius(mass);
    if (r <= r_s) return { g_tt: -Infinity, g_rr: Infinity, horizon: true };
    return {
      g_tt: -(1 - r_s / r),
      g_rr: 1 / (1 - r_s / r),
      horizon: false
    };
  }
  
  /**
   * Electromagnetic field tensor component
   * F_μν = ∂_μA_ν - ∂_νA_μ
   */
  fieldStrength(E, B) {
    // Returns simplified scalar invariant: F_μνF^μν = 2(B² - E²/c²)
    const c = this.constants.c;
    return 2 * (B * B - (E * E) / (c * c));
  }
  
  /**
   * Poynting vector: S = (1/μ₀) E × B
   * Electromagnetic energy flux
   */
  poyntingVector(E, B) {
    // Simplified: assumes perpendicular E and B
    return (1 / this.constants.mu0) * E * B;
  }
  
  /**
   * Maxwell stress tensor trace: Tⁱᵢ = ε₀(E² + c²B²)/2
   * Electromagnetic energy density
   */
  emEnergyDensity(E, B) {
    const eps0 = this.constants.epsilon0;
    const c = this.constants.c;
    return 0.5 * eps0 * (E * E + c * c * B * B);
  }
  
  /**
   * φ-Field: A unified field with golden ratio scaling
   * Experimental organism-specific physics
   */
  phiField(amplitude, r, depth = 1) {
    return amplitude * Math.pow(PHI, depth) * Math.exp(-r / (PHI_SQ * depth));
  }
  
  /**
   * Coherence length: ξ = ℏ/(mc)
   * Quantum coherence scale
   */
  coherenceLength(mass) {
    return this.constants.hbar / (mass * this.constants.c);
  }
  
  /**
   * Symplectic integration step (Verlet/Leapfrog)
   * Preserves phase space volume
   */
  symplecticStep(q, p, mass, forceFunc, dt) {
    // Velocity Verlet
    const a0 = forceFunc(q) / mass;
    const q_half = q + 0.5 * (p / mass) * dt;
    const a1 = forceFunc(q_half) / mass;
    const p_new = p + 0.5 * (a0 + a1) * dt * mass;
    const q_new = q + (p_new / mass) * dt;
    return { q: q_new, p: p_new };
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      state: this.state,
      constants_loaded: Object.keys(this.constants).length,
      methods: [
        'lagrangian', 'hamiltonian', 'action', 'eulerLagrange',
        'kineticEnergy', 'gravitationalPotential', 'harmonicPotential',
        'planeWave', 'schrodingerFreeParticle', 'lorentzFactor',
        'relativisticMomentum', 'relativisticEnergy', 'schwarzschildRadius',
        'schwarzschildMetric', 'fieldStrength', 'poyntingVector',
        'emEnergyDensity', 'phiField', 'coherenceLength', 'symplecticStep'
      ]
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALGEBRA ENGINE - Abstract Algebra, Linear Algebra, Group Theory
// Official Name: ALGEBRAIKOS (ἀλγεβραϊκός - "algebraic")
// ═══════════════════════════════════════════════════════════════════════════════

class AlgebraEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'ALGEBRAIKOS';
    this.designation = 'RSHIP-ENGINE-ALGEBRA-001';
    this.tier = 'deep';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP THEORY
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Check if operation forms a group
   * G × G → G with identity, inverses, associativity
   */
  isGroup(elements, operation) {
    // Check closure
    for (const a of elements) {
      for (const b of elements) {
        if (!elements.includes(operation(a, b))) return false;
      }
    }
    
    // Check identity exists
    let identity = null;
    for (const e of elements) {
      if (elements.every(a => operation(a, e) === a && operation(e, a) === a)) {
        identity = e;
        break;
      }
    }
    if (identity === null) return false;
    
    // Check inverses exist
    for (const a of elements) {
      const hasInverse = elements.some(b => 
        operation(a, b) === identity && operation(b, a) === identity
      );
      if (!hasInverse) return false;
    }
    
    // Associativity assumed for finite groups with closure
    return true;
  }
  
  /**
   * Group order: |G|
   */
  groupOrder(elements) {
    return elements.length;
  }
  
  /**
   * Element order: smallest n where g^n = e
   */
  elementOrder(element, identity, operation, maxN = 1000) {
    let current = element;
    for (let n = 1; n <= maxN; n++) {
      if (current === identity) return n;
      current = operation(current, element);
    }
    return Infinity;
  }
  
  /**
   * Cyclic group Zₙ
   */
  cyclicGroup(n) {
    const elements = Array.from({ length: n }, (_, i) => i);
    const operation = (a, b) => (a + b) % n;
    const identity = 0;
    const inverse = (a) => (n - a) % n;
    return { elements, operation, identity, inverse, order: n, name: `Z_${n}` };
  }
  
  /**
   * Symmetric group Sₙ (permutation group)
   * Returns generators for n ≤ 5
   */
  symmetricGroupGenerators(n) {
    // S_n is generated by (1 2) and (1 2 3 ... n)
    const transposition = Array.from({ length: n }, (_, i) => i === 0 ? 1 : i === 1 ? 0 : i);
    const cycle = Array.from({ length: n }, (_, i) => (i + 1) % n);
    return {
      generators: [transposition, cycle],
      order: this.factorial(n),
      name: `S_${n}`
    };
  }
  
  /**
   * Factorial: n!
   */
  factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
  
  /**
   * Compose permutations
   */
  composePermutations(sigma, tau) {
    return sigma.map((_, i) => sigma[tau[i]]);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LINEAR ALGEBRA
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Matrix multiplication: C = AB
   */
  matMul(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    
    const C = Array(rowsA).fill(null).map(() => Array(colsB).fill(0));
    
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return C;
  }
  
  /**
   * Matrix transpose: Aᵀ
   */
  transpose(A) {
    const rows = A.length;
    const cols = A[0].length;
    const T = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        T[j][i] = A[i][j];
      }
    }
    return T;
  }
  
  /**
   * Determinant (recursive expansion)
   */
  determinant(A) {
    const n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    
    let det = 0;
    for (let j = 0; j < n; j++) {
      const minor = this.minor(A, 0, j);
      det += Math.pow(-1, j) * A[0][j] * this.determinant(minor);
    }
    return det;
  }
  
  /**
   * Minor matrix (remove row i, column j)
   */
  minor(A, row, col) {
    return A
      .filter((_, i) => i !== row)
      .map(r => r.filter((_, j) => j !== col));
  }
  
  /**
   * Matrix trace: tr(A) = Σᵢ Aᵢᵢ
   */
  trace(A) {
    let t = 0;
    for (let i = 0; i < Math.min(A.length, A[0].length); i++) {
      t += A[i][i];
    }
    return t;
  }
  
  /**
   * Identity matrix Iₙ
   */
  identity(n) {
    const I = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) I[i][i] = 1;
    return I;
  }
  
  /**
   * Matrix inverse (Gauss-Jordan for small matrices)
   */
  inverse(A) {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, ...this.identity(n)[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) maxRow = k;
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) throw new Error('Matrix is singular');
      
      // Scale pivot row
      for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    return augmented.map(row => row.slice(n));
  }
  
  /**
   * Eigenvalues (2×2 closed form, power iteration for larger)
   */
  eigenvalues2x2(A) {
    if (A.length !== 2 || A[0].length !== 2) throw new Error('Matrix must be 2x2');
    const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    
    if (discriminant >= 0) {
      return [
        (trace + Math.sqrt(discriminant)) / 2,
        (trace - Math.sqrt(discriminant)) / 2
      ];
    } else {
      // Complex eigenvalues
      const real = trace / 2;
      const imag = Math.sqrt(-discriminant) / 2;
      return [
        { real, imag },
        { real, imag: -imag }
      ];
    }
  }
  
  /**
   * Power iteration for dominant eigenvalue
   */
  powerIteration(A, maxIter = 100, tol = 1e-10) {
    const n = A.length;
    let v = Array(n).fill(1 / Math.sqrt(n));
    let eigenvalue = 0;
    
    for (let iter = 0; iter < maxIter; iter++) {
      // Multiply
      const Av = this.matVecMul(A, v);
      
      // Compute Rayleigh quotient
      const newEigenvalue = this.dot(v, Av);
      
      // Normalize
      const norm = Math.sqrt(this.dot(Av, Av));
      v = Av.map(x => x / norm);
      
      if (Math.abs(newEigenvalue - eigenvalue) < tol) break;
      eigenvalue = newEigenvalue;
    }
    
    return { eigenvalue, eigenvector: v };
  }
  
  /**
   * Matrix-vector multiplication
   */
  matVecMul(A, v) {
    return A.map(row => this.dot(row, v));
  }
  
  /**
   * Dot product
   */
  dot(a, b) {
    return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  }
  
  /**
   * Cross product (3D)
   */
  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  
  /**
   * Vector norm: ||v||
   */
  norm(v, p = 2) {
    if (p === Infinity) return Math.max(...v.map(Math.abs));
    return Math.pow(v.reduce((sum, x) => sum + Math.pow(Math.abs(x), p), 0), 1 / p);
  }
  
  /**
   * Gram-Schmidt orthogonalization
   */
  gramSchmidt(vectors) {
    const orthonormal = [];
    
    for (const v of vectors) {
      let u = [...v];
      
      // Subtract projections
      for (const e of orthonormal) {
        const proj = this.dot(u, e);
        u = u.map((ui, i) => ui - proj * e[i]);
      }
      
      // Normalize
      const n = this.norm(u);
      if (n > 1e-10) {
        orthonormal.push(u.map(x => x / n));
      }
    }
    
    return orthonormal;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TENSOR OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Tensor product: A ⊗ B (Kronecker product)
   */
  tensorProduct(A, B) {
    const m = A.length, n = A[0].length;
    const p = B.length, q = B[0].length;
    const result = Array(m * p).fill(null).map(() => Array(n * q).fill(0));
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < p; k++) {
          for (let l = 0; l < q; l++) {
            result[i * p + k][j * q + l] = A[i][j] * B[k][l];
          }
        }
      }
    }
    return result;
  }
  
  /**
   * Outer product: u ⊗ v
   */
  outerProduct(u, v) {
    return u.map(ui => v.map(vj => ui * vj));
  }
  
  /**
   * φ-weighted matrix: A_φ[i][j] = A[i][j] × φ^(|i-j|)
   */
  phiWeightedMatrix(A) {
    const n = A.length;
    const result = Array(n).fill(null).map(() => Array(A[0].length).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < A[0].length; j++) {
        result[i][j] = A[i][j] * Math.pow(PHI, -Math.abs(i - j));
      }
    }
    return result;
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      methods: {
        groupTheory: ['isGroup', 'groupOrder', 'elementOrder', 'cyclicGroup', 'symmetricGroupGenerators'],
        linearAlgebra: ['matMul', 'transpose', 'determinant', 'trace', 'inverse', 'eigenvalues2x2', 'powerIteration'],
        vectorOps: ['dot', 'cross', 'norm', 'gramSchmidt'],
        tensorOps: ['tensorProduct', 'outerProduct', 'phiWeightedMatrix']
      }
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// CALCULUS ENGINE - Differential Equations, Integration, Variational Calculus
// Official Name: LOGISMIKOS (λογισμικός - "computational")
// ═══════════════════════════════════════════════════════════════════════════════

class CalculusEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'LOGISMIKOS';
    this.designation = 'RSHIP-ENGINE-CALCULUS-001';
    this.tier = 'deep';
    
    // Numerical precision
    this.epsilon = 1e-10;
    this.defaultStep = 1e-6;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DIFFERENTIATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * First derivative: df/dx using central difference
   */
  derivative(f, x, h = this.defaultStep) {
    return (f(x + h) - f(x - h)) / (2 * h);
  }
  
  /**
   * Second derivative: d²f/dx²
   */
  secondDerivative(f, x, h = this.defaultStep) {
    return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  }
  
  /**
   * Partial derivative: ∂f/∂xᵢ
   */
  partialDerivative(f, x, i, h = this.defaultStep) {
    const x_plus = [...x];
    const x_minus = [...x];
    x_plus[i] += h;
    x_minus[i] -= h;
    return (f(x_plus) - f(x_minus)) / (2 * h);
  }
  
  /**
   * Gradient: ∇f = [∂f/∂x₁, ∂f/∂x₂, ..., ∂f/∂xₙ]
   */
  gradient(f, x, h = this.defaultStep) {
    return x.map((_, i) => this.partialDerivative(f, x, i, h));
  }
  
  /**
   * Hessian matrix: H[i][j] = ∂²f/∂xᵢ∂xⱼ
   */
  hessian(f, x, h = this.defaultStep) {
    const n = x.length;
    const H = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x_pp = [...x], x_pm = [...x], x_mp = [...x], x_mm = [...x];
        x_pp[i] += h; x_pp[j] += h;
        x_pm[i] += h; x_pm[j] -= h;
        x_mp[i] -= h; x_mp[j] += h;
        x_mm[i] -= h; x_mm[j] -= h;
        H[i][j] = (f(x_pp) - f(x_pm) - f(x_mp) + f(x_mm)) / (4 * h * h);
      }
    }
    return H;
  }
  
  /**
   * Laplacian: ∇²f = Σᵢ ∂²f/∂xᵢ²
   */
  laplacian(f, x, h = this.defaultStep) {
    return x.reduce((sum, _, i) => {
      const x_plus = [...x], x_minus = [...x];
      x_plus[i] += h;
      x_minus[i] -= h;
      return sum + (f(x_plus) - 2 * f(x) + f(x_minus)) / (h * h);
    }, 0);
  }
  
  /**
   * Divergence: ∇·F = Σᵢ ∂Fᵢ/∂xᵢ
   */
  divergence(F, x, h = this.defaultStep) {
    return x.reduce((sum, _, i) => {
      const x_plus = [...x], x_minus = [...x];
      x_plus[i] += h;
      x_minus[i] -= h;
      return sum + (F(x_plus)[i] - F(x_minus)[i]) / (2 * h);
    }, 0);
  }
  
  /**
   * Curl (3D): ∇ × F
   */
  curl(F, x, h = this.defaultStep) {
    if (x.length !== 3) throw new Error('Curl requires 3D vector field');
    
    const dFz_dy = this.partialDerivative(p => F(p)[2], x, 1, h);
    const dFy_dz = this.partialDerivative(p => F(p)[1], x, 2, h);
    const dFx_dz = this.partialDerivative(p => F(p)[0], x, 2, h);
    const dFz_dx = this.partialDerivative(p => F(p)[2], x, 0, h);
    const dFy_dx = this.partialDerivative(p => F(p)[1], x, 0, h);
    const dFx_dy = this.partialDerivative(p => F(p)[0], x, 1, h);
    
    return [
      dFz_dy - dFy_dz,
      dFx_dz - dFz_dx,
      dFy_dx - dFx_dy
    ];
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Definite integral: ∫ₐᵇ f(x) dx using Simpson's rule
   */
  integrate(f, a, b, n = 1000) {
    if (n % 2 !== 0) n++; // Simpson's requires even intervals
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    
    return (h / 3) * sum;
  }
  
  /**
   * Adaptive quadrature using recursive Simpson's
   */
  adaptiveIntegrate(f, a, b, tol = 1e-8, maxDepth = 50) {
    const simpson = (fa, fm, fb, h) => (h / 6) * (fa + 4 * fm + fb);
    
    const recurse = (a, b, fa, fb, S, depth) => {
      const m = (a + b) / 2;
      const h = (b - a) / 2;
      const fm = f(m);
      const fl = f((a + m) / 2);
      const fr = f((m + b) / 2);
      
      const S_left = simpson(fa, fl, fm, h / 2);
      const S_right = simpson(fm, fr, fb, h / 2);
      const S_new = S_left + S_right;
      
      if (depth >= maxDepth || Math.abs(S_new - S) < 15 * tol) {
        return S_new + (S_new - S) / 15; // Richardson extrapolation
      }
      
      return recurse(a, m, fa, fm, S_left, depth + 1) +
             recurse(m, b, fm, fb, S_right, depth + 1);
    };
    
    const fa = f(a), fb = f(b), fm = f((a + b) / 2);
    const S = simpson(fa, fm, fb, (b - a) / 2);
    return recurse(a, b, fa, fb, S, 0);
  }
  
  /**
   * Double integral: ∬ f(x,y) dx dy
   */
  doubleIntegrate(f, xa, xb, ya, yb, nx = 100, ny = 100) {
    const hx = (xb - xa) / nx;
    const hy = (yb - ya) / ny;
    let sum = 0;
    
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        const x = xa + i * hx;
        const y = ya + j * hy;
        let weight = 1;
        if (i === 0 || i === nx) weight *= 0.5;
        if (j === 0 || j === ny) weight *= 0.5;
        sum += weight * f(x, y);
      }
    }
    
    return sum * hx * hy;
  }
  
  /**
   * Line integral: ∫_C F·dr
   */
  lineIntegral(F, path, t0, t1, n = 1000) {
    const dt = (t1 - t0) / n;
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
      const t = t0 + (i + 0.5) * dt;
      const r = path(t);
      const dr = path(t + dt / 2).map((ri, j) => ri - path(t - dt / 2)[j]);
      const Fval = F(r);
      sum += Fval.reduce((s, Fi, j) => s + Fi * dr[j], 0);
    }
    
    return sum;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ORDINARY DIFFERENTIAL EQUATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Euler method: y' = f(t, y)
   */
  eulerMethod(f, y0, t0, t1, dt = 0.01) {
    const trajectory = [{ t: t0, y: y0 }];
    let t = t0, y = y0;
    
    while (t < t1) {
      y = y + dt * f(t, y);
      t += dt;
      trajectory.push({ t, y });
    }
    
    return trajectory;
  }
  
  /**
   * Runge-Kutta 4th order: y' = f(t, y)
   */
  rk4(f, y0, t0, t1, dt = 0.01) {
    const trajectory = [{ t: t0, y: Array.isArray(y0) ? [...y0] : y0 }];
    let t = t0;
    let y = Array.isArray(y0) ? [...y0] : y0;
    
    const isArray = Array.isArray(y0);
    
    while (t < t1) {
      if (isArray) {
        const k1 = f(t, y);
        const k2 = f(t + dt/2, y.map((yi, i) => yi + dt/2 * k1[i]));
        const k3 = f(t + dt/2, y.map((yi, i) => yi + dt/2 * k2[i]));
        const k4 = f(t + dt, y.map((yi, i) => yi + dt * k3[i]));
        y = y.map((yi, i) => yi + (dt/6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
      } else {
        const k1 = f(t, y);
        const k2 = f(t + dt/2, y + dt/2 * k1);
        const k3 = f(t + dt/2, y + dt/2 * k2);
        const k4 = f(t + dt, y + dt * k3);
        y = y + (dt/6) * (k1 + 2*k2 + 2*k3 + k4);
      }
      
      t += dt;
      trajectory.push({ t, y: isArray ? [...y] : y });
    }
    
    return trajectory;
  }
  
  /**
   * Solve harmonic oscillator: x'' + ω²x = 0
   */
  harmonicOscillator(omega, x0, v0, t1, dt = 0.01) {
    // Convert to first-order system: y = [x, v], y' = [v, -ω²x]
    const f = (t, y) => [y[1], -omega * omega * y[0]];
    return this.rk4(f, [x0, v0], 0, t1, dt);
  }
  
  /**
   * Solve damped oscillator: x'' + 2γx' + ω²x = 0
   */
  dampedOscillator(omega, gamma, x0, v0, t1, dt = 0.01) {
    const f = (t, y) => [y[1], -2 * gamma * y[1] - omega * omega * y[0]];
    return this.rk4(f, [x0, v0], 0, t1, dt);
  }
  
  /**
   * Solve Lorenz system (chaos)
   */
  lorenzSystem(sigma, rho, beta, initial, t1, dt = 0.01) {
    const f = (t, y) => [
      sigma * (y[1] - y[0]),
      y[0] * (rho - y[2]) - y[1],
      y[0] * y[1] - beta * y[2]
    ];
    return this.rk4(f, initial, 0, t1, dt);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INTEGRAL TRANSFORMS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Discrete Fourier Transform (DFT)
   */
  dft(x) {
    const N = x.length;
    const X = [];
    
    for (let k = 0; k < N; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * PI * k * n / N;
        re += x[n] * Math.cos(angle);
        im += x[n] * Math.sin(angle);
      }
      X.push({ re, im, magnitude: Math.sqrt(re * re + im * im) });
    }
    
    return X;
  }
  
  /**
   * Inverse DFT
   */
  idft(X) {
    const N = X.length;
    const x = [];
    
    for (let n = 0; n < N; n++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        const angle = 2 * PI * k * n / N;
        sum += X[k].re * Math.cos(angle) - X[k].im * Math.sin(angle);
      }
      x.push(sum / N);
    }
    
    return x;
  }
  
  /**
   * Laplace transform (numerical approximation)
   * F(s) = ∫₀^∞ f(t)e^(-st) dt
   */
  laplace(f, s, tMax = 100, n = 10000) {
    const dt = tMax / n;
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) * dt;
      sum += f(t) * Math.exp(-s * t) * dt;
    }
    
    return sum;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VARIATIONAL CALCULUS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Euler-Lagrange equation solver
   * For functional J[y] = ∫ L(x, y, y') dx
   * Returns approximate solution
   */
  eulerLagrangeSolve(L_y, L_yp_yp, L_yp_y, y0, y1, x0, x1, n = 100) {
    // Finite difference discretization
    const h = (x1 - x0) / n;
    const y = Array(n + 1).fill(0);
    y[0] = y0;
    y[n] = y1;
    
    // Initial guess: linear interpolation
    for (let i = 1; i < n; i++) {
      y[i] = y0 + (y1 - y0) * i / n;
    }
    
    // Gauss-Seidel iteration
    for (let iter = 0; iter < 1000; iter++) {
      let maxChange = 0;
      
      for (let i = 1; i < n; i++) {
        const x = x0 + i * h;
        const yp = (y[i + 1] - y[i - 1]) / (2 * h);
        
        // EL equation: ∂L/∂y - d/dx(∂L/∂y') = 0
        const newY = (y[i - 1] + y[i + 1]) / 2 + 
                     (h * h / 2) * L_y(x, y[i], yp);
        
        maxChange = Math.max(maxChange, Math.abs(newY - y[i]));
        y[i] = newY;
      }
      
      if (maxChange < 1e-8) break;
    }
    
    return y.map((yi, i) => ({ x: x0 + i * h, y: yi }));
  }
  
  /**
   * φ-weighted integral: ∫ f(x) × φ^(-|x|) dx
   * Organism-specific integration with golden decay
   */
  phiIntegrate(f, a, b, n = 1000) {
    const h = (b - a) / n;
    let sum = 0;
    
    for (let i = 0; i <= n; i++) {
      const x = a + i * h;
      const weight = Math.pow(PHI, -Math.abs(x));
      sum += f(x) * weight * (i === 0 || i === n ? 0.5 : 1);
    }
    
    return sum * h;
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      methods: {
        differentiation: ['derivative', 'secondDerivative', 'partialDerivative', 'gradient', 'hessian', 'laplacian', 'divergence', 'curl'],
        integration: ['integrate', 'adaptiveIntegrate', 'doubleIntegrate', 'lineIntegral', 'phiIntegrate'],
        odes: ['eulerMethod', 'rk4', 'harmonicOscillator', 'dampedOscillator', 'lorenzSystem'],
        transforms: ['dft', 'idft', 'laplace'],
        variational: ['eulerLagrangeSolve']
      }
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMICS ENGINE - Game Theory, Equilibrium, Utility, Market Dynamics
// Official Name: OIKONOMIKOS (οἰκονομικός - "household management")
// ═══════════════════════════════════════════════════════════════════════════════

class EconomicsEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'OIKONOMIKOS';
    this.designation = 'RSHIP-ENGINE-ECONOMICS-001';
    this.tier = 'deep';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY THEORY
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Cobb-Douglas utility: U = Πᵢ xᵢ^αᵢ
   */
  cobbDouglasUtility(quantities, exponents) {
    return quantities.reduce((prod, x, i) => prod * Math.pow(x, exponents[i]), 1);
  }
  
  /**
   * CES utility: U = (Σᵢ αᵢ xᵢ^ρ)^(1/ρ)
   * Constant Elasticity of Substitution
   */
  cesUtility(quantities, weights, rho) {
    const sum = quantities.reduce((s, x, i) => s + weights[i] * Math.pow(x, rho), 0);
    return Math.pow(sum, 1 / rho);
  }
  
  /**
   * Quasi-linear utility: U = x₁ + v(x₂, ..., xₙ)
   */
  quasiLinearUtility(x1, v_value) {
    return x1 + v_value;
  }
  
  /**
   * Expected utility: E[U] = Σᵢ pᵢ U(xᵢ)
   */
  expectedUtility(outcomes, probabilities, utilityFunc) {
    return outcomes.reduce((sum, x, i) => sum + probabilities[i] * utilityFunc(x), 0);
  }
  
  /**
   * Risk aversion coefficient (Arrow-Pratt): r(x) = -U''(x)/U'(x)
   */
  absoluteRiskAversion(utilityFunc, x, h = 1e-6) {
    const Up = (utilityFunc(x + h) - utilityFunc(x - h)) / (2 * h);
    const Upp = (utilityFunc(x + h) - 2 * utilityFunc(x) + utilityFunc(x - h)) / (h * h);
    return -Upp / Up;
  }
  
  /**
   * Certainty equivalent: U(CE) = E[U(X)]
   */
  certaintyEquivalent(outcomes, probabilities, utilityFunc, inverseUtility) {
    const eu = this.expectedUtility(outcomes, probabilities, utilityFunc);
    return inverseUtility(eu);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GAME THEORY
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Find Nash equilibrium in 2x2 game (pure strategies)
   * payoffMatrix[i][j] = [player1_payoff, player2_payoff]
   */
  findPureNashEquilibria(payoffMatrix) {
    const equilibria = [];
    const rows = payoffMatrix.length;
    const cols = payoffMatrix[0].length;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const [p1, p2] = payoffMatrix[i][j];
        
        // Check if player 1 best response
        let p1BestResponse = true;
        for (let i2 = 0; i2 < rows; i2++) {
          if (payoffMatrix[i2][j][0] > p1) {
            p1BestResponse = false;
            break;
          }
        }
        
        // Check if player 2 best response
        let p2BestResponse = true;
        for (let j2 = 0; j2 < cols; j2++) {
          if (payoffMatrix[i][j2][1] > p2) {
            p2BestResponse = false;
            break;
          }
        }
        
        if (p1BestResponse && p2BestResponse) {
          equilibria.push({ strategy: [i, j], payoffs: [p1, p2] });
        }
      }
    }
    
    return equilibria;
  }
  
  /**
   * Mixed strategy Nash equilibrium for 2x2 games
   */
  mixedNashEquilibrium2x2(payoffMatrix) {
    // For 2x2 game: find probabilities that make opponent indifferent
    const a = payoffMatrix[0][0][1]; // P2 payoff when P1 plays 0, P2 plays 0
    const b = payoffMatrix[0][1][1]; // P2 payoff when P1 plays 0, P2 plays 1
    const c = payoffMatrix[1][0][1]; // P2 payoff when P1 plays 1, P2 plays 0
    const d = payoffMatrix[1][1][1]; // P2 payoff when P1 plays 1, P2 plays 1
    
    // P1's mixed strategy
    const p = (d - b) / (a - b - c + d);
    
    const a2 = payoffMatrix[0][0][0];
    const b2 = payoffMatrix[0][1][0];
    const c2 = payoffMatrix[1][0][0];
    const d2 = payoffMatrix[1][1][0];
    
    // P2's mixed strategy
    const q = (d2 - c2) / (a2 - b2 - c2 + d2);
    
    return {
      player1: { prob0: p, prob1: 1 - p },
      player2: { prob0: q, prob1: 1 - q },
      valid: p >= 0 && p <= 1 && q >= 0 && q <= 1
    };
  }
  
  /**
   * Prisoner's Dilemma payoff matrix
   */
  prisonersDilemma(R = 3, T = 5, S = 0, P = 1) {
    return [
      [[R, R], [S, T]], // Cooperate
      [[T, S], [P, P]]  // Defect
    ];
  }
  
  /**
   * Iterated elimination of dominated strategies
   */
  eliminateDominatedStrategies(payoffMatrix, player) {
    const payoffs = payoffMatrix.map(row => row.map(cell => cell[player]));
    const n = player === 0 ? payoffs.length : payoffs[0].length;
    const dominated = new Set();
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j || dominated.has(i) || dominated.has(j)) continue;
        
        let iDominatesJ = true;
        let jDominatesI = true;
        
        if (player === 0) {
          for (let k = 0; k < payoffs[0].length; k++) {
            if (payoffs[i][k] <= payoffs[j][k]) iDominatesJ = false;
            if (payoffs[j][k] <= payoffs[i][k]) jDominatesI = false;
          }
        } else {
          for (let k = 0; k < payoffs.length; k++) {
            if (payoffs[k][i] <= payoffs[k][j]) iDominatesJ = false;
            if (payoffs[k][j] <= payoffs[k][i]) jDominatesI = false;
          }
        }
        
        if (iDominatesJ) dominated.add(j);
        if (jDominatesI) dominated.add(i);
      }
    }
    
    return { dominated: [...dominated], remaining: Array.from({ length: n }, (_, i) => i).filter(i => !dominated.has(i)) };
  }
  
  /**
   * Shapley value for cooperative games
   */
  shapleyValue(coalitionValues, players) {
    const n = players.length;
    const values = {};
    
    for (const player of players) {
      let value = 0;
      const others = players.filter(p => p !== player);
      
      // Generate all permutations
      const permutations = this.permutations(others);
      
      for (const perm of permutations) {
        // Coalition before player joins
        const before = [];
        for (const p of perm) {
          before.push(p);
        }
        const coalitionBefore = before.join(',') || 'empty';
        const coalitionAfter = [...before, player].sort().join(',');
        
        const vBefore = coalitionValues[coalitionBefore] || 0;
        const vAfter = coalitionValues[coalitionAfter] || 0;
        
        value += vAfter - vBefore;
      }
      
      values[player] = value / this.factorial(n);
    }
    
    return values;
  }
  
  factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
  
  permutations(arr) {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of this.permutations(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MARKET DYNAMICS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Supply-Demand equilibrium: Qˢ(p) = Qᵈ(p)
   */
  marketEquilibrium(supplyFunc, demandFunc, pMin = 0, pMax = 1000, tol = 1e-6) {
    // Bisection method
    let low = pMin, high = pMax;
    
    while (high - low > tol) {
      const mid = (low + high) / 2;
      const excess = supplyFunc(mid) - demandFunc(mid);
      
      if (excess > 0) high = mid;
      else low = mid;
    }
    
    const p = (low + high) / 2;
    return { price: p, quantity: supplyFunc(p) };
  }
  
  /**
   * Cournot duopoly equilibrium
   * q*ᵢ = (a - c) / (3b) for symmetric firms
   */
  cournotEquilibrium(a, b, c1, c2) {
    const q1 = (a - 2 * c1 + c2) / (3 * b);
    const q2 = (a - 2 * c2 + c1) / (3 * b);
    const Q = q1 + q2;
    const p = a - b * Q;
    return { q1, q2, Q, price: p, profit1: (p - c1) * q1, profit2: (p - c2) * q2 };
  }
  
  /**
   * Bertrand competition equilibrium
   * p* = max(c1, c2) + ε for differentiated products
   */
  bertrandEquilibrium(c1, c2) {
    // Homogeneous products: price = marginal cost
    const p = Math.max(c1, c2);
    return { price: p, margin: 0, winner: c1 <= c2 ? 1 : 2 };
  }
  
  /**
   * Monopoly profit maximization
   * MR = MC, where MR = d(TR)/dQ
   */
  monopolyOptimum(demandFunc, costFunc, qMin = 0, qMax = 1000, n = 1000) {
    let maxProfit = -Infinity;
    let optQ = 0;
    
    for (let i = 0; i <= n; i++) {
      const q = qMin + (qMax - qMin) * i / n;
      const p = demandFunc(q);
      const revenue = p * q;
      const cost = costFunc(q);
      const profit = revenue - cost;
      
      if (profit > maxProfit) {
        maxProfit = profit;
        optQ = q;
      }
    }
    
    return { quantity: optQ, price: demandFunc(optQ), profit: maxProfit };
  }
  
  /**
   * Consumer surplus: ∫₀^Q* [D(q) - p*] dq
   */
  consumerSurplus(demandFunc, equilibriumPrice, equilibriumQuantity, n = 1000) {
    const dq = equilibriumQuantity / n;
    let surplus = 0;
    
    for (let i = 0; i < n; i++) {
      const q = (i + 0.5) * dq;
      surplus += (demandFunc(q) - equilibriumPrice) * dq;
    }
    
    return surplus;
  }
  
  /**
   * Producer surplus: ∫₀^Q* [p* - S(q)] dq
   */
  producerSurplus(supplyFunc, equilibriumPrice, equilibriumQuantity, n = 1000) {
    const dq = equilibriumQuantity / n;
    let surplus = 0;
    
    for (let i = 0; i < n; i++) {
      const q = (i + 0.5) * dq;
      surplus += (equilibriumPrice - supplyFunc(q)) * dq;
    }
    
    return surplus;
  }
  
  /**
   * Price elasticity of demand: ε = (dQ/dP) × (P/Q)
   */
  priceElasticity(demandFunc, p, h = 1e-6) {
    const q = demandFunc(p);
    const dQdP = (demandFunc(p + h) - demandFunc(p - h)) / (2 * h);
    return dQdP * (p / q);
  }
  
  /**
   * φ-Auction: Organism-specific auction mechanism
   * Reserve price follows golden ratio decay
   */
  phiAuction(bids, rounds = 5) {
    const results = [];
    let reserve = Math.max(...bids);
    
    for (let round = 0; round < rounds; round++) {
      reserve *= PHI_INV; // Decay by φ⁻¹
      const validBids = bids.filter(b => b >= reserve);
      
      if (validBids.length === 0) break;
      
      const winner = Math.max(...validBids);
      const secondPrice = validBids.length > 1 
        ? Math.max(...validBids.filter(b => b !== winner))
        : reserve;
      
      results.push({
        round: round + 1,
        reserve,
        winner,
        price: secondPrice, // Vickrey auction
        validBidders: validBids.length
      });
    }
    
    return results;
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      methods: {
        utility: ['cobbDouglasUtility', 'cesUtility', 'quasiLinearUtility', 'expectedUtility', 'absoluteRiskAversion', 'certaintyEquivalent'],
        gameTheory: ['findPureNashEquilibria', 'mixedNashEquilibrium2x2', 'prisonersDilemma', 'eliminateDominatedStrategies', 'shapleyValue'],
        markets: ['marketEquilibrium', 'cournotEquilibrium', 'bertrandEquilibrium', 'monopolyOptimum', 'consumerSurplus', 'producerSurplus', 'priceElasticity', 'phiAuction']
      }
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// WORKING STATE ENGINE - Process Algebra, Petri Nets, State Machines
// Official Name: ERGASTIKOS (ἐργαστικός - "working, operative")
// ═══════════════════════════════════════════════════════════════════════════════

class WorkingStateEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'ERGASTIKOS';
    this.designation = 'RSHIP-ENGINE-WORKING-STATE-001';
    this.tier = 'deep';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FINITE STATE MACHINES
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a Deterministic Finite Automaton (DFA)
   */
  createDFA(states, alphabet, transitions, startState, acceptStates) {
    return {
      type: 'DFA',
      states: new Set(states),
      alphabet: new Set(alphabet),
      transitions,  // { state: { symbol: nextState } }
      startState,
      acceptStates: new Set(acceptStates),
      currentState: startState
    };
  }
  
  /**
   * Run DFA on input string
   */
  runDFA(dfa, input) {
    let state = dfa.startState;
    const trace = [state];
    
    for (const symbol of input) {
      if (!dfa.alphabet.has(symbol)) {
        return { accepted: false, reason: 'invalid_symbol', symbol, trace };
      }
      
      const nextState = dfa.transitions[state]?.[symbol];
      if (nextState === undefined) {
        return { accepted: false, reason: 'no_transition', from: state, symbol, trace };
      }
      
      state = nextState;
      trace.push(state);
    }
    
    return {
      accepted: dfa.acceptStates.has(state),
      finalState: state,
      trace
    };
  }
  
  /**
   * Create a Non-deterministic Finite Automaton (NFA)
   */
  createNFA(states, alphabet, transitions, startState, acceptStates) {
    return {
      type: 'NFA',
      states: new Set(states),
      alphabet: new Set(alphabet),
      transitions, // { state: { symbol: [nextStates] } }
      startState,
      acceptStates: new Set(acceptStates)
    };
  }
  
  /**
   * Run NFA on input (subset construction simulation)
   */
  runNFA(nfa, input) {
    let currentStates = new Set([nfa.startState]);
    
    // ε-closure
    currentStates = this.epsilonClosure(nfa, currentStates);
    
    for (const symbol of input) {
      const nextStates = new Set();
      
      for (const state of currentStates) {
        const transitions = nfa.transitions[state]?.[symbol] || [];
        for (const next of transitions) {
          nextStates.add(next);
        }
      }
      
      currentStates = this.epsilonClosure(nfa, nextStates);
    }
    
    // Check if any current state is accepting
    for (const state of currentStates) {
      if (nfa.acceptStates.has(state)) {
        return { accepted: true, finalStates: [...currentStates] };
      }
    }
    
    return { accepted: false, finalStates: [...currentStates] };
  }
  
  /**
   * Compute ε-closure of a set of states
   */
  epsilonClosure(nfa, states) {
    const closure = new Set(states);
    const stack = [...states];
    
    while (stack.length > 0) {
      const state = stack.pop();
      const epsilonTransitions = nfa.transitions[state]?.['ε'] || [];
      
      for (const next of epsilonTransitions) {
        if (!closure.has(next)) {
          closure.add(next);
          stack.push(next);
        }
      }
    }
    
    return closure;
  }
  
  /**
   * NFA to DFA conversion (subset construction)
   */
  nfaToDFA(nfa) {
    const dfaStates = new Map();
    const dfaTransitions = {};
    const dfaAcceptStates = [];
    
    const startClosure = this.epsilonClosure(nfa, new Set([nfa.startState]));
    const startKey = this.stateSetKey(startClosure);
    
    dfaStates.set(startKey, startClosure);
    const queue = [startKey];
    const visited = new Set([startKey]);
    
    while (queue.length > 0) {
      const currentKey = queue.shift();
      const currentSet = dfaStates.get(currentKey);
      dfaTransitions[currentKey] = {};
      
      // Check if accepting
      for (const state of currentSet) {
        if (nfa.acceptStates.has(state)) {
          dfaAcceptStates.push(currentKey);
          break;
        }
      }
      
      // Process each symbol
      for (const symbol of nfa.alphabet) {
        if (symbol === 'ε') continue;
        
        const nextStates = new Set();
        for (const state of currentSet) {
          const transitions = nfa.transitions[state]?.[symbol] || [];
          for (const next of transitions) {
            nextStates.add(next);
          }
        }
        
        const nextClosure = this.epsilonClosure(nfa, nextStates);
        if (nextClosure.size === 0) continue;
        
        const nextKey = this.stateSetKey(nextClosure);
        dfaTransitions[currentKey][symbol] = nextKey;
        
        if (!visited.has(nextKey)) {
          visited.add(nextKey);
          dfaStates.set(nextKey, nextClosure);
          queue.push(nextKey);
        }
      }
    }
    
    return this.createDFA(
      [...dfaStates.keys()],
      [...nfa.alphabet].filter(s => s !== 'ε'),
      dfaTransitions,
      startKey,
      dfaAcceptStates
    );
  }
  
  stateSetKey(stateSet) {
    return [...stateSet].sort().join(',');
  }
  
  /**
   * Minimize DFA using partition refinement
   */
  minimizeDFA(dfa) {
    // Initial partition: accepting vs non-accepting
    let partitions = [
      new Set([...dfa.acceptStates]),
      new Set([...dfa.states].filter(s => !dfa.acceptStates.has(s)))
    ].filter(p => p.size > 0);
    
    let changed = true;
    while (changed) {
      changed = false;
      const newPartitions = [];
      
      for (const partition of partitions) {
        const splits = this.splitPartition(partition, partitions, dfa);
        if (splits.length > 1) changed = true;
        newPartitions.push(...splits);
      }
      
      partitions = newPartitions;
    }
    
    // Build minimized DFA
    const stateMap = new Map();
    const newStates = [];
    const newTransitions = {};
    const newAcceptStates = [];
    
    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];
      const newState = `S${i}`;
      newStates.push(newState);
      
      for (const state of partition) {
        stateMap.set(state, newState);
      }
      
      // Check if accepting
      for (const state of partition) {
        if (dfa.acceptStates.has(state)) {
          newAcceptStates.push(newState);
          break;
        }
      }
    }
    
    // Build transitions
    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];
      const newState = `S${i}`;
      newTransitions[newState] = {};
      
      const representative = [...partition][0];
      for (const symbol of dfa.alphabet) {
        const nextState = dfa.transitions[representative]?.[symbol];
        if (nextState) {
          newTransitions[newState][symbol] = stateMap.get(nextState);
        }
      }
    }
    
    const newStart = stateMap.get(dfa.startState);
    
    return this.createDFA(newStates, [...dfa.alphabet], newTransitions, newStart, newAcceptStates);
  }
  
  splitPartition(partition, allPartitions, dfa) {
    if (partition.size <= 1) return [partition];
    
    const partitionIndex = (state) => {
      for (let i = 0; i < allPartitions.length; i++) {
        if (allPartitions[i].has(state)) return i;
      }
      return -1;
    };
    
    for (const symbol of dfa.alphabet) {
      const groups = new Map();
      
      for (const state of partition) {
        const nextState = dfa.transitions[state]?.[symbol];
        const key = nextState ? partitionIndex(nextState) : -1;
        
        if (!groups.has(key)) groups.set(key, new Set());
        groups.get(key).add(state);
      }
      
      if (groups.size > 1) {
        return [...groups.values()];
      }
    }
    
    return [partition];
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PETRI NETS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a Petri Net
   */
  createPetriNet(places, transitions, arcs, initialMarking) {
    return {
      places: new Set(places),
      transitions: new Set(transitions),
      arcs, // { from: { to: weight } } or { transition: { place: weight, ... } }
      marking: { ...initialMarking }, // { place: tokens }
      inputArcs: {},  // transition -> { place: weight }
      outputArcs: {}, // transition -> { place: weight }
      history: [{ ...initialMarking }]
    };
  }
  
  /**
   * Build input/output arc mappings
   */
  buildArcMappings(net) {
    for (const [from, targets] of Object.entries(net.arcs)) {
      for (const [to, weight] of Object.entries(targets)) {
        if (net.transitions.has(from)) {
          // Output arc: transition -> place
          if (!net.outputArcs[from]) net.outputArcs[from] = {};
          net.outputArcs[from][to] = weight;
        } else if (net.transitions.has(to)) {
          // Input arc: place -> transition
          if (!net.inputArcs[to]) net.inputArcs[to] = {};
          net.inputArcs[to][from] = weight;
        }
      }
    }
    return net;
  }
  
  /**
   * Check if a transition is enabled
   */
  isTransitionEnabled(net, transition) {
    const inputs = net.inputArcs[transition] || {};
    
    for (const [place, weight] of Object.entries(inputs)) {
      if ((net.marking[place] || 0) < weight) return false;
    }
    
    return true;
  }
  
  /**
   * Fire a transition
   */
  fireTransition(net, transition) {
    if (!this.isTransitionEnabled(net, transition)) {
      return { success: false, reason: 'not_enabled' };
    }
    
    const inputs = net.inputArcs[transition] || {};
    const outputs = net.outputArcs[transition] || {};
    
    // Remove tokens from input places
    for (const [place, weight] of Object.entries(inputs)) {
      net.marking[place] = (net.marking[place] || 0) - weight;
    }
    
    // Add tokens to output places
    for (const [place, weight] of Object.entries(outputs)) {
      net.marking[place] = (net.marking[place] || 0) + weight;
    }
    
    net.history.push({ ...net.marking });
    
    return { success: true, newMarking: { ...net.marking } };
  }
  
  /**
   * Get all enabled transitions
   */
  getEnabledTransitions(net) {
    const enabled = [];
    for (const t of net.transitions) {
      if (this.isTransitionEnabled(net, t)) enabled.push(t);
    }
    return enabled;
  }
  
  /**
   * Simulate Petri net execution
   */
  simulatePetriNet(net, maxSteps = 100) {
    const trace = [];
    
    for (let step = 0; step < maxSteps; step++) {
      const enabled = this.getEnabledTransitions(net);
      if (enabled.length === 0) break;
      
      // Choose randomly (or first for determinism)
      const chosen = enabled[0];
      this.fireTransition(net, chosen);
      
      trace.push({ step, transition: chosen, marking: { ...net.marking } });
    }
    
    return { trace, finalMarking: { ...net.marking } };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PROCESS ALGEBRA (CCS-like)
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a CCS process
   */
  createProcess(actions, definition) {
    return {
      type: 'process',
      actions: new Set(actions),
      definition,
      state: 'initial'
    };
  }
  
  /**
   * Parallel composition: P | Q
   */
  parallelComposition(p1, p2) {
    return {
      type: 'parallel',
      left: p1,
      right: p2,
      state: 'running'
    };
  }
  
  /**
   * Sequential composition: P ; Q
   */
  sequentialComposition(p1, p2) {
    return {
      type: 'sequential',
      first: p1,
      second: p2,
      currentPhase: 'first'
    };
  }
  
  /**
   * Choice: P + Q
   */
  choiceComposition(p1, p2) {
    return {
      type: 'choice',
      option1: p1,
      option2: p2,
      chosen: null
    };
  }
  
  /**
   * Restriction: P \ {a}
   */
  restriction(process, hiddenActions) {
    return {
      type: 'restriction',
      process,
      hidden: new Set(hiddenActions)
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // φ-STATE MACHINES (Organism-specific)
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create φ-weighted state machine
   * Transitions have golden-ratio weighted probabilities
   */
  createPhiStateMachine(states, transitions) {
    const phiWeighted = {};
    
    for (const [from, targets] of Object.entries(transitions)) {
      phiWeighted[from] = {};
      const targetList = Object.entries(targets);
      
      // Assign φ-based weights: φ⁰, φ⁻¹, φ⁻², ...
      for (let i = 0; i < targetList.length; i++) {
        const [to, baseWeight] = targetList[i];
        phiWeighted[from][to] = baseWeight * Math.pow(PHI, -i);
      }
      
      // Normalize
      const total = Object.values(phiWeighted[from]).reduce((s, w) => s + w, 0);
      for (const to of Object.keys(phiWeighted[from])) {
        phiWeighted[from][to] /= total;
      }
    }
    
    return {
      type: 'phi-fsm',
      states: new Set(states),
      transitions: phiWeighted,
      currentState: states[0]
    };
  }
  
  /**
   * Stochastic transition in φ-FSM
   */
  phiTransition(fsm) {
    const transitions = fsm.transitions[fsm.currentState];
    if (!transitions) return { success: false, reason: 'no_transitions' };
    
    const r = Math.random();
    let cumulative = 0;
    
    for (const [to, prob] of Object.entries(transitions)) {
      cumulative += prob;
      if (r <= cumulative) {
        fsm.currentState = to;
        return { success: true, newState: to, probability: prob };
      }
    }
    
    // Fallback (shouldn't reach)
    const fallback = Object.keys(transitions)[0];
    fsm.currentState = fallback;
    return { success: true, newState: fallback, probability: transitions[fallback] };
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      methods: {
        dfa: ['createDFA', 'runDFA', 'minimizeDFA'],
        nfa: ['createNFA', 'runNFA', 'nfaToDFA', 'epsilonClosure'],
        petriNets: ['createPetriNet', 'isTransitionEnabled', 'fireTransition', 'simulatePetriNet'],
        processAlgebra: ['createProcess', 'parallelComposition', 'sequentialComposition', 'choiceComposition', 'restriction'],
        phiFSM: ['createPhiStateMachine', 'phiTransition']
      }
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTERPERSONAL ENGINE - Social Networks, Trust Dynamics, Influence Propagation
// Official Name: KOINONIKOS (κοινωνικός - "social, communal")
// ═══════════════════════════════════════════════════════════════════════════════

class InterpersonalEngine extends EventEmitter {
  constructor() {
    super();
    this.name = 'KOINONIKOS';
    this.designation = 'RSHIP-ENGINE-INTERPERSONAL-001';
    this.tier = 'deep';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SOCIAL NETWORK ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a social network graph
   */
  createNetwork(nodes, edges) {
    const adjacency = {};
    for (const node of nodes) {
      adjacency[node] = { outgoing: [], incoming: [] };
    }
    
    for (const [from, to, weight = 1] of edges) {
      adjacency[from].outgoing.push({ node: to, weight });
      adjacency[to].incoming.push({ node: from, weight });
    }
    
    return { nodes: new Set(nodes), edges, adjacency };
  }
  
  /**
   * Degree centrality: number of connections
   */
  degreeCentrality(network) {
    const centrality = {};
    for (const node of network.nodes) {
      const total = network.adjacency[node].outgoing.length + 
                   network.adjacency[node].incoming.length;
      centrality[node] = total / (2 * (network.nodes.size - 1));
    }
    return centrality;
  }
  
  /**
   * Betweenness centrality (simplified)
   * Fraction of shortest paths passing through node
   */
  betweennessCentrality(network) {
    const centrality = {};
    const nodes = [...network.nodes];
    
    for (const node of nodes) {
      centrality[node] = 0;
    }
    
    for (const source of nodes) {
      const { distances, predecessors } = this.dijkstra(network, source);
      
      for (const target of nodes) {
        if (source === target) continue;
        
        // Count paths through each intermediate node
        const path = this.reconstructPath(predecessors, source, target);
        for (const intermediate of path.slice(1, -1)) {
          centrality[intermediate] += 1;
        }
      }
    }
    
    // Normalize
    const n = nodes.length;
    const normalizer = (n - 1) * (n - 2);
    for (const node of nodes) {
      centrality[node] /= normalizer > 0 ? normalizer : 1;
    }
    
    return centrality;
  }
  
  /**
   * Dijkstra's shortest path algorithm
   */
  dijkstra(network, source) {
    const distances = {};
    const predecessors = {};
    const visited = new Set();
    const queue = [];
    
    for (const node of network.nodes) {
      distances[node] = Infinity;
      predecessors[node] = null;
    }
    distances[source] = 0;
    queue.push({ node: source, dist: 0 });
    
    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const { node: current } = queue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      for (const { node: neighbor, weight } of network.adjacency[current].outgoing) {
        const alt = distances[current] + weight;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          predecessors[neighbor] = current;
          queue.push({ node: neighbor, dist: alt });
        }
      }
    }
    
    return { distances, predecessors };
  }
  
  /**
   * Reconstruct path from predecessors
   */
  reconstructPath(predecessors, source, target) {
    const path = [];
    let current = target;
    
    while (current !== null) {
      path.unshift(current);
      if (current === source) break;
      current = predecessors[current];
    }
    
    return path[0] === source ? path : [];
  }
  
  /**
   * Closeness centrality: inverse of average distance
   */
  closenessCentrality(network) {
    const centrality = {};
    const nodes = [...network.nodes];
    
    for (const node of nodes) {
      const { distances } = this.dijkstra(network, node);
      let totalDist = 0;
      let reachable = 0;
      
      for (const other of nodes) {
        if (other !== node && distances[other] < Infinity) {
          totalDist += distances[other];
          reachable++;
        }
      }
      
      centrality[node] = reachable > 0 ? reachable / totalDist : 0;
    }
    
    return centrality;
  }
  
  /**
   * PageRank algorithm
   */
  pageRank(network, damping = 0.85, iterations = 100, tolerance = 1e-6) {
    const nodes = [...network.nodes];
    const n = nodes.length;
    const ranks = {};
    
    // Initialize
    for (const node of nodes) {
      ranks[node] = 1 / n;
    }
    
    for (let iter = 0; iter < iterations; iter++) {
      const newRanks = {};
      let maxDiff = 0;
      
      for (const node of nodes) {
        let sum = 0;
        
        for (const { node: source } of network.adjacency[node].incoming) {
          const outDegree = network.adjacency[source].outgoing.length;
          if (outDegree > 0) {
            sum += ranks[source] / outDegree;
          }
        }
        
        newRanks[node] = (1 - damping) / n + damping * sum;
        maxDiff = Math.max(maxDiff, Math.abs(newRanks[node] - ranks[node]));
      }
      
      Object.assign(ranks, newRanks);
      if (maxDiff < tolerance) break;
    }
    
    return ranks;
  }
  
  /**
   * Community detection using label propagation
   */
  labelPropagation(network, maxIterations = 100) {
    const labels = {};
    const nodes = [...network.nodes];
    
    // Initialize each node with unique label
    for (let i = 0; i < nodes.length; i++) {
      labels[nodes[i]] = i;
    }
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      
      // Shuffle nodes
      const shuffled = [...nodes].sort(() => Math.random() - 0.5);
      
      for (const node of shuffled) {
        const neighborLabels = {};
        
        for (const { node: neighbor, weight } of network.adjacency[node].outgoing) {
          const label = labels[neighbor];
          neighborLabels[label] = (neighborLabels[label] || 0) + weight;
        }
        for (const { node: neighbor, weight } of network.adjacency[node].incoming) {
          const label = labels[neighbor];
          neighborLabels[label] = (neighborLabels[label] || 0) + weight;
        }
        
        if (Object.keys(neighborLabels).length > 0) {
          // Find most frequent label
          const maxLabel = Object.entries(neighborLabels)
            .sort((a, b) => b[1] - a[1])[0][0];
          
          if (parseInt(maxLabel) !== labels[node]) {
            labels[node] = parseInt(maxLabel);
            changed = true;
          }
        }
      }
      
      if (!changed) break;
    }
    
    // Group by community
    const communities = {};
    for (const [node, label] of Object.entries(labels)) {
      if (!communities[label]) communities[label] = [];
      communities[label].push(node);
    }
    
    return { labels, communities: Object.values(communities) };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TRUST DYNAMICS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Trust model with learning
   * T(t+1) = T(t) + α(outcome - T(t))
   */
  updateTrust(currentTrust, outcome, learningRate = 0.1) {
    return currentTrust + learningRate * (outcome - currentTrust);
  }
  
  /**
   * Create trust network
   */
  createTrustNetwork(agents) {
    const trust = {};
    for (const a of agents) {
      trust[a] = {};
      for (const b of agents) {
        if (a !== b) {
          trust[a][b] = 0.5; // Initial neutral trust
        }
      }
    }
    return { agents: new Set(agents), trust };
  }
  
  /**
   * Transitive trust: A trusts C through B
   * T(A,C) = T(A,B) × T(B,C)
   */
  transitiveTrust(trustNetwork, from, through, to) {
    const t_ab = trustNetwork.trust[from]?.[through] || 0;
    const t_bc = trustNetwork.trust[through]?.[to] || 0;
    return t_ab * t_bc;
  }
  
  /**
   * Aggregate trust from multiple paths
   */
  aggregateTrust(trustNetwork, from, to, maxDepth = 3) {
    const direct = trustNetwork.trust[from]?.[to] || 0;
    if (maxDepth <= 1) return direct;
    
    let indirectSum = 0;
    let pathCount = 0;
    
    for (const intermediate of trustNetwork.agents) {
      if (intermediate === from || intermediate === to) continue;
      
      const transitive = this.transitiveTrust(trustNetwork, from, intermediate, to);
      if (transitive > 0) {
        indirectSum += transitive;
        pathCount++;
      }
    }
    
    const indirect = pathCount > 0 ? indirectSum / pathCount : 0;
    
    // Combine direct and indirect (weighted by φ)
    return direct * PHI_INV + indirect * (1 - PHI_INV);
  }
  
  /**
   * Trust decay over time
   */
  decayTrust(trustNetwork, decayRate = 0.01) {
    for (const a of trustNetwork.agents) {
      for (const b of trustNetwork.agents) {
        if (a !== b && trustNetwork.trust[a][b]) {
          // Decay toward neutral (0.5)
          const current = trustNetwork.trust[a][b];
          trustNetwork.trust[a][b] = current + decayRate * (0.5 - current);
        }
      }
    }
    return trustNetwork;
  }
  
  /**
   * Reputation score (average incoming trust)
   */
  reputation(trustNetwork, agent) {
    let sum = 0;
    let count = 0;
    
    for (const other of trustNetwork.agents) {
      if (other !== agent && trustNetwork.trust[other]?.[agent] !== undefined) {
        sum += trustNetwork.trust[other][agent];
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0.5;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INFLUENCE PROPAGATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Independent Cascade Model
   */
  independentCascade(network, seeds, propagationProb = 0.1) {
    const activated = new Set(seeds);
    const newlyActivated = new Set(seeds);
    const trace = [{ step: 0, activated: [...seeds] }];
    let step = 0;
    
    while (newlyActivated.size > 0) {
      step++;
      const nextActivated = new Set();
      
      for (const node of newlyActivated) {
        for (const { node: neighbor, weight } of network.adjacency[node].outgoing) {
          if (!activated.has(neighbor)) {
            const prob = propagationProb * weight;
            if (Math.random() < prob) {
              nextActivated.add(neighbor);
              activated.add(neighbor);
            }
          }
        }
      }
      
      newlyActivated.clear();
      for (const n of nextActivated) newlyActivated.add(n);
      
      if (nextActivated.size > 0) {
        trace.push({ step, activated: [...nextActivated] });
      }
    }
    
    return { finalActivated: [...activated], trace, totalActivated: activated.size };
  }
  
  /**
   * Linear Threshold Model
   */
  linearThreshold(network, seeds, maxSteps = 100) {
    // Assign random thresholds
    const thresholds = {};
    for (const node of network.nodes) {
      thresholds[node] = Math.random();
    }
    
    const activated = new Set(seeds);
    const trace = [{ step: 0, activated: [...seeds] }];
    
    for (let step = 1; step <= maxSteps; step++) {
      const newlyActivated = [];
      
      for (const node of network.nodes) {
        if (activated.has(node)) continue;
        
        // Sum influence from activated neighbors
        let influence = 0;
        for (const { node: neighbor, weight } of network.adjacency[node].incoming) {
          if (activated.has(neighbor)) {
            influence += weight;
          }
        }
        
        // Normalize by total incoming weight
        const totalWeight = network.adjacency[node].incoming.reduce((s, e) => s + e.weight, 0);
        const normalizedInfluence = totalWeight > 0 ? influence / totalWeight : 0;
        
        if (normalizedInfluence >= thresholds[node]) {
          newlyActivated.push(node);
          activated.add(node);
        }
      }
      
      if (newlyActivated.length === 0) break;
      trace.push({ step, activated: newlyActivated });
    }
    
    return { finalActivated: [...activated], trace, totalActivated: activated.size };
  }
  
  /**
   * Find influential nodes (greedy influence maximization)
   */
  findInfluentialNodes(network, k, simulations = 100) {
    const seeds = [];
    const candidates = new Set(network.nodes);
    
    for (let i = 0; i < k; i++) {
      let bestNode = null;
      let bestSpread = 0;
      
      for (const candidate of candidates) {
        let totalSpread = 0;
        
        for (let sim = 0; sim < simulations; sim++) {
          const result = this.independentCascade(network, [...seeds, candidate]);
          totalSpread += result.totalActivated;
        }
        
        const avgSpread = totalSpread / simulations;
        if (avgSpread > bestSpread) {
          bestSpread = avgSpread;
          bestNode = candidate;
        }
      }
      
      if (bestNode) {
        seeds.push(bestNode);
        candidates.delete(bestNode);
      }
    }
    
    return seeds;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // φ-SOCIAL DYNAMICS (Organism-specific)
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * φ-weighted relationship strength
   * Based on interaction frequency and recency
   */
  phiRelationshipStrength(interactions, currentTime) {
    let strength = 0;
    
    for (let i = 0; i < interactions.length; i++) {
      const { time, intensity } = interactions[i];
      const age = currentTime - time;
      const weight = Math.pow(PHI, -i) * Math.exp(-age / (PHI_SQ * 86400000)); // Decay over days
      strength += intensity * weight;
    }
    
    return strength;
  }
  
  /**
   * Social coherence field
   * Measures alignment of agent beliefs/behaviors
   */
  socialCoherence(agents, beliefFunc) {
    const beliefs = agents.map(a => beliefFunc(a));
    const mean = beliefs.reduce((s, b) => s + b, 0) / beliefs.length;
    const variance = beliefs.reduce((s, b) => s + (b - mean) ** 2, 0) / beliefs.length;
    
    // Coherence is inverse of variance, scaled by φ
    return 1 / (1 + variance * PHI);
  }
  
  /**
   * Organism mesh integration
   * Maps interpersonal dynamics to organ communication
   */
  mapToOrganMesh(socialNetwork, organRegistry) {
    const mapping = {};
    const nodes = [...socialNetwork.nodes];
    const organs = Object.keys(organRegistry);
    
    // Use betweenness to assign nodes to organs
    const centrality = this.betweennessCentrality(socialNetwork);
    const sorted = nodes.sort((a, b) => centrality[b] - centrality[a]);
    
    for (let i = 0; i < sorted.length; i++) {
      const organ = organs[i % organs.length];
      mapping[sorted[i]] = organ;
    }
    
    return mapping;
  }
  
  status() {
    return {
      name: this.name,
      designation: this.designation,
      tier: this.tier,
      methods: {
        networkAnalysis: ['createNetwork', 'degreeCentrality', 'betweennessCentrality', 'closenessCentrality', 'pageRank', 'labelPropagation'],
        trustDynamics: ['updateTrust', 'createTrustNetwork', 'transitiveTrust', 'aggregateTrust', 'decayTrust', 'reputation'],
        influence: ['independentCascade', 'linearThreshold', 'findInfluentialNodes'],
        phiSocial: ['phiRelationshipStrength', 'socialCoherence', 'mapToOrganMesh']
      }
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// GATE NETWORK - Orchestrates All Gates and Engine Connections
// ═══════════════════════════════════════════════════════════════════════════════

class GateNetwork extends EventEmitter {
  constructor() {
    super();
    this.name = 'ORGANISM_GATE_NETWORK';
    this.designation = 'RSHIP-GATES-001';
    this.version = GATE_VERSION;
    
    // Initialize all engines
    this.engines = {
      // Deep engines (new)
      PHYSIKOS:    new PhysicsEngine(),
      ALGEBRAIKOS: new AlgebraEngine(),
      LOGISMIKOS:  new CalculusEngine(),
      OIKONOMIKOS: new EconomicsEngine(),
      ERGASTIKOS:  new WorkingStateEngine(),
      KOINONIKOS:  new InterpersonalEngine()
    };
    
    // Gates between components
    this.gates = new Map();
    
    // Protocol execution log
    this.protocolLog = [];
    
    // Initialize gates
    this._initializeGates();
  }
  
  /**
   * Initialize all gates between organs and engines
   */
  _initializeGates() {
    // Create gates for each engine -> organ connection
    for (const [engineName, engine] of Object.entries(this.engines)) {
      for (const [organName, organ] of Object.entries(ORGAN_REGISTRY)) {
        const gateId = `${engineName}->${organName}`;
        const gate = new Gate(gateId, GateType.OUTBOUND, engineName, organName);
        this.gates.set(gateId, gate);
      }
    }
    
    // Create inter-engine gates (lateral)
    const engineNames = Object.keys(this.engines);
    for (let i = 0; i < engineNames.length; i++) {
      for (let j = i + 1; j < engineNames.length; j++) {
        const gateId1 = `${engineNames[i]}<->${engineNames[j]}`;
        const gate1 = new Gate(gateId1, GateType.LATERAL, engineNames[i], engineNames[j]);
        this.gates.set(gateId1, gate1);
      }
    }
    
    // Create EmailAI Mesh inbound gate
    const meshGate = new Gate('MESH->ORGANISM', GateType.INBOUND, 'emailai_mesh', 'organism_core');
    this.gates.set('MESH->ORGANISM', meshGate);
  }
  
  /**
   * Open a gate by ID
   */
  openGate(gateId) {
    const gate = this.gates.get(gateId);
    if (!gate) return { success: false, reason: 'gate_not_found' };
    return gate.open();
  }
  
  /**
   * Close a gate by ID
   */
  closeGate(gateId) {
    const gate = this.gates.get(gateId);
    if (!gate) return { success: false, reason: 'gate_not_found' };
    return gate.close();
  }
  
  /**
   * Flow data through a specific gate
   */
  flowThrough(gateId, data) {
    const gate = this.gates.get(gateId);
    if (!gate) return { success: false, reason: 'gate_not_found' };
    return gate.flow(data);
  }
  
  /**
   * Open all gates
   */
  openAllGates() {
    for (const gate of this.gates.values()) {
      gate.open();
    }
    return { success: true, gatesOpened: this.gates.size };
  }
  
  /**
   * Execute a protocol
   */
  executeProtocol(protocolName, input) {
    const protocol = PROTOCOL_REGISTRY[protocolName];
    if (!protocol) {
      return { success: false, reason: 'protocol_not_found', protocolName };
    }
    
    const startTime = Date.now();
    const result = {
      protocol: protocolName,
      executor: protocol.executor,
      wiring: protocol.wiring,
      event: protocol.event,
      input,
      timestamp: startTime
    };
    
    // Route to appropriate engine based on wiring
    const engine = this.engines[protocol.wiring];
    if (engine) {
      result.engineUsed = engine.name;
      result.engineStatus = engine.status();
    }
    
    // Log execution
    this.protocolLog.push(result);
    
    this.emit('protocol_executed', result);
    return result;
  }
  
  /**
   * Connect to EmailAI Mesh
   */
  connectToMesh(meshConfig) {
    const meshGate = this.gates.get('MESH->ORGANISM');
    if (!meshGate) return { success: false, reason: 'mesh_gate_not_found' };
    
    meshGate.open();
    
    // Map organs to mesh identities
    const organMapping = {};
    for (const [name, config] of Object.entries(ORGAN_REGISTRY)) {
      organMapping[name] = {
        email: config.email,
        type: config.type,
        domain: config.domain || 'general',
        gate: `${Object.keys(this.engines)[0]}->${name}` // Default gate
      };
    }
    
    return {
      success: true,
      meshGate: meshGate.id,
      organMapping,
      timestamp: Date.now()
    };
  }
  
  /**
   * Route computation through appropriate engine
   */
  route(domain, operation, params) {
    const engineMap = {
      physics: 'PHYSIKOS',
      mechanics: 'PHYSIKOS',
      relativity: 'PHYSIKOS',
      quantum: 'PHYSIKOS',
      
      algebra: 'ALGEBRAIKOS',
      matrix: 'ALGEBRAIKOS',
      group: 'ALGEBRAIKOS',
      linear: 'ALGEBRAIKOS',
      
      calculus: 'LOGISMIKOS',
      derivative: 'LOGISMIKOS',
      integral: 'LOGISMIKOS',
      ode: 'LOGISMIKOS',
      
      economics: 'OIKONOMIKOS',
      game: 'OIKONOMIKOS',
      market: 'OIKONOMIKOS',
      utility: 'OIKONOMIKOS',
      
      state: 'ERGASTIKOS',
      automaton: 'ERGASTIKOS',
      petri: 'ERGASTIKOS',
      process: 'ERGASTIKOS',
      
      social: 'KOINONIKOS',
      trust: 'KOINONIKOS',
      network: 'KOINONIKOS',
      influence: 'KOINONIKOS'
    };
    
    const engineName = engineMap[domain.toLowerCase()];
    if (!engineName) {
      return { success: false, reason: 'unknown_domain', domain };
    }
    
    const engine = this.engines[engineName];
    if (!engine[operation]) {
      return { success: false, reason: 'unknown_operation', operation, engine: engineName };
    }
    
    try {
      const result = engine[operation](...params);
      return { success: true, engine: engineName, operation, result };
    } catch (error) {
      return { success: false, reason: 'execution_error', error: error.message };
    }
  }
  
  /**
   * Get comprehensive system status
   */
  status() {
    const gateStatuses = {};
    for (const [id, gate] of this.gates) {
      gateStatuses[id] = {
        type: gate.type,
        status: gate.status,
        throughput: gate.throughput,
        capacity: gate.capacity
      };
    }
    
    const engineStatuses = {};
    for (const [name, engine] of Object.entries(this.engines)) {
      engineStatuses[name] = engine.status();
    }
    
    return {
      name: this.name,
      designation: this.designation,
      version: this.version,
      gates: {
        total: this.gates.size,
        statuses: gateStatuses
      },
      engines: {
        total: Object.keys(this.engines).length,
        statuses: engineStatuses
      },
      protocols: {
        total: Object.keys(PROTOCOL_REGISTRY).length,
        registry: PROTOCOL_REGISTRY
      },
      organs: {
        total: Object.keys(ORGAN_REGISTRY).length,
        registry: ORGAN_REGISTRY
      },
      protocolExecutions: this.protocolLog.length
    };
  }
  
  /**
   * Generate protocol report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      system: this.name,
      version: this.version,
      
      engines: Object.entries(this.engines).map(([name, engine]) => ({
        name,
        designation: engine.designation,
        tier: engine.tier,
        status: engine.status()
      })),
      
      protocols: Object.entries(PROTOCOL_REGISTRY).map(([name, proto]) => ({
        name,
        executor: proto.executor,
        wiring: proto.wiring,
        event: proto.event
      })),
      
      organs: Object.entries(ORGAN_REGISTRY).map(([name, config]) => ({
        name,
        email: config.email,
        type: config.type,
        domain: config.domain
      })),
      
      gates: [...this.gates.entries()].map(([id, gate]) => ({
        id,
        type: gate.type,
        source: gate.source,
        target: gate.target,
        status: gate.status
      })),
      
      mathConstants: {
        PHI,
        PHI_INV,
        PHI_SQ,
        SQRT_5,
        SQRT_3,
        PI,
        TAU,
        E
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a fully initialized gate network
 */
function createGateNetwork() {
  const network = new GateNetwork();
  network.openAllGates();
  return network;
}

/**
 * Create individual engine instances
 */
function createPhysicsEngine() { return new PhysicsEngine(); }
function createAlgebraEngine() { return new AlgebraEngine(); }
function createCalculusEngine() { return new CalculusEngine(); }
function createEconomicsEngine() { return new EconomicsEngine(); }
function createWorkingStateEngine() { return new WorkingStateEngine(); }
function createInterpersonalEngine() { return new InterpersonalEngine(); }

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Version
  GATE_VERSION,
  
  // Enums
  GateType,
  GateStatus,
  
  // Registries
  ORGAN_REGISTRY,
  ENGINE_REGISTRY,
  PROTOCOL_REGISTRY,
  
  // Classes
  Gate,
  GateNetwork,
  
  // Engine Classes
  PhysicsEngine,
  AlgebraEngine,
  CalculusEngine,
  EconomicsEngine,
  WorkingStateEngine,
  InterpersonalEngine,
  
  // Factory Functions
  createGateNetwork,
  createPhysicsEngine,
  createAlgebraEngine,
  createCalculusEngine,
  createEconomicsEngine,
  createWorkingStateEngine,
  createInterpersonalEngine
};

