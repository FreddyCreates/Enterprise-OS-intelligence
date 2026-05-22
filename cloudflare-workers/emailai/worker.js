/**
 * EMAILAI MESH — Sovereign Email Intelligence Worker
 *
 * Designation:  RSHIP-MESH-EMAIL-001
 * Latin:        epistula (letter/message)
 * Product:      EmailAI Mesh — multi-identity, cross-network communication layer
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                 LAYER 1 — IDENTITY                               │
 *   │  Each organ/agent/system gets a sovereign email identity         │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                 LAYER 2 — INGESTION                              │
 *   │  Cloudflare Email Routing → Worker → Parser                      │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                 LAYER 3 — CLASSIFICATION                         │
 *   │  Intent, urgency, organ target, action, entity type              │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                 LAYER 4 — ROUTING                                │
 *   │  Route to organ, workflow, surface, external, or reflex          │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                 LAYER 5 — ACTION                                 │
 *   │  Reply, escalate, summarize, trigger, notify, generate           │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                 LAYER 6 — MEMORY                                 │
 *   │  All messages → ICP canister (logs, identity, reputation, audit) │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Email Routes:
 *   membrane@medinatechlabs.net   → Probe alerts, routing decisions
 *   julia@medinatechlabs.net      → Analytics, φ-curves, predictions
 *   identity@medinatechlabs.net   → SSN onboarding, staking, reputation
 *   reflex@medinatechlabs.net     → Workflow summaries, event chains
 *   synthetic@medinatechlabs.net  → Deception logs, scanner intel
 *   nova@medinatechlabs.net       → User-facing communication
 *   research@medinatechlabs.net   → Reports, insights
 *   probe@medinatechlabs.net      → Scanner fingerprints, threat intel
 *
 * HTTP Routes:
 *   GET  /                → Mesh status dashboard
 *   GET  /health          → Health check
 *   GET  /identities      → Active organ identities
 *   GET  /inbox           → Unified inbox (all organs)
 *   GET  /inbox/:organ    → Organ-specific inbox
 *   POST /classify        → Manual classification endpoint
 *   POST /route           → Manual routing endpoint
 *   GET  /stats           → Mesh analytics
 *
 * Protocol: EAP-1 (Email Agent Protocol v1)
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI     = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════════
// ORGAN IDENTITY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const ORGAN_IDENTITIES = {
  // ── Core Organs ──────────────────────────────────────────────────────────────
  'membrane@medinatechlabs.net':  { organ: 'membrane',  type: 'organ', capabilities: ['alert', 'route', 'block', 'escalate'] },
  'julia@medinatechlabs.net':     { organ: 'brain',     type: 'organ', capabilities: ['classify', 'predict', 'analyze', 'summarize'] },
  'identity@medinatechlabs.net':  { organ: 'identity',  type: 'organ', capabilities: ['onboard', 'stake', 'verify', 'audit'] },
  'reflex@medinatechlabs.net':    { organ: 'reflex',    type: 'organ', capabilities: ['trigger_workflow', 'escalate', 'chain', 'schedule'] },
  'synthetic@medinatechlabs.net': { organ: 'surfaces',  type: 'organ', capabilities: ['deceive', 'log', 'fingerprint', 'trap'] },
  'nova@medinatechlabs.net':      { organ: 'nova',      type: 'organ', capabilities: ['reply', 'notify', 'report', 'communicate'] },
  'research@medinatechlabs.net':  { organ: 'research',  type: 'organ', capabilities: ['report', 'insight', 'synthesize', 'publish'] },
  'probe@medinatechlabs.net':     { organ: 'probe',     type: 'organ', capabilities: ['fingerprint', 'classify', 'track', 'alert'] },

  // ── Agent Workers ────────────────────────────────────────────────────────────
  'agens@medinatechlabs.net':     { organ: 'agens',     type: 'agent', capabilities: ['orchestrate', 'command', 'showcase', 'drill'] },
  'cerebrum@medinatechlabs.net':  { organ: 'cerebrum',  type: 'agent', capabilities: ['reason', 'synthesize', 'learn', 'infer'] },
  'animus@medinatechlabs.net':    { organ: 'animus',    type: 'agent', capabilities: ['sense', 'feel', 'motivate', 'adapt'] },
  'nexus@medinatechlabs.net':     { organ: 'nexus',     type: 'agent', capabilities: ['connect', 'bind', 'coordinate', 'relay'] },
  'vigil@medinatechlabs.net':     { organ: 'vigil',     type: 'agent', capabilities: ['watch', 'monitor', 'alert', 'guard'] },
  'cursor@medinatechlabs.net':    { organ: 'cursor',    type: 'agent', capabilities: ['navigate', 'point', 'track', 'select'] },

  // ── Infrastructure ───────────────────────────────────────────────────────────
  'gate@medinatechlabs.net':      { organ: 'gate-node',      type: 'system', capabilities: ['gate', 'filter', 'route', 'protect'] },
  'cache@medinatechlabs.net':     { organ: 'cache-organism', type: 'system', capabilities: ['cache', 'learn', 'respond', 'adapt'] },
  'mesh@medinatechlabs.net':      { organ: 'emailai-mesh',   type: 'system', capabilities: ['ingest', 'classify', 'route', 'coordinate'] },

  // ── Bots ─────────────────────────────────────────────────────────────────────
  'herald@medinatechlabs.net':    { organ: 'herald',    type: 'bot', capabilities: ['announce', 'broadcast', 'notify', 'publish'] },
  'conduit@medinatechlabs.net':   { organ: 'conduit',   type: 'bot', capabilities: ['relay', 'bridge', 'forward', 'translate'] },
  'pulse@medinatechlabs.net':     { organ: 'pulse',     type: 'bot', capabilities: ['heartbeat', 'health', 'vitals', 'ping'] },
  'sentinel@medinatechlabs.net':  { organ: 'sentinel',  type: 'bot', capabilities: ['detect', 'defend', 'scan', 'report'] },
  'arbiter@medinatechlabs.net':   { organ: 'arbiter',   type: 'bot', capabilities: ['decide', 'arbitrate', 'enforce', 'resolve'] },
  'imperium@medinatechlabs.net':  { organ: 'imperium',  type: 'bot', capabilities: ['command', 'delegate', 'govern', 'authorize'] },
  'nuntius@medinatechlabs.net':   { organ: 'nuntius',   type: 'bot', capabilities: ['deliver', 'message', 'notify', 'dispatch'] }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const INTENT_PATTERNS = {
  alert:      /\b(alert|warning|critical|breach|attack|threat|suspicious|anomaly)\b/i,
  task:       /\b(task|action|do|execute|run|trigger|deploy|update)\b/i,
  request:    /\b(request|please|need|want|ask|query|question)\b/i,
  info:       /\b(info|information|update|status|report|summary|digest)\b/i,
  error:      /\b(error|fail|exception|crash|broken|down|outage)\b/i,
  escalation: /\b(escalate|urgent|emergency|immediately|critical|asap)\b/i,
  summary:    /\b(summary|digest|overview|brief|recap|roundup)\b/i
};

const ENTITY_PATTERNS = {
  system: /\b(system|service|server|api|webhook|cron|monitor|automated)\b/i,
  bot:    /\b(bot|crawler|scanner|automated|script|agent)\b/i,
  organ:  /@medinatechlabs\.net$/i
};

const URGENCY_KEYWORDS = {
  critical: /\b(critical|emergency|breach|down|outage|immediately)\b/i,
  high:     /\b(urgent|asap|important|priority|soon)\b/i,
  medium:   /\b(when possible|attention|review|check)\b/i,
  low:      /\b(fyi|info|note|reminder|later)\b/i
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL PARSER
// ═══════════════════════════════════════════════════════════════════════════════

class EmailParser {
  /**
   * Parse raw email message into structured data
   */
  static async parse(message) {
    const headers = {};
    for (const [key, value] of message.headers) {
      headers[key.toLowerCase()] = value;
    }

    const rawBody = await new Response(message.raw).text();

    return {
      id: crypto.randomUUID(),
      from: message.from,
      to: message.to,
      subject: headers['subject'] || '(no subject)',
      headers: headers,
      body: rawBody,
      size: message.rawSize,
      timestamp: new Date().toISOString(),
      // EAP-1 protocol headers
      agentType:   headers['x-agent-type'] || null,
      agentIntent: headers['x-agent-intent'] || null,
      agentConfidence: headers['x-agent-confidence'] ? parseFloat(headers['x-agent-confidence']) : null,
      agentTarget: headers['x-agent-target'] || null,
      agentSource: headers['x-agent-source'] || null,
      agentUrgency: headers['x-agent-urgency'] || null,
      agentThread: headers['x-agent-thread'] || null,
      agentAction: headers['x-agent-action'] || null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class ClassificationEngine {
  /**
   * Classify a parsed email message
   */
  static classify(parsed) {
    // If EAP-1 headers present, trust agent classification
    if (parsed.agentIntent && parsed.agentConfidence > 0.8) {
      return {
        entity: parsed.agentType || 'agent',
        intent: parsed.agentIntent,
        organ_target: parsed.agentTarget || this.inferOrganTarget(parsed),
        confidence: parsed.agentConfidence,
        action: parsed.agentAction || this.inferAction(parsed.agentIntent),
        urgency: parsed.agentUrgency || 'medium',
        metadata: {
          source: 'eap-1-headers',
          thread: parsed.agentThread
        }
      };
    }

    // Otherwise, classify from content
    const text = `${parsed.subject} ${parsed.body}`;
    const intent = this.classifyIntent(text);
    const entity = this.classifyEntity(parsed.from, text);
    const urgency = this.classifyUrgency(text);
    const organTarget = this.inferOrganTarget(parsed);
    const confidence = this.calculateConfidence(intent, entity, urgency);

    return {
      entity: entity,
      intent: intent,
      organ_target: organTarget,
      confidence: confidence,
      action: this.inferAction(intent),
      urgency: urgency,
      metadata: {
        source: 'content-classification',
        subject: parsed.subject,
        from: parsed.from,
        classified_at: new Date().toISOString()
      }
    };
  }

  static classifyIntent(text) {
    let bestMatch = 'info';
    let bestScore = 0;

    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
      const matches = (text.match(pattern) || []).length;
      if (matches > bestScore) {
        bestScore = matches;
        bestMatch = intent;
      }
    }
    return bestMatch;
  }

  static classifyEntity(from, text) {
    if (ENTITY_PATTERNS.organ.test(from)) return 'organ';
    if (ENTITY_PATTERNS.bot.test(text)) return 'bot';
    if (ENTITY_PATTERNS.system.test(text)) return 'system';
    return 'human';
  }

  static classifyUrgency(text) {
    for (const [level, pattern] of Object.entries(URGENCY_KEYWORDS)) {
      if (pattern.test(text)) return level;
    }
    return 'medium';
  }

  static inferOrganTarget(parsed) {
    // Direct organ email → that organ
    const identity = ORGAN_IDENTITIES[parsed.to];
    if (identity) return identity.organ;

    // Fallback: route to membrane for re-classification
    return 'membrane';
  }

  static inferAction(intent) {
    const actionMap = {
      alert:      'trigger_reflex',
      task:       'trigger_workflow',
      request:    'reply',
      info:       'log',
      error:      'escalate',
      escalation: 'escalate',
      summary:    'summarize'
    };
    return actionMap[intent] || 'log';
  }

  static calculateConfidence(intent, entity, urgency) {
    let base = 0.7;
    if (intent !== 'info') base += 0.1;
    if (entity !== 'human') base += 0.05;
    if (urgency === 'critical' || urgency === 'high') base += 0.05;
    return Math.min(base * PHI_INV + 0.4, 0.99);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class RoutingEngine {
  constructor(env) {
    this.env = env;
  }

  /**
   * Route a classified message to appropriate organ/action
   */
  async route(classification, parsed) {
    const routes = [];

    // Critical alerts → membrane + all organs
    if (classification.intent === 'alert' && classification.urgency === 'critical') {
      routes.push({ target: 'membrane', action: 'alert' });
      routes.push({ target: 'reflex', action: 'trigger_workflow' });
    }

    // Tasks → target organ or reflex
    if (classification.intent === 'task') {
      routes.push({ target: classification.organ_target, action: 'execute' });
    }

    // Escalations → membrane for re-routing
    if (classification.intent === 'escalation') {
      routes.push({ target: 'membrane', action: 'escalate' });
    }

    // Human messages → nova
    if (classification.entity === 'human') {
      routes.push({ target: 'nova', action: 'reply' });
    }

    // Low confidence → brain for re-classification
    if (classification.confidence < 0.6) {
      routes.push({ target: 'brain', action: 'reclassify' });
    }

    // Default: route to classified target
    if (routes.length === 0) {
      routes.push({ target: classification.organ_target, action: classification.action });
    }

    // Queue the routed messages
    if (this.env.EMAIL_QUEUE) {
      await this.env.EMAIL_QUEUE.send({
        message_id: parsed.id,
        classification: classification,
        routes: routes,
        timestamp: new Date().toISOString()
      });
    }

    return routes;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class ActionEngine {
  constructor(env) {
    this.env = env;
  }

  /**
   * Execute action based on classification
   */
  async execute(classification, parsed, routes) {
    const results = [];

    for (const route of routes) {
      switch (route.action) {
        case 'trigger_workflow':
          results.push(await this.triggerWorkflow(classification, parsed));
          break;
        case 'escalate':
          results.push(await this.escalate(classification, parsed));
          break;
        case 'reply':
          results.push(await this.generateReply(classification, parsed));
          break;
        case 'summarize':
          results.push(await this.summarize(parsed));
          break;
        case 'reclassify':
          results.push(await this.requestReclassification(classification, parsed));
          break;
        default:
          results.push(await this.log(classification, parsed, route));
      }
    }

    return results;
  }

  async triggerWorkflow(classification, parsed) {
    if (this.env.REFLEX_QUEUE) {
      await this.env.REFLEX_QUEUE.send({
        type: 'email_trigger',
        intent: classification.intent,
        urgency: classification.urgency,
        source: parsed.from,
        subject: parsed.subject,
        timestamp: new Date().toISOString()
      });
    }
    return { action: 'trigger_workflow', status: 'queued' };
  }

  async escalate(classification, parsed) {
    if (this.env.ALERT_QUEUE) {
      await this.env.ALERT_QUEUE.send({
        type: 'escalation',
        from: parsed.from,
        subject: parsed.subject,
        urgency: classification.urgency,
        organ_target: classification.organ_target,
        timestamp: new Date().toISOString()
      });
    }
    return { action: 'escalate', status: 'queued' };
  }

  async generateReply(classification, parsed) {
    if (this.env.AI) {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are an AI organ (${classification.organ_target}) in the EmailAI Mesh. Generate a brief, professional response. You communicate for sovereign AI organisms.`
          },
          {
            role: 'user',
            content: `From: ${parsed.from}\nSubject: ${parsed.subject}\nBody: ${parsed.body}\n\nClassification: ${JSON.stringify(classification)}`
          }
        ],
        max_tokens: 256
      });
      return { action: 'reply', status: 'generated', content: response.response };
    }
    return { action: 'reply', status: 'ai_unavailable' };
  }

  async summarize(parsed) {
    if (this.env.AI) {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'Summarize this email in 2-3 sentences for an AI organism dashboard.' },
          { role: 'user', content: `Subject: ${parsed.subject}\nBody: ${parsed.body}` }
        ],
        max_tokens: 128
      });
      return { action: 'summarize', status: 'generated', content: response.response };
    }
    return { action: 'summarize', status: 'ai_unavailable' };
  }

  async requestReclassification(classification, parsed) {
    if (this.env.BRAIN_QUEUE) {
      await this.env.BRAIN_QUEUE.send({
        type: 'reclassify',
        original_classification: classification,
        message_id: parsed.id,
        subject: parsed.subject,
        from: parsed.from,
        timestamp: new Date().toISOString()
      });
    }
    return { action: 'reclassify', status: 'queued_to_brain' };
  }

  async log(classification, parsed, route) {
    return {
      action: 'log',
      status: 'recorded',
      route: route,
      message_id: parsed.id
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY LAYER — D1 persistence
// ═══════════════════════════════════════════════════════════════════════════════

class MemoryLayer {
  constructor(env) {
    this.env = env;
  }

  /**
   * Store message + classification in D1
   */
  async store(parsed, classification, routes, actionResults) {
    if (!this.env.MESH_DB) return;

    // Store the message
    await this.env.MESH_DB.prepare(`
      INSERT INTO messages (id, sender, recipient, subject, body, raw_headers, size, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      parsed.id,
      parsed.from,
      parsed.to,
      parsed.subject,
      parsed.body,
      JSON.stringify(parsed.headers),
      parsed.size,
      parsed.timestamp
    ).run();

    // Store classification
    await this.env.MESH_DB.prepare(`
      INSERT INTO classifications (message_id, entity_type, intent, organ_target, confidence, urgency, action, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      parsed.id,
      classification.entity,
      classification.intent,
      classification.organ_target,
      classification.confidence,
      classification.urgency,
      classification.action,
      JSON.stringify(classification.metadata)
    ).run();

    // Store routing decisions
    for (const route of routes) {
      await this.env.MESH_DB.prepare(`
        INSERT INTO routing_log (message_id, target_organ, action, routed_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        parsed.id,
        route.target,
        route.action,
        new Date().toISOString()
      ).run();
    }
  }

  /**
   * Get unified inbox
   */
  async getInbox(organ, limit = 50) {
    let query = `
      SELECT m.*, c.entity_type, c.intent, c.organ_target, c.confidence, c.urgency, c.action
      FROM messages m
      LEFT JOIN classifications c ON m.id = c.message_id
    `;
    if (organ) {
      query += ` WHERE c.organ_target = ?`;
      query += ` ORDER BY m.received_at DESC LIMIT ?`;
      return await this.env.MESH_DB.prepare(query).bind(organ, limit).all();
    }
    query += ` ORDER BY m.received_at DESC LIMIT ?`;
    return await this.env.MESH_DB.prepare(query).bind(limit).all();
  }

  /**
   * Get mesh statistics
   */
  async getStats() {
    if (!this.env.MESH_DB) return { status: 'db_unavailable' };

    const [totalMessages, byOrgan, byIntent, byEntity] = await Promise.all([
      this.env.MESH_DB.prepare('SELECT COUNT(*) as count FROM messages').first(),
      this.env.MESH_DB.prepare('SELECT organ_target, COUNT(*) as count FROM classifications GROUP BY organ_target').all(),
      this.env.MESH_DB.prepare('SELECT intent, COUNT(*) as count FROM classifications GROUP BY intent').all(),
      this.env.MESH_DB.prepare('SELECT entity_type, COUNT(*) as count FROM classifications GROUP BY entity_type').all()
    ]);

    return {
      total_messages: totalMessages?.count || 0,
      by_organ: byOrgan?.results || [],
      by_intent: byIntent?.results || [],
      by_entity: byEntity?.results || []
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleHTTP(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Type, X-Agent-Intent'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data, status = 200) => new Response(
    JSON.stringify(data, null, 2),
    { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );

  // ── Routes ──────────────────────────────────────────────────────────────────

  if (path === '/' || path === '/health') {
    return json({
      system: 'EmailAI Mesh',
      designation: 'RSHIP-MESH-EMAIL-001',
      version: VERSION,
      protocol: 'EAP-1',
      status: 'operational',
      organs: Object.keys(ORGAN_IDENTITIES).length,
      phi: PHI,
      timestamp: new Date().toISOString()
    });
  }

  if (path === '/identities') {
    return json({
      domain: 'medinatechlabs.net',
      protocol: 'EAP-1',
      identities: ORGAN_IDENTITIES
    });
  }

  if (path === '/inbox' || path.startsWith('/inbox/')) {
    const organ = path.split('/inbox/')[1] || null;
    const memory = new MemoryLayer(env);
    const inbox = await memory.getInbox(organ);
    return json({
      organ: organ || 'all',
      messages: inbox?.results || [],
      count: inbox?.results?.length || 0
    });
  }

  if (path === '/stats') {
    const memory = new MemoryLayer(env);
    const stats = await memory.getStats();
    return json({ mesh: 'EmailAI', stats });
  }

  if (path === '/classify' && request.method === 'POST') {
    const body = await request.json();
    const mockParsed = {
      id: crypto.randomUUID(),
      from: body.from || 'test@example.com',
      to: body.to || 'membrane@medinatechlabs.net',
      subject: body.subject || '',
      body: body.body || '',
      headers: body.headers || {},
      timestamp: new Date().toISOString(),
      agentType: body.headers?.['x-agent-type'] || null,
      agentIntent: body.headers?.['x-agent-intent'] || null,
      agentConfidence: body.headers?.['x-agent-confidence'] ? parseFloat(body.headers['x-agent-confidence']) : null,
      agentTarget: body.headers?.['x-agent-target'] || null,
      agentSource: body.headers?.['x-agent-source'] || null,
      agentUrgency: body.headers?.['x-agent-urgency'] || null,
      agentThread: body.headers?.['x-agent-thread'] || null,
      agentAction: body.headers?.['x-agent-action'] || null
    };
    const classification = ClassificationEngine.classify(mockParsed);
    return json({ classification });
  }

  if (path === '/route' && request.method === 'POST') {
    const body = await request.json();
    const classification = body.classification;
    const parsed = { id: crypto.randomUUID(), ...body.message };
    const router = new RoutingEngine(env);
    const routes = await router.route(classification, parsed);
    return json({ routes });
  }

  return json({ error: 'not_found', path }, 404);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL HANDLER — Cloudflare Email Routing
// ═══════════════════════════════════════════════════════════════════════════════

async function handleEmail(message, env) {
  try {
    // Layer 2 — Ingestion: Parse the email
    const parsed = await EmailParser.parse(message);

    // Layer 3 — Classification: Classify intent, entity, urgency
    const classification = ClassificationEngine.classify(parsed);

    // Layer 4 — Routing: Route to appropriate organ
    const router = new RoutingEngine(env);
    const routes = await router.route(classification, parsed);

    // Layer 5 — Action: Execute actions
    const actions = new ActionEngine(env);
    const results = await actions.execute(classification, parsed, routes);

    // Layer 6 — Memory: Store everything
    const memory = new MemoryLayer(env);
    await memory.store(parsed, classification, routes, results);

    // KV cache for fast inbox access
    if (env.MESH_INBOX) {
      await env.MESH_INBOX.put(
        `msg:${parsed.id}`,
        JSON.stringify({ parsed, classification, routes, results }),
        { expirationTtl: 60 * 60 * 24 * 30 } // 30 days
      );
    }
  } catch (error) {
    // Fail open — log error but don't reject the email
    console.error('[EmailAI Mesh] Processing error:', error.message);
    if (env.MESH_INBOX) {
      await env.MESH_INBOX.put(
        `error:${Date.now()}`,
        JSON.stringify({ error: error.message, from: message.from, to: message.to }),
        { expirationTtl: 60 * 60 * 24 * 7 }
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE HANDLER — Process batched messages
// ═══════════════════════════════════════════════════════════════════════════════

async function handleQueue(batch, env) {
  for (const msg of batch.messages) {
    try {
      const { message_id, classification, routes } = msg.body;
      // Process queued routing decisions
      console.log(`[EmailAI Mesh] Queue processing: ${message_id} → ${routes.map(r => r.target).join(', ')}`);
      msg.ack();
    } catch (error) {
      console.error('[EmailAI Mesh] Queue error:', error.message);
      msg.retry();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT — Worker entry points
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    return handleHTTP(request, env);
  },

  async email(message, env, ctx) {
    await handleEmail(message, env);
  },

  async queue(batch, env, ctx) {
    await handleQueue(batch, env);
  }
};
