/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                 E M A I L A I   H U B   C O O R D I N A T O R                 ║
 * ║                                                                              ║
 * ║  Central Intelligence Hub for EmailAI Mesh Coordination                      ║
 * ║  Manages routing, load balancing, and cross-organ communication              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-HUB-EMAILAI-001
 * 
 * Architecture:
 *   ┌────────────────────────────────────────────────────────────────────────────┐
 *   │                           CENTRAL HUB                                      │
 *   │                                                                            │
 *   │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                 │
 *   │   │   INGRESS   │────▶│  CLASSIFIER │────▶│   ROUTER    │                 │
 *   │   │   GATEWAY   │     │   ENGINE    │     │   ENGINE    │                 │
 *   │   └─────────────┘     └─────────────┘     └──────┬──────┘                 │
 *   │                                                   │                        │
 *   │         ┌────────────────┬───────────────┬───────┴───────┐                │
 *   │         ▼                ▼               ▼               ▼                │
 *   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
 *   │   │  ORGANS  │    │  AGENTS  │    │   BOTS   │    │  INFRA   │           │
 *   │   │   (8)    │    │   (6)    │    │   (7)    │    │   (3)    │           │
 *   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
 *   │                                                                            │
 *   │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                 │
 *   │   │  ANALYTICS  │     │   MEMORY    │     │  TELEMETRY  │                 │
 *   │   │   ENGINE    │     │   STORE     │     │   STREAM    │                 │
 *   │   └─────────────┘     └─────────────┘     └─────────────┘                 │
 *   │                                                                            │
 *   └────────────────────────────────────────────────────────────────────────────┘
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const HUB_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING TABLES
// ═══════════════════════════════════════════════════════════════════════════════

const ROUTING_TABLES = {
  // Intent-based routing
  intent: {
    alert:      ['membrane', 'vigil', 'sentinel'],
    task:       ['reflex', 'agens', 'cerebrum'],
    request:    ['nova', 'support', 'analysis'],
    info:       ['research', 'herald', 'pulse'],
    error:      ['reflex', 'membrane', 'vigil'],
    escalation: ['reflex', 'imperium', 'arbiter'],
    summary:    ['brain', 'research', 'nova']
  },
  
  // Domain-based routing
  domain: {
    'IT & Security':           'membrane',
    'DevOps / SRE':            'reflex',
    'Finance & Analytics':     'brain',
    'Sales & Customer Success': 'nova',
    'Legal & Compliance':      'identity',
    'Research & Intelligence': 'research',
    'Threat Intelligence':     'probe',
    'Adversarial Intelligence': 'surfaces'
  },
  
  // Capability-based routing
  capability: {
    analyze:    ['brain', 'cerebrum', 'research'],
    classify:   ['brain', 'probe', 'membrane'],
    predict:    ['brain', 'cerebrum'],
    alert:      ['membrane', 'vigil', 'sentinel'],
    route:      ['membrane', 'nexus', 'gate_node'],
    escalate:   ['reflex', 'imperium'],
    reply:      ['nova', 'nuntius', 'conduit'],
    synthesize: ['cerebrum', 'research'],
    fingerprint: ['probe', 'surfaces', 'sentinel'],
    verify:     ['identity', 'arbiter'],
    broadcast:  ['herald', 'nuntius'],
    monitor:    ['vigil', 'pulse']
  },
  
  // Urgency-based priority weights
  urgency: {
    critical: { weight: 1.0,   timeout: 60000,   retries: 5 },
    high:     { weight: 0.75,  timeout: 120000,  retries: 3 },
    medium:   { weight: 0.5,   timeout: 300000,  retries: 2 },
    low:      { weight: 0.25,  timeout: 600000,  retries: 1 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD BALANCER
// ═══════════════════════════════════════════════════════════════════════════════

class LoadBalancer {
  constructor() {
    this.organStats = {};
    this.lastSelection = {};
  }
  
  /**
   * Select best organ from candidates using φ-weighted round-robin
   */
  select(candidates, urgency = 'medium') {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    
    const config = ROUTING_TABLES.urgency[urgency] || ROUTING_TABLES.urgency.medium;
    
    // Get stats for each candidate
    const scored = candidates.map(organ => {
      const stats = this.organStats[organ] || { load: 0, latency: 0, errors: 0 };
      const lastUsed = this.lastSelection[organ] || 0;
      const timeSinceUsed = Date.now() - lastUsed;
      
      // φ-weighted score: lower is better
      const score = 
        stats.load * PHI +
        (stats.latency / 1000) * PHI_INV +
        stats.errors * PHI * PHI -
        (timeSinceUsed / 60000) * PHI_INV * config.weight;
      
      return { organ, score };
    });
    
    // Sort by score (ascending)
    scored.sort((a, b) => a.score - b.score);
    
    const selected = scored[0].organ;
    this.lastSelection[selected] = Date.now();
    
    return selected;
  }
  
  /**
   * Update organ statistics
   */
  updateStats(organ, stats) {
    if (!this.organStats[organ]) {
      this.organStats[organ] = { load: 0, latency: 0, errors: 0, requests: 0 };
    }
    
    const current = this.organStats[organ];
    
    // Exponential moving average
    const alpha = PHI_INV;
    current.load = current.load * (1 - alpha) + (stats.load || 0) * alpha;
    current.latency = current.latency * (1 - alpha) + (stats.latency || 0) * alpha;
    current.errors = current.errors * (1 - alpha) + (stats.errors || 0) * alpha;
    current.requests++;
    current.lastUpdate = Date.now();
  }
  
  /**
   * Get current stats for an organ
   */
  getStats(organ) {
    return this.organStats[organ] || null;
  }
  
  /**
   * Get all stats
   */
  getAllStats() {
    return { ...this.organStats };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class ClassificationEngine {
  constructor() {
    this.patterns = {
      intent: {
        alert:      /\b(alert|warning|critical|breach|attack|threat|suspicious|anomaly|detected)\b/i,
        task:       /\b(task|action|do|execute|run|trigger|deploy|update|build|create)\b/i,
        request:    /\b(request|please|need|want|ask|query|question|help|support)\b/i,
        info:       /\b(info|information|update|status|report|summary|digest|brief)\b/i,
        error:      /\b(error|fail|exception|crash|broken|down|outage|bug)\b/i,
        escalation: /\b(escalate|urgent|emergency|immediately|critical|asap|priority)\b/i,
        summary:    /\b(summary|digest|overview|brief|recap|roundup|aggregate)\b/i
      },
      domain: {
        security:   /\b(security|threat|attack|breach|firewall|scan|vulnerability)\b/i,
        devops:     /\b(deploy|incident|outage|error|alert|service|system)\b/i,
        finance:    /\b(cost|spend|budget|price|money|dollar|invoice|revenue)\b/i,
        sales:      /\b(customer|client|support|complaint|ticket|satisfaction)\b/i,
        legal:      /\b(contract|compliance|legal|obligation|audit|policy)\b/i,
        research:   /\b(research|analysis|report|insight|trend|pattern)\b/i,
        threat:     /\b(scanner|fingerprint|reconnaissance|intel|actor|ioc)\b/i
      },
      urgency: {
        critical: /\b(critical|emergency|breach|down|outage|immediately|crash)\b/i,
        high:     /\b(urgent|asap|important|priority|soon|quickly)\b/i,
        medium:   /\b(when possible|attention|review|check|please)\b/i,
        low:      /\b(fyi|info|note|reminder|later|whenever)\b/i
      }
    };
  }
  
  /**
   * Classify an email message
   */
  classify(message) {
    const text = `${message.subject || ''} ${message.body || ''}`;
    
    return {
      intent: this._classifyIntent(text),
      domain: this._classifyDomain(text),
      urgency: this._classifyUrgency(text),
      confidence: this._calculateConfidence(text),
      keywords: this._extractKeywords(text),
      entities: this._extractEntities(message),
      timestamp: Date.now()
    };
  }
  
  _classifyIntent(text) {
    let best = { intent: 'info', score: 0 };
    
    for (const [intent, pattern] of Object.entries(this.patterns.intent)) {
      const matches = (text.match(pattern) || []).length;
      if (matches > best.score) {
        best = { intent, score: matches };
      }
    }
    
    return best.intent;
  }
  
  _classifyDomain(text) {
    const scores = {};
    
    for (const [domain, pattern] of Object.entries(this.patterns.domain)) {
      scores[domain] = (text.match(pattern) || []).length;
    }
    
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : 'general';
  }
  
  _classifyUrgency(text) {
    for (const [level, pattern] of Object.entries(this.patterns.urgency)) {
      if (pattern.test(text)) return level;
    }
    return 'medium';
  }
  
  _calculateConfidence(text) {
    const totalPatterns = Object.values(this.patterns).flat().length;
    let matches = 0;
    
    for (const category of Object.values(this.patterns)) {
      for (const pattern of Object.values(category)) {
        if (pattern.test(text)) matches++;
      }
    }
    
    return Math.min(0.95, (matches / totalPatterns) * PHI);
  }
  
  _extractKeywords(text) {
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'it', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their']);
    
    const keywords = words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  _extractEntities(message) {
    const entities = {
      emails: [],
      ips: [],
      domains: [],
      numbers: []
    };
    
    const text = `${message.subject || ''} ${message.body || ''} ${message.from || ''} ${message.to || ''}`;
    
    // Email addresses
    const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emails) entities.emails = [...new Set(emails)];
    
    // IP addresses
    const ips = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
    if (ips) entities.ips = [...new Set(ips)];
    
    // Domain names
    const domains = text.match(/\b(?:[\w-]+\.)+(?:com|net|org|io|ai|tech|dev)\b/gi);
    if (domains) entities.domains = [...new Set(domains)];
    
    // Numbers (money, percentages, counts)
    const numbers = text.match(/\$?[\d,]+(?:\.\d+)?%?/g);
    if (numbers) entities.numbers = numbers.slice(0, 10);
    
    return entities;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class RoutingEngine {
  constructor() {
    this.loadBalancer = new LoadBalancer();
  }
  
  /**
   * Route a message to appropriate organ(s)
   */
  route(message, classification) {
    const candidates = this._findCandidates(classification);
    const selected = this._selectBest(candidates, classification);
    
    return {
      primary: selected,
      candidates,
      fallback: candidates.filter(c => c !== selected),
      routing: {
        method: this._determineMethod(classification),
        timeout: ROUTING_TABLES.urgency[classification.urgency]?.timeout || 300000,
        retries: ROUTING_TABLES.urgency[classification.urgency]?.retries || 2
      },
      timestamp: Date.now()
    };
  }
  
  _findCandidates(classification) {
    const candidates = new Set();
    
    // Add intent-based candidates
    const intentCandidates = ROUTING_TABLES.intent[classification.intent] || [];
    intentCandidates.forEach(c => candidates.add(c));
    
    // Add domain-based candidate
    const domainOrgan = ROUTING_TABLES.domain[classification.domain];
    if (domainOrgan) candidates.add(domainOrgan);
    
    // Add capability-based candidates (from keywords)
    for (const keyword of classification.keywords || []) {
      const capCandidates = ROUTING_TABLES.capability[keyword] || [];
      capCandidates.forEach(c => candidates.add(c));
    }
    
    return [...candidates];
  }
  
  _selectBest(candidates, classification) {
    if (candidates.length === 0) return 'nova'; // Default fallback
    return this.loadBalancer.select(candidates, classification.urgency);
  }
  
  _determineMethod(classification) {
    if (classification.urgency === 'critical') return 'direct';
    if (classification.intent === 'escalation') return 'chain';
    if (classification.intent === 'summary') return 'aggregate';
    return 'standard';
  }
  
  /**
   * Update routing stats
   */
  updateStats(organ, stats) {
    this.loadBalancer.updateStats(organ, stats);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL HUB COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════

class CentralHubCoordinator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      debug: config.debug || false,
      telemetryEnabled: config.telemetryEnabled !== false,
      analyticsEnabled: config.analyticsEnabled !== false,
      ...config
    };
    
    this.classifier = new ClassificationEngine();
    this.router = new RoutingEngine();
    
    this.stats = {
      processed: 0,
      routed: 0,
      errors: 0,
      avgLatency: 0,
      startTime: Date.now()
    };
    
    this.memory = {
      recentMessages: [],
      patterns: {},
      threads: {}
    };
  }
  
  /**
   * Process an incoming message through the hub
   */
  async process(message) {
    const startTime = Date.now();
    
    try {
      // 1. Classify
      const classification = this.classifier.classify(message);
      this.emit('classified', { message, classification });
      
      // 2. Route
      const routing = this.router.route(message, classification);
      this.emit('routed', { message, classification, routing });
      
      // 3. Store in memory
      this._storeInMemory(message, classification, routing);
      
      // 4. Update stats
      const latency = Date.now() - startTime;
      this._updateStats(latency, true);
      
      // 5. Return result
      return {
        success: true,
        messageId: message.id || crypto.randomUUID?.() || `msg_${Date.now()}`,
        classification,
        routing,
        latency,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this._updateStats(Date.now() - startTime, false);
      this.emit('error', { message, error });
      throw error;
    }
  }
  
  /**
   * Get hub status
   */
  status() {
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      version: HUB_VERSION,
      uptime,
      uptimeFormatted: this._formatUptime(uptime),
      stats: { ...this.stats },
      routingStats: this.router.loadBalancer.getAllStats(),
      memorySize: this.memory.recentMessages.length,
      activeThreads: Object.keys(this.memory.threads).length
    };
  }
  
  /**
   * Get analytics
   */
  analytics() {
    const intentCounts = {};
    const domainCounts = {};
    const urgencyCounts = {};
    const organCounts = {};
    
    for (const entry of this.memory.recentMessages) {
      const { classification, routing } = entry;
      
      intentCounts[classification.intent] = (intentCounts[classification.intent] || 0) + 1;
      domainCounts[classification.domain] = (domainCounts[classification.domain] || 0) + 1;
      urgencyCounts[classification.urgency] = (urgencyCounts[classification.urgency] || 0) + 1;
      organCounts[routing.primary] = (organCounts[routing.primary] || 0) + 1;
    }
    
    return {
      totalProcessed: this.stats.processed,
      avgLatency: this.stats.avgLatency,
      distributions: {
        intent: intentCounts,
        domain: domainCounts,
        urgency: urgencyCounts,
        organ: organCounts
      },
      topPatterns: this._getTopPatterns(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Search memory
   */
  search(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const entry of this.memory.recentMessages) {
      const text = `${entry.message.subject || ''} ${entry.message.body || ''}`.toLowerCase();
      if (text.includes(queryLower)) {
        results.push(entry);
      }
    }
    
    return results.slice(0, 50);
  }
  
  /**
   * Get thread history
   */
  getThread(threadId) {
    return this.memory.threads[threadId] || [];
  }
  
  _storeInMemory(message, classification, routing) {
    const entry = {
      message,
      classification,
      routing,
      timestamp: Date.now()
    };
    
    // Store in recent messages (limit to 1000)
    this.memory.recentMessages.push(entry);
    if (this.memory.recentMessages.length > 1000) {
      this.memory.recentMessages.shift();
    }
    
    // Store in thread if thread ID present
    const threadId = message.threadId || message.headers?.['x-agent-thread'];
    if (threadId) {
      if (!this.memory.threads[threadId]) {
        this.memory.threads[threadId] = [];
      }
      this.memory.threads[threadId].push(entry);
    }
    
    // Update pattern tracking
    for (const keyword of classification.keywords || []) {
      this.memory.patterns[keyword] = (this.memory.patterns[keyword] || 0) + 1;
    }
  }
  
  _updateStats(latency, success) {
    this.stats.processed++;
    if (success) {
      this.stats.routed++;
    } else {
      this.stats.errors++;
    }
    
    // Exponential moving average for latency
    this.stats.avgLatency = this.stats.avgLatency * (1 - PHI_INV) + latency * PHI_INV;
  }
  
  _getTopPatterns() {
    return Object.entries(this.memory.patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pattern, count]) => ({ pattern, count }));
  }
  
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  CentralHubCoordinator,
  ClassificationEngine,
  RoutingEngine,
  LoadBalancer,
  ROUTING_TABLES,
  HUB_VERSION,
  PHI,
  PHI_INV,
  
  // Factory
  createHub: (config) => new CentralHubCoordinator(config)
};
