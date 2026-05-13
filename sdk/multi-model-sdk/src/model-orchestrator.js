import { ModelRegistry } from "./model-registry.js";
import { ProviderRouter } from "./provider-router.js";
import { InferenceUnifier } from "./inference-unifier.js";
import { FallbackChain } from "./fallback-chain.js";
import { ContextManager } from "./context-manager.js";

export class ModelOrchestrator {
  constructor() {
    this.registry = new ModelRegistry();
    this.router = new ProviderRouter(this.registry);
    this.unifier = new InferenceUnifier();
    this.fallback = new FallbackChain(this.registry);
    this.context = new ContextManager();
  }

  registerModel(model) {
    this.registry.register(model);
    return this;
  }

  infer(task, responseFactory = null) {
    const selected = this.router.route(task);
    if (!selected) return null;
    const response = responseFactory
      ? responseFactory(selected)
      : { text: `Handled ${task.type} with ${selected.modelId}` };
    return this.unifier.normalize(response, selected);
  }

  inferWithFallback(task, failed = [], responseFactory = null) {
    const candidates = this.fallback.next(failed);
    const selected = candidates[0] ?? null;
    if (!selected) return null;
    const response = responseFactory
      ? responseFactory(selected)
      : { text: `Fallback handled ${task.type} with ${selected.modelId}` };
    return this.unifier.normalize(response, selected);
  }
}
