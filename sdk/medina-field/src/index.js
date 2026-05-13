const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function wrap(index, size) {
  return (index + size) % size;
}

export class FieldEngine {
  constructor({ latticeSize = 16, mass = 0.5, coupling = 0.1 } = {}) {
    this.latticeSize = Math.max(4, latticeSize);
    this.mass = mass;
    this.coupling = coupling;
    this.beat = 0;
    this.rgCoupling = coupling;
    this.lattice = Array.from({ length: this.latticeSize }, (_, row) =>
      Array.from({ length: this.latticeSize }, (_, col) => Math.sin((row + col) * PHI_INV))
    );
  }

  cell(row, col) {
    return this.lattice[wrap(row, this.latticeSize)][wrap(col, this.latticeSize)];
  }

  laplacian(row, col) {
    const center = this.cell(row, col);
    return (
      this.cell(row - 1, col) +
      this.cell(row + 1, col) +
      this.cell(row, col - 1) +
      this.cell(row, col + 1) -
      (4 * center)
    );
  }

  evolve({ dt = PHI_INV } = {}) {
    this.lattice = this.lattice.map((line, row) =>
      line.map((value, col) => value + dt * (this.laplacian(row, col) - (this.mass ** 2 * value)))
    );
    this.rgCoupling = this.rgFlow();
    this.beat += 1;
    return this.getMetrics();
  }

  rgFlow(scale = 1 + PHI_INV * 0.1) {
    const beta = (3 * this.rgCoupling * this.rgCoupling) / (16 * Math.PI * Math.PI);
    return Number((this.rgCoupling + beta * Math.log(scale)).toFixed(6));
  }

  pathIntegralEstimate(samples = 8) {
    const flat = this.lattice.flat();
    return Number(
      average(flat.slice(0, Math.min(samples, flat.length)).map((value, index) => value * Math.exp(-(index + 1) * PHI_INV)))
        .toFixed(6)
    );
  }

  fieldEnergy() {
    const flat = this.lattice.flat();
    const kinetic = average(flat.map((value) => value * value)) * PHI;
    const potential = average(flat.map((value) => 0.5 * this.mass * value * value + this.rgCoupling * value ** 4));
    return {
      kinetic: Number(kinetic.toFixed(6)),
      potential: Number(potential.toFixed(6)),
    };
  }

  wilsonLoop(size = 2) {
    let loop = 0;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        loop += this.cell(row, col);
      }
    }
    return Number((loop / (size * size)).toFixed(6));
  }

  getMetrics() {
    return {
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      latticeSize: this.latticeSize,
      rgCoupling: this.rgCoupling,
      pathIntegral: this.pathIntegralEstimate(),
      wilsonLoop: this.wilsonLoop(),
      fieldEnergy: this.fieldEnergy(),
    };
  }
}

export function createFieldEngine(config = {}) {
  return new FieldEngine(config);
}

export { HEARTBEAT_MS, PHI, PHI_INV };

export default {
  FieldEngine,
  HEARTBEAT_MS,
  PHI,
  PHI_INV,
  createFieldEngine,
};
