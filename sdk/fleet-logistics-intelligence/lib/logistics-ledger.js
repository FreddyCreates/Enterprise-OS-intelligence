/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: LOGISTICS LEDGER — Versioned Shipment Store               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

class LogisticsLedger {
  constructor() {
    this.shipments = new Map();
    this.history = new Map();
    this.pods = new Map(); // Proof of Delivery records
  }

  commit(shipment, author = 'system') {
    const id = shipment.shipmentId;
    const version = this.history.has(id) ? this.history.get(id).length + 1 : 1;

    const versioned = { ...shipment, _version: version, _committedAt: new Date().toISOString(), _committedBy: author };
    this.shipments.set(id, versioned);
    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(JSON.parse(JSON.stringify(versioned)));

    return { id, version, committedAt: versioned._committedAt };
  }

  get(shipmentId) { return this.shipments.get(shipmentId) || null; }
  getHistory(shipmentId) { return this.history.get(shipmentId) || []; }

  recordPOD(shipmentId, signature, receivedBy, notes) {
    const pod = {
      shipmentId,
      timestamp: new Date().toISOString(),
      signature: signature || '',
      receivedBy: receivedBy || '',
      notes: notes || '',
      verified: true,
    };
    this.pods.set(shipmentId, pod);
    return pod;
  }

  getPOD(shipmentId) { return this.pods.get(shipmentId) || null; }

  getActiveShipments() {
    return [...this.shipments.values()].filter(s => !['delivered', 'cancelled'].includes(s.status));
  }

  getByStatus(status) {
    return [...this.shipments.values()].filter(s => s.status === status);
  }

  summary() {
    const all = [...this.shipments.values()];
    return {
      total: all.length,
      byStatus: all.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      podsRecorded: this.pods.size,
    };
  }
}

module.exports = { LogisticsLedger };
