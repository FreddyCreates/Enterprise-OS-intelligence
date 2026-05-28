/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every shipment and logistics decision is fully traceable.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for a shipment record (0.0 - 1.0).
 * Based on data completeness, route validation, cost accuracy, and timeline quality.
 */
function computeConfidenceScore(shipment, validationResults) {
  const weights = {
    schemaComplete: 0.20,
    routeValid: 0.20,
    costsVerified: 0.20,
    timelinePresent: 0.15,
    cargoDocumented: 0.10,
    noWarnings: 0.15,
  };

  const scores = {};

  // Schema completeness
  scores.schemaComplete = validationResults.gates[0].passed ? 1 : 0;

  // Route validity
  scores.routeValid = validationResults.gates[1].passed ? 1 : 0;
  if (shipment.route.distanceMiles > 0 && shipment.route.estimatedHours > 0) {
    scores.routeValid = Math.min(1, scores.routeValid + 0.5);
  }

  // Cost verification
  scores.costsVerified = validationResults.gates[2].passed ? 1 : 0;
  if (shipment.costs && shipment.costs.totalCost > 0) {
    scores.costsVerified = Math.min(1, scores.costsVerified + 0.3);
  }

  // Timeline presence and quality
  if (shipment.timeline.length >= 3) {
    scores.timelinePresent = 1.0;
  } else if (shipment.timeline.length > 0) {
    scores.timelinePresent = 0.5 + (shipment.timeline.length * 0.15);
  } else {
    scores.timelinePresent = 0.3;
  }

  // Cargo documentation
  scores.cargoDocumented = 1.0;
  if (!shipment.cargo.weight || shipment.cargo.weight <= 0) scores.cargoDocumented -= 0.3;
  if (!shipment.cargo.pieces || shipment.cargo.pieces <= 0) scores.cargoDocumented -= 0.2;
  if (!shipment.cargo.type) scores.cargoDocumented -= 0.2;
  if (!shipment.cargo.description) scores.cargoDocumented -= 0.3;
  scores.cargoDocumented = Math.max(0, scores.cargoDocumented);

  // Warning penalty
  scores.noWarnings = validationResults.warnings.length === 0
    ? 1.0
    : Math.max(0, 1 - validationResults.warnings.length * 0.1);

  // Weighted sum
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + ((scores[key] || 0) * weight), 0);
  const score = Math.round(weighted * 1000) / 1000;

  let grade;
  if (score >= 0.9) grade = 'A';
  else if (score >= 0.75) grade = 'B';
  else if (score >= 0.6) grade = 'C';
  else grade = 'D';

  return { score, grade, breakdown: scores, weights };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEPTION QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

class ExceptionQueue {
  constructor() {
    this.queue = [];
  }

  /**
   * Add an exception that requires human review.
   */
  add(shipmentId, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      shipmentId,
      type,
      severity, // critical | high | medium | low
      message,
      context,
      status: 'open', // open | acknowledged | resolved | dismissed
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    });
  }

  /**
   * Auto-populate exceptions from validation results.
   */
  fromValidation(shipmentId, validationResults) {
    for (const gate of validationResults.gates) {
      for (const error of gate.errors) {
        this.add(shipmentId, gate.gate, 'high', error, { gate: gate.gate });
      }
      for (const warning of gate.warnings) {
        this.add(shipmentId, gate.gate, 'medium', warning, { gate: gate.gate });
      }
    }
  }

  /**
   * Get all open exceptions.
   */
  getOpen() {
    return this.queue.filter(e => e.status === 'open');
  }

  /**
   * Get exceptions by shipment.
   */
  getByShipment(shipmentId) {
    return this.queue.filter(e => e.shipmentId === shipmentId);
  }

  /**
   * Get exceptions by severity.
   */
  getBySeverity(severity) {
    return this.queue.filter(e => e.severity === severity && e.status === 'open');
  }

  /**
   * Acknowledge an exception (being reviewed).
   */
  acknowledge(exceptionId, acknowledgedBy) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'acknowledged';
      exc.acknowledgedBy = acknowledgedBy;
      exc.acknowledgedAt = new Date().toISOString();
    }
    return exc;
  }

  /**
   * Resolve an exception.
   */
  resolve(exceptionId, resolvedBy, resolution) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'resolved';
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = resolvedBy;
      exc.resolution = resolution;
    }
    return exc;
  }

  /**
   * Dismiss (false positive).
   */
  dismiss(exceptionId, dismissedBy, reason) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'dismissed';
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = dismissedBy;
      exc.resolution = `Dismissed: ${reason}`;
    }
    return exc;
  }

  /**
   * Summary stats.
   */
  stats() {
    const byStatus = {};
    const bySeverity = {};
    const byType = {};
    for (const e of this.queue) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    return { total: this.queue.length, byStatus, bySeverity, byType };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINABILITY RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a complete explainability record for a shipment.
 * Links every data point to its source for full traceability.
 */
function generateExplainability(shipment, validationResults, confidenceResult) {
  return {
    shipmentId: shipment.shipmentId,
    generatedAt: new Date().toISOString(),
    summary: {
      carrier: shipment.carrier.name,
      origin: shipment.route.origin.name,
      destination: shipment.route.destination.name,
      distance: shipment.route.distanceMiles,
      status: shipment.status,
      totalCost: shipment.costs.totalCost,
      confidence: confidenceResult ? confidenceResult.score : null,
      grade: confidenceResult ? confidenceResult.grade : 'N/A',
      validationPassed: validationResults ? validationResults.passed : null,
    },
    dataLineage: {
      sourceHash: shipment.audit.sourceHash,
      createdBy: shipment.audit.createdBy,
      createdAt: shipment.audit.createdAt,
      lastModified: shipment.audit.modifiedAt || null,
    },
    routeProof: {
      origin: shipment.route.origin,
      destination: shipment.route.destination,
      distanceMiles: shipment.route.distanceMiles,
      estimatedHours: shipment.route.estimatedHours,
      waypoints: shipment.route.waypoints.length,
    },
    costProof: {
      lineHaul: shipment.costs.lineHaul || 0,
      fuelSurcharge: shipment.costs.fuelSurcharge || 0,
      accessorials: shipment.costs.accessorials || 0,
      totalCost: shipment.costs.totalCost,
      costPerMile: shipment.route.distanceMiles > 0
        ? Math.round((shipment.costs.totalCost / shipment.route.distanceMiles) * 100) / 100
        : 0,
    },
    timelineProof: shipment.timeline.map(event => ({
      timestamp: event.timestamp,
      event: event.event,
      location: event.location,
    })),
    validationGates: validationResults ? validationResults.gates.map(g => ({
      gate: g.gate,
      passed: g.passed,
      errors: g.errors.length,
      warnings: g.warnings.length,
    })) : [],
    warnings: validationResults ? validationResults.warnings : [],
  };
}

module.exports = {
  computeConfidenceScore,
  ExceptionQueue,
  generateExplainability,
};
