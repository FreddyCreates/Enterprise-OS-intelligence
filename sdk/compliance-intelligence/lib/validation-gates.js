'use strict';

const { validateSchema } = require('./schema');

function gateSchemaCompleteness(record) {
  const result = validateSchema(record);
  return { gate: 'schema_completeness', passed: result.valid, errors: result.errors, warnings: [] };
}

function gateFindingValidity(record) {
  const warnings = [];
  for (const f of record.assessment.findings) {
    if (!f.title) warnings.push('Finding without title');
    if (f.status === 'open' && f.severity === 'critical' && !f.assignedTo) {
      warnings.push(`Critical finding "${f.title}" has no assignee`);
    }
    if (f.dueDate && new Date(f.dueDate) < new Date() && f.status === 'open') {
      warnings.push(`Finding "${f.title}" is past due date`);
    }
  }
  return { gate: 'finding_validity', passed: true, errors: [], warnings };
}

function gateControlCoverage(record) {
  const warnings = [];
  const implemented = record.assessment.controls.filter(c => c.status === 'implemented');
  const missing = record.assessment.controls.filter(c => c.status === 'missing');
  if (missing.length > 0) warnings.push(`${missing.length} controls marked as missing`);
  if (implemented.length > 0) {
    const avgEff = implemented.reduce((s, c) => s + c.effectiveness, 0) / implemented.length;
    if (avgEff < 50) warnings.push(`Average control effectiveness is low (${Math.round(avgEff)}%)`);
  }
  return { gate: 'control_coverage', passed: true, errors: [], warnings };
}

function gateEvidenceCompleteness(record) {
  const warnings = [];
  if (record.evidence.length === 0 && record.assessment.status !== 'pending') {
    warnings.push('No evidence collected for assessed record');
  }
  const unverified = record.evidence.filter(e => !e.verified);
  if (unverified.length > 0) warnings.push(`${unverified.length} evidence items not yet verified`);
  return { gate: 'evidence_completeness', passed: true, errors: [], warnings };
}

function runAllGates(record) {
  const gates = [gateSchemaCompleteness(record), gateFindingValidity(record), gateControlCoverage(record), gateEvidenceCompleteness(record)];
  return { passed: gates.every(g => g.passed), gates, errors: gates.flatMap(g => g.errors), warnings: gates.flatMap(g => g.warnings) };
}

module.exports = { gateSchemaCompleteness, gateFindingValidity, gateControlCoverage, gateEvidenceCompleteness, runAllGates };
