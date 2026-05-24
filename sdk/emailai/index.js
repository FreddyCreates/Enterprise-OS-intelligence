/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     E M A I L A I   S D K   v 1 . 0 . 0                       ║
 * ║                                                                              ║
 * ║  The Complete Client Library for EmailAI Mesh Integration                    ║
 * ║  Sovereign Email Intelligence for Enterprise AGI Systems                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-SDK-EMAILAI-001
 * Protocol: EAP-1 (Email Agent Protocol v1)
 * 
 * Features:
 *   - Multi-identity email management (29 sovereign identities)
 *   - AI-powered classification and routing
 *   - Enterprise use-case templates
 *   - Workflow automation triggers
 *   - Organism integration via gates
 *   - Analytics and reporting
 *   - Real-time monitoring
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SDK_VERSION = '1.0.0';
const PROTOCOL_VERSION = 'EAP-1';
const DEFAULT_DOMAIN = 'medinatechlabs.net';

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY REGISTRY - All 29 Sovereign Identities
// ═══════════════════════════════════════════════════════════════════════════════

const IDENTITIES = {
  // Core Organs (8)
  organs: {
    membrane:  { email: 'membrane@medinatechlabs.net',  domain: 'IT & Security', capabilities: ['alert', 'route', 'block', 'escalate'] },
    brain:     { email: 'julia@medinatechlabs.net',     domain: 'Finance & Analytics', capabilities: ['classify', 'predict', 'analyze', 'summarize'] },
    identity:  { email: 'identity@medinatechlabs.net',  domain: 'Legal & Compliance', capabilities: ['onboard', 'stake', 'verify', 'audit'] },
    reflex:    { email: 'reflex@medinatechlabs.net',    domain: 'DevOps / SRE', capabilities: ['trigger_workflow', 'escalate', 'chain', 'schedule'] },
    surfaces:  { email: 'synthetic@medinatechlabs.net', domain: 'Adversarial Intelligence', capabilities: ['deceive', 'log', 'fingerprint', 'trap'] },
    nova:      { email: 'nova@medinatechlabs.net',      domain: 'Sales & Customer Success', capabilities: ['reply', 'notify', 'report', 'communicate'] },
    research:  { email: 'research@medinatechlabs.net',  domain: 'Research & Intelligence', capabilities: ['report', 'insight', 'synthesize', 'publish'] },
    probe:     { email: 'probe@medinatechlabs.net',     domain: 'Threat Intelligence', capabilities: ['fingerprint', 'classify', 'track', 'alert'] }
  },
  
  // Agents (6)
  agents: {
    agens:    { email: 'agens@medinatechlabs.net',    capabilities: ['orchestrate', 'command', 'showcase', 'drill'] },
    cerebrum: { email: 'cerebrum@medinatechlabs.net', capabilities: ['reason', 'synthesize', 'learn', 'infer'] },
    animus:   { email: 'animus@medinatechlabs.net',   capabilities: ['sense', 'feel', 'motivate', 'adapt'] },
    nexus:    { email: 'nexus@medinatechlabs.net',    capabilities: ['connect', 'bind', 'coordinate', 'relay'] },
    vigil:    { email: 'vigil@medinatechlabs.net',    capabilities: ['watch', 'monitor', 'alert', 'guard'] },
    cursor:   { email: 'cursor@medinatechlabs.net',   capabilities: ['navigate', 'point', 'track', 'select'] }
  },
  
  // Infrastructure (3)
  infrastructure: {
    gate_node:      { email: 'gate@medinatechlabs.net',  capabilities: ['gate', 'filter', 'route', 'protect'] },
    cache_organism: { email: 'cache@medinatechlabs.net', capabilities: ['cache', 'learn', 'respond', 'adapt'] },
    emailai_mesh:   { email: 'mesh@medinatechlabs.net',  capabilities: ['ingest', 'classify', 'route', 'coordinate'] }
  },
  
  // Bots (7)
  bots: {
    herald:   { email: 'herald@medinatechlabs.net',   capabilities: ['announce', 'broadcast', 'notify', 'publish'] },
    conduit:  { email: 'conduit@medinatechlabs.net',  capabilities: ['relay', 'bridge', 'forward', 'translate'] },
    pulse:    { email: 'pulse@medinatechlabs.net',    capabilities: ['heartbeat', 'health', 'vitals', 'ping'] },
    sentinel: { email: 'sentinel@medinatechlabs.net', capabilities: ['detect', 'defend', 'scan', 'report'] },
    arbiter:  { email: 'arbiter@medinatechlabs.net',  capabilities: ['decide', 'arbitrate', 'enforce', 'resolve'] },
    imperium: { email: 'imperium@medinatechlabs.net', capabilities: ['command', 'delegate', 'govern', 'authorize'] },
    nuntius:  { email: 'nuntius@medinatechlabs.net',  capabilities: ['deliver', 'message', 'notify', 'dispatch'] }
  },
  
  // Client-Facing (5)
  clientFacing: {
    analysis:     { email: 'analysis@medinatechlabs.net',     routes_to: 'brain',    domain: 'Finance & Analytics' },
    support:      { email: 'support@medinatechlabs.net',      routes_to: 'nova',     domain: 'Sales & Customer Success' },
    automation:   { email: 'automation@medinatechlabs.net',   routes_to: 'reflex',   domain: 'DevOps / SRE' },
    security:     { email: 'security@medinatechlabs.net',     routes_to: 'membrane', domain: 'IT & Security' },
    intelligence: { email: 'intelligence@medinatechlabs.net', routes_to: 'probe',    domain: 'Threat Intelligence' }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE USE CASES - Domain-specific AI configurations
// ═══════════════════════════════════════════════════════════════════════════════

const ENTERPRISE_USE_CASES = {
  'IT & Security': {
    organ: 'membrane',
    email: 'security@medinatechlabs.net',
    replaces: ['Splunk', 'CrowdStrike', 'Palo Alto', 'Security analysts'],
    capabilities: ['traffic analysis', 'threat classification', 'firewall recommendations', 'scanner fingerprinting']
  },
  'DevOps / SRE': {
    organ: 'reflex',
    email: 'automation@medinatechlabs.net',
    replaces: ['PagerDuty', 'OpsGenie', 'Slack war rooms'],
    capabilities: ['incident correlation', 'root cause analysis', 'action plan generation', 'pattern detection']
  },
  'Finance & Analytics': {
    organ: 'brain',
    email: 'analysis@medinatechlabs.net',
    replaces: ['Cloudability', 'FinOps dashboards', 'Manual spreadsheets'],
    capabilities: ['cost analysis', 'optimization modeling', 'trend prediction', 'resource planning']
  },
  'Sales & Customer Success': {
    organ: 'nova',
    email: 'support@medinatechlabs.net',
    replaces: ['Zendesk', 'Salesforce Einstein', 'Slack channels'],
    capabilities: ['complaint clustering', 'churn prediction', 'sentiment analysis', 'health reporting']
  },
  'Legal & Compliance': {
    organ: 'identity',
    email: 'identity@medinatechlabs.net',
    replaces: ['Contract review teams', 'Legal AI tools', 'Manual redlining'],
    capabilities: ['contract scanning', 'obligation extraction', 'risk flagging', 'compliance summarization']
  },
  'Research & Intelligence': {
    organ: 'research',
    email: 'research@medinatechlabs.net',
    replaces: ['Research analysts', 'Manual reports', 'Intelligence feeds'],
    capabilities: ['report synthesis', 'insight generation', 'trend analysis', 'knowledge publishing']
  },
  'Threat Intelligence': {
    organ: 'probe',
    email: 'intelligence@medinatechlabs.net',
    replaces: ['Recorded Future', 'Shodan', 'Manual threat hunting'],
    capabilities: ['scanner fingerprinting', 'actor tracking', 'surface monitoring', 'IOC generation']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL BUILDER - Construct EAP-1 compliant emails
// ═══════════════════════════════════════════════════════════════════════════════

class EmailBuilder {
  constructor() {
    this.email = {
      to: null,
      from: null,
      subject: '',
      body: '',
      headers: {},
      attachments: []
    };
  }
  
  /**
   * Set recipient by identity name or email
   */
  to(identity) {
    if (typeof identity === 'string') {
      // Check if it's an identity name
      const resolved = this._resolveIdentity(identity);
      this.email.to = resolved || identity;
    } else {
      this.email.to = identity;
    }
    return this;
  }
  
  /**
   * Set sender identity
   */
  from(identity) {
    const resolved = this._resolveIdentity(identity);
    this.email.from = resolved || identity;
    return this;
  }
  
  /**
   * Set subject line
   */
  subject(text) {
    this.email.subject = text;
    return this;
  }
  
  /**
   * Set body content
   */
  body(content) {
    this.email.body = content;
    return this;
  }
  
  /**
   * Add EAP-1 protocol header
   */
  withIntent(intent) {
    this.email.headers['X-Agent-Intent'] = intent;
    return this;
  }
  
  withConfidence(confidence) {
    this.email.headers['X-Agent-Confidence'] = String(confidence);
    return this;
  }
  
  withUrgency(urgency) {
    this.email.headers['X-Agent-Urgency'] = urgency;
    return this;
  }
  
  withTarget(organ) {
    this.email.headers['X-Agent-Target'] = organ;
    return this;
  }
  
  withSource(source) {
    this.email.headers['X-Agent-Source'] = source;
    return this;
  }
  
  withThread(threadId) {
    this.email.headers['X-Agent-Thread'] = threadId;
    return this;
  }
  
  withAction(action) {
    this.email.headers['X-Agent-Action'] = action;
    return this;
  }
  
  withType(type) {
    this.email.headers['X-Agent-Type'] = type;
    return this;
  }
  
  /**
   * Add attachment
   */
  attach(filename, content, mimeType = 'application/octet-stream') {
    this.email.attachments.push({ filename, content, mimeType });
    return this;
  }
  
  /**
   * Build the email object
   */
  build() {
    if (!this.email.to) throw new Error('Recipient required');
    if (!this.email.subject) throw new Error('Subject required');
    
    // Add protocol version header
    this.email.headers['X-EmailAI-Protocol'] = PROTOCOL_VERSION;
    this.email.headers['X-EmailAI-SDK'] = SDK_VERSION;
    
    return { ...this.email };
  }
  
  _resolveIdentity(name) {
    // Search through all identity categories
    for (const category of Object.values(IDENTITIES)) {
      if (category[name]) {
        return category[name].email;
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAILAI CLIENT - Main SDK interface
// ═══════════════════════════════════════════════════════════════════════════════

class EmailAIClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baseUrl: config.baseUrl || 'https://emailai.medinatechlabs.net',
      apiKey: config.apiKey || null,
      domain: config.domain || DEFAULT_DOMAIN,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      debug: config.debug || false
    };
    
    this.stats = {
      sent: 0,
      received: 0,
      classified: 0,
      routed: 0,
      errors: 0
    };
    
    this.connected = false;
  }
  
  /**
   * Initialize connection to EmailAI Mesh
   */
  async connect() {
    try {
      const response = await this._request('GET', '/health');
      this.connected = response.status === 'healthy';
      this.emit('connected', { timestamp: new Date().toISOString() });
      return this.connected;
    } catch (error) {
      this.emit('error', { type: 'connection', error });
      throw error;
    }
  }
  
  /**
   * Send an email through the mesh
   */
  async send(email) {
    if (email instanceof EmailBuilder) {
      email = email.build();
    }
    
    try {
      const response = await this._request('POST', '/send', email);
      this.stats.sent++;
      this.emit('sent', { email, response });
      return response;
    } catch (error) {
      this.stats.errors++;
      this.emit('error', { type: 'send', error, email });
      throw error;
    }
  }
  
  /**
   * Classify an email (get intent, urgency, target organ)
   */
  async classify(email) {
    try {
      const response = await this._request('POST', '/classify', email);
      this.stats.classified++;
      this.emit('classified', { email, classification: response });
      return response;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Route an email to appropriate organ
   */
  async route(email, classification = null) {
    try {
      const payload = { email, classification };
      const response = await this._request('POST', '/route', payload);
      this.stats.routed++;
      this.emit('routed', { email, routing: response });
      return response;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Get inbox for a specific organ
   */
  async getInbox(organ = null) {
    const path = organ ? `/inbox/${organ}` : '/inbox';
    return this._request('GET', path);
  }
  
  /**
   * Get all organ identities
   */
  async getIdentities() {
    return this._request('GET', '/identities');
  }
  
  /**
   * Get mesh statistics
   */
  async getStats() {
    return this._request('GET', '/stats');
  }
  
  /**
   * Get enterprise use-cases
   */
  async getUseCases() {
    return this._request('GET', '/enterprise/use-cases');
  }
  
  /**
   * Onboard a new enterprise domain
   */
  async onboardEnterprise(domain, config) {
    return this._request('POST', '/enterprise/onboard', { domain, ...config });
  }
  
  /**
   * Create a new email builder
   */
  email() {
    return new EmailBuilder();
  }
  
  /**
   * Get identity by name
   */
  getIdentity(name) {
    for (const category of Object.values(IDENTITIES)) {
      if (category[name]) {
        return { name, ...category[name] };
      }
    }
    return null;
  }
  
  /**
   * Get all organs
   */
  getOrgans() {
    return IDENTITIES.organs;
  }
  
  /**
   * Get all agents
   */
  getAgents() {
    return IDENTITIES.agents;
  }
  
  /**
   * Get use case by domain
   */
  getUseCase(domain) {
    return ENTERPRISE_USE_CASES[domain] || null;
  }
  
  /**
   * Get SDK version
   */
  get version() {
    return SDK_VERSION;
  }
  
  /**
   * Get protocol version
   */
  get protocol() {
    return PROTOCOL_VERSION;
  }
  
  /**
   * Internal HTTP request helper
   */
  async _request(method, path, body = null) {
    const url = `${this.config.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-EmailAI-SDK': SDK_VERSION
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    const options = {
      method,
      headers,
      timeout: this.config.timeout
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    // In Node.js environment
    if (typeof fetch !== 'undefined') {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
    
    // Fallback for environments without fetch
    return this._mockResponse(method, path, body);
  }
  
  /**
   * Mock response for testing/demo
   */
  _mockResponse(method, path, body) {
    if (path === '/health') {
      return { status: 'healthy', version: SDK_VERSION, protocol: PROTOCOL_VERSION };
    }
    if (path === '/identities') {
      return IDENTITIES;
    }
    if (path === '/enterprise/use-cases') {
      return ENTERPRISE_USE_CASES;
    }
    return { success: true, method, path, body };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW TEMPLATES - Pre-built automation patterns
// ═══════════════════════════════════════════════════════════════════════════════

const WorkflowTemplates = {
  /**
   * Security Alert workflow
   */
  securityAlert: (details) => new EmailBuilder()
    .to('membrane')
    .from('sentinel')
    .subject(`[ALERT] ${details.title}`)
    .body(details.description)
    .withIntent('alert')
    .withUrgency(details.severity || 'high')
    .withType('bot')
    .withAction('analyze')
    .build(),
  
  /**
   * Incident Escalation workflow
   */
  incidentEscalation: (incident) => new EmailBuilder()
    .to('reflex')
    .from('vigil')
    .subject(`[INCIDENT] ${incident.title}`)
    .body(JSON.stringify(incident, null, 2))
    .withIntent('escalation')
    .withUrgency('critical')
    .withType('agent')
    .withAction('trigger_workflow')
    .build(),
  
  /**
   * Analytics Request workflow
   */
  analyticsRequest: (query) => new EmailBuilder()
    .to('brain')
    .from('analysis')
    .subject(`[ANALYSIS] ${query.title}`)
    .body(query.description)
    .withIntent('request')
    .withUrgency('medium')
    .withType('client-facing')
    .withAction('analyze')
    .build(),
  
  /**
   * Customer Support workflow
   */
  customerSupport: (ticket) => new EmailBuilder()
    .to('nova')
    .from('support')
    .subject(`[SUPPORT] ${ticket.subject}`)
    .body(ticket.message)
    .withIntent('request')
    .withUrgency(ticket.priority || 'medium')
    .withType('client-facing')
    .withAction('reply')
    .build(),
  
  /**
   * Compliance Check workflow
   */
  complianceCheck: (document) => new EmailBuilder()
    .to('identity')
    .from('arbiter')
    .subject(`[COMPLIANCE] Review: ${document.name}`)
    .body(document.content)
    .withIntent('task')
    .withUrgency('medium')
    .withType('bot')
    .withAction('verify')
    .build(),
  
  /**
   * Research Request workflow
   */
  researchRequest: (topic) => new EmailBuilder()
    .to('research')
    .from('cerebrum')
    .subject(`[RESEARCH] ${topic.title}`)
    .body(topic.query)
    .withIntent('request')
    .withUrgency('low')
    .withType('agent')
    .withAction('synthesize')
    .build(),
  
  /**
   * Threat Intel workflow
   */
  threatIntel: (threat) => new EmailBuilder()
    .to('probe')
    .from('sentinel')
    .subject(`[THREAT] ${threat.indicator}`)
    .body(JSON.stringify(threat, null, 2))
    .withIntent('alert')
    .withUrgency('high')
    .withType('bot')
    .withAction('fingerprint')
    .build(),
  
  /**
   * System Health Check workflow
   */
  healthCheck: () => new EmailBuilder()
    .to('pulse')
    .from('vigil')
    .subject('[HEALTH] System vitals check')
    .body('Requesting current system health status')
    .withIntent('info')
    .withUrgency('low')
    .withType('agent')
    .withAction('ping')
    .build(),
  
  /**
   * Broadcast Announcement workflow
   */
  broadcast: (announcement) => new EmailBuilder()
    .to('herald')
    .from('imperium')
    .subject(`[BROADCAST] ${announcement.title}`)
    .body(announcement.message)
    .withIntent('info')
    .withUrgency(announcement.urgency || 'medium')
    .withType('bot')
    .withAction('broadcast')
    .build()
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const Analytics = {
  /**
   * Calculate φ-weighted score
   */
  phiScore: (values, weights = null) => {
    if (!weights) {
      weights = values.map((_, i) => Math.pow(PHI, -i));
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
  },
  
  /**
   * Calculate urgency score
   */
  urgencyScore: (urgency) => {
    const scores = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    return scores[urgency] || 0.5;
  },
  
  /**
   * Calculate confidence from multiple sources
   */
  aggregateConfidence: (confidences) => {
    if (confidences.length === 0) return 0;
    return Analytics.phiScore(confidences);
  },
  
  /**
   * Time-weighted decay
   */
  timeDecay: (value, ageMs, halfLifeMs = 3600000) => {
    return value * Math.pow(0.5, ageMs / halfLifeMs);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main client
  EmailAIClient,
  
  // Builders
  EmailBuilder,
  
  // Templates
  WorkflowTemplates,
  
  // Analytics
  Analytics,
  
  // Data
  IDENTITIES,
  ENTERPRISE_USE_CASES,
  
  // Constants
  SDK_VERSION,
  PROTOCOL_VERSION,
  DEFAULT_DOMAIN,
  PHI,
  PHI_INV,
  
  // Factory function
  createClient: (config) => new EmailAIClient(config)
};
