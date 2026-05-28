/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: PROCUREMENT LEDGER — Versioned PO Store & Reconciliation  ║
 * ║                                                                            ║
 * ║  Stores versioned purchase order facts, tracks approval chains,            ║
 * ║  reconciliation, and provides full audit history for AI retrieval.          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// PROCUREMENT LEDGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ProcurementLedger {
  constructor(options = {}) {
    this.orders = new Map();        // poNumber → current record
    this.history = new Map();       // poNumber → version[]
    this.approvalLog = [];          // All approval events
    this.events = [];               // Append-only event log
    this.reconciliations = [];      // Invoice reconciliation records
    this.persistence = options.persistence || null;
  }

  /**
   * Store a new PO or a new version of an existing PO.
   */
  commit(po, author = 'system') {
    const id = po.poNumber;
    const version = this._nextVersion(id);

    const record = {
      version,
      data: JSON.parse(JSON.stringify(po)),
      committedAt: new Date().toISOString(),
      committedBy: author,
      hash: this._hash(po),
    };

    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(record);
    this.orders.set(id, record);

    this._emit('commit', { poNumber: id, version, author });
    return { id, version, committedAt: record.committedAt, hash: record.hash };
  }

  /**
   * Get the current version of a PO.
   */
  get(poNumber) {
    const entry = this.orders.get(poNumber);
    return entry ? entry.data : null;
  }

  /**
   * Get a specific version.
   */
  getVersion(poNumber, version) {
    const versions = this.history.get(poNumber);
    if (!versions) return null;
    const record = versions.find(v => v.version === version);
    return record ? record.data : null;
  }

  /**
   * Get full version history.
   */
  getHistory(poNumber) {
    const versions = this.history.get(poNumber);
    if (!versions) return [];
    return versions.map(v => ({
      version: v.version,
      committedAt: v.committedAt,
      committedBy: v.committedBy,
      hash: v.hash,
      status: v.data.status,
      totalAmount: v.data.totals ? v.data.totals.totalAmount : 0,
    }));
  }

  /**
   * Diff two versions of a PO.
   */
  diff(poNumber, versionA, versionB) {
    const a = this.getVersion(poNumber, versionA);
    const b = this.getVersion(poNumber, versionB);
    if (!a || !b) return null;

    const changes = [];
    this._deepDiff(a, b, '', changes);
    return { poNumber, from: versionA, to: versionB, changes };
  }

  /**
   * Approve a PO.
   */
  approve(poNumber, approver, role, comment = '') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };

    const approval = {
      approver,
      role,
      status: 'approved',
      timestamp: new Date().toISOString(),
      comment,
    };
    po.approvals.push(approval);
    this.approvalLog.push({ poNumber, ...approval });

    if (po.status === 'pending-approval') po.status = 'approved';
    this.commit(po, approver);
    this._emit('approve', { poNumber, approver, role });
    return { success: true, approval };
  }

  /**
   * Reject a PO.
   */
  reject(poNumber, approver, role, reason = '') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };

    const rejection = {
      approver,
      role,
      status: 'rejected',
      timestamp: new Date().toISOString(),
      comment: reason,
    };
    po.approvals.push(rejection);
    this.approvalLog.push({ poNumber, ...rejection });
    po.status = 'draft';

    this.commit(po, approver);
    this._emit('reject', { poNumber, approver, role, reason });
    return { success: true, rejection };
  }

  /**
   * Record goods receipt against a PO.
   */
  receiveGoods(poNumber, lineNumber, receivedQty, receivedBy, notes = '') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };

    const line = po.lineItems.find(li => li.lineNumber === lineNumber);
    if (!line) return { success: false, error: 'Line item not found' };

    line.receivedQty = (line.receivedQty || 0) + receivedQty;
    line.lastReceived = new Date().toISOString();
    line.receivedBy = receivedBy;

    // Check if fully received
    if (line.receivedQty >= line.quantity) {
      line.status = 'received';
    } else {
      line.status = 'partial';
    }

    // Update PO status if all lines received
    const allReceived = po.lineItems.every(li => (li.receivedQty || 0) >= li.quantity);
    if (allReceived) po.status = 'received';

    this.commit(po, receivedBy);
    this._emit('goods_received', { poNumber, lineNumber, receivedQty, receivedBy });
    return { success: true, line, allReceived };
  }

  /**
   * Reconcile PO against vendor invoice.
   */
  reconcile(poNumber, invoiceAmount, invoiceRef, notes = '') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };

    const poAmount = po.totals.totalAmount;
    const variance = Math.round((invoiceAmount - poAmount) * 100) / 100;
    const variancePercent = poAmount > 0
      ? Math.round((variance / poAmount) * 10000) / 100
      : 0;

    const record = {
      reconcileId: `REC-${Date.now()}`,
      poNumber,
      invoiceRef,
      timestamp: new Date().toISOString(),
      poAmount,
      invoiceAmount,
      variance,
      variancePercent,
      match: Math.abs(variancePercent) <= 2,
      notes,
      status: Math.abs(variancePercent) <= 2 ? 'reconciled' : 'discrepancy',
    };

    this.reconciliations.push(record);
    this._emit('reconcile', record);
    return record;
  }

  /**
   * Get reconciliation records.
   */
  getReconciliations(poNumber) {
    return this.reconciliations.filter(r => r.poNumber === poNumber);
  }

  /**
   * Close a PO (no further changes).
   */
  close(poNumber, author = 'system') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };
    po.status = 'closed';
    po.audit.modifiedAt = new Date().toISOString();
    po.audit.modifiedBy = author;
    this._emit('close', { poNumber, author });
    return this.commit(po, author);
  }

  /**
   * Cancel a PO.
   */
  cancel(poNumber, reason, author = 'system') {
    const po = this.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };
    po.status = 'cancelled';
    po.audit.modifiedAt = new Date().toISOString();
    po.audit.modifiedBy = author;
    po.audit.warnings = po.audit.warnings || [];
    po.audit.warnings.push(`Cancelled: ${reason}`);
    this._emit('cancel', { poNumber, reason, author });
    return this.commit(po, author);
  }

  /**
   * Query methods.
   */
  getByStatus(status) {
    return [...this.orders.values()].filter(e => e.data.status === status).map(e => e.data);
  }

  getByVendor(vendorCode) {
    return [...this.orders.values()].filter(e => e.data.vendor.code === vendorCode).map(e => e.data);
  }

  getByDepartment(department) {
    return [...this.orders.values()].filter(e => e.data.buyer.department === department).map(e => e.data);
  }

  getPendingApprovals() {
    return this.getByStatus('pending-approval');
  }

  /**
   * List all POs with optional filters.
   */
  list(filter = {}) {
    const results = [];
    for (const [id, entry] of this.orders) {
      const po = entry.data;
      if (filter.status && po.status !== filter.status) continue;
      if (filter.vendor && po.vendor.code !== filter.vendor) continue;
      if (filter.department && po.buyer.department !== filter.department) continue;
      results.push({
        poNumber: id,
        vendor: po.vendor.name,
        total: po.totals.totalAmount,
        status: po.status,
        orderDate: po.terms.orderDate,
        versions: (this.history.get(id) || []).length,
      });
    }
    return results;
  }

  /**
   * Export full event log.
   */
  getEventLog() {
    return [...this.events];
  }

  /**
   * Summary stats.
   */
  summary() {
    const all = [...this.orders.values()].map(e => e.data);
    return {
      totalOrders: all.length,
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      byStatus: all.reduce((acc, po) => { acc[po.status] = (acc[po.status] || 0) + 1; return acc; }, {}),
      totalValue: Math.round(all.reduce((s, po) => s + (po.totals.totalAmount || 0), 0) * 100) / 100,
      pendingApprovals: this.getPendingApprovals().length,
      reconciliationCount: this.reconciliations.length,
      eventCount: this.events.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  _nextVersion(poNumber) {
    const versions = this.history.get(poNumber);
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

module.exports = { ProcurementLedger };
