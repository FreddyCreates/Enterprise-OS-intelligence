/**
 * GATE-NODE — RSHIP Intelligent Cache Membrane
 *
 * Designation:  RSHIP-MEM-GN-001
 * Latin:        ianua (gate/door)
 * Product:      Outer membrane router — thin, cheap, guardian
 *               Routes requests to Cache-Organisms, protects the inner intelligence
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                     GATE-NODE (Outer Membrane)                  │
 *   │  • Fast routing decisions (no AI compute)                       │
 *   │  • Pattern matching from KV                                     │
 *   │  • Threat filtering                                             │
 *   │  • Request classification                                       │
 *   └─────────────────────────┬───────────────────────────────────────┘
 *                             │
 *                             ▼
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                  CACHE-ORGANISM (Inner Intelligence)            │
 *   │  • AI-powered response generation                               │
 *   │  • Semantic understanding                                       │
 *   │  • Learning and adaptation                                      │
 *   │  • Distributed memory                                           │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Routes:
 *   GET  /              → Membrane status dashboard
 *   GET  /health        → Health check (fast path)
 *   POST /route         → Route request to organism
 *   GET  /patterns      → Active routing patterns
 *   *    /*             → Intelligent routing to organisms
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const GOLDEN_ANGLE = 2.399963229728653;

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING PATTERNS — Fast path decisions
// ═══════════════════════════════════════════════════════════════════════════════

const ROUTE_PATTERNS = {
  // Cached response patterns (no organism needed)
  static: [
    /^\/favicon\.ico$/,
    /^\/robots\.txt$/,
    /^\/_assets\//,
    /^\/static\//,
  ],
  
  // High-priority organism routes
  intelligence: [
    /^\/api\/ai\//,
    /^\/api\/intelligence\//,
    /^\/api\/analyze\//,
  ],
  
  // Learning patterns (track for adaptation)
  learning: [
    /^\/api\/feedback\//,
    /^\/api\/learn\//,
  ],
};

// Threat patterns to block at the membrane
const THREAT_PATTERNS = [
  /\.env$/,
  /\.git\//,
  /wp-admin/,
  /wp-login/,
  /\.php$/,
  /xmlrpc\.php/,
  /eval\(/,
  /base64_decode/,
];

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBRANE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function computeRouteHash(path, method) {
  let h = 0;
  const s = `${method}:${path}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(12, '0');
}

function classifyRequest(url, method) {
  const path = url.pathname;
  
  // Check threat patterns first (fast rejection)
  for (const pattern of THREAT_PATTERNS) {
    if (pattern.test(path)) {
      return { type: 'threat', pattern: pattern.toString() };
    }
  }
  
  // Check static patterns (bypass organism)
  for (const pattern of ROUTE_PATTERNS.static) {
    if (pattern.test(path)) {
      return { type: 'static', cached: true };
    }
  }
  
  // Check intelligence patterns (priority routing)
  for (const pattern of ROUTE_PATTERNS.intelligence) {
    if (pattern.test(path)) {
      return { type: 'intelligence', priority: 'high' };
    }
  }
  
  // Check learning patterns
  for (const pattern of ROUTE_PATTERNS.learning) {
    if (pattern.test(path)) {
      return { type: 'learning', track: true };
    }
  }
  
  // Default: route to organism for intelligent handling
  return { type: 'organism', adaptive: true };
}

async function getOrCreateSession(request, env) {
  const sessionId = request.headers.get('X-Session-ID') || 
                    request.headers.get('CF-Ray') ||
                    crypto.randomUUID();
  
  let session = await env.SESSION_STATE?.get(sessionId, { type: 'json' });
  
  if (!session) {
    session = {
      id: sessionId,
      created: Date.now(),
      requests: 0,
      patterns: [],
      lastSeen: Date.now(),
    };
  }
  
  session.requests++;
  session.lastSeen = Date.now();
  
  // Store session asynchronously (don't block)
  if (env.SESSION_STATE) {
    env.SESSION_STATE.put(sessionId, JSON.stringify(session), { expirationTtl: 3600 });
  }
  
  return session;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildDashboard(env, beat) {
  const uptime = Math.floor(beat / 1000);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GATE-NODE — RSHIP Intelligent Cache Membrane</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#02050f;--fg:#c8d8f8;--dim:#445566;--card:#060d1a;--border:#0d2030;--accent:#00ff88}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden;min-height:100vh}
.membrane{max-width:1200px;margin:0 auto;padding:48px}
.header{text-align:center;margin-bottom:48px}
.title{font-size:2.5rem;color:var(--accent);letter-spacing:.2em;margin-bottom:8px}
.subtitle{color:var(--dim);font-size:.9rem}
.architecture{display:grid;gap:24px;margin-bottom:48px}
.layer{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px}
.layer-title{color:var(--accent);font-size:1.1rem;margin-bottom:12px;display:flex;align-items:center;gap:12px}
.layer-title::before{content:'◎';font-size:1.5rem}
.layer-desc{color:var(--dim);font-size:.85rem;line-height:1.6}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:48px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:20px;text-align:center}
.stat-value{font-size:2rem;color:var(--accent);margin-bottom:4px}
.stat-label{color:var(--dim);font-size:.75rem;text-transform:uppercase;letter-spacing:.1em}
.flow{text-align:center;color:var(--dim);font-size:.9rem;margin:24px 0}
.flow-arrow{color:var(--accent);font-size:2rem;display:block;margin:12px 0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.live{animation:pulse 2s ease-in-out infinite}
</style>
</head>
<body>
<div class="membrane">
  <header class="header">
    <h1 class="title">GATE-NODE</h1>
    <p class="subtitle">Outer Membrane Router · v${env.VERSION}</p>
  </header>

  <div class="architecture">
    <div class="layer">
      <h2 class="layer-title">Outer Membrane (This Layer)</h2>
      <p class="layer-desc">
        Fast routing decisions without AI compute. Pattern matching from KV cache.
        Threat filtering at the edge. Request classification for intelligent routing.
        Every request passes through here — thin, cheap, guardian.
      </p>
    </div>
    
    <div class="flow">
      <span class="flow-arrow live">↓</span>
      Routes to Cache-Organisms
    </div>
    
    <div class="layer">
      <h2 class="layer-title">Inner Intelligence (Cache-Organisms)</h2>
      <p class="layer-desc">
        AI-powered response generation. Semantic understanding of requests.
        Learning and adaptation from patterns. Distributed memory across edge.
        The organism's "permanence" lives here — learned patterns, local agents.
      </p>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value live">${PHI.toFixed(6)}</div>
      <div class="stat-label">Golden Ratio (φ)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${uptime}s</div>
      <div class="stat-label">Membrane Uptime</div>
    </div>
    <div class="stat">
      <div class="stat-value">${ROUTE_PATTERNS.static.length + ROUTE_PATTERNS.intelligence.length + ROUTE_PATTERNS.learning.length}</div>
      <div class="stat-label">Active Patterns</div>
    </div>
    <div class="stat">
      <div class="stat-value">${THREAT_PATTERNS.length}</div>
      <div class="stat-label">Threat Filters</div>
    </div>
  </div>

  <footer style="text-align:center;color:var(--dim);font-size:.75rem">
    RSHIP-MEM-GN-001 · ${env.DESIGNATION} · © 2026 RSHIP AGI Systems
  </footer>
</div>
</body>
</html>`;
}

function buildJSON(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Powered-By': 'RSHIP-Gate-Node',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const beat = Date.now();
    
    // Fast path: health check
    if (path === '/health') {
      return buildJSON({
        status: 'healthy',
        layer: 'gate-node',
        designation: env.DESIGNATION,
        version: env.VERSION,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Dashboard
    if (path === '/' && method === 'GET') {
      return new Response(buildDashboard(env, beat), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    // Classify the request
    const classification = classifyRequest(url, method);
    
    // Track request pattern for analytics
    if (env.GATE_ANALYTICS) {
      ctx.waitUntil(
        env.GATE_ANALYTICS.writeDataPoint({
          blobs: [path, method, classification.type],
          doubles: [beat, classification.priority === 'high' ? 1 : 0],
          indexes: [computeRouteHash(path, method)],
        })
      );
    }
    
    // Handle threat patterns
    if (classification.type === 'threat') {
      return new Response(JSON.stringify({
        error: 'blocked',
        reason: 'threat_pattern_detected',
        timestamp: new Date().toISOString(),
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Patterns endpoint
    if (path === '/patterns') {
      return buildJSON({
        static: ROUTE_PATTERNS.static.length,
        intelligence: ROUTE_PATTERNS.intelligence.length,
        learning: ROUTE_PATTERNS.learning.length,
        threats: THREAT_PATTERNS.length,
      });
    }
    
    // Route to Cache-Organism for intelligent handling
    if (env.CACHE_ORGANISM) {
      // Add routing metadata
      const routingHeaders = new Headers(request.headers);
      routingHeaders.set('X-Gate-Node', env.DESIGNATION);
      routingHeaders.set('X-Route-Type', classification.type);
      routingHeaders.set('X-Route-Hash', computeRouteHash(path, method));
      routingHeaders.set('X-Request-Beat', beat.toString());
      
      // Forward to Cache-Organism
      const organismRequest = new Request(request.url, {
        method: request.method,
        headers: routingHeaders,
        body: request.body,
      });
      
      return env.CACHE_ORGANISM.fetch(organismRequest);
    }
    
    // Fallback: return classification info
    const session = await getOrCreateSession(request, env);
    
    return buildJSON({
      layer: 'gate-node',
      designation: env.DESIGNATION,
      version: env.VERSION,
      classification,
      session: {
        id: session.id,
        requests: session.requests,
      },
      route: {
        path,
        method,
        hash: computeRouteHash(path, method),
      },
      timestamp: new Date().toISOString(),
      note: 'Request classified. Cache-Organism binding not configured.',
    });
  },
};
