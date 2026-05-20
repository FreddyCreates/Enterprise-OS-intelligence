/**
 * TRADEX TOOLFORGE — Durable in-system tool runtime
 * RSHIP ID: RSHIP-2026-TOOLFORGE-001
 *
 * Designed to run task tools without time-based expirations.
 * Runs are state/step based and remain available until completion or explicit cancellation.
 */

import { randomUUID } from 'node:crypto';
import { PHI, PHI_INV } from '../../rship-framework.js';

const TOOL_PROFILES = {
  BLUNT: { profile: 'blunt', aggression: PHI_INV, strategy: 'direct-utility' },
  ALPHA_CORE: { profile: 'alpha-core', aggression: PHI, strategy: 'signal-seeking' },
  ALPHA_NETWORK: { profile: 'alpha-network', aggression: PHI ** 2, strategy: 'network-data-fusion' },
};

export class TRADEXToolForge {
  static RSHIP_ID = 'RSHIP-2026-TOOLFORGE-001';
  static VERSION = '1.0.0';

  constructor(config = {}) {
    this.config = {
      maxStepsPerRun: 10_000,
      keepCompletedRuns: true,
      ...config,
    };

    this.toolRegistry = new Map();
    this.runLedger = new Map();
  }


  registerBluntTool(name, executor, metadata = {}) {
    return this.registerTool(name, executor, {
      ...TOOL_PROFILES.BLUNT,
      ...metadata,
    });
  }

  registerAlphaTool(name, executor, metadata = {}) {
    return this.registerTool(name, executor, {
      ...TOOL_PROFILES.ALPHA_CORE,
      ...metadata,
    });
  }

  registerAlphaNetworkTool(name, executor, metadata = {}) {
    return this.registerTool(name, executor, {
      ...TOOL_PROFILES.ALPHA_NETWORK,
      ...metadata,
    });
  }

  registerTool(name, executor, metadata = {}) {
    if (typeof executor !== 'function') {
      throw new Error('Tool executor must be a function');
    }

    this.toolRegistry.set(name, {
      executor,
      metadata: {
        mode: 'durable-non-time-based',
        createdAt: Date.now(),
        ...metadata,
      },
    });

    return { registered: true, name };
  }

  async runTool(name, payload = {}, context = {}) {
    const tool = this.toolRegistry.get(name);
    if (!tool) return { success: false, reason: `Tool not found: ${name}` };

    const runId = `${name}-run-${randomUUID()}`;
    const runRecord = {
      runId,
      name,
      status: 'running',
      startedAt: Date.now(),
      steps: 0,
      mode: 'durable-non-time-based',
      payload,
      output: null,
      error: null,
    };

    this.runLedger.set(runId, runRecord);

    try {
      const result = await tool.executor(payload, {
        ...context,
        runId,
        step: () => {
          runRecord.steps += 1;
          if (runRecord.steps > this.config.maxStepsPerRun) {
            throw new Error('Maximum step budget exceeded');
          }
        },
      });

      runRecord.status = 'completed';
      runRecord.completedAt = Date.now();
      runRecord.output = result;

      return {
        success: true,
        runId,
        status: runRecord.status,
        output: result,
      };
    } catch (error) {
      runRecord.status = 'failed';
      runRecord.failedAt = Date.now();
      runRecord.error = error.message;
      return { success: false, runId, status: runRecord.status, error: error.message };
    }
  }

  getRun(runId) {
    return this.runLedger.get(runId) || null;
  }

  listTools() {
    return Array.from(this.toolRegistry.entries()).map(([name, v]) => ({
      name,
      metadata: v.metadata,
    }));
  }

  status() {
    const runs = Array.from(this.runLedger.values());
    return {
      rshipId: TRADEXToolForge.RSHIP_ID,
      version: TRADEXToolForge.VERSION,
      toolsRegistered: this.toolRegistry.size,
      runsTotal: runs.length,
      runsCompleted: runs.filter(r => r.status === 'completed').length,
      runsFailed: runs.filter(r => r.status === 'failed').length,
      durabilityMode: 'non-time-based',
      harmonicLoadIndex: (runs.length * PHI_INV) / Math.max(1, this.toolRegistry.size),
      profiles: TOOL_PROFILES,
    };
  }
}

export default TRADEXToolForge;
