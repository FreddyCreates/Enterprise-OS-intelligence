/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Compliance Data Standardizer       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankComplianceRecord, createFinding, createControl } = require('./schema');

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
}

function normalizeDate(input) {
  if (!input) return '';
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

function ingestStructured(data) {
  const record = createBlankComplianceRecord(data.recordId || data.id);

  // Entity
  if (data.entity || data.organization || data.company) {
    const e = data.entity || {};
    record.entity.name = e.name || data.organization || data.company || '';
    record.entity.type = e.type || data.entityType || '';
    record.entity.department = e.department || data.department || '';
    record.entity.jurisdiction = e.jurisdiction || data.jurisdiction || '';
  }

  // Regulation
  if (data.regulation || data.standard || data.framework) {
    const r = data.regulation || data.standard || data.framework || {};
    if (typeof r === 'string') {
      record.regulation.name = r;
    } else {
      record.regulation.code = r.code || r.id || '';
      record.regulation.name = r.name || r.title || '';
      record.regulation.category = r.category || '';
      record.regulation.authority = r.authority || r.issuer || '';
      record.regulation.effectiveDate = normalizeDate(r.effectiveDate || '');
      record.regulation.requirements = r.requirements || [];
    }
  }

  // Assessment
  if (data.assessment || data.audit) {
    const a = data.assessment || data.audit || {};
    record.assessment.status = a.status || 'pending';
    record.assessment.score = parseFloat(a.score || 0) || 0;
    record.assessment.lastAssessedAt = normalizeDate(a.date || a.lastAssessedAt || '');
    record.assessment.assessedBy = a.assessedBy || a.auditor || '';
  }

  // Findings
  if (Array.isArray(data.findings)) {
    record.assessment.findings = data.findings.map(f => createFinding(
      f.title || f.name || '',
      f.severity || 'medium',
      f.description || '',
      f.regulation || ''
    ));
  }

  // Controls
  if (Array.isArray(data.controls)) {
    record.assessment.controls = data.controls.map(c => createControl(
      c.name || c.title || '',
      c.type || 'detective',
      c.status || 'planned',
      c.effectiveness || 0
    ));
  }

  record.status = data.status || 'active';
  record.audit.createdAt = new Date().toISOString();
  record.audit.sourceHash = hashInput(JSON.stringify(data));
  record.audit.confidence = 1.0;
  return record;
}

function ingestRawText(text) {
  const cleaned = cleanText(text);
  const record = createBlankComplianceRecord();

  const regMatch = cleaned.match(/(?:Regulation|Standard|Framework|Policy)\s*:?\s*(.+)/i);
  if (regMatch) record.regulation.name = regMatch[1].trim();

  const entityMatch = cleaned.match(/(?:Organization|Company|Entity)\s*:?\s*(.+)/i);
  if (entityMatch) record.entity.name = entityMatch[1].trim();

  const statusMatch = cleaned.match(/(?:Status|Compliance Status)\s*:?\s*(compliant|non-compliant|partial|pending)/i);
  if (statusMatch) record.assessment.status = statusMatch[1].toLowerCase();

  const scoreMatch = cleaned.match(/(?:Score|Rating)\s*:?\s*([\d.]+)/i);
  if (scoreMatch) record.assessment.score = parseFloat(scoreMatch[1]);

  // Extract findings from bullet points
  const findingMatches = cleaned.match(/(?:Finding|Issue|Gap)\s*:?\s*(.+)/gi);
  if (findingMatches) {
    record.assessment.findings = findingMatches.map(f => {
      const text = f.replace(/(?:Finding|Issue|Gap)\s*:?\s*/i, '').trim();
      return createFinding(text, 'medium', text, '');
    });
  }

  record.audit.sourceHash = hashInput(text);
  record.audit.confidence = computeConfidence(record);
  record.audit.createdBy = 'ingest-normalize/raw-text';
  return record;
}

function hashInput(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16); }

function computeConfidence(record) {
  let score = 0, checks = 0;
  const check = (val) => { checks++; if (val) score++; };
  check(record.entity.name);
  check(record.regulation.name);
  check(record.assessment.status !== 'pending');
  check(record.assessment.findings.length > 0 || record.assessment.controls.length > 0);
  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = { cleanText, normalizeDate, ingestStructured, ingestRawText, hashInput, computeConfidence };
