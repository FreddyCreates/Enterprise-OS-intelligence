/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every billed amount is fully traceable.                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for an invoice (0.0 - 1.0).
 * Based on data completeness, validation results, and source quality.
 */
function computeConfidenceScore(invoice, validationResults) {
  const weights = {
    dataCompleteness: 0.30,
    hoursVerified: 0.25,
    totalVerified: 0.25,
    noAnomalies: 0.10,
    sourceQuality: 0.10,
  };

  const scores = {};

  // Data completeness (0-1)
  let filled = 0;
  let total = 0;
  const checkField = (val) => { total++; if (val && val !== '' && val !== 0) filled++; };
  checkField(invoice.invoiceId);
  checkField(invoice.client.name);
  checkField(invoice.project.name);
  checkField(invoice.project.servicePeriodStart);
  checkField(invoice.project.servicePeriodEnd);
  checkField(invoice.rates.hourlyRate);
  checkField(invoice.terms.invoiceDate);
  checkField(invoice.terms.paymentTerms);
  checkField(invoice.totals.totalDue);
  checkField(invoice.laborLogs && invoice.laborLogs.length > 0);
  scores.dataCompleteness = total > 0 ? filled / total : 0;

  // Hours verified
  if (validationResults) {
    const hoursGate = validationResults.gates.find(g => g.name === 'hours_consistency');
    scores.hoursVerified = hoursGate && hoursGate.passed ? 1.0 : 0.0;
  } else {
    scores.hoursVerified = 0.5; // Unknown
  }

  // Total verified
  if (validationResults) {
    const totalGate = validationResults.gates.find(g => g.name === 'total_accuracy');
    scores.totalVerified = totalGate && totalGate.passed ? 1.0 : 0.0;
  } else {
    scores.totalVerified = 0.5;
  }

  // No anomalies
  if (validationResults) {
    const anomalyGate = validationResults.gates.find(g => g.name === 'labor_anomalies');
    scores.noAnomalies = anomalyGate && anomalyGate.passed ? 1.0 : 0.3;
  } else {
    scores.noAnomalies = 0.5;
  }

  // Source quality (from audit)
  scores.sourceQuality = invoice.audit.confidence || 0.5;

  // Weighted sum
  let finalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    finalScore += (scores[key] || 0) * weight;
  }

  return {
    score: Math.round(finalScore * 1000) / 1000,
    breakdown: scores,
    weights,
    grade: finalScore >= 0.9 ? 'A' : finalScore >= 0.75 ? 'B' : finalScore >= 0.5 ? 'C' : 'D',
  };
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
  add(invoiceId, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      invoiceId,
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
  fromValidation(invoiceId, validationResults) {
    for (const gate of validationResults.gates) {
      for (const finding of gate.findings) {
        this.add(
          invoiceId,
          gate.name,
          finding.severity === 'error' ? 'high' : 'medium',
          finding.message,
          { gate: gate.name },
        );
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
   * Get exceptions by invoice.
   */
  getByInvoice(invoiceId) {
    return this.queue.filter(e => e.invoiceId === invoiceId);
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
    for (const e of this.queue) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }
    return { total: this.queue.length, byStatus, bySeverity };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINABILITY RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a complete explainability record for an invoice.
 * This is the "audit proof" that links every number to its source.
 */
function generateExplainability(invoice, validationResults, confidenceResult) {
  return {
    invoiceId: invoice.invoiceId,
    generatedAt: new Date().toISOString(),
    summary: {
      client: invoice.client.name,
      totalDue: invoice.totals.totalDue,
      confidence: confidenceResult ? confidenceResult.score : invoice.audit.confidence,
      grade: confidenceResult ? confidenceResult.grade : 'N/A',
      validationPassed: validationResults ? validationResults.passed : null,
    },
    dataLineage: {
      sourceHash: invoice.audit.sourceHash,
      createdBy: invoice.audit.createdBy,
      createdAt: invoice.audit.createdAt,
      lastModified: invoice.audit.modifiedAt || null,
    },
    calculationProof: {
      totalHours: invoice.totals.totalHours,
      rate: invoice.rates.hourlyRate,
      expectedProduct: Math.round(invoice.totals.totalHours * invoice.rates.hourlyRate * 100) / 100,
      statedSubtotal: invoice.totals.subtotal,
      taxRate: invoice.rates.taxRate,
      taxAmount: invoice.totals.taxAmount,
      totalDue: invoice.totals.totalDue,
      trace: invoice.totals.trace || [],
    },
    laborProof: invoice.laborLogs.map(log => ({
      date: log.date,
      dayOfWeek: log.dayOfWeek,
      entries: log.entries.length,
      totalHours: log.dayTotalHours,
      workers: log.entries.map(e => ({ name: e.worker, count: e.count, hours: e.hours })),
    })),
    validationGates: validationResults ? validationResults.gates.map(g => ({
      name: g.name,
      passed: g.passed,
      issues: g.findings.length,
    })) : [],
    warnings: invoice.audit.warnings || [],
  };
}

module.exports = {
  computeConfidenceScore,
  ExceptionQueue,
  generateExplainability,
};
