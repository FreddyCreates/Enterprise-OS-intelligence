export class ContextManager {
  constructor() {
    this.contexts = new Map();
  }

  set(contextId, state) {
    this.contexts.set(contextId, { ...state, updatedAt: new Date().toISOString() });
    return this;
  }

  get(contextId) {
    return this.contexts.get(contextId) || null;
  }
}
