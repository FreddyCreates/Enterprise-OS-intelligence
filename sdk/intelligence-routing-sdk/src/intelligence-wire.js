export class IntelligenceWire {
  constructor() {
    this.wires = new Map();
  }

  connect(sourceId, targetId, wireConfig = {}) {
    const wireId = `wire-${sourceId}-${targetId}-${this.wires.size + 1}`;
    this.wires.set(wireId, {
      wireId,
      sourceId,
      targetId,
      config: {
        bandwidth: wireConfig.bandwidth ?? 1,
        protocol: wireConfig.protocol ?? "rship-wire",
        encryption: wireConfig.encryption ?? true,
      },
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        errors: 0,
        averageLatencyMs: 0,
        throughput: 0,
      },
      listeners: [],
      state: "connected",
    });
    return { wireId, sourceId, targetId, state: "connected" };
  }

  send(wireId, payload) {
    const wire = this.wires.get(wireId);
    if (!wire) throw new Error(`Wire not found: ${wireId}`);
    const startedAt = Date.now();
    wire.metrics.messagesSent += 1;
    wire.metrics.messagesReceived += wire.listeners.length;
    wire.listeners.forEach((listener) => listener(payload));
    wire.metrics.averageLatencyMs = Date.now() - startedAt;
    wire.metrics.throughput = wire.metrics.messagesSent / Math.max(1, wire.metrics.averageLatencyMs || 1);
    return { wireId, delivered: wire.listeners.length };
  }

  onReceive(wireId, callback) {
    const wire = this.wires.get(wireId);
    if (!wire) throw new Error(`Wire not found: ${wireId}`);
    wire.listeners.push(callback);
    return this;
  }

  disconnect(wireId) {
    const wire = this.wires.get(wireId);
    if (!wire) return false;
    wire.state = "disconnected";
    this.wires.delete(wireId);
    return true;
  }

  getWireMetrics(wireId) {
    return this.wires.get(wireId)?.metrics ?? null;
  }
}
