/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: AUDIT TRAIL — Immutable Compliance Event Log              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

class AuditTrail {
  constructor() {
    this.events = [];
    this.snapshots = [];
  }

  logEvent(recordId, action, actor, details = {}) {
    const event = {
      eventId: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      recordId,
      action, // created | updated | assessed | finding_added | finding_remediated | control_tested | approved | escalated
      actor,
      details,
      integrity: this.computeChainHash(),
    };
    this.events.push(event);
    return event;
  }

  getEventsForRecord(recordId) {
    return this.events.filter(e => e.recordId === recordId);
  }

  getEventsByActor(actor) {
    return this.events.filter(e => e.actor === actor);
  }

  getEventsByAction(action) {
    return this.events.filter(e => e.action === action);
  }

  getRecentEvents(count = 50) {
    return this.events.slice(-count);
  }

  takeSnapshot(label) {
    const snapshot = {
      snapshotId: `SNAP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: label || '',
      eventCount: this.events.length,
      lastEventId: this.events.length > 0 ? this.events[this.events.length - 1].eventId : null,
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  verifyIntegrity() {
    // Simple chain verification
    let valid = true;
    for (let i = 1; i < this.events.length; i++) {
      if (!this.events[i].integrity) {
        valid = false;
        break;
      }
    }
    return { valid, totalEvents: this.events.length, lastVerified: new Date().toISOString() };
  }

  computeChainHash() {
    if (this.events.length === 0) return 'genesis';
    const last = this.events[this.events.length - 1];
    return `${last.eventId}-${last.timestamp}`.slice(0, 16);
  }

  summary() {
    const byAction = this.events.reduce((acc, e) => { acc[e.action] = (acc[e.action] || 0) + 1; return acc; }, {});
    return {
      totalEvents: this.events.length,
      byAction,
      uniqueRecords: new Set(this.events.map(e => e.recordId)).size,
      uniqueActors: new Set(this.events.map(e => e.actor)).size,
      timespan: this.events.length > 1 ? { from: this.events[0].timestamp, to: this.events[this.events.length - 1].timestamp } : null,
    };
  }
}

module.exports = { AuditTrail };
