/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence Scoring & Explainability                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function computeConfidenceScore(record, validationResults) {
  const weights = {
    schemaComplete: 0.25,
    levelsConsistent: 0.25,
    itemsValid: 0.20,
    hasMovementHistory: 0.15,
    noWarnings: 0.15,
  };

  const scores = {
    schemaComplete: validationResults.gates[0].passed ? 1 : 0,
    levelsConsistent: validationResults.gates[1].passed ? 1 : 0,
    itemsValid: validationResults.gates[2].passed ? 1 : 0,
    hasMovementHistory: record.movements.length > 0 ? 1 : 0.5,
    noWarnings: validationResults.warnings.length === 0 ? 1 : Math.max(0, 1 - validationResults.warnings.length * 0.1),
  };

  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + (scores[key] * weight), 0);
  const score = Math.round(weighted * 100) / 100;

  let grade;
  if (score >= 0.9) grade = 'A';
  else if (score >= 0.75) grade = 'B';
  else if (score >= 0.6) grade = 'C';
  else grade = 'D';

  return { score, grade, breakdown: scores, weights };
}

function generateExplainability(record, validationResults, confidence) {
  return {
    recordId: record.recordId,
    summary: `Inventory record for ${record.warehouse.name} with ${record.items.length} items. ` +
      `Confidence: ${confidence.grade} (${confidence.score}). ` +
      `Validation: ${validationResults.passed ? 'PASSED' : 'FAILED'} with ${validationResults.warnings.length} warnings.`,
    dataLineage: {
      source: record.audit.createdBy,
      createdAt: record.audit.createdAt,
      sourceHash: record.audit.sourceHash,
      version: record.version,
    },
    validationTrace: validationResults.gates.map(g => ({
      gate: g.gate,
      passed: g.passed,
      issues: [...g.errors, ...g.warnings],
    })),
    confidenceBreakdown: confidence.breakdown,
  };
}

module.exports = { computeConfidenceScore, generateExplainability };
