import { createSwarm } from '../sdk/medina-swarm/src/index.js';
import { createOrchestrator, TaskType, Priority } from '../sdk/organism-ai/src/index.js';
import { WorkforceRouter } from '../sdk/intelligence-routing-sdk/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PRODUCTION: DISTRIBUTED COMPUTE ORCHESTRATOR (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const swarm = createSwarm({ numBoids: 128 });
const orchestrator = createOrchestrator({ autoHeartbeat: false });
const workforce = new WorkforceRouter()
  .registerAgent('node-a', 'gpu-cluster', ['cuda', 'training', 'inference'], 'available')
  .registerAgent('node-b', 'cpu-cluster', ['batch', 'analysis'], 'available')
  .registerAgent('node-c', 'mixed-cluster', ['training', 'analysis'], 'available');

const jobs = [
  { id: 'job-1', type: TaskType.CODING, priority: Priority.HIGH, payload: 'Compile model graph', requiredSkills: ['analysis'] },
  { id: 'job-2', type: TaskType.ANALYSIS, priority: Priority.CRITICAL, payload: 'Run training metrics', requiredSkills: ['training'] },
];

const routed = jobs.map((job) => ({
  jobId: job.id,
  model: orchestrator.route(job),
  node: workforce.assignTask({
    id: job.id,
    requiredSkills: job.requiredSkills,
    priority: 'high',
  }),
}));

const swarmMetrics = swarm.step();

console.log('Swarm metrics:', swarmMetrics);
console.log('Job routing:');
routed.forEach((entry) => {
  console.log(`  ${entry.jobId} -> model=${entry.model.modelId}, node=${entry.node?.agentId ?? 'none'}`);
});
console.log('Compute orchestration live.');
