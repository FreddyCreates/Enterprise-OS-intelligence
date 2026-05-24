/**
 * Test Suite for Organism Gates Module
 * Verifies all 6 deep engines and gate connections
 */

'use strict';

const {
  GATE_VERSION,
  GateType,
  GateStatus,
  ORGAN_REGISTRY,
  ENGINE_REGISTRY,
  PROTOCOL_REGISTRY,
  Gate,
  GateNetwork,
  PhysicsEngine,
  AlgebraEngine,
  CalculusEngine,
  EconomicsEngine,
  WorkingStateEngine,
  InterpersonalEngine,
  createGateNetwork
} = require('./organism_gates_mod');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                   O R G A N I S M   G A T E S   T E S T S                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertApprox(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ~${expected}, got ${actual}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICS ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ PHYSIKOS (Physics Engine) ═══');

const physics = new PhysicsEngine();

test('Lagrangian: L = T - V', () => {
  const L = physics.lagrangian(100, 40);
  assert(L === 60, `Expected 60, got ${L}`);
});

test('Hamiltonian: H = T + V', () => {
  const H = physics.hamiltonian(100, 40);
  assert(H === 140, `Expected 140, got ${H}`);
});

test('Kinetic Energy: T = ½mv²', () => {
  const T = physics.kineticEnergy(2, 3);
  assert(T === 9, `Expected 9, got ${T}`);
});

test('Gravitational Potential: V = -GMm/r', () => {
  const V = physics.gravitationalPotential(1e24, 1, 1e7);
  assert(V < 0, 'Gravitational potential should be negative');
});

test('Lorentz Factor: γ at v=0', () => {
  const gamma = physics.lorentzFactor(0);
  assert(gamma === 1, `Expected 1, got ${gamma}`);
});

test('Lorentz Factor: γ at v=0.8c', () => {
  const gamma = physics.lorentzFactor(0.8 * physics.constants.c);
  assertApprox(gamma, 5/3, 0.01, `Expected ~1.667, got ${gamma}`);
});

test('Schwarzschild Radius', () => {
  const r_s = physics.schwarzschildRadius(1.989e30); // Sun mass
  assert(r_s > 2900 && r_s < 3000, `Expected ~2953m, got ${r_s}`);
});

test('φ-Field returns numeric value', () => {
  const field = physics.phiField(1, 0.5, 1);
  assert(typeof field === 'number' && !isNaN(field), 'Field should be a valid number');
});

test('Coherence Length calculation', () => {
  const xi = physics.coherenceLength(physics.constants.m_e);
  assert(xi > 0 && xi < 1e-10, 'Coherence length should be on order of 10^-12 m');
});

// ═══════════════════════════════════════════════════════════════════════════════
// ALGEBRA ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ ALGEBRAIKOS (Algebra Engine) ═══');

const algebra = new AlgebraEngine();

test('Cyclic Group Z_5', () => {
  const Z5 = algebra.cyclicGroup(5);
  assert(Z5.order === 5, `Expected order 5, got ${Z5.order}`);
  assert(Z5.operation(3, 4) === 2, 'Expected 3+4 mod 5 = 2');
});

test('Matrix Multiplication', () => {
  const A = [[1, 2], [3, 4]];
  const B = [[5, 6], [7, 8]];
  const C = algebra.matMul(A, B);
  assert(C[0][0] === 19 && C[1][1] === 50, 'Matrix multiplication failed');
});

test('Matrix Determinant 2x2', () => {
  const det = algebra.determinant([[1, 2], [3, 4]]);
  assert(det === -2, `Expected -2, got ${det}`);
});

test('Matrix Determinant 3x3', () => {
  const det = algebra.determinant([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  assertApprox(det, 0, 1e-10, `Expected 0, got ${det}`);
});

test('Dot Product', () => {
  const d = algebra.dot([1, 2, 3], [4, 5, 6]);
  assert(d === 32, `Expected 32, got ${d}`);
});

test('Cross Product', () => {
  const c = algebra.cross([1, 0, 0], [0, 1, 0]);
  assert(c[2] === 1, 'Cross product of i×j should be k');
});

test('Identity Matrix', () => {
  const I = algebra.identity(3);
  assert(I[0][0] === 1 && I[1][1] === 1 && I[2][2] === 1, 'Identity diagonal should be 1');
  assert(I[0][1] === 0 && I[1][0] === 0, 'Identity off-diagonal should be 0');
});

test('Eigenvalues 2x2', () => {
  const eigs = algebra.eigenvalues2x2([[2, 1], [1, 2]]);
  assert(eigs.includes(3) && eigs.includes(1), `Expected [3, 1], got ${eigs}`);
});

test('Tensor Product dimensions', () => {
  const A = [[1, 2], [3, 4]];
  const B = [[5, 6], [7, 8]];
  const T = algebra.tensorProduct(A, B);
  assert(T.length === 4 && T[0].length === 4, 'Tensor product should be 4x4');
});

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULUS ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ LOGISMIKOS (Calculus Engine) ═══');

const calculus = new CalculusEngine();

test('Derivative of x²', () => {
  const f = x => x * x;
  const df = calculus.derivative(f, 3);
  assertApprox(df, 6, 0.001, `Expected 6, got ${df}`);
});

test('Second Derivative of x³', () => {
  const f = x => x * x * x;
  const d2f = calculus.secondDerivative(f, 2);
  assertApprox(d2f, 12, 0.01, `Expected 12, got ${d2f}`);
});

test('Integration: ∫x² dx from 0 to 1', () => {
  const f = x => x * x;
  const integral = calculus.integrate(f, 0, 1);
  assertApprox(integral, 1/3, 0.001, `Expected ~0.333, got ${integral}`);
});

test('Gradient of f(x,y) = x² + y²', () => {
  const f = ([x, y]) => x * x + y * y;
  const grad = calculus.gradient(f, [1, 1]);
  assertApprox(grad[0], 2, 0.01, `Expected grad[0] ~2, got ${grad[0]}`);
  assertApprox(grad[1], 2, 0.01, `Expected grad[1] ~2, got ${grad[1]}`);
});

test('Laplacian of f(x,y,z) = x² + y² + z²', () => {
  const f = ([x, y, z]) => x * x + y * y + z * z;
  const lap = calculus.laplacian(f, [1, 1, 1]);
  assertApprox(lap, 6, 0.1, `Expected 6, got ${lap}`);
});

test('RK4 Harmonic Oscillator', () => {
  const result = calculus.harmonicOscillator(1, 1, 0, 2 * Math.PI, 0.01);
  const final = result[result.length - 1];
  assertApprox(final.y[0], 1, 0.1, 'Should return to initial position after one period');
});

test('DFT preserves signal length', () => {
  const signal = [1, 0, 1, 0];
  const spectrum = calculus.dft(signal);
  assert(spectrum.length === signal.length, 'DFT should preserve length');
});

test('Lorenz System produces chaotic trajectory', () => {
  const result = calculus.lorenzSystem(10, 28, 8/3, [1, 1, 1], 1, 0.01);
  assert(result.length > 50, 'Should produce trajectory');
  const final = result[result.length - 1].y;
  assert(final.some(v => Math.abs(v) > 1), 'Lorenz system should evolve');
});

// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMICS ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ OIKONOMIKOS (Economics Engine) ═══');

const economics = new EconomicsEngine();

test('Cobb-Douglas Utility', () => {
  const U = economics.cobbDouglasUtility([4, 9], [0.5, 0.5]);
  assertApprox(U, 6, 0.001, `Expected 6, got ${U}`);
});

test('Prisoner\'s Dilemma', () => {
  const matrix = economics.prisonersDilemma();
  assert(matrix[0][0][0] === 3, 'Mutual cooperation should yield R=3');
  assert(matrix[1][1][0] === 1, 'Mutual defection should yield P=1');
});

test('Nash Equilibrium in Prisoner\'s Dilemma', () => {
  const matrix = economics.prisonersDilemma();
  const equilibria = economics.findPureNashEquilibria(matrix);
  assert(equilibria.length === 1, 'Should have exactly one Nash equilibrium');
  assert(equilibria[0].strategy[0] === 1 && equilibria[0].strategy[1] === 1, 'Nash equilibrium should be (Defect, Defect)');
});

test('Market Equilibrium', () => {
  const supply = p => 2 * p;
  const demand = p => 100 - p;
  const eq = economics.marketEquilibrium(supply, demand);
  assertApprox(eq.price, 100/3, 0.1, `Expected price ~33.33, got ${eq.price}`);
});

test('Price Elasticity at midpoint', () => {
  const demand = p => 100 - p;
  const elasticity = economics.priceElasticity(demand, 50);
  assertApprox(elasticity, -1, 0.001, `Expected ~-1, got ${elasticity}`);
});

test('CES Utility function', () => {
  const U = economics.cesUtility([4, 4], [0.5, 0.5], 0.5);
  assert(U > 0, 'CES utility should be positive');
});

// ═══════════════════════════════════════════════════════════════════════════════
// WORKING STATE ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ ERGASTIKOS (Working State Engine) ═══');

const workingState = new WorkingStateEngine();

test('DFA for binary strings ending in 1', () => {
  const dfa = workingState.createDFA(
    ['q0', 'q1'],
    ['0', '1'],
    { q0: { '0': 'q0', '1': 'q1' }, q1: { '0': 'q0', '1': 'q1' } },
    'q0',
    ['q1']
  );
  
  assert(workingState.runDFA(dfa, '101').accepted, '"101" should be accepted');
  assert(!workingState.runDFA(dfa, '100').accepted, '"100" should be rejected');
});

test('Petri Net Token Flow', () => {
  const net = workingState.createPetriNet(
    ['p1', 'p2'],
    ['t1'],
    { p1: { t1: 1 }, t1: { p2: 1 } },
    { p1: 1, p2: 0 }
  );
  workingState.buildArcMappings(net);
  
  assert(workingState.isTransitionEnabled(net, 't1'), 't1 should be enabled');
  workingState.fireTransition(net, 't1');
  assert(net.marking.p1 === 0 && net.marking.p2 === 1, 'Token should move from p1 to p2');
});

test('φ-State Machine creation', () => {
  const fsm = workingState.createPhiStateMachine(
    ['s0', 's1', 's2'],
    { s0: { s1: 1, s2: 1 }, s1: { s0: 1 }, s2: { s0: 1 } }
  );
  assert(fsm.type === 'phi-fsm', 'Should be φ-FSM type');
  assert(fsm.currentState === 's0', 'Should start at s0');
});

test('φ-State Machine transition', () => {
  const fsm = workingState.createPhiStateMachine(
    ['s0', 's1', 's2'],
    { s0: { s1: 1, s2: 1 }, s1: { s0: 1 }, s2: { s0: 1 } }
  );
  const result = workingState.phiTransition(fsm);
  assert(result.success, 'Transition should succeed');
  assert(['s1', 's2'].includes(result.newState), 'Should transition to s1 or s2');
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTERPERSONAL ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ KOINONIKOS (Interpersonal Engine) ═══');

const interpersonal = new InterpersonalEngine();

test('Social Network Creation', () => {
  const network = interpersonal.createNetwork(
    ['A', 'B', 'C'],
    [['A', 'B', 1], ['B', 'C', 1], ['A', 'C', 1]]
  );
  assert(network.nodes.size === 3, 'Should have 3 nodes');
});

test('Degree Centrality', () => {
  const network = interpersonal.createNetwork(
    ['A', 'B', 'C'],
    [['A', 'B', 1], ['B', 'C', 1]]
  );
  const centrality = interpersonal.degreeCentrality(network);
  assert(centrality['B'] > centrality['A'], 'B should have higher centrality than A');
});

test('Trust Network initialization', () => {
  const trustNet = interpersonal.createTrustNetwork(['Alice', 'Bob', 'Charlie']);
  assert(trustNet.trust['Alice']['Bob'] === 0.5, 'Initial trust should be 0.5');
});

test('Trust Update learning', () => {
  const newTrust = interpersonal.updateTrust(0.5, 1.0, 0.1);
  assertApprox(newTrust, 0.55, 0.001, `Expected 0.55, got ${newTrust}`);
});

test('Transitive Trust', () => {
  const trustNet = interpersonal.createTrustNetwork(['A', 'B', 'C']);
  trustNet.trust['A']['B'] = 0.8;
  trustNet.trust['B']['C'] = 0.9;
  
  const transitive = interpersonal.transitiveTrust(trustNet, 'A', 'B', 'C');
  assertApprox(transitive, 0.72, 0.001, `Expected 0.72, got ${transitive}`);
});

test('PageRank convergence', () => {
  const network = interpersonal.createNetwork(
    ['A', 'B', 'C'],
    [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]]
  );
  const ranks = interpersonal.pageRank(network);
  
  const values = Object.values(ranks);
  const mean = values.reduce((a, b) => a + b) / values.length;
  const allSimilar = values.every(v => Math.abs(v - mean) < 0.01);
  assert(allSimilar, 'All nodes in a cycle should have similar PageRank');
});

test('Independent Cascade model', () => {
  const network = interpersonal.createNetwork(
    ['A', 'B', 'C', 'D'],
    [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1]]
  );
  const result = interpersonal.independentCascade(network, ['A'], 1.0);
  assert(result.finalActivated.includes('A'), 'Seed should be activated');
  assert(result.totalActivated >= 1, 'At least seed should be activated');
});

// ═══════════════════════════════════════════════════════════════════════════════
// GATE NETWORK TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ GATE NETWORK INTEGRATION ═══');

test('Gate Network Creation', () => {
  const network = createGateNetwork();
  assert(network.gates.size > 0, 'Network should have gates');
  assert(Object.keys(network.engines).length === 6, 'Should have 6 engines');
});

test('Protocol Execution', () => {
  const network = createGateNetwork();
  const result = network.executeProtocol('PROTO-DYNAMICS', { test: true });
  assert(result.protocol === 'PROTO-DYNAMICS', 'Should execute PROTO-DYNAMICS');
  assert(result.wiring === 'PHYSICS', 'Should wire to PHYSICS');
});

test('Route to Physics Engine', () => {
  const network = createGateNetwork();
  const result = network.route('physics', 'lagrangian', [100, 40]);
  assert(result.success, 'Should route successfully');
  assert(result.result === 60, `Expected 60, got ${result.result}`);
});

test('Route to Algebra Engine', () => {
  const network = createGateNetwork();
  const result = network.route('matrix', 'dot', [[1, 2, 3], [4, 5, 6]]);
  assert(result.success, 'Should route successfully');
  assert(result.result === 32, `Expected 32, got ${result.result}`);
});

test('Mesh Connection', () => {
  const network = createGateNetwork();
  const result = network.connectToMesh({});
  assert(result.success, 'Should connect to mesh');
  assert(Object.keys(result.organMapping).length > 0, 'Should have organ mapping');
});

test('System Status Report', () => {
  const network = createGateNetwork();
  const status = network.status();
  assert(status.engines.total === 6, 'Should report 6 engines');
  assert(status.protocols.total > 0, 'Should have protocols');
});

test('Full Report Generation', () => {
  const network = createGateNetwork();
  const report = network.generateReport();
  assert(report.engines.length === 6, 'Report should include 6 engines');
  assert(report.mathConstants && report.mathConstants.PHI > 1.6, 'Should include PHI constant');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ REGISTRIES ═══');

test('Organ Registry completeness', () => {
  assert(Object.keys(ORGAN_REGISTRY).length >= 20, 'Should have at least 20 organs/agents');
  assert(ORGAN_REGISTRY.membrane.email.includes('@medinatechlabs.net'), 'Organs should have email');
});

test('Engine Registry includes deep engines', () => {
  assert(ENGINE_REGISTRY.PHYSICS, 'Should include PHYSICS');
  assert(ENGINE_REGISTRY.ALGEBRA, 'Should include ALGEBRA');
  assert(ENGINE_REGISTRY.CALCULUS, 'Should include CALCULUS');
  assert(ENGINE_REGISTRY.ECONOMICS, 'Should include ECONOMICS');
  assert(ENGINE_REGISTRY.WORKING_STATE, 'Should include WORKING_STATE');
  assert(ENGINE_REGISTRY.INTERPERSONAL, 'Should include INTERPERSONAL');
});

test('Protocol Registry completeness', () => {
  assert(Object.keys(PROTOCOL_REGISTRY).length >= 16, 'Should have at least 16 protocols');
  assert(PROTOCOL_REGISTRY['PROTO-DYNAMICS'], 'Should include PROTO-DYNAMICS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                 RESULTS                                       ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log(`\n  Total: ${passCount + failCount} tests`);
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${failCount}\n`);

if (failCount === 0) {
  console.log('  🎉 ALL TESTS PASSED!\n');
  console.log('  ENGINES OPERATIONAL:');
  console.log('    ✓ PHYSIKOS    - Physics Engine (Lagrangian/Hamiltonian/Relativity)');
  console.log('    ✓ ALGEBRAIKOS - Algebra Engine (Groups/Matrices/Tensors)');
  console.log('    ✓ LOGISMIKOS  - Calculus Engine (ODEs/Integration/Transforms)');
  console.log('    ✓ OIKONOMIKOS - Economics Engine (Game Theory/Markets/Utility)');
  console.log('    ✓ ERGASTIKOS  - Working State Engine (FSM/Petri/Process Algebra)');
  console.log('    ✓ KOINONIKOS  - Interpersonal Engine (Networks/Trust/Influence)\n');
  
  console.log('  GATES OPERATIONAL:');
  const network = createGateNetwork();
  console.log(`    ✓ ${network.gates.size} gates initialized`);
  console.log(`    ✓ ${Object.keys(PROTOCOL_REGISTRY).length} protocols registered`);
  console.log(`    ✓ ${Object.keys(ORGAN_REGISTRY).length} organs mapped\n`);
  
  process.exit(0);
} else {
  console.log('  ❌ SOME TESTS FAILED\n');
  process.exit(1);
}
