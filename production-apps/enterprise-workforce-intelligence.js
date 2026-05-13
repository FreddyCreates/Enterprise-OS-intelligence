import { WorkforceManager } from '../sdk/workforce-on-chain-sdk/src/index.js';
import { SpatialMemoryStore, LivingDocument } from '../sdk/sovereign-memory-sdk/src/index.js';
import { createOrchestrator, TaskType, Priority } from '../sdk/organism-ai/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PRODUCTION: ENTERPRISE WORKFORCE INTELLIGENCE (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const workforce = new WorkforceManager();
const memory = new SpatialMemoryStore();
const docs = new LivingDocument();
const orchestrator = createOrchestrator({ autoHeartbeat: false });

workforce.registerEntity({ id: 'employee-1', name: 'ARCHON-EXECUTIVE', role: 'executive' });
workforce.assignTask('employee-1', { description: 'Prepare promotion forecast', priority: 10 });
workforce.recordHeartbeat('employee-1', 1);

memory.store('employee-1:career', { trajectory: 'accelerating', risk: 'low' });
const report = docs.create('Retention Strategy', 'Initial retention analysis.');
docs.evolve(report.id, { type: 'append', content: ' Added skill-gap intervention plan.' });

const routed = orchestrator.route({
  type: TaskType.ANALYSIS,
  priority: Priority.HIGH,
  payload: 'Analyze workforce retention risk',
});

console.log('Workforce status:', workforce.getWorkforceStatus());
console.log('Memory record:', memory.retrieve('employee-1:career'));
console.log('Report snapshot:', docs.snapshot(report.id));
console.log('AI routing:', routed);
