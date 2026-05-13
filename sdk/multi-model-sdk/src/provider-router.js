export class ProviderRouter {
  constructor(registry) {
    this.registry = registry;
  }

  route(task) {
    return this.registry
      .list()
      .map((model) => ({
        model,
        score: task.requirements.filter((item) => model.capabilities.includes(item)).length + (model.priority ?? 1),
      }))
      .sort((a, b) => b.score - a.score)[0]?.model ?? null;
  }
}
