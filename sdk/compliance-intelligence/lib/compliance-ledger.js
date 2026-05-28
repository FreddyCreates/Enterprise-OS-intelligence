'use strict';

class ComplianceLedger {
  constructor() {
    this.records = new Map();
    this.history = new Map();
  }

  commit(record, author = 'system') {
    const id = record.recordId;
    const version = this.history.has(id) ? this.history.get(id).length + 1 : 1;
    const versioned = { ...record, _version: version, _committedAt: new Date().toISOString(), _committedBy: author };
    this.records.set(id, versioned);
    if (!this.history.has(id)) this.history.set(id, []);
    this.history.get(id).push(JSON.parse(JSON.stringify(versioned)));
    return { id, version };
  }

  get(recordId) { return this.records.get(recordId) || null; }
  getHistory(recordId) { return this.history.get(recordId) || []; }
  getByRegulation(regName) { return [...this.records.values()].filter(r => r.regulation.name === regName); }
  getByEntity(entityName) { return [...this.records.values()].filter(r => r.entity.name === entityName); }
  getByStatus(status) { return [...this.records.values()].filter(r => r.assessment.status === status); }

  summary() {
    const all = [...this.records.values()];
    return {
      total: all.length,
      byStatus: all.reduce((acc, r) => { acc[r.assessment.status] = (acc[r.assessment.status] || 0) + 1; return acc; }, {}),
      totalFindings: all.reduce((s, r) => s + r.assessment.findings.length, 0),
      openFindings: all.reduce((s, r) => s + r.assessment.findings.filter(f => f.status === 'open').length, 0),
      regulations: [...new Set(all.map(r => r.regulation.name).filter(Boolean))],
    };
  }
}

module.exports = { ComplianceLedger };
