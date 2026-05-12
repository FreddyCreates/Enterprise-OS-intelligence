const assert = require("node:assert/strict");

const { SovereignCycleProtocol } = require("./sovereign-cycle-protocol.js");
const { AutonomousDivisionProtocol } = require("./autonomous-division-protocol.js");
const { NeuralSynchronizationProtocol } = require("./neural-synchronization-protocol.js");
const { EmergenceDetectionProtocol } = require("./emergence-detection-protocol.js");
const { CognitiveMemoryProtocol } = require("./cognitive-memory-protocol.js");
const { AdaptiveLearningProtocol } = require("./adaptive-learning-protocol.js");
const { ScalabilityCoordinationProtocol } = require("./scalability-coordination-protocol.js");

function run() {
  const cycle = new SovereignCycleProtocol({ slots: 16, nodeCount: 4 });
  const division = new AutonomousDivisionProtocol({ slots: 16 });
  const neural = new NeuralSynchronizationProtocol({ nodeCount: 8 });
  const emergence = new EmergenceDetectionProtocol({ size: 6 });
  const memory = new CognitiveMemoryProtocol();
  const learning = new AdaptiveLearningProtocol({ target: 1 });
  const scalability = new ScalabilityCoordinationProtocol({ agentCount: 10 });

  const cycleBundle = cycle.tick(["trace", "verify", "remember"]);
  assert.equal(cycleBundle.slotCount, 16);

  const boot = division.boot();
  assert.equal(boot.status, "booted");
  const divisionTick = division.tickAll();
  assert.equal(divisionTick.globalBeat, 1);

  const neuralStatus = neural.step({ stimulus: 0.2 });
  assert.ok(typeof neuralStatus.orderParameter === "number");

  const emergenceStatus = emergence.step({ externalField: 0.3 });
  assert.ok(["ORDERED", "CRITICAL", "DISORDERED"].includes(emergenceStatus.phase));

  memory.remember("governance memory", { importance: 0.9, tags: ["governance", "memory"] });
  const memoryStatus = memory.step({ thought: { content: "quorum reached", importance: 0.8, tags: ["quorum"] } });
  assert.ok(memoryStatus.episodicMemorySize >= 2);

  const learningStatus = learning.step({ observation: 0.7, stress: 0.1 });
  assert.ok(typeof learningStatus.lyapunovLambda === "number");

  const scalabilityStatus = scalability.step();
  assert.equal(scalabilityStatus.agentCount, 10);

  console.log("protocol-integration-ok");
}

run();
