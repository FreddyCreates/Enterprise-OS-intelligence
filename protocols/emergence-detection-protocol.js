/**
 * PROTO-014: Emergence Detection Protocol (EDP)
 *
 * Ising-style lattice dynamics, simple Landau free-energy estimate, and
 * percolation-based phase transition detection.
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

class EmergenceDetectionProtocol {
  constructor({ size = 8, coupling = 0.7, temperature = PHI_INV } = {}) {
    this.size = Math.max(4, size);
    this.coupling = coupling;
    this.temperature = temperature;
    this.beat = 0;
    this.lattice = Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col) => ((row + col) % 2 === 0 ? 1 : -1))
    );
  }

  _neighbors(row, col) {
    const wrap = (value) => (value + this.size) % this.size;
    return [
      this.lattice[wrap(row - 1)][col],
      this.lattice[wrap(row + 1)][col],
      this.lattice[row][wrap(col - 1)],
      this.lattice[row][wrap(col + 1)],
    ];
  }

  _localField(row, col) {
    return this._neighbors(row, col).reduce((sum, value) => sum + value, 0);
  }

  step({ externalField = 0 } = {}) {
    const next = this.lattice.map((row, rowIndex) =>
      row.map((spin, colIndex) => {
        const field = this._localField(rowIndex, colIndex);
        const energyDelta = 2 * spin * (this.coupling * field + externalField);
        return energyDelta <= this.temperature ? -spin : spin;
      })
    );

    this.lattice = next;
    this.beat += 1;
    return this.status();
  }

  magnetization() {
    return average(this.lattice.flat());
  }

  freeEnergy() {
    const m = this.magnetization();
    return Number(((0.5 * (1 - this.temperature) * (m ** 2)) + (0.25 * PHI_INV * (m ** 4))).toFixed(6));
  }

  activeFraction() {
    const active = this.lattice.flat().filter((spin) => spin > 0).length;
    return active / (this.size * this.size);
  }

  clusterScore() {
    const rows = this.lattice.map((row) => row.filter((spin) => spin > 0).length / row.length);
    return Number(average(rows).toFixed(6));
  }

  phase() {
    const magnetization = Math.abs(this.magnetization());
    if (magnetization >= PHI_INV) return "ORDERED";
    if (this.activeFraction() >= 0.5) return "CRITICAL";
    return "DISORDERED";
  }

  status() {
    return {
      code: "EDP",
      name: "Emergence Detection",
      version: "1.0.0",
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      latticeSize: this.size,
      magnetization: Number(this.magnetization().toFixed(6)),
      freeEnergy: this.freeEnergy(),
      activeFraction: Number(this.activeFraction().toFixed(6)),
      clusterScore: this.clusterScore(),
      phase: this.phase(),
      emergent: this.phase() !== "DISORDERED",
    };
  }
}

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  EmergenceDetectionProtocol,
};
