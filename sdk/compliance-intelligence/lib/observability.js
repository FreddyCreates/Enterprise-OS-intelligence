'use strict';

function computeConfidenceScore(record, validationResults) {
  const weights = { schema: 0.20, findings: 0.25, controls: 0.20, evidence: 0.20, noWarnings: 0.15 };
  const scores = {
    schema: validationResults.gates[0].passed ? 1 : 0,
    findings: record.assessment.findings.length > 0 ? 1 : 0.5,
    controls: record.assessment.controls.length > 0 ? 1 : 0.5,
    evidence: record.evidence.length > 0 ? 1 : 0.3,
    noWarnings: validationResults.warnings.length === 0 ? 1 : Math.max(0, 1 - validationResults.warnings.length * 0.1),
  };
  const weighted = Object.entries(weights).reduce((sum, [k, w]) => sum + (scores[k] * w), 0);
  const score = Math.round(weighted * 100) / 100;
  const grade = score >= 0.9 ? 'A' : score >= 0.75 ? 'B' : score >= 0.6 ? 'C' : 'D';
  return { score, grade, breakdown: scores };
}

function generateExplainability(record, validationResults, confidence) {
  return {
    recordId: record.recordId,
    summary: `${record.entity.name} compliance with ${record.regulation.name}. Status: ${record.assessment.status}. Score: ${record.assessment.score}. Confidence: ${confidence.grade}.`,
    dataLineage: { source: record.audit.createdBy, createdAt: record.audit.createdAt, sourceHash: record.audit.sourceHash },
    validationTrace: validationResults.gates.map(g => ({ gate: g.gate, passed: g.passed, issues: [...g.errors, ...g.warnings] })),
  };
}

module.exports = { computeConfidenceScore, generateExplainability };
