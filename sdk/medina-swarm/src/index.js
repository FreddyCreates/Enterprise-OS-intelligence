const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

class PheromoneField {
  constructor() {
    this.tau = new Map();
  }

  deposit(key, weight = 1) {
    this.tau.set(key, (this.tau.get(key) || 0) + weight);
  }

  evaporate(rate = 0.05) {
    for (const [key, value] of this.tau.entries()) {
      const next = value * (1 - rate);
      if (next < 1e-6) this.tau.delete(key);
      else this.tau.set(key, next);
    }
  }
}

class Boid {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.position = { x, y };
    this.velocity = { x: PHI_INV, y: PHI_INV / 2 };
  }

  step(neighbors) {
    const center = {
      x: average(neighbors.map((boid) => boid.position.x)) || this.position.x,
      y: average(neighbors.map((boid) => boid.position.y)) || this.position.y,
    };
    const alignment = {
      x: average(neighbors.map((boid) => boid.velocity.x)) || this.velocity.x,
      y: average(neighbors.map((boid) => boid.velocity.y)) || this.velocity.y,
    };

    this.velocity.x += (center.x - this.position.x) * 0.03 + (alignment.x - this.velocity.x) * 0.05;
    this.velocity.y += (center.y - this.position.y) * 0.03 + (alignment.y - this.velocity.y) * 0.05;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

export class Swarm {
  constructor({ numBoids = 32 } = {}) {
    this.numBoids = Math.max(3, numBoids);
    this.beat = 0;
    this.field = new PheromoneField();
    this.boids = Array.from({ length: this.numBoids }, (_, index) =>
      new Boid(`boid-${index}`, index * PHI_INV, Math.sin(index * PHI_INV))
    );
  }

  step() {
    this.boids.forEach((boid, index) => {
      const neighbors = this.boids.filter((candidate) => candidate.id !== boid.id).slice(0, Math.max(2, index % 7));
      boid.step(neighbors);
      this.field.deposit(`ring:${index % 7}`, 0.1);
    });
    this.field.evaporate();
    this.beat += 1;
    return this.getMetrics();
  }

  getConsensus() {
    const alignment = average(this.boids.map((boid) => Math.atan2(boid.velocity.y, boid.velocity.x)));
    const cohesion = average(this.boids.map((boid) => Math.hypot(boid.position.x, boid.position.y)));
    return Number((((Math.abs(alignment) + cohesion) * PHI_INV) / (1 + cohesion)).toFixed(6));
  }

  getMetrics() {
    return {
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      numBoids: this.numBoids,
      consensus: this.getConsensus(),
      quorumReached: this.getConsensus() >= PHI_INV,
      pheromoneCells: this.field.tau.size,
      centroid: {
        x: Number(average(this.boids.map((boid) => boid.position.x)).toFixed(4)),
        y: Number(average(this.boids.map((boid) => boid.position.y)).toFixed(4)),
      },
    };
  }
}

export function createSwarm(config = {}) {
  return new Swarm(config);
}

export { HEARTBEAT_MS, PHI, PHI_INV, PheromoneField };

export default {
  HEARTBEAT_MS,
  PHI,
  PHI_INV,
  PheromoneField,
  Swarm,
  createSwarm,
};
