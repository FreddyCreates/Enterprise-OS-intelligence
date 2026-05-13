export class CallEngine {
  constructor() {
    this.handlers = new Map();
    this.history = [];
  }

  register(action, handler) {
    this.handlers.set(action, handler);
    return this;
  }

  async call(action, payload = {}) {
    const handler = this.handlers.get(action);
    if (!handler) {
      throw new Error(`No call handler registered for ${action}`);
    }
    const startedAt = Date.now();
    const result = await handler(payload);
    const record = {
      action,
      payload,
      result,
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };
    this.history.push(record);
    return record;
  }

  getHistory() {
    return [...this.history];
  }
}

export function createCallEngine() {
  return new CallEngine();
}

export { createCivitasCalls } from "./civitas-calls.js";
export { createOrganismCalls } from "./organism-calls.js";
export { createGovernanceCalls } from "./governance-calls.js";

export default {
  CallEngine,
  createCallEngine,
};
