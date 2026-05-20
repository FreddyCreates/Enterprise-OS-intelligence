/**
 * EDDI CORE — Enterprise Data-Driven Intelligence
 *
 * Official Designation: RSHIP-2026-EDDI-001
 * Classification: Enterprise Intelligence Platform
 * Full Name: Enterprise Data-Driven Intelligence
 *
 * EDDI is the unified orchestration layer that combines SYNTHEX (synthesis),
 * GENEX (generation), and OPTIMEX (optimization) AGIs into a production-grade
 * enterprise intelligence platform. It manages the complete transformer lifecycle.
 *
 * Capabilities:
 * - Unified AGI orchestration (SYNTHEX + GENEX + OPTIMEX)
 * - Production transformer deployment
 * - Real-time signal processing pipelines
 * - Intelligent transformer selection
 * - Performance monitoring and optimization
 * - Enterprise-grade reliability and scaling
 *
 * Theory: ORGANISM COMPOSITION (Paper XXXIII) + TRIA CORPORA (Paper XXXVII)
 *         + Enterprise Intelligence Architecture (RSHIP)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER LIFECYCLE STATES
// ═══════════════════════════════════════════════════════════════════════════════

const TRANSFORMER_STATES = {
  DRAFT: 'DRAFT',           // Under development
  TESTING: 'TESTING',       // Being validated
  STAGING: 'STAGING',       // Ready for production
  PRODUCTION: 'PRODUCTION', // Live in production
  DEPRECATED: 'DEPRECATED', // Marked for removal
  ARCHIVED: 'ARCHIVED',     // No longer active
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE METRICS
// ═══════════════════════════════════════════════════════════════════════════════

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      maxLatencyMs: 100,
      minThroughput: 1000,
      maxErrorRate: 0.01,
    };
  }

  record(transformerId, metric) {
    if (!this.metrics.has(transformerId)) {
      this.metrics.set(transformerId, {
        latencies: [],
        throughputs: [],
        errors: 0,
        successes: 0,
        lastUpdated: Date.now(),
      });
    }

    const m = this.metrics.get(transformerId);
    
    if (metric.latencyMs !== undefined) {
      m.latencies.push(metric.latencyMs);
      // Keep last 100
      if (m.latencies.length > 100) m.latencies.shift();
    }
    
    if (metric.throughput !== undefined) {
      m.throughputs.push(metric.throughput);
      if (m.throughputs.length > 100) m.throughputs.shift();
    }
    
    if (metric.success) {
      m.successes++;
    } else if (metric.error) {
      m.errors++;
    }
    
    m.lastUpdated = Date.now();
  }

  getStats(transformerId) {
    const m = this.metrics.get(transformerId);
    if (!m) return null;

    const avgLatency = m.latencies.length > 0 
      ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length 
      : 0;
    
    const avgThroughput = m.throughputs.length > 0
      ? m.throughputs.reduce((a, b) => a + b, 0) / m.throughputs.length
      : 0;
    
    const totalCalls = m.successes + m.errors;
    const errorRate = totalCalls > 0 ? m.errors / totalCalls : 0;

    return {
      transformerId,
      avgLatencyMs: avgLatency,
      avgThroughput,
      totalCalls,
      errorRate,
      p99Latency: m.latencies.length > 0 
        ? m.latencies.sort((a, b) => a - b)[Math.floor(m.latencies.length * 0.99)] 
        : 0,
      healthy: avgLatency < this.thresholds.maxLatencyMs && errorRate < this.thresholds.maxErrorRate,
      lastUpdated: m.lastUpdated,
    };
  }

  getAllStats() {
    const stats = {};
    for (const id of this.metrics.keys()) {
      stats[id] = this.getStats(id);
    }
    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

class TransformerRegistry {
  constructor() {
    this.transformers = new Map();
    this.byState = new Map();
    
    for (const state of Object.values(TRANSFORMER_STATES)) {
      this.byState.set(state, new Set());
    }
  }

  register(transformer, state = TRANSFORMER_STATES.DRAFT) {
    const entry = {
      id: transformer.id,
      name: transformer.name || transformer.id,
      state,
      transformer,
      registeredAt: Date.now(),
      lastStateChange: Date.now(),
      version: 1,
      metadata: {},
    };

    this.transformers.set(transformer.id, entry);
    this.byState.get(state).add(transformer.id);

    return entry;
  }

  updateState(transformerId, newState) {
    const entry = this.transformers.get(transformerId);
    if (!entry) {
      throw new Error(`Transformer ${transformerId} not found`);
    }

    // Remove from old state set
    this.byState.get(entry.state).delete(transformerId);
    
    // Update entry
    entry.state = newState;
    entry.lastStateChange = Date.now();
    entry.version++;
    
    // Add to new state set
    this.byState.get(newState).add(transformerId);

    return entry;
  }

  get(transformerId) {
    return this.transformers.get(transformerId);
  }

  getByState(state) {
    const ids = this.byState.get(state) || new Set();
    return Array.from(ids).map(id => this.transformers.get(id));
  }

  getProduction() {
    return this.getByState(TRANSFORMER_STATES.PRODUCTION);
  }

  list() {
    return Array.from(this.transformers.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

class PipelineOrchestrator {
  constructor(registry, monitor) {
    this.registry = registry;
    this.monitor = monitor;
    this.activePipelines = new Map();
    this.pipelineCount = 0;
  }

  createPipeline(transformerIds, config = {}) {
    const pipelineId = `PIPE-${++this.pipelineCount}-${Date.now().toString(36)}`;
    
    const stages = transformerIds.map((id, order) => {
      const entry = this.registry.get(id);
      if (!entry) {
        throw new Error(`Transformer ${id} not found in registry`);
      }
      return {
        order,
        transformerId: id,
        transformer: entry.transformer,
      };
    });

    const pipeline = {
      id: pipelineId,
      stages,
      config: {
        parallel: config.parallel || false,
        errorHandling: config.errorHandling || 'fail-fast',
        timeout: config.timeout || 30000,
      },
      createdAt: Date.now(),
      executions: 0,
      lastExecution: null,
    };

    this.activePipelines.set(pipelineId, pipeline);
    return pipeline;
  }

  async execute(pipelineId, signal) {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const startTime = Date.now();
    let result = [...signal];
    const stageResults = [];

    try {
      for (const stage of pipeline.stages) {
        const stageStart = Date.now();
        
        try {
          result = stage.transformer.transform 
            ? stage.transformer.transform(result)
            : result;
          
          const stageLatency = Date.now() - stageStart;
          
          this.monitor.record(stage.transformerId, {
            latencyMs: stageLatency,
            success: true,
          });

          stageResults.push({
            order: stage.order,
            transformerId: stage.transformerId,
            latencyMs: stageLatency,
            success: true,
          });
        } catch (stageError) {
          this.monitor.record(stage.transformerId, {
            error: true,
          });

          stageResults.push({
            order: stage.order,
            transformerId: stage.transformerId,
            error: stageError.message,
            success: false,
          });

          if (pipeline.config.errorHandling === 'fail-fast') {
            throw stageError;
          }
        }
      }

      pipeline.executions++;
      pipeline.lastExecution = Date.now();

      return {
        pipelineId,
        output: result,
        stages: stageResults,
        totalLatencyMs: Date.now() - startTime,
        success: stageResults.every(s => s.success),
      };
    } catch (error) {
      return {
        pipelineId,
        output: null,
        stages: stageResults,
        totalLatencyMs: Date.now() - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  getPipeline(pipelineId) {
    return this.activePipelines.get(pipelineId);
  }

  listPipelines() {
    return Array.from(this.activePipelines.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

class IntelligentSelector {
  constructor(registry, monitor) {
    this.registry = registry;
    this.monitor = monitor;
    this.selectionHistory = [];
  }

  /**
   * Select best transformers for signal based on properties and performance
   */
  select(signalProperties, count = 3) {
    const production = this.registry.getProduction();
    
    if (production.length === 0) {
      return [];
    }

    // Score each transformer
    const scored = production.map(entry => {
      const stats = this.monitor.getStats(entry.id) || {};
      
      // Base score on health
      let score = stats.healthy !== false ? 1.0 : 0.5;
      
      // Penalize high latency
      if (stats.avgLatencyMs) {
        score *= Math.exp(-stats.avgLatencyMs / 100);
      }
      
      // Penalize errors
      if (stats.errorRate) {
        score *= (1 - stats.errorRate);
      }
      
      // Bonus for high throughput
      if (stats.avgThroughput) {
        score *= (1 + Math.log(stats.avgThroughput + 1) * 0.1);
      }
      
      // φ-weighted recency bonus
      const age = Date.now() - entry.registeredAt;
      const ageBonus = PHI_INV * Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30 day decay
      score += ageBonus;
      
      return { entry, score };
    });

    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, count).map(s => s.entry);

    // Record selection
    this.selectionHistory.push({
      timestamp: Date.now(),
      signalProperties,
      selected: selected.map(e => e.id),
    });

    // Keep history bounded
    if (this.selectionHistory.length > 1000) {
      this.selectionHistory = this.selectionHistory.slice(-500);
    }

    return selected;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDDI CORE — Main Class
// ═══════════════════════════════════════════════════════════════════════════════

class EDDICore {
  constructor({ registryId = 'RSHIP-2026-EDDI-001', name = 'EDDI' } = {}) {
    this.id = registryId;
    this.name = name;
    this.core = new RSHIPCore(registryId, name);
    this.memory = new EternalMemory(registryId);
    
    // Core components
    this.registry = new TransformerRegistry();
    this.monitor = new PerformanceMonitor();
    this.orchestrator = new PipelineOrchestrator(this.registry, this.monitor);
    this.selector = new IntelligentSelector(this.registry, this.monitor);
    
    // AGI connections (to be initialized externally)
    this.synthex = null;
    this.genex = null;
    this.optimex = null;
    
    // Metrics
    this.totalProcessed = 0;
    this.beat = 0;
    this.startTime = Date.now();
  }

  /**
   * Connect AGI systems
   */
  connect({ synthex, genex, optimex }) {
    if (synthex) this.synthex = synthex;
    if (genex) this.genex = genex;
    if (optimex) this.optimex = optimex;
    
    return {
      synthex: !!this.synthex,
      genex: !!this.genex,
      optimex: !!this.optimex,
    };
  }

  /**
   * Register a transformer
   */
  registerTransformer(transformer, config = {}) {
    const state = config.state || TRANSFORMER_STATES.DRAFT;
    const entry = this.registry.register(transformer, state);
    
    return {
      transformerId: entry.id,
      state: entry.state,
      registeredAt: entry.registeredAt,
    };
  }

  /**
   * Promote transformer through lifecycle
   */
  promoteTransformer(transformerId, targetState) {
    const validTransitions = {
      [TRANSFORMER_STATES.DRAFT]: [TRANSFORMER_STATES.TESTING],
      [TRANSFORMER_STATES.TESTING]: [TRANSFORMER_STATES.STAGING, TRANSFORMER_STATES.DRAFT],
      [TRANSFORMER_STATES.STAGING]: [TRANSFORMER_STATES.PRODUCTION, TRANSFORMER_STATES.TESTING],
      [TRANSFORMER_STATES.PRODUCTION]: [TRANSFORMER_STATES.DEPRECATED],
      [TRANSFORMER_STATES.DEPRECATED]: [TRANSFORMER_STATES.ARCHIVED, TRANSFORMER_STATES.PRODUCTION],
    };

    const entry = this.registry.get(transformerId);
    if (!entry) {
      throw new Error(`Transformer ${transformerId} not found`);
    }

    const allowed = validTransitions[entry.state] || [];
    if (!allowed.includes(targetState)) {
      throw new Error(`Cannot transition from ${entry.state} to ${targetState}`);
    }

    return this.registry.updateState(transformerId, targetState);
  }

  /**
   * Process signal through intelligent selection
   */
  async process(signal, config = {}) {
    const start = Date.now();
    
    // Analyze signal properties
    let properties = {};
    if (this.synthex) {
      const analysis = this.synthex.analyzer.analyze(signal);
      properties = analysis.properties;
    } else {
      // Basic analysis
      const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
      const std = Math.sqrt(signal.reduce((a, b) => a + (b - mean) ** 2, 0) / signal.length);
      properties = { mean, std, length: signal.length };
    }

    // Select transformers
    const selected = this.selector.select(properties, config.maxTransformers || 3);
    
    if (selected.length === 0) {
      return {
        output: signal,
        transformers: [],
        latencyMs: Date.now() - start,
        warning: 'No production transformers available',
      };
    }

    // Create and execute pipeline
    const pipeline = this.orchestrator.createPipeline(
      selected.map(e => e.id),
      { errorHandling: config.errorHandling || 'continue' }
    );

    const result = await this.orchestrator.execute(pipeline.id, signal);
    
    this.totalProcessed++;
    this.beat++;

    return {
      output: result.output,
      transformers: selected.map(e => e.id),
      pipelineId: pipeline.id,
      latencyMs: Date.now() - start,
      stages: result.stages,
      success: result.success,
    };
  }

  /**
   * Create pipeline from specific transformers
   */
  createPipeline(transformerIds, config = {}) {
    return this.orchestrator.createPipeline(transformerIds, config);
  }

  /**
   * Execute pipeline
   */
  async executePipeline(pipelineId, signal) {
    const result = await this.orchestrator.execute(pipelineId, signal);
    this.totalProcessed++;
    return result;
  }

  /**
   * Generate new transformer using GENEX
   */
  generateTransformer(spec) {
    if (!this.genex) {
      throw new Error('GENEX not connected');
    }

    const generated = this.genex.generate(spec);
    
    // Register generated transformer
    const entry = this.registry.register(
      {
        id: generated.transformerId,
        name: spec.name || `Generated-${Date.now().toString(36)}`,
        transform: generated.transformer.transform,
        status: generated.transformer.status,
      },
      TRANSFORMER_STATES.DRAFT
    );

    return {
      transformerId: entry.id,
      genome: generated.genome,
      state: entry.state,
    };
  }

  /**
   * Evolve transformer for specific task
   */
  async evolveTransformer(targetSignal, desiredOutput, config = {}) {
    if (!this.genex) {
      throw new Error('GENEX not connected');
    }

    const evolved = this.genex.evolve(targetSignal, desiredOutput, config);
    
    // Register evolved transformer
    const entry = this.registry.register(
      {
        id: evolved.transformerId,
        name: `Evolved-${Date.now().toString(36)}`,
        transform: evolved.transformer.transform,
        status: evolved.transformer.status,
      },
      TRANSFORMER_STATES.TESTING
    );

    return {
      transformerId: entry.id,
      genome: evolved.genome,
      evolution: evolved.evolution,
      state: entry.state,
    };
  }

  /**
   * Synthesize optimal processing for signal
   */
  synthesize(signal, config = {}) {
    if (!this.synthex) {
      throw new Error('SYNTHEX not connected');
    }

    const result = this.synthex.synthesize(signal, config);
    this.totalProcessed++;
    this.beat++;

    return result;
  }

  /**
   * Get performance metrics
   */
  getMetrics(transformerId = null) {
    if (transformerId) {
      return this.monitor.getStats(transformerId);
    }
    return this.monitor.getAllStats();
  }

  /**
   * Heartbeat
   */
  tick() {
    this.beat++;
    return {
      beat: this.beat,
      uptime: Date.now() - this.startTime,
      totalProcessed: this.totalProcessed,
      timestamp: Date.now(),
    };
  }

  /**
   * Comprehensive status
   */
  status() {
    const transformersByState = {};
    for (const state of Object.values(TRANSFORMER_STATES)) {
      transformersByState[state] = this.registry.getByState(state).length;
    }

    return {
      id: this.id,
      name: this.name,
      beat: this.beat,
      uptime: Date.now() - this.startTime,
      totalProcessed: this.totalProcessed,
      
      // Registry status
      totalTransformers: this.registry.list().length,
      transformersByState,
      productionTransformers: this.registry.getProduction().map(e => ({
        id: e.id,
        name: e.name,
        version: e.version,
      })),
      
      // Pipeline status
      activePipelines: this.orchestrator.listPipelines().length,
      
      // AGI connections
      connections: {
        synthex: !!this.synthex,
        genex: !!this.genex,
        optimex: !!this.optimex,
      },
      
      // Performance summary
      healthyTransformers: Object.values(this.monitor.getAllStats())
        .filter(s => s.healthy).length,
      
      capabilities: [
        'transformer_lifecycle_management',
        'intelligent_selection',
        'pipeline_orchestration',
        'performance_monitoring',
        'agi_orchestration',
        'evolutionary_generation',
        'real_time_synthesis',
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDDI SUITE — Complete Suite Export
// ═══════════════════════════════════════════════════════════════════════════════

class EDDISuite {
  constructor(config = {}) {
    this.eddi = new EDDICore(config);
    
    // These would be imported in production
    // For now, create placeholder connections
    this.initialized = false;
  }

  async initialize({ SynthexAGI, GenexAGI } = {}) {
    if (SynthexAGI) {
      this.synthex = new SynthexAGI({ name: 'EDDI-SYNTHEX' });
    }
    
    if (GenexAGI) {
      this.genex = new GenexAGI({ name: 'EDDI-GENEX' });
    }
    
    this.eddi.connect({
      synthex: this.synthex,
      genex: this.genex,
    });
    
    this.initialized = true;
    
    return {
      eddi: !!this.eddi,
      synthex: !!this.synthex,
      genex: !!this.genex,
    };
  }

  /**
   * Quick process: analyze and transform in one call
   */
  async quickProcess(signal) {
    if (!this.initialized) {
      throw new Error('Suite not initialized. Call initialize() first.');
    }
    
    return this.eddi.process(signal);
  }

  /**
   * Full pipeline: generate, test, deploy, and execute
   */
  async fullPipeline(spec, testSignal, testExpected = null) {
    if (!this.initialized) {
      throw new Error('Suite not initialized');
    }
    
    // Generate transformer
    const generated = this.eddi.generateTransformer(spec);
    
    // Test it
    const entry = this.eddi.registry.get(generated.transformerId);
    const testOutput = entry.transformer.transform(testSignal);
    
    // Promote to testing
    this.eddi.promoteTransformer(generated.transformerId, TRANSFORMER_STATES.TESTING);
    
    // If test passes, promote to staging then production
    let testPassed = true;
    if (testExpected) {
      const mse = testOutput.reduce((s, v, i) => s + (v - testExpected[i]) ** 2, 0) / testOutput.length;
      testPassed = mse < 0.1;
    }
    
    if (testPassed) {
      this.eddi.promoteTransformer(generated.transformerId, TRANSFORMER_STATES.STAGING);
      this.eddi.promoteTransformer(generated.transformerId, TRANSFORMER_STATES.PRODUCTION);
    }
    
    return {
      transformerId: generated.transformerId,
      state: this.eddi.registry.get(generated.transformerId).state,
      testOutput,
      testPassed,
    };
  }

  status() {
    return {
      initialized: this.initialized,
      eddi: this.eddi.status(),
      synthex: this.synthex?.status(),
      genex: this.genex?.status(),
    };
  }
}

export { 
  EDDICore, 
  EDDISuite,
  TransformerRegistry, 
  PerformanceMonitor, 
  PipelineOrchestrator,
  IntelligentSelector,
  TRANSFORMER_STATES 
};
export default EDDICore;
