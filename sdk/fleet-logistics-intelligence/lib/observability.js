/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence Scoring & Explainability                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function computeConfidenceScore(shipment, validationResults) {
  const weights = { schema: 0.25, route: 0.20, costs: 0.20, timeline: 0.20, noWarnings: 0.15 };
  const scores = {
    schema: validationResults.gates[0].passed ? 1 : 0,
    route: validationResults.gates[1].passed ? 1 : 0.5,
    costs: validationResults.gates[2].passed ? 1 : 0,
    timeline: shipment.timeline.length > 0 ? 1 : 0.5,
    noWarnings: validationResults.warnings.length === 0 ? 1 : Math.max(0, 1 - validationResults.warnings.length * 0.1),
  };
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + (scores[key] * weight), 0);
  const score = Math.round(weighted * 100) / 100;
  const grade = score >= 0.9 ? 'A' : score >= 0.75 ? 'B' : score >= 0.6 ? 'C' : 'D';
  return { score, grade, breakdown: scores, weights };
}

function generateExplainability(shipment, validationResults, confidence) {
  return {
    shipmentId: shipment.shipmentId,
    summary: `Shipment from ${shipment.route.origin.name} to ${shipment.route.destination.name}. ` +
      `Status: ${shipment.status}. Confidence: ${confidence.grade} (${confidence.score}). ` +
      `${validationResults.warnings.length} warnings.`,
    dataLineage: { source: shipment.audit.createdBy, createdAt: shipment.audit.createdAt, sourceHash: shipment.audit.sourceHash },
    validationTrace: validationResults.gates.map(g => ({ gate: g.gate, passed: g.passed, issues: [...g.errors, ...g.warnings] })),
  };
}

module.exports = { computeConfidenceScore, generateExplainability };
