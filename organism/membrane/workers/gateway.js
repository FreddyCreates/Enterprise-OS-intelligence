/**
 * WORKER 1 — MEMBRANE GATEWAY (Sovereign Organ)
 *
 * Designation:  ORGANISM-MEMBRANE-001
 * Role:         All public traffic, routing, probe classification, identity resolution
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This is the collapsed gateway — all public-facing logic in one sovereign worker.
 * Everything else (workflows, brain, state) lives in other substrates.
 *
 * Routes:
 *   ALL  /*           → Intelligent routing to organs
 *   GET  /health      → Membrane health check
 *   GET  /status      → Organ network status
 *   POST /classify    → Probe classification (invokes julia.classify_probe)
 *   POST /resolve     → Identity resolution (invokes icp.ssn.get)
 *
 * Cross-Substrate Calls:
 *   → julia.classify_probe   (Brain organ)
 *   → icp.ssn.get            (Identity organ)
 *   → workflow.start          (Reflex organ)
 *   → state.append_log        (State organ)
 *   → surfaces.deploy_honeypot (Surfaces organ)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

'use strict';

const PHI = 1.618033988749895;
const VERSION = '1.0.0';
const ORGAN = 'membrane-gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE TABLE — Maps paths to organ destinations
// ═══════════════════════════════════════════════════════════════════════════════

const ORGAN_ROUTES = {
  '/api/identity':  'identity',
  '/api/brain':     'brain',
  '/api/state':     'state',
  '/api/workflow':   'reflex',
  '/api/surfaces':  'surfaces',
  '/health':        'self',
  '/status':        'self',
  '/classify':      'brain',
  '/resolve':       'identity',
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROBE CLASSIFICATION — Edge-level fast classification
// ═══════════════════════════════════════════════════════════════════════════════

function classifyProbeEdge(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const path = new URL(request.url).pathname;

  // Known scanner signatures
  const SCANNERS = ['nuclei', 'sqlmap', 'nikto', 'nmap', 'masscan', 'leakix', 'censys'];
  for (const scanner of SCANNERS) {
    if (ua.includes(scanner)) return { classification: 'scanner', confidence: 0.95, action: 'redirect_maze' };
  }

  // Suspicious paths
  const SUSPICIOUS_PATHS = ['/wp-admin', '/phpmyadmin', '/.env', '/.git', '/wp-login', '/actuator'];
  for (const sp of SUSPICIOUS_PATHS) {
    if (path.startsWith(sp)) return { classification: 'scanner', confidence: 0.85, action: 'honeypot' };
  }

  // Bot detection
  if (!ua || ua.includes('bot') || ua.includes('crawler')) {
    return { classification: 'bot', confidence: 0.7, action: 'challenge' };
  }

  return { classification: 'benign', confidence: 0.6, action: 'allow' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLICY ENGINE — Edge policy enforcement
// ═══════════════════════════════════════════════════════════════════════════════

function applyPolicy(classification, env) {
  const policies = {
    scanner:  { action: 'redirect_maze', response_code: 200, delay_ms: 500 },
    bot:      { action: 'challenge', response_code: 403, delay_ms: 0 },
    attacker: { action: 'honeypot', response_code: 200, delay_ms: 1000 },
    benign:   { action: 'allow', response_code: null, delay_ms: 0 },
    ai_agent: { action: 'allow', response_code: null, delay_ms: 0 },
  };
  return policies[classification.classification] || policies.benign;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check — fast path
    if (path === '/health') {
      return Response.json({
        organ: ORGAN,
        version: VERSION,
        status: 'alive',
        phi: PHI,
        timestamp: Date.now()
      });
    }

    // Status — organ network overview
    if (path === '/status') {
      return Response.json({
        organ: ORGAN,
        version: VERSION,
        architecture: 'door-4-five-organ',
        organs: {
          membrane: { status: 'active', substrate: 'cloudflare-workers' },
          identity: { status: 'active', substrate: 'icp-canisters' },
          brain:    { status: 'active', substrate: 'julia-wasm-bridge' },
          reflex:   { status: 'active', substrate: 'cloudflare-workflows' },
          state:    { status: 'active', substrate: 'icp+durable-objects' },
          surfaces: { status: 'active', substrate: 'cloudflare-workers' }
        },
        cross_substrate: [
          'cloudflare->julia', 'julia->icp', 'icp->cloudflare',
          'cloudflare->icp', 'icp->julia'
        ],
        timestamp: Date.now()
      });
    }

    // Classify probe
    const probe = classifyProbeEdge(request);
    const policy = applyPolicy(probe, env);

    // If probe should be redirected to surfaces
    if (policy.action === 'redirect_maze' || policy.action === 'honeypot') {
      // Log to state organ
      ctx.waitUntil(logProbeEvent(env, request, probe));

      if (env.SYNTHETIC_SURFACES) {
        return env.SYNTHETIC_SURFACES.fetch(request);
      }
    }

    // Route to appropriate organ
    const destination = ORGAN_ROUTES[path];
    if (destination === 'identity' && env.INTERNAL_SERVICES) {
      return env.INTERNAL_SERVICES.fetch(request);
    }
    if (destination === 'brain' && env.INTERNAL_SERVICES) {
      return env.INTERNAL_SERVICES.fetch(request);
    }

    // Default: serve or proxy
    return new Response(JSON.stringify({
      organ: ORGAN,
      message: 'Membrane Gateway — Door 4 Architecture',
      classification: probe,
      policy: policy.action,
      path: path,
      phi: PHI
    }), {
      headers: { 'Content-Type': 'application/json', 'X-Organ': ORGAN, 'X-Architecture': 'door-4' }
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function logProbeEvent(env, request, classification) {
  // This would call state.append_log MCP tool
  // For now, log to KV if available
  if (env.ROUTE_CACHE) {
    const key = `probe:${Date.now()}:${classification.classification}`;
    await env.ROUTE_CACHE.put(key, JSON.stringify({
      ip: request.headers.get('cf-connecting-ip'),
      path: new URL(request.url).pathname,
      classification: classification,
      timestamp: Date.now()
    }), { expirationTtl: 86400 });
  }
}
