/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       COMPLIANCE INTELLIGENCE — CANONICAL SCHEMA v1.0.0                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function createBlankComplianceRecord(recordId) {
  return {
    recordId: recordId || `CMP-${Date.now()}`,
    version: '1.0.0',
    entity: { name: '', type: '', department: '', jurisdiction: '' },
    regulation: { code: '', name: '', category: '', authority: '', effectiveDate: '', requirements: [] },
    assessment: { status: 'pending', score: 0, findings: [], controls: [], lastAssessedAt: '', assessedBy: '' },
    evidence: [],
    riskProfile: { level: 'unknown', factors: [], mitigations: [] },
    timeline: [],
    audit: { createdAt: new Date().toISOString(), createdBy: 'system', sourceHash: '', confidence: 0, warnings: [] },
    status: 'active',
  };
}

function createFinding(title, severity, description, regulation) {
  return {
    findingId: `FND-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    severity, // critical | high | medium | low | informational
    description,
    regulation: regulation || '',
    status: 'open', // open | remediated | accepted | disputed
    createdAt: new Date().toISOString(),
    dueDate: '',
    remediation: '',
    assignedTo: '',
  };
}

function createControl(name, type, status, effectiveness) {
  return {
    controlId: `CTL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    type, // preventive | detective | corrective | compensating
    status, // implemented | planned | missing | failed
    effectiveness: effectiveness || 0, // 0-100
    testDate: '',
    evidence: [],
  };
}

function createEvidence(type, description, source) {
  return {
    evidenceId: `EVD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, // document | screenshot | log | attestation | test-result
    description,
    source: source || '',
    collectedAt: new Date().toISOString(),
    verified: false,
  };
}

const REQUIRED_FIELDS = ['recordId', 'entity.name', 'regulation.name'];

function validateSchema(record) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = record;
    for (const p of parts) { val = val ? val[p] : undefined; }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { createBlankComplianceRecord, createFinding, createControl, createEvidence, validateSchema, REQUIRED_FIELDS };
