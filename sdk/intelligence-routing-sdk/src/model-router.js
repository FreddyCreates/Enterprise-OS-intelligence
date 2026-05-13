const PRIORITY_WEIGHTS = Object.freeze({
  low: 0.5,
  medium: 1,
  high: 1.618,
  critical: 2.618,
});

export class ModelRouter {
  constructor() {
    this.models = new Map();
  }

  registerModel(modelId, capabilities = [], config = {}) {
    this.models.set(modelId, {
      modelId,
      capabilities: [...capabilities],
      config: {
        priority: config.priority ?? 1,
        latencyBudget: config.latencyBudget ?? 3000,
        costTier: config.costTier ?? "standard",
      },
      stats: {
        attempts: 0,
        successes: 0,
        latency: 0,
      },
    });
    return this;
  }

  score(model, task) {
    const matched = task.requirements.filter((requirement) => model.capabilities.includes(requirement)).length;
    const capabilityScore = matched / Math.max(task.requirements.length || 1, 1);
    const reliability = model.stats.attempts ? model.stats.successes / model.stats.attempts : 0.8;
    return capabilityScore * (PRIORITY_WEIGHTS[task.priority] || 1) * model.config.priority * reliability;
  }

  route(task) {
    const ranked = this.routeMulti(task, 1);
    return ranked[0] || null;
  }

  routeMulti(task, count = 3) {
    return [...this.models.values()]
      .map((model) => ({
        modelId: model.modelId,
        score: Number(this.score(model, task).toFixed(4)),
        capabilities: [...model.capabilities],
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  getRoutingTable() {
    return [...this.models.values()].map((model) => ({
      modelId: model.modelId,
      capabilities: [...model.capabilities],
      config: { ...model.config },
      stats: { ...model.stats },
    }));
  }

  recordOutcome(modelId, taskId, result) {
    const model = this.models.get(modelId);
    if (!model) return null;
    model.stats.attempts += 1;
    if (result.success) model.stats.successes += 1;
    model.stats.latency = result.latency ?? model.stats.latency;
    return { modelId, taskId, ...result };
  }
}
