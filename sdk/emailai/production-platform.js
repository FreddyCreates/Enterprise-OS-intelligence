/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║            E M A I L A I   P R O D U C T I O N   I N T E G R A T I O N       ║
 * ║                                                                              ║
 * ║  Complete Production Platform Connecting All EmailAI Components              ║
 * ║  SDK + Hub + Templates + Workflows + Organism Gates                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-PROD-EMAILAI-001
 * Version: 1.0.0
 * 
 * This module provides the unified production interface for:
 *   - EmailAI SDK client operations
 *   - Central Hub coordination
 *   - Enterprise template rendering
 *   - Workflow automation
 *   - Organism Gates integration
 *   - Real-time analytics
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const { EventEmitter } = require('events');

// SDK Components
const { 
  EmailAIClient, 
  EmailBuilder, 
  WorkflowTemplates, 
  Analytics,
  IDENTITIES,
  ENTERPRISE_USE_CASES 
} = require('./index');

// Hub Components
const { 
  CentralHubCoordinator, 
  ClassificationEngine, 
  RoutingEngine,
  ROUTING_TABLES 
} = require('./hub/central-coordinator');

// Template Components
const { 
  TemplateEngine, 
  RESPONSE_FORMATS 
} = require('./templates/enterprise-templates');

// Workflow Components
const { 
  WorkflowEngine, 
  WorkflowDefinition,
  PREBUILT_WORKFLOWS,
  WorkflowType,
  TriggerType 
} = require('./workflows/automation-engine');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PRODUCTION_VERSION = '1.0.0';
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANISM GATES INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simplified gate interface for EmailAI integration
 * (Full gates in medina-sovereign-intelligence/organism_gates_mod.js)
 */
class OrganismGatesInterface {
  constructor() {
    this.engines = {
      PHYSIKOS:    { name: 'Physics Engine',      domain: 'mechanics, fields, relativity' },
      ALGEBRAIKOS: { name: 'Algebra Engine',      domain: 'groups, rings, linear algebra' },
      LOGISMIKOS:  { name: 'Calculus Engine',     domain: 'ODEs, PDEs, transforms' },
      OIKONOMIKOS: { name: 'Economics Engine',    domain: 'game theory, equilibrium' },
      ERGASTIKOS:  { name: 'Working State Engine', domain: 'process algebra, Petri nets' },
      KOINONIKOS:  { name: 'Interpersonal Engine', domain: 'social networks, trust' }
    };
    
    this.gateStatus = {};
    for (const engine of Object.keys(this.engines)) {
      this.gateStatus[engine] = 'open';
    }
  }
  
  /**
   * Route computation to an engine
   */
  route(engine, method, params) {
    if (!this.engines[engine]) {
      throw new Error(`Unknown engine: ${engine}`);
    }
    
    if (this.gateStatus[engine] !== 'open') {
      throw new Error(`Gate to ${engine} is ${this.gateStatus[engine]}`);
    }
    
    return {
      engine,
      method,
      params,
      routed: true,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get all engine info
   */
  getEngines() {
    return { ...this.engines };
  }
  
  /**
   * Get gate status
   */
  getStatus() {
    return { ...this.gateStatus };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION PLATFORM
// ═══════════════════════════════════════════════════════════════════════════════

class EmailAIPlatform extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baseUrl: config.baseUrl || 'https://emailai.medinatechlabs.net',
      apiKey: config.apiKey || null,
      debug: config.debug || false,
      enableWorkflows: config.enableWorkflows !== false,
      enableAnalytics: config.enableAnalytics !== false,
      enableGates: config.enableGates !== false,
      ...config
    };
    
    // Initialize components
    this.client = new EmailAIClient(this.config);
    this.hub = new CentralHubCoordinator({ debug: this.config.debug });
    this.templates = new TemplateEngine();
    this.workflows = new WorkflowEngine();
    this.gates = new OrganismGatesInterface();
    
    // Register pre-built workflows
    this._registerPrebuiltWorkflows();
    
    // Wire up events
    this._setupEventForwarding();
    
    // Statistics
    this.platformStats = {
      started: Date.now(),
      emailsSent: 0,
      workflowsTriggered: 0,
      templatesRendered: 0,
      classificationsProcessed: 0,
      gateRoutes: 0
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CONNECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Connect to EmailAI Mesh
   */
  async connect() {
    const connected = await this.client.connect();
    this.emit('connected', { timestamp: Date.now() });
    return connected;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a new email builder
   */
  email() {
    return new EmailBuilder();
  }
  
  /**
   * Send an email
   */
  async send(email) {
    if (email instanceof EmailBuilder) {
      email = email.build();
    }
    
    const result = await this.client.send(email);
    this.platformStats.emailsSent++;
    this.emit('emailSent', { email, result });
    return result;
  }
  
  /**
   * Classify an email
   */
  async classify(email) {
    const classification = this.hub.classifier.classify(email);
    this.platformStats.classificationsProcessed++;
    return classification;
  }
  
  /**
   * Process an email through the full pipeline
   */
  async process(email) {
    return this.hub.process(email);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Render a template
   */
  renderTemplate(category, name, variables = {}) {
    const rendered = this.templates.render(category, name, variables);
    this.platformStats.templatesRendered++;
    return rendered;
  }
  
  /**
   * List available templates
   */
  listTemplates(category = null) {
    return this.templates.list(category);
  }
  
  /**
   * Send using a template
   */
  async sendTemplate(category, name, variables = {}) {
    const rendered = this.renderTemplate(category, name, variables);
    
    const email = this.email()
      .to(rendered.to)
      .subject(rendered.subject)
      .body(rendered.body);
    
    // Add headers
    for (const [key, value] of Object.entries(rendered.headers)) {
      if (key.startsWith('X-Agent-')) {
        const method = `with${key.replace('X-Agent-', '')}`;
        if (typeof email[method] === 'function') {
          email[method](value);
        }
      }
    }
    
    return this.send(email);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // WORKFLOW OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Register a workflow
   */
  registerWorkflow(definition) {
    return this.workflows.register(definition);
  }
  
  /**
   * Trigger a workflow
   */
  async triggerWorkflow(workflowId, data = {}) {
    const result = await this.workflows.trigger(workflowId, data);
    this.platformStats.workflowsTriggered++;
    this.emit('workflowTriggered', { workflowId, data, result });
    return result;
  }
  
  /**
   * List workflows
   */
  listWorkflows() {
    return this.workflows.listDefinitions();
  }
  
  /**
   * Get workflow status
   */
  getWorkflowStatus(instanceId) {
    return this.workflows.getInstance(instanceId);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ORGANISM GATES OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Route computation through organism gates
   */
  routeToEngine(engine, method, params) {
    const result = this.gates.route(engine, method, params);
    this.platformStats.gateRoutes++;
    this.emit('gateRouted', { engine, method, params, result });
    return result;
  }
  
  /**
   * Get available engines
   */
  getEngines() {
    return this.gates.getEngines();
  }
  
  /**
   * Get gate status
   */
  getGateStatus() {
    return this.gates.getStatus();
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // IDENTITY OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Get identity by name
   */
  getIdentity(name) {
    return this.client.getIdentity(name);
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
   * Get all bots
   */
  getBots() {
    return IDENTITIES.bots;
  }
  
  /**
   * Get all identities
   */
  getAllIdentities() {
    return IDENTITIES;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // USE CASE OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Get enterprise use case
   */
  getUseCase(domain) {
    return ENTERPRISE_USE_CASES[domain] || null;
  }
  
  /**
   * List all use cases
   */
  listUseCases() {
    return ENTERPRISE_USE_CASES;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Get platform statistics
   */
  getStats() {
    const uptime = Date.now() - this.platformStats.started;
    
    return {
      version: PRODUCTION_VERSION,
      uptime,
      uptimeFormatted: this._formatUptime(uptime),
      platform: { ...this.platformStats },
      client: this.client.stats,
      hub: this.hub.status(),
      workflows: this.workflows.getStats(),
      gates: this.gates.getStatus()
    };
  }
  
  /**
   * Get hub analytics
   */
  getAnalytics() {
    return this.hub.analytics();
  }
  
  /**
   * Calculate φ-weighted score
   */
  phiScore(values, weights = null) {
    return Analytics.phiScore(values, weights);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // QUICK ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  /**
   * Quick security alert
   */
  async securityAlert(details) {
    return this.sendTemplate('security', 'alert', details);
  }
  
  /**
   * Quick incident report
   */
  async incidentReport(incident) {
    return this.sendTemplate('devops', 'incident-report', incident);
  }
  
  /**
   * Quick cost analysis request
   */
  async costAnalysis(data) {
    return this.sendTemplate('finance', 'cost-analysis', data);
  }
  
  /**
   * Quick support response
   */
  async supportResponse(ticket) {
    return this.sendTemplate('sales', 'support-response', ticket);
  }
  
  /**
   * Quick contract review
   */
  async contractReview(contract) {
    return this.sendTemplate('legal', 'contract-review', contract);
  }
  
  /**
   * Quick threat brief
   */
  async threatBrief(threat) {
    return this.sendTemplate('threat', 'brief', threat);
  }
  
  /**
   * Quick system broadcast
   */
  async broadcast(announcement) {
    return this.sendTemplate('system', 'broadcast', announcement);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  
  _registerPrebuiltWorkflows() {
    for (const [name, workflow] of Object.entries(PREBUILT_WORKFLOWS)) {
      try {
        this.workflows.register(workflow);
      } catch (error) {
        if (this.config.debug) {
          console.warn(`Failed to register workflow ${name}:`, error.message);
        }
      }
    }
  }
  
  _setupEventForwarding() {
    // Forward hub events
    this.hub.on('classified', data => this.emit('classified', data));
    this.hub.on('routed', data => this.emit('routed', data));
    this.hub.on('error', data => this.emit('error', data));
    
    // Forward workflow events
    this.workflows.on('instanceStarted', data => this.emit('workflowStarted', data));
    this.workflows.on('instanceCompleted', data => this.emit('workflowCompleted', data));
    this.workflows.on('instanceFailed', data => this.emit('workflowFailed', data));
    
    // Forward client events
    this.client.on('connected', data => this.emit('clientConnected', data));
    this.client.on('sent', data => this.emit('clientSent', data));
    this.client.on('error', data => this.emit('clientError', data));
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
// DEMO & TESTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run production demo
 */
async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           EmailAI Production Platform Demo                        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  const platform = new EmailAIPlatform({ debug: true });
  
  // 1. Show identities
  console.log('📧 SOVEREIGN IDENTITIES');
  console.log('─'.repeat(50));
  const organs = platform.getOrgans();
  for (const [name, info] of Object.entries(organs)) {
    console.log(`  ${name.padEnd(12)} → ${info.email}`);
  }
  console.log();
  
  // 2. Show templates
  console.log('📝 AVAILABLE TEMPLATES');
  console.log('─'.repeat(50));
  const categories = ['security', 'devops', 'finance', 'sales', 'legal', 'research', 'threat', 'system'];
  for (const cat of categories) {
    const templates = platform.listTemplates(cat);
    console.log(`  ${cat}: ${templates.length} templates`);
  }
  console.log();
  
  // 3. Show workflows
  console.log('⚙️  REGISTERED WORKFLOWS');
  console.log('─'.repeat(50));
  const workflows = platform.listWorkflows();
  for (const wf of workflows) {
    console.log(`  ${wf.name} (${wf.steps.length} steps)`);
  }
  console.log();
  
  // 4. Show engines
  console.log('🔬 ORGANISM ENGINES');
  console.log('─'.repeat(50));
  const engines = platform.getEngines();
  for (const [name, info] of Object.entries(engines)) {
    console.log(`  ${name.padEnd(12)} → ${info.name}`);
  }
  console.log();
  
  // 5. Show use cases
  console.log('💼 ENTERPRISE USE CASES');
  console.log('─'.repeat(50));
  const useCases = platform.listUseCases();
  for (const [domain, config] of Object.entries(useCases)) {
    console.log(`  ${domain.padEnd(25)} → ${config.organ}`);
  }
  console.log();
  
  // 6. Demo email creation
  console.log('✉️  DEMO EMAIL');
  console.log('─'.repeat(50));
  const email = platform.email()
    .to('membrane')
    .from('sentinel')
    .subject('[ALERT] Demo Security Alert')
    .body('This is a demo security alert.')
    .withIntent('alert')
    .withUrgency('high')
    .build();
  console.log(`  To: ${email.to}`);
  console.log(`  Subject: ${email.subject}`);
  console.log(`  Intent: ${email.headers['X-Agent-Intent']}`);
  console.log();
  
  // 7. Demo classification
  console.log('🔍 DEMO CLASSIFICATION');
  console.log('─'.repeat(50));
  const classification = await platform.classify({
    subject: 'CRITICAL: Server breach detected',
    body: 'We detected a potential breach on server-001. Immediate action required.'
  });
  console.log(`  Intent: ${classification.intent}`);
  console.log(`  Urgency: ${classification.urgency}`);
  console.log(`  Confidence: ${classification.confidence.toFixed(3)}`);
  console.log();
  
  // 8. Show stats
  console.log('📊 PLATFORM STATS');
  console.log('─'.repeat(50));
  const stats = platform.getStats();
  console.log(`  Version: ${stats.version}`);
  console.log(`  Uptime: ${stats.uptimeFormatted}`);
  console.log(`  Workflows: ${stats.workflows.definitions}`);
  console.log();
  
  console.log('✅ Demo complete!\n');
  
  return platform;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main platform
  EmailAIPlatform,
  
  // Re-export all components
  EmailAIClient,
  EmailBuilder,
  WorkflowTemplates,
  Analytics,
  CentralHubCoordinator,
  ClassificationEngine,
  RoutingEngine,
  TemplateEngine,
  WorkflowEngine,
  WorkflowDefinition,
  OrganismGatesInterface,
  
  // Data
  IDENTITIES,
  ENTERPRISE_USE_CASES,
  ROUTING_TABLES,
  RESPONSE_FORMATS,
  PREBUILT_WORKFLOWS,
  
  // Types
  WorkflowType,
  TriggerType,
  
  // Constants
  PRODUCTION_VERSION,
  PHI,
  PHI_INV,
  
  // Factory
  createPlatform: (config) => new EmailAIPlatform(config),
  
  // Demo
  runDemo
};

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
