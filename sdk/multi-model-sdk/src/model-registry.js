export class ModelRegistry {
  constructor() {
    this.models = new Map();
  }

  register(model) {
    this.models.set(model.modelId, {
      tier: model.tier ?? "utility",
      provider: model.provider ?? "unknown",
      capabilities: [...(model.capabilities || [])],
      latencyBudget: model.latencyBudget ?? 3000,
      ...model,
    });
    return this;
  }

  list() {
    return [...this.models.values()];
  }

  get(modelId) {
    return this.models.get(modelId) || null;
  }
}
