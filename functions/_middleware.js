/**
 * RSHIP Enterprise OS Intelligence — Intelligent Cache Middleware
 * 
 * This middleware implements the two-layer compute model:
 * - OUTER MEMBRANE: Cheap classification and routing (this middleware)
 * - INNER ORGANISM: Intelligent cache responses (KV/D1/R2)
 * 
 * Cloudflare sees "cache hit"; organism sees cognition.
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// ═══════════════════════════════════════════════════════════════════════════════
// VISITOR CLASSIFICATION (Cheap pattern matching — NOT AI)
// ═══════════════════════════════════════════════════════════════════════════════

const HOSTILE_PATTERNS = ['.git', '.env', 'wp-admin', 'xmlrpc', 'phpmyadmin', '.htaccess'];
const SCANNER_SIGNATURES = ['leakix', 'nuclei', 'sqlmap', 'nikto', 'nmap', 'masscan'];
const AI_SIGNATURES = ['claude', 'anthropic', 'gpt', 'openai', 'googlebot', 'bingbot'];

function classifyVisitor(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const country = request.cf?.country || 'XX';

  // Hostile path probing
  for (const pattern of HOSTILE_PATTERNS) {
    if (path.includes(pattern)) {
      return { type: 'HOSTILE', confidence: 0.95, route: 'block', ip, country };
    }
  }

  // Scanner UA detection
  for (const sig of SCANNER_SIGNATURES) {
    if (ua.includes(sig)) {
      return { type: 'SCANNER', confidence: 0.90, route: 'honeypot', ip, country };
    }
  }

  // AI visitor detection
  for (const sig of AI_SIGNATURES) {
    if (ua.includes(sig)) {
      return { type: 'AI_VISITOR', confidence: 0.85, route: 'knowledge', ip, country };
    }
  }

  // Tor exit detection
  if (country === 'T1') {
    return { type: 'TOR', confidence: 0.80, route: 'shadow', ip, country };
  }

  return { type: 'COOPERATIVE', confidence: 0.60, route: 'serve', ip, country };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT CACHE KEY GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateCacheKey(request, classification) {
  const url = new URL(request.url);
  const pathHash = hashPath(url.pathname);
  
  // Different cache keys for different visitor types
  return `cache:${classification.type}:${pathHash}:${url.search || 'none'}`;
}

function hashPath(path) {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE ORGANISM RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

async function getOrganismResponse(env, cacheKey, classification) {
  if (!env.ORGANISM_MEMORY) return null;

  try {
    const cached = await env.ORGANISM_MEMORY.get(cacheKey, 'json');
    if (cached) {
      return {
        data: cached,
        headers: {
          'X-Cache-Organism': 'HIT',
          'X-Organism-Type': classification.type,
          'X-Organism-Confidence': String(classification.confidence),
        }
      };
    }
  } catch (e) {
    // Cache miss, continue to origin
  }
  return null;
}

async function storeOrganismResponse(env, cacheKey, response, classification) {
  if (!env.ORGANISM_MEMORY) return;

  try {
    const data = {
      body: await response.clone().text(),
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      cachedAt: new Date().toISOString(),
      classification: classification.type,
    };

    // TTL based on visitor type (AI visitors get longer cache)
    const ttl = classification.type === 'AI_VISITOR' ? 86400 : 3600;
    await env.ORGANISM_MEMORY.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl });
  } catch (e) {
    // Caching failed, continue
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING SYSTEM (Pattern recognition)
// ═══════════════════════════════════════════════════════════════════════════════

async function learnFromVisit(env, classification, request) {
  if (!env.PATTERN_STORE) return;

  const patternKey = `pattern:${classification.country}:${classification.type}`;
  
  try {
    const existing = await env.PATTERN_STORE.get(patternKey, 'json') || { count: 0 };
    await env.PATTERN_STORE.put(patternKey, JSON.stringify({
      count: existing.count + 1,
      lastSeen: new Date().toISOString(),
      type: classification.type,
      country: classification.country,
    }), { expirationTtl: 604800 }); // 7 days
  } catch (e) {
    // Learning failed, non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Skip middleware for static assets
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    return next();
  }

  // === OUTER MEMBRANE: Classification ===
  const classification = classifyVisitor(request);

  // Block hostile visitors
  if (classification.route === 'block') {
    return new Response(JSON.stringify({
      status: 'BLOCKED',
      message: 'Access denied',
      organism: 'PAGES-MEMBRANE',
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Classification': classification.type,
      }
    });
  }

  // === INNER ORGANISM: Check cache ===
  const cacheKey = generateCacheKey(request, classification);
  const cachedResponse = await getOrganismResponse(env, cacheKey, classification);

  if (cachedResponse) {
    // Cloudflare sees "cache hit"; organism sees cognition
    return new Response(cachedResponse.data.body, {
      status: cachedResponse.data.status,
      headers: {
        ...cachedResponse.data.headers,
        ...cachedResponse.headers,
      }
    });
  }

  // Learn from this visit (async, non-blocking)
  context.waitUntil(learnFromVisit(env, classification, request));

  // === Pass to origin (Pages or Functions) ===
  const response = await next();

  // Store response in organism memory (async)
  if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
    context.waitUntil(storeOrganismResponse(env, cacheKey, response, classification));
  }

  // Add organism headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Cache-Organism', 'MISS');
  newHeaders.set('X-Organism-Type', classification.type);
  newHeaders.set('X-Organism-Confidence', String(classification.confidence));

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
