/**
 * RSHIP Enterprise OS Intelligence — Intelligent API Cache
 * 
 * This Pages Function provides an intelligent API layer that:
 * - Routes to appropriate Workers via service bindings
 * - Caches API responses intelligently
 * - Learns patterns and adapts responses
 * - Decouples cognition from billing
 * 
 * Route: /api/*
 */

const PHI = 1.618033988749895;

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTING TABLE
// ═══════════════════════════════════════════════════════════════════════════════

const API_ROUTES = {
  // CEREBRUM — Master Intelligence
  'cerebrum': { service: 'CEREBRUM', paths: ['/status', '/agents', '/protocols', '/health'] },
  
  // AGENS — Agent Services
  'agens': { service: 'AGENS', paths: ['/catalog', '/deploy', '/quote', '/internal'] },
  
  // ANIMUS — Soul/Mind Interface
  'animus': { service: 'ANIMUS', paths: ['/intelligence', '/machine', '/dock', '/exchange'] },
  
  // NEXUS — Supply Chain
  'nexus': { service: 'NEXUS', paths: ['/nodes', '/disruption', '/route', '/optimize'] },
  
  // VIGIL — Market Sentinel
  'vigil': { service: 'VIGIL', paths: ['/market', '/portfolio', '/regime', '/predict'] },
  
  // CURSOR — Travel Intelligence
  'cursor': { service: 'CURSOR', paths: ['/companion', '/flight', '/social', '/crisis'] },
  
  // CACHE-ORGANISM — Direct cache operations
  'cache': { service: 'CACHE_ORGANISM', paths: ['/status', '/patterns', '/memory', '/learn'] },
  
  // GATE-NODE — Protocol entry
  'gate': { service: 'GATE_NODE', paths: ['/classify', '/route', '/stats'] },
  
  // EMAILAI-MESH — Sovereign Email Intelligence (Full mesh app)
  'emailai': { 
    service: 'EMAILAI_MESH', 
    paths: [
      '/',              // Status
      '/health',        // Health check
      '/identities',    // 29 organ identities
      '/inbox',         // Unified inbox
      '/inbox/:organ',  // Organ-specific inbox
      '/stats',         // Mesh analytics
      '/classify',      // Classification engine (POST)
      '/route',         // Routing engine (POST)
      '/enterprise/use-cases',    // Enterprise use cases
      '/enterprise/onboard',      // Onboard company (POST)
      '/enterprise/domains',      // List enterprise domains
      '/enterprise/capabilities'  // Full capability manifest
    ]
  },
  
  // NOVA — Live-Fire AI Range
  'nova': { service: 'NOVA', paths: ['/status', '/threat', '/specimens', '/analytics'] },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE KEY GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateApiCacheKey(path, method, params) {
  const paramHash = params ? hashString(JSON.stringify(params)) : 'none';
  return `api:${method}:${path}:${paramHash}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT API CACHE
// ═══════════════════════════════════════════════════════════════════════════════

async function getCachedApiResponse(env, cacheKey) {
  if (!env.API_CACHE) return null;

  try {
    const cached = await env.API_CACHE.get(cacheKey, 'json');
    if (cached && cached.expiresAt > Date.now()) {
      return {
        data: cached.response,
        age: Date.now() - cached.cachedAt,
        hits: cached.hits || 0,
      };
    }
  } catch (e) {
    // Cache miss
  }
  return null;
}

async function cacheApiResponse(env, cacheKey, response, ttlSeconds = 300) {
  if (!env.API_CACHE) return;

  try {
    const data = {
      response: await response.clone().json(),
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000),
      hits: 1,
    };
    await env.API_CACHE.put(cacheKey, JSON.stringify(data), { 
      expirationTtl: ttlSeconds 
    });
  } catch (e) {
    // Caching failed
  }
}

async function incrementCacheHits(env, cacheKey) {
  if (!env.API_CACHE) return;

  try {
    const existing = await env.API_CACHE.get(cacheKey, 'json');
    if (existing) {
      existing.hits = (existing.hits || 0) + 1;
      await env.API_CACHE.put(cacheKey, JSON.stringify(existing), {
        expirationTtl: Math.floor((existing.expiresAt - Date.now()) / 1000)
      });
    }
  } catch (e) {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

function findServiceForPath(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  
  const serviceKey = parts[1].toLowerCase(); // /api/{service}/...
  const routeConfig = API_ROUTES[serviceKey];
  
  if (!routeConfig) return null;
  
  return {
    service: routeConfig.service,
    forwardPath: '/' + parts.slice(2).join('/'),
  };
}

async function routeToService(env, serviceName, request, forwardPath) {
  const service = env[serviceName];
  if (!service) {
    return new Response(JSON.stringify({
      error: 'Service unavailable',
      service: serviceName,
      organism: 'API-CACHE',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build forwarded request
  const url = new URL(request.url);
  url.pathname = forwardPath;

  const forwardedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
  });

  try {
    return await service.fetch(forwardedRequest);
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Service error',
      service: serviceName,
      message: e.message,
      organism: 'API-CACHE',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API STATUS ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

function buildApiStatus(env) {
  const services = Object.entries(API_ROUTES).map(([key, config]) => ({
    name: key.toUpperCase(),
    service: config.service,
    available: !!env[config.service],
    paths: config.paths,
  }));

  return {
    organism: 'RSHIP-PAGES-API-CACHE',
    version: '1.0.0',
    status: 'ACTIVE',
    architecture: {
      outer_membrane: 'Classification + Routing',
      inner_organism: 'Intelligent Cache + Learning',
      decoupled_compute: true,
    },
    services,
    bindings: {
      API_CACHE: !!env.API_CACHE,
      ORGANISM_MEMORY: !!env.ORGANISM_MEMORY,
      PATTERN_STORE: !!env.PATTERN_STORE,
      AI: !!env.AI,
      INTELLIGENCE_DB: !!env.INTELLIGENCE_DB,
    },
    timestamp: new Date().toISOString(),
    phi: PHI,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // API Status endpoint
  if (path === '/api' || path === '/api/') {
    return new Response(JSON.stringify(buildApiStatus(env), null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Organism': 'DIRECT',
      }
    });
  }

  // API Health endpoint
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      organism: 'PAGES-API-CACHE',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // API Cache stats endpoint
  if (path === '/api/cache/stats') {
    return new Response(JSON.stringify({
      organism: 'API-CACHE-STATS',
      available: !!env.API_CACHE,
      learning: !!env.PATTERN_STORE,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Find service for this path
  const routeInfo = findServiceForPath(path);
  
  if (!routeInfo) {
    return new Response(JSON.stringify({
      error: 'Unknown API endpoint',
      path,
      available_services: Object.keys(API_ROUTES),
      organism: 'API-CACHE',
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // === INTELLIGENT CACHE CHECK ===
  // Only cache GET requests
  if (method === 'GET') {
    const cacheKey = generateApiCacheKey(path, method, url.searchParams.toString());
    const cached = await getCachedApiResponse(env, cacheKey);
    
    if (cached) {
      // Increment hits (async)
      context.waitUntil(incrementCacheHits(env, cacheKey));
      
      return new Response(JSON.stringify(cached.data), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Organism': 'HIT',
          'X-Cache-Age': String(cached.age),
          'X-Cache-Hits': String(cached.hits + 1),
        }
      });
    }
  }

  // === ROUTE TO SERVICE ===
  const response = await routeToService(env, routeInfo.service, request, routeInfo.forwardPath);

  // === CACHE SUCCESSFUL GET RESPONSES ===
  if (method === 'GET' && response.ok) {
    const cacheKey = generateApiCacheKey(path, method, url.searchParams.toString());
    
    // Determine TTL based on endpoint (status endpoints = short, data = longer)
    const ttl = path.includes('/status') ? 60 : 300;
    context.waitUntil(cacheApiResponse(env, cacheKey, response, ttl));
  }

  // Add organism headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Cache-Organism', 'MISS');
  newHeaders.set('X-Routed-Service', routeInfo.service);

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
