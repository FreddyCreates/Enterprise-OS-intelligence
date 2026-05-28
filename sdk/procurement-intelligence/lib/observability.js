'use strict';

function computeConfidenceScore(po, validationResults) {
  const weights = { schema: 0.30, totals: 0.25, approvals: 0.20, lineItems: 0.15, noWarnings: 0.10 };
  const scores = {
    schema: validationResults.gates[0].passed ? 1 : 0,
    totals: validationResults.gates[1].passed ? 1 : 0,
    approvals: po.approvals.length > 0 ? 1 : 0.5,
    lineItems: po.lineItems.length > 0 ? 1 : 0,
    noWarnings: validationResults.warnings.length === 0 ? 1 : Math.max(0, 1 - validationResults.warnings.length * 0.15),
  };
  const weighted = Object.entries(weights).reduce((sum, [k, w]) => sum + (scores[k] * w), 0);
  const score = Math.round(weighted * 100) / 100;
  const grade = score >= 0.9 ? 'A' : score >= 0.75 ? 'B' : score >= 0.6 ? 'C' : 'D';
  return { score, grade, breakdown: scores };
}

function generateExplainability(po, validationResults, confidence) {
  return {
    poNumber: po.poNumber,
    summary: `PO from ${po.vendor.name} for $${po.totals.totalAmount}. Status: ${po.status}. Confidence: ${confidence.grade} (${confidence.score}).`,
    dataLineage: { source: po.audit.createdBy, createdAt: po.audit.createdAt, sourceHash: po.audit.sourceHash },
    validationTrace: validationResults.gates.map(g => ({ gate: g.gate, passed: g.passed, issues: [...g.errors, ...g.warnings] })),
  };
}

module.exports = { computeConfidenceScore, generateExplainability };
