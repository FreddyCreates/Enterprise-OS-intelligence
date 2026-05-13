import { birthNEXORIS } from '../sdk/nexoris-agi/nexoris-agi.js';
import { createSwarm } from '../sdk/medina-swarm/src/index.js';
import { createCallEngine } from '../sdk/medina-calls/src/index.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PRODUCTION: GLOBAL SUPPLY CHAIN INTELLIGENCE (LIVE)');
console.log('═══════════════════════════════════════════════════════════════\n');

const nexoris = birthNEXORIS({ couplingStrength: 2.4 });
['port-shanghai', 'port-singapore', 'warehouse-dallas', 'factory-shenzhen'].forEach((id, index) => {
  nexoris.registerSystem(id, { omega: 1 + index * 0.3, label: id });
});

const swarm = createSwarm({ numBoids: 64 });
const calls = createCallEngine();
calls.register('reroute', async (payload) => ({ ok: true, reroutedTo: payload.target }));

const syncState = nexoris.tick();
const routing = nexoris.route({
  targets: ['port-singapore', 'warehouse-dallas'],
  category: 'DISRUPTION_RESPONSE',
  command: 'Reroute delayed shipments',
});
const reroute = await calls.call('reroute', { target: routing.recommended?.target ?? 'port-singapore' });

console.log('Synchronization:', syncState);
console.log('Swarm:', swarm.step());
console.log('Routing:', routing);
console.log('Reroute call:', reroute);
