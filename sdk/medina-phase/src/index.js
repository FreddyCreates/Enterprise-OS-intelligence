const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class PhaseEngine {
  constructor({ numOscillators = 8, coupling = PHI } = {}) {
    this.numOscillators = Math.max(2, numOscillators);
    this.coupling = coupling;
    this.beat = 0;
    this.phases = Array.from({ length: this.numOscillators }, (_, index) => index * (2 * Math.PI / this.numOscillators));
    this.frequencies = Array.from({ length: this.numOscillators }, (_, index) => 1 + (index * 0.05));
    this.history = [];
  }

  step({ dt = HEARTBEAT_MS / 1000 } = {}) {
    const next = this.phases.map((thetaI, i) => {
      const interaction = this.phases.reduce(
        (sum, thetaJ) => sum + Math.sin(thetaJ - thetaI),
        0
      );
      return thetaI + (this.frequencies[i] + (this.coupling / this.numOscillators) * interaction) * dt;
    });
    this.phases = next;
    this.history.push([...this.phases]);
    if (this.history.length > 64) this.history.shift();
    this.beat += 1;
    return this.getMetrics();
  }

  orderParameter() {
    const re = average(this.phases.map((value) => Math.cos(value)));
    const im = average(this.phases.map((value) => Math.sin(value)));
    return Math.sqrt(re * re + im * im);
  }

  lyapunovExponent() {
    if (this.history.length < 2) return 0;
    const current = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];
    const divergence = average(current.map((value, index) => Math.abs(value - previous[index]) + 1e-9));
    return Number(Math.log(divergence).toFixed(6));
  }

  reconstructAttractor(delay = 1, dimension = 3) {
    const series = this.history.map((entry) => average(entry));
    const points = [];
    for (let index = 0; index < series.length - (dimension - 1) * delay; index += 1) {
      points.push(Array.from({ length: dimension }, (_, dim) => series[index + dim * delay]));
    }
    return points;
  }

  getMetrics() {
    return {
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      numOscillators: this.numOscillators,
      orderParameter: Number(this.orderParameter().toFixed(6)),
      synchronized: this.orderParameter() >= PHI_INV,
      lyapunovExponent: this.lyapunovExponent(),
      attractorPoints: this.reconstructAttractor().length,
    };
  }
}

export function createPhaseEngine(config = {}) {
  return new PhaseEngine(config);
}

export { HEARTBEAT_MS, PHI, PHI_INV };

export default {
  HEARTBEAT_MS,
  PHI,
  PHI_INV,
  PhaseEngine,
  createPhaseEngine,
};
