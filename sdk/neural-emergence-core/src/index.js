const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class AttentionFabric {
  focus(signals = []) {
    return [...signals]
      .map((signal, index) => ({
        ...signal,
        attention: (signal.salience ?? 0.5) * (PHI ** -(index + 1)),
      }))
      .sort((a, b) => b.attention - a.attention);
  }
}

export class PatternRecognizer {
  detect(signals = []) {
    const buckets = new Map();
    signals.forEach((signal) => {
      const key = signal.label ?? signal.type ?? "unknown";
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return [...buckets.entries()].map(([label, count]) => ({ label, count, weight: count * PHI_INV }));
  }
}

export class NeuralField {
  constructor(nodeCount = 8) {
    this.nodeCount = Math.max(3, nodeCount);
    this.activations = Array.from({ length: this.nodeCount }, (_, index) => Math.sin(index * PHI_INV));
  }

  propagate(input = 0.1) {
    this.activations = this.activations.map((value, index, array) => {
      const left = array[(index - 1 + array.length) % array.length];
      const right = array[(index + 1) % array.length];
      return value + (0.1 * (left + right - (2 * value))) + input * PHI_INV;
    });
    return [...this.activations];
  }

  coherence() {
    return Number(average(this.activations.map((value) => Math.abs(value))).toFixed(6));
  }
}

export class EmergenceDetector {
  score(patterns = [], fieldCoherence = 0) {
    const patternWeight = patterns.reduce((sum, pattern) => sum + pattern.weight, 0);
    return Number(((patternWeight * PHI_INV) + fieldCoherence).toFixed(6));
  }

  detect(patterns = [], fieldCoherence = 0) {
    const score = this.score(patterns, fieldCoherence);
    return {
      score,
      emergent: score >= PHI_INV,
    };
  }
}

export class CognitiveMesh {
  constructor() {
    this.nodes = new Map();
  }

  register(nodeId, state = {}) {
    this.nodes.set(nodeId, { nodeId, ...state, links: new Set() });
    return this;
  }

  connect(a, b) {
    this.nodes.get(a)?.links.add(b);
    this.nodes.get(b)?.links.add(a);
    return this;
  }

  summary() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: [...this.nodes.values()].reduce((sum, node) => sum + node.links.size, 0) / 2,
    };
  }
}

export class NeuralEmergenceCore {
  constructor({ nodeCount = 8 } = {}) {
    this.attention = new AttentionFabric();
    this.patterns = new PatternRecognizer();
    this.field = new NeuralField(nodeCount);
    this.detector = new EmergenceDetector();
    this.mesh = new CognitiveMesh();
    this.beat = 0;
  }

  step(signals = []) {
    const focused = this.attention.focus(signals);
    const patterns = this.patterns.detect(focused);
    const activations = this.field.propagate(average(focused.map((signal) => signal.attention || 0)));
    const emergence = this.detector.detect(patterns, this.field.coherence());
    this.beat += 1;
    return {
      beat: this.beat,
      heartbeatMs: HEARTBEAT_MS,
      focusedSignals: focused.slice(0, 5),
      patterns,
      activations,
      emergence,
      mesh: this.mesh.summary(),
    };
  }
}

export { HEARTBEAT_MS, PHI, PHI_INV };

export default {
  AttentionFabric,
  CognitiveMesh,
  EmergenceDetector,
  HEARTBEAT_MS,
  NeuralEmergenceCore,
  NeuralField,
  PHI,
  PHI_INV,
  PatternRecognizer,
};
