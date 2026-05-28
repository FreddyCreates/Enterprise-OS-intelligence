export const PHI = 1.618033988749895;
export const PHI_INV = 1 / PHI;
export const HEARTBEAT_MS = 873;

export const AGENTS = [
  { id: 'RSHIP-AIS-CB-001', name: 'CEREBRUM', latin: 'cerebrum', meaning: 'brain', role: 'Intelligence OS — command center', url: 'https://cerebrum.rship.workers.dev', color: '#00d4ff', icon: '◎' },
  { id: 'RSHIP-AIS-AN-001', name: 'ANIMUS', latin: 'animus', meaning: 'soul · mind', role: 'AI-Native Interface — intelligence gate', url: 'https://animus.rship.workers.dev', color: '#ffd700', icon: '✦' },
  { id: 'RSHIP-AIS-AG-001', name: 'AGENS', latin: 'agens', meaning: 'the one who acts', role: 'Agent AI Services — enterprise agent deployment', url: 'https://agens.rship.workers.dev', color: '#ff6b35', icon: '⬡' },
  { id: 'RSHIP-AIS-NX-001', name: 'NEXUS', latin: 'nexus', meaning: 'bond · network', role: 'Supply Chain Intelligence — Kuramoto sync', url: 'https://nexus.rship.workers.dev', color: '#00ff88', icon: '◈' },
  { id: 'RSHIP-AIS-VG-001', name: 'VIGIL', latin: 'vigil', meaning: 'watchman · sentinel', role: 'Market Sentinel — chaos detection', url: 'https://vigil.rship.workers.dev', color: '#ff9500', icon: '◉' },
  { id: 'RSHIP-AIS-CS-001', name: 'CURSOR', latin: 'cursor', meaning: 'runner · messenger', role: 'Travel Intelligence — living companion', url: 'https://cursor.rship.workers.dev', color: '#cc44ff', icon: '↗' }
];

export const PROTOCOLS = [
  { id: 'PROTO-011', name: 'Sovereign Cycle', math: 'heartbeat · Fibonacci kernel · Kuramoto sync', file: 'protocols/sovereign-cycle-protocol.js' },
  { id: 'PROTO-012', name: 'Autonomous Division', math: 'division coordination · block boxes · Fibonacci scaling', file: 'protocols/autonomous-division-protocol.js' },
  { id: 'PROTO-013', name: 'Neural Synchronization', math: '21 neurochemicals · Hebbian plasticity', file: 'protocols/neural-synchronization-protocol.js' },
  { id: 'PROTO-014', name: 'Emergence Detection', math: 'Ising model · Landau · percolation', file: 'protocols/emergence-detection-protocol.js' },
  { id: 'PROTO-015', name: 'Cognitive Memory', math: 'working / episodic / semantic', file: 'protocols/cognitive-memory-protocol.js' },
  { id: 'PROTO-016', name: 'Adaptive Learning', math: 'Lyapunov stability · antifragility', file: 'protocols/adaptive-learning-protocol.js' },
  { id: 'PROTO-017', name: 'Scalability Coordination', math: 'boids swarm · quorum sensing', file: 'protocols/scalability-coordination-protocol.js' }
];

export const ORGANISM_LAYERS = [
  {
    id: 'foundation',
    name: 'Foundational SDKs',
    color: '#00d4ff',
    items: [
      { id: 'medina-heart', kind: 'sdk', path: 'sdk/medina-heart/src/index.js' },
      { id: 'medina-registry', kind: 'sdk', path: 'sdk/medina-registry/src/index.js' },
      { id: 'organism-ai', kind: 'sdk', path: 'sdk/organism-ai/src/index.js' },
      { id: 'medina-queries', kind: 'sdk', path: 'sdk/medina-queries/src/index.js' },
      { id: 'protocol-composer', kind: 'sdk', path: 'sdk/protocol-composer/src/index.js' },
      { id: 'organism-bootstrap', kind: 'sdk', path: 'sdk/organism-bootstrap/src/index.js' }
    ]
  },
  {
    id: 'math',
    name: 'Math Runtime Layer',
    color: '#00ff88',
    items: [
      { id: 'medina-tensor', kind: 'sdk', path: 'sdk/medina-tensor/src/index.js' },
      { id: 'medina-field', kind: 'sdk', path: 'sdk/medina-field/src/index.js' },
      { id: 'medina-phase', kind: 'sdk', path: 'sdk/medina-phase/src/index.js' },
      { id: 'medina-swarm', kind: 'sdk', path: 'sdk/medina-swarm/src/index.js' },
      { id: 'medina-timers', kind: 'sdk', path: 'sdk/medina-timers/src/index.js' },
      { id: 'medina-calls', kind: 'sdk', path: 'sdk/medina-calls/src/index.js' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Runtime Layer',
    color: '#ffd700',
    items: [
      { id: 'intelligence-routing-sdk', kind: 'sdk', path: 'sdk/intelligence-routing-sdk/src/index.js' },
      { id: 'multi-model-sdk', kind: 'sdk', path: 'sdk/multi-model-sdk/src/index.js' },
      { id: 'sovereign-memory-sdk', kind: 'sdk', path: 'sdk/sovereign-memory-sdk/src/index.js' },
      { id: 'workforce-on-chain-sdk', kind: 'sdk', path: 'sdk/workforce-on-chain-sdk/src/index.js' }
    ]
  },
  {
    id: 'chip',
    name: 'Virtual Chip Core Layer',
    color: '#ff9500',
    items: [
      { id: 'neural-emergence-core', kind: 'sdk', path: 'sdk/neural-emergence-core/src/index.js' },
      { id: 'sovereignty-core', kind: 'sdk', path: 'sdk/sovereignty-core/src/index.js' },
      { id: 'resonance-core', kind: 'sdk', path: 'sdk/resonance-core/src/index.js' },
      { id: 'power-core', kind: 'sdk', path: 'sdk/power-core/src/index.js' },
      { id: 'generator-core', kind: 'sdk', path: 'sdk/generator-core/src/index.js' },
      { id: 'sovereign-protocol-sdk', kind: 'sdk', path: 'sdk/sovereign-protocol-sdk/src/index.js' },
      { id: 'rship-core', kind: 'sdk', path: 'sdk/rship-core/src/index.js' }
    ]
  },
  {
    id: 'substrate',
    name: 'Substrate + Native Layer',
    color: '#cc44ff',
    items: [
      { id: 'oro-canisters', kind: 'motoko', path: 'canisters/src/' },
      { id: 'organism-core', kind: 'rust', path: 'rust/organism-core/src/' },
      { id: 'organism-gateway', kind: 'go', path: 'go/organism-gateway/' },
      { id: 'parralax-aihftfund', kind: 'finance-stack', path: 'PARRALAX-AIHFTFUND/' }
    ]
  }
];

export const VALIDATION_COMMANDS = [
  'node tools/verify-core-sdks.mjs',
  'node protocols/test-integration.js',
  'cargo test --manifest-path rust/organism-core/Cargo.toml',
  'cargo run --quiet --manifest-path rust/organism-core/Cargo.toml',
  'node sdk/advanced-sdks-demo.js',
  'node sdk/multi-model-sdk-demo.js',
  'node sdk/enterprise-runtime-demo.js',
  'node tools/verify-virtual-chip.mjs',
  'node production-apps/distributed-compute-orchestrator.js',
  'node production-apps/financial-market-prediction.js',
  'node production-apps/global-supply-chain-intelligence.js',
  'node production-apps/enterprise-workforce-intelligence.js',
  'node tools/verify-cerebrum-atlas.mjs'
];

export const IMPLEMENTATION_METRICS = Object.freeze({
  packageCount: ORGANISM_LAYERS.flatMap((layer) => layer.items).filter((item) => item.kind === 'sdk').length,
  protocolCount: PROTOCOLS.length,
  canisterCount: 5,
  languageSurfaces: ['JavaScript', 'Motoko', 'Rust', 'Go'],
  validationCommands: [...VALIDATION_COMMANDS],
  verification: [
    'core-sdk verification',
    'protocol integration',
    'rust tests + demo',
    'math-layer verification',
    'enterprise/runtime demos',
    'virtual-chip verification',
    'production-app execution',
    'atlas worker route checks',
    'parralax infrastructure validation'
  ]
});

export function computeEmergence(n, beat) {
  return parseFloat((Math.log(Math.max(1, n * beat)) * PHI_INV).toFixed(4));
}
