/**
 * PROTO-017: Scalability Coordination Protocol (SCPR)
 *
 * Boids-style swarm coordination with quorum sensing and phi-scaled hierarchy.
 */

const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

class SwarmAgent {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.position = { x, y };
    this.velocity = { x: PHI_INV, y: PHI_INV };
  }

  step(neighbors) {
    const center = neighbors.reduce(
      (acc, agent) => ({ x: acc.x + agent.position.x, y: acc.y + agent.position.y }),
      { x: 0, y: 0 }
    );
    const count = Math.max(neighbors.length, 1);
    const cohesion = {
      x: (center.x / count - this.position.x) * 0.05,
      y: (center.y / count - this.position.y) * 0.05,
    };

    this.velocity.x += cohesion.x;
    this.velocity.y += cohesion.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class ScalabilityCoordinationProtocol {
  constructor({ agentCount = 12, quorumThreshold = PHI_INV } = {}) {
    this.beat = 0;
    this.quorumThreshold = quorumThreshold;
    this.agents = Array.from({ length: agentCount }, (_, index) => new SwarmAgent(`agent-${index}`, index * PHI_INV, index * 0.5));
  }

  quorumSignal() {
    const active = this.agents.filter((agent) => Math.abs(agent.velocity.x) + Math.abs(agent.velocity.y) < PHI).length;
    return active / Math.max(this.agents.length, 1);
  }

  step() {
    this.agents.forEach((agent) => agent.step(this.agents.filter((candidate) => candidate.id !== agent.id)));
    this.beat += 1;
    return this.status();
  }

  status() {
    return {
      code: "SCPR",
      name: "Scalability Coordination",
      version: "1.0.0",
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      agentCount: this.agents.length,
      quorumSignal: Number(this.quorumSignal().toFixed(6)),
      quorumReached: this.quorumSignal() >= this.quorumThreshold,
      hierarchyScale: Number((this.agents.length * PHI_INV).toFixed(6)),
      centroid: {
        x: Number((this.agents.reduce((sum, agent) => sum + agent.position.x, 0) / this.agents.length).toFixed(4)),
        y: Number((this.agents.reduce((sum, agent) => sum + agent.position.y, 0) / this.agents.length).toFixed(4)),
      },
    };
  }
}

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  SwarmAgent,
  ScalabilityCoordinationProtocol,
};
