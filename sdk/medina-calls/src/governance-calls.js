import { createCallEngine } from "./index.js";

export function createGovernanceCalls() {
  const engine = createCallEngine();
  engine.register("submit-trace", async (payload) => ({
    ok: true,
    traceId: `trace-${Date.now().toString(36)}`,
    ...payload,
  }));
  engine.register("advance-truth", async (payload) => ({
    ok: true,
    truthStatus: payload.truthStatus ?? "review_supported",
  }));
  return engine;
}
