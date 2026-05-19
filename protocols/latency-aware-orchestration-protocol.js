/**
 * PROTO-028: Latency-Aware Orchestration Protocol (LAOP)
 *
 * Protocol for production AI flows, workflow coordination, and organism communication.
 * Ring: Interface Ring | Organism placement: Organism core / orchestration layer
 * Wire: intelligence-wire/laop
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

class LatencyawareOrchestrationProtocol {
  constructor(config = {}) {
    this.protocolId = 'PROTO-028';
    this.protocolCode = 'LAOP';
    this.name = 'Latency-Aware Orchestration Protocol';
    this.version = '1.0.0';
    this.bootTime = Date.now();
    this.maxHistory = Math.max(config.maxHistory || 1000, 100);
    this.channels = new Map();
    this.events = [];
  }

  registerChannel(channelId, settings = {}) {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('channelId must be a non-empty string');
    }

    const channel = {
      channelId,
      priority: Number.isFinite(settings.priority) ? settings.priority : 1,
      reliabilityTarget: Number.isFinite(settings.reliabilityTarget)
        ? Math.max(0, Math.min(1, settings.reliabilityTarget))
        : PHI_INV,
      latencyBudgetMs: Number.isFinite(settings.latencyBudgetMs)
        ? Math.max(1, settings.latencyBudgetMs)
        : 873,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.channels.set(channelId, channel);
    return { ...channel };
  }

  processFlow(flow = {}) {
    const channelId = flow.channelId || 'default';
    if (!this.channels.has(channelId)) {
      this.registerChannel(channelId, { priority: 1 });
    }

    const channel = this.channels.get(channelId);
    const confidence = Number.isFinite(flow.confidence)
      ? Math.max(0, Math.min(1, flow.confidence))
      : PHI_INV;
    const urgency = Number.isFinite(flow.urgency)
      ? Math.max(0, Math.min(1, flow.urgency))
      : PHI_INV;

    const routeScore = Math.max(0, Math.min(1,
      confidence * PHI_INV + urgency * (1 - PHI_INV) + channel.reliabilityTarget * 0.2
    ));

    const decision = routeScore >= PHI_INV ? 'forward' : 'review';
    const event = {
      eventId: 'laop-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      channelId,
      source: flow.source || 'unknown',
      target: flow.target || 'unknown',
      workflowId: flow.workflowId || null,
      decision,
      routeScore,
      payloadType: flow.payloadType || 'generic',
      timestamp: Date.now(),
    };

    this._record(event);
    return event;
  }

  acknowledge(eventId, status = 'accepted') {
    const index = this.events.findIndex((e) => e.eventId === eventId);
    if (index === -1) return { updated: false, reason: 'event_not_found' };

    this.events[index] = {
      ...this.events[index],
      acknowledgement: { status, at: Date.now() },
    };

    return { updated: true, eventId };
  }

  status() {
    const totals = this.events.reduce((acc, event) => {
      acc.total++;
      acc[event.decision] = (acc[event.decision] || 0) + 1;
      return acc;
    }, { total: 0, forward: 0, review: 0 });

    return {
      protocolId: this.protocolId,
      protocolCode: this.protocolCode,
      name: this.name,
      channels: this.channels.size,
      events: totals,
      uptimeMs: Date.now() - this.bootTime,
    };
  }

  _record(event) {
    this.events.push(event);
    if (this.events.length > this.maxHistory) this.events.shift();
  }
}

module.exports = {
  PHI,
  PHI_INV,
  LatencyawareOrchestrationProtocol,
};
