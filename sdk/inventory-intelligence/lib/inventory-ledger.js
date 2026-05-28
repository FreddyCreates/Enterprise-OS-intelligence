/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: INVENTORY LEDGER — Versioned Stock Store                  ║
 * ║                                                                            ║
 * ║  Maintains versioned inventory snapshots with full audit trail,            ║
 * ║  reconciliation, and cycle-count verification.                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY LEDGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class InventoryLedger {
  constructor() {
    this.records = new Map();        // recordId -> current record
    this.history = new Map();        // recordId -> version[]
    this.snapshots = [];             // periodic snapshots
    this.reconciliations = [];       // cycle count results
  }

  /**
   * Commit a new or updated inventory record
   */
  commit(record, author = 'system') {
    const id = record.recordId;
    const version = this.history.has(id) ? this.history.get(id).length + 1 : 1;

    const versioned = {
      ...record,
      _version: version,
      _committedAt: new Date().toISOString(),
      _committedBy: author,
    };

    this.records.set(id, versioned);
    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(JSON.parse(JSON.stringify(versioned)));

    return { id, version, committedAt: versioned._committedAt };
  }

  /**
   * Get current state of a record
   */
  get(recordId) {
    return this.records.get(recordId) || null;
  }

  /**
   * Get version history for a record
   */
  getHistory(recordId) {
    return this.history.get(recordId) || [];
  }

  /**
   * Take a snapshot of all current inventory
   */
  takeSnapshot(label = '') {
    const snapshot = {
      snapshotId: `SNAP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      recordCount: this.records.size,
      records: Object.fromEntries(
        [...this.records.entries()].map(([id, rec]) => [id, JSON.parse(JSON.stringify(rec))])
      ),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Perform cycle count reconciliation
   */
  reconcile(recordId, physicalCounts, countedBy) {
    const record = this.records.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const systemCount = record.levels.onHand;
    const physicalTotal = typeof physicalCounts === 'number' ? physicalCounts : physicalCounts.total || 0;
    const variance = physicalTotal - systemCount;
    const variancePercent = systemCount > 0 ? Math.round((variance / systemCount) * 10000) / 100 : 0;

    const reconciliation = {
      reconcileId: `REC-${Date.now()}`,
      recordId,
      timestamp: new Date().toISOString(),
      countedBy,
      systemCount,
      physicalCount: physicalTotal,
      variance,
      variancePercent,
      status: Math.abs(variancePercent) <= 2 ? 'acceptable' : 'requires-investigation',
      adjustmentApplied: false,
    };

    this.reconciliations.push(reconciliation);
    return reconciliation;
  }

  /**
   * Apply adjustment after reconciliation approval
   */
  applyAdjustment(reconcileId, approvedBy) {
    const rec = this.reconciliations.find(r => r.reconcileId === reconcileId);
    if (!rec) return { success: false, error: 'Reconciliation not found' };

    const record = this.records.get(rec.recordId);
    if (!record) return { success: false, error: 'Record not found' };

    record.levels.onHand = rec.physicalCount;
    record.levels.available = record.levels.onHand - record.levels.allocated;
    record.audit.modifiedAt = new Date().toISOString();
    record.audit.modifiedBy = approvedBy;
    record.audit.warnings.push(`Cycle count adjustment: ${rec.variance} units (${rec.variancePercent}%)`);

    rec.adjustmentApplied = true;
    this.commit(record, approvedBy);

    return { success: true, newOnHand: record.levels.onHand, variance: rec.variance };
  }

  /**
   * Get all records needing attention
   */
  getAlerts() {
    const alerts = [];
    for (const [id, record] of this.records) {
      if (record.levels.available <= 0) {
        alerts.push({ type: 'stockout', recordId: id, severity: 'critical' });
      }
      if (record.status === 'overstocked') {
        alerts.push({ type: 'overstock', recordId: id, severity: 'warning' });
      }
    }
    return alerts;
  }

  /**
   * Summary stats for the entire ledger
   */
  summary() {
    return {
      totalRecords: this.records.size,
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      snapshotCount: this.snapshots.length,
      reconciliationCount: this.reconciliations.length,
      lastSnapshot: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].timestamp : null,
    };
  }
}

module.exports = { InventoryLedger };
