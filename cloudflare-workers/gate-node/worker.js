/**
 * GATE-NODE — Protocol Entry Point
 *
 * Designation:  RSHIP-AIS-GN-001
 * Latin:        porta-nodus (gate node)
 * 
 * THE OUTER MEMBRANE:
 *   - Minimal compute (what Cloudflare bills)
 *   - Terminate TLS
 *   - Classify roughly (pattern matching, not AI)
 *   - Route to the correct cache-organism or Worker
 *
 * This is intentionally THIN and DUMB.
 * All intelligence lives in the cache-organisms.
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS — Minimal overhead
// ═══════════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const DESIGNATION = 'RSHIP-AIS-GN-001';

// Classification patterns (cheap string matching)
const HOSTILE_PATTERNS = [
  '.git', '.env', 'server-status', 'wp-admin', 'wp-includes',
  'xmlrpc', 'phpmyadmin', '.htaccess', 'wp-config', 'wp-login',
  '/admin', '/login', '/backup', '/.aws', '/.ssh'
];

const SCANNER_UA_PATTERNS = [
  'leakix', 'l9scan', 'nuclei', 'sqlmap', 'nikto', 'nmap',
  'masscan', 'zmap', 'censys', 'shodan', 'zgrab', 'gobuster'
];

const AI_UA_PATTERNS = [
  'claude', 'anthropic', 'gpt', 'openai', 'googlebot', 'bingbot',
  'facebookbot', 'twitterbot', 'slackbot', 'discordbot'
];

// Route destinations
const ROUTES = {
  ADVERSARY_LAB: 'adversary-lab',
  KNOWLEDGE_REALM: 'knowledge-realm',
  SHADOW_DECRYPTOR: 'shadow-decryptor',
  CACHE_ORGANISM: 'cache-organism',
  HONEYPOT: 'honeypot',
  API_NODE: 'api-node',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION — Cheap pattern matching (NOT AI)
// ═══════════════════════════════════════════════════════════════════════════════

function classifyFast(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const country = request.cf?.country || 'XX';
  const isTor = country === 'T1';

  // === HOSTILE CHECK (path probing) ===
  for (const pattern of HOSTILE_PATTERNS) {
    if (path.includes(pattern)) {
      return {
        type: 'HOSTILE',
        route: ROUTES.ADVERSARY_LAB,
        reason: `hostile_path:${pattern}`,
        ip, country, path
      };
    }
  }

  // === SCANNER CHECK (UA signatures) ===
  for (const pattern of SCANNER_UA_PATTERNS) {
    if (ua.includes(pattern)) {
      return {
        type: 'SCANNER',
        route: ROUTES.ADVERSARY_LAB,
        reason: `scanner_ua:${pattern}`,
        ip, country, path
      };
    }
  }

  // === TOR CHECK ===
  if (isTor) {
    return {
      type: 'TOR',
      route: ROUTES.SHADOW_DECRYPTOR,
      reason: 'tor_exit',
      ip, country, path
    };
  }

  // === AI VISITOR CHECK ===
  for (const pattern of AI_UA_PATTERNS) {
    if (ua.includes(pattern)) {
      return {
        type: 'AI_VISITOR',
        route: ROUTES.KNOWLEDGE_REALM,
        reason: `ai_signature:${pattern}`,
        ip, country, path
      };
    }
  }

  // === API ROUTE CHECK ===
  if (path.startsWith('/api/')) {
    return {
      type: 'API_REQUEST',
      route: ROUTES.API_NODE,
      reason: 'api_path',
      ip, country, path
    };
  }

  // === HONEYPOT ROUTE CHECK ===
  if (path.startsWith('/admin') || path.startsWith('/portal') || path.startsWith('/login')) {
    return {
      type: 'HONEYPOT_TARGET',
      route: ROUTES.HONEYPOT,
      reason: 'honeypot_path',
      ip, country, path
    };
  }

  // === DEFAULT: COOPERATIVE ===
  return {
    type: 'COOPERATIVE',
    route: ROUTES.CACHE_ORGANISM,
    reason: 'default',
    ip, country, path
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING — Hand off to correct destination
// ═══════════════════════════════════════════════════════════════════════════════

async function routeToDestination(classification, request, env) {
  const headers = {
    'X-Gate-Node': 'true',
    'X-Classification': classification.type,
    'X-Route': classification.route,
    'X-Reason': classification.reason,
  };

  // If we have service bindings, route to them
  switch (classification.route) {
    case ROUTES.CACHE_ORGANISM:
      if (env.CACHE_ORGANISM) {
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: new Headers([...request.headers.entries(), ...Object.entries(headers)]),
          body: request.body,
        });
        return env.CACHE_ORGANISM.fetch(newRequest);
      }
      break;

    case ROUTES.ADVERSARY_LAB:
      // Log hostile traffic and return minimal response
      return new Response(JSON.stringify({
        status: 'BLOCKED',
        classification: classification.type,
        gate: DESIGNATION,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...headers },
      });

    case ROUTES.KNOWLEDGE_REALM:
      if (env.KNOWLEDGE_REALM) {
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: new Headers([...request.headers.entries(), ...Object.entries(headers)]),
          body: request.body,
        });
        return env.KNOWLEDGE_REALM.fetch(newRequest);
      }
      break;

    case ROUTES.SHADOW_DECRYPTOR:
      // Tor traffic - acknowledge and process
      return new Response(JSON.stringify({
        status: 'PROCESSING',
        classification: classification.type,
        message: 'Anonymized traffic detected. Routing to Shadow Decryptor.',
        gate: DESIGNATION,
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json', ...headers },
      });

    case ROUTES.API_NODE:
      if (env.API_NODE) {
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: new Headers([...request.headers.entries(), ...Object.entries(headers)]),
          body: request.body,
        });
        return env.API_NODE.fetch(newRequest);
      }
      break;

    case ROUTES.HONEYPOT:
      // Fake admin/login response
      return new Response(buildHoneypotHTML(), {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...headers },
      });
  }

  // Default: return welcome response
  return new Response(JSON.stringify({
    status: 'OK',
    message: 'Welcome to RSHIP Enterprise OS Intelligence',
    classification: classification.type,
    route: classification.route,
    gate: DESIGNATION,
    version: VERSION,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HONEYPOT HTML — Fake admin panel
// ═══════════════════════════════════════════════════════════════════════════════

function buildHoneypotHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Admin Login</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 320px; }
    h2 { margin: 0 0 20px; color: #333; }
    input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 16px; }
    button:hover { background: #0056b3; }
  </style>
</head>
<body>
  <div class="login-box">
    <h2>Admin Panel</h2>
    <form method="POST" action="/admin/login">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD HTML
// ═══════════════════════════════════════════════════════════════════════════════

function buildDashboardHTML(stats) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GATE-NODE — Protocol Entry Point</title>
<meta http-equiv="refresh" content="10">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#02050f;--card:#0a0f1a;--border:#1a2535;--gold:#ffd700;--cyan:#00d4ff;--green:#00ff88;--text:#e2ecf5;--dim:#6b7a8f}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;min-height:100vh;padding:40px}
.container{max-width:800px;margin:0 auto}
h1{font-size:1.8rem;color:var(--gold);margin-bottom:8px;display:flex;align-items:center;gap:12px}
h1 span{font-size:2rem}
.subtitle{color:var(--dim);margin-bottom:40px;font-size:0.85rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px;margin-bottom:20px}
.card h3{font-size:0.85rem;color:var(--cyan);margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em}
pre{font-size:0.75rem;color:var(--dim);line-height:1.6}
.highlight{color:var(--cyan)}
.gold{color:var(--gold)}
.green{color:var(--green)}
.status-bar{display:flex;gap:24px;margin-bottom:24px;font-size:0.8rem}
.status-item{display:flex;align-items:center;gap:8px}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
</style>
</head>
<body>
<div class="container">
  <h1><span>🜲</span> GATE-NODE</h1>
  <p class="subtitle">Protocol Entry Point · Outer Membrane · ${DESIGNATION}</p>

  <div class="status-bar">
    <div class="status-item"><span class="status-dot"></span> Membrane Active</div>
    <div class="status-item">v${VERSION}</div>
  </div>

  <div class="card">
    <h3>Architecture</h3>
    <pre>
<span class="gold">GATE-NODE</span> (Outer Membrane)
├─ Terminate TLS
├─ Classify request (cheap pattern matching)
├─ Route to destination
└─ <span class="green">MINIMAL BILLED COMPUTE</span>

Classification → Route Mapping:
  <span class="gold">HOSTILE</span>       → adversary-lab
  <span class="gold">SCANNER</span>      → adversary-lab
  <span class="cyan">TOR</span>          → shadow-decryptor
  <span class="green">AI_VISITOR</span>   → knowledge-realm
  <span class="cyan">API_REQUEST</span>  → api-node
  <span class="gold">HONEYPOT</span>     → honeypot
  <span class="green">COOPERATIVE</span>  → cache-organism
    </pre>
  </div>

  <div class="card">
    <h3>Design Principles</h3>
    <pre>
1. <span class="gold">THIN</span>: Minimal logic in the membrane
2. <span class="gold">DUMB</span>: Pattern matching, not AI inference
3. <span class="gold">CHEAP</span>: Minimize billed compute
4. <span class="green">FAST</span>: Route and hand off quickly

Intelligence lives in:
  → Cache organisms (KV + Cache API)
  → Learned patterns (distributed memory)
  → Local agents at the edge
    </pre>
  </div>
</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Dashboard route
    if (path === '/' && request.method === 'GET') {
      const accept = request.headers.get('accept') || '';
      if (accept.includes('text/html')) {
        return new Response(buildDashboardHTML({}), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    // API status route
    if (path === '/api/status') {
      return new Response(JSON.stringify({
        gate: DESIGNATION,
        version: VERSION,
        status: 'ACTIVE',
        role: 'Protocol Entry Point — Outer Membrane',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === MEMBRANE LOGIC: Classify and Route ===
    
    // 1. Classify the request (cheap pattern matching)
    const classification = classifyFast(request);

    // 2. Log classification (async, non-blocking)
    if (env.GATE_LOGS) {
      ctx.waitUntil(
        env.GATE_LOGS.put(
          `log:${Date.now()}:${classification.ip}`,
          JSON.stringify(classification),
          { expirationTtl: 86400 }
        ).catch(() => {})
      );
    }

    // 3. Route to destination
    return routeToDestination(classification, request, env);
  },
};
