/**
 * PROTO-013: Neural Synchronization Protocol (NSP)
 *
 * Multi-oscillator neurochemical synchronisation with Hebbian plasticity and
 * gamma/theta/alpha band coherence tracking.
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

const OSCILLATION_BANDS = Object.freeze({
  DELTA: { name: "DELTA", hz: 2.5 },
  THETA: { name: "THETA", hz: 6.0 },
  ALPHA: { name: "ALPHA", hz: 10.0 },
  BETA: { name: "BETA", hz: 20.0 },
  GAMMA: { name: "GAMMA", hz: 40.0 },
});

const NEUROCHEMICAL_SPECIES = Object.freeze([
  "dopamine",
  "serotonin",
  "acetylcholine",
  "norepinephrine",
  "gaba",
  "glutamate",
  "oxytocin",
  "vasopressin",
  "endorphin",
  "anandamide",
  "cortisol",
  "melatonin",
  "histamine",
  "orexin",
  "adenosine",
  "substance_p",
  "dynorphin",
  "enkephalin",
  "bdnf",
  "ngf",
  "igf1",
]);

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bounded(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

class HebbianMatrix {
  constructor(nodeCount) {
    this.matrix = Array.from({ length: nodeCount }, () =>
      Array.from({ length: nodeCount }, () => PHI_INV / nodeCount)
    );
  }

  reinforce(phases, learningRate = 0.05) {
    for (let i = 0; i < this.matrix.length; i += 1) {
      for (let j = 0; j < this.matrix[i].length; j += 1) {
        if (i === j) continue;
        const synchrony = (Math.cos(phases[i] - phases[j]) + 1) / 2;
        this.matrix[i][j] = bounded(
          this.matrix[i][j] + learningRate * (synchrony - this.matrix[i][j]),
          0,
          PHI
        );
      }
    }
  }

  meanWeight() {
    return average(this.matrix.flat());
  }
}

class NeuralSynchronizationProtocol {
  constructor({ nodeCount = 8, coupling = PHI_INV } = {}) {
    this.nodeCount = Math.max(3, nodeCount);
    this.coupling = coupling;
    this.beat = 0;
    this.phases = Array.from({ length: this.nodeCount }, (_, index) =>
      index * ((2 * Math.PI) / this.nodeCount)
    );
    this.frequencies = Array.from({ length: this.nodeCount }, (_, index) =>
      OSCILLATION_BANDS.GAMMA.hz + (index * PHI_INV)
    );
    this.chemistry = Object.fromEntries(
      NEUROCHEMICAL_SPECIES.map((name, index) => [name, Number((PHI_INV ** ((index % 5) + 1)).toFixed(4))])
    );
    this.hebbian = new HebbianMatrix(this.nodeCount);
  }

  step(input = {}) {
    const dt = (input.dtMs || HEARTBEAT_MS) / 1000;
    const stimulus = Number(input.stimulus || 0);

    const next = this.phases.map((thetaI, i) => {
      let interaction = 0;
      for (let j = 0; j < this.phases.length; j += 1) {
        interaction += Math.sin(this.phases[j] - thetaI) * this.hebbian.matrix[i][j];
      }
      return thetaI + (this.frequencies[i] + (this.coupling / this.nodeCount) * interaction + stimulus) * dt;
    });

    this.phases = next;
    this.hebbian.reinforce(this.phases, 0.03 + stimulus * 0.01);
    this.beat += 1;

    return this.status();
  }

  orderParameter() {
    const re = average(this.phases.map((value) => Math.cos(value)));
    const im = average(this.phases.map((value) => Math.sin(value)));
    return Math.sqrt((re * re) + (im * im));
  }

  bandCoherence() {
    const order = this.orderParameter();
    return {
      theta: Number((order * PHI_INV).toFixed(4)),
      alpha: Number((order * 0.75).toFixed(4)),
      gamma: Number((order * PHI).toFixed(4)),
    };
  }

  status() {
    return {
      code: "NSP",
      name: "Neural Synchronization",
      version: "1.0.0",
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      nodeCount: this.nodeCount,
      orderParameter: Number(this.orderParameter().toFixed(6)),
      synchronised: this.orderParameter() >= PHI_INV,
      coherence: this.bandCoherence(),
      meanHebbianWeight: Number(this.hebbian.meanWeight().toFixed(6)),
      chemistryLoad: Number(average(Object.values(this.chemistry)).toFixed(6)),
    };
  }
}

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  OSCILLATION_BANDS,
  NEUROCHEMICAL_SPECIES,
  HebbianMatrix,
  NeuralSynchronizationProtocol,
};
