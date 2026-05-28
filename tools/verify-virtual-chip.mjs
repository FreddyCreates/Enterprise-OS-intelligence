import assert from "node:assert/strict";

import { NeuralEmergenceCore } from "../sdk/neural-emergence-core/src/index.js";
import { SovereigntyCore } from "../sdk/sovereignty-core/src/index.js";
import { ResonanceCore } from "../sdk/resonance-core/src/index.js";
import { PowerCore } from "../sdk/power-core/src/index.js";
import { GeneratorCore } from "../sdk/generator-core/src/index.js";
import { SovereignProtocolSDK } from "../sdk/sovereign-protocol-sdk/src/index.js";
import { RSHIPCore } from "../sdk/rship-core/src/index.js";

const neural = new NeuralEmergenceCore();
assert.equal(typeof neural.step([{ label: "market", salience: 0.8 }]).emergence.score, "number");

const sovereignty = new SovereigntyCore();
const identity = sovereignty.birthIdentity("ARCHON");
assert.ok(identity.key);

const resonance = new ResonanceCore();
assert.equal(typeof resonance.tick().orderParameter, "number");

const power = new PowerCore();
assert.equal(power.tick(10, [{ id: "a", weight: 1 }], [{ entityId: "e1", priority: 1 }]).distribution.length, 1);

const generator = new GeneratorCore();
const agent = generator.agents.birth({ name: "GENERATOR-VERIFY" });
assert.equal(agent.alive, true);
agent.stop();

const protocol = new SovereignProtocolSDK();
protocol.registry.register({ name: "@medina/test", version: "1.0.0" });
assert.equal(protocol.registry.resolve("@medina/test").version, "1.0.0");

const rship = new RSHIPCore({ name: "RSHIP-VERIFY" });
assert.equal(rship.getStatus().identity.name, "RSHIP-VERIFY");
rship.heart.stop();

console.log("verify-virtual-chip-ok");
