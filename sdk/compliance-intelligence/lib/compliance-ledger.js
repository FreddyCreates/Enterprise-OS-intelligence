/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 5: COMPLIANCE LEDGER — Versioned Assessment Store            ║
 * ║                                                                            ║
 * ║  Stores versioned compliance assessments, tracks findings lifecycle,       ║
 * ║  evidence chains, and provides full audit history for AI retrieval.         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE LEDGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ComplianceLedger {
  constructor(options = {}) {
    this.records = new Map();        // recordId → current record
    this.history = new Map();        // recordId → version[]
    this.events = [];                // Append-only event log
    this.findingActions = [];        // Finding remediation actions
    this.auditTrail = [];            // External audit submissions
    this.persistence = options.persistence || null;
  }

  /**
   * Store a new or updated compliance record.
   */
  commit(record, author = 'system') {
    const id = record.recordId;
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

    this._emit('commit', { recordId: id, version, author });
    return { id, version, committedAt: versionRecord.committedAt, hash: versionRecord.hash };
  }

  /**
   * Get the current version.
   */
  get(recordId) {
    const entry = this.records.get(recordId);
    return entry ? entry.data : null;
  }

  /**
   * Get a specific version.
   */
  getVersion(recordId, version) {
    const versions = this.history.get(recordId);
    if (!versions) return null;
    const record = versions.find(v => v.version === version);
    return record ? record.data : null;
  }

  /**
   * Get full version history.
   */
  getHistory(recordId) {
    const versions = this.history.get(recordId);
    if (!versions) return [];
    return versions.map(v => ({
      version: v.version,
      committedAt: v.committedAt,
      committedBy: v.committedBy,
      hash: v.hash,
      status: v.data.assessment.status,
      score: v.data.assessment.score,
      riskLevel: v.data.riskProfile.level,
    }));
  }

  /**
   * Diff two versions.
   */
  diff(recordId, versionA, versionB) {
    const a = this.getVersion(recordId, versionA);
    const b = this.getVersion(recordId, versionB);
    if (!a || !b) return null;

    const changes = [];
    this._deepDiff(a, b, '', changes);
    return { recordId, from: versionA, to: versionB, changes };
  }

  /**
   * Add a finding to a compliance record.
   */
  addFinding(recordId, finding, author = 'system') {
    const record = this.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const newFinding = {
      findingId: finding.findingId || `FND-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: finding.title,
      description: finding.description || '',
      severity: finding.severity || 'medium',
      status: 'open',
      assignedTo: finding.assignedTo || '',
      dueDate: finding.dueDate || null,
      regulation: finding.regulation || record.regulation.name,
      createdAt: new Date().toISOString(),
      createdBy: author,
    };

    record.assessment.findings.push(newFinding);
    this.commit(record, author);
    this._emit('finding_added', { recordId, findingId: newFinding.findingId, severity: newFinding.severity });
    return { success: true, finding: newFinding };
  }

  /**
   * Remediate (close) a finding.
   */
  remediateFinding(recordId, findingId, remediation, remediatedBy) {
    const record = this.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const finding = record.assessment.findings.find(f => f.findingId === findingId);
    if (!finding) return { success: false, error: 'Finding not found' };

    finding.status = 'remediated';
    finding.remediatedAt = new Date().toISOString();
    finding.remediatedBy = remediatedBy;
    finding.remediation = remediation;

    this.findingActions.push({
      recordId,
      findingId,
      action: 'remediate',
      by: remediatedBy,
      timestamp: new Date().toISOString(),
      notes: remediation,
    });

    this.commit(record, remediatedBy);
    this._emit('finding_remediated', { recordId, findingId, remediatedBy });
    return { success: true, finding };
  }

  /**
   * Accept risk for a finding (won't fix).
   */
  acceptRisk(recordId, findingId, acceptedBy, justification) {
    const record = this.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const finding = record.assessment.findings.find(f => f.findingId === findingId);
    if (!finding) return { success: false, error: 'Finding not found' };

    finding.status = 'risk-accepted';
    finding.riskAcceptedAt = new Date().toISOString();
    finding.riskAcceptedBy = acceptedBy;
    finding.justification = justification;

    this.findingActions.push({
      recordId,
      findingId,
      action: 'accept_risk',
      by: acceptedBy,
      timestamp: new Date().toISOString(),
      notes: justification,
    });

    this.commit(record, acceptedBy);
    this._emit('risk_accepted', { recordId, findingId, acceptedBy });
    return { success: true, finding };
  }

  /**
   * Add evidence to a record.
   */
  addEvidence(recordId, evidence, author = 'system') {
    const record = this.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const newEvidence = {
      evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: evidence.type || 'document',
      description: evidence.description,
      source: evidence.source || '',
      collectedAt: new Date().toISOString(),
      collectedBy: author,
      reference: evidence.reference || '',
    };

    record.evidence.push(newEvidence);
    this.commit(record, author);
    this._emit('evidence_added', { recordId, evidenceId: newEvidence.evidenceId });
    return { success: true, evidence: newEvidence };
  }

  /**
   * Submit for external audit.
   */
  submitForAudit(recordId, auditor, auditType, author = 'system') {
    const record = this.get(recordId);
    if (!record) return { success: false, error: 'Record not found' };

    const submission = {
      submissionId: `AUD-${Date.now()}`,
      recordId,
      auditor,
      auditType,
      submittedAt: new Date().toISOString(),
      submittedBy: author,
      status: 'submitted',
    };

    this.auditTrail.push(submission);
    record.assessment.status = 'under-audit';
    this.commit(record, author);
    this._emit('audit_submitted', submission);
    return { success: true, submission };
  }

  /**
   * Record audit result.
   */
  recordAuditResult(submissionId, result, auditorNotes, score) {
    const submission = this.auditTrail.find(s => s.submissionId === submissionId);
    if (!submission) return { success: false, error: 'Submission not found' };

    submission.status = result; // passed | failed | conditional
    submission.completedAt = new Date().toISOString();
    submission.auditorNotes = auditorNotes;
    submission.auditScore = score;

    const record = this.get(submission.recordId);
    if (record) {
      record.assessment.status = result === 'passed' ? 'compliant' : result === 'failed' ? 'non-compliant' : 'conditional';
      if (score !== undefined) record.assessment.score = score;
      this.commit(record, 'audit-system');
    }

    this._emit('audit_completed', { submissionId, result, score });
    return { success: true, submission };
  }

  /**
   * Query methods.
   */
  getByRegulation(regName) {
    return [...this.records.values()].filter(e => e.data.regulation.name === regName).map(e => e.data);
  }

  getByEntity(entityName) {
    return [...this.records.values()].filter(e => e.data.entity.name === entityName).map(e => e.data);
  }

  getByStatus(status) {
    return [...this.records.values()].filter(e => e.data.assessment.status === status).map(e => e.data);
  }

  getByRiskLevel(level) {
    return [...this.records.values()].filter(e => e.data.riskProfile.level === level).map(e => e.data);
  }

  getNonCompliant() {
    return this.getByStatus('non-compliant');
  }

  getCriticalFindings() {
    const results = [];
    for (const [, entry] of this.records) {
      const criticals = entry.data.assessment.findings.filter(f => f.severity === 'critical' && f.status === 'open');
      if (criticals.length > 0) {
        results.push({ recordId: entry.data.recordId, entity: entry.data.entity.name, findings: criticals });
      }
    }
    return results;
  }

  /**
   * List all records with optional filters.
   */
  list(filter = {}) {
    const results = [];
    for (const [id, entry] of this.records) {
      const r = entry.data;
      if (filter.status && r.assessment.status !== filter.status) continue;
      if (filter.regulation && r.regulation.name !== filter.regulation) continue;
      if (filter.riskLevel && r.riskProfile.level !== filter.riskLevel) continue;
      results.push({
        recordId: id,
        entity: r.entity.name,
        regulation: r.regulation.name,
        status: r.assessment.status,
        score: r.assessment.score,
        riskLevel: r.riskProfile.level,
        findings: r.assessment.findings.length,
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
      totalRecords: all.length,
      totalVersions: [...this.history.values()].reduce((s, h) => s + h.length, 0),
      byStatus: all.reduce((acc, r) => { acc[r.assessment.status] = (acc[r.assessment.status] || 0) + 1; return acc; }, {}),
      byRiskLevel: all.reduce((acc, r) => { acc[r.riskProfile.level] = (acc[r.riskProfile.level] || 0) + 1; return acc; }, {}),
      totalFindings: all.reduce((s, r) => s + r.assessment.findings.length, 0),
      openFindings: all.reduce((s, r) => s + r.assessment.findings.filter(f => f.status === 'open').length, 0),
      criticalFindings: all.reduce((s, r) => s + r.assessment.findings.filter(f => f.severity === 'critical' && f.status === 'open').length, 0),
      regulations: [...new Set(all.map(r => r.regulation.name).filter(Boolean))],
      auditSubmissions: this.auditTrail.length,
      eventCount: this.events.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  _nextVersion(recordId) {
    const versions = this.history.get(recordId);
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

module.exports = { ComplianceLedger };
