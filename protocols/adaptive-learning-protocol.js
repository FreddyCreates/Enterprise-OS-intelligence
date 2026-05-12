/**
 * PROTO-016: Adaptive Learning Protocol (ALP)
 *
 * Lyapunov-style stability measurement, attractor movement, and antifragile
 * adaptation under changing error conditions.
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

class AdaptiveLearningProtocol {
  constructor({ learningRate = PHI_INV, target = 1 } = {}) {
    this.learningRate = learningRate;
    this.target = target;
    this.state = 0.5;
    this.beat = 0;
    this.errorHistory = [];
  }

  lyapunov(error) {
    const previous = this.errorHistory.at(-1) ?? error;
    return Number(Math.abs(error - previous).toFixed(6));
  }

  step({ observation = 0.5, stress = 0 } = {}) {
    const error = this.target - observation;
    const lambda = this.lyapunov(error + stress);
    const antifragility = lambda > PHI_INV ? PHI : PHI_INV;
    this.state = this.state + (this.learningRate * error * antifragility);
    this.learningRate = Math.max(0.05, Math.min(1.25, this.learningRate * (lambda > PHI_INV ? PHI_INV : PHI)));
    this.errorHistory.push(error);
    if (this.errorHistory.length > 64) {
      this.errorHistory.shift();
    }
    this.beat += 1;
    return this.status();
  }

  status() {
    const latestError = this.errorHistory.at(-1) ?? 0;
    const lambda = this.lyapunov(latestError);
    return {
      code: "ALP",
      name: "Adaptive Learning",
      version: "1.0.0",
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      state: Number(this.state.toFixed(6)),
      learningRate: Number(this.learningRate.toFixed(6)),
      target: this.target,
      latestError: Number(latestError.toFixed(6)),
      lyapunovLambda: lambda,
      stable: lambda <= PHI_INV,
      attractorShift: Number((this.state - this.target).toFixed(6)),
    };
  }
}

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  AdaptiveLearningProtocol,
};
