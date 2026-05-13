import { createCallEngine } from "./index.js";

export function createCivitasCalls() {
  const engine = createCallEngine();
  engine.register("register-institution", async (payload) => ({
    ok: true,
    institutionId: `inst-${Date.now().toString(36)}`,
    ...payload,
  }));
  engine.register("schedule-review", async (payload) => ({
    ok: true,
    status: "scheduled",
    ...payload,
  }));
  return engine;
}
