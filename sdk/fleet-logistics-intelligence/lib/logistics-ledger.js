/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: LOGISTICS LEDGER — Versioned Shipment Store               ║
 * ║                                                                            ║
 * ║  Stores versioned shipment facts, tracks revisions, POD records,           ║
 * ║  reconciliation, and provides full audit history for AI retrieval.          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// LOGISTICS LEDGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class LogisticsLedger {
  constructor(options = {}) {
    this.shipments = new Map();     // shipmentId → current record
    this.history = new Map();       // shipmentId → version[]
    this.pods = new Map();          // Proof of Delivery records
    this.events = [];               // Append-only event log
    this.reconciliations = [];      // Cost reconciliation records
    this.persistence = options.persistence || null;
  }

  /**
   * Store a new shipment or a new version of an existing shipment.
   */
  commit(shipment, author = 'system') {
    const id = shipment.shipmentId;
    const version = this._nextVersion(id);

    const record = {
      version,
      data: JSON.parse(JSON.stringify(shipment)),
      committedAt: new Date().toISOString(),
      committedBy: author,
      hash: this._hash(shipment),
    };

    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(record);
    this.shipments.set(id, record);

    this._emit('commit', { shipmentId: id, version, author });
    return { id, version, committedAt: record.committedAt, hash: record.hash };
  }

  /**
   * Get the current version of a shipment.
   */
  get(shipmentId) {
    const entry = this.shipments.get(shipmentId);
    return entry ? entry.data : null;
  }

  /**
   * Get a specific version of a shipment.
   */
  getVersion(shipmentId, version) {
    const versions = this.history.get(shipmentId);
    if (!versions) return null;
    const record = versions.find(v => v.version === version);
    return record ? record.data : null;
  }

  /**
   * Get full version history for a shipment.
   */
  getHistory(shipmentId) {
    const versions = this.history.get(shipmentId);
    if (!versions) return [];
    return versions.map(v => ({
      version: v.version,
      committedAt: v.committedAt,
      committedBy: v.committedBy,
      hash: v.hash,
      status: v.data.status,
      totalCost: v.data.costs ? v.data.costs.totalCost : 0,
    }));
  }

  /**
   * Diff two versions of a shipment.
   */
  diff(shipmentId, versionA, versionB) {
    const a = this.getVersion(shipmentId, versionA);
    const b = this.getVersion(shipmentId, versionB);
    if (!a || !b) return null;

    const changes = [];
    this._deepDiff(a, b, '', changes);
    return { shipmentId, from: versionA, to: versionB, changes };
  }

  /**
   * Record Proof of Delivery.
   */
  recordPOD(shipmentId, signature, receivedBy, notes = '') {
    const pod = {
      podId: `POD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shipmentId,
      timestamp: new Date().toISOString(),
      signature: signature || '',
      receivedBy: receivedBy || '',
      notes,
      verified: true,
    };
    this.pods.set(shipmentId, pod);
    this._emit('pod_recorded', { shipmentId, podId: pod.podId });

    // Update shipment status
    const current = this.get(shipmentId);
    if (current) {
      current.status = 'delivered';
      this.commit(current, 'pod-system');
    }

    return pod;
  }

  /**
   * Get POD for a shipment.
   */
  getPOD(shipmentId) {
    return this.pods.get(shipmentId) || null;
  }

  /**
   * Record a cost reconciliation (carrier invoice vs. quoted).
   */
  reconcile(shipmentId, invoicedAmount, notes = '') {
    const shipment = this.get(shipmentId);
    if (!shipment) return { success: false, error: 'Shipment not found' };

    const quotedAmount = shipment.costs.totalCost;
    const variance = Math.round((invoicedAmount - quotedAmount) * 100) / 100;
    const variancePercent = quotedAmount > 0
      ? Math.round((variance / quotedAmount) * 10000) / 100
      : 0;

    const record = {
      reconcileId: `REC-${Date.now()}`,
      shipmentId,
      timestamp: new Date().toISOString(),
      quotedAmount,
      invoicedAmount,
      variance,
      variancePercent,
      match: Math.abs(variancePercent) <= 3,
      notes,
      status: Math.abs(variancePercent) <= 3 ? 'reconciled' : 'discrepancy',
    };

    this.reconciliations.push(record);
    this._emit('reconcile', record);
    return record;
  }

  /**
   * Get reconciliation records for a shipment.
   */
  getReconciliations(shipmentId) {
    return this.reconciliations.filter(r => r.shipmentId === shipmentId);
  }

  /**
   * Mark shipment as in-transit.
   */
  markInTransit(shipmentId, author = 'system') {
    const current = this.get(shipmentId);
    if (!current) return { success: false, error: 'Shipment not found' };
    current.status = 'in-transit';
    current.audit.modifiedAt = new Date().toISOString();
    current.audit.modifiedBy = author;
    return this.commit(current, author);
  }

  /**
   * Mark shipment as delivered.
   */
  markDelivered(shipmentId, author = 'system') {
    const current = this.get(shipmentId);
    if (!current) return { success: false, error: 'Shipment not found' };
    current.status = 'delivered';
    current.audit.modifiedAt = new Date().toISOString();
    current.audit.modifiedBy = author;
    return this.commit(current, author);
  }

  /**
   * Cancel a shipment.
   */
  cancel(shipmentId, reason, author = 'system') {
    const current = this.get(shipmentId);
    if (!current) return { success: false, error: 'Shipment not found' };
    current.status = 'cancelled';
    current.audit.modifiedAt = new Date().toISOString();
    current.audit.modifiedBy = author;
    current.audit.warnings = current.audit.warnings || [];
    current.audit.warnings.push(`Cancelled: ${reason}`);
    return this.commit(current, author);
  }

  /**
   * Get active (non-delivered/non-cancelled) shipments.
   */
  getActiveShipments() {
    return [...this.shipments.values()]
      .filter(s => !['delivered', 'cancelled'].includes(s.data.status))
      .map(s => s.data);
  }

  /**
   * Get shipments by status.
   */
  getByStatus(status) {
    return [...this.shipments.values()]
      .filter(s => s.data.status === status)
      .map(s => s.data);
  }

  /**
   * Get shipments by carrier.
   */
  getByCarrier(carrierCode) {
    return [...this.shipments.values()]
      .filter(s => s.data.carrier.code === carrierCode)
      .map(s => s.data);
  }

  /**
   * List all shipments with optional filters.
   */
  list(filter = {}) {
    const results = [];
    for (const [id, entry] of this.shipments) {
      const s = entry.data;
      if (filter.status && s.status !== filter.status) continue;
      if (filter.carrier && s.carrier.code !== filter.carrier) continue;
      results.push({
        shipmentId: id,
        carrier: s.carrier.name,
        origin: s.route.origin.name,
        destination: s.route.destination.name,
        totalCost: s.costs.totalCost,
        status: s.status,
        versions: (this.history.get(id) || []).length,
      });
    }
    return results;
  }

  /**
   * Export full event log for auditing.
   */
  getEventLog() {
    return [...this.events];
  }

  /**
   * Summary stats for the entire ledger.
   */
  summary() {
    const all = [...this.shipments.values()].map(s => s.data);
    return {
      totalShipments: all.length,
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      byStatus: all.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
      totalCost: Math.round(all.reduce((s, sh) => s + (sh.costs.totalCost || 0), 0) * 100) / 100,
      podsRecorded: this.pods.size,
      reconciliationCount: this.reconciliations.length,
      eventCount: this.events.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  _nextVersion(shipmentId) {
    const versions = this.history.get(shipmentId);
    return versions ? versions.length + 1 : 1;
  }

  _hash(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
  }

  _emit(event, payload) {
    this.events.push({ event, timestamp: new Date().toISOString(), ...payload });
  }

  _deepDiff(a, b, path, changes) {
    if (typeof a !== typeof b) {
      changes.push({ path, from: a, to: b });
      return;
    }
    if (typeof a !== 'object' || a === null || b === null) {
      if (a !== b) changes.push({ path, from: a, to: b });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changes.push({ path, from: `[${a.length} items]`, to: `[${b.length} items]` });
      }
      return;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      this._deepDiff(a[key], b[key], path ? `${path}.${key}` : key, changes);
    }
  }
}

module.exports = { LogisticsLedger };
