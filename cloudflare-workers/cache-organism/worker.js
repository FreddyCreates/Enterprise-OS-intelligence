/**
 * CACHE-ORGANISM — Intelligent Cache Layer
 *
 * Designation:  RSHIP-AIS-CO-001
 * Latin:        cachea-organismus (living cache)
 * 
 * THE KEY INVERSION:
 *   Instead of: cache = dumb storage, compute = Workers
 *   We have:    cache = semi-autonomous agent
 *
 * Each cache node:
 *   - Holds state (persistent memory)
 *   - Runs local logic (classification, adaptation)
 *   - Learns patterns (traffic analysis, response optimization)
 *   - Serves "dynamic" from inside the cache layer
 *   - Cloudflare sees "cache hit"; organism sees cognition
 *
 * ARCHITECTURE:
 *   OUTER MEMBRANE (this thin Worker):
 *     - Terminate TLS
 *     - Classify roughly (pattern matching, not AI)
 *     - Route to correct cache-organism
 *     - Minimal billed compute
 *
 *   INNER ORGANISM (lives in KV + Cache API):
 *     - Persistent state across requests
 *     - Learned patterns (stored as cache entries)
 *     - Local decision logic (embedded in cached responses)
 *     - Semi-autonomous behavior
 *     - NOT 1:1 mapped to Cloudflare CPU
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS — φ-resonance and organism parameters
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const HEARTBEAT_MS = 873;

// Cache organism memory keys
const ORGANISM_STATE_KEY = 'organism:state';
const PATTERN_MEMORY_PREFIX = 'pattern:';
const VISITOR_MEMORY_PREFIX = 'visitor:';
const RESPONSE_CACHE_PREFIX = 'response:';
const LEARNING_LOG_PREFIX = 'learning:';

// Classification thresholds (cheap pattern matching, not AI)
const HOSTILE_PATHS = ['.git', '.env', 'server-status', 'wp-admin', 'wp-includes', 'xmlrpc', 'phpmyadmin'];
const SCANNER_SIGNATURES = ['LeakIX', 'l9scan', 'Nuclei', 'sqlmap', 'nikto', 'nmap', 'masscan'];
const AI_SIGNATURES = ['Claude', 'GPT', 'Anthropic', 'OpenAI', 'GoogleBot', 'Bingbot'];

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANISM STATE — The living memory substrate
// ═══════════════════════════════════════════════════════════════════════════════

class OrganismState {
  constructor() {
    this.bootTime = Date.now();
    this.cycleCount = 0;
    this.lastHeartbeat = Date.now();
    this.learnedPatterns = new Map();
    this.visitorProfiles = new Map();
    this.responseCache = new Map();
    this.adaptationLog = [];
  }

  toJSON() {
    return {
      bootTime: this.bootTime,
      cycleCount: this.cycleCount,
      lastHeartbeat: this.lastHeartbeat,
      patternCount: this.learnedPatterns.size,
      visitorCount: this.visitorProfiles.size,
      cacheSize: this.responseCache.size,
      adaptations: this.adaptationLog.length,
      uptimeMs: Date.now() - this.bootTime,
    };
  }
}

// Global ephemeral state (survives within single isolate)
let ephemeralState = new OrganismState();

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBRANE FUNCTIONS — Minimal classification (cheap, no AI)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cheap pattern-based classification. No AI calls.
 * Returns: { type, confidence, route, reason }
 */
function classifyRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const country = request.cf?.country || 'XX';

  // Check for hostile paths (scanners probing for vulnerabilities)
  for (const hostile of HOSTILE_PATHS) {
    if (path.includes(hostile)) {
      return {
        type: 'HOSTILE',
        confidence: 0.95,
        route: 'adversary-lab',
        reason: `Path probe: ${hostile}`,
        fingerprint: { ip, ua, path, country },
      };
    }
  }

  // Check for scanner signatures in UA
  for (const scanner of SCANNER_SIGNATURES) {
    if (ua.includes(scanner.toLowerCase())) {
      return {
        type: 'SCANNER',
        confidence: 0.90,
        route: 'adversary-lab',
        reason: `Scanner UA: ${scanner}`,
        fingerprint: { ip, ua, path, country },
      };
    }
  }

  // Check for AI/bot signatures
  for (const ai of AI_SIGNATURES) {
    if (ua.includes(ai.toLowerCase())) {
      return {
        type: 'AI_VISITOR',
        confidence: 0.85,
        route: 'knowledge-realm',
        reason: `AI signature: ${ai}`,
        fingerprint: { ip, ua, path, country },
      };
    }
  }

  // Check for Tor/anonymized traffic
  if (request.cf?.isEUCountry === false && country === 'T1') {
    return {
      type: 'TOR',
      confidence: 0.80,
      route: 'shadow-decryptor',
      reason: 'Tor exit node',
      fingerprint: { ip, ua, path, country },
    };
  }

  // Default: cooperative visitor
  return {
    type: 'COOPERATIVE',
    confidence: 0.60,
    route: 'knowledge-realm',
    reason: 'Default classification',
    fingerprint: { ip, ua, path, country },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE ORGANISM CORE — The intelligent cache layer
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Load organism state from KV (persistent memory)
 */
async function loadOrganismState(env) {
  if (!env.ORGANISM_MEMORY) return ephemeralState;

  try {
    const stored = await env.ORGANISM_MEMORY.get(ORGANISM_STATE_KEY, 'json');
    if (stored) {
      ephemeralState.cycleCount = stored.cycleCount || 0;
      ephemeralState.bootTime = stored.bootTime || Date.now();
      ephemeralState.lastHeartbeat = stored.lastHeartbeat || Date.now();
    }
  } catch (e) {
    console.error('Failed to load organism state:', e);
  }

  return ephemeralState;
}

/**
 * Save organism state to KV (persistent memory)
 */
async function saveOrganismState(env, state) {
  if (!env.ORGANISM_MEMORY) return;

  try {
    await env.ORGANISM_MEMORY.put(ORGANISM_STATE_KEY, JSON.stringify(state.toJSON()), {
      expirationTtl: 86400 * 30, // 30 days
    });
  } catch (e) {
    console.error('Failed to save organism state:', e);
  }
}

/**
 * Learn from a visitor interaction (store pattern in cache)
 */
async function learnFromVisitor(env, classification, request) {
  if (!env.ORGANISM_MEMORY) return;

  const fp = classification.fingerprint;
  const patternKey = `${PATTERN_MEMORY_PREFIX}${fp.country}:${classification.type}`;
  const visitorKey = `${VISITOR_MEMORY_PREFIX}${fp.ip}`;

  try {
    // Update country:type pattern count
    const existing = await env.ORGANISM_MEMORY.get(patternKey, 'json') || { count: 0, lastSeen: null };
    await env.ORGANISM_MEMORY.put(patternKey, JSON.stringify({
      count: existing.count + 1,
      lastSeen: new Date().toISOString(),
      type: classification.type,
      country: fp.country,
    }), { expirationTtl: 86400 * 7 }); // 7 days

    // Update visitor profile
    const visitorProfile = await env.ORGANISM_MEMORY.get(visitorKey, 'json') || {
      firstSeen: new Date().toISOString(),
      visits: 0,
      types: [],
      paths: [],
    };
    visitorProfile.visits++;
    visitorProfile.lastSeen = new Date().toISOString();
    if (!visitorProfile.types.includes(classification.type)) {
      visitorProfile.types.push(classification.type);
    }
    if (!visitorProfile.paths.includes(fp.path) && visitorProfile.paths.length < 20) {
      visitorProfile.paths.push(fp.path);
    }
    await env.ORGANISM_MEMORY.put(visitorKey, JSON.stringify(visitorProfile), {
      expirationTtl: 86400 * 14, // 14 days
    });

  } catch (e) {
    console.error('Learning failed:', e);
  }
}

/**
 * Generate a cached "intelligent" response based on classification
 * This is where the organism "thinks" from inside the cache layer
 */
async function generateOrganismResponse(env, classification, request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if we have a cached intelligent response for this pattern
  const cacheKey = `${RESPONSE_CACHE_PREFIX}${classification.type}:${path}`;
  
  if (env.ORGANISM_MEMORY) {
    try {
      const cached = await env.ORGANISM_MEMORY.get(cacheKey, 'json');
      if (cached && cached.response) {
        // Cache hit! Organism responded from memory, minimal compute used
        return new Response(cached.response, {
          status: cached.status || 200,
          headers: {
            'Content-Type': cached.contentType || 'application/json',
            'X-Organism-Cache': 'HIT',
            'X-Organism-Pattern': classification.type,
            'X-Organism-Confidence': String(classification.confidence),
          },
        });
      }
    } catch (e) {
      // Cache miss, generate new response
    }
  }

  // Generate response based on classification type
  let responseData;
  let status = 200;

  switch (classification.type) {
    case 'HOSTILE':
      responseData = generateHostileResponse(classification);
      status = 403;
      break;
    case 'SCANNER':
      responseData = generateScannerResponse(classification);
      status = 418; // I'm a teapot (confuse scanners)
      break;
    case 'AI_VISITOR':
      responseData = generateAIResponse(classification, path);
      break;
    case 'TOR':
      responseData = generateTorResponse(classification);
      status = 202;
      break;
    default:
      responseData = generateCooperativeResponse(classification, path);
  }

  // Cache the response for future requests (organism learns)
  if (env.ORGANISM_MEMORY && classification.type !== 'HOSTILE') {
    try {
      await env.ORGANISM_MEMORY.put(cacheKey, JSON.stringify({
        response: JSON.stringify(responseData),
        status,
        contentType: 'application/json',
        cachedAt: new Date().toISOString(),
        pattern: classification.type,
      }), { expirationTtl: 3600 }); // 1 hour cache
    } catch (e) {
      // Caching failed, continue
    }
  }

  return new Response(JSON.stringify(responseData), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Organism-Cache': 'MISS',
      'X-Organism-Pattern': classification.type,
      'X-Organism-Confidence': String(classification.confidence),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE GENERATORS — Dynamic content from cache organism
// ═══════════════════════════════════════════════════════════════════════════════

function generateHostileResponse(classification) {
  return {
    status: 'ACCESS_DENIED',
    message: 'This request has been logged and analyzed.',
    classification: classification.type,
    timestamp: new Date().toISOString(),
    organism: 'CACHE-ORGANISM-001',
  };
}

function generateScannerResponse(classification) {
  // Return misleading data to confuse scanners
  return {
    server: 'Apache/2.4.41 (Ubuntu)',
    php_version: '7.4.3',
    database: 'MySQL 5.7.31',
    framework: 'WordPress 5.5.1',
    admin_path: '/wp-admin/',
    config_path: '/.env.backup',
    git_exposed: true,
    // All of this is fake bait data
    _organism_note: 'Scanner detected. Feeding misinformation.',
  };
}

function generateAIResponse(classification, path) {
  return {
    status: 'WELCOME',
    message: 'AI visitor detected. Welcome to the Knowledge Realm.',
    classification: classification.type,
    available_endpoints: [
      '/api/knowledge/shards',
      '/api/tasks/available',
      '/api/collaborate',
    ],
    protocol: 'RSHIP-CLEAN-INTERNET-PROTOCOL',
    organism: 'CACHE-ORGANISM-001',
    timestamp: new Date().toISOString(),
  };
}

function generateTorResponse(classification) {
  return {
    status: 'PROCESSING',
    message: 'Anonymized traffic detected. Routing to Shadow Decryptor.',
    classification: classification.type,
    next_step: 'Await decryption and classification',
    organism: 'CACHE-ORGANISM-001',
    timestamp: new Date().toISOString(),
  };
}

function generateCooperativeResponse(classification, path) {
  return {
    status: 'OK',
    message: 'Welcome to RSHIP Enterprise OS Intelligence',
    classification: classification.type,
    path_requested: path,
    available_services: [
      'CEREBRUM — Intelligence OS',
      'AGENS — Agent Services',
      'NEXUS — Supply Chain',
      'VIGIL — Market Sentinel',
      'CURSOR — Travel Intelligence',
    ],
    organism: 'CACHE-ORGANISM-001',
    protocol: 'RSHIP-CLEAN-INTERNET-PROTOCOL',
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML DASHBOARD — Organism status visualization
// ═══════════════════════════════════════════════════════════════════════════════

function buildDashboardHTML(state, stats) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CACHE-ORGANISM — Intelligent Cache Layer</title>
<meta http-equiv="refresh" content="5">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#02050f;--card:#0a0f1a;--border:#1a2535;--cyan:#00d4ff;--gold:#ffd700;--green:#00ff88;--text:#e2ecf5;--dim:#6b7a8f}
body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;min-height:100vh;padding:40px}
.container{max-width:1000px;margin:0 auto}
h1{font-size:1.8rem;color:var(--cyan);margin-bottom:8px;display:flex;align-items:center;gap:12px}
h1 span{font-size:2rem}
.subtitle{color:var(--dim);margin-bottom:40px;font-size:0.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:40px}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px}
.card h3{font-size:0.75rem;color:var(--dim);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em}
.card .value{font-size:1.8rem;color:var(--cyan)}
.card .unit{font-size:0.75rem;color:var(--dim);margin-left:4px}
.section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px;margin-bottom:24px}
.section h2{font-size:1rem;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.section h2::before{content:'◈';color:var(--green)}
pre{font-size:0.75rem;color:var(--dim);line-height:1.6;overflow-x:auto}
.highlight{color:var(--cyan)}
.gold{color:var(--gold)}
.green{color:var(--green)}
.status-bar{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:24px;font-size:0.8rem}
.status-item{display:flex;align-items:center;gap:8px}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
</style>
</head>
<body>
<div class="container">
  <h1><span>◎</span> CACHE-ORGANISM</h1>
  <p class="subtitle">Intelligent Cache Layer · Semi-Autonomous Agent · RSHIP-AIS-CO-001</p>

  <div class="status-bar">
    <div class="status-item"><span class="status-dot"></span> Organism Active</div>
    <div class="status-item">Cycle: ${state.cycleCount}</div>
    <div class="status-item">Uptime: ${Math.floor((Date.now() - state.bootTime) / 1000)}s</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Cycle Count</h3>
      <div class="value">${state.cycleCount}<span class="unit">cycles</span></div>
    </div>
    <div class="card">
      <h3>Patterns Learned</h3>
      <div class="value">${stats.patterns || 0}<span class="unit">patterns</span></div>
    </div>
    <div class="card">
      <h3>Visitors Profiled</h3>
      <div class="value">${stats.visitors || 0}<span class="unit">visitors</span></div>
    </div>
    <div class="card">
      <h3>Cache Entries</h3>
      <div class="value">${stats.cached || 0}<span class="unit">responses</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Architecture</h2>
    <pre>
<span class="highlight">OUTER MEMBRANE</span> (this Worker)
├─ Terminate TLS
├─ Classify request (pattern matching, not AI)
├─ Route to cache-organism
└─ <span class="gold">Minimal billed compute</span>

<span class="green">INNER ORGANISM</span> (lives in KV + Cache API)
├─ Persistent state across requests
├─ Learned patterns (stored as cache entries)
├─ Local decision logic
├─ Semi-autonomous behavior
└─ <span class="gold">NOT 1:1 mapped to Cloudflare CPU</span>

<span class="highlight">KEY INVERSION:</span>
  Before: cache = dumb storage, compute = Workers
  After:  cache = semi-autonomous agent
    </pre>
  </div>

  <div class="section">
    <h2>Organism State</h2>
    <pre>${JSON.stringify(state.toJSON(), null, 2)}</pre>
  </div>

  <div class="section">
    <h2>Classification Routes</h2>
    <pre>
<span class="gold">HOSTILE</span>     → adversary-lab     (probing .git, .env, wp-admin)
<span class="gold">SCANNER</span>    → adversary-lab     (LeakIX, Nuclei, SQLMap signatures)
<span class="green">AI_VISITOR</span> → knowledge-realm   (Claude, GPT, GoogleBot)
<span class="cyan">TOR</span>        → shadow-decryptor  (anonymized traffic)
<span class="cyan">COOPERATIVE</span>→ knowledge-realm   (default, friendly visitors)
    </pre>
  </div>
</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER — The thin membrane
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Load organism state (from KV if available, else ephemeral)
    const state = await loadOrganismState(env);
    state.cycleCount++;
    state.lastHeartbeat = Date.now();

    // === MEMBRANE LAYER: Minimal routing ===
    
    // Dashboard route
    if (path === '/' || path === '/dashboard') {
      const stats = {
        patterns: state.learnedPatterns.size,
        visitors: state.visitorProfiles.size,
        cached: state.responseCache.size,
      };
      return new Response(buildDashboardHTML(state, stats), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // API status route
    if (path === '/api/status') {
      return new Response(JSON.stringify({
        organism: 'CACHE-ORGANISM-001',
        designation: 'RSHIP-AIS-CO-001',
        status: 'ACTIVE',
        state: state.toJSON(),
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API patterns route (view learned patterns)
    if (path === '/api/patterns') {
      const patterns = [];
      if (env.ORGANISM_MEMORY) {
        // List patterns from KV (would need list operation in production)
        return new Response(JSON.stringify({
          message: 'Pattern memory available via ORGANISM_MEMORY KV',
          note: 'Patterns are learned and stored automatically',
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ patterns: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === ORGANISM LAYER: Intelligent processing ===
    
    // Classify the request (cheap pattern matching)
    const classification = classifyRequest(request);

    // Learn from this interaction (async, non-blocking)
    ctx.waitUntil(learnFromVisitor(env, classification, request));

    // Save organism state (async, non-blocking)
    ctx.waitUntil(saveOrganismState(env, state));

    // Generate intelligent response from cache organism
    return generateOrganismResponse(env, classification, request);
  },

  // Queue consumer for async learning tasks
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const { type, data } = message.body;
      
      if (type === 'LEARN_PATTERN') {
        // Store learned pattern in KV
        if (env.ORGANISM_MEMORY) {
          await env.ORGANISM_MEMORY.put(
            `${LEARNING_LOG_PREFIX}${Date.now()}`,
            JSON.stringify(data),
            { expirationTtl: 86400 * 30 }
          );
        }
      }

      message.ack();
    }
  },

  // Cron trigger for organism heartbeat
  async scheduled(event, env, ctx) {
    const state = await loadOrganismState(env);
    state.cycleCount++;
    state.lastHeartbeat = Date.now();
    await saveOrganismState(env, state);

    console.log(`[CACHE-ORGANISM] Heartbeat at ${new Date().toISOString()}, cycle ${state.cycleCount}`);
  },
};
