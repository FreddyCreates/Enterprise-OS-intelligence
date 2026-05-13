import { createCallEngine } from "./index.js";

export function createOrganismCalls() {
  const engine = createCallEngine();
  engine.register("tick-heartbeat", async (payload) => ({
    ok: true,
    beat: payload.beat ?? 1,
    status: "alive",
  }));
  engine.register("dispatch-kernel", async (payload) => ({
    ok: true,
    kernelId: payload.kernelId ?? "kernel-default",
    status: "executed",
  }));
  return engine;
}
