import { ModelRouter, CommandParser, TerminalDispatch, IntelligenceWire, WorkforceRouter } from './intelligence-routing-sdk/src/index.js';
import { ModelOrchestrator } from './multi-model-sdk/src/index.js';
import { SpatialMemoryStore, DualLayerSearch, MemoryLineage, LivingDocument, PhiCoordinateGenerator } from './sovereign-memory-sdk/src/index.js';
import { CanisterDeployer, WorkforceManager } from './workforce-on-chain-sdk/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ENTERPRISE RUNTIME DEMO');
console.log('═══════════════════════════════════════════════════════════════\n');

const router = new ModelRouter()
  .registerModel('gpt-4o', ['code-gen', 'reasoning', 'summarize'], { priority: 2 })
  .registerModel('deepseek-coder', ['code-gen', 'reasoning'], { priority: 3 });

const parser = new CommandParser()
  .registerCommand('deploy,ship')
  .registerCommand(/^rollback\s/);

const dispatch = new TerminalDispatch()
  .createTerminal('terminal-a', { type: 'local', capabilities: ['deploy'], maxConcurrency: 2 });

const wire = new IntelligenceWire();
const connected = wire.connect('cerebrum', 'agens', { bandwidth: 10, protocol: 'rship-wire', encryption: true });
wire.onReceive(connected.wireId, () => {});
wire.send(connected.wireId, { action: 'deploy' });

const workforce = new WorkforceRouter()
  .registerAgent('agent-1', 'engineer', ['docker', 'k8s', 'javascript'], 'available')
  .registerAgent('agent-2', 'analyst', ['research', 'python'], 'available');

const orchestrator = new ModelOrchestrator()
  .registerModel({ modelId: 'gpt-4o', provider: 'openai', capabilities: ['code-gen', 'summarize'], priority: 2 })
  .registerModel({ modelId: 'claude-4', provider: 'anthropic', capabilities: ['reasoning', 'summarize'], priority: 2 });

const store = new SpatialMemoryStore();
const generator = new PhiCoordinateGenerator();
const recordA = store.store('idea-1', { text: 'quantum routing plan' }, generator.generate(1));
const recordB = store.store('idea-2', { text: 'enterprise deployment notes' }, generator.generate(2));
const search = new DualLayerSearch();
const lineage = new MemoryLineage();
lineage.recordAncestor('idea-2', 'idea-1');
const docs = new LivingDocument();
const doc = docs.create('Deployment Plan', 'Initial observations.');
docs.evolve(doc.id, { type: 'append', content: ' Added rollout checks.' });

const deployer = new CanisterDeployer();
const deployed = deployer.deploy({
  network: 'local',
  entities: [{ name: 'ARCHON-EXECUTIVE' }, { name: 'VECTOR-TRACE' }],
});
const workforceManager = new WorkforceManager();
workforceManager.registerEntity({ id: 'entity-1', name: 'ARCHON-EXECUTIVE', role: 'executive' });
workforceManager.assignTask('entity-1', { description: 'Review rollout', priority: 10 });
workforceManager.recordHeartbeat('entity-1', 1);

console.log('Parsed command:', parser.parse('deploy api --env=production --verbose'));
console.log('Validation:', parser.validate(parser.parse('deploy api --env=production --verbose')));
console.log('Router result:', router.route({ type: 'code-review', requirements: ['code-gen', 'reasoning'], priority: 'high' }));
console.log('Dispatch result:', await dispatch.dispatch('terminal-a', 'deploy api'));
console.log('Wire metrics:', wire.getWireMetrics(connected.wireId));
console.log('Assigned workforce agent:', workforce.assignTask({ id: 'task-1', requiredSkills: ['docker', 'javascript'], priority: 'high' }));
console.log('Orchestrated inference:', orchestrator.infer({ type: 'summarize', requirements: ['summarize'] }));
console.log('Spatial memory retrieve:', store.retrieve('idea-1'));
console.log('Dual read top hit:', search.dualRead({ text: 'enterprise deployment', coordinates: recordA.coordinates }, [recordA, recordB])[0]?.id);
console.log('Lineage:', lineage.getLineage('idea-2'));
console.log('Document snapshot:', docs.snapshot(doc.id));
console.log('Deployment manifest:', deployed);
console.log('On-chain workforce status:', workforceManager.getWorkforceStatus());
console.log('Enterprise runtime demo complete.');
