'use strict';

class WorkforceLedger {
  constructor() {
    this.records = new Map();
    this.history = new Map();
    this.timesheetApprovals = [];
  }

  commit(record, author = 'system') {
    const id = record.workerId;
    const version = this.history.has(id) ? this.history.get(id).length + 1 : 1;
    const versioned = { ...record, _version: version, _committedAt: new Date().toISOString(), _committedBy: author };
    this.records.set(id, versioned);
    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(JSON.parse(JSON.stringify(versioned)));
    return { id, version };
  }

  get(workerId) { return this.records.get(workerId) || null; }
  getHistory(workerId) { return this.history.get(workerId) || []; }
  getByDepartment(dept) { return [...this.records.values()].filter(r => r.worker.department === dept); }
  getActive() { return [...this.records.values()].filter(r => r.worker.status === 'active'); }

  approveTimesheet(workerId, periodEnd, approver) {
    const record = this.records.get(workerId);
    if (!record) return { success: false, error: 'Worker not found' };
    record.timesheet.entries.forEach(e => { e.approved = true; e.status = 'approved'; });
    this.timesheetApprovals.push({ workerId, periodEnd, approver, timestamp: new Date().toISOString() });
    this.commit(record, approver);
    return { success: true };
  }

  summary() {
    const all = [...this.records.values()];
    return {
      total: all.length,
      active: all.filter(r => r.worker.status === 'active').length,
      byDepartment: all.reduce((acc, r) => { const d = r.worker.department || 'unassigned'; acc[d] = (acc[d] || 0) + 1; return acc; }, {}),
      pendingTimesheets: all.filter(r => r.timesheet.entries.some(e => !e.approved)).length,
    };
  }
}

module.exports = { WorkforceLedger };
