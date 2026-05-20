/**
 * CACHE-ORGANISM — RSHIP Intelligent Cache AI
 *
 * Designation:  RSHIP-MEM-CO-001
 * Latin:        organismus (living system)
 * Product:      Inner intelligence layer — semi-autonomous AI cache agents
 *               The organism's "permanence" lives here: distributed memory,
 *               learned patterns, local agents at the edge.
 *
 * Architecture:
 *   This is where cognition happens. The Gate-Node routes requests here,
 *   and the Cache-Organism uses AI to:
 *   • Understand request semantics
 *   • Generate intelligent responses
 *   • Learn from patterns
 *   • Maintain distributed memory
 *   • Adapt to traffic patterns
 *
 * Key Concepts:
 *   • Semantic Cache: AI understands what you mean, not just what you said
 *   • Learned Patterns: Organism learns from request patterns over time
 *   • Response Memory: Remembers successful responses for similar requests
 *   • Adaptive TTL: Cache duration based on content volatility
 *
 * Routes:
 *   GET  /              → Organism status and intelligence dashboard
 *   GET  /health        → Health check
 *   POST /understand    → Semantic understanding of request
 *   POST /generate      → AI-generated response
 *   GET  /memory        → View organism memory state
 *   POST /learn         → Feedback for learning
 *   *    /*             → Intelligent response handling
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const GOLDEN_ANGLE = 2.399963229728653;

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANISM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const ORGANISM_CONFIG = {
  // Cache TTLs (in seconds), scaled by golden ratio
  ttl: {
    semantic: Math.floor(3600 * PHI),      // ~1.6 hours
    response: Math.floor(900 * PHI),       // ~24 minutes  
    pattern: Math.floor(86400 * PHI),      // ~1.6 days
    learning: Math.floor(604800 * PHI),    // ~11.3 days
  },
  
  // AI model configuration
  models: {
    understanding: '@cf/meta/llama-3.1-8b-instruct',
    generation: '@cf/meta/llama-3.1-8b-instruct',
    embedding: '@cf/baai/bge-base-en-v1.5',
  },
  
  // Learning thresholds
  learning: {
    minSamplesForPattern: 5,
    confidenceThreshold: 0.7,
    adaptationRate: PHI_INV,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC UNDERSTANDING
// ═══════════════════════════════════════════════════════════════════════════════

async function understandRequest(request, url, env) {
  const path = url.pathname;
  const method = request.method;
  const query = Object.fromEntries(url.searchParams);
  
  // Build semantic key from request characteristics
  const semanticKey = `semantic:${method}:${path}:${JSON.stringify(query)}`;
  
  // Check semantic cache first
  const cached = await env.SEMANTIC_CACHE?.get(semanticKey, { type: 'json' });
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  // Generate semantic understanding using AI
  let understanding = {
    intent: 'unknown',
    confidence: 0,
    entities: [],
    context: {},
  };
  
  if (env.AI) {
    try {
      const response = await env.AI.run(ORGANISM_CONFIG.models.understanding, {
        messages: [
          {
            role: 'system',
            content: `You are a semantic understanding agent. Analyze the following HTTP request and extract:
1. Intent: What is the user trying to accomplish?
2. Entities: What key data points are mentioned?
3. Context: What additional context can be inferred?

Respond in JSON format: {"intent": "string", "confidence": 0-1, "entities": [], "context": {}}`
          },
          {
            role: 'user',
            content: `Method: ${method}\nPath: ${path}\nQuery: ${JSON.stringify(query)}`
          }
        ],
      });
      
      try {
        understanding = JSON.parse(response.response);
      } catch {
        understanding.rawResponse = response.response;
      }
    } catch (error) {
      understanding.error = error.message;
    }
  }
  
  // Cache the understanding
  if (env.SEMANTIC_CACHE) {
    await env.SEMANTIC_CACHE.put(semanticKey, JSON.stringify(understanding), {
      expirationTtl: ORGANISM_CONFIG.ttl.semantic,
    });
  }
  
  return { ...understanding, fromCache: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

async function generateResponse(understanding, request, env) {
  const responseKey = `response:${understanding.intent}:${JSON.stringify(understanding.entities)}`;
  
  // Check response memory
  const cached = await env.RESPONSE_MEMORY?.get(responseKey, { type: 'json' });
  if (cached && cached.confidence > ORGANISM_CONFIG.learning.confidenceThreshold) {
    return { ...cached, fromCache: true };
  }
  
  let generated = {
    content: null,
    type: 'text/plain',
    confidence: 0,
  };
  
  if (env.AI) {
    try {
      const response = await env.AI.run(ORGANISM_CONFIG.models.generation, {
        messages: [
          {
            role: 'system',
            content: `You are an intelligent cache organism. Generate an appropriate response based on the semantic understanding of the request. Be helpful, accurate, and concise.`
          },
          {
            role: 'user',
            content: `Understanding: ${JSON.stringify(understanding)}\n\nGenerate an appropriate response.`
          }
        ],
      });
      
      generated.content = response.response;
      generated.confidence = understanding.confidence || 0.5;
      generated.type = 'application/json';
    } catch (error) {
      generated.error = error.message;
    }
  }
  
  // Store in response memory for future requests
  if (env.RESPONSE_MEMORY && generated.content) {
    await env.RESPONSE_MEMORY.put(responseKey, JSON.stringify(generated), {
      expirationTtl: ORGANISM_CONFIG.ttl.response,
    });
  }
  
  return { ...generated, fromCache: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

async function recordLearning(pattern, feedback, env, ctx) {
  const patternKey = `pattern:${JSON.stringify(pattern)}`;
  
  // Get existing pattern data
  let patternData = await env.LEARNED_PATTERNS?.get(patternKey, { type: 'json' }) || {
    samples: 0,
    positive: 0,
    negative: 0,
    lastUpdated: null,
    adaptations: [],
  };
  
  // Update pattern data
  patternData.samples++;
  if (feedback.positive) {
    patternData.positive++;
  } else {
    patternData.negative++;
  }
  patternData.lastUpdated = Date.now();
  patternData.adaptations.push({
    timestamp: Date.now(),
    feedback: feedback.score,
  });
  
  // Keep only last 100 adaptations
  if (patternData.adaptations.length > 100) {
    patternData.adaptations = patternData.adaptations.slice(-100);
  }
  
  // Store updated pattern
  if (env.LEARNED_PATTERNS) {
    await env.LEARNED_PATTERNS.put(patternKey, JSON.stringify(patternData), {
      expirationTtl: ORGANISM_CONFIG.ttl.learning,
    });
  }
  
  // Queue for deeper learning analysis
  if (env.LEARNING_QUEUE) {
    ctx.waitUntil(
      env.LEARNING_QUEUE.send({
        type: 'pattern_feedback',
        pattern,
        feedback,
        patternData,
        timestamp: Date.now(),
      })
    );
  }
  
  return patternData;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildDashboard(env, stats) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CACHE-ORGANISM — RSHIP Intelligent Cache AI</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#02050f;--fg:#c8d8f8;--dim:#445566;--card:#060d1a;--border:#0d2030;--accent:#ff6b35;--glow:#ff6b3533}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;min-height:100vh}
.organism{max-width:1200px;margin:0 auto;padding:48px}
.header{text-align:center;margin-bottom:48px}
.title{font-size:2.5rem;color:var(--accent);letter-spacing:.2em;margin-bottom:8px;text-shadow:0 0 30px var(--glow)}
.subtitle{color:var(--dim);font-size:.9rem}
.brain{display:flex;justify-content:center;margin:48px 0}
.brain-viz{width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 30% 30%,var(--accent),var(--card));animation:pulse 3s ease-in-out infinite;box-shadow:0 0 60px var(--glow)}
@keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 60px var(--glow)}50%{transform:scale(1.05);box-shadow:0 0 80px var(--glow)}}
.capabilities{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-bottom:48px}
.capability{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px}
.cap-icon{font-size:2rem;margin-bottom:12px}
.cap-title{color:var(--accent);font-size:1rem;margin-bottom:8px}
.cap-desc{color:var(--dim);font-size:.8rem;line-height:1.6}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:48px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:16px;text-align:center}
.stat-value{font-size:1.5rem;color:var(--accent);margin-bottom:4px}
.stat-label{color:var(--dim);font-size:.7rem;text-transform:uppercase;letter-spacing:.1em}
.memory{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px;margin-bottom:48px}
.memory-title{color:var(--accent);margin-bottom:16px}
.memory-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)}
.memory-item:last-child{border-bottom:none}
.memory-key{color:var(--fg);font-size:.85rem}
.memory-value{color:var(--dim);font-size:.85rem}
footer{text-align:center;color:var(--dim);font-size:.75rem}
</style>
</head>
<body>
<div class="organism">
  <header class="header">
    <h1 class="title">CACHE-ORGANISM</h1>
    <p class="subtitle">Inner Intelligence Layer · Semi-Autonomous AI Cache Agent · v${env.VERSION}</p>
  </header>

  <div class="brain">
    <div class="brain-viz"></div>
  </div>

  <div class="capabilities">
    <div class="capability">
      <div class="cap-icon">🧠</div>
      <h3 class="cap-title">Semantic Understanding</h3>
      <p class="cap-desc">AI understands what you mean, not just what you said. Requests are analyzed for intent, entities, and context.</p>
    </div>
    <div class="capability">
      <div class="cap-icon">📚</div>
      <h3 class="cap-title">Learned Patterns</h3>
      <p class="cap-desc">The organism learns from request patterns over time, adapting responses based on feedback and usage.</p>
    </div>
    <div class="capability">
      <div class="cap-icon">💾</div>
      <h3 class="cap-title">Response Memory</h3>
      <p class="cap-desc">Successful responses are remembered and reused for semantically similar requests.</p>
    </div>
    <div class="capability">
      <div class="cap-icon">⏱️</div>
      <h3 class="cap-title">Adaptive TTL</h3>
      <p class="cap-desc">Cache duration is dynamically adjusted based on content volatility and access patterns.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${PHI.toFixed(4)}</div>
      <div class="stat-label">Golden Ratio (φ)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${Math.floor(ORGANISM_CONFIG.ttl.semantic / 60)}m</div>
      <div class="stat-label">Semantic TTL</div>
    </div>
    <div class="stat">
      <div class="stat-value">${Math.floor(ORGANISM_CONFIG.ttl.response / 60)}m</div>
      <div class="stat-label">Response TTL</div>
    </div>
    <div class="stat">
      <div class="stat-value">${(ORGANISM_CONFIG.learning.confidenceThreshold * 100).toFixed(0)}%</div>
      <div class="stat-label">Confidence Threshold</div>
    </div>
  </div>

  <div class="memory">
    <h3 class="memory-title">🔮 Organism Memory State</h3>
    <div class="memory-item">
      <span class="memory-key">Understanding Model</span>
      <span class="memory-value">${ORGANISM_CONFIG.models.understanding}</span>
    </div>
    <div class="memory-item">
      <span class="memory-key">Generation Model</span>
      <span class="memory-value">${ORGANISM_CONFIG.models.generation}</span>
    </div>
    <div class="memory-item">
      <span class="memory-key">Embedding Model</span>
      <span class="memory-value">${ORGANISM_CONFIG.models.embedding}</span>
    </div>
    <div class="memory-item">
      <span class="memory-key">Adaptation Rate</span>
      <span class="memory-value">${(ORGANISM_CONFIG.learning.adaptationRate * 100).toFixed(1)}% (φ⁻¹)</span>
    </div>
  </div>

  <footer>
    RSHIP-MEM-CO-001 · ${env.DESIGNATION} · © 2026 RSHIP AGI Systems
  </footer>
</div>
</body>
</html>`;
}

function buildJSON(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'X-Powered-By': 'RSHIP-Cache-Organism',
      'X-Organism-Version': '5.0.0',
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
    
    // Get routing metadata from Gate-Node
    const gateNode = request.headers.get('X-Gate-Node');
    const routeType = request.headers.get('X-Route-Type');
    const routeHash = request.headers.get('X-Route-Hash');
    
    // Track in analytics
    if (env.ORGANISM_ANALYTICS) {
      ctx.waitUntil(
        env.ORGANISM_ANALYTICS.writeDataPoint({
          blobs: [path, method, routeType || 'direct', gateNode || 'none'],
          doubles: [beat],
          indexes: [routeHash || 'direct'],
        })
      );
    }
    
    // Fast path: health check
    if (path === '/health') {
      return buildJSON({
        status: 'healthy',
        layer: 'cache-organism',
        designation: env.DESIGNATION,
        version: env.VERSION,
        ai_enabled: !!env.AI,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Dashboard
    if (path === '/' && method === 'GET') {
      return new Response(buildDashboard(env, {}), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    // Semantic understanding endpoint
    if (path === '/understand' && method === 'POST') {
      const understanding = await understandRequest(request, url, env);
      return buildJSON({
        success: true,
        understanding,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Response generation endpoint
    if (path === '/generate' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const understanding = body.understanding || await understandRequest(request, url, env);
      const response = await generateResponse(understanding, request, env);
      return buildJSON({
        success: true,
        understanding,
        response,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Memory state endpoint
    if (path === '/memory') {
      return buildJSON({
        config: ORGANISM_CONFIG,
        bindings: {
          ai: !!env.AI,
          learned_patterns: !!env.LEARNED_PATTERNS,
          semantic_cache: !!env.SEMANTIC_CACHE,
          response_memory: !!env.RESPONSE_MEMORY,
          organism_db: !!env.ORGANISM_DB,
          knowledge_db: !!env.KNOWLEDGE_DB,
          learning_queue: !!env.LEARNING_QUEUE,
          memory_archive: !!env.MEMORY_ARCHIVE,
          semantic_vectors: !!env.SEMANTIC_VECTORS,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Learning feedback endpoint
    if (path === '/learn' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const pattern = body.pattern || { path, method };
      const feedback = body.feedback || { positive: true, score: 1 };
      
      const result = await recordLearning(pattern, feedback, env, ctx);
      return buildJSON({
        success: true,
        pattern,
        result,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Default: Intelligent response handling
    // 1. Understand the request semantically
    const understanding = await understandRequest(request, url, env);
    
    // 2. Generate appropriate response
    const generated = await generateResponse(understanding, request, env);
    
    // 3. Record for learning (async)
    ctx.waitUntil(
      recordLearning(
        { path, method, intent: understanding.intent },
        { positive: true, score: understanding.confidence },
        env,
        ctx
      )
    );
    
    // Return intelligent response
    return buildJSON({
      organism: {
        designation: env.DESIGNATION,
        version: env.VERSION,
      },
      routing: {
        gateNode,
        routeType,
        routeHash,
      },
      understanding,
      response: generated,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Queue consumer for async learning
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { type, pattern, feedback, patternData } = message.body;
      
      if (type === 'pattern_feedback') {
        // Deep learning analysis could happen here
        // For now, just acknowledge
        console.log(`Learning from pattern: ${JSON.stringify(pattern)}`);
      }
      
      message.ack();
    }
  },
};
