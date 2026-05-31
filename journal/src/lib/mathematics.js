/**
 * THE MATHEMATICS — the equations and the names they produced.
 *
 * Every entry here is traceable: equation, the phenomenon in nature,
 * the name in the system, and a path to a file in the repository that
 * implements it. If a row cannot point to a file, it does not belong here.
 */

export const equations = [
  {
    eq:        'φ = (1 + √5) / 2 ≈ 1.6180339887…',
    summary:   'The golden ratio — the most irrational number; the unique attractor of optimal packing under growth.',
    phenomenon:'Sunflower seed packing, nautilus spirals, branching of trees, optimal substrate geometry.',
    name:      'AURUM',
    paper:     'XXII',
    code:      'native/phi-math/phi_math.hpp',
    note:      'φ recurs everywhere in this system because the system implements processes (growth under constraint, accumulation under reinforcement, synchronisation across many oscillators) whose optimal solutions converge to φ-structure. The constant is not chosen. It is what the equations resolve to.',
  },
  {
    eq:        '∂τ/∂t = D·∇²τ − ρ·τ + Σᵢ δ(x − xᵢ(t)) · q(xᵢ, t)',
    summary:   'The pheromone reaction-diffusion equation — ant trail dynamics.',
    phenomenon:'Ants deposit pheromone (q), pheromone evaporates (ρ) and spreads (D); the field τ accumulates the colony\'s decision history. The optimal path emerges as the stationary distribution.',
    name:      'STIGMERGY → NEXORIS',
    paper:     'XX',
    code:      'sdk/medina-swarm · sdk/nexoris-agi',
    note:      'The intelligence is not in the agents. It is crystallised in the field between them. The name NEXORIS — from Latin nexus (bond) + oris (mouth, edge) — is the field itself, not the routing logic that reads from it.',
  },
  {
    eq:        'dnᵢ/dt = α · nᵢ · (qᵢ − q̄) − β · nᵢ + γ · (N − Σⱼ nⱼ),   θ ≈ φ⁻⁴',
    summary:   'Honeybee quorum phase transition. Decisions crystallise when commitment crosses the threshold — no authority required.',
    phenomenon:'Honeybee swarms choose a nest site without voting. Each scout commits to a candidate; recruitment scales with site quality. The colony decides when ~15% of scouts converge on one site. Biology converged to ≈ φ⁻⁴.',
    name:      'QUORUM → COGNOVEX',
    paper:     'XXI',
    code:      'sdk/cognovex-agi',
    note:      'The match between the biological threshold (~0.15N) and the mathematical constant φ⁻⁴ (≈ 0.1459) is within measurement error. Evolution optimised for reliable consensus under time pressure. The same mathematics governs the agent-council finding consensus in the architecture.',
  },
  {
    eq:        'dθᵢ/dt = ωᵢ + (K/N) · Σⱼ sin(θⱼ − θᵢ),   sync threshold R ≥ φ⁻¹',
    summary:   'Kuramoto synchronisation. Many oscillators with different natural frequencies entrain to a common phase when coupling K is strong enough.',
    phenomenon:'Fireflies, neurons, cardiac pacemaker cells, clock pendulums on the same wall. The order parameter R measures the degree of coherence; R ≥ φ⁻¹ ≈ 0.618 is the threshold for usable network coherence.',
    name:      'CONCORDIA MACHINAE',
    paper:     'II',
    code:      'native/phi-math/phi_math.hpp::kuramoto_step · sdk/medina-phase',
    note:      'A network of sovereign compute units that drifts apart in phase loses the coherence it needs to aggregate world models. The Kuramoto coupling is the system\'s tonic synchronisation — sub-threshold means the units are still talking to themselves, super-threshold means they\'re a chorus.',
  },
  {
    eq:        'ẋ = r·x·(1 − x/K) − α·x·y\nẏ = δ·x·y − β·y',
    summary:   'Lotka-Volterra predator-prey dynamics, repurposed for organisational tension.',
    phenomenon:'Expansion (x) and resistance (y) coupled through interaction. Healthy systems oscillate around a productive equilibrium. The dominance ratio x/(x+y) staying above φ⁻¹ is the heartbeat of a functional organisation.',
    name:      'CORDEX',
    paper:     'III',
    code:      'sdk/cordex-agi/cordex-agi.js',
    note:      'CORDEX (from cor — heart) is the organisational heartbeat. When resistance overruns expansion, the model flags the imbalance before it manifests as a visible crisis. The model is the symptom; the human decision is the response.',
  },
  {
    eq:        'C(t) = C₀ · φᵗ,   α_learning = φ⁻¹',
    summary:   'φ-compounding capacity and golden-ratio learning rate.',
    phenomenon:'A capacity that doubles by Fibonacci compounding (each step ≈ ×φ over the prior) tracks the densest growth that does not collide with itself. The same φ⁻¹ ≈ 0.618 reappears as the optimal Bayesian learning weight — it is what makes the world model accumulate cleanly across time scales.',
    name:      'CYCLOVEX · CEREBEX',
    paper:     'XXII · VII',
    code:      'sdk/cyclovex-agi · sdk/cerebex-agi',
    note:      'These two engines are siblings under the same equation read at different orders: CYCLOVEX integrates the capacity outward, CEREBEX averages the world model inward. Same φ, same dynamic, opposite direction.',
  },
  {
    eq:        '⟨ symmetry → conservation ⟩  (Noether 1915)',
    summary:   'Every continuous symmetry of an action produces a conserved quantity.',
    phenomenon:'In physics: time-translation symmetry → energy conservation; rotational symmetry → angular momentum. Applied to compute: SL-0 doctrine invariance is the symmetry; aggregate sovereignty is what is conserved.',
    name:      'IMPERIUM CONSERVATUM',
    paper:     'VIII',
    code:      'doctrine block embedded in every VOXIS unit (Paper IV)',
    note:      'A VOXIS that cannot preserve its doctrine cannot operate inside the system. The constraint is structural, not policy-enforced. The doctrine block is read first on every heartbeat; if it has been altered, processing halts.',
  },
  {
    eq:        '2π / φ² ≈ 137.5076°  (the golden angle)',
    summary:   'The angle at which each new element on a growing spiral is placed to maximise packing density while minimising radial collision.',
    phenomenon:'Phyllotaxis — sunflower seed arrangement, pinecone scale spirals, daisy florets. Every CPX spatial scene in the system uses this angle for the same reason nature does.',
    name:      'CPX scene sovereignty',
    paper:     '— (encoded in CPX_CHARTER.md)',
    code:      'native/phi-math/phi_math.hpp::phi_coordinate',
    note:      'Spatial memory addressing in the SpatialMemoryStore uses the golden angle so that adjacent memory positions never collapse onto the same axial line, no matter how many memories accumulate.',
  },
  {
    eq:        'Heartbeat = 873 ms ≈ 1.145 Hz',
    summary:   'The sovereign organism beat. Chosen to sit at the cardiac fundamental of mammalian biology and to phase-lock to φ-spaced sub-beats.',
    phenomenon:'A mammal\'s resting cardiac rate at rest sits near 1 Hz; the φ-irrational sub-beats prevent any two oscillators in the system from locking onto a simple integer harmonic.',
    name:      'Sovereign Cycle Protocol (SCP)',
    paper:     '—',
    code:      'protocols/sovereign-cycle-protocol.js',
    note:      'The beat is not waiting for input. It runs because being alive means producing a rhythm whether anyone is asking or not. Every other timer in the system synchronises to it (Architectural Law AL-019).',
  },
];

export const closing = 'The names were not chosen. They were found.';
