/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every inventory decision is fully traceable.                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for an inventory record (0.0 - 1.0).
 */
function computeConfidenceScore(record, validationResults) {
  const weights = {
    schemaComplete: 0.20,
    levelsConsistent: 0.25,
    itemsValid: 0.20,
    hasMovementHistory: 0.15,
    noWarnings: 0.20,
  };

  const scores = {};

  // Schema completeness
  scores.schemaComplete = validationResults.gates[0].passed ? 1 : 0;

  // Levels consistency
  scores.levelsConsistent = validationResults.gates[1].passed ? 1 : 0;
  if (record.levels.onHand >= 0 && record.levels.available >= 0) {
    scores.levelsConsistent = Math.min(1, scores.levelsConsistent + 0.3);
  }

  // Items validity
  scores.itemsValid = validationResults.gates[2].passed ? 1 : 0;
  if (record.items.length > 0) {
    const validItems = record.items.filter(i => i.sku && i.name && i.unitCost >= 0);
    scores.itemsValid = Math.min(1, scores.itemsValid + (validItems.length / record.items.length) * 0.3);
  }

  // Movement history
  if (record.movements.length >= 5) {
    scores.hasMovementHistory = 1.0;
  } else if (record.movements.length > 0) {
    scores.hasMovementHistory = 0.5 + (record.movements.length * 0.1);
  } else {
    scores.hasMovementHistory = 0.3;
  }

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
  add(recordId, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordId,
      type,
      severity,
      message,
      context,
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    });
  }

  /**
   * Auto-populate exceptions from validation results.
   */
  fromValidation(recordId, validationResults) {
    for (const gate of validationResults.gates) {
      for (const error of gate.errors) {
        this.add(recordId, gate.gate, 'high', error, { gate: gate.gate });
      }
      for (const warning of gate.warnings) {
        this.add(recordId, gate.gate, 'medium', warning, { gate: gate.gate });
      }
    }
  }

  /**
   * Add stock-level alerts as exceptions.
   */
  fromStockAlerts(recordId, record) {
    if (record.levels.available <= 0) {
      this.add(recordId, 'stockout', 'critical', `Zero available stock at ${record.warehouse.name}`, { warehouse: record.warehouse.code });
    }
    if (record.levels.available < 0) {
      this.add(recordId, 'negative_stock', 'critical', `Negative available stock: ${record.levels.available}`, { warehouse: record.warehouse.code });
    }
    if (record.levels.onHand > 0 && record.levels.allocated > record.levels.onHand) {
      this.add(recordId, 'over_allocated', 'high', `Allocated (${record.levels.allocated}) exceeds on-hand (${record.levels.onHand})`, { warehouse: record.warehouse.code });
    }
  }

  /**
   * Get all open exceptions.
   */
  getOpen() {
    return this.queue.filter(e => e.status === 'open');
  }

  /**
   * Get exceptions by record.
   */
  getByRecord(recordId) {
    return this.queue.filter(e => e.recordId === recordId);
  }

  /**
   * Get exceptions by severity.
   */
  getBySeverity(severity) {
    return this.queue.filter(e => e.severity === severity && e.status === 'open');
  }

  /**
   * Acknowledge an exception.
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
 * Generate a complete explainability record for an inventory record.
 */
function generateExplainability(record, validationResults, confidenceResult) {
  return {
    recordId: record.recordId,
    generatedAt: new Date().toISOString(),
    summary: {
      warehouse: record.warehouse.name,
      zone: record.warehouse.zone || 'General',
      itemCount: record.items.length,
      onHand: record.levels.onHand,
      available: record.levels.available,
      status: record.status,
      confidence: confidenceResult ? confidenceResult.score : null,
      grade: confidenceResult ? confidenceResult.grade : 'N/A',
      validationPassed: validationResults ? validationResults.passed : null,
    },
    dataLineage: {
      sourceHash: record.audit.sourceHash,
      createdBy: record.audit.createdBy,
      createdAt: record.audit.createdAt,
      lastModified: record.audit.modifiedAt || null,
      version: record.version || 1,
    },
    levelsProof: {
      onHand: record.levels.onHand,
      allocated: record.levels.allocated,
      available: record.levels.available,
      inTransit: record.levels.inTransit,
      backOrdered: record.levels.backOrdered,
      computedAvailable: record.levels.onHand - record.levels.allocated,
      consistent: (record.levels.onHand - record.levels.allocated) === record.levels.available,
    },
    movementProof: {
      totalMovements: record.movements.length,
      recentMovements: record.movements.slice(-5).map(m => ({
        type: m.type,
        sku: m.sku,
        quantity: m.quantity,
        timestamp: m.timestamp,
      })),
    },
    validationGates: validationResults ? validationResults.gates.map(g => ({
      gate: g.gate,
      passed: g.passed,
      errors: g.errors.length,
      warnings: g.warnings.length,
    })) : [],
    confidenceBreakdown: confidenceResult ? confidenceResult.breakdown : {},
    warnings: validationResults ? validationResults.warnings : [],
  };
}

module.exports = {
  computeConfidenceScore,
  ExceptionQueue,
  generateExplainability,
};
