import { createSwarm } from './medina-swarm/src/index.js';
import { createPhaseEngine } from './medina-phase/src/index.js';
import { createTensor, LieAlgebra, createMetricTensor, phiDecompose } from './medina-tensor/src/index.js';
import { createFieldEngine } from './medina-field/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ADVANCED MATHEMATICS SDKs DEMO (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const swarm = createSwarm({ numBoids: 24 });
const phase = createPhaseEngine({ numOscillators: 12 });
const field = createFieldEngine({ latticeSize: 12 });
const A = createTensor([1, 2, 3, 4], [2, 2]);
const B = createTensor([5, 6, 7, 8], [2, 2]);

const swarmMetrics = swarm.step();
const phaseMetrics = phase.step();
const fieldMetrics = field.evolve();
const bracket = LieAlgebra.bracket(A, B);
const exponential = LieAlgebra.exponential(A);
const metric = createMetricTensor([2, 0, 0, 3]);

console.log('PART 1: Swarm Intelligence');
console.log('──────────────────────────────────────────────────────────────');
console.log(JSON.stringify(swarmMetrics, null, 2));

console.log('\nPART 2: Phase Space Dynamics');
console.log('──────────────────────────────────────────────────────────────');
console.log(JSON.stringify(phaseMetrics, null, 2));

console.log('\nPART 3: Tensor Operations');
console.log('──────────────────────────────────────────────────────────────');
console.log('Lie bracket:', bracket.toArray());
console.log('Exponential (truncated):', exponential.toArray());
console.log('Metric line element dx=1, dy=2:', metric.lineElement(1, 2));
console.log('Phi decomposition:', phiDecompose(A));

console.log('\nPART 4: Quantum Field Theory');
console.log('──────────────────────────────────────────────────────────────');
console.log(JSON.stringify(fieldMetrics, null, 2));

console.log('\nSUMMARY');
console.log('──────────────────────────────────────────────────────────────');
console.log('Swarm consensus:', swarmMetrics.consensus);
console.log('Phase synchronised:', phaseMetrics.synchronized);
console.log('Field RG coupling:', fieldMetrics.rgCoupling);
console.log('All advanced math SDKs executed successfully.');
