/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every purchase order and vendor decision is fully traceable.              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for a purchase order (0.0 - 1.0).
 */
function computeConfidenceScore(po, validationResults) {
  const weights = {
    schemaComplete: 0.20,
    totalsVerified: 0.25,
    approvalsPresent: 0.20,
    lineItemsValid: 0.20,
    noWarnings: 0.15,
  };

  const scores = {};

  // Schema completeness
  scores.schemaComplete = validationResults.gates[0].passed ? 1 : 0;

  // Totals verification
  scores.totalsVerified = validationResults.gates[1].passed ? 1 : 0;
  if (po.totals && po.totals.totalAmount > 0) {
    const lineSum = po.lineItems.reduce((s, li) => s + (li.lineTotal || 0), 0);
    if (Math.abs(lineSum - po.totals.subtotal) < 0.01) {
      scores.totalsVerified = Math.min(1, scores.totalsVerified + 0.3);
    }
  }

  // Approvals present
  scores.approvalsPresent = 1.0;
  if (po.approvals.length === 0) scores.approvalsPresent = 0.5;
  if (po.status === 'pending-approval') scores.approvalsPresent = 0.4;

  // Line items validity
  scores.lineItemsValid = 1.0;
  if (po.lineItems.length === 0) {
    scores.lineItemsValid = 0;
  } else {
    const invalidItems = po.lineItems.filter(li => !li.quantity || !li.unitPrice || li.quantity <= 0);
    scores.lineItemsValid = Math.max(0, 1 - (invalidItems.length / po.lineItems.length));
  }

  // Warning penalty
  scores.noWarnings = validationResults.warnings.length === 0
    ? 1.0
    : Math.max(0, 1 - validationResults.warnings.length * 0.15);

  // Weighted sum
  const weighted = Object.entries(weights).reduce((sum, [k, w]) => sum + ((scores[k] || 0) * w), 0);
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
  add(poNumber, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      poNumber,
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
  fromValidation(poNumber, validationResults) {
    for (const gate of validationResults.gates) {
      for (const error of gate.errors) {
        this.add(poNumber, gate.gate, 'high', error, { gate: gate.gate });
      }
      for (const warning of gate.warnings) {
        this.add(poNumber, gate.gate, 'medium', warning, { gate: gate.gate });
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
   * Get exceptions by PO number.
   */
  getByPO(poNumber) {
    return this.queue.filter(e => e.poNumber === poNumber);
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
 * Generate a complete explainability record for a purchase order.
 */
function generateExplainability(po, validationResults, confidenceResult) {
  return {
    poNumber: po.poNumber,
    generatedAt: new Date().toISOString(),
    summary: {
      vendor: po.vendor.name,
      buyer: po.buyer.name,
      department: po.buyer.department,
      totalAmount: po.totals.totalAmount,
      status: po.status,
      confidence: confidenceResult ? confidenceResult.score : null,
      grade: confidenceResult ? confidenceResult.grade : 'N/A',
      validationPassed: validationResults ? validationResults.passed : null,
    },
    dataLineage: {
      sourceHash: po.audit.sourceHash,
      createdBy: po.audit.createdBy,
      createdAt: po.audit.createdAt,
      lastModified: po.audit.modifiedAt || null,
    },
    calculationProof: {
      lineItems: po.lineItems.length,
      lineItemSubtotal: Math.round(po.lineItems.reduce((s, li) => s + (li.lineTotal || 0), 0) * 100) / 100,
      statedSubtotal: po.totals.subtotal,
      tax: po.totals.tax,
      shipping: po.totals.shipping || 0,
      totalAmount: po.totals.totalAmount,
    },
    approvalChain: po.approvals.map(a => ({
      approver: a.approver,
      role: a.role,
      status: a.status,
      timestamp: a.timestamp,
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
