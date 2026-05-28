import assert from "node:assert/strict";

import { birthAI } from "../sdk/medina-heart/src/index.js";
import { getRegistry } from "../sdk/medina-registry/src/index.js";
import { createOrchestrator, TaskType, Priority } from "../sdk/organism-ai/src/index.js";
import { createQueryEngine } from "../sdk/medina-queries/src/index.js";
import { createComposer } from "../sdk/protocol-composer/src/index.js";
import { createBootstrap } from "../sdk/organism-bootstrap/src/index.js";

const ai = birthAI({ name: "VERIFY-CORE", numHearts: 2, numBrains: 2, heartBaseMs: 10, clockBaseMs: 10 });
assert.equal(ai.alive, true);
ai.stop();

const registry = getRegistry();
assert.ok(registry.getStats().totalPackages > 0);

const orchestrator = createOrchestrator({ autoHeartbeat: false });
const route = orchestrator.route({ type: TaskType.CODING, priority: Priority.HIGH, payload: "verify" });
assert.ok(route.modelId);

const queryEngine = createQueryEngine();
queryEngine.registerProtocol("neural-sync", { active: true });
assert.equal(queryEngine.search("neural", 0.1).protocols[0].name, "neural-sync");

const composer = createComposer({ autoHeartbeat: false });
composer.registerProtocol("a", { execute: (input) => ({ ...input, a: true }) }, []);
composer.registerProtocol("b", { execute: (input) => ({ ...input, b: true }) }, ["a"]);
assert.equal(composer.executeAll({ seed: true }).b.b, true);

const bootstrap = createBootstrap({ network: "local" });
bootstrap.registerModule("memory", { config: { role: "module" } });
assert.ok(bootstrap.getDeploymentPackage().wrappers["memory.mo"]);

console.log("verify-core-sdks-ok");
