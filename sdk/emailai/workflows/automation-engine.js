/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                 W O R K F L O W   A U T O M A T I O N   E N G I N E          ║
 * ║                                                                              ║
 * ║  Event-Driven Workflow Automation for EmailAI Mesh                           ║
 * ║  Trigger, chain, and orchestrate cross-organ intelligence                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Official Designation: RSHIP-2026-WORKFLOW-EMAILAI-001
 * 
 * Workflow Types:
 *   1. TRIGGER    - Event-based activation
 *   2. CHAIN      - Sequential multi-step execution
 *   3. PARALLEL   - Concurrent multi-organ execution
 *   4. CONDITIONAL - Decision-tree execution
 *   5. SCHEDULED  - Time-based execution
 *   6. REACTIVE   - Response-driven execution
 * 
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const WORKFLOW_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const WorkflowType = {
  TRIGGER:     'trigger',
  CHAIN:       'chain',
  PARALLEL:    'parallel',
  CONDITIONAL: 'conditional',
  SCHEDULED:   'scheduled',
  REACTIVE:    'reactive'
};

const WorkflowStatus = {
  PENDING:    'pending',
  RUNNING:    'running',
  COMPLETED:  'completed',
  FAILED:     'failed',
  CANCELLED:  'cancelled',
  PAUSED:     'paused'
};

const TriggerType = {
  EMAIL:     'email',
  WEBHOOK:   'webhook',
  SCHEDULE:  'schedule',
  EVENT:     'event',
  THRESHOLD: 'threshold',
  MANUAL:    'manual'
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW STEP
// ═══════════════════════════════════════════════════════════════════════════════

class WorkflowStep {
  constructor(config) {
    this.id = config.id || `step_${Date.now()}`;
    this.name = config.name;
    this.organ = config.organ;
    this.action = config.action;
    this.input = config.input || {};
    this.timeout = config.timeout || 300000; // 5 minutes default
    this.retries = config.retries || 2;
    this.onSuccess = config.onSuccess || null;
    this.onFailure = config.onFailure || null;
    this.condition = config.condition || null;
    
    this.status = WorkflowStatus.PENDING;
    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
  }
  
  /**
   * Execute the step
   */
  async execute(context, executor) {
    // Check condition
    if (this.condition && !this._evaluateCondition(this.condition, context)) {
      this.status = WorkflowStatus.COMPLETED;
      this.result = { skipped: true, reason: 'condition_not_met' };
      return this.result;
    }
    
    this.status = WorkflowStatus.RUNNING;
    this.startTime = Date.now();
    
    let attempts = 0;
    let lastError = null;
    
    while (attempts <= this.retries) {
      try {
        const resolvedInput = this._resolveInput(this.input, context);
        this.result = await executor.executeStep(this.organ, this.action, resolvedInput);
        this.status = WorkflowStatus.COMPLETED;
        this.endTime = Date.now();
        return this.result;
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts <= this.retries) {
          await this._wait(1000 * Math.pow(PHI, attempts)); // Exponential backoff
        }
      }
    }
    
    this.status = WorkflowStatus.FAILED;
    this.error = lastError;
    this.endTime = Date.now();
    throw lastError;
  }
  
  _evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      return condition(context);
    }
    
    // Simple condition evaluation
    if (condition.field && condition.operator && condition.value !== undefined) {
      const fieldValue = this._getNestedValue(context, condition.field);
      
      switch (condition.operator) {
        case 'equals': return fieldValue === condition.value;
        case 'notEquals': return fieldValue !== condition.value;
        case 'greaterThan': return fieldValue > condition.value;
        case 'lessThan': return fieldValue < condition.value;
        case 'contains': return String(fieldValue).includes(condition.value);
        case 'matches': return new RegExp(condition.value).test(String(fieldValue));
        case 'exists': return fieldValue !== undefined && fieldValue !== null;
        default: return true;
      }
    }
    
    return true;
  }
  
  _resolveInput(input, context) {
    if (typeof input === 'function') {
      return input(context);
    }
    
    const resolved = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const path = value.slice(2, -2).trim();
        resolved[key] = this._getNestedValue(context, path);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this._resolveInput(value, context);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
  
  _getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
  
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

class WorkflowDefinition {
  constructor(config) {
    this.id = config.id || `workflow_${Date.now()}`;
    this.name = config.name;
    this.description = config.description || '';
    this.type = config.type || WorkflowType.CHAIN;
    this.trigger = config.trigger || { type: TriggerType.MANUAL };
    this.steps = (config.steps || []).map(s => new WorkflowStep(s));
    this.metadata = config.metadata || {};
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  
  /**
   * Add a step to the workflow
   */
  addStep(stepConfig) {
    const step = new WorkflowStep(stepConfig);
    this.steps.push(step);
    this.updatedAt = Date.now();
    return this;
  }
  
  /**
   * Validate the workflow definition
   */
  validate() {
    const errors = [];
    
    if (!this.name) errors.push('Workflow name is required');
    if (this.steps.length === 0) errors.push('Workflow must have at least one step');
    
    for (const step of this.steps) {
      if (!step.organ) errors.push(`Step ${step.id} missing organ`);
      if (!step.action) errors.push(`Step ${step.id} missing action`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Export workflow as JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      trigger: this.trigger,
      steps: this.steps.map(s => ({
        id: s.id,
        name: s.name,
        organ: s.organ,
        action: s.action,
        input: s.input,
        timeout: s.timeout,
        retries: s.retries,
        condition: s.condition ? 'custom' : null
      })),
      metadata: this.metadata,
      version: this.version,
      enabled: this.enabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

class WorkflowInstance extends EventEmitter {
  constructor(definition, triggerData = {}) {
    super();
    
    this.id = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.definition = definition;
    this.triggerData = triggerData;
    this.context = {
      trigger: triggerData,
      steps: {},
      variables: {}
    };
    
    this.status = WorkflowStatus.PENDING;
    this.currentStepIndex = 0;
    this.startTime = null;
    this.endTime = null;
    this.error = null;
  }
  
  /**
   * Execute the workflow instance
   */
  async execute(executor) {
    this.status = WorkflowStatus.RUNNING;
    this.startTime = Date.now();
    this.emit('started', { instance: this });
    
    try {
      switch (this.definition.type) {
        case WorkflowType.CHAIN:
          await this._executeChain(executor);
          break;
        case WorkflowType.PARALLEL:
          await this._executeParallel(executor);
          break;
        case WorkflowType.CONDITIONAL:
          await this._executeConditional(executor);
          break;
        default:
          await this._executeChain(executor);
      }
      
      this.status = WorkflowStatus.COMPLETED;
      this.endTime = Date.now();
      this.emit('completed', { instance: this });
      
      return {
        success: true,
        instanceId: this.id,
        duration: this.endTime - this.startTime,
        context: this.context
      };
      
    } catch (error) {
      this.status = WorkflowStatus.FAILED;
      this.error = error;
      this.endTime = Date.now();
      this.emit('failed', { instance: this, error });
      
      return {
        success: false,
        instanceId: this.id,
        duration: this.endTime - this.startTime,
        error: error.message,
        context: this.context
      };
    }
  }
  
  async _executeChain(executor) {
    for (let i = 0; i < this.definition.steps.length; i++) {
      const step = this.definition.steps[i];
      this.currentStepIndex = i;
      this.emit('stepStarted', { instance: this, step, index: i });
      
      const result = await step.execute(this.context, executor);
      this.context.steps[step.id] = result;
      
      this.emit('stepCompleted', { instance: this, step, index: i, result });
      
      // Handle onSuccess/onFailure
      if (step.status === WorkflowStatus.COMPLETED && step.onSuccess) {
        this.context.variables.nextStep = step.onSuccess;
      } else if (step.status === WorkflowStatus.FAILED && step.onFailure) {
        this.context.variables.nextStep = step.onFailure;
      }
    }
  }
  
  async _executeParallel(executor) {
    const promises = this.definition.steps.map(async (step, index) => {
      this.emit('stepStarted', { instance: this, step, index });
      
      const result = await step.execute(this.context, executor);
      this.context.steps[step.id] = result;
      
      this.emit('stepCompleted', { instance: this, step, index, result });
      return result;
    });
    
    await Promise.all(promises);
  }
  
  async _executeConditional(executor) {
    for (const step of this.definition.steps) {
      // Skip if condition not met
      if (step.condition) {
        const conditionMet = this._evaluateCondition(step.condition);
        if (!conditionMet) continue;
      }
      
      this.emit('stepStarted', { instance: this, step });
      const result = await step.execute(this.context, executor);
      this.context.steps[step.id] = result;
      this.emit('stepCompleted', { instance: this, step, result });
      
      // If step specifies next step, find and execute it
      if (step.onSuccess && step.status === WorkflowStatus.COMPLETED) {
        const nextStep = this.definition.steps.find(s => s.id === step.onSuccess);
        if (nextStep) {
          await nextStep.execute(this.context, executor);
          this.context.steps[nextStep.id] = nextStep.result;
        }
      }
    }
  }
  
  _evaluateCondition(condition) {
    if (typeof condition === 'function') {
      return condition(this.context);
    }
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class WorkflowEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      defaultTimeout: config.defaultTimeout || 300000,
      ...config
    };
    
    this.definitions = new Map();
    this.instances = new Map();
    this.runningCount = 0;
    this.queue = [];
    
    this.stats = {
      executed: 0,
      completed: 0,
      failed: 0,
      avgDuration: 0
    };
  }
  
  /**
   * Register a workflow definition
   */
  register(definition) {
    if (!(definition instanceof WorkflowDefinition)) {
      definition = new WorkflowDefinition(definition);
    }
    
    const validation = definition.validate();
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }
    
    this.definitions.set(definition.id, definition);
    this.emit('registered', { definition });
    
    return definition;
  }
  
  /**
   * Trigger a workflow
   */
  async trigger(workflowId, triggerData = {}) {
    const definition = this.definitions.get(workflowId);
    if (!definition) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    if (!definition.enabled) {
      throw new Error(`Workflow disabled: ${workflowId}`);
    }
    
    const instance = new WorkflowInstance(definition, triggerData);
    this.instances.set(instance.id, instance);
    
    // Forward events
    instance.on('started', data => this.emit('instanceStarted', data));
    instance.on('completed', data => this.emit('instanceCompleted', data));
    instance.on('failed', data => this.emit('instanceFailed', data));
    instance.on('stepStarted', data => this.emit('stepStarted', data));
    instance.on('stepCompleted', data => this.emit('stepCompleted', data));
    
    // Execute
    if (this.runningCount < this.config.maxConcurrent) {
      return this._execute(instance);
    } else {
      return this._enqueue(instance);
    }
  }
  
  async _execute(instance) {
    this.runningCount++;
    const startTime = Date.now();
    
    try {
      const result = await instance.execute(this);
      this.stats.executed++;
      
      if (result.success) {
        this.stats.completed++;
      } else {
        this.stats.failed++;
      }
      
      // Update average duration
      const duration = Date.now() - startTime;
      this.stats.avgDuration = this.stats.avgDuration * (1 - PHI_INV) + duration * PHI_INV;
      
      return result;
      
    } finally {
      this.runningCount--;
      this._processQueue();
    }
  }
  
  _enqueue(instance) {
    return new Promise((resolve, reject) => {
      this.queue.push({ instance, resolve, reject });
    });
  }
  
  async _processQueue() {
    while (this.queue.length > 0 && this.runningCount < this.config.maxConcurrent) {
      const { instance, resolve, reject } = this.queue.shift();
      try {
        const result = await this._execute(instance);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }
  
  /**
   * Execute a step (called by workflow instance)
   */
  async executeStep(organ, action, input) {
    // This would integrate with the actual EmailAI mesh
    // For now, return mock response
    return {
      organ,
      action,
      input,
      timestamp: Date.now(),
      success: true,
      result: { processed: true }
    };
  }
  
  /**
   * Get workflow definition
   */
  getDefinition(workflowId) {
    return this.definitions.get(workflowId) || null;
  }
  
  /**
   * Get workflow instance
   */
  getInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }
  
  /**
   * List all definitions
   */
  listDefinitions() {
    return [...this.definitions.values()].map(d => d.toJSON());
  }
  
  /**
   * List all instances
   */
  listInstances(status = null) {
    let instances = [...this.instances.values()];
    if (status) {
      instances = instances.filter(i => i.status === status);
    }
    return instances;
  }
  
  /**
   * Get engine stats
   */
  getStats() {
    return {
      ...this.stats,
      definitions: this.definitions.size,
      instances: this.instances.size,
      running: this.runningCount,
      queued: this.queue.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-BUILT WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════════

const PREBUILT_WORKFLOWS = {
  /**
   * Security Incident Response
   */
  securityIncidentResponse: new WorkflowDefinition({
    id: 'security-incident-response',
    name: 'Security Incident Response',
    description: 'Automated incident response: triage → analyze → mitigate → report',
    type: WorkflowType.CHAIN,
    trigger: { type: TriggerType.EMAIL, to: 'membrane@medinatechlabs.net', intent: 'alert' },
    steps: [
      {
        id: 'triage',
        name: 'Triage Incident',
        organ: 'membrane',
        action: 'classify',
        input: { data: '{{trigger.body}}' }
      },
      {
        id: 'analyze',
        name: 'Deep Analysis',
        organ: 'probe',
        action: 'analyze',
        input: { incident: '{{steps.triage}}' }
      },
      {
        id: 'mitigate',
        name: 'Generate Mitigations',
        organ: 'reflex',
        action: 'mitigate',
        input: { analysis: '{{steps.analyze}}' }
      },
      {
        id: 'report',
        name: 'Generate Report',
        organ: 'research',
        action: 'report',
        input: { data: '{{steps}}' }
      },
      {
        id: 'notify',
        name: 'Notify Stakeholders',
        organ: 'herald',
        action: 'broadcast',
        input: { report: '{{steps.report}}' }
      }
    ]
  }),
  
  /**
   * Cost Optimization
   */
  costOptimization: new WorkflowDefinition({
    id: 'cost-optimization',
    name: 'Cost Optimization Workflow',
    description: 'Analyze spend → identify waste → generate recommendations',
    type: WorkflowType.CHAIN,
    trigger: { type: TriggerType.SCHEDULE, cron: '0 0 * * 1' }, // Weekly
    steps: [
      {
        id: 'collect',
        name: 'Collect Spend Data',
        organ: 'brain',
        action: 'collect',
        input: { period: 'last_7_days' }
      },
      {
        id: 'analyze',
        name: 'Analyze Patterns',
        organ: 'brain',
        action: 'analyze',
        input: { data: '{{steps.collect}}' }
      },
      {
        id: 'optimize',
        name: 'Generate Optimizations',
        organ: 'brain',
        action: 'optimize',
        input: { analysis: '{{steps.analyze}}' }
      },
      {
        id: 'report',
        name: 'Create Report',
        organ: 'research',
        action: 'report',
        input: { optimizations: '{{steps.optimize}}' }
      }
    ]
  }),
  
  /**
   * Customer Health Monitor
   */
  customerHealthMonitor: new WorkflowDefinition({
    id: 'customer-health-monitor',
    name: 'Customer Health Monitor',
    description: 'Monitor customer health and alert on churn risk',
    type: WorkflowType.PARALLEL,
    trigger: { type: TriggerType.SCHEDULE, cron: '0 8 * * *' }, // Daily
    steps: [
      {
        id: 'support-analysis',
        name: 'Analyze Support Tickets',
        organ: 'nova',
        action: 'analyze_tickets'
      },
      {
        id: 'usage-analysis',
        name: 'Analyze Usage Patterns',
        organ: 'brain',
        action: 'analyze_usage'
      },
      {
        id: 'sentiment-analysis',
        name: 'Analyze Sentiment',
        organ: 'animus',
        action: 'analyze_sentiment'
      }
    ]
  }),
  
  /**
   * Compliance Audit
   */
  complianceAudit: new WorkflowDefinition({
    id: 'compliance-audit',
    name: 'Compliance Audit Workflow',
    description: 'Automated compliance checking and evidence collection',
    type: WorkflowType.CHAIN,
    trigger: { type: TriggerType.MANUAL },
    steps: [
      {
        id: 'gather',
        name: 'Gather Evidence',
        organ: 'identity',
        action: 'gather_evidence',
        input: { framework: '{{trigger.framework}}' }
      },
      {
        id: 'validate',
        name: 'Validate Controls',
        organ: 'identity',
        action: 'validate_controls',
        input: { evidence: '{{steps.gather}}' }
      },
      {
        id: 'gaps',
        name: 'Identify Gaps',
        organ: 'identity',
        action: 'identify_gaps',
        input: { validation: '{{steps.validate}}' }
      },
      {
        id: 'report',
        name: 'Generate Audit Report',
        organ: 'research',
        action: 'compliance_report',
        input: { data: '{{steps}}' }
      }
    ]
  }),
  
  /**
   * Threat Intelligence
   */
  threatIntelligence: new WorkflowDefinition({
    id: 'threat-intelligence',
    name: 'Threat Intelligence Workflow',
    description: 'Process threat intel: fingerprint → enrich → correlate → alert',
    type: WorkflowType.CHAIN,
    trigger: { type: TriggerType.EMAIL, to: 'probe@medinatechlabs.net' },
    steps: [
      {
        id: 'fingerprint',
        name: 'Fingerprint Threat',
        organ: 'probe',
        action: 'fingerprint',
        input: { data: '{{trigger}}' }
      },
      {
        id: 'enrich',
        name: 'Enrich IOCs',
        organ: 'probe',
        action: 'enrich',
        input: { fingerprint: '{{steps.fingerprint}}' }
      },
      {
        id: 'correlate',
        name: 'Correlate with Known Threats',
        organ: 'cerebrum',
        action: 'correlate',
        input: { enriched: '{{steps.enrich}}' }
      },
      {
        id: 'alert',
        name: 'Generate Alert',
        organ: 'sentinel',
        action: 'alert',
        input: { correlation: '{{steps.correlate}}' },
        condition: { field: 'steps.correlate.risk', operator: 'greaterThan', value: 0.7 }
      }
    ]
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Classes
  WorkflowEngine,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  
  // Enums
  WorkflowType,
  WorkflowStatus,
  TriggerType,
  
  // Pre-built workflows
  PREBUILT_WORKFLOWS,
  
  // Constants
  WORKFLOW_VERSION,
  PHI,
  PHI_INV,
  
  // Factory
  createEngine: (config) => new WorkflowEngine(config),
  createWorkflow: (config) => new WorkflowDefinition(config)
};
