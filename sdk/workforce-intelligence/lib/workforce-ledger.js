/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: WORKFORCE LEDGER — Versioned Worker Store                 ║
 * ║                                                                            ║
 * ║  Stores versioned workforce records, tracks timesheet approvals,           ║
 * ║  schedule changes, and provides full audit history for AI retrieval.        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFORCE LEDGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class WorkforceLedger {
  constructor(options = {}) {
    this.records = new Map();           // workerId → current record
    this.history = new Map();           // workerId → version[]
    this.timesheetApprovals = [];       // All timesheet approval events
    this.events = [];                   // Append-only event log
    this.payrollRuns = [];              // Payroll run records
    this.persistence = options.persistence || null;
  }

  /**
   * Store a new or updated workforce record.
   */
  commit(record, author = 'system') {
    const id = record.workerId;
    const version = this._nextVersion(id);

    const versionRecord = {
      version,
      data: JSON.parse(JSON.stringify(record)),
      committedAt: new Date().toISOString(),
      committedBy: author,
      hash: this._hash(record),
    };

    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(versionRecord);
    this.records.set(id, versionRecord);

    this._emit('commit', { workerId: id, version, author });
    return { id, version, committedAt: versionRecord.committedAt, hash: versionRecord.hash };
  }

  /**
   * Get the current version of a worker record.
   */
  get(workerId) {
    const entry = this.records.get(workerId);
    return entry ? entry.data : null;
  }

  /**
   * Get a specific version.
   */
  getVersion(workerId, version) {
    const versions = this.history.get(workerId);
    if (!versions) return null;
    const record = versions.find(v => v.version === version);
    return record ? record.data : null;
  }

  /**
   * Get full version history.
   */
  getHistory(workerId) {
    const versions = this.history.get(workerId);
    if (!versions) return [];
    return versions.map(v => ({
      version: v.version,
      committedAt: v.committedAt,
      committedBy: v.committedBy,
      hash: v.hash,
      status: v.data.worker.status,
      totalHours: v.data.timesheet.totalHours,
    }));
  }

  /**
   * Diff two versions.
   */
  diff(workerId, versionA, versionB) {
    const a = this.getVersion(workerId, versionA);
    const b = this.getVersion(workerId, versionB);
    if (!a || !b) return null;

    const changes = [];
    this._deepDiff(a, b, '', changes);
    return { workerId, from: versionA, to: versionB, changes };
  }

  /**
   * Approve timesheet for a worker.
   */
  approveTimesheet(workerId, periodEnd, approver, notes = '') {
    const record = this.get(workerId);
    if (!record) return { success: false, error: 'Worker not found' };

    const entriesToApprove = record.timesheet.entries.filter(e => !e.approved);
    entriesToApprove.forEach(e => {
      e.approved = true;
      e.status = 'approved';
      e.approvedBy = approver;
      e.approvedAt = new Date().toISOString();
    });

    const approval = {
      workerId,
      periodEnd,
      approver,
      timestamp: new Date().toISOString(),
      entriesApproved: entriesToApprove.length,
      totalHours: entriesToApprove.reduce((s, e) => s + (e.netHours || 0), 0),
      notes,
    };
    this.timesheetApprovals.push(approval);

    this.commit(record, approver);
    this._emit('timesheet_approved', approval);
    return { success: true, approval };
  }

  /**
   * Reject timesheet entries.
   */
  rejectTimesheet(workerId, periodEnd, rejectedBy, reason = '') {
    const record = this.get(workerId);
    if (!record) return { success: false, error: 'Worker not found' };

    const entriesToReject = record.timesheet.entries.filter(e => !e.approved);
    entriesToReject.forEach(e => {
      e.status = 'rejected';
      e.rejectedBy = rejectedBy;
      e.rejectedAt = new Date().toISOString();
      e.rejectionReason = reason;
    });

    this.commit(record, rejectedBy);
    this._emit('timesheet_rejected', { workerId, periodEnd, rejectedBy, reason, count: entriesToReject.length });
    return { success: true, rejected: entriesToReject.length };
  }

  /**
   * Add a timesheet entry.
   */
  addTimesheetEntry(workerId, entry, author = 'system') {
    const record = this.get(workerId);
    if (!record) return { success: false, error: 'Worker not found' };

    const newEntry = {
      date: entry.date,
      dayOfWeek: entry.dayOfWeek || '',
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      breakMinutes: entry.breakMinutes || 0,
      netHours: entry.netHours || 0,
      grossHours: entry.grossHours || entry.netHours || 0,
      approved: false,
      status: 'pending',
      addedAt: new Date().toISOString(),
    };

    record.timesheet.entries.push(newEntry);
    record.timesheet.totalHours = record.timesheet.entries.reduce((s, e) => s + (e.netHours || 0), 0);

    this.commit(record, author);
    this._emit('timesheet_entry_added', { workerId, date: entry.date });
    return { success: true, entry: newEntry };
  }

  /**
   * Update worker status (active/inactive/leave/terminated).
   */
  updateStatus(workerId, newStatus, author = 'system', reason = '') {
    const record = this.get(workerId);
    if (!record) return { success: false, error: 'Worker not found' };

    const oldStatus = record.worker.status;
    record.worker.status = newStatus;
    record.audit.modifiedAt = new Date().toISOString();
    record.audit.modifiedBy = author;

    this.commit(record, author);
    this._emit('status_change', { workerId, oldStatus, newStatus, reason, author });
    return { success: true, oldStatus, newStatus };
  }

  /**
   * Run payroll calculation for all active workers.
   */
  runPayroll(periodStart, periodEnd, processedBy) {
    const activeRecords = this.getActive();
    const payrollItems = activeRecords.map(record => {
      const periodEntries = record.timesheet.entries.filter(e =>
        e.date >= periodStart && e.date <= periodEnd && e.approved
      );
      const regularHours = Math.min(periodEntries.reduce((s, e) => s + (e.netHours || 0), 0), 40 * 2);
      const overtimeHours = Math.max(0, periodEntries.reduce((s, e) => s + (e.netHours || 0), 0) - 40 * 2);

      return {
        workerId: record.workerId,
        name: record.worker.name,
        department: record.worker.department,
        periodEntries: periodEntries.length,
        regularHours,
        overtimeHours,
        regularPay: Math.round(regularHours * record.costs.hourlyRate * 100) / 100,
        overtimePay: Math.round(overtimeHours * (record.costs.overtimeRate || record.costs.hourlyRate * 1.5) * 100) / 100,
        totalPay: 0,
      };
      // Don't compute totalPay inside map to keep consistent
    }).map(item => {
      item.totalPay = Math.round((item.regularPay + item.overtimePay) * 100) / 100;
      return item;
    });

    const run = {
      payrollId: `PAY-${Date.now()}`,
      periodStart,
      periodEnd,
      processedBy,
      processedAt: new Date().toISOString(),
      workers: payrollItems.length,
      totalRegularPay: Math.round(payrollItems.reduce((s, i) => s + i.regularPay, 0) * 100) / 100,
      totalOvertimePay: Math.round(payrollItems.reduce((s, i) => s + i.overtimePay, 0) * 100) / 100,
      totalPay: Math.round(payrollItems.reduce((s, i) => s + i.totalPay, 0) * 100) / 100,
      items: payrollItems,
    };

    this.payrollRuns.push(run);
    this._emit('payroll_run', { payrollId: run.payrollId, periodStart, periodEnd, totalPay: run.totalPay });
    return run;
  }

  /**
   * Query methods.
   */
  getByDepartment(dept) {
    return [...this.records.values()].filter(e => e.data.worker.department === dept).map(e => e.data);
  }

  getActive() {
    return [...this.records.values()].filter(e => e.data.worker.status === 'active').map(e => e.data);
  }

  getByStatus(status) {
    return [...this.records.values()].filter(e => e.data.worker.status === status).map(e => e.data);
  }

  getBySkill(skill) {
    return [...this.records.values()]
      .filter(e => (e.data.worker.skills || []).includes(skill))
      .map(e => e.data);
  }

  getPendingTimesheets() {
    return [...this.records.values()]
      .filter(e => e.data.timesheet.entries.some(entry => !entry.approved))
      .map(e => e.data);
  }

  /**
   * List all records with optional filters.
   */
  list(filter = {}) {
    const results = [];
    for (const [id, entry] of this.records) {
      const r = entry.data;
      if (filter.status && r.worker.status !== filter.status) continue;
      if (filter.department && r.worker.department !== filter.department) continue;
      results.push({
        workerId: id,
        name: r.worker.name,
        department: r.worker.department,
        role: r.worker.role,
        status: r.worker.status,
        totalHours: r.timesheet.totalHours,
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
    const all = [...this.records.values()].map(e => e.data);
    return {
      totalWorkers: all.length,
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      active: all.filter(r => r.worker.status === 'active').length,
      byDepartment: all.reduce((acc, r) => {
        const d = r.worker.department || 'unassigned';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {}),
      byStatus: all.reduce((acc, r) => {
        acc[r.worker.status] = (acc[r.worker.status] || 0) + 1;
        return acc;
      }, {}),
      pendingTimesheets: all.filter(r => r.timesheet.entries.some(e => !e.approved)).length,
      totalHoursLogged: Math.round(all.reduce((s, r) => s + r.timesheet.totalHours, 0) * 100) / 100,
      payrollRuns: this.payrollRuns.length,
      eventCount: this.events.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  _nextVersion(workerId) {
    const versions = this.history.get(workerId);
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

module.exports = { WorkforceLedger };
