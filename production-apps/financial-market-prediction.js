import { createPhaseEngine } from '../sdk/medina-phase/src/index.js';
import { createFieldEngine } from '../sdk/medina-field/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PRODUCTION: FINANCIAL MARKET PREDICTION (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const phase = createPhaseEngine({ numOscillators: 16 });
const field = createFieldEngine({ latticeSize: 10 });

for (let i = 0; i < 5; i += 1) {
  phase.step();
  field.evolve();
}

const phaseMetrics = phase.getMetrics();
const fieldMetrics = field.getMetrics();
const regime = phaseMetrics.lyapunovExponent > 0 ? 'CHAOTIC' : 'ORDERED';
const signal = regime === 'CHAOTIC' ? 'REDUCE RISK' : 'INCREASE EXPOSURE';

console.log('Phase metrics:', phaseMetrics);
console.log('Field metrics:', fieldMetrics);
console.log('Regime:', regime);
console.log('Signal:', signal);
