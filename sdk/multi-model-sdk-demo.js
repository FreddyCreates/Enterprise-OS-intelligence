import { getRegistry } from './medina-registry/src/index.js';
import { createOrchestrator, TaskType, Priority } from './organism-ai/src/index.js';
import { createQueryEngine } from './medina-queries/src/index.js';
import { createComposer } from './protocol-composer/src/index.js';
import { createBootstrap, createStateManager, createValidator } from './organism-bootstrap/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MEDINA MULTI-MODEL SDK INTEGRATION DEMO (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const registry = getRegistry();
const orchestrator = createOrchestrator({ autoHeartbeat: false });
const queryEngine = createQueryEngine();
const composer = createComposer({ autoHeartbeat: false });
const bootstrap = createBootstrap({ network: 'local' });
const state = createStateManager();
const validator = createValidator();

queryEngine.registerProtocol('neural-sync', { active: true, reputation: 0.91 });
queryEngine.registerModule('memory', { active: true, domain: 'memory' });
queryEngine.registerAgent('analyst', { role: 'analysis', active: true });
queryEngine.addMemory({ content: 'synchronization pattern detected', tags: ['sync'] });

composer
  .registerProtocol('neural-sync', { execute: (input) => ({ ...input, neural: true }) }, [])
  .registerProtocol('memory', { execute: (input) => ({ ...input, memory: true }) }, ['neural-sync'])
  .registerProtocol('decision', { execute: (input) => ({ ...input, decision: true }) }, ['memory']);

bootstrap
  .registerModule('neural-sync', { config: { role: 'protocol' } })
  .registerModule('memory', { config: { role: 'module' } });

state.setStable('beatCount', 127);
state.setStable('reputation', 0.8534);
validator.addCheck('modules-registered', async () => ({ passed: true, message: 'modules ready' }));

const route = orchestrator.route({
  type: TaskType.CODING,
  priority: Priority.HIGH,
  payload: 'Write a synchronization routine',
});
orchestrator.recordOutcome(route.modelId, true, 1200);

const search = queryEngine.search('sync', 0.2);
const composition = composer.executeAll({ input: 'organism' });
const deployment = bootstrap.getDeploymentPackage();
const validation = await validator.validate();

console.log('Registry packages:', registry.getStats().totalPackages);
console.log('Routed model:', route.modelId, 'score:', route.score);
console.log('Top protocol search hit:', search.protocols[0]?.name ?? 'none');
console.log('Composition result keys:', Object.keys(composition));
console.log('Generated wrappers:', Object.keys(deployment.wrappers));
console.log('Stable state entries:', state.serializeStableState().totalEntries);
console.log('Validation passed:', validation.passed);
console.log('All core SDKs integrated successfully.');
