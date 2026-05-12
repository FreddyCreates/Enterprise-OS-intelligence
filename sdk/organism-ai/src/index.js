const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

export const TaskType = Object.freeze({
  REASONING: "REASONING",
  CODING: "CODING",
  CREATIVE: "CREATIVE",
  ANALYSIS: "ANALYSIS",
  CONVERSATION: "CONVERSATION",
});

export const Priority = Object.freeze({
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
});

const DEFAULT_MODELS = [
  ["gpt-4o", [0.9, 0.85, 0.8, 0.88, 0.85]],
  ["gpt-4-turbo", [0.88, 0.83, 0.78, 0.86, 0.84]],
  ["gpt-4", [0.85, 0.8, 0.75, 0.85, 0.83]],
  ["gpt-3.5-turbo", [0.75, 0.7, 0.7, 0.72, 0.8]],
  ["o1-preview", [0.92, 0.87, 0.7, 0.91, 0.7]],
  ["o1-mini", [0.88, 0.83, 0.65, 0.87, 0.68]],
  ["o3-mini", [0.9, 0.86, 0.68, 0.89, 0.7]],
  ["o3", [0.93, 0.88, 0.72, 0.92, 0.72]],
  ["gpt-5-mini", [0.91, 0.87, 0.76, 0.9, 0.82]],
  ["claude-4", [0.92, 0.84, 0.94, 0.9, 0.92]],
  ["claude-3.5-sonnet", [0.88, 0.8, 0.9, 0.87, 0.88]],
  ["claude-3.5-haiku", [0.82, 0.75, 0.85, 0.8, 0.85]],
  ["claude-3-opus", [0.87, 0.78, 0.92, 0.86, 0.9]],
  ["claude-3-sonnet", [0.85, 0.76, 0.88, 0.84, 0.88]],
  ["claude-3-haiku", [0.78, 0.7, 0.82, 0.76, 0.82]],
  ["gemini-2.0-flash", [0.84, 0.78, 0.8, 0.88, 0.82]],
  ["gemini-1.5-pro", [0.85, 0.76, 0.8, 0.9, 0.8]],
  ["gemini-1.5-flash", [0.8, 0.72, 0.76, 0.85, 0.78]],
  ["gemini-ultra", [0.88, 0.8, 0.84, 0.92, 0.84]],
  ["llama-3.1-405b", [0.8, 0.82, 0.7, 0.78, 0.75]],
  ["llama-3.1-70b", [0.75, 0.8, 0.65, 0.72, 0.72]],
  ["llama-3.1-8b", [0.65, 0.7, 0.58, 0.62, 0.65]],
  ["llama-3.2-90b", [0.78, 0.82, 0.68, 0.75, 0.74]],
  ["mistral-large", [0.78, 0.82, 0.7, 0.76, 0.74]],
  ["mistral-medium", [0.72, 0.76, 0.65, 0.7, 0.7]],
  ["mistral-small", [0.65, 0.7, 0.6, 0.63, 0.65]],
  ["mixtral-8x22b", [0.76, 0.82, 0.68, 0.74, 0.72]],
  ["mixtral-8x7b", [0.72, 0.78, 0.64, 0.7, 0.7]],
  ["command-r-plus", [0.8, 0.74, 0.72, 0.82, 0.84]],
  ["command-r", [0.75, 0.7, 0.68, 0.78, 0.82]],
  ["command-light", [0.68, 0.62, 0.64, 0.7, 0.78]],
  ["deepseek-v3", [0.84, 0.9, 0.7, 0.82, 0.7]],
  ["deepseek-r1", [0.9, 0.88, 0.62, 0.9, 0.66]],
  ["deepseek-coder", [0.82, 0.95, 0.6, 0.8, 0.64]],
  ["qwen-2.5-72b", [0.8, 0.84, 0.74, 0.82, 0.76]],
  ["qwen-2.5-32b", [0.76, 0.8, 0.7, 0.78, 0.74]],
  ["phi-3-medium", [0.72, 0.76, 0.64, 0.74, 0.72]],
  ["phi-3-mini", [0.66, 0.72, 0.58, 0.68, 0.7]],
  ["dbrx", [0.74, 0.78, 0.68, 0.8, 0.72]],
  ["gemma-2-27b", [0.7, 0.76, 0.64, 0.74, 0.7]],
  ["solar-pro", [0.73, 0.77, 0.66, 0.75, 0.71]],
];

function safeUnref(handle) {
  handle?.unref?.();
  return handle;
}

function normalizeTask(task = {}) {
  const normalizedType = String(task.type ?? TaskType.REASONING).toUpperCase();
  const normalizedPriority = typeof task.priority === "string"
    ? Priority[String(task.priority).toUpperCase()] ?? Priority.NORMAL
    : Number.isFinite(task.priority)
      ? task.priority
      : Priority.NORMAL;

  return {
    id: task.id ?? `task-${Date.now().toString(36)}`,
    type: TaskType[normalizedType] ?? TaskType.REASONING,
    priority: Math.max(Priority.LOW, Math.min(Priority.CRITICAL, normalizedPriority)),
    payload: task.payload ?? "",
  };
}

function capabilitiesFromTuple(values) {
  return {
    [TaskType.REASONING]: values[0],
    [TaskType.CODING]: values[1],
    [TaskType.CREATIVE]: values[2],
    [TaskType.ANALYSIS]: values[3],
    [TaskType.CONVERSATION]: values[4],
  };
}

function scoreModel(model, task) {
  const capability = model.capabilities[task.type] ?? 0.5;
  return (PHI ** (4 - task.priority)) * capability * model.reputation;
}

export class IntelligenceOrchestrator {
  constructor({ autoHeartbeat = true } = {}) {
    this.models = new Map();
    this.totalRouted = 0;
    this.totalSuccess = 0;
    this.totalLatency = 0;
    this.currentBeat = 0;
    this._heartbeat = null;
    this._seedDefaultModels();

    if (autoHeartbeat) {
      this.start();
    }
  }

  _seedDefaultModels() {
    DEFAULT_MODELS.forEach(([id, tuple]) => {
      this.models.set(id, {
        modelId: id,
        capabilities: capabilitiesFromTuple(tuple),
        reputation: 0.8,
        totalTasks: 0,
        successCount: 0,
        avgLatencyMs: HEARTBEAT_MS,
      });
    });
  }

  start() {
    if (this._heartbeat) {
      return this;
    }

    this._heartbeat = safeUnref(setInterval(() => {
      const heartbeat = this.onHeartbeat(this.currentBeat + 1);
      this.currentBeat = heartbeat.beat;
    }, HEARTBEAT_MS));

    return this;
  }

  stop() {
    clearInterval(this._heartbeat);
    this._heartbeat = null;
    return this;
  }

  registerModel(modelId, capabilities, { reputation = 0.8, avgLatencyMs = HEARTBEAT_MS } = {}) {
    this.models.set(modelId, {
      modelId,
      capabilities: { ...capabilities },
      reputation,
      totalTasks: 0,
      successCount: 0,
      avgLatencyMs,
    });
    return this;
  }

  route(taskInput) {
    const task = normalizeTask(taskInput);
    const scored = [...this.models.values()]
      .map((model) => ({ modelId: model.modelId, score: scoreModel(model, task) }))
      .sort((a, b) => b.score - a.score);

    this.totalRouted += 1;

    if (scored.length === 0) {
      return { modelId: null, score: 0, alternatives: [] };
    }

    return {
      modelId: scored[0].modelId,
      score: Number(scored[0].score.toFixed(4)),
      alternatives: scored.slice(1, 4).map((entry) => entry.modelId),
    };
  }

  cascadeFallback(taskInput, failed = []) {
    const task = normalizeTask(taskInput);
    const failedSet = failed instanceof Set ? failed : new Set(failed);

    const scored = [...this.models.values()]
      .filter((model) => !failedSet.has(model.modelId))
      .map((model, index) => ({
        modelId: model.modelId,
        score: scoreModel(model, task) * (PHI ** -index),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return { modelId: null, score: 0, alternatives: [] };
    }

    return {
      modelId: scored[0].modelId,
      score: Number(scored[0].score.toFixed(4)),
      alternatives: scored.slice(1, 4).map((entry) => entry.modelId),
    };
  }

  recordOutcome(modelId, success, latencyMs = HEARTBEAT_MS) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    model.totalTasks += 1;
    if (success) {
      model.successCount += 1;
      this.totalSuccess += 1;
    }

    const observation = success ? 1 : 0;
    model.reputation = PHI_INV * observation + (1 - PHI_INV) * model.reputation;
    model.avgLatencyMs = PHI_INV * latencyMs + (1 - PHI_INV) * model.avgLatencyMs;
    this.totalLatency += latencyMs;

    return this.getModel(modelId);
  }

  rebalance() {
    this.models.forEach((model) => {
      if (model.totalTasks > 0) {
        const empirical = model.successCount / model.totalTasks;
        model.reputation = PHI_INV * empirical + (1 - PHI_INV) * model.reputation;
      }
    });
    return this;
  }

  onHeartbeat(beatNumber) {
    const beat = Number(beatNumber) || 0;
    if (beat > 0 && beat % 50 === 0) {
      this.rebalance();
      return {
        action: "rebalanced",
        beat,
        ...this.getMetrics({ beatOverride: beat }),
      };
    }

    return {
      action: "noop",
      beat,
    };
  }

  getModel(modelId) {
    const model = this.models.get(modelId);
    if (!model) {
      return null;
    }
    return {
      modelId: model.modelId,
      reputation: Number(model.reputation.toFixed(4)),
      totalTasks: model.totalTasks,
      successRate: model.totalTasks ? Number((model.successCount / model.totalTasks).toFixed(4)) : 0,
      avgLatencyMs: Number(model.avgLatencyMs.toFixed(1)),
      capabilities: { ...model.capabilities },
    };
  }

  getRoutingTable() {
    return [...this.models.keys()]
      .map((modelId) => this.getModel(modelId))
      .sort((a, b) => b.reputation - a.reputation || a.modelId.localeCompare(b.modelId));
  }

  getMetrics({ beatOverride = null } = {}) {
    const table = this.getRoutingTable();
    return {
      totalRouted: this.totalRouted,
      successRate: this.totalRouted ? Number((this.totalSuccess / this.totalRouted).toFixed(4)) : 0,
      avgLatencyMs: this.totalRouted ? Number((this.totalLatency / this.totalRouted).toFixed(1)) : 0,
      topModel: table[0]?.modelId ?? null,
      modelCount: this.models.size,
      currentBeat: beatOverride ?? this.currentBeat,
    };
  }
}

export function createOrchestrator(config = {}) {
  return new IntelligenceOrchestrator(config);
}

export function phiScore(priority, capability, reputation) {
  return (PHI ** (4 - priority)) * capability * reputation;
}

export default {
  HEARTBEAT_MS,
  IntelligenceOrchestrator,
  PHI,
  PHI_INV,
  Priority,
  TaskType,
  createOrchestrator,
  phiScore,
};
