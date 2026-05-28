'use strict';

function computeConfidenceScore(record, validationResults) {
  const weights = { schema: 0.25, timesheet: 0.25, schedule: 0.20, costs: 0.15, noWarnings: 0.15 };
  const scores = {
    schema: validationResults.gates[0].passed ? 1 : 0,
    timesheet: validationResults.gates[1].passed ? 1 : 0,
    schedule: record.schedule.shifts.length > 0 ? 1 : 0.5,
    costs: record.costs.hourlyRate > 0 ? 1 : 0.5,
    noWarnings: validationResults.warnings.length === 0 ? 1 : Math.max(0, 1 - validationResults.warnings.length * 0.1),
  };
  const weighted = Object.entries(weights).reduce((sum, [k, w]) => sum + (scores[k] * w), 0);
  const score = Math.round(weighted * 100) / 100;
  const grade = score >= 0.9 ? 'A' : score >= 0.75 ? 'B' : score >= 0.6 ? 'C' : 'D';
  return { score, grade, breakdown: scores };
}

function generateExplainability(record, validationResults, confidence) {
  return {
    workerId: record.workerId,
    summary: `${record.worker.name} in ${record.worker.department}. ${record.timesheet.totalHours}h logged. Confidence: ${confidence.grade}.`,
    dataLineage: { source: record.audit.createdBy, createdAt: record.audit.createdAt, sourceHash: record.audit.sourceHash },
    validationTrace: validationResults.gates.map(g => ({ gate: g.gate, passed: g.passed, issues: [...g.errors, ...g.warnings] })),
  };
}

module.exports = { computeConfidenceScore, generateExplainability };
