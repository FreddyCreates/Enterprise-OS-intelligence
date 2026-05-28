/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: PROCUREMENT LEDGER — Versioned PO Store                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

class ProcurementLedger {
  constructor() {
    this.orders = new Map();
    this.history = new Map();
    this.approvalLog = [];
  }

  commit(po, author = 'system') {
    const id = po.poNumber;
    const version = this.history.has(id) ? this.history.get(id).length + 1 : 1;
    const versioned = { ...po, _version: version, _committedAt: new Date().toISOString(), _committedBy: author };
    this.orders.set(id, versioned);
    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(JSON.parse(JSON.stringify(versioned)));
    return { id, version, committedAt: versioned._committedAt };
  }

  get(poNumber) { return this.orders.get(poNumber) || null; }
  getHistory(poNumber) { return this.history.get(poNumber) || []; }

  approve(poNumber, approver, role, comment) {
    const po = this.orders.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };
    const approval = { approver, role, status: 'approved', timestamp: new Date().toISOString(), comment: comment || '' };
    po.approvals.push(approval);
    this.approvalLog.push({ poNumber, ...approval });
    if (po.status === 'pending-approval') po.status = 'approved';
    this.commit(po, approver);
    return { success: true, approval };
  }

  reject(poNumber, approver, role, reason) {
    const po = this.orders.get(poNumber);
    if (!po) return { success: false, error: 'PO not found' };
    const rejection = { approver, role, status: 'rejected', timestamp: new Date().toISOString(), comment: reason || '' };
    po.approvals.push(rejection);
    this.approvalLog.push({ poNumber, ...rejection });
    po.status = 'draft';
    this.commit(po, approver);
    return { success: true, rejection };
  }

  getByStatus(status) { return [...this.orders.values()].filter(po => po.status === status); }
  getByVendor(vendorCode) { return [...this.orders.values()].filter(po => po.vendor.code === vendorCode); }

  getPendingApprovals() { return this.getByStatus('pending-approval'); }

  summary() {
    const all = [...this.orders.values()];
    return {
      total: all.length,
      byStatus: all.reduce((acc, po) => { acc[po.status] = (acc[po.status] || 0) + 1; return acc; }, {}),
      totalValue: Math.round(all.reduce((s, po) => s + po.totals.totalAmount, 0) * 100) / 100,
      pendingApprovals: this.getPendingApprovals().length,
    };
  }
}

module.exports = { ProcurementLedger };
