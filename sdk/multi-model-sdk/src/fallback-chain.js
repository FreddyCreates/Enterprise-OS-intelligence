export class FallbackChain {
  constructor(registry) {
    this.registry = registry;
  }

  next(failedModels = []) {
    const failed = new Set(failedModels);
    return this.registry.list().filter((model) => !failed.has(model.modelId));
  }
}
