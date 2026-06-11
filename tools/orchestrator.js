/**
 * RSHIP Enterprise OS Intelligence — Root Orchestrator Worker
 * ═══════════════════════════════════════════════════════════════
 * 
 * The nerve center. This worker:
 *   1. Health-checks all bound services
 *   2. Validates binding connectivity
 *   3. Dispatches cross-worker commands
 *   4. Exposes the full system topology
 * 
 * Bound via root wrangler.toml → service bindings to all workers.
 * 
 * Endpoints:
 *   GET /               → System status + topology
 *   GET /health         → Full health check (pings all workers)
 *   GET /bindings       → Binding validation report
 *   GET /topology       → Service graph
 *   POST /dispatch      → Cross-worker command dispatch
 */

const PHI = 1.618033988749895;
const VERSION = '5.1.0';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE REGISTRY — All workers in the organism
// ═══════════════════════════════════════════════════════════════════════════════

const SERVICE_REGISTRY = {
  CEREBRUM:       { name: 'Cerebrum',       role: 'Master Intelligence',     latin: 'Brain' },
  AGENS:          { name: 'Agens',          role: 'Agent Services',          latin: 'One who acts' },
  ANIMUS:         { name: 'Animus',         role: 'Soul/Mind Interface',     latin: 'Spirit/Mind' },
  NEXUS:          { name: 'Nexus',          role: 'Supply Chain Router',     latin: 'Connection' },
  VIGIL:          { name: 'Vigil',          role: 'Security Sentinel',       latin: 'Watchman' },
  CURSOR:         { name: 'Cursor',         role: 'Message Runner',          latin: 'Runner' },
  NOVA:           { name: 'Nova',           role: 'Live-Fire AI Range',      latin: 'New Star' },
  EMAILAI_MESH:   { name: 'EmailAI Mesh',   role: 'Sovereign Email Intel',   latin: 'Mesh' },
  GATE_NODE:      { name: 'Gate Node',      role: 'Outer Membrane Router',   latin: 'Gate' },
  CACHE_ORGANISM: { name: 'Cache Organism', role: 'Inner Intelligence Cache', latin: 'Organism' },
};

// Expected bindings for this orchestrator
const EXPECTED_BINDINGS = {
  AI:                    'Workers AI',
  ORCHESTRATOR_STATE:    'KV Namespace',
  HEALTH_CACHE:          'KV Namespace',
  CORE_DB:               'D1 Database',
  ASSETS:                'R2 Bucket',
  DISPATCH_QUEUE:        'Queue Producer',
  ORCHESTRATOR_ANALYTICS: 'Analytics Engine',
  ...Object.fromEntries(Object.keys(SERVICE_REGISTRY).map(k => [k, 'Service Binding'])),
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK — Ping all bound services
// ═══════════════════════════════════════════════════════════════════════════════

async function healthCheckService(env, binding) {
  const service = env[binding];
  if (!service) return { binding, status: 'UNBOUND', latency: null };

  const start = Date.now();
  try {
    const response = await service.fetch(new Request('https://internal/health', {
      method: 'GET',
      headers: { 'X-Orchestrator': 'health-check' },
    }));
    const latency = Date.now() - start;
    return {
      binding,
      status: response.ok ? 'HEALTHY' : `ERROR_${response.status}`,
      latency,
      statusCode: response.status,
    };
  } catch (e) {
    return {
      binding,
      status: 'UNREACHABLE',
      latency: Date.now() - start,
      error: e.message,
    };
  }
}

async function fullHealthCheck(env) {
  const checks = await Promise.allSettled(
    Object.keys(SERVICE_REGISTRY).map(binding => healthCheckService(env, binding))
  );

  const results = checks.map(c => c.status === 'fulfilled' ? c.value : { status: 'CHECK_FAILED' });
  const healthy = results.filter(r => r.status === 'HEALTHY').length;
  const total = results.length;

  return {
    organism: 'RSHIP-ORCHESTRATOR',
    version: VERSION,
    overallStatus: healthy === total ? 'ALL_HEALTHY' : healthy > 0 ? 'PARTIAL' : 'CRITICAL',
    summary: `${healthy}/${total} services healthy`,
    services: results,
    checkedAt: new Date().toISOString(),
    phi: PHI,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINDING VALIDATOR — Check what's connected vs what's expected
// ═══════════════════════════════════════════════════════════════════════════════

function validateBindings(env) {
  const report = {
    organism: 'RSHIP-BINDING-VALIDATOR',
    version: VERSION,
    status: 'VALIDATING',
    bindings: {},
    summary: { bound: 0, unbound: 0, total: 0 },
  };

  for (const [binding, expectedType] of Object.entries(EXPECTED_BINDINGS)) {
    const exists = !!env[binding];
    report.bindings[binding] = {
      type: expectedType,
      bound: exists,
      status: exists ? 'CONNECTED' : 'DISCONNECTED',
    };
    report.summary.total++;
    if (exists) report.summary.bound++;
    else report.summary.unbound++;
  }

  report.status = report.summary.unbound === 0 ? 'ALL_BOUND' : 'INCOMPLETE';
  report.validatedAt = new Date().toISOString();
  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOPOLOGY — Full service graph
// ═══════════════════════════════════════════════════════════════════════════════

function getTopology(env) {
  return {
    organism: 'RSHIP-TOPOLOGY',
    version: VERSION,
    architecture: {
      layers: [
        { name: 'OUTER MEMBRANE', components: ['Gate Node', 'Pages Middleware'], purpose: 'Cheap classification + routing' },
        { name: 'INNER ORGANISM', components: ['Cache Organism', 'API Cache'], purpose: 'Intelligent cache + learning' },
        { name: 'AGENT LAYER', components: ['Cerebrum', 'Agens', 'Animus', 'Nexus', 'Vigil', 'Cursor'], purpose: 'AI agent compute' },
        { name: 'SPECIALIST', components: ['Nova', 'EmailAI Mesh'], purpose: 'Domain-specific intelligence' },
        { name: 'ORCHESTRATOR', components: ['Root Worker'], purpose: 'Health, validation, dispatch' },
      ],
    },
    services: Object.entries(SERVICE_REGISTRY).map(([binding, meta]) => ({
      binding,
      ...meta,
      connected: !!env[binding],
    })),
    infrastructure: {
      kv_namespaces: ['ORCHESTRATOR_STATE', 'HEALTH_CACHE'].map(b => ({ binding: b, connected: !!env[b] })),
      d1_databases: [{ binding: 'CORE_DB', connected: !!env.CORE_DB }],
      r2_buckets: [{ binding: 'ASSETS', connected: !!env.ASSETS }],
      queues: [{ binding: 'DISPATCH_QUEUE', connected: !!env.DISPATCH_QUEUE }],
      ai: { binding: 'AI', connected: !!env.AI },
    },
    generatedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH — Cross-worker command routing
// ═══════════════════════════════════════════════════════════════════════════════

async function dispatchCommand(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { target, path, method, payload } = body;
  if (!target || !path) {
    return new Response(JSON.stringify({
      error: 'Missing required fields: target, path',
      example: { target: 'CEREBRUM', path: '/status', method: 'GET' },
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const service = env[target];
  if (!service) {
    return new Response(JSON.stringify({
      error: `Service "${target}" not bound`,
      available: Object.keys(SERVICE_REGISTRY).filter(k => !!env[k]),
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const forwardRequest = new Request(`https://internal${path}`, {
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Orchestrator': 'dispatch' },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const response = await service.fetch(forwardRequest);
    const data = await response.text();

    return new Response(JSON.stringify({
      dispatched: true,
      target,
      path,
      status: response.status,
      response: tryParseJSON(data),
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Dispatch failed',
      target,
      message: e.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return text; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY — Log to Analytics Engine
// ═══════════════════════════════════════════════════════════════════════════════

function logTelemetry(env, event) {
  if (!env.ORCHESTRATOR_ANALYTICS) return;
  try {
    env.ORCHESTRATOR_ANALYTICS.writeDataPoint({
      blobs: [event.type || 'request', event.path || '/'],
      doubles: [event.latency || 0, event.status || 200],
      indexes: [event.type || 'request'],
    });
  } catch {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const start = Date.now();

    let response;

    switch (path) {
      case '/':
      case '/status':
        response = new Response(JSON.stringify({
          organism: 'RSHIP-ENTERPRISE-OS',
          designation: env.DESIGNATION || 'RSHIP-ORCHESTRATOR-001',
          version: VERSION,
          status: 'ACTIVE',
          role: 'Root Orchestrator — Health, Validation, Dispatch',
          endpoints: {
            '/':         'System status',
            '/health':   'Full health check (pings all services)',
            '/bindings': 'Binding validation report',
            '/topology': 'Service graph + architecture',
            '/dispatch': 'POST — Cross-worker command dispatch',
          },
          services: Object.keys(SERVICE_REGISTRY).length,
          timestamp: new Date().toISOString(),
          phi: PHI,
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
        break;

      case '/health':
        const health = await fullHealthCheck(env);
        response = new Response(JSON.stringify(health, null, 2), {
          status: health.overallStatus === 'CRITICAL' ? 503 : 200,
          headers: { 'Content-Type': 'application/json' },
        });
        break;

      case '/bindings':
        const bindingReport = validateBindings(env);
        response = new Response(JSON.stringify(bindingReport, null, 2), {
          status: bindingReport.status === 'ALL_BOUND' ? 200 : 503,
          headers: { 'Content-Type': 'application/json' },
        });
        break;

      case '/topology':
        response = new Response(JSON.stringify(getTopology(env), null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
        break;

      case '/dispatch':
        if (request.method !== 'POST') {
          response = new Response(JSON.stringify({ error: 'POST only', usage: { target: 'CEREBRUM', path: '/status' } }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          response = await dispatchCommand(env, request);
        }
        break;

      default:
        response = new Response(JSON.stringify({
          error: 'Unknown endpoint',
          path,
          available: ['/', '/health', '/bindings', '/topology', '/dispatch'],
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Telemetry
    logTelemetry(env, { type: 'request', path, latency: Date.now() - start, status: response.status });

    return response;
  },
};
